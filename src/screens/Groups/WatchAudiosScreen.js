import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
  Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import Toast from 'react-native-toast-message';
import colors from '../../constants/colors';
import { ArrowBackIcon } from '../../components/CustomIcons';
import API_CONFIG from '../../config/api';
import apiService from '../../services/apiService';
import deviceService from '../../services/deviceService';

/** Campos alternativos (Thalamus / API); o backend normaliza, mas toleramos extras no JSON. */
function getWatchAudioPlayRefs(item) {
  if (!item || typeof item !== 'object') {
    return { stream_path: null, playback_url: null, audio_id: null };
  }
  const audio_id =
    item.audio_id != null && String(item.audio_id).trim() !== ''
      ? String(item.audio_id).trim()
      : item.audioId != null && String(item.audioId).trim() !== ''
        ? String(item.audioId).trim()
        : item.id != null && String(item.id).trim() !== ''
          ? String(item.id).trim()
          : null;

  const stream_path =
    item.stream_path ||
    item.streamPath ||
    (typeof item.storage_path === 'string' ? item.storage_path : null) ||
    (typeof item.storagePath === 'string' ? item.storagePath : null) ||
    (typeof item.key === 'string' && !/^https?:\/\//i.test(item.key) ? item.key : null) ||
    (typeof item.path === 'string' && !/^https?:\/\//i.test(item.path) ? item.path : null);

  const playback_url =
    item.playback_url ||
    item.playbackUrl ||
    item.media_url ||
    item.mediaUrl ||
    item.url ||
    item.audioUrl ||
    item.audio_url ||
    item.fileUrl ||
    item.file_url ||
    item.downloadUrl ||
    item.download_url ||
    item.src ||
    (typeof item.path === 'string' && /^https?:\/\//i.test(item.path) ? item.path : null);

  return { stream_path, playback_url, audio_id };
}

/** Reprodução via proxy Laravel (Thalamus exige Bearer próprio; expo-av não envia token da Thalamus). */
function resolveStreamUri(item, groupId) {
  const base = API_CONFIG.BASE_URL.replace(/\/+$/, '');
  const { stream_path, playback_url, audio_id } = getWatchAudioPlayRefs(item);
  if (audio_id) {
    return `${base}/groups/${groupId}/smartwatch-audios/stream?audio_id=${encodeURIComponent(audio_id)}`;
  }
  if (stream_path) {
    return `${base}/groups/${groupId}/smartwatch-audios/stream?path=${encodeURIComponent(stream_path)}`;
  }
  if (playback_url) {
    return `${base}/groups/${groupId}/smartwatch-audios/stream?src=${encodeURIComponent(playback_url)}`;
  }
  return null;
}

/**
 * Extensão e hint Android a partir do Content-Type.
 * Antes forçávamos sempre .amr — se a Thalamus enviar MP3/AAC, o MediaPlayer falhava em silêncio.
 */
function audioFormatFromMimeType(mimeRaw) {
  const mime = (mimeRaw || '').split(';')[0].trim().toLowerCase();
  if (!mime || mime === 'application/octet-stream') {
    return { ext: 'amr', androidOverride: 'amr' };
  }
  if (mime.includes('amr') || mime === 'audio/3gpp') {
    return { ext: 'amr', androidOverride: 'amr' };
  }
  if (mime.includes('mpeg') || mime === 'audio/mp3') {
    return { ext: 'mp3', androidOverride: 'mp3' };
  }
  if (mime.includes('mp4') || mime.includes('m4a') || mime.includes('aac')) {
    return { ext: 'm4a', androidOverride: 'm4a' };
  }
  if (mime.includes('wav')) {
    return { ext: 'wav', androidOverride: 'wav' };
  }
  if (mime.includes('ogg')) {
    return { ext: 'ogg', androidOverride: 'ogg' };
  }
  return { ext: 'amr', androidOverride: 'amr' };
}

function isLikelyErrorDocumentMime(mime) {
  const m = (mime || '').toLowerCase();
  // Não incluir text/* — APIs costumam errar o Content-Type em binários.
  return m.includes('json') || m.includes('html');
}

/** Primeiros bytes (Base64 partial read do expo-file-system). */
function base64HeadToUint8(b64, maxBytes = 16) {
  if (!b64 || typeof atob !== 'function') return new Uint8Array(0);
  try {
    const bin = atob(b64);
    const out = new Uint8Array(Math.min(maxBytes, bin.length));
    for (let i = 0; i < out.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    return new Uint8Array(0);
  }
}

function audioExtFromMagic(u8) {
  if (u8.length < 3) return null;
  if (u8[0] === 0x23 && u8[1] === 0x21 && u8[2] === 0x41) {
    if (u8.length >= 5 && u8[3] === 0x4d && u8[4] === 0x52) return { ext: 'amr', androidOverride: 'amr' };
  }
  if (u8[0] === 0x49 && u8[1] === 0x44 && u8[2] === 0x33) return { ext: 'mp3', androidOverride: 'mp3' };
  if (u8[0] === 0xff && (u8[1] & 0xe0) === 0xe0) return { ext: 'mp3', androidOverride: 'mp3' };
  if (u8.length >= 8 && u8[4] === 0x66 && u8[5] === 0x74 && u8[6] === 0x79 && u8[7] === 0x70) {
    return { ext: 'm4a', androidOverride: 'm4a' };
  }
  if (u8[0] === 0x52 && u8[1] === 0x49 && u8[2] === 0x46 && u8[8] === 0x57 && u8[9] === 0x41 && u8[10] === 0x56) {
    return { ext: 'wav', androidOverride: 'wav' };
  }
  return null;
}

function uint8ArrayToBase64(u8) {
  const chunk = 8192;
  let binary = '';
  for (let i = 0; i < u8.length; i += chunk) {
    const sub = u8.subarray(i, Math.min(i + chunk, u8.length));
    binary += String.fromCharCode.apply(null, sub);
  }
  if (typeof btoa === 'function') {
    return btoa(binary);
  }
  throw new Error('btoa indisponível para gravar o áudio em cache');
}

/** Corpo JSON do proxy Laravel (502) — mostra detalhe da Thalamus no alerta. */
function formatLaravelStreamError(status, bodyText) {
  let msg = `Stream HTTP ${status}`;
  if (!bodyText || typeof bodyText !== 'string') return msg;
  const trimmed = bodyText.trim();
  if (!trimmed) return msg;
  try {
    const j = JSON.parse(trimmed);
    if (j.thalamus_status != null && j.thalamus_status !== '') {
      msg += ` · Thalamus HTTP ${j.thalamus_status}`;
    }
    if (j.detail != null && String(j.detail).trim()) {
      msg += `\n${String(j.detail).trim().slice(0, 1200)}`;
    } else if (j.message != null && String(j.message).trim()) {
      msg += `\n${String(j.message).trim().slice(0, 800)}`;
    }
    return msg;
  } catch {
    if (trimmed.length <= 2000) {
      msg += `\n${trimmed.slice(0, 1000)}`;
    }
    return msg;
  }
}

/**
 * Baixa o stream Laravel (Bearer) para ficheiro local com extensão correta.
 * Usa downloadAsync e, se falhar, fetch + escrita base64.
 */
async function cacheAuthenticatedAudioStream(uri, authHeaders, basePathNoExt) {
  const partPath = `${basePathNoExt}.part`;
  await FileSystem.deleteAsync(partPath, { idempotent: true }).catch(() => {});

  const finalizeFromTemp = async (tempPath, contentTypeHeader) => {
    const info = await FileSystem.getInfoAsync(tempPath);
    if (!info.exists || !info.size || info.size < 16) {
      await FileSystem.deleteAsync(tempPath, { idempotent: true }).catch(() => {});
      throw new Error('Áudio vazio ou incompleto (ficheiro demasiado pequeno).');
    }

    let ct = contentTypeHeader || '';
    if (isLikelyErrorDocumentMime(ct) && info.size >= 32) {
      let headB64 = '';
      try {
        headB64 = await FileSystem.readAsStringAsync(tempPath, {
          encoding: FileSystem.EncodingType.Base64,
          length: 48,
        });
      } catch {
        headB64 = '';
      }
      const headBytes = base64HeadToUint8(headB64, 12);
      const magicFmt = audioExtFromMagic(headBytes);
      if (magicFmt) {
        ct = 'application/octet-stream';
      } else {
        const probe = String.fromCharCode(headBytes[0] ?? 0, headBytes[1] ?? 0, headBytes[2] ?? 0);
        if (
          headBytes.length > 0 &&
          headBytes[0] !== 0x7b &&
          headBytes[0] !== 0x3c &&
          !probe.trimStart().startsWith('{')
        ) {
          ct = 'application/octet-stream';
        } else {
          await FileSystem.deleteAsync(tempPath, { idempotent: true }).catch(() => {});
          throw new Error('O servidor devolveu JSON/HTML em vez de áudio (token, audio_id ou URL inválidos).');
        }
      }
    } else if (isLikelyErrorDocumentMime(ct)) {
      await FileSystem.deleteAsync(tempPath, { idempotent: true }).catch(() => {});
      throw new Error('Resposta não é áudio (JSON/HTML). Verifique login ou URL.');
    }

    let { ext, androidOverride } = audioFormatFromMimeType(ct);
    try {
      const headB64 = await FileSystem.readAsStringAsync(tempPath, {
        encoding: FileSystem.EncodingType.Base64,
        length: 48,
      });
      const magicFmt = audioExtFromMagic(base64HeadToUint8(headB64, 12));
      if (magicFmt) {
        ({ ext, androidOverride } = magicFmt);
      }
    } catch {
      /* mantém MIME */
    }

    const finalPath = `${basePathNoExt}.${ext}`;
    await FileSystem.deleteAsync(finalPath, { idempotent: true }).catch(() => {});
    try {
      await FileSystem.moveAsync({ from: tempPath, to: finalPath });
    } catch {
      await FileSystem.copyAsync({ from: tempPath, to: finalPath });
      await FileSystem.deleteAsync(tempPath, { idempotent: true }).catch(() => {});
    }
    return { localUri: finalPath, androidOverride };
  };

  let downloaded = null;
  try {
    downloaded = await FileSystem.downloadAsync(uri, partPath, { headers: authHeaders });
  } catch (err) {
    console.warn('WatchAudios: downloadAsync (rede)', err?.message || err);
    downloaded = null;
  }

  if (downloaded != null && downloaded.status >= 200 && downloaded.status < 300) {
    const hdr = downloaded.headers || {};
    const ct =
      (downloaded.mimeType && String(downloaded.mimeType).trim()) ||
      hdr['Content-Type'] ||
      hdr['content-type'] ||
      '';
    return finalizeFromTemp(partPath, ct);
  }

  if (downloaded != null && downloaded.status != null) {
    let errTxt = '';
    try {
      errTxt = await FileSystem.readAsStringAsync(partPath, { encoding: FileSystem.EncodingType.UTF8 });
    } catch {
      errTxt = '';
    }
    await FileSystem.deleteAsync(partPath, { idempotent: true }).catch(() => {});
    throw new Error(formatLaravelStreamError(downloaded.status, errTxt));
  }

  const res = await fetch(uri, { headers: authHeaders });
  const ct = res.headers.get('content-type') || '';
  if (!res.ok) {
    let detail = '';
    try {
      detail = await res.text();
    } catch {
      /* ignore */
    }
    throw new Error(formatLaravelStreamError(res.status, detail));
  }
  const buf = await res.arrayBuffer();
  const u8 = new Uint8Array(buf);
  if (u8.length < 16) {
    throw new Error('Resposta de áudio vazia.');
  }
  const asText = String.fromCharCode.apply(null, u8.subarray(0, Math.min(120, u8.length)));
  if (asText.trimStart().startsWith('{') || asText.trimStart().startsWith('<')) {
    throw new Error('Corpo não é áudio (JSON ou HTML).');
  }
  const b64 = uint8ArrayToBase64(u8);
  await FileSystem.writeAsStringAsync(partPath, b64, { encoding: FileSystem.EncodingType.Base64 });
  return finalizeFromTemp(partPath, ct);
}

/** Gravação: AMR no Android; AAC/m4a no iOS. Literais = enums expo-av (evita undefined no Expo Go / runtime not ready). */
const WATCH_AUDIO_RECORDING_OPTIONS = {
  isMeteringEnabled: false,
  android: {
    extension: '.amr',
    outputFormat: 3,
    audioEncoder: 1,
    sampleRate: 8000,
    numberOfChannels: 1,
    bitRate: 4750,
  },
  ios: {
    extension: '.m4a',
    outputFormat: 'aac ',
    audioQuality: 64,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 128000,
  },
};

const MIN_RECORDING_MS = 400;

function formatDirection(direction) {
  if (direction == null || direction === '') return '';
  const d = String(direction).toLowerCase();
  if (d.includes('in') || d.includes('recv') || d.includes('from_device')) {
    return 'Do relógio';
  }
  if (d.includes('out') || d.includes('send') || d.includes('to_device')) {
    return 'Para o relógio';
  }
  return String(direction);
}

function formatDate(iso) {
  if (iso == null || iso === '') return '—';
  const m = moment(iso);
  return m.isValid() ? m.format('DD/MM/YYYY HH:mm') : String(iso);
}

const WatchAudiosScreen = ({ route, navigation }) => {
  const { groupId, groupName } = route.params || {};
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ imei: null, hasSmartwatch: false, message: '' });
  const [playingId, setPlayingId] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const soundRef = useRef(null);
  const recordingRef = useRef(null);
  const creatingRecordingRef = useRef(false);
  const pendingCancelRef = useRef(false);
  const recordStartMsRef = useRef(null);
  /** Serializa descartes nativos para não chamar `createAsync` enquanto o recorder anterior ainda existe. */
  const recordingUnloadChainRef = useRef(Promise.resolve());

  const chainRecordingUnload = useCallback((work) => {
    const run = recordingUnloadChainRef.current.then(() => work());
    recordingUnloadChainRef.current = run.catch(() => {});
    return run;
  }, []);

  const stopPlayback = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch (e) {
      console.warn('stopPlayback', e);
    }
    setPlayingId(null);
  }, []);

  useEffect(() => {
    return () => {
      stopPlayback();
      const rec = recordingRef.current;
      if (rec) {
        rec.stopAndUnloadAsync().catch(() => {});
        recordingRef.current = null;
      }
    };
  }, [stopPlayback]);

  const load = useCallback(async () => {
    const res = await deviceService.getGroupSmartwatchAudios(groupId, 20);
    if (res.success && res.data) {
      setMeta({
        hasSmartwatch: !!res.data.has_smartwatch,
        imei: res.data.imei || null,
        message: res.data.message || '',
      });
      setItems(Array.isArray(res.data.items) ? res.data.items : []);
    } else {
      setMeta({ hasSmartwatch: false, imei: null, message: res.error || '' });
      setItems([]);
    }
  }, [groupId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await load();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await stopPlayback();
    await load();
    setRefreshing(false);
  }, [load, stopPlayback]);

  const playItem = async (item) => {
    const uri = resolveStreamUri(item, groupId);
    if (!uri) {
      Alert.alert('Áudio', 'URL de reprodução não disponível para este item.');
      return;
    }

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
    } catch (e) {
      console.warn('setAudioModeAsync', e);
    }

    const playKey = item.id ?? uri;

    if (playingId === playKey && soundRef.current) {
      await stopPlayback();
      return;
    }

    await stopPlayback();

    try {
      const token = await apiService.getToken();
      const downloadHeaders = {
        Accept: 'audio/*,*/*;q=0.9,application/octet-stream;q=0.8',
      };
      if (token) {
        downloadHeaders.Authorization = `Bearer ${token}`;
      }

      let source;
      const cacheDir = FileSystem.cacheDirectory;
      if (cacheDir) {
        const safeKey =
          String(playKey)
            .replace(/[^a-zA-Z0-9_-]+/g, '_')
            .replace(/_+/g, '_')
            .slice(0, 96) || 'clip';
        const baseNoExt = `${cacheDir}sw-audio-${groupId}-${safeKey}`;
        const { localUri, androidOverride } = await cacheAuthenticatedAudioStream(
          uri,
          downloadHeaders,
          baseNoExt,
        );
        source = { uri: localUri };
        if (Platform.OS === 'android' && androidOverride) {
          source.overrideFileExtensionAndroid = androidOverride;
        }
      } else {
        source = { uri };
        if (token) {
          source.headers = { Authorization: `Bearer ${token}` };
        }
        if (Platform.OS === 'android') {
          source.overrideFileExtensionAndroid = 'amr';
        }
      }

      // downloadFirst só aplica a assets Expo; usar false evita caminhos estranhos com file://
      let sound = null;
      try {
        const created = await Audio.Sound.createAsync(source, { shouldPlay: true }, null, false);
        sound = created.sound;
      } catch (loadErr) {
        if (
          Platform.OS === 'android' &&
          source?.uri &&
          String(source.uri).startsWith('file') &&
          source?.overrideFileExtensionAndroid === 'amr'
        ) {
          const created = await Audio.Sound.createAsync(
            { uri: source.uri, overrideFileExtensionAndroid: 'amr' },
            { shouldPlay: true, androidImplementation: 'MediaPlayer' },
            null,
            false,
          );
          sound = created.sound;
        } else {
          throw loadErr;
        }
      }
      soundRef.current = sound;
      setPlayingId(playKey);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          stopPlayback();
        }
      });
    } catch (e) {
      console.error('Erro ao reproduzir áudio', e);
      const detail =
        e?.message ||
        (typeof e === 'string' ? e : null) ||
        'Erro desconhecido. Verifique a conexão e o login.';
      const readable =
        detail.length > 420 ? `${detail.slice(0, 420)}…` : detail;
      Alert.alert(
        'Erro ao reproduzir',
        readable +
          (Platform.OS === 'ios' && readable.toLowerCase().includes('amr')
            ? '\n\nNota: o iPhone costuma não suportar AMR; pode ser necessário outro formato no servidor.'
            : ''),
      );
      Toast.show({ type: 'error', text1: 'Áudio', text2: readable.slice(0, 200) });
      setPlayingId(null);
    }
  };

  const finalizeRecordingAndSend = async (recording) => {
    let uri = null;
    try {
      await recording.stopAndUnloadAsync();
      uri = recording.getURI();
    } catch (e) {
      console.warn('stopAndUnloadAsync', e);
      Toast.show({ type: 'error', text1: 'Gravação', text2: 'Não foi possível finalizar o áudio.' });
      return;
    }

    if (!uri) {
      Toast.show({ type: 'error', text1: 'Gravação', text2: 'Arquivo de áudio vazio.' });
      return;
    }

    const isAndroid = Platform.OS === 'android';
    const filePart = {
      uri,
      name: isAndroid ? 'gravacao.amr' : 'gravacao.m4a',
      type: isAndroid ? 'audio/amr' : 'audio/mp4',
    };

    setIsSending(true);
    try {
      const res = await deviceService.sendGroupSmartwatchAudio(groupId, filePart);
      if (res.success) {
        Toast.show({ type: 'success', text1: 'Áudio enviado', text2: 'Mensagem enviada ao relógio.' });
        await load();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Envio falhou',
          text2: res.error || 'Não foi possível enviar o áudio.',
        });
      }
    } finally {
      setIsSending(false);
    }
  };

  const onMicPressIn = async () => {
    if (!groupId || !meta.hasSmartwatch || isSending) return;

    await recordingUnloadChainRef.current;

    pendingCancelRef.current = false;
    creatingRecordingRef.current = true;

    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Microfone', 'Permissão necessária para gravar o áudio.');
        return;
      }

      await stopPlayback();

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { recording } = await Audio.Recording.createAsync(WATCH_AUDIO_RECORDING_OPTIONS);

      if (pendingCancelRef.current) {
        await chainRecordingUnload(() => recording.stopAndUnloadAsync());
        return;
      }

      recordingRef.current = recording;
      recordStartMsRef.current = Date.now();
      setIsRecording(true);
    } catch (e) {
      console.error('Gravação', e);
      Alert.alert('Gravação', e?.message || 'Não foi possível iniciar a gravação.');
    } finally {
      creatingRecordingRef.current = false;
    }
  };

  const onMicPressOut = async () => {
    if (creatingRecordingRef.current) {
      pendingCancelRef.current = true;
      return;
    }

    const rec = recordingRef.current;
    recordingRef.current = null;
    setIsRecording(false);

    if (!rec) return;

    const started = recordStartMsRef.current;
    recordStartMsRef.current = null;
    const elapsed = started ? Date.now() - started : 0;
    if (elapsed < MIN_RECORDING_MS) {
      await chainRecordingUnload(async () => {
        try {
          await rec.stopAndUnloadAsync();
        } catch (e) {
          console.warn('cancel short recording', e);
        }
      });
      Toast.show({ type: 'info', text1: 'Muito curto', text2: 'Segure um pouco mais para gravar.' });
      return;
    }

    await chainRecordingUnload(() => finalizeRecordingAndSend(rec));
  };

  const renderItem = ({ item }) => {
    const playUri = resolveStreamUri(item, groupId);
    const key = item.id != null && item.id !== '' ? item.id : playUri ?? String(item.created_at ?? '');
    const canPlay = !!playUri;
    const isPlaying = playingId === key;

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.cardInfo}>
            <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
            <Text style={styles.cardDirection}>{formatDirection(item.direction)}</Text>
            {item.label ? <Text style={styles.cardLabel}>{item.label}</Text> : null}
          </View>
          <TouchableOpacity
            style={[styles.playBtn, !canPlay && styles.playBtnDisabled]}
            onPress={() => playItem({ ...item, id: key })}
            disabled={!canPlay}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={26}
              color={canPlay ? colors.white : colors.gray400}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar style="dark" />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowBackIcon size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.title}>Áudios do relógio</Text>
          <Text style={styles.subtitle}>{groupName}</Text>
          {meta.imei ? (
            <Text style={styles.meta}>IMEI {meta.imei}</Text>
          ) : (
            <Text style={styles.metaMuted}>{meta.message || 'Sem relógio vinculado'}</Text>
          )}
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.body}>
        {!meta.hasSmartwatch ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="mic-off-outline" size={56} color={colors.gray300} />
            <Text style={styles.emptyTitle}>Nenhum relógio com IMEI</Text>
            <Text style={styles.emptyText}>
              Cadastre um smartwatch no grupo para listar os áudios da API Thalamus.
            </Text>
          </View>
        ) : (
          <>
            <FlatList
              data={items}
              keyExtractor={(item, index) => String(item.id ?? item.playback_url ?? item.stream_path ?? index)}
              renderItem={renderItem}
              contentContainerStyle={[
                items.length === 0 ? styles.emptyList : styles.list,
                { paddingBottom: insets.bottom + 110 },
              ]}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
              }
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <Ionicons name="volume-high-outline" size={48} color={colors.gray300} />
                  <Text style={styles.emptyTitle}>Nenhum áudio</Text>
                  <Text style={styles.emptyText}>Puxe para atualizar ou aguarde novos envios.</Text>
                </View>
              }
            />

            <View style={[styles.fabContainer, { bottom: Math.max(insets.bottom, 12) + 8 }]} pointerEvents="box-none">
              <Text style={styles.fabHint}>{isRecording ? 'Solte para enviar' : 'Segure para falar'}</Text>
              <Pressable
                style={({ pressed }) => [
                  styles.fab,
                  isRecording && styles.fabRecording,
                  (isSending || pressed) && styles.fabDisabled,
                ]}
                onPressIn={onMicPressIn}
                onPressOut={onMicPressOut}
                disabled={isSending}
                delayLongPress={999999}
                accessibilityRole="button"
                accessibilityLabel="Gravar e enviar áudio para o relógio"
                accessibilityHint="Segure para gravar; solte para enviar à API do dispositivo"
              >
                {isSending ? (
                  <ActivityIndicator color={colors.white} size="large" />
                ) : (
                  <Ionicons name={isRecording ? 'stop-circle' : 'mic'} size={32} color={colors.white} />
                )}
              </Pressable>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    flex: 1,
    position: 'relative',
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 2,
  },
  meta: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
  },
  metaMuted: {
    fontSize: 12,
    color: colors.gray400,
    marginTop: 4,
  },
  headerSpacer: {
    width: 40,
  },
  list: {
    padding: 16,
    paddingBottom: 24,
  },
  fabContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  fabHint: {
    fontSize: 13,
    color: colors.textLight,
    marginBottom: 10,
    fontWeight: '500',
  },
  fab: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 8,
  },
  fabRecording: {
    backgroundColor: colors.error,
    transform: [{ scale: 1.06 }],
  },
  fabDisabled: {
    opacity: 0.85,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardInfo: {
    flex: 1,
    marginRight: 12,
  },
  cardDate: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  cardDirection: {
    fontSize: 13,
    color: colors.primary,
    marginTop: 4,
  },
  cardLabel: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
  },
  playBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playBtnDisabled: {
    backgroundColor: colors.gray300,
  },
  emptyWrap: {
    alignItems: 'center',
    padding: 32,
    marginTop: 24,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default WatchAudiosScreen;

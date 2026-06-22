import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import { ArrowBackIcon } from '../../components/CustomIcons';
import streamCamerasService from '../../services/streamCamerasService';

const CameraPlayerScreen = ({ route, navigation }) => {
  const { streamApi, auth, cameraId, cameraName, whepPublicUrl } = route.params || {};
  const [playerSource, setPlayerSource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const expiresAtRef = useRef(null);
  const refreshTimerRef = useRef(null);

  const fetchStream = useCallback(async () => {
    if (!streamApi || !cameraId) {
      setError('Dados da câmera incompletos.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await streamCamerasService.getPlayUrl(streamApi, auth, cameraId);
      const source = streamCamerasService.buildPlayerSource(result, {
        cameraName,
        whepPublicUrl,
        streamApi,
      });

      if (!source) {
        throw new Error('Servidor de streaming não retornou a URL de reprodução.');
      }

      setPlayerSource(source);
      expiresAtRef.current = result.expires_at || null;
    } catch (err) {
      setPlayerSource(null);
      setError(err?.message || 'Câmera indisponível no momento.');
    } finally {
      setLoading(false);
    }
  }, [streamApi, auth, cameraId, cameraName, whepPublicUrl]);

  useEffect(() => {
    fetchStream();
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [fetchStream]);

  useEffect(() => {
    if (!expiresAtRef.current) return undefined;

    const msUntilRefresh = Math.max(
      (expiresAtRef.current - Math.floor(Date.now() / 1000) - 60) * 1000,
      30000
    );

    refreshTimerRef.current = setTimeout(() => {
      fetchStream();
    }, msUntilRefresh);

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [playerSource, fetchStream]);

  const handleClose = () => {
    setPlayerSource(null);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeTop} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.backButton}>
            <ArrowBackIcon size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {cameraName || 'Câmera'}
            </Text>
            <Text style={styles.headerSub}>Transmissão ao vivo</Text>
          </View>
          <TouchableOpacity onPress={fetchStream} style={styles.refreshButton}>
            <Ionicons name="refresh" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <View style={styles.playerArea}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Conectando à câmera...</Text>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Ionicons name="videocam-off-outline" size={64} color={colors.gray400} />
            <Text style={styles.errorTitle}>{error}</Text>
            <Text style={styles.errorHint}>
              Verifique se a câmera está online e se o agente de streaming está acessível.
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchStream}>
              <Text style={styles.retryText}>Atualizar</Text>
            </TouchableOpacity>
          </View>
        ) : playerSource ? (
          <WebView
            key={playerSource.whepUrl || playerSource.uri}
            source={
              playerSource.type === 'html'
                ? { html: playerSource.html, baseUrl: 'https://gateway.lacosapp.com' }
                : { uri: playerSource.uri }
            }
            injectedJavaScriptBeforeContentLoaded={playerSource.injectWhepPatch || undefined}
            style={styles.webview}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            allowsFullscreenVideo
            javaScriptEnabled
            domStorageEnabled
            originWhitelist={['*']}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.webviewLoading}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            )}
            onHttpError={(event) => {
              if (event?.nativeEvent?.statusCode === 403) {
                fetchStream();
              }
            }}
            onError={() => {
              setError('Não foi possível carregar o vídeo. A câmera pode estar offline.');
            }}
          />
        ) : null}
      </View>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <Text style={styles.footerHint}>
          O vídeo é carregado diretamente do servidor de streaming. Feche esta tela para interromper.
        </Text>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  safeTop: { backgroundColor: '#0f172a' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  backButton: { padding: 8 },
  headerText: { flex: 1, marginHorizontal: 8 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  refreshButton: { padding: 8 },
  playerArea: { flex: 1, backgroundColor: '#000' },
  webview: { flex: 1, backgroundColor: '#000' },
  webviewLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  loadingText: { color: '#94a3b8', marginTop: 12, fontSize: 14 },
  errorTitle: {
    color: '#e2e8f0',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  errorHint: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryText: { color: '#fff', fontWeight: '600' },
  footer: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  footerHint: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
  },
});

export default CameraPlayerScreen;

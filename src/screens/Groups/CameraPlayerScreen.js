import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import { ArrowBackIcon } from '../../components/CustomIcons';
import cameraService from '../../services/cameraService';

/**
 * Reprodução sob demanda via página WebRTC do RTMP Agent (play_url com token).
 * O stream só é carregado quando o usuário abre esta tela.
 */
const CameraPlayerScreen = ({ route, navigation }) => {
  const { groupId, camera } = route.params || {};
  const [playUrl, setPlayUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(camera?.connected ?? false);
  const expiresAtRef = useRef(null);
  const refreshTimerRef = useRef(null);

  const fetchStream = useCallback(async () => {
    if (!groupId || !camera?.id) return;
    setLoading(true);
    setError(null);

    const result = await cameraService.getStream(groupId, camera.id);
    if (result.success && result.playUrl) {
      setPlayUrl(result.playUrl);
      setConnected(!!result.connected);
      expiresAtRef.current = result.expiresAt;
    } else {
      setError(result.error || 'Stream indisponível');
    }
    setLoading(false);
  }, [groupId, camera?.id]);

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
  }, [playUrl, fetchStream]);

  const handleClose = () => {
    setPlayUrl(null);
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
              {camera?.name || 'Câmera'}
            </Text>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: connected ? colors.success : colors.gray400 },
                ]}
              />
              <Text style={styles.headerSub}>
                {connected ? 'Transmissão ativa' : 'Aguardando sinal'}
              </Text>
            </View>
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
            <TouchableOpacity style={styles.retryButton} onPress={fetchStream}>
              <Text style={styles.retryText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : playUrl ? (
          <WebView
            key={playUrl}
            source={{ uri: playUrl }}
            style={styles.webview}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            renderLoading={() => (
              <View style={styles.webviewLoading}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            )}
            onError={() => {
              Alert.alert(
                'Erro no player',
                'Não foi possível carregar o vídeo. Verifique se a câmera está online.',
                [{ text: 'OK' }]
              );
            }}
          />
        ) : null}
      </View>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <Text style={styles.footerHint}>
          O vídeo é carregado sob demanda. Feche esta tela para interromper.
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
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  headerSub: { fontSize: 12, color: '#94a3b8' },
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

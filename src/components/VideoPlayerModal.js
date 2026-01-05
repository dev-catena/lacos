import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import colors from '../constants/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const VideoPlayerModal = ({ visible, videoUri, onClose, videoTitle }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef(null);

  const handleClose = () => {
    // Pausar vídeo antes de fechar
    if (videoRef.current) {
      videoRef.current.pauseAsync();
    }
    onClose();
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = (error) => {
    // Verificar se é erro de codec não suportado
    const errorMessage = error?.message || error?.toString() || '';
    const isCodecError = errorMessage.includes('decoder') || 
                       errorMessage.includes('HEVC') || 
                       errorMessage.includes('codec') ||
                       errorMessage.includes('h265') ||
                       errorMessage.includes('mtk.hevc');
    
    if (isCodecError) {
      // Logar apenas como warning, não como erro crítico
      console.warn('⚠️ VideoPlayerModal - Codec de vídeo não suportado neste dispositivo');
    } else {
      // Para outros erros, logar normalmente
      console.error('❌ VideoPlayerModal - Erro ao carregar vídeo:', error);
    }
    
    setIsLoading(false);
    setHasError(true);
  };

  if (!visible || !videoUri) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <SafeAreaView style={styles.container}>
        <StatusBar hidden />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          
          {videoTitle && (
            <Text style={styles.title} numberOfLines={1}>
              {videoTitle}
            </Text>
          )}
          
          <View style={styles.headerRight} />
        </View>

        {/* Video Container */}
        <View style={styles.videoContainer}>
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.loadingText}>Carregando vídeo...</Text>
            </View>
          )}

          {hasError && (
            <View style={styles.errorContainer}>
              <Ionicons name="videocam-off" size={64} color="#FFFFFF" />
              <Text style={styles.errorText}>Vídeo não pode ser reproduzido</Text>
              <Text style={styles.errorSubtext}>
                Este dispositivo não suporta o formato de vídeo usado.{'\n\n'}
                O vídeo pode estar em um codec não compatível (HEVC/H.265).{'\n\n'}
                <Text style={{ fontWeight: '600' }}>Soluções:</Text>{'\n'}
                • Tente abrir o vídeo em outro aplicativo{'\n'}
                • Peça ao cuidador para reenviar o vídeo{'\n'}
                • O vídeo pode funcionar em outro dispositivo
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <Text style={styles.retryButtonText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          )}

          {!hasError && (
            <Video
              ref={videoRef}
              source={{ uri: videoUri }}
              style={styles.video}
              resizeMode="contain"
              shouldPlay={true}
              isLooping={false}
              useNativeControls={true}
              onLoad={handleLoad}
              onError={handleError}
              onLoadStart={() => setIsLoading(true)}
            />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginHorizontal: 16,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
  },
  loadingContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  errorSubtext: {
    color: '#CCCCCC',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VideoPlayerModal;


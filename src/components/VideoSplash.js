import React, { useRef, useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FIRST_OPEN_KEY = '@lacos:first_open_done';

const VideoSplash = ({ onFinish }) => {
  const videoRef = useRef(null);
  const [isFirstOpen, setIsFirstOpen] = useState(null); // null = verificando

  useEffect(() => {
    const checkFirstOpen = async () => {
      try {
        const done = await AsyncStorage.getItem(FIRST_OPEN_KEY);
        if (done) {
          // Não é a primeira instalação — pula o splash imediatamente
          onFinish();
        } else {
          // Primeira vez — exibe o vídeo completo e marca como visto
          await AsyncStorage.setItem(FIRST_OPEN_KEY, 'true');
          setIsFirstOpen(true);
        }
      } catch {
        // Fallback: exibe o vídeo em caso de erro
        setIsFirstOpen(true);
      }
    };

    checkFirstOpen();
  }, []);

  const handlePlaybackStatusUpdate = useCallback((status) => {
    if (status.didJustFinish) {
      onFinish();
    }
  }, [onFinish]);

  const handleError = useCallback(() => {
    onFinish();
  }, [onFinish]);

  // Aguarda a verificação antes de renderizar qualquer coisa
  if (!isFirstOpen) return null;

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <Video
        ref={videoRef}
        source={require('../../assets/video.mp4')}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping={false}
        isMuted={false}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        onError={handleError}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

export default VideoSplash;

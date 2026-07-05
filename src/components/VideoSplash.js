import React, { useRef, useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FIRST_OPEN_KEY = '@lacos:first_open_done';
const SHORT_DURATION_MS = 3000; // 3 segundos para aberturas subsequentes

const VideoSplash = ({ onFinish }) => {
  const videoRef = useRef(null);
  const timerRef = useRef(null);
  const [isFirstOpen, setIsFirstOpen] = useState(null); // null = ainda verificando

  useEffect(() => {
    const checkFirstOpen = async () => {
      try {
        const done = await AsyncStorage.getItem(FIRST_OPEN_KEY);
        if (done) {
          // Não é a primeira vez — limitar a 3 segundos
          setIsFirstOpen(false);
          timerRef.current = setTimeout(() => {
            onFinish();
          }, SHORT_DURATION_MS);
        } else {
          // Primeira vez — deixar vídeo completo e marcar
          setIsFirstOpen(true);
          await AsyncStorage.setItem(FIRST_OPEN_KEY, 'true');
        }
      } catch {
        setIsFirstOpen(true); // fallback: mostrar completo
      }
    };

    checkFirstOpen();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handlePlaybackStatusUpdate = useCallback((status) => {
    if (status.didJustFinish) {
      onFinish();
    }
  }, [onFinish]);

  const handleError = useCallback(() => {
    onFinish();
  }, [onFinish]);

  // Aguardar verificação do AsyncStorage antes de renderizar
  if (isFirstOpen === null) return null;

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

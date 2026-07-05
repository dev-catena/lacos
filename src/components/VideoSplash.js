import React, { useRef, useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FIRST_OPEN_KEY = '@lacos:first_open_done';
const VIDEO_TOTAL_MS = 8000;
const SHORT_DURATION_MS = 3000;
const START_POSITION_MS = VIDEO_TOTAL_MS - SHORT_DURATION_MS; // 5000ms

const VideoSplash = ({ onFinish }) => {
  const videoRef = useRef(null);
  const [isFirstOpen, setIsFirstOpen] = useState(null);
  const seekDone = useRef(false);

  useEffect(() => {
    const checkFirstOpen = async () => {
      try {
        const done = await AsyncStorage.getItem(FIRST_OPEN_KEY);
        if (done) {
          setIsFirstOpen(false);
        } else {
          setIsFirstOpen(true);
          await AsyncStorage.setItem(FIRST_OPEN_KEY, 'true');
        }
      } catch {
        setIsFirstOpen(true);
      }
    };
    checkFirstOpen();
  }, []);

  // Quando isFirstOpen é resolvido e não é a primeira vez,
  // aguarda o vídeo montar e faz o seek para o segundo 5
  useEffect(() => {
    if (isFirstOpen === false) {
      const timer = setTimeout(async () => {
        if (videoRef.current && !seekDone.current) {
          seekDone.current = true;
          await videoRef.current.setPositionAsync(START_POSITION_MS);
        }
      }, 200); // aguarda 200ms para o vídeo estar carregado
      return () => clearTimeout(timer);
    }
  }, [isFirstOpen]);

  const handlePlaybackStatusUpdate = useCallback((status) => {
    // Para aberturas subsequentes: se ainda não fez o seek e já passou de 200ms,
    // monitora a posição para garantir que o seek foi aplicado
    if (status.isLoaded && !isFirstOpen && !seekDone.current && status.positionMillis < START_POSITION_MS) {
      return; // ainda buscando posição correta
    }
    if (status.didJustFinish) {
      onFinish();
    }
  }, [onFinish, isFirstOpen]);

  const handleError = useCallback(() => {
    onFinish();
  }, [onFinish]);

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

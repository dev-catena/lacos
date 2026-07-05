import React, { useRef, useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FIRST_OPEN_KEY = '@lacos:first_open_done';
const VIDEO_TOTAL_MS = 8000;   // duração total do vídeo
const SHORT_DURATION_MS = 3000; // exibir apenas os últimos 3 segundos
const START_POSITION_MS = VIDEO_TOTAL_MS - SHORT_DURATION_MS; // = 5000ms

const VideoSplash = ({ onFinish }) => {
  const videoRef = useRef(null);
  const [isFirstOpen, setIsFirstOpen] = useState(null);

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

  const handlePlaybackStatusUpdate = useCallback((status) => {
    if (status.didJustFinish) {
      onFinish();
    }
  }, [onFinish]);

  const handleError = useCallback(() => {
    onFinish();
  }, [onFinish]);

  const handleReadyForDisplay = useCallback(async () => {
    // Se não é a primeira abertura, pular para os últimos 3 segundos
    if (!isFirstOpen && videoRef.current) {
      await videoRef.current.setPositionAsync(START_POSITION_MS);
    }
  }, [isFirstOpen]);

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
        onReadyForDisplay={handleReadyForDisplay}
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

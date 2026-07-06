import React, { useRef, useCallback } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { Video, ResizeMode } from 'expo-av';

const VideoSplash = ({ onFinish }) => {
  const videoRef = useRef(null);

  const handlePlaybackStatusUpdate = useCallback((status) => {
    if (status.didJustFinish) {
      onFinish();
    }
  }, [onFinish]);

  const handleError = useCallback(() => {
    onFinish();
  }, [onFinish]);

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <Video
        ref={videoRef}
        source={require('../../assets/bootsplash_novo.mp4')}
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

import { Vibration, Platform } from 'react-native';
import { Audio } from 'expo-av';

const PANIC_ALARM_SOURCE = require('../../assets/sounds/panic-alarm.wav');

let soundRef = null;
let iosVibrateInterval = null;

const ANDROID_VIBRATE_PATTERN = [0, 800, 400, 800, 400, 800];

export async function startPanicAlarm() {
  try {
    if (Platform.OS === 'android') {
      Vibration.vibrate(ANDROID_VIBRATE_PATTERN, true);
    } else {
      Vibration.vibrate();
      iosVibrateInterval = setInterval(() => {
        Vibration.vibrate();
      }, 1200);
    }
  } catch (error) {
    console.warn('PanicAlarm: vibração indisponível', error);
  }

  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false,
    });

    if (soundRef) {
      await soundRef.stopAsync().catch(() => {});
      await soundRef.unloadAsync().catch(() => {});
      soundRef = null;
    }

    const { sound } = await Audio.Sound.createAsync(PANIC_ALARM_SOURCE, {
      isLooping: true,
      volume: 1,
      shouldPlay: true,
    });
    soundRef = sound;
  } catch (error) {
    console.warn('PanicAlarm: som indisponível', error);
  }
}

export async function stopPanicAlarm() {
  try {
    Vibration.cancel();
  } catch (error) {
    console.warn('PanicAlarm: erro ao cancelar vibração', error);
  }

  if (iosVibrateInterval) {
    clearInterval(iosVibrateInterval);
    iosVibrateInterval = null;
  }

  if (soundRef) {
    try {
      await soundRef.stopAsync();
      await soundRef.unloadAsync();
    } catch (error) {
      console.warn('PanicAlarm: erro ao parar som', error);
    }
    soundRef = null;
  }
}

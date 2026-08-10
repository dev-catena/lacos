import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@lacos/v8/paired-device';

export async function loadPairedDevice() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.id || !parsed?.name) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function savePairedDevice(device) {
  await AsyncStorage.setItem(KEY, JSON.stringify(device));
}

export async function clearPairedDevice() {
  await AsyncStorage.removeItem(KEY);
}

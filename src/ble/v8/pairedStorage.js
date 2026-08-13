import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@lacos/v8/paired-device';

function scopedKey(groupId) {
  return groupId ? `${KEY}/${groupId}` : KEY;
}

function parseDevice(raw) {
  if (!raw) return null;
  const parsed = JSON.parse(raw);
  if (!parsed?.id || !parsed?.name) return null;
  return parsed;
}

export async function loadPairedDevice(groupId) {
  try {
    if (groupId) {
      const scoped = parseDevice(await AsyncStorage.getItem(scopedKey(groupId)));
      if (scoped) return scoped;
    }
    return parseDevice(await AsyncStorage.getItem(KEY));
  } catch {
    return null;
  }
}

export async function savePairedDevice(device, groupId) {
  const payload = JSON.stringify(device);
  if (groupId) {
    await AsyncStorage.setItem(scopedKey(groupId), payload);
  }
  await AsyncStorage.setItem(KEY, payload);
}

export async function clearPairedDevice(groupId) {
  if (groupId) {
    await AsyncStorage.removeItem(scopedKey(groupId));
  }
  await AsyncStorage.removeItem(KEY);
}

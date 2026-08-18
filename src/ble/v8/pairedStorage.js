import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@lacos/v8/paired-device';

function scopedKey(groupId) {
  return groupId ? `${KEY}/${groupId}` : KEY;
}

function parseDevice(raw) {
  if (!raw) return null;
  const parsed = JSON.parse(raw);
  if (!parsed?.id || !parsed?.name) return null;
  const model = String(parsed.model || '').toLowerCase();
  parsed.model = model === 'v5' || model === 'v8' ? model : 'v8';
  return parsed;
}

export async function loadPairedDevice(groupId, { currentUserId } = {}) {
  try {
    let device = null;
    if (groupId) {
      device = parseDevice(await AsyncStorage.getItem(scopedKey(groupId)));
    }
    if (!device) {
      device = parseDevice(await AsyncStorage.getItem(KEY));
    }
    if (
      device?.ownerUserId != null &&
      currentUserId != null &&
      Number(device.ownerUserId) !== Number(currentUserId)
    ) {
      return null;
    }
    return device;
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

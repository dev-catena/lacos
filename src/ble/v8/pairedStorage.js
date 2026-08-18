import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@lacos/v8/paired-device';

function scopedKey(groupId) {
  return groupId ? `${KEY}/${groupId}` : KEY;
}

function parseDevice(raw, groupId) {
  if (!raw) return null;
  const parsed = JSON.parse(raw);
  if (!parsed?.id || !parsed?.name) return null;
  const model = String(parsed.model || '').toLowerCase();
  parsed.model = model === 'v5' || model === 'v8' ? model : 'v8';
  if (
    parsed.groupId != null &&
    groupId != null &&
    String(parsed.groupId) !== String(groupId)
  ) {
    return null;
  }
  return parsed;
}

/**
 * Pulseira pareada deste grupo apenas.
 * Não reutiliza o dispositivo de outro grupo (evita misturar Mamãe Sandra com Vovó Rosa).
 */
export async function loadPairedDevice(groupId, { currentUserId } = {}) {
  try {
    if (!groupId) return null;
    const device = parseDevice(await AsyncStorage.getItem(scopedKey(groupId)), groupId);
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
  if (!groupId) return;
  const payload = JSON.stringify({ ...device, groupId });
  await AsyncStorage.setItem(scopedKey(groupId), payload);
}

export async function clearPairedDevice(groupId) {
  if (groupId) {
    await AsyncStorage.removeItem(scopedKey(groupId));
  }
}

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@lacos/v8/connect-breadcrumb';

/**
 * Última etapa do connect V8 — sobrevive a crash nativo (útil em builds EAS sem USB/logcat).
 * Escreva com await ANTES de cada chamada nativa arriscada.
 */
export async function saveConnectBreadcrumb(step, extra = {}) {
  try {
    const payload = {
      step,
      at: new Date().toISOString(),
      ...extra,
    };
    await AsyncStorage.setItem(KEY, JSON.stringify(payload));
    return payload;
  } catch {
    return null;
  }
}

export async function loadConnectBreadcrumb() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function clearConnectBreadcrumb() {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

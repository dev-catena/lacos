import { PermissionsAndroid, Platform } from 'react-native';

let BleManager;
try {
  BleManager = require('react-native-ble-plx').BleManager;
} catch {
  BleManager = null;
}

const MOKO_NAME_RE = /moko|mkgw|mini\s*0?2|gateway/i;

export function isBleScanAvailable() {
  return !!BleManager;
}

export async function requestBleScanPermissions() {
  if (Platform.OS !== 'android') return true;
  if (Platform.Version >= 31) {
    const result = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ]);
    return (
      result['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
      result['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED
    );
  }
  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  );
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

/** Normaliza id BLE para MAC hex (Android). Em iOS costuma ser UUID. */
export function normalizeBleMac(id) {
  if (!id) return '';
  const hex = String(id).toUpperCase().replace(/[^A-F0-9]/g, '');
  if (hex.length === 12) return hex;
  return String(id).trim();
}

export function looksLikeMac(value) {
  const hex = String(value || '')
    .toUpperCase()
    .replace(/[^A-F0-9]/g, '');
  return hex.length === 12;
}

export function isLikelyMokoGateway(device) {
  const label = `${device?.name || ''} ${device?.localName || ''}`;
  return MOKO_NAME_RE.test(label);
}

/**
 * Escaneia BLE por gateways próximos.
 * @returns {Promise<{ devices: Array<{ id, mac, name, rssi, isMoko }>, manager }>}
 */
export async function scanNearbyGateways({
  durationMs = 8000,
  onDevice,
} = {}) {
  if (!BleManager) {
    throw new Error(
      'Bluetooth nativo indisponível. Use o build preview/production com BLE (não Expo Go).',
    );
  }
  const ok = await requestBleScanPermissions();
  if (!ok) {
    throw new Error('Permissão de Bluetooth/localização necessária para escanear.');
  }

  const manager = new BleManager();
  const found = new Map();

  const push = (device) => {
    if (!device?.id) return;
    const name = device.localName || device.name || 'Dispositivo BLE';
    const mac = normalizeBleMac(device.id);
    const entry = {
      id: device.id,
      mac,
      name,
      rssi: device.rssi ?? null,
      isMoko: isLikelyMokoGateway(device),
    };
    found.set(device.id, entry);
    onDevice?.(entry);
  };

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (err) => {
      if (settled) return;
      settled = true;
      try {
        manager.stopDeviceScan();
      } catch {
        // ignore
      }
      try {
        manager.destroy();
      } catch {
        // ignore
      }
      if (err) reject(err);
      else {
        const devices = [...found.values()].sort((a, b) => {
          if (a.isMoko !== b.isMoko) return a.isMoko ? -1 : 1;
          return (b.rssi ?? -999) - (a.rssi ?? -999);
        });
        resolve({ devices });
      }
    };

    const timer = setTimeout(() => finish(null), durationMs);

    try {
      manager.startDeviceScan(null, { allowDuplicates: false }, (error, device) => {
        if (error) {
          clearTimeout(timer);
          finish(error);
          return;
        }
        if (device) push(device);
      });
    } catch (e) {
      clearTimeout(timer);
      finish(e);
    }
  });
}

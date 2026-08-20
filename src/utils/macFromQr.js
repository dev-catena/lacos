/**
 * Extrai MAC BLE de QR Codes comuns (MOKO, texto puro, JSON, URL).
 */
export function extractMacFromQrPayload(raw) {
  if (raw == null) return null;
  const text = String(raw).trim();
  if (!text) return null;

  // JSON
  if (text.startsWith('{') || text.startsWith('[')) {
    try {
      const parsed = JSON.parse(text);
      const obj = Array.isArray(parsed) ? parsed[0] : parsed;
      if (obj && typeof obj === 'object') {
        const candidate =
          obj.mac ||
          obj.MAC ||
          obj.ble_mac ||
          obj.bracelet_mac ||
          obj.gateway_mac ||
          obj.device_mac ||
          obj.deviceMac ||
          obj.id;
        const fromJson = normalizeMacCandidate(candidate);
        if (fromJson) return fromJson;
      }
    } catch {
      // segue
    }
  }

  // URL ?mac= / &mac=
  try {
    if (/^https?:\/\//i.test(text) || text.includes('=')) {
      const qs = text.includes('?') ? text.split('?')[1] : text;
      const params = new URLSearchParams(qs);
      for (const key of ['mac', 'MAC', 'ble_mac', 'device_mac', 'id']) {
        const v = params.get(key);
        const n = normalizeMacCandidate(v);
        if (n) return n;
      }
    }
  } catch {
    // segue
  }

  // Texto puro / trecho com MAC
  const direct = normalizeMacCandidate(text);
  if (direct) return direct;

  const match = text.match(
    /([0-9A-Fa-f]{2}([:\-\s]?)){5}[0-9A-Fa-f]{2}|[0-9A-Fa-f]{12}/,
  );
  if (match) {
    return normalizeMacCandidate(match[0]);
  }

  return null;
}

export function normalizeMacCandidate(value) {
  if (value == null) return null;
  const hex = String(value)
    .toUpperCase()
    .replace(/[^A-F0-9]/g, '');
  if (hex.length === 12) return hex;
  return null;
}

export function formatMacDisplay(hex12) {
  if (!hex12 || hex12.length !== 12) return hex12 || '';
  return hex12.match(/.{1,2}/g).join(':');
}

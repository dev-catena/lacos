#!/usr/bin/env node
/**
 * Ponte MQTT → Laços location ingest
 *
 * Variáveis de ambiente:
 *   MQTT_URL          mqtt://127.0.0.1:1883  ou mqtts://...
 *   MQTT_TOPIC        #  (default: moko/# ou gateway/#)
 *   MQTT_USERNAME     opcional
 *   MQTT_PASSWORD     opcional
 *   LACOS_API_URL     https://gateway.lacosapp.com/api
 *
 * Uso:
 *   cd scripts/location-mqtt-bridge && npm install && npm start
 */

const mqtt = require('mqtt');

const API_BASE = (process.env.LACOS_API_URL || 'https://gateway.lacosapp.com/api').replace(/\/$/, '');
const MQTT_URL = process.env.MQTT_URL || 'mqtt://127.0.0.1:1883';
const MQTT_TOPIC = process.env.MQTT_TOPIC || '#';
const MQTT_USERNAME = process.env.MQTT_USERNAME || '';
const MQTT_PASSWORD = process.env.MQTT_PASSWORD || '';

function normalizeMac(value) {
  if (!value) return '';
  return String(value).toUpperCase().replace(/[^A-F0-9]/g, '');
}

/** Converte timestamp MOKO (ms/s/string) em ISO 8601. */
function toIsoDate(value) {
  if (value == null || value === '') return new Date().toISOString();
  if (typeof value === 'number' && Number.isFinite(value)) {
    const ms = value > 1e12 ? value : value * 1000;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  }
  const asNum = Number(value);
  if (Number.isFinite(asNum) && String(value).trim() !== '') {
    const ms = asNum > 1e12 ? asNum : asNum * 1000;
    const d = new Date(ms);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) return d.toISOString();
  return new Date().toISOString();
}

/** Extrai MAC do gateway a partir do tópico ou payload MOKO. */
function resolveGatewayMac(topic, payload) {
  const fromPayload =
    payload.gateway_mac ||
    payload.gatewayMac ||
    payload.gateway ||
    payload.device_info?.mac ||
    payload.deviceInfo?.mac ||
    payload.device_id ||
    payload.deviceId;
  if (fromPayload) return normalizeMac(fromPayload);

  const parts = String(topic || '').split('/').filter(Boolean);
  for (const p of parts) {
    const mac = normalizeMac(p);
    if (mac.length === 12) return mac;
  }
  return '';
}

/** Converte mensagens MOKO comuns em readings para /location/ingest. */
function extractReadings(payload) {
  const readings = [];

  const push = (braceletMac, rssi, recordedAt) => {
    const mac = normalizeMac(braceletMac);
    if (mac.length !== 12) return;
    readings.push({
      bracelet_mac: mac,
      rssi: typeof rssi === 'number' ? rssi : parseInt(rssi, 10) || null,
      recorded_at: toIsoDate(recordedAt),
    });
  };

  if (Array.isArray(payload.data)) {
    for (const row of payload.data) {
      push(row.mac || row.ble_mac || row.device_mac, row.rssi, row.timestamp || row.time);
    }
  }
  if (Array.isArray(payload.devices)) {
    for (const row of payload.devices) {
      push(row.mac || row.ble_mac, row.rssi, row.timestamp);
    }
  }
  if (payload.mac && payload.rssi != null && !payload.device_info) {
    push(payload.mac, payload.rssi, payload.timestamp || payload.time);
  }
  if (payload.ble_mac) {
    push(payload.ble_mac, payload.rssi, payload.timestamp);
  }

  return readings;
}

async function postIngest(gatewayMac, readings) {
  const url = `${API_BASE}/location/ingest`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ gateway_mac: gatewayMac, readings }),
  });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { message: text.slice(0, 200) };
  }
  if (!res.ok) {
    throw new Error(body.message || `HTTP ${res.status}`);
  }
  return body;
}

function parsePayload(buf) {
  const raw = buf.toString('utf8');
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

console.log('[location-bridge] API:', API_BASE);
console.log('[location-bridge] MQTT:', MQTT_URL, 'topic:', MQTT_TOPIC);

const client = mqtt.connect(MQTT_URL, {
  username: MQTT_USERNAME || undefined,
  password: MQTT_PASSWORD || undefined,
  reconnectPeriod: 5000,
});

client.on('connect', () => {
  console.log('[location-bridge] conectado ao broker');
  client.subscribe(MQTT_TOPIC, (err) => {
    if (err) console.error('[location-bridge] subscribe erro:', err.message);
    else console.log('[location-bridge] inscrito em', MQTT_TOPIC);
  });
});

client.on('message', async (topic, buf) => {
  // Só mensagens de upload do gateway (send), não eco de receive
  if (/\/receive$/i.test(topic)) return;

  const payload = parsePayload(buf);
  if (!payload) return;

  const gatewayMac = resolveGatewayMac(topic, payload);
  if (!gatewayMac || gatewayMac.length !== 12) {
    console.warn('[location-bridge] ignorado (sem gateway MAC):', topic);
    return;
  }

  const readings = extractReadings(payload);
  if (readings.length === 0) return;

  try {
    const result = await postIngest(gatewayMac, readings);
    console.log(
      `[location-bridge] ingest ok gateway=${gatewayMac} saved=${result.saved ?? readings.length}`,
    );
  } catch (e) {
    console.error('[location-bridge] ingest falhou:', e.message, 'gateway=', gatewayMac);
  }
});

client.on('error', (err) => {
  console.error('[location-bridge] mqtt error:', err.message);
});

/** Protocolo BLE V8 (J-Style) — SDK 2436_v8_version2.0 / V8 IOS */
import { decode as b64decode, encode as b64encode } from 'base-64';

export const V8_UUID = {
  service: '0000FFF0-0000-1000-8000-00805F9B34FB',
  write: '0000FFF6-0000-1000-8000-00805F9B34FB',
  notify: '0000FFF7-0000-1000-8000-00805F9B34FB',
};

export const CMD = {
  enableActivity: 0x09,
  measurementWithType: 0x28,
  getBattery: 0x13,
  setTime: 0x01,
  setAuto: 0x2a,
  getHrvData: 0x56,
  oxygenData: 0x66,
  /** Temperatura em tempo real (Temperature_3NTC) */
  realtimeTemperature: 0x14,
  /** Histórico detalhado de sono */
  getSleepData: 0x53,
  /** Histórico de temperatura */
  temperatureHistory: 0x62,
  /** Stream ECG/PPG em tempo real */
  ppg: 0x07,
};

/** Estágios de sono (SDK V8 / iOS docs) */
export const SLEEP_STAGE = {
  awake: 0,
  deep: 1,
  light: 2,
  rem: 3,
};

/** Android AutoTestMode no comando 0x28 */
export const MEASURE_TYPE = {
  hrv: 0x01,
  heartRate: 0x02,
  spo2: 0x03,
  ecg: 0x04,
};

/** Android AutoMode no comando 0x2A byte[9] */
export const AUTO_TYPE = {
  heartRate: 0x01,
  spo2: 0x02,
  temp: 0x03,
  hrv: 0x04,
};

function u8(n) {
  return n & 0xff;
}

export function applyCrc(packet) {
  let crc = 0;
  for (let i = 0; i < packet.length - 1; i++) crc = (crc + packet[i]) & 0xff;
  packet[packet.length - 1] = crc;
  return packet;
}

export function buildPacket(bytes) {
  const packet = new Uint8Array(16);
  for (let i = 0; i < Math.min(bytes.length, 15); i++) packet[i] = u8(bytes[i]);
  return applyCrc(packet);
}

export function toBcd(value) {
  return parseInt(String(Math.trunc(value)), 16) & 0xff;
}

export function cmdRealTimeStep(enable, tempEnable = false) {
  return buildPacket([CMD.enableActivity, enable ? 1 : 0, tempEnable ? 1 : 0]);
}

export function cmdManualMeasurement(type, durationSeconds, open) {
  const secs = Math.max(30, Math.trunc(durationSeconds));
  return buildPacket([
    CMD.measurementWithType,
    type,
    open ? 1 : 0,
    0,
    secs & 0xff,
    (secs >> 8) & 0xff,
  ]);
}

export function cmdStartHeartRate(seconds = 60) {
  return cmdManualMeasurement(MEASURE_TYPE.heartRate, seconds, true);
}
export function cmdStopHeartRate(seconds = 60) {
  return cmdManualMeasurement(MEASURE_TYPE.heartRate, seconds, false);
}
export function cmdStartSpo2(seconds = 60) {
  return cmdManualMeasurement(MEASURE_TYPE.spo2, seconds, true);
}
export function cmdStopSpo2(seconds = 60) {
  return cmdManualMeasurement(MEASURE_TYPE.spo2, seconds, false);
}
export function cmdStartHrv(seconds = 60) {
  return cmdManualMeasurement(MEASURE_TYPE.hrv, seconds, true);
}
export function cmdStopHrv(seconds = 60) {
  return cmdManualMeasurement(MEASURE_TYPE.hrv, seconds, false);
}

/**
 * ECG: no SDK Android a duração é em milissegundos e byte[6]=0x01.
 * Demo: 50_000 ms (~50s).
 */
export function cmdStartEcg(durationMs = 50_000) {
  const ms = Math.max(30_000, Math.trunc(durationMs));
  return buildPacket([
    CMD.measurementWithType,
    MEASURE_TYPE.ecg,
    1,
    0,
    ms & 0xff,
    (ms >> 8) & 0xff,
    0x01,
  ]);
}

export function cmdStopEcg(durationMs = 50_000) {
  const ms = Math.max(30_000, Math.trunc(durationMs));
  return buildPacket([
    CMD.measurementWithType,
    MEASURE_TYPE.ecg,
    0,
    0,
    ms & 0xff,
    (ms >> 8) & 0xff,
    0x01,
  ]);
}

/**
 * PPG/ECG 0x07 — SDK V5/V8.
 * V5: 1 = iniciar, 2 = resultado, 3 = parar, 4 = progresso, 5 = sair.
 * V8 stream: 1 = ligar, 0 = desligar.
 */
export function cmdPpgMode(mode, status = 0) {
  return buildPacket([CMD.ppg, mode & 0xff, status & 0xff]);
}

/** Liga/desliga transmissão realtime de ECG (PPG 0x07). */
export function cmdEcgStream(enable) {
  return cmdPpgMode(enable ? 1 : 0);
}

export function cmdSetAutomatic(autoType, intervalMinutes = 5) {
  const interval = Math.max(1, intervalMinutes);
  return buildPacket([
    CMD.setAuto,
    2,
    toBcd(0),
    toBcd(0),
    toBcd(23),
    toBcd(59),
    0x7f,
    interval & 0xff,
    (interval >> 8) & 0xff,
    autoType,
  ]);
}

export function cmdGetHrvData(mode = 0) {
  return buildPacket([CMD.getHrvData, mode]);
}

export function cmdGetSpo2History(mode = 0) {
  return buildPacket([CMD.oxygenData, mode]);
}

export function cmdGetBattery() {
  return buildPacket([CMD.getBattery]);
}

/** mode 0 = últimas sessões; data opcional YYYY-MM-DD HH:mm:ss */
export function cmdGetSleepData(mode = 0) {
  return buildPacket([CMD.getSleepData, mode]);
}

export function cmdRealtimeTemperature() {
  return buildPacket([CMD.realtimeTemperature]);
}

export function cmdGetTemperatureHistory(mode = 0) {
  return buildPacket([CMD.temperatureHistory, mode]);
}

function timezoneByte(date = new Date()) {
  const offsetHours = -date.getTimezoneOffset() / 60;
  const abs = Math.abs(Math.trunc(offsetHours));
  return offsetHours < 0 ? abs & 0xff : (abs + 0x80) & 0xff;
}

export function cmdSetDeviceTime(date = new Date()) {
  const year = date.getFullYear() % 100;
  return buildPacket([
    CMD.setTime,
    toBcd(year),
    toBcd(date.getMonth() + 1),
    toBcd(date.getDate()),
    toBcd(date.getHours()),
    toBcd(date.getMinutes()),
    toBcd(date.getSeconds()),
    0,
    timezoneByte(date),
  ]);
}

function getValue(b, count) {
  return (b & 0xff) * 256 ** count;
}

export function isPlausibleBloodPressure(systolic, diastolic) {
  return (
    systolic >= 70 &&
    systolic <= 220 &&
    diastolic >= 40 &&
    diastolic <= 140 &&
    systolic > diastolic
  );
}

export function isPlausibleSpo2(value) {
  return value >= 70 && value <= 100;
}

export function isPlausibleTemperatureC(value) {
  return value >= 30 && value <= 45;
}

function fromBcd(b) {
  const v = b & 0xff;
  return ((v >> 4) & 0xf) * 10 + (v & 0xf);
}

function parseV8DateAt(value, offset) {
  if (value.length < offset + 6) return null;
  const year = 2000 + fromBcd(value[offset]);
  const month = fromBcd(value[offset + 1]);
  const day = fromBcd(value[offset + 2]);
  const hour = fromBcd(value[offset + 3]);
  const min = fromBcd(value[offset + 4]);
  const sec = fromBcd(value[offset + 5]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return { date: d, iso };
}

/**
 * Resume duração de sono a partir do array de estágios.
 * unitMinutes: 1 ou 5 (SDK).
 */
export function summarizeSleepStages(stages, unitMinutes = 5) {
  let deep = 0;
  let light = 0;
  let rem = 0;
  let awake = 0;
  for (const s of stages) {
    const stage = s & 0xff;
    if (stage === SLEEP_STAGE.deep) deep += unitMinutes;
    else if (stage === SLEEP_STAGE.light) light += unitMinutes;
    else if (stage === SLEEP_STAGE.rem) rem += unitMinutes;
    else awake += unitMinutes;
  }
  const totalMinutes = deep + light + rem;
  return {
    totalMinutes,
    totalHours: Math.round((totalMinutes / 60) * 10) / 10,
    deepMinutes: deep,
    lightMinutes: light,
    remMinutes: rem,
    awakeMinutes: awake,
  };
}

export function parseRealtimeActivity(value) {
  if (value.length < 22 || value[0] !== CMD.enableActivity) return null;

  let step = 0;
  for (let i = 1; i < 5; i++) step += getValue(value[i], i - 1);

  const heartRate = value[21] & 0xff;
  let tempRaw = 0;
  if (value.length > 23) tempRaw = getValue(value[22], 0) + getValue(value[23], 1);
  const spo2 = value.length > 24 ? value[24] & 0xff : 0;
  const temperatureC = Math.round(tempRaw * 0.1 * 10) / 10;

  return {
    step,
    heartRate,
    spo2,
    temperatureC: isPlausibleTemperatureC(temperatureC) ? temperatureC : 0,
  };
}

/** Resposta 0x14 RealTimeTemperature / Temperature_3NTC */
export function parseRealtimeTemperature(value) {
  if (value.length < 3 || value[0] !== CMD.realtimeTemperature) return null;
  const tempRaw = getValue(value[1], 0) + getValue(value[2], 1);
  const temperatureC = Math.round(tempRaw * 0.1 * 10) / 10;
  if (!isPlausibleTemperatureC(temperatureC)) return null;
  return { temperatureC };
}

/** Histórico 0x62 — retorna a temperatura mais recente plausível */
export function parseTemperatureHistory(value) {
  if (value.length < 11 || value[0] !== CMD.temperatureHistory) return null;
  const count = 11;
  const size = Math.floor(value.length / count);
  let latest = null;
  for (let i = 0; i < size; i++) {
    const base = i * count;
    const dateInfo = parseV8DateAt(value, base + 3);
    const tempRaw = getValue(value[base + 9], 0) + getValue(value[base + 10], 1);
    const temperatureC = Math.round(tempRaw * 0.1 * 10) / 10;
    if (!isPlausibleTemperatureC(temperatureC)) continue;
    latest = {
      temperatureC,
      measuredAt: dateInfo?.date || null,
    };
  }
  return latest;
}

/**
 * Sono 0x53 — extrai a sessão mais recente com duração total (horas).
 * Aceita pacotes longos (MTU alto) no formato de 34 bytes/registro.
 */
export function parseSleepData(value) {
  if (!value?.length || value[0] !== CMD.getSleepData) return null;

  // Fim da sequência: … 0x53 0xFF
  if (
    value.length >= 2 &&
    value[value.length - 1] === 0xff &&
    value[value.length - 2] === CMD.getSleepData &&
    value.length < 12
  ) {
    return { end: true, sessions: [] };
  }

  const sessions = [];

  // Formato 1 minuto (pacote ~130 bytes)
  if (value.length >= 130 || (value.length >= 12 && value.length > 50)) {
    const dateInfo = parseV8DateAt(value, 3);
    const sleepLength = value[9] & 0xff;
    const maxStages = Math.min(sleepLength, value.length - 10);
    if (dateInfo && maxStages > 0) {
      const stages = [];
      for (let j = 0; j < maxStages; j++) stages.push(value[10 + j] & 0xff);
      const unit =
        value.length >= 130 || sleepLength > 24 ? 1 : 5;
      const summary = summarizeSleepStages(stages, unit);
      if (summary.totalMinutes > 0) {
        sessions.push({
          startAt: dateInfo.date,
          startIso: dateInfo.iso,
          unitMinutes: unit,
          ...summary,
        });
      }
    }
  }

  // Formato 5 minutos (registros de 34 bytes)
  if (sessions.length === 0) {
    const count = 34;
    const size = Math.floor(value.length / count);
    for (let i = 0; i < size; i++) {
      const base = i * count;
      const dateInfo = parseV8DateAt(value, base + 3);
      const sleepLength = value[base + 9] & 0xff;
      const maxStages = Math.min(sleepLength, count - 10, value.length - (base + 10));
      if (!dateInfo || maxStages <= 0) continue;
      const stages = [];
      for (let j = 0; j < maxStages; j++) stages.push(value[base + 10 + j] & 0xff);
      const summary = summarizeSleepStages(stages, 5);
      if (summary.totalMinutes <= 0) continue;
      sessions.push({
        startAt: dateInfo.date,
        startIso: dateInfo.iso,
        unitMinutes: 5,
        ...summary,
      });
    }
  }

  if (sessions.length === 0) return null;
  sessions.sort((a, b) => b.startAt - a.startAt);
  return { end: false, sessions, latest: sessions[0] };
}

export function parseMeasurement(value) {
  if (value.length < 3 || value[0] !== CMD.measurementWithType) return null;

  const type = value[1] & 0xff;
  const heartRate = value[2] & 0xff;
  const spo2 = value.length > 3 ? value[3] & 0xff : 0;
  const hrv = value.length > 4 ? value[4] & 0xff : 0;
  const stress = value.length > 5 ? value[5] & 0xff : 0;
  const systolicBP = value.length > 6 ? value[6] & 0xff : 0;
  const diastolicBP = value.length > 7 ? value[7] & 0xff : 0;

  const isStopAck =
    heartRate === 0 &&
    spo2 === 0 &&
    systolicBP === 0 &&
    diastolicBP === 0 &&
    hrv === 0;

  return {
    type,
    heartRate,
    spo2,
    hrv,
    stress,
    systolicBP,
    diastolicBP,
    isStopAck,
  };
}

export function parseHrvHistory(value) {
  if (value.length < 15 || value[0] !== CMD.getHrvData) return null;
  const count = 15;
  const size = Math.floor(value.length / count);
  for (let i = 0; i < size; i++) {
    const base = i * count;
    if ((value[base] & 0xff) === 0xff) continue;
    const heartRate = value[base + 11] & 0xff;
    const systolic = value[base + 13] & 0xff;
    const diastolic = value[base + 14] & 0xff;
    if (isPlausibleBloodPressure(systolic, diastolic)) {
      return { systolic, diastolic, heartRate };
    }
  }
  return null;
}

export function parseSpo2History(value) {
  if (value.length < 10 || value[0] !== CMD.oxygenData) return null;
  const candidates = [value[9] & 0xff, value.length > 10 ? value[10] & 0xff : 0];
  for (const v of candidates) {
    if (isPlausibleSpo2(v)) return v;
  }
  for (let i = 1; i < value.length; i++) {
    const v = value[i] & 0xff;
    if (isPlausibleSpo2(v)) return v;
  }
  return null;
}

/**
 * Pacotes PPG/ECG raw (cmd 0x07, length > 16).
 * Cada amostra = 3 bytes little-endian.
 */
export function parseEcgRaw(value) {
  if (!value?.length || value[0] !== CMD.ppg || value.length <= 16) return null;
  const packetID = value[1] & 0xff;
  const samples = [];
  const count = Math.floor((value.length - 2) / 3);
  for (let i = 0; i < count; i++) {
    const index = 2 + 3 * i;
    if (index + 2 >= value.length) break;
    const sample =
      (value[index] & 0xff) |
      ((value[index + 1] & 0xff) << 8) |
      ((value[index + 2] & 0xff) << 16);
    samples.push(sample);
  }
  if (samples.length === 0) return null;
  return { packetID, samples };
}

export function parseBattery(value) {
  if (value.length < 2 || value[0] !== CMD.getBattery) return null;
  return value[1] & 0xff;
}

export function toHex(bytes, max = 16) {
  const n = Math.min(bytes.length, max);
  let s = '';
  for (let i = 0; i < n; i++) {
    s += bytes[i].toString(16).padStart(2, '0');
    if (i < n - 1) s += ' ';
  }
  if (bytes.length > max) s += '…';
  return s;
}

export function bytesToBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return b64encode(binary);
}

export function base64ToBytes(b64) {
  const binary = b64decode(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

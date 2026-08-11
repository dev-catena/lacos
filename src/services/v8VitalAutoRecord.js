import AsyncStorage from '@react-native-async-storage/async-storage';
import vitalSignService from './vitalSignService';

/** Intervalo de gravação automática da pulseira V8 (30 minutos). */
export const V8_AUTO_RECORD_INTERVAL_MS = 30 * 60 * 1000;

function lastSaveKey(groupId) {
  return `@lacos/v8/last-auto-save/${groupId}`;
}

function lastSleepKey(groupId) {
  return `@lacos/v8/last-sleep-saved/${groupId}`;
}

export async function getLastV8AutoSaveAt(groupId) {
  if (!groupId) return null;
  try {
    const raw = await AsyncStorage.getItem(lastSaveKey(groupId));
    if (!raw) return null;
    const ts = Number(raw);
    return Number.isFinite(ts) ? ts : null;
  } catch {
    return null;
  }
}

export async function setLastV8AutoSaveAt(groupId, timestamp = Date.now()) {
  if (!groupId) return;
  await AsyncStorage.setItem(lastSaveKey(groupId), String(timestamp));
}

async function getLastSavedSleepFingerprint(groupId) {
  if (!groupId) return null;
  try {
    return (await AsyncStorage.getItem(lastSleepKey(groupId))) || null;
  } catch {
    return null;
  }
}

async function setLastSavedSleepFingerprint(groupId, fingerprint) {
  if (!groupId || !fingerprint) return;
  await AsyncStorage.setItem(lastSleepKey(groupId), fingerprint);
}

/**
 * Monta e envia FC / SpO₂ / PA / temperatura / sono para POST /vital-signs.
 */
export async function persistBraceletVitalSigns({
  groupId,
  heartRate,
  spo2,
  bloodPressure,
  temperatureC,
  sleepSession,
  ecgResult,
  deviceName,
  auto = false,
}) {
  if (!groupId) {
    return { success: false, error: 'Grupo inválido', saved: 0, results: [] };
  }

  const hasHr = heartRate != null && heartRate > 0;
  const hasSpo2 = spo2 != null && spo2 > 0;
  const hasBp =
    bloodPressure &&
    bloodPressure.systolic > 0 &&
    bloodPressure.diastolic > 0;
  const hasTemp = temperatureC != null && temperatureC >= 30 && temperatureC <= 45;
  const hasSleep =
    sleepSession &&
    sleepSession.totalHours != null &&
    sleepSession.totalHours > 0;
  const hasEcg =
    !auto &&
    ecgResult &&
    ((ecgResult.samples != null && ecgResult.samples > 0) ||
      (ecgResult.heartRate != null && ecgResult.heartRate > 0));

  if (!hasHr && !hasSpo2 && !hasBp && !hasTemp && !hasSleep && !hasEcg) {
    return { success: false, error: 'Sem leituras para gravar', saved: 0, results: [] };
  }

  const measuredAt = new Date().toISOString();
  const namePart = deviceName ? ` (${deviceName})` : '';
  const notes = auto
    ? `wearable: V8${namePart} | auto:30min`
    : `wearable: V8${namePart}`;

  const results = [];

  if (hasHr) {
    results.push(
      await vitalSignService.createVitalSign({
        groupId,
        type: 'heart_rate',
        value: heartRate,
        unit: 'bpm',
        measuredAt,
        notes,
      }),
    );
  }
  if (hasSpo2) {
    results.push(
      await vitalSignService.createVitalSign({
        groupId,
        type: 'oxygen_saturation',
        value: spo2,
        unit: '%',
        measuredAt,
        notes,
      }),
    );
  }
  if (hasBp) {
    results.push(
      await vitalSignService.createVitalSign({
        groupId,
        type: 'blood_pressure',
        value: `${bloodPressure.systolic}/${bloodPressure.diastolic}`,
        unit: 'mmHg',
        measuredAt,
        notes,
      }),
    );
  }
  if (hasTemp) {
    results.push(
      await vitalSignService.createVitalSign({
        groupId,
        type: 'temperature',
        value: temperatureC,
        unit: '°C',
        measuredAt,
        notes,
      }),
    );
  }
  if (hasEcg) {
    const ecgValue = {
      heart_rate: ecgResult.heartRate || null,
      hrv: ecgResult.hrv || null,
      stress: ecgResult.stress || null,
      samples: ecgResult.samples || 0,
    };
    if (ecgResult.systolicBP && ecgResult.diastolicBP) {
      ecgValue.systolic = ecgResult.systolicBP;
      ecgValue.diastolic = ecgResult.diastolicBP;
    }
    results.push(
      await vitalSignService.createVitalSign({
        groupId,
        type: 'ecg',
        value: ecgValue,
        unit: 'ecg',
        measuredAt: ecgResult.measuredAt || measuredAt,
        notes,
      }),
    );
  }
  if (hasSleep) {
    const fingerprint = `${sleepSession.startIso || ''}|${sleepSession.totalMinutes || 0}`;
    const lastFp = await getLastSavedSleepFingerprint(groupId);
    // Evita gravar a mesma sessão de sono a cada 30 min
    if (!auto || fingerprint !== lastFp) {
      const sleepNotes = [
        notes,
        sleepSession.startIso ? `inicio: ${sleepSession.startIso}` : null,
        sleepSession.deepMinutes != null ? `profundo: ${sleepSession.deepMinutes}min` : null,
        sleepSession.lightMinutes != null ? `leve: ${sleepSession.lightMinutes}min` : null,
        sleepSession.remMinutes != null ? `REM: ${sleepSession.remMinutes}min` : null,
      ]
        .filter(Boolean)
        .join(' | ');

      const sleepResult = await vitalSignService.createVitalSign({
        groupId,
        type: 'sleep',
        value: sleepSession.totalHours,
        unit: 'h',
        measuredAt: sleepSession.startAt
          ? new Date(sleepSession.startAt).toISOString()
          : measuredAt,
        notes: sleepNotes,
      });
      results.push(sleepResult);
      if (sleepResult.success) {
        await setLastSavedSleepFingerprint(groupId, fingerprint);
      }
    }
  }

  const saved = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success);

  if (auto && saved > 0) {
    await setLastV8AutoSaveAt(groupId, Date.now());
  }

  return {
    success: saved > 0,
    saved,
    failed: failed.length,
    error: failed[0]?.error || null,
    results,
  };
}

export async function isV8AutoSaveDue(groupId, intervalMs = V8_AUTO_RECORD_INTERVAL_MS) {
  const last = await getLastV8AutoSaveAt(groupId);
  if (last == null) return true;
  return Date.now() - last >= intervalMs;
}

export function msUntilNextV8AutoSave(lastSaveAt, intervalMs = V8_AUTO_RECORD_INTERVAL_MS) {
  if (lastSaveAt == null) return 0;
  return Math.max(0, intervalMs - (Date.now() - lastSaveAt));
}

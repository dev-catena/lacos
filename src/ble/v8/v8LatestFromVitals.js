/**
 * Snapshot da aba Pulseira a partir de GET /vital-signs.
 */

const TYPES = [
  'heart_rate',
  'oxygen_saturation',
  'blood_pressure',
  'temperature',
  'sleep',
  'ecg',
];

export function isWearableVitalRow(row) {
  const notes = String(row?.notes || '');
  const wname = String(row?.wearable_name || '');
  return /wearable/i.test(notes) || /v8/i.test(notes) || /v5/i.test(notes) || /wearable/i.test(wname) || /v8/i.test(wname) || /v5/i.test(wname);
}

function unwrapValue(value) {
  if (value == null) return value;
  if (Array.isArray(value) && value.length === 1 && (typeof value[0] !== 'object' || value[0] === null)) {
    return value[0];
  }
  return value;
}

function toReading(row) {
  const raw = unwrapValue(row.value);
  const item = {
    value: raw,
    unit: row.unit,
    measured_at: row.measured_at,
  };
  if (row.type === 'blood_pressure' && raw && typeof raw === 'object') {
    item.systolic = Number(raw.systolic);
    item.diastolic = Number(raw.diastolic);
  } else if (row.type === 'blood_pressure' && typeof raw === 'string' && raw.includes('/')) {
    const [sys, dia] = raw.split('/').map((v) => parseInt(v, 10));
    item.systolic = sys;
    item.diastolic = dia;
  }
  if (row.type === 'ecg' && raw && typeof raw === 'object') {
    item.heart_rate = raw.heart_rate ?? raw.heartRate ?? null;
    item.hrv = raw.hrv ?? null;
    item.stress = raw.stress ?? null;
    item.samples = raw.samples ?? null;
  }
  return item;
}

function fillLatest(target, rows) {
  for (const row of rows) {
    const type = row.type;
    if (!Object.prototype.hasOwnProperty.call(target, type) || target[type]) continue;
    target[type] = toReading(row);
  }
}

export function latestFromVitalRows(rows) {
  const list = Array.isArray(rows) ? rows : [];
  const sorted = [...list].sort(
    (a, b) => new Date(b.measured_at || 0) - new Date(a.measured_at || 0),
  );
  const wearable = sorted.filter(isWearableVitalRow);

  const latest = Object.fromEntries(TYPES.map((t) => [t, null]));
  fillLatest(latest, wearable);

  const ownerRow = wearable.find((row) => row.recorded_by != null) || null;

  return {
    latest,
    recordedBy: ownerRow?.recorded_by != null ? Number(ownerRow.recorded_by) : null,
    recordedByName: ownerRow?.measured_by_name || null,
    hasWearable: wearable.length > 0,
    hasAny: wearable.length > 0,
  };
}

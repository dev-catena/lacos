import moment from 'moment';

function unwrapArray(data) {
  if (data == null) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'object') {
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.records)) return data.records;
    if (Array.isArray(data.list)) return data.list;
    if (Array.isArray(data.content)) return data.content;
    if (Array.isArray(data.results)) return data.results;
    if (Array.isArray(data.values)) return data.values;
    if (Array.isArray(data.oxygenLevels)) return data.oxygenLevels;
    if (Array.isArray(data.oxygen_levels)) return data.oxygen_levels;
    if (Array.isArray(data.bodyTemperatures)) return data.bodyTemperatures;
    if (Array.isArray(data.body_temperatures)) return data.body_temperatures;
  }
  return [];
}

/**
 * Quando o endpoint devolve um único objeto de leitura (em vez de array).
 */
function asRowsIfSingleReading(data, rowPredicate) {
  if (data == null || typeof data !== 'object' || Array.isArray(data)) {
    return [];
  }
  if (typeof rowPredicate === 'function' && rowPredicate(data)) {
    return [data];
  }
  return [];
}

function pickTimestamp(row) {
  if (!row || typeof row !== 'object') return null;
  const keys = [
    'measuredAt',
    'measured_at',
    'timestamp',
    'time',
    'date',
    'createdAt',
    'created_at',
    'recordTime',
    'record_time',
    'datetime',
    'dateTime',
  ];
  for (const k of keys) {
    if (row[k] != null && row[k] !== '') return row[k];
  }
  return null;
}

function toMeasuredAtIso(ts) {
  if (ts == null) return moment().toISOString();
  if (typeof ts === 'number') {
    const d = ts > 1e12 ? moment(ts) : moment(ts * 1000);
    return d.isValid() ? d.toISOString() : moment().toISOString();
  }
  const d = moment(ts);
  return d.isValid() ? d.toISOString() : moment().toISOString();
}

function parseHeartRateRow(row) {
  const v =
    row.heartRate ??
    row.heart_rate ??
    row.bpm ??
    row.rate ??
    row.pulse ??
    row.value ??
    row.hr;
  if (v == null || v === '') return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

function parseBpRow(row) {
  if (row.systolic != null && row.diastolic != null) {
    const s = parseFloat(row.systolic);
    const d = parseFloat(row.diastolic);
    if (Number.isFinite(s) && Number.isFinite(d)) return { systolic: s, diastolic: d };
  }
  const s = row.bloodPressureSystolic ?? row.systolicPressure ?? row.high;
  const d = row.bloodPressureDiastolic ?? row.diastolicPressure ?? row.low;
  if (s != null && d != null) {
    const sy = parseFloat(s);
    const di = parseFloat(d);
    if (Number.isFinite(sy) && Number.isFinite(di)) return { systolic: sy, diastolic: di };
  }
  const str = row.bloodPressure ?? row.bp ?? row.pressure;
  if (typeof str === 'string' && str.includes('/')) {
    const parts = str.split('/').map((x) => parseFloat(x.trim()));
    if (parts.length >= 2 && parts.every((n) => Number.isFinite(n))) {
      return { systolic: parts[0], diastolic: parts[1] };
    }
  }
  return null;
}

function parseOxygenRow(row) {
  if (!row || typeof row !== 'object') return null;

  const candidates = [
    row.spo2,
    row.SpO2,
    row.SPO2,
    row.SP02,
    row.bloodOxygen,
    row.blood_oxygen,
    row.bloodOxygenPercent,
    row.blood_oxygen_percent,
    row.oxygenLevel,
    row.oxygen_level,
    row.oxygenSaturation,
    row.oxygen_saturation,
    row.oxygenPercent,
    row.oxygen_percent,
    row.oxygen,
    row.o2,
    row.oTwo,
    row.value,
    row.percent,
    row.saturation,
    row.nivelOxigenio,
    row.spO2,
    row.latestSpo2,
    row.latest_spo2,
  ];

  for (const nested of [row.reading, row.measurement, row.payload, row.values, row.attributes, row.data]) {
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      const inner = parseOxygenRow(nested);
      if (inner != null) return inner;
    }
  }

  for (const v of candidates) {
    if (v == null || v === '') continue;
    const n = parseFloat(v);
    if (Number.isFinite(n) && n >= 0 && n <= 100) {
      return n;
    }
    if (Number.isFinite(n) && n > 100 && n <= 1000) {
      return n / 10;
    }
  }

  for (const k of Object.keys(row)) {
    const lk = k.toLowerCase();
    if (!lk.includes('oxygen') && !lk.includes('spo2') && !lk.includes('o2') && !lk.includes('saturation')) {
      continue;
    }
    const v = row[k];
    if (v == null || v === '') continue;
    if (typeof v === 'number' && Number.isFinite(v)) {
      const x = v >= 0 && v <= 100 ? v : v > 100 && v <= 1000 ? v / 10 : null;
      if (x != null) return x;
      continue;
    }
    const n = parseFloat(v);
    if (Number.isFinite(n) && n >= 0 && n <= 100) return n;
  }

  if (Array.isArray(row.values) && row.values.length) {
    for (const el of row.values) {
      if (el != null && typeof el === 'object' && !Array.isArray(el)) {
        const inner = parseOxygenRow(el);
        if (inner != null) return inner;
      }
      const n = parseFloat(el);
      if (Number.isFinite(n) && n >= 0 && n <= 100) return n;
    }
  }

  return null;
}

function parseTemperatureRow(row) {
  if (!row || typeof row !== 'object') return null;

  const candidates = [
    row.temperature,
    row.bodyTemperature,
    row.body_temperature,
    row.temp,
    row.skinTemperature,
    row.skin_temperature,
    row.value,
  ];

  for (const nested of [row.reading, row.measurement, row.payload, row.data]) {
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      const inner = parseTemperatureRow(nested);
      if (inner != null) return inner;
    }
  }

  for (const v of candidates) {
    if (v == null || v === '') continue;
    const n = parseFloat(v);
    if (!Number.isFinite(n)) continue;
    // Alguns dispositivos enviam Fahrenheit (ex.: 98.6)
    if (n > 60 && n <= 120) {
      return Math.round(((n - 32) * (5 / 9)) * 10) / 10;
    }
    if (n >= 30 && n <= 45) return n;
    if (n > 0 && n < 30) return n;
  }

  for (const k of Object.keys(row)) {
    const lk = k.toLowerCase();
    if (!lk.includes('temp')) continue;
    const n = parseFloat(row[k]);
    if (Number.isFinite(n) && n >= 30 && n <= 120) {
      if (n > 60 && n <= 120) {
        return Math.round(((n - 32) * (5 / 9)) * 10) / 10;
      }
      return n;
    }
  }

  return null;
}

function collectTemperatureRows(health) {
  const rows = [...sectionData(health, 'body_temperatures')];

  const comp = health?.comprehensive_health;
  if (comp?.ok && comp.data != null && typeof comp.data === 'object') {
    const c = comp.data;
    rows.push(...unwrapArray(c.bodyTemperatures));
    rows.push(...unwrapArray(c.body_temperatures));
    rows.push(...unwrapArray(c.temperatures));
    rows.push(...asRowsIfSingleReading(c, (o) => parseTemperatureRow(o) != null));
  }

  return rows;
}

function rowsToChartPoints(rows, valueParser) {
  const out = [];
  for (const row of rows) {
    const value = valueParser(row);
    if (value == null) continue;
    const ts = pickTimestamp(row);
    out.push({
      measured_at: toMeasuredAtIso(ts),
      value,
      measured_by_name: 'Relógio',
      wearable_name: 'Thalamus',
    });
  }
  out.sort((a, b) => new Date(a.measured_at) - new Date(b.measured_at));
  const seen = new Set();
  const deduped = [];
  for (const p of out) {
    const k = `${p.measured_at}|${JSON.stringify(p.value)}`;
    if (seen.has(k)) continue;
    seen.add(k);
    deduped.push(p);
  }
  return deduped;
}

function sectionData(health, key) {
  const part = health && health[key];
  if (!part || !part.ok) return [];
  return unwrapArray(part.data);
}

function collectOxygenRows(health) {
  const rows = [];
  const part = health?.oxygen_levels;
  if (part?.ok && part.data != null) {
    if (typeof part.data === 'number' && Number.isFinite(part.data)) {
      const raw = part.data;
      const n = raw > 100 && raw <= 1000 ? raw / 10 : raw;
      if (n >= 0 && n <= 100) {
        rows.push({ value: n });
      }
    } else if (typeof part.data === 'string') {
      const n = parseFloat(String(part.data).replace('%', '').replace(',', '.').trim());
      if (Number.isFinite(n) && n >= 0 && n <= 100) {
        rows.push({ value: n });
      }
    } else {
      rows.push(...unwrapArray(part.data));
      if (rows.length === 0) {
        rows.push(...asRowsIfSingleReading(part.data, (o) => parseOxygenRow(o) != null));
      }
      if (rows.length === 0 && typeof part.data === 'object' && !Array.isArray(part.data)) {
        const d = part.data;
        const nestedKeys = [
          'oxygenLevels',
          'oxygen_levels',
          'readings',
          'history',
          'list',
          'items',
          'lastReading',
          'last',
          'latest',
          'current',
        ];
        for (const nk of nestedKeys) {
          if (d[nk] == null) continue;
          const inner = unwrapArray(d[nk]);
          if (inner.length) rows.push(...inner);
          else rows.push(...asRowsIfSingleReading(d[nk], (o) => parseOxygenRow(o) != null));
        }
      }
    }
  }

  const comp = health?.comprehensive_health;
  if (comp?.ok && comp.data != null && typeof comp.data === 'object') {
    const c = comp.data;
    rows.push(...unwrapArray(c.oxygenLevels));
    rows.push(...unwrapArray(c.oxygen_levels));
    rows.push(...unwrapArray(c.spo2History));
    rows.push(...asRowsIfSingleReading(c, (o) => parseOxygenRow(o) != null));
  }

  return rows;
}

function computeBasalForNumeric(points) {
  if (!points.length) return null;
  const values = points.map((p) => {
    const v = p.value;
    return typeof v === 'number' ? v : parseFloat(v) || 0;
  });
  const sum = values.reduce((a, b) => a + b, 0);
  return sum / values.length;
}

function computeBasalBp(points) {
  if (!points.length) return null;
  const sys = [];
  const dia = [];
  for (const p of points) {
    const v = p.value;
    if (v && typeof v === 'object' && v.systolic != null && v.diastolic != null) {
      sys.push(parseFloat(v.systolic));
      dia.push(parseFloat(v.diastolic));
    }
  }
  if (!sys.length) return null;
  return {
    systolic: Math.round(sys.reduce((a, b) => a + b, 0) / sys.length),
    diastolic: Math.round(dia.reduce((a, b) => a + b, 0) / dia.length),
  };
}

function parseFallRow(row) {
  const ts = pickTimestamp(row);
  const msg =
    row.message ??
    row.description ??
    row.alert ??
    row.type ??
    row.reason ??
    'Alerta de queda';
  return {
    measured_at: toMeasuredAtIso(ts),
    value: typeof msg === 'string' ? msg : JSON.stringify(msg),
    measured_by_name: 'Relógio',
    wearable_name: 'Thalamus',
  };
}

/** Linha genérica para ECG, sono, etc. (Thalamus health/…). */
function formatWatchExtraRow(row) {
  if (row == null) {
    return {
      measured_at: moment().toISOString(),
      value: '—',
      measured_by_name: 'Relógio',
      wearable_name: 'Thalamus',
    };
  }
  const ts = pickTimestamp(row);
  const text =
    typeof row === 'string' || typeof row === 'number'
      ? String(row)
      : summarizeComprehensive(row) || JSON.stringify(row).slice(0, 800);
  return {
    measured_at: toMeasuredAtIso(ts),
    value: text,
    measured_by_name: 'Relógio',
    wearable_name: 'Thalamus',
  };
}

function summarizeComprehensive(data) {
  if (data == null) return null;
  if (typeof data === 'string') return data;
  if (Array.isArray(data)) return null;
  if (typeof data !== 'object') return String(data);
  const lines = [];
  const skip = new Set(['data', 'items', 'records']);
  for (const [k, v] of Object.entries(data)) {
    if (skip.has(k)) continue;
    if (v == null) continue;
    if (typeof v === 'object' && !Array.isArray(v)) {
      lines.push(`${k}: ${JSON.stringify(v).slice(0, 120)}${JSON.stringify(v).length > 120 ? '…' : ''}`);
    } else if (Array.isArray(v)) {
      lines.push(`${k}: [${v.length} itens]`);
    } else {
      lines.push(`${k}: ${v}`);
    }
    if (lines.length >= 12) break;
  }
  return lines.length ? lines.join('\n') : null;
}

/**
 * Converte o objeto `health` retornado por GET /groups/:id/smartwatch-health
 * em séries compatíveis com VitalSignsLineChart e modais.
 */
export function buildWatchVitalData(health) {
  const endpointErrors = [];
  if (health && typeof health === 'object') {
    for (const key of Object.keys(health)) {
      const part = health[key];
      if (part && part.ok === false) {
        endpointErrors.push({ key, status: part.status || 0 });
      }
    }
  }

  const hrRows = [
    ...sectionData(health, 'heart_rates'),
    ...sectionData(health, 'heartbeats'),
  ];
  const heart_rate = rowsToChartPoints(hrRows, parseHeartRateRow);

  const bpRows = sectionData(health, 'blood_pressures');
  const blood_pressure = rowsToChartPoints(bpRows, parseBpRow);

  const oxRows = collectOxygenRows(health);
  const oxygen_saturation = rowsToChartPoints(oxRows, parseOxygenRow);

  const tempRows = collectTemperatureRows(health);
  const temperature = rowsToChartPoints(tempRows, parseTemperatureRow);

  const fallRows = sectionData(health, 'fall_down_alerts');
  const fallAlerts = fallRows.map(parseFallRow).sort(
    (a, b) => new Date(b.measured_at) - new Date(a.measured_at)
  );

  const ecgRows = sectionData(health, 'ecg_data');
  const ecgList = ecgRows
    .map(formatWatchExtraRow)
    .sort((a, b) => new Date(b.measured_at) - new Date(a.measured_at));

  const sleepSessionRows = sectionData(health, 'sleep_sessions');
  const sleepSessionsList = sleepSessionRows
    .map(formatWatchExtraRow)
    .sort((a, b) => new Date(b.measured_at) - new Date(a.measured_at));

  const sleepEntryRows = sectionData(health, 'sleep_entries');
  const sleepEntriesList = sleepEntryRows
    .map(formatWatchExtraRow)
    .sort((a, b) => new Date(b.measured_at) - new Date(a.measured_at));

  const comp = health?.comprehensive_health;
  let comprehensiveRaw = comp && comp.ok ? comp.data : null;
  let comprehensiveText = summarizeComprehensive(comprehensiveRaw);

  const basalValues = {
    heart_rate: computeBasalForNumeric(heart_rate),
    blood_pressure: computeBasalBp(blood_pressure),
    oxygen_saturation: computeBasalForNumeric(oxygen_saturation),
    temperature: computeBasalForNumeric(temperature),
  };

  return {
    heart_rate,
    blood_pressure,
    oxygen_saturation,
    temperature,
    fallAlerts,
    ecgList,
    sleepSessionsList,
    sleepEntriesList,
    comprehensiveRaw,
    comprehensiveText,
    basalValues,
    endpointErrors,
  };
}

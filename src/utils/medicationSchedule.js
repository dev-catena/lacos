/**
 * API pode enviar `times` como array, string JSON ou vazio; `schedule` em frequency.details idem.
 * @returns {string[]} horários no formato HH:mm
 */
export function normalizeMedicationSchedule(timesRaw, scheduleFromDetails) {
  const coerce = (val) => {
    if (val == null || val === '') return [];
    if (Array.isArray(val)) {
      return val
        .map((t) => (t != null ? String(t).trim() : ''))
        .filter((s) => s.length > 0)
        .map((s) => (s.length >= 5 ? s.substring(0, 5) : s));
    }
    if (typeof val === 'string') {
      const t = val.trim();
      if (!t) return [];
      if (t.startsWith('[')) {
        try {
          return coerce(JSON.parse(t));
        } catch {
          return [];
        }
      }
      if (/^\d{1,2}:\d{2}/.test(t)) {
        return [t.substring(0, 5)];
      }
      return [];
    }
    return [];
  };
  const fromTimes = coerce(timesRaw);
  if (fromTimes.length > 0) return fromTimes;
  return coerce(scheduleFromDetails);
}

/**
 * Monta lista de horários a partir do registro da API (times, frequency.details.schedule, time legado).
 */
export function buildScheduleFromMedicationApi(med, frequencyDetails = {}) {
  const list = normalizeMedicationSchedule(med?.times, frequencyDetails?.schedule);
  if (list.length > 0) return list;
  if (med?.time != null && String(med.time).trim() !== '') {
    return normalizeMedicationSchedule(med.time, null);
  }
  return [];
}

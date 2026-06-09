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

export function timeToMinutes(timeStr) {
  const [h, m] = String(timeStr || '0:0').split(':').map((v) => parseInt(v, 10));
  if (!Number.isFinite(h)) return 0;
  return h * 60 + (Number.isFinite(m) ? m : 0);
}

/**
 * Converte horário do cronograma em Date no calendário correto.
 * Ex.: ciclo 08:00 → 16:00 → 00:00: o 00:00 é fim do dia (madrugada), não início.
 */
export function resolveScheduleDateTime(scheduleTime, scheduleList, referenceDate = new Date()) {
  const [hours, minutes] = String(scheduleTime).split(':').map((v) => parseInt(v, 10));
  const ref = new Date(referenceDate);
  const scheduled = new Date(
    ref.getFullYear(),
    ref.getMonth(),
    ref.getDate(),
    Number.isFinite(hours) ? hours : 0,
    Number.isFinite(minutes) ? minutes : 0,
    0,
    0
  );

  const list = Array.isArray(scheduleList) ? scheduleList.filter(Boolean) : [];
  if (list.length > 1) {
    const anchorMinutes = timeToMinutes(list[0]);
    const slotMinutes = timeToMinutes(scheduleTime);
    if (slotMinutes < anchorMinutes) {
      scheduled.setDate(scheduled.getDate() + 1);
    }
  }

  return scheduled;
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

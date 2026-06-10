import colors from '../constants/colors';
import {
  getLocalDateKey,
  normalizeScheduleTime,
  resolveScheduleDateTime,
  timeToMinutes,
} from './medicationSchedule';

export const DOSE_HISTORY_STORAGE_KEY = '@lacos_dose_history';

export function getScheduledDayKey(scheduleTime, scheduleList, referenceDate = new Date()) {
  return getLocalDateKey(resolveScheduleDateTime(scheduleTime, scheduleList, referenceDate));
}

export function findDoseRecordForSlot(
  doseHistory,
  medicationId,
  scheduleTime,
  scheduleList,
  referenceDate = new Date()
) {
  const history = Array.isArray(doseHistory) ? doseHistory : [];
  const scheduledDay = getScheduledDayKey(scheduleTime, scheduleList, referenceDate);
  const normalizedSlot = normalizeScheduleTime(scheduleTime);

  return history.find((record) => {
    if (medicationId != null && String(record.medicationId) !== String(medicationId)) {
      return false;
    }
    if (normalizeScheduleTime(record.scheduledTime) !== normalizedSlot) {
      return false;
    }
    const recordDay = record.scheduledDate || getLocalDateKey(record.takenAt);
    return recordDay === scheduledDay;
  });
}

export function filterDoseHistoryForMedication(doseHistory, medicationId) {
  return (Array.isArray(doseHistory) ? doseHistory : []).filter(
    (record) => String(record.medicationId) === String(medicationId)
  );
}

export function upsertDoseRecord(history, doseRecord, scheduleList, referenceDate = new Date()) {
  const allHistory = Array.isArray(history) ? [...history] : [];
  const scheduledDay =
    doseRecord.scheduledDate ||
    getScheduledDayKey(doseRecord.scheduledTime, scheduleList, referenceDate);
  const normalizedSlot = normalizeScheduleTime(doseRecord.scheduledTime);

  const filteredHistory = allHistory.filter((record) => {
    if (String(record.medicationId) !== String(doseRecord.medicationId)) {
      return true;
    }
    if (normalizeScheduleTime(record.scheduledTime) !== normalizedSlot) {
      return true;
    }
    const recordDay = record.scheduledDate || getLocalDateKey(record.takenAt);
    return recordDay !== scheduledDay;
  });

  filteredHistory.push({
    ...doseRecord,
    scheduledDate: scheduledDay,
    scheduledTime: normalizedSlot,
  });

  return filteredHistory;
}

/**
 * Status da dose de um horário (lista e detalhe do medicamento).
 */
export function computeDoseStatus(scheduleTime, scheduleList, doseHistory, medicationId) {
  const now = new Date();
  const list = Array.isArray(scheduleList) ? scheduleList : [];
  const scheduledDateTime = resolveScheduleDateTime(scheduleTime, list, now);
  const recordToday = findDoseRecordForSlot(doseHistory, medicationId, scheduleTime, list, now);

  if (recordToday && recordToday.status === 'not_administered') {
    return {
      status: 'not_administered',
      color: colors.error,
      icon: 'close-circle',
      label: recordToday.justification || 'Não administrado',
    };
  }

  if (recordToday && recordToday.status === 'taken') {
    return {
      status: 'taken',
      color: colors.success,
      icon: 'checkmark-circle',
      label: `Tomado às ${new Date(recordToday.takenAt).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      })}`,
    };
  }

  const thirtyMinAfter = new Date(scheduledDateTime.getTime() + 30 * 60000);
  if (now > thirtyMinAfter) {
    return {
      status: 'missed',
      color: colors.error,
      icon: 'alert-circle',
      label: 'Atrasado',
    };
  }

  const fifteenMinBefore = new Date(scheduledDateTime.getTime() - 15 * 60000);
  if (now >= fifteenMinBefore && now <= thirtyMinAfter) {
    return {
      status: 'due',
      color: colors.warning,
      icon: 'time',
      label: 'Hora de tomar',
    };
  }

  const isOvernight =
    scheduleTime === '00:00' &&
    list.length > 1 &&
    timeToMinutes(scheduleTime) < timeToMinutes(list[0]);

  return {
    status: 'pending',
    color: colors.gray400,
    icon: 'time-outline',
    label: isOvernight ? 'Agendado (madrugada)' : 'Agendado',
  };
}

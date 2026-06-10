import colors from '../constants/colors';
import { resolveScheduleDateTime, timeToMinutes } from './medicationSchedule';

export const DOSE_HISTORY_STORAGE_KEY = '@lacos_dose_history';

/**
 * Status da dose de um horário (lista e detalhe do medicamento).
 */
export function computeDoseStatus(scheduleTime, scheduleList, doseHistory, medicationId) {
  const now = new Date();
  const list = Array.isArray(scheduleList) ? scheduleList : [];
  const history = Array.isArray(doseHistory) ? doseHistory : [];
  const scheduledDateTime = resolveScheduleDateTime(scheduleTime, list, now);
  const scheduledDay = scheduledDateTime.toISOString().split('T')[0];

  const recordToday = history.find((h) => {
    if (medicationId != null && String(h.medicationId) !== String(medicationId)) {
      return false;
    }
    const hDate = new Date(h.takenAt);
    return hDate.toISOString().split('T')[0] === scheduledDay && h.scheduledTime === scheduleTime;
  });

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

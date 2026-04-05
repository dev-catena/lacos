function paymentStatusNormalized(appointment) {
  const raw = appointment?.payment_status ?? appointment?.paymentStatus;
  if (raw == null || raw === '') {
    return '';
  }
  return String(raw).trim().toLowerCase();
}

/**
 * Indica se o compromisso é teleconsulta (API pode mandar boolean, 1/0, string, camelCase ou objeto aninhado).
 * Se a flag vier ausente, infere por reserva de pagamento (fluxo de teleconsulta no backend).
 */
export function isTeleconsultAppointment(appointment) {
  if (!appointment || typeof appointment !== 'object') {
    return false;
  }
  const v =
    appointment.is_teleconsultation ??
    appointment.isTeleconsultation ??
    appointment.data?.is_teleconsultation ??
    appointment.data?.isTeleconsultation;
  if (v === true || v === 1) {
    return true;
  }
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (s === '1' || s === 'true' || s === 'yes') {
      return true;
    }
    if (s === '0' || s === 'false' || s === 'no' || s === '') {
      return false;
    }
  }
  if (v === false || v === 0) {
    return false;
  }
  const ru = appointment.reserved_until;
  const hasReserved = ru != null && String(ru).trim() !== '';
  if (hasReserved) {
    const ps = paymentStatusNormalized(appointment);
    if (ps === 'pending' || ps === '') {
      return true;
    }
  }
  return false;
}

/**
 * Mesma regra de `Appointment::teleconsultationSlotStillOccupied` no Laravel:
 * enquanto a teleconsulta não estiver cancelada/reembolsada, o slot continua ocupado
 * (incluindo pending após o fim de `reserved_until`, para alinhar lista de disponibilidade e criação).
 */
export function teleconsultationSlotStillOccupied(appointment, _nowMs = Date.now()) {
  if (!isTeleconsultAppointment(appointment)) {
    return false;
  }
  const st = appointment.status;
  if (st === 'cancelled' || st === 'cancelada') {
    return false;
  }
  const ps = paymentStatusNormalized(appointment);
  if (ps === 'refunded') {
    return false;
  }
  return true;
}

/**
 * Texto na agenda do médico para um horário já ocupado (teleconsulta: pagamento; presencial: genérico).
 */
export function getDoctorAgendaSlotBookingLabel(appointment) {
  if (!appointment) {
    return 'Agendado';
  }
  if (!isTeleconsultAppointment(appointment)) {
    return 'Agendado (presencial)';
  }
  const ps = paymentStatusNormalized(appointment);
  if (ps === 'refunded') {
    return 'Agendado';
  }
  if (ps === 'pending' || ps === '') {
    return 'Agendado — aguardando pagamento';
  }
  return 'Agendado — pago';
}

/**
 * Pagamento suficiente para o médico iniciar a videochamada (não basta reserva pending).
 */
export function isTeleconsultPaidForVideoStart(appointment) {
  if (!isTeleconsultAppointment(appointment)) {
    return true;
  }
  const ps = paymentStatusNormalized(appointment);
  if (ps === 'refunded') {
    return false;
  }
  return ps === 'paid_held' || ps === 'paid' || ps === 'released';
}

/** Alinhado a `AppointmentController::videoJoin` — 15 min antes até 40 min após o horário. */
export const TELECONSULT_VIDEO_JOIN_MINUTES_BEFORE = 15;
export const TELECONSULT_VIDEO_JOIN_MINUTES_AFTER = 40;

function teleconsultScheduledMs(appointment) {
  const dateStr = appointment?.appointment_date || appointment?.scheduled_at;
  if (!dateStr) {
    return null;
  }
  const t = new Date(dateStr).getTime();
  return Number.isNaN(t) ? null : t;
}

/** Dentro da janela permitida para o médico entrar na videochamada (só teleconsulta). */
export function isWithinTeleconsultVideoJoinWindow(appointment, nowMs = Date.now()) {
  if (!isTeleconsultAppointment(appointment)) {
    return false;
  }
  const scheduled = teleconsultScheduledMs(appointment);
  if (scheduled == null) {
    return false;
  }
  const start = scheduled - TELECONSULT_VIDEO_JOIN_MINUTES_BEFORE * 60 * 1000;
  const end = scheduled + TELECONSULT_VIDEO_JOIN_MINUTES_AFTER * 60 * 1000;
  return nowMs >= start && nowMs <= end;
}

/** Horário da videochamada já passou (após início + 40 min). */
export function isTeleconsultVideoJoinWindowExpired(appointment, nowMs = Date.now()) {
  if (!isTeleconsultAppointment(appointment)) {
    return false;
  }
  const scheduled = teleconsultScheduledMs(appointment);
  if (scheduled == null) {
    return true;
  }
  const end = scheduled + TELECONSULT_VIDEO_JOIN_MINUTES_AFTER * 60 * 1000;
  return nowMs > end;
}

/**
 * Teleconsulta já ocorreu (horário passou), pagamento em custódia — falta confirmação do paciente/cuidador para liberar honorários.
 */
export function isTeleconsultAwaitingHonorariumConfirmation(item, nowMs = Date.now()) {
  if (!isTeleconsultAppointment(item)) {
    return false;
  }
  const st = item.status;
  if (st === 'cancelled' || st === 'cancelada') {
    return false;
  }
  const ps = paymentStatusNormalized(item);
  if (ps !== 'paid_held') {
    return false;
  }
  const dateStr = item.appointment_date || item.scheduled_at || item.date;
  if (!dateStr) {
    return false;
  }
  const t = new Date(dateStr).getTime();
  if (Number.isNaN(t)) {
    return false;
  }
  return t <= nowMs;
}

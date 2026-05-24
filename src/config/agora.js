/**
 * Configuração Agora.io para videoconferência (teleconsulta).
 * Em modo Testing no console Agora, token vazio é aceito.
 */
export const AGORA_APP_ID = '75ae244af79944a18a059d2fcb18c1dc';

/** Canal único por consulta — médico e paciente usam o mesmo nome. */
export function getTeleconsultChannelName(appointmentId) {
  if (!appointmentId) return `consulta-${Date.now()}`;
  return `consulta-${appointmentId}`;
}

/** UID numérico estável para o Agora (1 .. 2^32-1). */
export function toAgoraUid(userId) {
  const n = Number(userId);
  if (!Number.isFinite(n) || n <= 0) {
    return Math.floor(Math.random() * 900000) + 100000;
  }
  return n % 2147483647 || 1;
}

/** ID numérico da consulta (ignora sufixo de instância recorrente, ex.: 89_2025-05-26). */
export function resolveAppointmentIdForVideo(appointmentId) {
  if (appointmentId == null || appointmentId === '') {
    return null;
  }
  const base = String(appointmentId).split('_')[0];
  const n = parseInt(base, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

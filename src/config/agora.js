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

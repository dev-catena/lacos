/**
 * Registro do handler de medição remota no app do paciente.
 * O cuidador dispara via API/WebSocket; o painel BLE do paciente executa.
 */

let handler = null;

export function registerBraceletRemoteMeasureHandler(next) {
  handler = typeof next === 'function' ? next : null;
  return () => {
    if (handler === next) handler = null;
  };
}

export function getBraceletRemoteMeasureHandler() {
  return handler;
}

export async function dispatchBraceletRemoteMeasure(payload) {
  if (!handler) {
    console.warn('[braceletRemote] nenhum handler registrado (app do paciente sem painel BLE?)');
    return { success: false, error: 'Pulseira não está pronta neste celular.' };
  }
  return handler(payload);
}

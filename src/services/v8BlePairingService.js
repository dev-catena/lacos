import apiService from './apiService';

function wrapPairingError(e, fallbackMessage) {
  const err = e instanceof Error ? e : new Error(e?.message || fallbackMessage);
  err.status = e?.status || err.status;
  return err;
}

/** Gateway antigo: rota ainda não existe (404 Laravel) ou tabela ausente (503). */
export function isV8BlePairingUnavailable(error) {
  const status = error?.status;
  const msg = String(error?.message || '');
  return (
    status === 404 ||
    status === 503 ||
    /could not be found/i.test(msg) ||
    /v8-ble-pairing/i.test(msg)
  );
}

/**
 * Vínculo da pulseira BLE (V5 ou V8) ao grupo (um dono; demais membros só visualizam).
 */
export async function getV8BlePairing(groupId) {
  try {
    const res = await apiService.get(`/groups/${groupId}/v8-ble-pairing`);
    if (!res?.success) {
      throw wrapPairingError(res, 'Não foi possível carregar o vínculo da pulseira.');
    }
  return {
    pairing: res.pairing || null,
    isOwner: !!res.is_owner,
    isPatient: !!res.is_patient,
    canConnect: !!res.can_connect,
    canClaim: res.can_claim !== undefined ? !!res.can_claim : !!res.is_patient,
    canUnpair: !!res.can_unpair,
    latest: res.latest || null,
  };
  } catch (e) {
    throw wrapPairingError(e, 'Não foi possível carregar o vínculo da pulseira.');
  }
}

export async function claimV8BlePairing(groupId, braceletId, braceletName, braceletModel, batteryPercent) {
  try {
    const body = {
      bracelet_id: braceletId,
      bracelet_name: braceletName || (braceletModel === 'v5' ? 'Pulseira V5' : 'Pulseira V8'),
      bracelet_model: braceletModel === 'v5' ? 'v5' : 'v8',
    };
    if (batteryPercent != null && Number.isFinite(Number(batteryPercent))) {
      body.battery_percent = Math.max(0, Math.min(100, Math.round(Number(batteryPercent))));
    }
    const res = await apiService.put(`/groups/${groupId}/v8-ble-pairing`, body);
    if (!res?.success) {
      const err = new Error(res?.message || 'Não foi possível vincular a pulseira ao grupo.');
      err.status = res?.status;
      throw err;
    }
    return res;
  } catch (e) {
    const err = e instanceof Error ? e : new Error(e?.message || 'Não foi possível vincular a pulseira ao grupo.');
    err.status = e?.status || err.status;
    throw err;
  }
}

export async function unpairV8BlePairing(groupId) {
  const res = await apiService.delete(`/groups/${groupId}/v8-ble-pairing`);
  if (!res?.success) {
    throw new Error(res?.message || 'Não foi possível desvincular a pulseira.');
  }
  return res;
}

/** Cuidador: pede medição no celular do paciente (sem BLE local). */
export async function requestBraceletMeasure(groupId, type = 'all') {
  try {
    const res = await apiService.post(`/groups/${groupId}/v8-ble-pairing/measure`, {
      type: type === 'ecg' ? 'ecg' : 'all',
    });
    if (!res?.success) {
      throw wrapPairingError(res, 'Não foi possível solicitar a medição.');
    }
    return {
      requestId: res.request_id,
      type: res.type || type,
      message: res.message,
    };
  } catch (e) {
    throw wrapPairingError(e, 'Não foi possível solicitar a medição.');
  }
}

/** Paciente: informa o grupo que a medição remota terminou. */
export async function finishBraceletMeasure(groupId, { type, requestId, success, message }) {
  try {
    const res = await apiService.post(`/groups/${groupId}/v8-ble-pairing/measure-finished`, {
      type: type === 'ecg' ? 'ecg' : 'all',
      request_id: requestId,
      success: !!success,
      message: message || null,
    });
    return res;
  } catch (e) {
    console.warn('[v8BlePairing] finishMeasure', e?.message || e);
    return null;
  }
}

export default {
  getV8BlePairing,
  claimV8BlePairing,
  unpairV8BlePairing,
  requestBraceletMeasure,
  finishBraceletMeasure,
  isV8BlePairingUnavailable,
};

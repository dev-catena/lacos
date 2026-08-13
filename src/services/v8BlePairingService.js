import apiService from './apiService';

/**
 * Vínculo da pulseira V8 BLE ao grupo (um dono; demais membros só visualizam).
 */
export async function getV8BlePairing(groupId) {
  const res = await apiService.get(`/groups/${groupId}/v8-ble-pairing`);
  if (!res?.success) {
    throw new Error(res?.message || 'Não foi possível carregar o vínculo da pulseira.');
  }
  return {
    pairing: res.pairing || null,
    isOwner: !!res.is_owner,
    canConnect: !!res.can_connect,
    canUnpair: !!res.can_unpair,
    latest: res.latest || null,
  };
}

export async function claimV8BlePairing(groupId, braceletId, braceletName) {
  try {
    const res = await apiService.put(`/groups/${groupId}/v8-ble-pairing`, {
      bracelet_id: braceletId,
      bracelet_name: braceletName || 'Pulseira V8',
    });
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

export default {
  getV8BlePairing,
  claimV8BlePairing,
  unpairV8BlePairing,
};

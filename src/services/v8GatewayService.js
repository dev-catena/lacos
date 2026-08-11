import apiService from './apiService';

/**
 * Pareamento e gestão do gateway ESP32 da pulseira V8.
 */
export async function claimV8GatewayByCode(groupId, code, name) {
  const body = {
    group_id: groupId,
    code: String(code || '').trim().toUpperCase(),
  };
  if (name) body.name = name;

  const res = await apiService.post('/v8-gateways/pairing/claim', body);
  if (!res?.success) {
    throw new Error(res?.message || 'Não foi possível vincular o gateway.');
  }
  return res;
}

export async function claimV8GatewayByPairingId(pairingId, groupId, code, name) {
  const body = {
    group_id: groupId,
    code: String(code || '').trim().toUpperCase(),
  };
  if (name) body.name = name;

  const res = await apiService.post(`/v8-gateways/pairing/${pairingId}/claim`, body);
  if (!res?.success) {
    throw new Error(res?.message || 'Não foi possível vincular o gateway.');
  }
  return res;
}

export async function listV8Gateways(groupId) {
  const res = await apiService.get(`/groups/${groupId}/v8-gateways`);
  return res?.gateways || [];
}

export async function unpairV8Gateway(groupId, gatewayId) {
  const res = await apiService.delete(`/groups/${groupId}/v8-gateways/${gatewayId}`);
  if (!res?.success) {
    throw new Error(res?.message || 'Não foi possível desvincular.');
  }
  return res;
}

/** QR: { type: 'v8_gateway_pair', pairing_id, code } */
export function parseV8GatewayQr(data) {
  let parsed = data;
  if (typeof data === 'string') {
    try {
      parsed = JSON.parse(data);
    } catch {
      return null;
    }
  }
  if (!parsed || parsed.type !== 'v8_gateway_pair') return null;
  if (!parsed.pairing_id || !parsed.code) return null;
  return parsed;
}

export default {
  claimV8GatewayByCode,
  claimV8GatewayByPairingId,
  listV8Gateways,
  unpairV8Gateway,
  parseV8GatewayQr,
};

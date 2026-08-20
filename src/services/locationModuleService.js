import apiService from './apiService';

function gid(groupId) {
  return `/groups/${groupId}/location`;
}

export async function getLocationRealtime(groupId) {
  const res = await apiService.get(`${gid(groupId)}/realtime`);
  if (!res?.success) throw new Error(res?.message || 'Não foi possível carregar a localização.');
  return res;
}

export async function getLocationHistory(groupId, params = {}) {
  const qs = new URLSearchParams();
  if (params.braceletId) qs.set('bracelet_id', String(params.braceletId));
  if (params.braceletMac) qs.set('bracelet_mac', params.braceletMac);
  if (params.from) qs.set('from', params.from);
  if (params.to) qs.set('to', params.to);
  if (params.limit) qs.set('limit', String(params.limit));
  const q = qs.toString();
  const res = await apiService.get(`${gid(groupId)}/history${q ? `?${q}` : ''}`);
  if (!res?.success) throw new Error(res?.message || 'Não foi possível carregar o trajeto.');
  return res;
}

export async function listLocationGateways(groupId) {
  const res = await apiService.get(`${gid(groupId)}/gateways`);
  return res?.gateways || [];
}

export async function saveLocationGateway(groupId, payload, gatewayId) {
  if (gatewayId) {
    const res = await apiService.put(`${gid(groupId)}/gateways/${gatewayId}`, payload);
    if (!res?.success) throw new Error(res?.message || 'Falha ao atualizar gateway.');
    return res.gateway;
  }
  const res = await apiService.post(`${gid(groupId)}/gateways`, payload);
  if (!res?.success) throw new Error(res?.message || 'Falha ao cadastrar gateway.');
  return res.gateway;
}

export async function deleteLocationGateway(groupId, gatewayId) {
  const res = await apiService.delete(`${gid(groupId)}/gateways/${gatewayId}`);
  if (!res?.success) throw new Error(res?.message || 'Falha ao remover gateway.');
  return res;
}

export async function listLocationBracelets(groupId) {
  const res = await apiService.get(`${gid(groupId)}/bracelets`);
  return res?.bracelets || [];
}

export async function saveLocationBracelet(groupId, payload, braceletId) {
  if (braceletId) {
    const res = await apiService.put(`${gid(groupId)}/bracelets/${braceletId}`, payload);
    if (!res?.success) throw new Error(res?.message || 'Falha ao atualizar pulseira.');
    return res.bracelet;
  }
  const res = await apiService.post(`${gid(groupId)}/bracelets`, payload);
  if (!res?.success) throw new Error(res?.message || 'Falha ao cadastrar pulseira.');
  return res.bracelet;
}

export async function deleteLocationBracelet(groupId, braceletId) {
  const res = await apiService.delete(`${gid(groupId)}/bracelets/${braceletId}`);
  if (!res?.success) throw new Error(res?.message || 'Falha ao remover pulseira.');
  return res;
}

export async function getLocationAssignableMembers(groupId) {
  const res = await apiService.get(`${gid(groupId)}/assignable-members`);
  return res?.members || [];
}

export default {
  getLocationRealtime,
  getLocationHistory,
  listLocationGateways,
  saveLocationGateway,
  deleteLocationGateway,
  listLocationBracelets,
  saveLocationBracelet,
  deleteLocationBracelet,
  getLocationAssignableMembers,
};

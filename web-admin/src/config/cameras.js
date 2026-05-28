import { API_BASE_URL } from './api';

/** URL do snapshot via proxy Laravel (autenticado — não usar direto no `<img>`). */
export function getCameraSnapshotProxyPath(cameraId) {
  const id = encodeURIComponent(String(cameraId || '').trim());
  return `${API_BASE_URL}/admin/rtmp/cameras/${id}/snapshot`;
}

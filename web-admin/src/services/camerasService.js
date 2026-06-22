import { API_BASE_URL } from '../config/api';

class CamerasService {
  getHeaders(accept = 'application/json') {
    const token = localStorage.getItem('@lacos:token');
    return {
      Accept: accept,
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async getUsersCamerasOverview() {
    const token = localStorage.getItem('@lacos:token');
    if (!token) {
      throw new Error('Token de autenticação não encontrado. Faça login novamente.');
    }

    const response = await fetch(`${API_BASE_URL}/admin/users/cameras-overview`, {
      method: 'GET',
      headers: this.getHeaders(),
      mode: 'cors',
    });

    if (response.status === 401) {
      throw new Error('Não autenticado. Faça login novamente.');
    }

    if (response.status === 403) {
      throw new Error('Acesso negado. Você precisa ter permissão de root.');
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || data.error || `Erro ao buscar usuários (HTTP ${response.status})`);
    }

    return Array.isArray(data.users) ? data.users : [];
  }

  async getCameras() {
    const token = localStorage.getItem('@lacos:token');
    if (!token) {
      throw new Error('Token de autenticação não encontrado. Faça login novamente.');
    }

    const response = await fetch(`${API_BASE_URL}/admin/rtmp/cameras`, {
      method: 'GET',
      headers: this.getHeaders(),
      mode: 'cors',
    });

    if (response.status === 401) {
      throw new Error('Não autenticado. Faça login novamente.');
    }

    if (response.status === 403) {
      throw new Error('Acesso negado. Você precisa ter permissão de root.');
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || data.error || `Erro ao buscar câmeras (HTTP ${response.status})`);
    }

    if (data.success === false) {
      throw new Error(data.message || 'Erro ao buscar câmeras');
    }

    return Array.isArray(data.cameras) ? data.cameras : [];
  }

  async fetchSnapshotBlob(cameraId) {
    const token = localStorage.getItem('@lacos:token');
    if (!token) {
      throw new Error('Token de autenticação não encontrado.');
    }

    const id = encodeURIComponent(String(cameraId || '').trim());
    const response = await fetch(`${API_BASE_URL}/admin/rtmp/cameras/${id}/snapshot`, {
      method: 'GET',
      headers: this.getHeaders('image/jpeg, image/*, */*'),
      mode: 'cors',
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(text || `Snapshot indisponível (HTTP ${response.status})`);
    }

    return response.blob();
  }
}

export default new CamerasService();

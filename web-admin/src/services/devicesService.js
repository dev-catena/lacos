import { API_BASE_URL } from '../config/api';

class DevicesService {
  constructor() {
    this.token = localStorage.getItem('@lacos:token');
  }

  getHeaders() {
    const token = localStorage.getItem('@lacos:token');
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  async getDeviceAssignmentGroups() {
    try {
      const headers = this.getHeaders();
      const token = localStorage.getItem('@lacos:token');

      if (!token) {
        throw new Error('Token de autenticação não encontrado. Faça login novamente.');
      }

      const url = `${API_BASE_URL}/admin/groups/device-assignment-options`;
      const response = await fetch(url, {
        method: 'GET',
        headers,
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
        throw new Error(data.message || data.error || 'Erro ao buscar grupos');
      }

      if (data.success === false) {
        throw new Error(data.message || 'Erro ao buscar grupos');
      }

      return Array.isArray(data.groups) ? data.groups : [];
    } catch (error) {
      console.error('Erro ao buscar grupos para dispositivos:', error);
      throw error;
    }
  }

  async getThalamusAuthorizedDevices() {
    try {
      const headers = this.getHeaders();
      const token = localStorage.getItem('@lacos:token');

      if (!token) {
        throw new Error('Token de autenticação não encontrado. Faça login novamente.');
      }

      const url = `${API_BASE_URL}/admin/thalamus/authorized-devices`;
      const response = await fetch(url, {
        method: 'GET',
        headers,
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
        throw new Error(
          data.message || data.error || 'Erro ao buscar relógios na API Thalamus'
        );
      }

      if (data.success === false) {
        throw new Error(data.message || 'Erro ao buscar relógios na API Thalamus');
      }

      return Array.isArray(data.devices) ? data.devices : [];
    } catch (error) {
      console.error('Erro ao buscar dispositivos Thalamus:', error);
      throw error;
    }
  }

  async getAllDevices() {
    try {
      const headers = this.getHeaders();
      const token = localStorage.getItem('@lacos:token');
      
      if (!token) {
        throw new Error('Token de autenticação não encontrado. Faça login novamente.');
      }

      const url = `${API_BASE_URL}/admin/devices`;
      const response = await fetch(url, {
        method: 'GET',
        headers: headers,
        mode: 'cors',
      });

      if (response.status === 401) {
        throw new Error('Não autenticado. Faça login novamente.');
      }

      if (response.status === 403) {
        throw new Error('Acesso negado. Você precisa ter permissão de root.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erro ao buscar dispositivos');
      }

      const data = await response.json();
      return Array.isArray(data) ? data : (data.data || data.items || []);
    } catch (error) {
      console.error('Erro ao buscar dispositivos:', error);
      throw error;
    }
  }

  async createDevice(deviceData) {
    try {
      const headers = this.getHeaders();
      const token = localStorage.getItem('@lacos:token');
      
      if (!token) {
        throw new Error('Token de autenticação não encontrado. Faça login novamente.');
      }

      const url = `${API_BASE_URL}/admin/devices`;
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(deviceData),
        mode: 'cors',
      });

      if (response.status === 401) {
        throw new Error('Não autenticado. Faça login novamente.');
      }

      if (response.status === 403) {
        throw new Error('Acesso negado. Você precisa ter permissão de root.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const first =
          errorData.errors &&
          typeof errorData.errors === 'object' &&
          Object.values(errorData.errors)[0]?.[0];
        throw new Error(
          first || errorData.message || errorData.error || 'Erro ao criar dispositivo'
        );
      }

      const data = await response.json();
      return data.device || data;
    } catch (error) {
      console.error('Erro ao criar dispositivo:', error);
      throw error;
    }
  }

  async updateDevice(deviceId, deviceData) {
    try {
      const headers = this.getHeaders();
      const token = localStorage.getItem('@lacos:token');

      if (!token) {
        throw new Error('Token de autenticação não encontrado. Faça login novamente.');
      }

      const url = `${API_BASE_URL}/admin/devices/${deviceId}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(deviceData),
        mode: 'cors',
      });

      if (response.status === 401) {
        throw new Error('Não autenticado. Faça login novamente.');
      }

      if (response.status === 403) {
        throw new Error('Acesso negado. Você precisa ter permissão de root.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const first =
          errorData.errors &&
          typeof errorData.errors === 'object' &&
          Object.values(errorData.errors)[0]?.[0];
        throw new Error(
          first || errorData.message || errorData.error || 'Erro ao atualizar dispositivo'
        );
      }

      const data = await response.json();
      return data.device || data;
    } catch (error) {
      console.error('Erro ao atualizar dispositivo:', error);
      throw error;
    }
  }

  async deleteDevice(deviceId) {
    try {
      const headers = this.getHeaders();
      const token = localStorage.getItem('@lacos:token');
      
      if (!token) {
        throw new Error('Token de autenticação não encontrado. Faça login novamente.');
      }

      const url = `${API_BASE_URL}/admin/devices/${deviceId}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: headers,
        mode: 'cors',
      });

      if (response.status === 401) {
        throw new Error('Não autenticado. Faça login novamente.');
      }

      if (response.status === 403) {
        throw new Error('Acesso negado. Você precisa ter permissão de root.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Erro ao excluir dispositivo');
      }

      return true;
    } catch (error) {
      console.error('Erro ao excluir dispositivo:', error);
      throw error;
    }
  }
}

export default new DevicesService();


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
        throw new Error(errorData.message || errorData.error || 'Erro ao criar dispositivo');
      }

      const data = await response.json();
      return data.device || data;
    } catch (error) {
      console.error('Erro ao criar dispositivo:', error);
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


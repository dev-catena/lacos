// Serviço para gerenciar médicos via API
import { API_BASE_URL } from '../config/api';

class DoctorsService {
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

  async getPendingDoctors() {
    try {
      const headers = this.getHeaders();
      const token = localStorage.getItem('@lacos:token');
      
      if (!token) {
        throw new Error('Token de autenticação não encontrado. Faça login novamente.');
      }

      const response = await fetch(`${API_BASE_URL}/admin/doctors/pending`, {
        method: 'GET',
        headers: headers,
      });

      if (response.status === 401) {
        throw new Error('Não autenticado. Faça login novamente.');
      }

      if (response.status === 403) {
        throw new Error('Acesso negado. Você precisa ter permissão de root.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          message: `Erro ${response.status}: ${response.statusText}` 
        }));
        throw new Error(errorData.message || errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      // Se a resposta for paginada, retornar apenas os dados
      return data.data || data;
    } catch (error) {
      console.error('Erro ao buscar médicos pendentes:', error);
      throw error;
    }
  }

  async getAllDoctors() {
    try {
      const headers = this.getHeaders();
      const token = localStorage.getItem('@lacos:token');
      
      if (!token) {
        throw new Error('Token de autenticação não encontrado. Faça login novamente.');
      }

      const response = await fetch(`${API_BASE_URL}/admin/doctors`, {
        method: 'GET',
        headers: headers,
      });

      if (response.status === 401) {
        throw new Error('Não autenticado. Faça login novamente.');
      }

      if (response.status === 403) {
        throw new Error('Acesso negado. Você precisa ter permissão de root.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          message: `Erro ${response.status}: ${response.statusText}` 
        }));
        throw new Error(errorData.message || errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      // Se a resposta for paginada, retornar apenas os dados
      return data.data || data;
    } catch (error) {
      console.error('Erro ao buscar médicos:', error);
      throw error;
    }
  }

  async approveDoctor(doctorId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/doctors/${doctorId}/approve`, {
        method: 'POST',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao aprovar médico');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao aprovar médico:', error);
      throw error;
    }
  }

  async rejectDoctor(doctorId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/doctors/${doctorId}/reject`, {
        method: 'POST',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao rejeitar médico');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao rejeitar médico:', error);
      throw error;
    }
  }

  async blockDoctor(doctorId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/doctors/${doctorId}/block`, {
        method: 'POST',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao bloquear médico');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao bloquear médico:', error);
      throw error;
    }
  }

  async deleteDoctor(doctorId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/doctors/${doctorId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.error || 'Erro ao excluir médico');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao excluir médico:', error);
      throw error;
    }
  }
}

export default new DoctorsService();


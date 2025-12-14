// Serviço para gerenciar usuários via API
import { API_BASE_URL } from '../config/api';

class UsersService {
  constructor() {
    this.token = localStorage.getItem('@lacos:token');
    this.onAccountBlocked = null; // Callback para quando conta é bloqueada
  }

  setAccountBlockedCallback(callback) {
    this.onAccountBlocked = callback;
  }

  getHeaders() {
    const token = localStorage.getItem('@lacos:token');
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  async getAllUsers() {
    try {
      const headers = this.getHeaders();
      const token = localStorage.getItem('@lacos:token');
      
      if (!token) {
        throw new Error('Token de autenticação não encontrado. Faça login novamente.');
      }

      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        method: 'GET',
        headers: headers,
      });

      if (response.status === 401) {
        throw new Error('Não autenticado. Faça login novamente.');
      }

      if (response.status === 403) {
        const errorData = await response.json().catch(() => ({}));
        // Verificar se é erro de conta bloqueada
        if (errorData.error === 'account_blocked') {
          // Chamar callback se estiver definido
          if (this.onAccountBlocked) {
            this.onAccountBlocked();
          }
          throw new Error('Sua conta foi bloqueada. Você foi desconectado.');
        }
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
      console.error('Erro ao buscar usuários:', error);
      throw error;
    }
  }

  async blockUser(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/block`, {
        method: 'POST',
        headers: this.getHeaders(),
      });

      if (response.status === 403) {
        const errorData = await response.json().catch(() => ({}));
        // Verificar se é erro de conta bloqueada
        if (errorData.error === 'account_blocked') {
          // Chamar callback se estiver definido
          if (this.onAccountBlocked) {
            this.onAccountBlocked();
          }
          throw new Error('Sua conta foi bloqueada. Você foi desconectado.');
        }
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao bloquear usuário');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao bloquear usuário:', error);
      throw error;
    }
  }

  async unblockUser(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/unblock`, {
        method: 'POST',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao desbloquear usuário');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao desbloquear usuário:', error);
      throw error;
    }
  }

  async getUserPlan(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/plan`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar plano do usuário');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar plano do usuário:', error);
      return null;
    }
  }

  async deleteUser(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (response.status === 403) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.error === 'account_blocked') {
          if (this.onAccountBlocked) {
            this.onAccountBlocked();
          }
          throw new Error('Sua conta foi bloqueada. Você foi desconectado.');
        }
        throw new Error(errorData.message || 'Acesso negado');
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.error || 'Erro ao excluir usuário');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      throw error;
    }
  }
}

export default new UsersService();


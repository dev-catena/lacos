// Serviço para gerenciar fornecedores via API
import { API_BASE_URL } from '../config/api';

const getHeaders = () => {
  const token = localStorage.getItem('@lacos:token');
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

const suppliersService = {
  /**
   * Listar todos os fornecedores
   */
  async getAllSuppliers(filters = {}) {
    try {
      const token = localStorage.getItem('@lacos:token');
      
      if (!token) {
        throw new Error('Token de autenticação não encontrado. Faça login novamente.');
      }

      const params = new URLSearchParams();
      
      if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }
      
      if (filters.search) {
        params.append('search', filters.search);
      }

      const url = `${API_BASE_URL}/suppliers${params.toString() ? `?${params.toString()}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders(),
      });

      if (response.status === 401) {
        throw new Error('Não autenticado. Faça login novamente.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Erro ${response.status}: Erro ao carregar fornecedores`);
      }

      return data.suppliers || [];
    } catch (error) {
      console.error('Erro ao listar fornecedores:', error);
      throw error;
    }
  },

  /**
   * Aprovar fornecedor
   */
  async approveSupplier(supplierId) {
    try {
      const token = localStorage.getItem('@lacos:token');
      
      if (!token) {
        throw new Error('Token de autenticação não encontrado. Faça login novamente.');
      }

      const response = await fetch(`${API_BASE_URL}/suppliers/${supplierId}/approve`, {
        method: 'PUT',
        headers: getHeaders(),
      });

      if (response.status === 401) {
        throw new Error('Não autenticado. Faça login novamente.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Erro ${response.status}: Erro ao aprovar fornecedor`);
      }

      return data;
    } catch (error) {
      console.error('Erro ao aprovar fornecedor:', error);
      throw error;
    }
  },

  /**
   * Reprovar fornecedor
   */
  async rejectSupplier(supplierId, reason) {
    try {
      const token = localStorage.getItem('@lacos:token');
      
      if (!token) {
        throw new Error('Token de autenticação não encontrado. Faça login novamente.');
      }

      const response = await fetch(`${API_BASE_URL}/suppliers/${supplierId}/reject`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ reason }),
      });

      if (response.status === 401) {
        throw new Error('Não autenticado. Faça login novamente.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Erro ${response.status}: Erro ao reprovar fornecedor`);
      }

      return data;
    } catch (error) {
      console.error('Erro ao reprovar fornecedor:', error);
      throw error;
    }
  },

  /**
   * Excluir fornecedor
   */
  async deleteSupplier(supplierId) {
    try {
      const token = localStorage.getItem('@lacos:token');
      
      if (!token) {
        throw new Error('Token de autenticação não encontrado. Faça login novamente.');
      }

      const response = await fetch(`${API_BASE_URL}/suppliers/${supplierId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });

      if (response.status === 401) {
        throw new Error('Não autenticado. Faça login novamente.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Erro ${response.status}: Erro ao excluir fornecedor`);
      }

      return data;
    } catch (error) {
      console.error('Erro ao excluir fornecedor:', error);
      throw error;
    }
  },
};

export default suppliersService;


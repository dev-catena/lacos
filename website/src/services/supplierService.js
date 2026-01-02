// Serviço para operações de fornecedor
import { API_BASE_URL } from '../config/api';
import authService from './authService';

class SupplierService {
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(authService.getToken() && { 'Authorization': `Bearer ${authService.getToken()}` }),
    };
  }

  async register(supplierData) {
    try {
      console.log('🏪 SupplierService - Registrando fornecedor:', supplierData);
      
      const response = await fetch(`${API_BASE_URL}/suppliers/register`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(supplierData),
        mode: 'cors',
        credentials: 'omit',
      });

      let data;
      const text = await response.text();
      
      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error('Erro ao parsear resposta:', parseError);
        data = { message: 'Erro ao processar resposta do servidor' };
      }

      console.log('📥 SupplierService - Resposta:', data);

      if (!response.ok) {
        // Tratar erros de validação
        if (response.status === 422 && data.errors && typeof data.errors === 'object') {
          const errorMessages = Object.entries(data.errors)
            .map(([field, messages]) => {
              const messagesArray = Array.isArray(messages) ? messages : [messages];
              return messagesArray.join(', ');
            })
            .join('\n');
          throw new Error(errorMessages || data.message || 'Dados inválidos');
        }
        
        throw new Error(data.message || data.error || `Erro ${response.status}: Erro ao cadastrar fornecedor`);
      }

      return {
        success: true,
        message: data.message || 'Cadastro de fornecedor enviado com sucesso',
        data: data.supplier || data
      };
    } catch (error) {
      console.error('❌ SupplierService - Erro ao cadastrar fornecedor:', error);
      throw error;
    }
  }

  async getMySupplier() {
    try {
      const response = await fetch(`${API_BASE_URL}/suppliers/me`, {
        method: 'GET',
        headers: this.getHeaders(),
        mode: 'cors',
        credentials: 'omit',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || `Erro ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('❌ SupplierService - Erro ao buscar fornecedor:', error);
      throw error;
    }
  }
}

export default new SupplierService();


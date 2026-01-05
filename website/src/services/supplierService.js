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

  // ========== PRODUTOS ==========
  async getProducts() {
    try {
      const response = await fetch(`${API_BASE_URL}/suppliers/products`, {
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
      console.error('❌ SupplierService - Erro ao buscar produtos:', error);
      throw error;
    }
  }

  async createProduct(productData) {
    try {
      // Verificar se há imagens para upload
      const hasNewImages = productData.newImages && productData.newImages.length > 0;
      
      if (hasNewImages) {
        // Se houver novas imagens, usar FormData
        const formData = new FormData();
        
        // Adicionar campos do produto
        formData.append('name', productData.name);
        formData.append('description', productData.description || '');
        formData.append('price', productData.price.toString());
        formData.append('stock', productData.stock.toString());
        formData.append('category', productData.category || '');
        formData.append('is_active', productData.is_active !== false ? '1' : '0');
        
        // Adicionar URLs de imagens existentes se houver
        if (productData.photos && productData.photos.length > 0) {
          productData.photos.forEach((url, index) => {
            formData.append(`photos[${index}]`, url);
          });
        }
        
        // Adicionar novas imagens
        productData.newImages.forEach((file, index) => {
          formData.append(`images[${index}]`, file);
        });
        
        const response = await fetch(`${API_BASE_URL}/suppliers/products`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            ...(authService.getToken() && { 'Authorization': `Bearer ${authService.getToken()}` }),
          },
          body: formData,
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
        
        if (!response.ok) {
          // Tratar erros de validação
          if (response.status === 422 && data.errors && typeof data.errors === 'object') {
            const errorMessages = Object.entries(data.errors)
              .map(([field, messages]) => {
                const messagesArray = Array.isArray(messages) ? messages : [messages];
                return `${field}: ${messagesArray.join(', ')}`;
              })
              .join('\n');
            throw new Error(errorMessages || data.message || 'Dados inválidos');
          }
          throw new Error(data.message || data.error || `Erro ${response.status}: Dados inválidos`);
        }
        return data;
      } else {
        // Se não houver novas imagens, usar JSON normal
        const response = await fetch(`${API_BASE_URL}/suppliers/products`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(productData),
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
        
        if (!response.ok) {
          // Tratar erros de validação
          if (response.status === 422 && data.errors && typeof data.errors === 'object') {
            const errorMessages = Object.entries(data.errors)
              .map(([field, messages]) => {
                const messagesArray = Array.isArray(messages) ? messages : [messages];
                return `${field}: ${messagesArray.join(', ')}`;
              })
              .join('\n');
            throw new Error(errorMessages || data.message || 'Dados inválidos');
          }
          throw new Error(data.message || data.error || `Erro ${response.status}: Dados inválidos`);
        }
        return data;
      }
    } catch (error) {
      console.error('❌ SupplierService - Erro ao criar produto:', error);
      throw error;
    }
  }

  async updateProduct(productId, productData) {
    try {
      // Verificar se há imagens para upload
      const hasNewImages = productData.newImages && productData.newImages.length > 0;
      
      if (hasNewImages) {
        // Se houver novas imagens, usar FormData
        const formData = new FormData();
        
        // Adicionar campos do produto
        formData.append('name', productData.name);
        formData.append('description', productData.description || '');
        formData.append('price', productData.price.toString());
        formData.append('stock', productData.stock.toString());
        formData.append('category', productData.category || '');
        formData.append('is_active', productData.is_active !== false ? '1' : '0');
        
        // Adicionar URLs de imagens existentes se houver
        if (productData.photos && productData.photos.length > 0) {
          productData.photos.forEach((url, index) => {
            formData.append(`photos[${index}]`, url);
          });
        }
        
        // Adicionar novas imagens
        productData.newImages.forEach((file, index) => {
          formData.append(`images[${index}]`, file);
        });
        
        const response = await fetch(`${API_BASE_URL}/suppliers/products/${productId}`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            ...(authService.getToken() && { 'Authorization': `Bearer ${authService.getToken()}` }),
            'X-HTTP-Method-Override': 'PUT',
          },
          body: formData,
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
        
        if (!response.ok) {
          // Tratar erros de validação
          if (response.status === 422 && data.errors && typeof data.errors === 'object') {
            const errorMessages = Object.entries(data.errors)
              .map(([field, messages]) => {
                const messagesArray = Array.isArray(messages) ? messages : [messages];
                return `${field}: ${messagesArray.join(', ')}`;
              })
              .join('\n');
            throw new Error(errorMessages || data.message || 'Dados inválidos');
          }
          throw new Error(data.message || data.error || `Erro ${response.status}: Dados inválidos`);
        }
        return data;
      } else {
        // Se não houver novas imagens, usar JSON normal
        const response = await fetch(`${API_BASE_URL}/suppliers/products/${productId}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify(productData),
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
        
        if (!response.ok) {
          // Tratar erros de validação
          if (response.status === 422 && data.errors && typeof data.errors === 'object') {
            const errorMessages = Object.entries(data.errors)
              .map(([field, messages]) => {
                const messagesArray = Array.isArray(messages) ? messages : [messages];
                return `${field}: ${messagesArray.join(', ')}`;
              })
              .join('\n');
            throw new Error(errorMessages || data.message || 'Dados inválidos');
          }
          throw new Error(data.message || data.error || `Erro ${response.status}: Dados inválidos`);
        }
        return data;
      }
    } catch (error) {
      console.error('❌ SupplierService - Erro ao atualizar produto:', error);
      throw error;
    }
  }

  async deleteProduct(productId) {
    try {
      const response = await fetch(`${API_BASE_URL}/suppliers/products/${productId}`, {
        method: 'DELETE',
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
      console.error('❌ SupplierService - Erro ao excluir produto:', error);
      throw error;
    }
  }

  async toggleProductStatus(productId, isActive) {
    try {
      const response = await fetch(`${API_BASE_URL}/suppliers/products/${productId}/toggle-status`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify({ is_active: isActive }),
        mode: 'cors',
        credentials: 'omit',
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || `Erro ${response.status}`);
      }
      return data;
    } catch (error) {
      console.error('❌ SupplierService - Erro ao alterar status do produto:', error);
      throw error;
    }
  }

  // ========== PEDIDOS ==========
  async getOrders(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(`${API_BASE_URL}/suppliers/orders?${queryParams}`, {
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
      console.error('❌ SupplierService - Erro ao buscar pedidos:', error);
      throw error;
    }
  }

  async updateOrderStatus(orderId, status) {
    try {
      const response = await fetch(`${API_BASE_URL}/suppliers/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify({ status }),
        mode: 'cors',
        credentials: 'omit',
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || `Erro ${response.status}`);
      }
      return data;
    } catch (error) {
      console.error('❌ SupplierService - Erro ao atualizar status do pedido:', error);
      throw error;
    }
  }

  // ========== MENSAGENS ==========
  async getConversations() {
    try {
      const response = await fetch(`${API_BASE_URL}/suppliers/conversations`, {
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
      console.error('❌ SupplierService - Erro ao buscar conversas:', error);
      throw error;
    }
  }

  async getMessages(conversationId) {
    try {
      const response = await fetch(`${API_BASE_URL}/suppliers/conversations/${conversationId}/messages`, {
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
      console.error('❌ SupplierService - Erro ao buscar mensagens:', error);
      throw error;
    }
  }

  async sendMessage(conversationId, content) {
    try {
      const response = await fetch(`${API_BASE_URL}/suppliers/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ content }),
        mode: 'cors',
        credentials: 'omit',
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || `Erro ${response.status}`);
      }
      return data;
    } catch (error) {
      console.error('❌ SupplierService - Erro ao enviar mensagem:', error);
      throw error;
    }
  }
}

export default new SupplierService();


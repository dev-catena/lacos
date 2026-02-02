import API_CONFIG from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

class StoreService {
  async getToken() {
    try {
      return await AsyncStorage.getItem('@lacos:token');
    } catch (error) {
      console.error('Erro ao obter token:', error);
      return null;
    }
  }

  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  async getAuthHeaders() {
    const token = await this.getToken();
    return {
      ...this.getHeaders(),
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  /**
   * Listar produtos da loja
   * GET /api/store/products
   */
  async getProducts(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.category) params.append('category', filters.category);
      if (filters.supplier_id) params.append('supplier_id', filters.supplier_id);
      if (filters.search) params.append('search', filters.search);
      if (filters.sort_by) params.append('sort_by', filters.sort_by);
      if (filters.sort_order) params.append('sort_order', filters.sort_order);
      if (filters.per_page) params.append('per_page', filters.per_page);
      if (filters.page) params.append('page', filters.page);

      const url = `${API_CONFIG.BASE_URL}/store/products${params.toString() ? `?${params.toString()}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Erro ${response.status}: Erro ao buscar produtos`);
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      throw error;
    }
  }

  /**
   * Obter detalhes de um produto
   * GET /api/store/products/{id}
   */
  async getProduct(id) {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/store/products/${id}`, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Erro ${response.status}: Erro ao buscar produto`);
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      throw error;
    }
  }

  /**
   * Criar pedido
   * POST /api/store/orders
   */
  async createOrder(orderData) {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/store/orders`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Erro ${response.status}: Erro ao criar pedido`);
      }

      return data;
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      throw error;
    }
  }

  /**
   * Listar pedidos do usuário
   * GET /api/store/orders
   */
  async getOrders(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.status) params.append('status', filters.status);
      if (filters.per_page) params.append('per_page', filters.per_page);
      if (filters.page) params.append('page', filters.page);

      const url = `${API_CONFIG.BASE_URL}/store/orders${params.toString() ? `?${params.toString()}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Erro ${response.status}: Erro ao buscar pedidos`);
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      throw error;
    }
  }

  /**
   * Obter detalhes de um pedido
   * GET /api/store/orders/{id}
   */
  async getOrder(id) {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/store/orders/${id}`, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Erro ${response.status}: Erro ao buscar pedido`);
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar pedido:', error);
      throw error;
    }
  }

  /**
   * Cancelar pedido
   * POST /api/store/orders/{id}/cancel
   */
  async cancelOrder(id) {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/store/orders/${id}/cancel`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Erro ${response.status}: Erro ao cancelar pedido`);
      }

      return data;
    } catch (error) {
      console.error('Erro ao cancelar pedido:', error);
      throw error;
    }
  }

  /**
   * Obter conversa relacionada ao pedido
   * GET /api/store/orders/{orderId}/conversation
   */
  async getOrderConversation(orderId) {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/store/orders/${orderId}/conversation`, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Erro ${response.status}: Erro ao buscar conversa`);
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar conversa:', error);
      throw error;
    }
  }

  /**
   * Obter mensagens de uma conversa
   * GET /api/store/conversations/{conversationId}/messages
   */
  async getConversationMessages(conversationId) {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/store/conversations/${conversationId}/messages`, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Erro ${response.status}: Erro ao buscar mensagens`);
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      throw error;
    }
  }

  /**
   * Enviar mensagem em uma conversa
   * POST /api/store/conversations/{conversationId}/messages
   */
  async sendMessage(conversationId, content, orderId = null) {
    try {
      const body = { content };
      if (orderId) {
        body.order_id = orderId;
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/store/conversations/${conversationId || 'new'}/messages`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Erro ${response.status}: Erro ao enviar mensagem`);
      }

      return data;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    }
  }
}

export default new StoreService();


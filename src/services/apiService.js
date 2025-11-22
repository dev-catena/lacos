import API_CONFIG from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

class ApiService {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  /**
   * Get authorization token
   */
  async getToken() {
    try {
      const token = await AsyncStorage.getItem('@lacos:token');
      return token;
    } catch (error) {
      console.error('Erro ao obter token:', error);
      return null;
    }
  }

  /**
   * Make HTTP request
   */
  async request(endpoint, options = {}) {
    const {
      method = 'GET',
      body = null,
      headers = {},
      requiresAuth = true,
    } = options;

    try {
      // Preparar headers
      const requestHeaders = {
        ...API_CONFIG.DEFAULT_HEADERS,
        ...headers,
      };

      // Adicionar token se necessário
      if (requiresAuth) {
        const token = await this.getToken();
        if (token) {
          requestHeaders['Authorization'] = `Bearer ${token}`;
        }
      }

      // Preparar configuração da requisição
      const config = {
        method,
        headers: requestHeaders,
      };

      // Adicionar body se necessário
      if (body && method !== 'GET') {
        config.body = JSON.stringify(body);
      }

      // Fazer requisição com timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Parse response
      const data = await response.json();

      // Check for errors
      if (!response.ok) {
        throw {
          status: response.status,
          message: data.message || 'Erro na requisição',
          errors: data.errors || {},
        };
      }

      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw {
          status: 408,
          message: 'Tempo de requisição esgotado',
        };
      }

      console.error('API Error:', error);
      throw error;
    }
  }

  /**
   * GET request
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  async post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }

  /**
   * PUT request
   */
  async put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  }

  /**
   * DELETE request
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * Helper to replace URL parameters
   * Example: replaceParams('/groups/:id', { id: 123 }) => '/groups/123'
   */
  replaceParams(endpoint, params) {
    let result = endpoint;
    Object.keys(params).forEach(key => {
      result = result.replace(`:${key}`, params[key]);
    });
    return result;
  }
}

export default new ApiService();


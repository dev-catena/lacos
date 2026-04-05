import { API_BASE_URL } from '../config/api';

const systemSettingsService = {
  getHeaders() {
    const token = localStorage.getItem('@lacos:token');
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  },

  /**
   * Buscar todas as configurações ou por categoria
   */
  async getSettings(category = null, keys = null) {
    try {
      let url = `${API_BASE_URL}/system-settings`;
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (keys) params.append('keys', Array.isArray(keys) ? keys.join(',') : keys);
      if (params.toString()) url += '?' + params.toString();

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar configurações');
      }

      const data = await response.json();
      return { success: true, data: data.data || data };
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao buscar configurações' 
      };
    }
  },

  /**
   * Buscar configurações de gravação
   */
  async getRecordingSettings() {
    try {
      const response = await fetch(`${API_BASE_URL}/system-settings/recording`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar configurações de gravação');
      }

      const data = await response.json();
      return { 
        success: true, 
        data: data.data || data 
      };
    } catch (error) {
      console.error('Erro ao buscar configurações de gravação:', error);
      return { 
        success: true, // Retornar success: true para usar valores padrão
        data: {
          recording_start_before_minutes: 15,
          recording_stop_after_end_minutes: 15,
          recording_max_duration_after_end_minutes: 30,
        }
      };
    }
  },

  /**
   * Atualizar configuração
   */
  async updateSetting(key, value, type = null, description = null) {
    try {
      const data = { value };
      if (type) data.type = type;
      if (description) data.description = description;

      const response = await fetch(`${API_BASE_URL}/system-settings/${key}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao atualizar configuração');
      }

      const result = await response.json();
      return { success: true, data: result.data || result };
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao atualizar configuração' 
      };
    }
  },

  /**
   * Atualizar múltiplas configurações de gravação
   */
  async updateRecordingSettings(settings) {
    try {
      const updates = [];
      for (const [key, value] of Object.entries(settings)) {
        updates.push(this.updateSetting(key, value, 'integer'));
      }
      const results = await Promise.all(updates);
      
      // Verificar se algum falhou
      const failed = results.find(r => !r.success);
      if (failed) {
        return failed;
      }

      return { success: true, data: results.map(r => r.data) };
    } catch (error) {
      console.error('Erro ao atualizar configurações de gravação:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao atualizar configurações de gravação' 
      };
    }
  },
};

export default systemSettingsService;


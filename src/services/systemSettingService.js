import apiService from './apiService';

const systemSettingService = {
  /**
   * Buscar todas as configurações ou por categoria
   */
  getSettings: async (category = null, keys = null) => {
    try {
      const params = {};
      if (category) {
        params.category = category;
      }
      if (keys) {
        params.keys = Array.isArray(keys) ? keys.join(',') : keys;
      }

      const response = await apiService.get('/system-settings', { params });
      return { success: true, data: response };
    } catch (error) {
      console.error('❌ Erro ao buscar configurações:', error);
      return { success: false, error: error.message || 'Erro ao buscar configurações' };
    }
  },

  /**
   * Buscar configuração específica por chave
   */
  getSetting: async (key) => {
    try {
      const response = await apiService.get(`/system-settings/${key}`);
      return { success: true, data: response };
    } catch (error) {
      console.error('❌ Erro ao buscar configuração:', error);
      return { success: false, error: error.message || 'Erro ao buscar configuração' };
    }
  },

  /**
   * Buscar configurações de gravação
   */
  getRecordingSettings: async () => {
    try {
      const response = await apiService.get('/system-settings/recording');
      return { success: true, data: response };
    } catch (error) {
      console.error('❌ Erro ao buscar configurações de gravação:', error);
      // Retornar valores padrão em caso de erro
      return {
        success: true,
        data: {
          recording_start_before_minutes: 15,
          recording_stop_after_end_minutes: 15,
          recording_max_duration_after_end_minutes: 30,
        },
      };
    }
  },

  /**
   * Atualizar configuração (apenas admin)
   */
  updateSetting: async (key, value, type = null, description = null) => {
    try {
      const data = { value };
      if (type) data.type = type;
      if (description) data.description = description;

      const response = await apiService.put(`/system-settings/${key}`, data);
      return { success: true, data: response };
    } catch (error) {
      console.error('❌ Erro ao atualizar configuração:', error);
      return { success: false, error: error.message || 'Erro ao atualizar configuração' };
    }
  },
};

export default systemSettingService;




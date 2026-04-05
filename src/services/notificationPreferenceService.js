import apiService from './apiService';

class NotificationPreferenceService {
  /**
   * Obter preferências de notificação do usuário
   */
  async getPreferences() {
    try {
      const response = await apiService.get('/notification-preferences');
      
      if (response && response.success) {
        return {
          success: true,
          data: response.data,
        };
      }

      return {
        success: false,
        error: response.message || 'Erro ao buscar preferências',
      };
    } catch (error) {
      console.error('❌ Erro ao buscar preferências de notificação:', error);
      return {
        success: false,
        error: error.message || 'Erro ao buscar preferências',
      };
    }
  }

  /**
   * Atualizar preferências de notificação
   */
  async updatePreferences(preferences) {
    try {
      console.log('💾 NotificationPreferenceService - Atualizando preferências:', preferences);
      
      const response = await apiService.put('/notification-preferences', preferences);
      
      if (response && response.success) {
        console.log('✅ NotificationPreferenceService - Preferências atualizadas');
        return {
          success: true,
          data: response.data,
          message: response.message || 'Preferências atualizadas com sucesso',
        };
      }

      return {
        success: false,
        error: response.message || 'Erro ao atualizar preferências',
      };
    } catch (error) {
      console.error('❌ Erro ao atualizar preferências de notificação:', error);
      
      let errorMessage = 'Erro ao atualizar preferências';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.errors && typeof error.errors === 'object') {
        const firstError = Object.values(error.errors)[0];
        if (Array.isArray(firstError) && firstError.length > 0) {
          errorMessage = firstError[0];
        } else if (typeof firstError === 'string') {
          errorMessage = firstError;
        }
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}

export default new NotificationPreferenceService();






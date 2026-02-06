import apiService from './apiService';

class NotificationApiService {
  /**
   * Buscar notificações do usuário
   */
  async getNotifications(options = {}) {
    try {
      const { read = null, limit = 50 } = options;
      
      let url = '/notifications?limit=' + limit;
      if (read !== null) {
        url += '&read=' + (read ? 'true' : 'false');
      }
      
      const response = await apiService.get(url);
      
      if (response && response.success) {
        return {
          success: true,
          data: response.data || [],
          count: response.count || 0,
          unreadCount: response.unread_count || 0,
        };
      }

      return {
        success: false,
        error: response.message || 'Erro ao buscar notificações',
        data: [],
      };
    } catch (error) {
      console.error('❌ Erro ao buscar notificações:', error);
      return {
        success: false,
        error: error.message || 'Erro ao buscar notificações',
        data: [],
      };
    }
  }

  /**
   * Obter contador de notificações não lidas
   */
  async getUnreadCount() {
    try {
      console.log('📡 notificationApiService - Buscando contador de notificações não lidas...');
      const response = await apiService.get('/notifications/unread-count');
      console.log('📡 notificationApiService - Resposta do servidor:', JSON.stringify(response));
      
      if (response && response.success) {
        const count = response.count || 0;
        console.log('✅ notificationApiService - Contador obtido com sucesso:', count);
        return {
          success: true,
          count: count,
        };
      }

      console.warn('⚠️ notificationApiService - Resposta sem sucesso:', response);
      return {
        success: false,
        count: 0,
      };
    } catch (error) {
      console.error('❌ notificationApiService - Erro ao contar notificações não lidas:', error);
      return {
        success: false,
        count: 0,
      };
    }
  }

  /**
   * Marcar notificação como lida
   */
  async markAsRead(notificationId) {
    try {
      const response = await apiService.put(`/notifications/${notificationId}/read`);
      
      if (response && response.success) {
        return {
          success: true,
          data: response.data,
        };
      }

      return {
        success: false,
        error: response.message || 'Erro ao marcar notificação como lida',
      };
    } catch (error) {
      console.error('❌ Erro ao marcar notificação como lida:', error);
      return {
        success: false,
        error: error.message || 'Erro ao marcar notificação como lida',
      };
    }
  }

  /**
   * Marcar todas as notificações como lidas
   */
  async markAllAsRead() {
    try {
      const response = await apiService.put('/notifications/mark-all-read');
      
      if (response && response.success) {
        return {
          success: true,
          count: response.count || 0,
          message: response.message,
        };
      }

      return {
        success: false,
        error: response.message || 'Erro ao marcar notificações como lidas',
      };
    } catch (error) {
      console.error('❌ Erro ao marcar todas as notificações como lidas:', error);
      return {
        success: false,
        error: error.message || 'Erro ao marcar notificações como lidas',
      };
    }
  }

  /**
   * Deletar notificação individual
   */
  async deleteNotification(notificationId) {
    try {
      const response = await apiService.delete(`/notifications/${notificationId}`);
      
      if (response && response.success) {
        return {
          success: true,
          message: response.message,
        };
      }

      return {
        success: false,
        error: response.message || 'Erro ao deletar notificação',
      };
    } catch (error) {
      console.error('❌ Erro ao deletar notificação:', error);
      return {
        success: false,
        error: error.message || 'Erro ao deletar notificação',
      };
    }
  }

  /**
   * Deletar todas as notificações
   */
  async deleteAllNotifications() {
    try {
      const response = await apiService.delete('/notifications/clear/all');
      
      if (response && response.success) {
        return {
          success: true,
          count: response.count || 0,
          message: response.message,
        };
      }

      return {
        success: false,
        error: response.message || 'Erro ao deletar notificações',
      };
    } catch (error) {
      console.error('❌ Erro ao deletar todas as notificações:', error);
      return {
        success: false,
        error: error.message || 'Erro ao deletar notificações',
      };
    }
  }
}

export default new NotificationApiService();



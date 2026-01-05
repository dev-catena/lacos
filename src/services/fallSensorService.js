import apiService from './apiService';

class FallSensorService {
  /**
   * Salvar dados do sensor
   */
  async saveSensorData(groupId, data) {
    try {
      const response = await apiService.request(`/groups/${groupId}/fall-sensor/data`, {
        method: 'POST',
        body: data,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Erro ao salvar dados do sensor:', error);
      return {
        success: false,
        error: error.message || 'Erro ao salvar dados do sensor',
      };
    }
  }

  /**
   * Buscar histórico do grupo
   */
  async getHistory(groupId, options = {}) {
    try {
      const { limit = 50, offset = 0, startDate, endDate, posture, onlyFalls = false } = options;
      
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (posture) params.append('posture', posture);
      if (onlyFalls) params.append('only_falls', 'true');

      const response = await apiService.request(`/groups/${groupId}/fall-sensor/history?${params.toString()}`, {
        method: 'GET',
      });

      return {
        success: true,
        data: response.data || [],
        total: response.total || 0,
      };
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      return {
        success: false,
        error: error.message || 'Erro ao buscar histórico',
        data: [],
        total: 0,
      };
    }
  }

  /**
   * Obter última postura detectada
   */
  async getLatest(groupId) {
    try {
      const response = await apiService.request(`/groups/${groupId}/fall-sensor/latest`, {
        method: 'GET',
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Erro ao buscar última postura:', error);
      return {
        success: false,
        error: error.message || 'Erro ao buscar última postura',
      };
    }
  }

  /**
   * Obter alertas de queda recentes
   */
  async getFallAlerts(groupId, hours = 24) {
    try {
      const response = await apiService.request(`/groups/${groupId}/fall-sensor/alerts?hours=${hours}`, {
        method: 'GET',
      });

      return {
        success: true,
        data: response.data || [],
        count: response.count || 0,
      };
    } catch (error) {
      console.error('Erro ao buscar alertas de queda:', error);
      return {
        success: false,
        error: error.message || 'Erro ao buscar alertas de queda',
        data: [],
        count: 0,
      };
    }
  }
}

export default new FallSensorService();


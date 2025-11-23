import apiService from './apiService';

/**
 * Serviço para gerenciar sinais vitais
 */
class VitalSignService {
  /**
   * Registrar novo sinal vital
   */
  async createVitalSign(vitalSignData) {
    try {
      const data = {
        group_id: vitalSignData.groupId,
        type: vitalSignData.type,
        value: vitalSignData.value,
        unit: vitalSignData.unit,
        measured_at: vitalSignData.measuredAt || new Date().toISOString(),
        notes: vitalSignData.notes,
      };

      const response = await apiService.post('/vital-signs', data);
      return { success: true, data: response };
    } catch (error) {
      console.error('Erro ao registrar sinal vital:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao registrar sinal vital' 
      };
    }
  }

  /**
   * Listar sinais vitais de um grupo
   */
  async getVitalSigns(groupId = null, type = null, startDate = null, endDate = null) {
    try {
      let endpoint = '/vital-signs';
      const params = [];

      if (groupId) {
        params.push(`group_id=${groupId}`);
      }
      if (type) {
        params.push(`type=${type}`);
      }
      if (startDate) {
        params.push(`start_date=${startDate}`);
      }
      if (endDate) {
        params.push(`end_date=${endDate}`);
      }

      if (params.length > 0) {
        endpoint += '?' + params.join('&');
      }

      const response = await apiService.get(endpoint);
      return { success: true, data: response };
    } catch (error) {
      console.error('Erro ao buscar sinais vitais:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao buscar sinais vitais' 
      };
    }
  }

  /**
   * Obter detalhes de um sinal vital específico
   */
  async getVitalSign(vitalSignId) {
    try {
      const endpoint = apiService.replaceParams('/vital-signs/:id', { id: vitalSignId });
      const response = await apiService.get(endpoint);
      return { success: true, data: response };
    } catch (error) {
      console.error('Erro ao buscar sinal vital:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao buscar sinal vital' 
      };
    }
  }

  /**
   * Atualizar sinal vital
   */
  async updateVitalSign(vitalSignId, vitalSignData) {
    try {
      const endpoint = apiService.replaceParams('/vital-signs/:id', { id: vitalSignId });
      const data = {
        value: vitalSignData.value,
        unit: vitalSignData.unit,
        measured_at: vitalSignData.measuredAt,
        notes: vitalSignData.notes,
      };

      const response = await apiService.put(endpoint, data);
      return { success: true, data: response };
    } catch (error) {
      console.error('Erro ao atualizar sinal vital:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao atualizar sinal vital' 
      };
    }
  }

  /**
   * Deletar sinal vital
   */
  async deleteVitalSign(vitalSignId) {
    try {
      const endpoint = apiService.replaceParams('/vital-signs/:id', { id: vitalSignId });
      await apiService.delete(endpoint);
      return { success: true };
    } catch (error) {
      console.error('Erro ao deletar sinal vital:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao deletar sinal vital' 
      };
    }
  }
}

export default new VitalSignService();


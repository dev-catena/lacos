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
      // O campo value no banco é JSON (array no Laravel), então precisamos formatar corretamente
      let valueToSend = vitalSignData.value;
      
      // Se for pressão arterial (formato "120/80"), converter para objeto
      if (vitalSignData.type === 'blood_pressure' && typeof valueToSend === 'string' && valueToSend.includes('/')) {
        const [systolic, diastolic] = valueToSend.split('/').map(v => parseFloat(v.trim()));
        valueToSend = { systolic, diastolic };
      } else if (typeof valueToSend === 'string' && !isNaN(parseFloat(valueToSend)) && !isNaN(valueToSend)) {
        // Se for um número em string, converter para número
        valueToSend = parseFloat(valueToSend);
      } else if (typeof valueToSend === 'string') {
        // Se for string não numérica, manter como string (será convertida para JSON string)
        valueToSend = valueToSend;
      }
      
      const data = {
        group_id: vitalSignData.groupId,
        type: vitalSignData.type,
        value: valueToSend,
        unit: vitalSignData.unit,
        measured_at: vitalSignData.measuredAt || new Date().toISOString(),
        notes: vitalSignData.notes,
      };

      console.log('💾 createVitalSign - Enviando dados:', JSON.stringify(data, null, 2));
      const response = await apiService.post('/vital-signs', data);
      console.log('💾 createVitalSign - Resposta da API:', response);
      return { success: true, data: response };
    } catch (error) {
      console.error('❌ Erro ao registrar sinal vital:', error);
      console.error('❌ Erro detalhado:', error.response?.data || error.message);
      return { 
        success: false, 
        error: error.message || 'Erro ao registrar sinal vital',
        details: error.response?.data || null,
      };
    }
  }

  /**
   * Normaliza resposta da API para array de registros.
   */
  normalizeVitalSignsList(response) {
    if (Array.isArray(response)) return response;
    if (response && Array.isArray(response.data)) return response.data;
    if (response && Array.isArray(response.items)) return response.items;
    return [];
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
      return { success: true, data: this.normalizeVitalSignsList(response) };
    } catch (error) {
      console.error('Erro ao buscar sinais vitais:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao buscar sinais vitais',
        data: [],
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


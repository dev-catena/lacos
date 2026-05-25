import apiService from './apiService';

const panicService = {
  /**
   * Acionar botão de pânico
   */
  async trigger(panicData) {
    try {
      const response = await apiService.post('/panic/trigger', panicData);
      return response;
    } catch (error) {
      console.error('Erro ao acionar pânico:', error);
      throw error;
    }
  },

  /**
   * Finalizar chamada de emergência
   */
  async endCall(eventId, callData) {
    try {
      const response = await apiService.put(`/panic/${eventId}/end-call`, callData);
      return response;
    } catch (error) {
      console.error('Erro ao finalizar chamada:', error);
      throw error;
    }
  },

  /**
   * Listar eventos de pânico
   */
  async getEvents(groupId) {
    try {
      const response = await apiService.get(`/panic?group_id=${groupId}`);
      return response;
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
      throw error;
    }
  },

  /**
   * Pânicos ativos (ongoing) — inclui sync do relógio no backend
   */
  async getActiveEvents() {
    try {
      const response = await apiService.get('/panic/active');
      return response;
    } catch (error) {
      console.error('Erro ao buscar pânicos ativos:', error);
      throw error;
    }
  },

  /**
   * Desarmar pânico (encerra evento + comando no relógio se aplicável)
   */
  async disarm(eventId, data = {}) {
    try {
      const response = await apiService.put(`/panic/${eventId}/disarm`, data);
      return response;
    } catch (error) {
      console.error('Erro ao desarmar pânico:', error);
      throw error;
    }
  },

  /**
   * Verificar configuração do botão de pânico
   */
  async checkConfig(groupId) {
    try {
      const response = await apiService.get(`/panic/config/${groupId}`);
      return response;
    } catch (error) {
      console.error('Erro ao verificar configuração:', error);
      throw error;
    }
  },
};

export default panicService;


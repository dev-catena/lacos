import apiService from './apiService';

const occurrenceService = {
  // Criar nova ocorrência
  async createOccurrence(data) {
    try {
      const response = await apiService.post('/occurrences', data);
      return response;
    } catch (error) {
      console.error('Erro ao criar ocorrência:', error.response?.data || error);
      throw error;
    }
  },

  // Listar ocorrências de um grupo
  async getOccurrencesByGroup(groupId) {
    try {
      const response = await apiService.get(`/occurrences?group_id=${groupId}`);
      return response;
    } catch (error) {
      console.error('Erro ao buscar ocorrências:', error.response?.data || error);
      throw error;
    }
  },

  // Buscar detalhes de uma ocorrência
  async getOccurrenceById(occurrenceId) {
    try {
      const response = await apiService.get(`/occurrences/${occurrenceId}`);
      return response;
    } catch (error) {
      console.error('Erro ao buscar detalhes da ocorrência:', error.response?.data || error);
      throw error;
    }
  },

  // Atualizar ocorrência
  async updateOccurrence(occurrenceId, data) {
    try {
      const response = await apiService.put(`/occurrences/${occurrenceId}`, data);
      return response;
    } catch (error) {
      console.error('Erro ao atualizar ocorrência:', error.response?.data || error);
      throw error;
    }
  },

  // Deletar ocorrência
  async deleteOccurrence(occurrenceId) {
    try {
      const response = await apiService.delete(`/occurrences/${occurrenceId}`);
      return response;
    } catch (error) {
      console.error('Erro ao deletar ocorrência:', error.response?.data || error);
      throw error;
    }
  },

  // Listar tipos de ocorrências disponíveis
  getOccurrenceTypes() {
    return [
      { id: 'queda', label: 'Queda' },
      { id: 'desnutricao', label: 'Desnutrição' },
      { id: 'escabiose', label: 'Escabiose' },
      { id: 'desidratacao', label: 'Desidratação' },
      { id: 'lesao_pressao', label: 'Lesão por pressão' },
      { id: 'doenca_diarreica', label: 'Doença diarreica aguda' },
      { id: 'outro', label: 'Outro' },
    ];
  },
};

export default occurrenceService;


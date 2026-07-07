import apiService from './apiService';

const vaccinationService = {
  // Calendário PNI com status calculado (applied/pending/overdue)
  async getSchedule(groupId) {
    try {
      const response = await apiService.get(`/groups/${groupId}/vaccination-schedule`);
      return response.data || response;
    } catch (error) {
      const errorText = error.response?.data?.error || error.message || '';
      if (errorText.includes("doesn't exist") || errorText.includes('Table')) {
        return { birth_date: null, schedule: [] };
      }
      throw error;
    }
  },

  // Registros de vacinas aplicadas
  async getRecords(groupId) {
    try {
      const response = await apiService.get(`/groups/${groupId}/vaccinations`);
      return response.data || response;
    } catch (error) {
      const errorText = error.response?.data?.error || error.message || '';
      if (errorText.includes("doesn't exist") || errorText.includes('Table')) {
        return [];
      }
      throw error;
    }
  },

  // Detalhes de um registro
  async getRecord(groupId, id) {
    try {
      const response = await apiService.get(`/groups/${groupId}/vaccinations/${id}`);
      return response.data || response;
    } catch (error) {
      throw error;
    }
  },

  // Registrar vacina aplicada (FormData para suportar upload de documento)
  async addRecord(groupId, formData) {
    try {
      const response = await apiService.post(`/groups/${groupId}/vaccinations`, formData);
      return response.data || response;
    } catch (error) {
      throw error;
    }
  },

  // Remover registro
  async deleteRecord(groupId, id) {
    try {
      const response = await apiService.delete(`/groups/${groupId}/vaccinations/${id}`);
      return response.data || response;
    } catch (error) {
      throw error;
    }
  },
};

export default vaccinationService;

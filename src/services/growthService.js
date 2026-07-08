import apiService from './apiService';

const growthService = {
  async getRecords(groupId) {
    let birthDate = null;
    let records = [];

    // 1. Tenta buscar registros de crescimento
    try {
      const response = await apiService.get(`/groups/${groupId}/growth-records`);
      const data = response.data || response;
      birthDate = data.birth_date || null;
      records = data.records || [];
    } catch (error) {
      console.warn('GrowthService.getRecords error:', error.response?.status, error.message);
    }

    // 2. Se ainda não tem data de nascimento, busca do grupo
    if (!birthDate) {
      try {
        const groupRes = await apiService.get(`/groups/${groupId}`);
        const group = groupRes.data || groupRes;
        birthDate = group.accompanied_birth_date || null;
      } catch (e) {
        console.warn('GrowthService: erro ao buscar birthDate do grupo', e.message);
      }
    }

    return { birth_date: birthDate, records };
  },

  async addRecord(groupId, data) {
    const response = await apiService.post(`/groups/${groupId}/growth-records`, data);
    return response.data || response;
  },

  async deleteRecord(groupId, id) {
    const response = await apiService.delete(`/groups/${groupId}/growth-records/${id}`);
    return response.data || response;
  },
};

export default growthService;

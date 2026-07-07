import apiService from './apiService';

const growthService = {
  async getRecords(groupId) {
    try {
      const response = await apiService.get(`/groups/${groupId}/growth-records`);
      return response.data || response;
    } catch (error) {
      console.warn('GrowthService.getRecords error:', error.response?.status, error.message);
      return { birth_date: null, records: [] };
    }
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

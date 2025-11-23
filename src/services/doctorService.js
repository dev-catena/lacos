import apiService from './apiService';

const doctorService = {
  /**
   * Busca todos os médicos de um grupo
   */
  async getDoctors(groupId) {
    try {
      const response = await apiService.get(`/doctors?group_id=${groupId}`);
      return response;
    } catch (error) {
      console.error('Erro ao buscar médicos:', error);
      throw error;
    }
  },

  /**
   * Busca um médico específico
   */
  async getDoctor(doctorId) {
    try {
      const response = await apiService.get(`/doctors/${doctorId}`);
      return response;
    } catch (error) {
      console.error('Erro ao buscar médico:', error);
      throw error;
    }
  },

  /**
   * Cria um novo médico
   */
  async createDoctor(doctorData) {
    try {
      const response = await apiService.post('/doctors', doctorData);
      return response;
    } catch (error) {
      console.error('Erro ao criar médico:', error);
      throw error;
    }
  },

  /**
   * Atualiza um médico existente
   */
  async updateDoctor(doctorId, doctorData) {
    try {
      const response = await apiService.put(`/doctors/${doctorId}`, doctorData);
      return response;
    } catch (error) {
      console.error('Erro ao atualizar médico:', error);
      throw error;
    }
  },

  /**
   * Remove um médico
   */
  async deleteDoctor(doctorId) {
    try {
      const response = await apiService.delete(`/doctors/${doctorId}`);
      return response;
    } catch (error) {
      console.error('Erro ao deletar médico:', error);
      throw error;
    }
  },
};

export default doctorService;

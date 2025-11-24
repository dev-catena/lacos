import apiService from './apiService';

const medicalSpecialtyService = {
  /**
   * Buscar todas as especialidades ou filtrar por busca
   */
  getSpecialties: async (search = '') => {
    try {
      const params = search ? { search } : {};
      const response = await apiService.get('/medical-specialties', { params });
      
      // Retornar exatamente como o apiService retorna
      return response;
    } catch (error) {
      console.error('Erro ao buscar especialidades:', error);
      return { success: false, error: error.message, data: [] };
    }
  },

  /**
   * Buscar uma especialidade específica
   */
  getSpecialty: async (id) => {
    try {
      const response = await apiService.get(`/medical-specialties/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar especialidade:', error);
      throw error;
    }
  },
};

export default medicalSpecialtyService;


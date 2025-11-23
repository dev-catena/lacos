import apiService from './apiService';

const medicalSpecialtyService = {
  /**
   * Buscar todas as especialidades ou filtrar por busca
   */
  getSpecialties: async (search = '') => {
    try {
      const params = search ? { search } : {};
      const response = await apiService.get('/medical-specialties', { params });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar especialidades:', error);
      throw error;
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


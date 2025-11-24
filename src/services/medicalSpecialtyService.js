import apiService from './apiService';

const medicalSpecialtyService = {
  /**
   * Buscar todas as especialidades ou filtrar por busca
   */
  getSpecialties: async (search = '') => {
    try {
      const params = search ? { search } : {};
      const response = await apiService.get('/medical-specialties', { params });
      console.log('Resposta raw do API:', response);
      
      // O apiService já retorna o objeto completo da resposta
      // Se tiver data.data, retorna isso, senão retorna response direto
      if (response.data && Array.isArray(response.data)) {
        return { success: true, data: response.data };
      } else if (response.success) {
        return response;
      }
      
      return { success: true, data: response };
    } catch (error) {
      console.error('Erro ao buscar especialidades:', error);
      return { success: false, error: error.message };
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


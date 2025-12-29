import apiService from './apiService';

const medicalSpecialtyService = {
  /**
   * Buscar todas as especialidades ou filtrar por busca
   */
  getSpecialties: async (search = '') => {
    try {
      const params = search ? { search } : {};
      const response = await apiService.get('/medical-specialties', {
        params,
        requiresAuth: false, // Não requer autenticação para buscar especialidades
      });
      
      console.log('📋 medicalSpecialtyService.getSpecialties - Resposta recebida:', JSON.stringify(response, null, 2));
      
      // O backend retorna {success: true, data: [...]}
      // Se a resposta já tem success e data, retornar diretamente
      if (response && response.success !== undefined) {
        return response;
      }
      
      // Se a resposta é um array direto, envolver no formato esperado
      if (Array.isArray(response)) {
        return { success: true, data: response };
      }
      
      // Se a resposta tem data, retornar com success: true
      if (response && response.data) {
        return { success: true, data: response.data };
      }
      
      // Retornar exatamente como o apiService retorna
      return response;
    } catch (error) {
      console.error('❌ Erro ao buscar especialidades:', error);
      console.error('❌ Erro completo:', JSON.stringify(error, null, 2));
      
      // Se o erro tem uma resposta válida dentro dele, tentar extrair
      if (error.response || error.data) {
        const errorResponse = error.response || error.data;
        if (errorResponse && errorResponse.success && errorResponse.data) {
          console.log('✅ Dados encontrados dentro do erro:', errorResponse);
          return errorResponse;
        }
      }
      
      return { success: false, error: error.message || 'Erro desconhecido', data: [] };
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


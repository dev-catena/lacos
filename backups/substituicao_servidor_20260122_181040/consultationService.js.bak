import apiService from './apiService';

class ConsultationService {
  /**
   * Listar consultas de um grupo
   */
  async getConsultations(groupId, filterType = 'all') {
    try {
      const params = new URLSearchParams({
        group_id: groupId,
      });

      if (filterType !== 'all') {
        params.append('type', filterType);
      }

      const response = await apiService.get(`/consultations?${params.toString()}`);
      return { success: true, data: response };
    } catch (error) {
      let errorMessage = 'Erro na requisição';
      if (error.errors) {
        errorMessage = Object.values(error.errors).flat().join(', ');
      } else if (error.message) {
        errorMessage = error.message;
      }
      console.error('Erro no consultationService:', errorMessage, error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Obter detalhes de uma consulta específica
   */
  async getConsultation(consultationId) {
    try {
      const response = await apiService.get(`/consultations/${consultationId}`);
      return { success: true, data: response };
    } catch (error) {
      let errorMessage = 'Erro na requisição';
      if (error.errors) {
        errorMessage = Object.values(error.errors).flat().join(', ');
      } else if (error.message) {
        errorMessage = error.message;
      }
      console.error('Erro no consultationService:', errorMessage, error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Criar nova consulta
   */
  async createConsultation(consultationData) {
    try {
      console.log('🔵 consultationService.createConsultation - Dados enviados:', consultationData);
      const response = await apiService.post('/consultations', consultationData);
      console.log('✅ consultationService.createConsultation - Resposta:', response);
      return { success: true, data: response };
    } catch (error) {
      let errorMessage = 'Erro na requisição';
      if (error.errors) {
        errorMessage = Object.values(error.errors).flat().join(', ');
      } else if (error.message) {
        errorMessage = error.message;
      }
      console.error('❌ Erro no consultationService:', errorMessage);
      console.error('❌ Erro completo:', JSON.stringify(error, null, 2));
      return { success: false, error: errorMessage, errors: error.errors };
    }
  }

  /**
   * Atualizar consulta existente
   */
  async updateConsultation(consultationId, consultationData) {
    try {
      const response = await apiService.put(`/consultations/${consultationId}`, consultationData);
      return { success: true, data: response };
    } catch (error) {
      let errorMessage = 'Erro na requisição';
      if (error.errors) {
        errorMessage = Object.values(error.errors).flat().join(', ');
      } else if (error.message) {
        errorMessage = error.message;
      }
      console.error('Erro no consultationService:', errorMessage, error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Deletar consulta
   */
  async deleteConsultation(consultationId) {
    try {
      const response = await apiService.delete(`/consultations/${consultationId}`);
      return { success: true, data: response };
    } catch (error) {
      let errorMessage = 'Erro na requisição';
      if (error.errors) {
        errorMessage = Object.values(error.errors).flat().join(', ');
      } else if (error.message) {
        errorMessage = error.message;
      }
      console.error('Erro no consultationService:', errorMessage, error);
      return { success: false, error: errorMessage };
    }
  }
}

export default new ConsultationService();


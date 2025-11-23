import apiService from './apiService';

/**
 * Serviço para gerenciar médicos
 */
class DoctorService {
  /**
   * Criar novo médico
   */
  async createDoctor(doctorData) {
    try {
      const data = {
        name: doctorData.name,
        specialty: doctorData.specialty,
        phone: doctorData.phone,
        email: doctorData.email,
      };

      const response = await apiService.post('/doctors', data);
      return { success: true, data: response };
    } catch (error) {
      console.error('Erro ao criar médico:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao criar médico' 
      };
    }
  }

  /**
   * Listar todos os médicos do usuário
   */
  async getDoctors() {
    try {
      const response = await apiService.get('/doctors');
      return { success: true, data: response };
    } catch (error) {
      console.error('Erro ao buscar médicos:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao buscar médicos' 
      };
    }
  }

  /**
   * Obter detalhes de um médico específico
   */
  async getDoctor(doctorId) {
    try {
      const endpoint = apiService.replaceParams('/doctors/:id', { id: doctorId });
      const response = await apiService.get(endpoint);
      return { success: true, data: response };
    } catch (error) {
      console.error('Erro ao buscar médico:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao buscar médico' 
      };
    }
  }

  /**
   * Atualizar médico
   */
  async updateDoctor(doctorId, doctorData) {
    try {
      const endpoint = apiService.replaceParams('/doctors/:id', { id: doctorId });
      const data = {
        name: doctorData.name,
        specialty: doctorData.specialty,
        phone: doctorData.phone,
        email: doctorData.email,
      };

      const response = await apiService.put(endpoint, data);
      return { success: true, data: response };
    } catch (error) {
      console.error('Erro ao atualizar médico:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao atualizar médico' 
      };
    }
  }

  /**
   * Deletar médico
   */
  async deleteDoctor(doctorId) {
    try {
      const endpoint = apiService.replaceParams('/doctors/:id', { id: doctorId });
      await apiService.delete(endpoint);
      return { success: true };
    } catch (error) {
      console.error('Erro ao deletar médico:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao deletar médico' 
      };
    }
  }
}

export default new DoctorService();


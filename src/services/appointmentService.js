import apiService from './apiService';

/**
 * Serviço para gerenciar consultas
 */
class AppointmentService {
  /**
   * Criar nova consulta
   */
  async createAppointment(appointmentData) {
    try {
      const data = {
        group_id: appointmentData.groupId,
        title: appointmentData.title,
        description: appointmentData.description,
        scheduled_at: appointmentData.scheduledAt,
        doctor_id: appointmentData.doctorId,
        location: appointmentData.location,
        notes: appointmentData.notes,
      };

      console.log('Enviando para API:', data);

      const response = await apiService.post('/appointments', data);
      return { success: true, data: response };
    } catch (error) {
      console.error('Erro ao criar consulta:', error);
      
      // Capturar mensagens de erro específicas da validação
      let errorMessage = 'Erro ao criar consulta';
      if (error.errors) {
        errorMessage = Object.values(error.errors).flat().join(', ');
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  }

  /**
   * Listar consultas de um grupo
   */
  async getAppointments(groupId = null, startDate = null, endDate = null) {
    try {
      let endpoint = '/appointments';
      const params = [];

      if (groupId) {
        params.push(`group_id=${groupId}`);
      }
      if (startDate) {
        params.push(`start_date=${startDate}`);
      }
      if (endDate) {
        params.push(`end_date=${endDate}`);
      }

      if (params.length > 0) {
        endpoint += '?' + params.join('&');
      }

      const response = await apiService.get(endpoint);
      return { success: true, data: response };
    } catch (error) {
      console.error('Erro ao buscar consultas:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao buscar consultas' 
      };
    }
  }

  /**
   * Obter detalhes de uma consulta específica
   */
  async getAppointment(appointmentId) {
    try {
      const endpoint = apiService.replaceParams('/appointments/:id', { id: appointmentId });
      const response = await apiService.get(endpoint);
      return { success: true, data: response };
    } catch (error) {
      console.error('Erro ao buscar consulta:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao buscar consulta' 
      };
    }
  }

  /**
   * Atualizar consulta
   */
  async updateAppointment(appointmentId, appointmentData) {
    try {
      const endpoint = apiService.replaceParams('/appointments/:id', { id: appointmentId });
      const data = {
        title: appointmentData.title,
        description: appointmentData.description,
        scheduled_at: appointmentData.scheduledAt,
        doctor_id: appointmentData.doctorId,
        location: appointmentData.location,
        notes: appointmentData.notes,
      };

      const response = await apiService.put(endpoint, data);
      return { success: true, data: response };
    } catch (error) {
      console.error('Erro ao atualizar consulta:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao atualizar consulta' 
      };
    }
  }

  /**
   * Deletar consulta
   */
  async deleteAppointment(appointmentId) {
    try {
      const endpoint = apiService.replaceParams('/appointments/:id', { id: appointmentId });
      await apiService.delete(endpoint);
      return { success: true };
    } catch (error) {
      console.error('Erro ao deletar consulta:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao deletar consulta' 
      };
    }
  }
}

export default new AppointmentService();


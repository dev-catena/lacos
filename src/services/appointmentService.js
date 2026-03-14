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
      // Se os dados já vierem em snake_case (do AddAppointmentScreen novo)
      const data = appointmentData.group_id ? appointmentData : {
        group_id: appointmentData.groupId,
        type: appointmentData.type || 'common',
        title: appointmentData.title,
        description: appointmentData.description,
        scheduled_at: appointmentData.scheduledAt,
        appointment_date: appointmentData.scheduledAt, // Backend espera este campo
        doctor_id: appointmentData.doctorId,
        medical_specialty_id: appointmentData.medicalSpecialtyId,
        is_teleconsultation: appointmentData.isTeleconsultation || appointmentData.is_teleconsultation || false,
        location: appointmentData.location,
        notes: appointmentData.notes,
      };

      console.log('🔵 appointmentService.createAppointment - Dados enviados:', data);

      const response = await apiService.post('/appointments', data);
      
      console.log('✅ appointmentService.createAppointment - Resposta:', response);
      
      return { success: true, data: response };
    } catch (error) {
      console.error('❌ Erro ao criar compromisso:', error);
      
      // Capturar mensagens de erro específicas da validação
      let errorMessage = 'Erro ao criar compromisso';
      if (error.errors) {
        errorMessage = Object.values(error.errors).flat().join(', ');
        console.error('❌ Erros de validação:', error.errors);
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { 
        success: false, 
        error: errorMessage,
        errors: error.errors
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
        type: appointmentData.type,
        title: appointmentData.title,
        description: appointmentData.description || appointmentData.notes,
        appointment_date: appointmentData.appointmentDate || appointmentData.scheduledAt,
        scheduled_at: appointmentData.scheduledAt || appointmentData.appointmentDate,
        doctor_id: appointmentData.doctorId,
        medical_specialty_id: appointmentData.medicalSpecialtyId,
        is_teleconsultation: appointmentData.isTeleconsultation || appointmentData.is_teleconsultation || false,
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
   * @param {number} appointmentId - ID do compromisso
   * @param {string} exceptionDate - Data específica para excluir (opcional, para recorrências)
   */
  async deleteAppointment(appointmentId, exceptionDate = null) {
    try {
      let endpoint = apiService.replaceParams('/appointments/:id', { id: appointmentId });
      
      // Se for uma exceção (excluir apenas um dia), adicionar parâmetro
      if (exceptionDate) {
        endpoint += `?exception_date=${exceptionDate}`;
      }
      
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

  /**
   * Registrar entrada na videoconferência (para rastreamento de no-show)
   * Janela: 15 min antes até 40 min depois do horário agendado
   * @param {number} appointmentId
   * @param {string} role - 'doctor' | 'patient'
   */
  async videoJoin(appointmentId, role) {
    try {
      const response = await apiService.post(`/appointments/${appointmentId}/video-join`, { role });
      return { success: true, data: response };
    } catch (error) {
      console.warn('Erro ao registrar entrada na videoconferência:', error?.message);
      return { success: false, error: error?.message };
    }
  }

  /**
   * Confirmar que a teleconsulta foi realizada (paciente/cuidador)
   * Libera o pagamento e opcionalmente registra avaliação do médico
   * @param {number} appointmentId
   * @param {object} options - { rating?: 1-5, comment?: string }
   */
  async confirmAppointment(appointmentId, options = {}) {
    try {
      const body = {};
      if (options.rating != null) body.rating = options.rating;
      if (options.comment != null) body.comment = options.comment;

      const response = await apiService.post(`/appointments/${appointmentId}/confirm`, body);

      return {
        success: true,
        data: response,
        message: response.message || 'Consulta confirmada com sucesso',
      };
    } catch (error) {
      console.error('Erro ao confirmar consulta:', error);

      let errorMessage = 'Erro ao confirmar consulta';
      if (error.message) errorMessage = error.message;
      else if (error.errors) errorMessage = Object.values(error.errors).flat().join(', ');

      return {
        success: false,
        error: errorMessage,
        errors: error.errors,
      };
    }
  }

  /**
   * Avaliar médico após teleconsulta realizada
   * @param {number} appointmentId
   * @param {object} data - { rating: 1-5, comment?: string }
   */
  async createAppointmentReview(appointmentId, data) {
    try {
      const response = await apiService.post(`/appointments/${appointmentId}/reviews`, {
        rating: data.rating,
        comment: data.comment || null,
      });

      return {
        success: true,
        data: response,
        message: 'Avaliação enviada com sucesso',
      };
    } catch (error) {
      console.error('Erro ao avaliar médico:', error);

      let errorMessage = 'Erro ao enviar avaliação';
      if (error.message) errorMessage = error.message;
      else if (error.errors) errorMessage = Object.values(error.errors).flat().join(', ');

      return {
        success: false,
        error: errorMessage,
        errors: error.errors,
      };
    }
  }

  /**
   * Cancelar consulta
   */
  async cancelAppointment(appointmentId, cancelledBy = 'doctor', reason = null) {
    try {
      console.log('🚫 appointmentService.cancelAppointment - Cancelando consulta:', {
        appointmentId,
        cancelledBy,
        reason,
      });

      const response = await apiService.post(`/appointments/${appointmentId}/cancel`, {
        cancelled_by: cancelledBy,
        reason: reason,
      });

      console.log('✅ appointmentService.cancelAppointment - Resposta:', response);

      return {
        success: true,
        data: response,
        message: response.message || 'Consulta cancelada com sucesso',
      };
    } catch (error) {
      console.error('❌ Erro ao cancelar consulta:', error);

      let errorMessage = 'Erro ao cancelar consulta';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.errors) {
        errorMessage = Object.values(error.errors).flat().join(', ');
      }

      return {
        success: false,
        error: errorMessage,
        errors: error.errors,
      };
    }
  }
}

export default new AppointmentService();


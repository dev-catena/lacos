import apiService from './apiService';

/**
 * Service para gerenciar pagamentos de consultas
 */
class PaymentService {
  /**
   * Processar pagamento de uma consulta
   * @param {number} appointmentId ID da consulta
   * @param {object} paymentData Dados do pagamento
   * @returns {Promise<object>}
   */
  async processPayment(appointmentId, paymentData) {
    try {
      const response = await apiService.post(
        `/appointments/${appointmentId}/payment`,
        paymentData
      );
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      return {
        success: false,
        error: error.message || 'Erro ao processar pagamento',
        data: error.response?.data,
      };
    }
  }

  /**
   * Verificar status do pagamento
   * @param {number} appointmentId ID da consulta
   * @returns {Promise<object>}
   */
  async getPaymentStatus(appointmentId) {
    try {
      const response = await apiService.get(
        `/appointments/${appointmentId}/payment-status`
      );
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      console.error('Erro ao verificar status do pagamento:', error);
      return {
        success: false,
        error: error.message || 'Erro ao verificar status do pagamento',
        data: error.response?.data,
      };
    }
  }

  /**
   * Confirmar consulta realizada e liberar pagamento
   * @param {number} appointmentId ID da consulta
   * @returns {Promise<object>}
   */
  async confirmAppointment(appointmentId) {
    try {
      const response = await apiService.post(
        `/appointments/${appointmentId}/confirm`,
        { confirmed_by: 'patient' }
      );
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      console.error('Erro ao confirmar consulta:', error);
      return {
        success: false,
        error: error.message || 'Erro ao confirmar consulta',
        data: error.response?.data,
      };
    }
  }

  /**
   * Cancelar consulta e reembolsar
   * @param {number} appointmentId ID da consulta
   * @param {string} cancelledBy Quem cancelou (doctor, patient)
   * @param {string} reason Motivo do cancelamento
   * @returns {Promise<object>}
   */
  async cancelAppointment(appointmentId, cancelledBy = 'patient', reason = null) {
    try {
      const response = await apiService.post(
        `/appointments/${appointmentId}/cancel`,
        {
          cancelled_by: cancelledBy,
          reason: reason,
        }
      );
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      console.error('Erro ao cancelar consulta:', error);
      return {
        success: false,
        error: error.message || 'Erro ao cancelar consulta',
        data: error.response?.data,
      };
    }
  }
}

export default new PaymentService();

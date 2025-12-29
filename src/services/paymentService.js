import apiService from './apiService';

/**
 * Serviço para processar pagamentos com Stripe
 */
class PaymentService {
  /**
   * Criar Payment Intent no backend (Stripe)
   * O backend cria o Payment Intent e retorna o client_secret
   */
  async createPaymentIntent(appointmentId, amount, installments = 1) {
    try {
      console.log('💳 PaymentService - Criando Payment Intent:', {
        appointmentId,
        amount,
        installments,
      });

      const response = await apiService.post('/payments/create-intent', {
        appointment_id: appointmentId,
        amount: Math.round(amount * 100), // Stripe usa centavos
        installments,
      });

      if (response && response.client_secret) {
        console.log('✅ PaymentService - Payment Intent criado com sucesso');
        return {
          success: true,
          clientSecret: response.client_secret,
          paymentIntentId: response.payment_intent_id,
        };
      }

      return {
        success: false,
        error: response.message || 'Erro ao criar Payment Intent',
      };
    } catch (error) {
      console.error('❌ PaymentService - Erro ao criar Payment Intent:', error);
      return {
        success: false,
        error: error.message || 'Erro ao criar Payment Intent',
      };
    }
  }

  /**
   * Confirmar pagamento com cartão
   * Envia os dados do cartão para o backend, que processa via Stripe
   */
  async confirmPayment(paymentIntentId, cardData) {
    try {
      console.log('💳 PaymentService - Confirmando pagamento:', {
        paymentIntentId,
        hasCardData: !!cardData,
      });

      const response = await apiService.post('/payments/confirm', {
        payment_intent_id: paymentIntentId,
        card_number: cardData.cardNumber.replace(/\s/g, ''),
        card_name: cardData.cardName.trim(),
        card_expiry: cardData.cardExpiry.replace('/', ''),
        card_cvv: cardData.cardCvv,
        installments: cardData.installments || 1,
      });

      if (response && response.success) {
        console.log('✅ PaymentService - Pagamento confirmado com sucesso');
        return {
          success: true,
          paymentId: response.payment_id,
          status: response.status,
          message: response.message,
        };
      }

      return {
        success: false,
        error: response.message || 'Erro ao confirmar pagamento',
        errors: response.errors,
      };
    } catch (error) {
      console.error('❌ PaymentService - Erro ao confirmar pagamento:', error);
      return {
        success: false,
        error: error.message || 'Erro ao confirmar pagamento',
        errors: error.errors,
      };
    }
  }

  /**
   * Verificar status do pagamento
   */
  async checkPaymentStatus(paymentIntentId) {
    try {
      const response = await apiService.get(`/payments/status/${paymentIntentId}`);
      
      if (response && response.status) {
        return {
          success: true,
          status: response.status,
          paymentId: response.payment_id,
        };
      }

      return {
        success: false,
        error: 'Erro ao verificar status do pagamento',
      };
    } catch (error) {
      console.error('❌ PaymentService - Erro ao verificar status:', error);
      return {
        success: false,
        error: error.message || 'Erro ao verificar status do pagamento',
      };
    }
  }

  /**
   * Processar pagamento completo (criar intent + confirmar)
   * Método simplificado que faz tudo em uma chamada
   */
  async processPayment(appointmentId, amount, cardData, installments = 1) {
    try {
      console.log('💳 PaymentService - Processando pagamento completo');

      // 1. Criar Payment Intent
      const intentResult = await this.createPaymentIntent(appointmentId, amount, installments);
      
      if (!intentResult.success) {
        return intentResult;
      }

      // 2. Confirmar pagamento
      const confirmResult = await this.confirmPayment(intentResult.paymentIntentId, {
        ...cardData,
        installments,
      });

      return confirmResult;
    } catch (error) {
      console.error('❌ PaymentService - Erro ao processar pagamento:', error);
      return {
        success: false,
        error: error.message || 'Erro ao processar pagamento',
      };
    }
  }
}

export default new PaymentService();


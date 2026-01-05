import apiService from './apiService';
import moment from 'moment';

class AlertService {
  /**
   * Buscar alertas ativos do paciente
   */
  async getActiveAlerts(groupId) {
    try {
      console.log('🔔 AlertService - Buscando alertas ativos para grupo:', groupId);
      
      if (!groupId) {
        console.warn('⚠️ AlertService - groupId não fornecido');
        return {
          success: true,
          data: [],
        };
      }
      
      // Usar get() ao invés de request() para evitar logs de erro desnecessários
      const response = await apiService.get(`/groups/${groupId}/alerts/active`);

      if (response && Array.isArray(response)) {
        console.log(`✅ AlertService - ${response.length} alerta(s) ativo(s)`);
        return {
          success: true,
          data: response,
        };
      } else if (response && response.data) {
        return {
          success: true,
          data: Array.isArray(response.data) ? response.data : [],
        };
      }

      // Se não houver resposta ou resposta vazia, retornar array vazio
      return {
        success: true,
        data: [],
      };
    } catch (error) {
      // Se for erro 500 ou outro erro do servidor, tratar silenciosamente
      // Alertas não são críticos, então não devemos quebrar a UI
      if (error.status === 500 || error.status >= 500) {
        // Logar apenas como warning, não como erro crítico
        console.warn('⚠️ AlertService - Erro do servidor ao buscar alertas (não crítico):', error.status);
        return {
          success: true, // Retornar success: true para não quebrar a UI
          data: [],
          _hasError: true, // Flag interna para indicar que houve erro
        };
      }
      
      // Para outros erros (403, 404, etc), logar normalmente mas ainda retornar array vazio
      console.warn('⚠️ AlertService - Erro ao buscar alertas (não crítico):', error.status, error.message);
      return {
        success: true, // Sempre retornar success: true para não quebrar a UI
        data: [],
        _hasError: true,
      };
    }
  }

  /**
   * Marcar medicamento como tomado
   */
  async markMedicationTaken(alertId) {
    try {
      console.log('✅ AlertService - Marcando medicamento como tomado');
      
      const response = await apiService.request(`/alerts/${alertId}/taken`, {
        method: 'POST',
      });

      return {
        success: true,
        data: response,
      };
    } catch (error) {
      // Se o endpoint não existe (404), retornar erro específico
      if (error.status === 404 || error.message?.includes('not be found')) {
        console.log('ℹ️ AlertService - Endpoint ainda não implementado no backend');
        return {
          success: false,
          error: 'Funcionalidade ainda não está disponível',
        };
      }
      
      console.error('❌ AlertService - Erro ao marcar medicamento:', error);
      return {
        success: false,
        error: error.message || 'Erro ao marcar medicamento',
      };
    }
  }

  /**
   * Dispensar alerta
   */
  async dismissAlert(alertId) {
    try {
      console.log('🔕 AlertService - Dispensando alerta');
      
      const response = await apiService.request(`/alerts/${alertId}/dismiss`, {
        method: 'POST',
      });

      return {
        success: true,
        data: response,
      };
    } catch (error) {
      console.error('❌ AlertService - Erro ao dispensar alerta:', error);
      return {
        success: false,
        error: error.message || 'Erro ao dispensar alerta',
      };
    }
  }

  /**
   * Gerar alertas mock para demonstração
   */
  getMockAlerts() {
    const now = moment();
    
    // Retornar array vazio para não atrapalhar a visualização do carrossel
    // Descomente os alertas abaixo se quiser testar o sistema de alertas
    return [];
    
    /* Alertas de exemplo (descomentados para teste):
    return [
      // Medication alert
      {
        id: 'mock_med_1',
        type: 'medication',
        message: 'Hora de tomar seu medicamento!',
        medication_name: 'Losartana 50mg',
        dosage: '1 comprimido',
        time: now.format(),
        created_at: now.format(),
      },
    ];
    */
  }
}

export default new AlertService();


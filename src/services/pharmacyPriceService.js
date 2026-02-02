import apiService from './apiService';

/**
 * Serviço para gerenciar preços informados por usuários em farmácias
 */
class PharmacyPriceService {
  /**
   * Buscar último preço informado para um medicamento em uma farmácia
   * @param {string} medicationName - Nome do medicamento
   * @param {string} pharmacyName - Nome da farmácia
   * @returns {Promise<Object>} Objeto com o último preço informado
   */
  async getLastPrice(medicationName, pharmacyName) {
    try {
      if (!medicationName || !pharmacyName) {
        return {
          success: false,
          error: 'Nome do medicamento e da farmácia são obrigatórios',
        };
      }

      const response = await apiService.get(
        `/pharmacy-prices/last?medication_name=${encodeURIComponent(medicationName)}&pharmacy_name=${encodeURIComponent(pharmacyName)}`
      );

      // Verificar se a resposta tem dados válidos
      if (response && response.data && response.data.price !== undefined) {
        return {
          success: true,
          data: response.data,
        };
      }

      // Se não tiver dados válidos, retornar como não encontrado
      return {
        success: false,
        message: 'Nenhum preço informado ainda',
        data: null,
      };
    } catch (error) {
      // Se não encontrar (404), retornar como não encontrado (não é erro crítico)
      if (error.status === 404) {
        return {
          success: false,
          message: 'Nenhum preço informado ainda',
          data: null,
        };
      }

      // Outros erros são críticos
      console.error('Erro ao buscar último preço:', error);
      return {
        success: false,
        error: error.message || 'Erro ao buscar preço',
        data: null,
      };
    }
  }

  /**
   * Salvar novo preço informado pelo usuário
   * @param {Object} priceData - Dados do preço
   * @param {string} priceData.medicationName - Nome do medicamento
   * @param {string} priceData.pharmacyName - Nome da farmácia
   * @param {string} priceData.pharmacyAddress - Endereço da farmácia (opcional)
   * @param {number} priceData.price - Preço informado
   * @param {string} priceData.notes - Observações (opcional)
   * @param {number} priceData.groupId - ID do grupo (opcional)
   * @returns {Promise<Object>} Resultado da operação
   */
  async savePrice(priceData) {
    try {
      const { medicationName, pharmacyName, pharmacyAddress, price, notes, groupId } = priceData;

      if (!medicationName || !pharmacyName || !price) {
        return {
          success: false,
          error: 'Nome do medicamento, farmácia e preço são obrigatórios',
        };
      }

      const response = await apiService.post('/pharmacy-prices', {
        medication_name: medicationName,
        pharmacy_name: pharmacyName,
        pharmacy_address: pharmacyAddress || null,
        price: parseFloat(price),
        notes: notes || null,
        group_id: groupId || null,
      });

      return {
        success: true,
        data: response,
        message: response.message || 'Preço informado com sucesso!',
      };
    } catch (error) {
      console.error('Erro ao salvar preço:', error);
      return {
        success: false,
        error: error.message || 'Erro ao salvar preço',
      };
    }
  }

  /**
   * Buscar histórico de preços para um medicamento em uma farmácia
   * @param {string} medicationName - Nome do medicamento
   * @param {string} pharmacyName - Nome da farmácia
   * @param {number} limit - Limite de resultados (padrão: 10)
   * @returns {Promise<Object>} Histórico de preços
   */
  async getHistory(medicationName, pharmacyName, limit = 10) {
    try {
      if (!medicationName || !pharmacyName) {
        return {
          success: false,
          error: 'Nome do medicamento e da farmácia são obrigatórios',
        };
      }

      const response = await apiService.get(
        `/pharmacy-prices/history?medication_name=${encodeURIComponent(medicationName)}&pharmacy_name=${encodeURIComponent(pharmacyName)}&limit=${limit}`
      );

      return {
        success: true,
        data: response.data || [],
      };
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      return {
        success: false,
        error: error.message || 'Erro ao buscar histórico',
        data: [],
      };
    }
  }
}

export default new PharmacyPriceService();


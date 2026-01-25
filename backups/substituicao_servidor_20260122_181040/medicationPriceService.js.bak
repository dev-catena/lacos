import apiService from './apiService';

/**
 * Serviço para buscar preços reais de medicamentos
 * 
 * IMPORTANTE: O pacote med_price_anvisa não funciona no React Native
 * porque usa módulos do Node.js (fs, path, etc).
 * 
 * Este serviço busca preços através do backend Laravel, que deve
 * usar o pacote med_price_anvisa no servidor.
 */

class MedicationPriceService {
  /**
   * Buscar preço de um medicamento pelo nome
   * Busca através do backend Laravel que usa med_price_anvisa
   * @param {string} medicationName - Nome do medicamento
   * @returns {Promise<Object>} Objeto com preço e informações do medicamento
   */
  async getMedicationPrice(medicationName) {
    try {
      if (!medicationName || medicationName.trim().length < 2) {
        return {
          success: false,
          error: 'Nome do medicamento inválido',
          fallback: true,
        };
      }

      // Buscar preço via backend Laravel
      // O backend deve ter o endpoint: GET /api/medications/price?name={medicationName}
      return await this.getPriceFromBackend(medicationName);
    } catch (error) {
      console.error('Erro ao buscar preço do medicamento:', error);
      return {
        success: false,
        error: error.message || 'Erro ao buscar preço',
        fallback: true,
      };
    }
  }

  /**
   * Buscar preço via backend Laravel
   * O backend deve usar o pacote med_price_anvisa no servidor
   * @param {string} medicationName - Nome do medicamento
   * @returns {Promise<Object>} Objeto com preço
   */
  async getPriceFromBackend(medicationName) {
    try {
      // Chamar endpoint do backend: GET /api/medications/price?name={medicationName}
      const response = await apiService.get(`/medications/price?name=${encodeURIComponent(medicationName)}`);
      
      if (response && response.price !== undefined) {
        return {
          success: true,
          data: {
            name: response.name || medicationName,
            price: parseFloat(response.price),
            presentation: response.presentation,
            manufacturer: response.manufacturer,
            registration: response.registration,
            source: 'anvisa',
          },
        };
      }
      
      return {
        success: false,
        error: 'Preço não encontrado',
        fallback: true,
      };
    } catch (error) {
      // Se o endpoint não existir (404) ou houver erro, retornar fallback
      if (error.status === 404 || error.status === 500) {
        console.log('⚠️ Endpoint de preços não implementado no backend ainda ou erro no servidor');
      } else {
        console.error('Erro ao buscar preço no backend:', error);
      }
      return {
        success: false,
        error: error.message || 'Erro ao buscar preço',
        fallback: true,
      };
    }
  }

  /**
   * Buscar múltiplos medicamentos
   * @param {Array<string>} medicationNames - Array com nomes de medicamentos
   * @returns {Promise<Array>} Array com preços dos medicamentos
   */
  async getMultipleMedicationPrices(medicationNames) {
    try {
      const prices = await Promise.all(
        medicationNames.map(name => this.getMedicationPrice(name))
      );
      return prices;
    } catch (error) {
      console.error('Erro ao buscar preços múltiplos:', error);
      return [];
    }
  }

  /**
   * Buscar preço médio de um medicamento (média de diferentes apresentações)
   * @param {string} medicationName - Nome do medicamento
   * @returns {Promise<number|null>} Preço médio ou null
   */
  async getAveragePrice(medicationName) {
    try {
      const result = await this.getMedicationPrice(medicationName);
      
      if (result.success && result.data) {
        return result.data.price;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao calcular preço médio:', error);
      return null;
    }
  }
}

export default new MedicationPriceService();


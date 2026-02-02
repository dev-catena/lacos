import apiService from './apiService';

/**
 * Serviço para buscar medicamentos em APIs públicas
 * 
 * Fontes disponíveis:
 * 1. Lista completa de 7901 medicamentos (JSON)
 * 2. Lista local reduzida (fallback)
 * 3. API pública (quando disponível)
 */

// Lista reduzida de medicamentos comuns no Brasil (fallback rápido)
const FALLBACK_MEDICATIONS_LIST = [
  // Anti-hipertensivos
  'Losartana', 'Enalapril', 'Captopril', 'Atenolol', 'Propranolol',
  'Amlodipina', 'Hidroclorotiazida', 'Furosemida', 'Espironolactona',
  
  // Estatinas (colesterol)
  'Sinvastatina', 'Atorvastatina', 'Rosuvastatina', 'Pravastatina',
  
  // Antiácidos e digestivos
  'Omeprazol', 'Pantoprazol', 'Ranitidina', 'Drotaverina', 'Metoclopramida',
  
  // Diabetes
  'Metformina', 'Glibenclamida', 'Gliclazida', 'Insulina',
  
  // Analgésicos e anti-inflamatórios
  'Dipirona', 'Paracetamol', 'Ibuprofeno', 'Diclofenaco', 'Naproxeno',
  'Cetoprofeno', 'Nimesulida',
  
  // Antibióticos
  'Amoxicilina', 'Azitromicina', 'Cefalexina', 'Ciprofloxacino',
  'Doxiciclina', 'Eritromicina',
  
  // Outros comuns
  'Levotiroxina', 'Sertralina', 'Fluoxetina', 'Amitriptilina',
  'Loratadina', 'Desloratadina', 'Prednisona', 'Dexametasona',
  'Warfarina', 'AAS (Ácido Acetilsalicílico)', 'Clonazepam', 'Diazepam',
];

// Lista de medicamentos disponíveis na Farmácia Popular (gratuitos ou com desconto)
// Fonte: Programa Farmácia Popular do Brasil - Ministério da Saúde
// Lista atualizada com 36 medicamentos únicos
const FARMACIA_POPULAR_MEDICATIONS = [
  // Nomes completos dos medicamentos da Farmácia Popular
  'ACETATO DE MEDROXIPROGESTERONA 150MG',
  'ATENOLOL 25MG',
  'BESILATO DE ANLODIPINO 5 MG',
  'BROMETO DE IPRATRÓPIO 0,02MG',
  'BROMETO DE IPRATRÓPIO 0,25MG',
  'CAPTOPRIL 25MG',
  'CARBIDOPA 25MG + LEVODOPA 250MG',
  'CLORIDRATO DE BENSERAZIDA 25MG + LEVODOPA 100MG',
  'CLORIDRATO DE METFORMINA 500MG',
  'CLORIDRATO DE METFORMINA 500MG - AÇÃO PROLONGADA',
  'CLORIDRATO DE METFORMINA 850MG',
  'CLORIDRATO DE PROPRANOLOL 40MG',
  'DAPAGLIFLOZINA 10 MG',
  'DIPROPIONATO DE BECLOMETASONA 200MCG',
  'DIPROPIONATO DE BECLOMETASONA 250MCG',
  'DIPROPIONATO DE BECLOMETASONA 50MCG',
  'ESPIRONOLACTONA 25 MG',
  'ETINILESTRADIOL 0,03MG + LEVONORGESTREL 0,15MG - 3 CARTELAS COM 21 COMPRIMIDOS',
  'ETINILESTRADIOL 0,03MG + LEVONORGESTREL 0,15MG - CARTELA COM 21 COMPRIMIDOS',
  'FUROSEMIDA 40 MG',
  'GLIBENCLAMIDA 5MG',
  'HIDROCLOROTIAZIDA 25MG',
  'INSULINA HUMANA 100UI/ML',
  'INSULINA HUMANA REGULAR 100UI/ML',
  'LOSARTANA POTÁSSICA 50MG',
  'MALEATO DE ENALAPRIL 10MG',
  'MALEATO DE TIMOLOL 2,5MG',
  'MALEATO DE TIMOLOL 5MG',
  'NORETISTERONA 0,35MG',
  'SINVASTATINA 10MG',
  'SINVASTATINA 20MG',
  'SINVASTATINA 40MG',
  'SUCCINATO DE METOPROLOL 25 MG',
  'SULFATO DE SALBUTAMOL 100MCG',
  'SULFATO DE SALBUTAMOL 5MG',
  'VALERATO DE ESTRADIOL 5MG + ENANTATO DE NORETISTERONA 50MG',
  
  // Também incluir variações comuns dos nomes para facilitar a busca
  'Atenolol',
  'Amlodipina',
  'Besilato de Anlodipino',
  'Captopril',
  'Metformina',
  'Propranolol',
  'Losartana',
  'Enalapril',
  'Furosemida',
  'Espironolactona',
  'Glibenclamida',
  'Hidroclorotiazida',
  'Insulina',
  'Sinvastatina',
  'Metoprolol',
  'Salbutamol',
  'Beclemetasona',
  'Ipratrópio',
  'Timolol',
  'Medroxiprogesterona',
  'Noretisterona',
  'Estradiol',
  'Dapagliflozina',
];

class MedicationSearchService {
  constructor() {
    // Cache para a lista completa de medicamentos
    this.fullMedicationsList = null;
    this.loadingPromise = null;
  }

  /**
   * Carregar lista completa de medicamentos do JSON (lazy loading)
   * @returns {Promise<Array>} Lista completa de medicamentos
   */
  async loadFullMedicationsList() {
    // Se já está carregando, retornar a mesma promise
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    // Se já está em cache, retornar imediatamente
    if (this.fullMedicationsList) {
      return this.fullMedicationsList;
    }

    // Iniciar carregamento
    this.loadingPromise = (async () => {
      try {
        // Tentar carregar do arquivo JSON
        const medicationsData = require('../data/medications.json');
        
        // Verificar se é array ou objeto com array
        const medications = Array.isArray(medicationsData) 
          ? medicationsData 
          : (medicationsData.medications || medicationsData.list || []);
        
        if (medications.length > 0) {
          console.log(`✅ Lista completa carregada: ${medications.length} medicamentos`);
          this.fullMedicationsList = medications;
          return medications;
        } else {
          console.warn('⚠️ Arquivo JSON vazio, usando lista fallback');
          this.fullMedicationsList = FALLBACK_MEDICATIONS_LIST;
          return FALLBACK_MEDICATIONS_LIST;
        }
      } catch (error) {
        console.warn('⚠️ Erro ao carregar lista completa, usando fallback:', error.message);
        // Usar lista fallback em caso de erro
        this.fullMedicationsList = FALLBACK_MEDICATIONS_LIST;
        return FALLBACK_MEDICATIONS_LIST;
      } finally {
        // Limpar promise de carregamento
        this.loadingPromise = null;
      }
    })();

    return this.loadingPromise;
  }

  /**
   * Extrair apenas o nome do medicamento, removendo concentração e forma farmacêutica
   * @param {string} medicationName - Nome completo do medicamento
   * @returns {string} Nome do medicamento sem concentração
   */
  extractMedicationNameOnly(medicationName) {
    if (!medicationName) return '';
    
    // Remover padrões comuns de concentração (ex: "500mg", "20mg", "10mg/ml")
    let name = medicationName
      .replace(/\s+\d+\.?\d*\s*(mg|g|mcg|UI|ml|mL|%)\s*/gi, '') // Remove "500mg", "20mg", etc
      .replace(/\s+\d+\.?\d*\s*(mg|g|mcg|UI|ml|mL|%)\/\s*(ml|mL|g)\s*/gi, '') // Remove "10mg/ml"
      .replace(/\s+\d+\s*(mg|g|mcg|UI|ml|mL|%)\s*/gi, '') // Remove "500 mg" (com espaço)
      .trim();
    
    // Remover formas farmacêuticas comuns no final
    const forms = ['Cápsula', 'Comprimido', 'Gotas', 'Xarope', 'Solução', 'Suspensão', 
                   'Pomada', 'Creme', 'Gel', 'Spray', 'Colírio', 'Supositório', 'Óvulo',
                   'Ampola', 'Frasco', 'Sachê', 'Adesivo', 'Bombinha', 'Inalável'];
    
    for (const form of forms) {
      const regex = new RegExp(`\\s+${form}\\s*$`, 'i');
      name = name.replace(regex, '').trim();
    }
    
    return name.trim() || medicationName; // Se remover tudo, retornar original
  }

  /**
   * Buscar medicamentos por nome (autocomplete)
   * Tenta usar API do backend primeiro, depois fallback local
   * @param {string} query - Termo de busca
   * @param {number} limit - Limite de resultados (padrão: 10)
   * @returns {Promise<Array>} Lista de medicamentos encontrados (sem duplicatas)
   */
  async searchMedications(query, limit = 10) {
    try {
      if (!query || query.trim().length < 2) {
        return [];
      }

      // Tentar buscar na API do backend primeiro
      try {
        const apiResults = await this.searchInBackendAPI(query, limit);
        if (apiResults && apiResults.length > 0) {
          return apiResults;
        }
      } catch (apiError) {
        console.warn('Erro ao buscar na API do backend, usando fallback local:', apiError.message);
      }

      // Fallback: usar lista local
      const searchTerm = query.toLowerCase().trim();

      // Carregar lista completa (com cache)
      const medicationsList = await this.loadFullMedicationsList();

      // Filtrar medicamentos que contêm o termo de busca
      const allResults = medicationsList
        .filter(med => {
          const medName = typeof med === 'string' ? med : (med.name || med.nome || '');
          return medName.toLowerCase().includes(searchTerm);
        })
        .map(med => {
          const medName = typeof med === 'string' ? med : (med.name || med.nome || '');
          // Exibir apenas o nome na lista (sem concentração)
          const displayName = this.extractMedicationNameOnly(medName);
          return {
            name: medName, // Nome completo para salvar
            displayName: displayName, // Apenas nome para exibir na lista
            source: 'local',
          };
        });

      // Remover duplicatas baseado no displayName (nome sem concentração)
      // Usar Map para manter apenas a primeira ocorrência de cada displayName
      const uniqueResultsMap = new Map();
      
      for (const result of allResults) {
        const displayNameLower = result.displayName.toLowerCase().trim();
        // Se ainda não existe no Map, adicionar
        if (!uniqueResultsMap.has(displayNameLower)) {
          uniqueResultsMap.set(displayNameLower, result);
        }
      }
      
      // Converter Map para Array e limitar resultados
      const results = Array.from(uniqueResultsMap.values()).slice(0, limit);

      return results;
    } catch (error) {
      console.error('Erro ao buscar medicamentos:', error);
      // Em caso de erro, tentar com lista fallback
      try {
        const searchTerm = query.toLowerCase().trim();
        const fallbackResults = FALLBACK_MEDICATIONS_LIST
          .filter(med => med.toLowerCase().includes(searchTerm))
          .map(med => ({
            name: med,
            displayName: this.extractMedicationNameOnly(med), // Aplicar também no fallback
            source: 'fallback',
          }));
        
        // Remover duplicatas também no fallback
        const uniqueFallbackMap = new Map();
        for (const result of fallbackResults) {
          const displayNameLower = result.displayName.toLowerCase().trim();
          if (!uniqueFallbackMap.has(displayNameLower)) {
            uniqueFallbackMap.set(displayNameLower, result);
          }
        }
        
        return Array.from(uniqueFallbackMap.values()).slice(0, limit);
      } catch (fallbackError) {
        return [];
      }
    }
  }

  /**
   * Buscar medicamentos na API do backend
   * @param {string} query - Termo de busca
   * @param {number} limit - Limite de resultados
   * @returns {Promise<Array>} Lista de medicamentos da API
   */
  async searchInBackendAPI(query, limit = 10) {
    try {
      // Construir URL com query parameters
      const queryParams = new URLSearchParams({
        q: query,
        limit: limit.toString(),
      });
      const endpoint = `/medications/search?${queryParams.toString()}`;
      
      const response = await apiService.get(endpoint, {
        requiresAuth: false, // Busca de medicamentos é pública
      });

      if (response && response.success && response.data) {
        return response.data.map(item => ({
          name: item.name || item.nome_produto, // Nome completo
          displayName: item.displayName || this.extractMedicationNameOnly(item.name || item.nome_produto), // Nome limpo
          principio_ativo: item.principio_ativo,
          classe_terapeutica: item.classe_terapeutica,
          source: 'database',
        }));
      }

      return [];
    } catch (error) {
      console.error('Erro ao buscar na API do backend:', error);
      return [];
    }
  }

  /**
   * Buscar medicamento em API pública (futuro)
   * @param {string} query - Termo de busca
   * @returns {Promise<Array>} Lista de medicamentos da API
   */
  async searchInPublicAPI(query) {
    try {
      // TODO: Implementar busca em API pública
      // Opções:
      // 1. MedAnvisaPrice (npm package)
      // 2. Ambiente Medicamentos API
      // 3. Sara - Plataforma de Bula Digital
      
      // Exemplo de estrutura para API futura:
      /*
      const response = await fetch(`https://api.exemplo.com/medicamentos?q=${query}`);
      const data = await response.json();
      return data.map(item => ({
        name: item.nome,
        displayName: `${item.nome} ${item.apresentacao || ''}`,
        dosage: item.dosagem,
        form: item.forma_farmaceutica,
        source: 'api',
      }));
      */
      
      return [];
    } catch (error) {
      console.error('Erro ao buscar na API pública:', error);
      return [];
    }
  }

  /**
   * Obter lista completa de medicamentos comuns (sem duplicatas)
   * @returns {Promise<Array>} Lista de medicamentos únicos
   */
  async getCommonMedications() {
    const medicationsList = await this.loadFullMedicationsList();
    const allMedications = medicationsList.map(med => {
      const medName = typeof med === 'string' ? med : (med.name || med.nome || '');
      // Exibir apenas o nome na lista (sem concentração)
      const displayName = this.extractMedicationNameOnly(medName);
      return {
        name: medName, // Nome completo para salvar
        displayName: displayName, // Apenas nome para exibir
      };
    });
    
    // Remover duplicatas baseado no displayName (nome sem concentração)
    const uniqueMedicationsMap = new Map();
    
    for (const med of allMedications) {
      const displayNameLower = med.displayName.toLowerCase().trim();
      // Se ainda não existe no Map, adicionar
      if (!uniqueMedicationsMap.has(displayNameLower)) {
        uniqueMedicationsMap.set(displayNameLower, med);
      }
    }
    
    // Converter Map para Array
    return Array.from(uniqueMedicationsMap.values());
  }

  /**
   * Verificar se um medicamento faz parte da Farmácia Popular
   * @param {string} medicationName - Nome do medicamento
   * @returns {boolean} true se o medicamento está na Farmácia Popular
   */
  isFarmaciaPopular(medicationName) {
    if (!medicationName) return false;
    
    const normalizedName = medicationName.trim().toLowerCase();
    
    // Verificar se está na lista (comparação case-insensitive e parcial)
    // Primeiro verifica correspondência exata
    const exactMatch = FARMACIA_POPULAR_MEDICATIONS.some(
      med => med.toLowerCase() === normalizedName
    );
    
    if (exactMatch) return true;
    
    // Se não encontrar correspondência exata, verifica se o nome contém
    // palavras-chave dos medicamentos da Farmácia Popular
    const keywords = [
      'atenolol', 'amlodipina', 'besilato de anlodipino', 'captopril',
      'metformina', 'propranolol', 'losartana', 'enalapril', 'furosemida',
      'espironolactona', 'glibenclamida', 'hidroclorotiazida', 'insulina',
      'sinvastatina', 'metoprolol', 'salbutamol', 'beclometasona', 'ipratrópio',
      'timolol', 'medroxiprogesterona', 'noretisterona', 'estradiol',
      'dapagliflozina', 'carbidopa', 'levodopa', 'benserazida',
    ];
    
    return keywords.some(keyword => normalizedName.includes(keyword));
  }

  /**
   * Buscar informações completas de um medicamento (nome, preço, farmácia popular, etc)
   * @param {string} medicationName - Nome do medicamento
   * @returns {Object} Informações do medicamento
   */
  async getMedicationInfo(medicationName) {
    try {
      const isPopular = this.isFarmaciaPopular(medicationName);
      
      return {
        name: medicationName,
        isFarmaciaPopular: isPopular,
        // TODO: Integrar com API de preços quando disponível
        price: null,
      };
    } catch (error) {
      console.error('Erro ao buscar informações do medicamento:', error);
      return {
        name: medicationName,
        isFarmaciaPopular: false,
        price: null,
      };
    }
  }
}

export default new MedicationSearchService();


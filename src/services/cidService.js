/**
 * Serviço para buscar códigos CID (Classificação Internacional de Doenças)
 */

// Lista de CIDs mais comuns (formato: código - descrição)
const COMMON_CIDS = [
  { code: 'A00', description: 'Cólera' },
  { code: 'A01', description: 'Febres tifóide e paratifóide' },
  { code: 'A09', description: 'Diarreia e gastroenterite de origem infecciosa presumível' },
  { code: 'B00', description: 'Infecções pelo vírus do herpes [herpes simples]' },
  { code: 'B02', description: 'Herpes zoster' },
  { code: 'B15', description: 'Hepatite aguda A' },
  { code: 'B16', description: 'Hepatite aguda B' },
  { code: 'B17', description: 'Outras hepatites virais agudas' },
  { code: 'C50', description: 'Neoplasia maligna da mama' },
  { code: 'C34', description: 'Neoplasia maligna dos brônquios e dos pulmões' },
  { code: 'C61', description: 'Neoplasia maligna da próstata' },
  { code: 'D50', description: 'Anemia por deficiência de ferro' },
  { code: 'E10', description: 'Diabetes mellitus insulino-dependente' },
  { code: 'E11', description: 'Diabetes mellitus não-insulino-dependente' },
  { code: 'E14', description: 'Diabetes mellitus não especificado' },
  { code: 'F10', description: 'Transtornos mentais e comportamentais devidos ao uso de álcool' },
  { code: 'F20', description: 'Esquizofrenia' },
  { code: 'F32', description: 'Episódios depressivos' },
  { code: 'F41', description: 'Outros transtornos de ansiedade' },
  { code: 'G00', description: 'Meningite bacteriana não classificada em outra parte' },
  { code: 'G43', description: 'Enxaqueca' },
  { code: 'G44', description: 'Outras síndromes de algias cefálicas' },
  { code: 'H00', description: 'Hordéolo e calázio' },
  { code: 'H01', description: 'Outras inflamações da pálpebra' },
  { code: 'H10', description: 'Conjuntivite' },
  { code: 'H25', description: 'Catarata senil' },
  { code: 'I10', description: 'Hipertensão essencial (primária)' },
  { code: 'I11', description: 'Doença cardíaca hipertensiva' },
  { code: 'I20', description: 'Angina pectoris' },
  { code: 'I21', description: 'Infarto agudo do miocárdio' },
  { code: 'I25', description: 'Doença isquêmica crônica do coração' },
  { code: 'I50', description: 'Insuficiência cardíaca' },
  { code: 'J00', description: 'Nasofaringite aguda (resfriado comum)' },
  { code: 'J01', description: 'Sinusite aguda' },
  { code: 'J02', description: 'Faringite aguda' },
  { code: 'J03', description: 'Amigdalite aguda' },
  { code: 'J04', description: 'Laringite e traqueíte agudas' },
  { code: 'J06', description: 'Infecções agudas das vias aéreas superiores, de localizações múltiplas e não especificadas' },
  { code: 'J10', description: 'Influenza devida a vírus influenza identificado' },
  { code: 'J11', description: 'Influenza devida a vírus não identificado' },
  { code: 'J12', description: 'Pneumonia viral não classificada em outra parte' },
  { code: 'J13', description: 'Pneumonia devida a Streptococcus pneumoniae' },
  { code: 'J14', description: 'Pneumonia devida a Haemophilus influenzae' },
  { code: 'J15', description: 'Pneumonia bacteriana não classificada em outra parte' },
  { code: 'J18', description: 'Pneumonia por microorganismo não especificado' },
  { code: 'J20', description: 'Bronquite aguda' },
  { code: 'J40', description: 'Bronquite não especificada como aguda ou crônica' },
  { code: 'J41', description: 'Bronquite crônica simples e mucopurulenta' },
  { code: 'J44', description: 'Outras doenças pulmonares obstrutivas crônicas' },
  { code: 'J45', description: 'Asma' },
  { code: 'K25', description: 'Úlcera gástrica' },
  { code: 'K26', description: 'Úlcera duodenal' },
  { code: 'K29', description: 'Gastrite e duodenite' },
  { code: 'K59', description: 'Outros transtornos funcionais do intestino' },
  { code: 'K80', description: 'Colelitíase' },
  { code: 'K81', description: 'Colecistite' },
  { code: 'L00', description: 'Síndrome da pele escaldada estafilocócica do recém-nascido' },
  { code: 'L01', description: 'Impetigo' },
  { code: 'L02', description: 'Abscesso cutâneo, furúnculo e antraz' },
  { code: 'L03', description: 'Celulite' },
  { code: 'L08', description: 'Outras infecções localizadas da pele e do tecido subcutâneo' },
  { code: 'L50', description: 'Urticária' },
  { code: 'M00', description: 'Artrite piogênica' },
  { code: 'M13', description: 'Outras artrites' },
  { code: 'M19', description: 'Artrose' },
  { code: 'M25', description: 'Outros transtornos articulares não classificados em outra parte' },
  { code: 'M54', description: 'Dor nas costas' },
  { code: 'M79', description: 'Outros transtornos dos tecidos moles não classificados em outra parte' },
  { code: 'N10', description: 'Nefrite túbulo-intersticial aguda' },
  { code: 'N11', description: 'Nefrite túbulo-intersticial crônica' },
  { code: 'N18', description: 'Insuficiência renal crônica' },
  { code: 'N30', description: 'Cistite' },
  { code: 'N39', description: 'Outros transtornos do sistema urinário' },
  { code: 'O80', description: 'Parto único espontâneo' },
  { code: 'O82', description: 'Parto único por cesariana' },
  { code: 'P07', description: 'Transtornos relacionados com gestação de curta duração e baixo peso ao nascer' },
  { code: 'R00', description: 'Anormalidades do batimento cardíaco' },
  { code: 'R05', description: 'Tosse' },
  { code: 'R06', description: 'Anormalidades da respiração' },
  { code: 'R50', description: 'Febre de origem desconhecida' },
  { code: 'R51', description: 'Cefaléia' },
  { code: 'R52', description: 'Dor não classificada em outra parte' },
  { code: 'R53', description: 'Mal-estar e fadiga' },
  { code: 'S00', description: 'Traumatismo superficial da cabeça' },
  { code: 'S01', description: 'Ferimento da cabeça' },
  { code: 'S02', description: 'Fratura do crânio e dos ossos da face' },
  { code: 'S06', description: 'Traumatismo intracraniano' },
  { code: 'T78', description: 'Efeitos adversos não classificados em outra parte' },
  { code: 'Z00', description: 'Exame geral e investigação de pessoas sem queixas ou diagnóstico relatado' },
  { code: 'Z20', description: 'Contato com e exposição a doenças transmissíveis' },
  { code: 'Z51', description: 'Outras formas de assistência médica' },
];

class CIDService {
  /**
   * Buscar códigos CID por código ou descrição
   * @param {string} query - Termo de busca (código ou descrição)
   * @param {number} limit - Limite de resultados (padrão: 10)
   * @returns {Array} Lista de CIDs encontrados
   */
  searchCID(query, limit = 10) {
    if (!query || query.trim().length < 1) {
      return [];
    }

    const searchTerm = query.trim().toUpperCase();
    
    // Buscar por código (ex: A00, E10) ou descrição
    const results = COMMON_CIDS
      .filter(cid => {
        const codeMatch = cid.code.toUpperCase().includes(searchTerm);
        const descMatch = cid.description.toUpperCase().includes(searchTerm);
        return codeMatch || descMatch;
      })
      .slice(0, limit);

    return results.map(cid => ({
      code: cid.code,
      description: cid.description,
      display: `${cid.code} - ${cid.description}`,
    }));
  }

  /**
   * Obter CID pelo código exato
   * @param {string} code - Código CID (ex: E10)
   * @returns {Object|null} CID encontrado ou null
   */
  getCIDByCode(code) {
    if (!code) return null;
    
    const normalizedCode = code.trim().toUpperCase();
    const found = COMMON_CIDS.find(cid => cid.code.toUpperCase() === normalizedCode);
    
    if (found) {
      return {
        code: found.code,
        description: found.description,
        display: `${found.code} - ${found.description}`,
      };
    }
    
    return null;
  }

  /**
   * Validar formato do código CID
   * @param {string} code - Código CID
   * @returns {boolean} True se o formato é válido
   */
  isValidFormat(code) {
    if (!code) return false;
    // Formato CID: letra seguida de 2 dígitos (ex: A00, E10)
    const cidRegex = /^[A-Z][0-9]{2}$/;
    return cidRegex.test(code.trim().toUpperCase());
  }
}

export default new CIDService();



import { Alert } from 'react-native';
import GOOGLE_MAPS_CONFIG from '../config/maps';

/**
 * Verifica se a API Key do Google Maps está configurada
 * @returns {boolean} true se configurada, false se não
 */
export const checkGoogleMapsConfig = () => {
  const apiKey = GOOGLE_MAPS_CONFIG.API_KEY;
  
  // Verifica se é a chave padrão
  if (!apiKey || apiKey === 'SUA_API_KEY_AQUI') {
    Alert.alert(
      '🗺️ Google Maps não configurado',
      'Para usar o autocomplete de endereços, você precisa:\n\n' +
      '1. Obter uma API Key do Google Maps\n' +
      '2. Configurar em src/config/maps.js\n\n' +
      'Consulte o arquivo GOOGLE_MAPS_SETUP.md para instruções detalhadas.',
      [
        { text: 'OK', style: 'default' },
      ]
    );
    return false;
  }
  
  return true;
};

/**
 * Verifica se a API Key tem o formato correto
 * @returns {boolean} true se válida, false se não
 */
export const validateApiKey = () => {
  const apiKey = GOOGLE_MAPS_CONFIG.API_KEY;
  
  // API Keys do Google geralmente têm 39 caracteres e começam com AIza
  if (apiKey.length < 30) {
    console.warn('⚠️ API Key do Google Maps parece inválida (muito curta)');
    return false;
  }
  
  if (!apiKey.startsWith('AIza')) {
    console.warn('⚠️ API Key do Google Maps pode estar incorreta (formato inválido)');
    return false;
  }
  
  return true;
};

/**
 * Mensagem de ajuda para configuração
 */
export const showGoogleMapsHelp = () => {
  Alert.alert(
    '🗺️ Como configurar o Google Maps',
    'Passos rápidos:\n\n' +
    '1. Acesse: console.cloud.google.com\n' +
    '2. Crie um projeto\n' +
    '3. Ative "Places API"\n' +
    '4. Crie uma API Key\n' +
    '5. Cole em src/config/maps.js\n\n' +
    'Veja instruções completas em GOOGLE_MAPS_SETUP.md',
    [
      { text: 'Entendi', style: 'default' },
    ]
  );
};


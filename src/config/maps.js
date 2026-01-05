/**
 * Configuração do Google Maps API
 * 
 * Para obter sua API Key:
 * 1. Acesse: https://console.cloud.google.com/
 * 2. Crie um novo projeto (ou selecione um existente)
 * 3. Ative a API "Places API"
 * 4. Vá em "Credenciais" e crie uma "API Key"
 * 5. Restrinja a key para "Places API" apenas
 * 6. Cole a key abaixo
 */

const GOOGLE_MAPS_CONFIG = {
  // IMPORTANTE: Substitua pela sua API Key do Google Cloud Console
  API_KEY: 'AIzaSyBK7C7316fc5jZAcVFHe_wEdefuZ5fwGqk', // TODO: Substituir pela chave real
  
  // Configurações opcionais
  language: 'pt-BR',
  region: 'BR', // Prioriza resultados do Brasil
};

export default GOOGLE_MAPS_CONFIG;


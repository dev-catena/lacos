// Configuração de ambiente — URL do backend Laravel (API)
//
// Em builds de release o app usa sempre a API de produção (gateway HTTPS).
// Em desenvimento (__DEV__), o padrão é produção; para usar o Laravel na LAN,
// defina USE_LOCAL_BACKEND = true.
//
// EXPO / HTTPS: para túnel (Expo Go), use NGROK_URL com USE_LOCAL_BACKEND = true.

/** true = API em LAN/ngrok quando __DEV__; false = sempre gateway de produção (inclui __DEV__) */
const USE_LOCAL_BACKEND = false;

/** API em produção */
const PRODUCTION_API_BASE_URL = 'https://gateway.lacosapp.com/api';

// --- Só com USE_LOCAL_BACKEND && __DEV__ ---
const NGROK_URL = null; // ex.: 'https://abc123.ngrok-free.app'
const LOCAL_BACKEND_HOST = '10.102.0.178';
const LOCAL_BACKEND_PORT = '8000';

function resolveApiBaseUrl() {
  const prod = PRODUCTION_API_BASE_URL.replace(/\/$/, '');

  if (!__DEV__) {
    return prod;
  }

  if (USE_LOCAL_BACKEND) {
    if (NGROK_URL) {
      return `${String(NGROK_URL).replace(/\/$/, '')}/api`;
    }
    return `http://${LOCAL_BACKEND_HOST}:${LOCAL_BACKEND_PORT}/api`;
  }

  return prod;
}

export const BACKEND_BASE_URL = resolveApiBaseUrl();

/** Para mensagens de UI / dicas de rede */
export const BACKEND_HOST =
  USE_LOCAL_BACKEND && __DEV__
    ? NGROK_URL
      ? 'ngrok'
      : LOCAL_BACKEND_HOST
    : 'gateway.lacosapp.com';

export const BACKEND_PORT =
  USE_LOCAL_BACKEND && __DEV__ ? LOCAL_BACKEND_PORT : '443';

console.log('🌐 Configuração do Backend:', {
  mode: __DEV__ ? 'development' : 'release',
  target: USE_LOCAL_BACKEND && __DEV__ ? 'local' : 'production',
  baseUrl: BACKEND_BASE_URL,
});

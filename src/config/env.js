// src/config/env.js
//
// Expo local (`npx expo start`): bundler/UI no teu PC; a API pode ser produção ou LAN.
//
// Cenário atual — desenvolvimento local:
//   • Expo corre localmente
//   • API no Laravel da tua máquina (LAN ou ngrok)
//
// Para usar produção (gateway) durante o dev:
//   mude EXPO_USE_LOCAL_LARAVEL para false.

/** false = API de produção (gateway). true = Laravel local (LAN ou ngrok). */
const EXPO_USE_LOCAL_LARAVEL = true;

const PRODUCTION_API_BASE_URL = 'https://gateway.lacosapp.com/api';

// --- Só usados quando EXPO_USE_LOCAL_LARAVEL && __DEV__ ---
const NGROK_URL = null; // ex.: 'https://abc123.ngrok-free.app'
const LOCAL_BACKEND_HOST = '192.168.100.10';
const LOCAL_BACKEND_PORT = '8000';

function resolveApiBaseUrl() {
  const prod = PRODUCTION_API_BASE_URL.replace(/\/$/, '');

  if (!__DEV__) {
    return prod;
  }

  if (EXPO_USE_LOCAL_LARAVEL) {
    if (NGROK_URL) {
      return `${String(NGROK_URL).replace(/\/$/, '')}/api`;
    }
    return `http://${LOCAL_BACKEND_HOST}:${LOCAL_BACKEND_PORT}/api`;
  }

  return prod;
}

export const BACKEND_BASE_URL = resolveApiBaseUrl();

export const BACKEND_HOST =
  EXPO_USE_LOCAL_LARAVEL && __DEV__
    ? NGROK_URL
      ? 'ngrok'
      : LOCAL_BACKEND_HOST
    : 'gateway.lacosapp.com';

export const BACKEND_PORT =
  EXPO_USE_LOCAL_LARAVEL && __DEV__ ? LOCAL_BACKEND_PORT : '443';

console.log('🌐 Backend API:', {
  expoDev: __DEV__,
  apiAlvo: EXPO_USE_LOCAL_LARAVEL && __DEV__ ? 'Laravel local (LAN/ngrok)' : 'Produção (gateway)',
  baseUrl: BACKEND_BASE_URL,
});

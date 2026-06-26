// src/config/env.js
//
// TestFlight + OTA (fluxo principal):
//   • Build iOS: eas build --platform ios --profile production
//   • Updates JS: eas update --channel production
//   • Release (__DEV__ = false) SEMPRE usa PRODUCTION_API_BASE_URL abaixo.
//
// Metro local (opcional):
//   • Mude EXPO_USE_LOCAL_LARAVEL para true e ajuste LOCAL_BACKEND_HOST.

/** false = gateway produção (TestFlight/OTA). true = Laravel local (só com Metro). */
const EXPO_USE_LOCAL_LARAVEL = false;

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

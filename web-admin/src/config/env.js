/**
 * Variáveis de ambiente Vite (prefixo VITE_).
 *
 * - `npm run dev`  → carrega .env.development (+ .env.local)
 * - `npm run build` → carrega .env.production (+ .env.local)
 *
 * Comportamento da API é decidido em api.js conforme o hostname no browser
 * (local vs lacosapp.com), usando estes valores como base.
 */

/** API em desenvolvimento (localhost / 127.0.0.1 no browser) */
export const DEV_API_BASE_URL =
  import.meta.env.VITE_DEV_API_BASE_URL || 'http://localhost:8000/api';

/** API em produção (admin em https://lacosapp.com …) */
export const PRODUCTION_API_BASE_URL =
  import.meta.env.VITE_PRODUCTION_API_BASE_URL || 'https://gateway.lacosapp.com/api';

/** Porta do Laravel quando o front é aberto por IP na LAN (10.x, 192.168.x, …) */
export const LOCAL_BACKEND_PORT =
  import.meta.env.VITE_LOCAL_BACKEND_PORT || '8000';

/** Legado / override manual: host usado em fallbacks */
export const BACKEND_HOST = import.meta.env.VITE_BACKEND_HOST || 'localhost';
export const BACKEND_PORT = import.meta.env.VITE_BACKEND_PORT || '8000';

/** URL http://HOST:PORT/api — só para compatibilidade e fallbacks HTTP antigos */
export const BACKEND_BASE_URL =
  import.meta.env.VITE_BACKEND_BASE_URL ||
  `http://${BACKEND_HOST}:${BACKEND_PORT}/api`;

if (import.meta.env.DEV) {
  console.log('🌐 Web-admin (dev):', {
    DEV_API_BASE_URL,
    PRODUCTION_API_BASE_URL,
    mode: import.meta.env.MODE,
  });
}

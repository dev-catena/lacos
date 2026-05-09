// URL da API: backend local quando desenvolves / acedes por LAN; gateway em produção (HTTPS).
import {
  DEV_API_BASE_URL,
  PRODUCTION_API_BASE_URL,
  LOCAL_BACKEND_PORT,
  BACKEND_BASE_URL,
  BACKEND_HOST,
} from './env';

const PRODUCTION_HOSTNAMES = new Set([
  'lacosapp.com',
  'www.lacosapp.com',
  'admin.lacosapp.com',
]);

function isPrivateLanHostname(hostname) {
  if (/^10\./.test(hostname)) {
    return true;
  }
  if (/^192\.168\./.test(hostname)) {
    return true;
  }
  // RFC1918 172.16.0.0 – 172.31.255.255
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)) {
    return true;
  }
  return false;
}

const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;

  if (import.meta.env.DEV) {
    console.log('🌐 Detectando ambiente (dev):', { hostname, protocol });
  }

  // Produção: painel servido em lacosapp.com (ou www / admin) com HTTPS → API no gateway
  if (PRODUCTION_HOSTNAMES.has(hostname)) {
    if (protocol === 'https:') {
      const url = PRODUCTION_API_BASE_URL.replace(/\/$/, '');
      if (import.meta.env.DEV) {
        console.log('📍 Produção HTTPS →', url);
      }
      return url;
    }
    // HTTP no domínio de produção (raro): evitar misturar; usar mesmo gateway configurado
    const url = PRODUCTION_API_BASE_URL.replace(/\/$/, '');
    if (import.meta.env.DEV) {
      console.log('📍 Produção (HTTP) →', url);
    }
    return url;
  }

  // Local explícito
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const url = DEV_API_BASE_URL.replace(/\/$/, '');
    if (import.meta.env.DEV) {
      console.log('📍 Localhost →', url);
    }
    return url;
  }

  // Vite na LAN: front em http://IP:8081 → Laravel costuma estar em http://IP:8000
  if (isPrivateLanHostname(hostname)) {
    const url = `http://${hostname}:${LOCAL_BACKEND_PORT}/api`;
    if (import.meta.env.DEV) {
      console.log('📍 Rede local (IP) →', url);
    }
    return url;
  }

  // Host igual ao configurado manualmente (VITE_BACKEND_HOST)
  if (hostname === BACKEND_HOST) {
    const url = `${protocol}//${hostname}:${LOCAL_BACKEND_PORT}/api`.replace(/\/$/, '');
    if (import.meta.env.DEV) {
      console.log('📍 Host = BACKEND_HOST →', url);
    }
    return url;
  }

  if (import.meta.env.DEV) {
    console.log('📍 Fallback env.js →', BACKEND_BASE_URL);
  }
  return BACKEND_BASE_URL.replace(/\/$/, '');
};

export const API_BASE_URL = getApiBaseUrl();

if (import.meta.env.DEV) {
  console.log('🌐 API Base URL:', API_BASE_URL);
  console.log('📍 Origin:', window.location.origin);
}

// Verificação opcional do gateway (não falha o app se 404)
fetch(`${API_BASE_URL}/gateway/status`, {
  method: 'GET',
  headers: { Accept: 'application/json' },
})
  .then(async (res) => {
    const text = await res.text();
    if (import.meta.env.DEV) {
      console.log('✅ Backend (health):', res.status, text.slice(0, 200));
    }
  })
  .catch((err) => {
    if (import.meta.env.DEV) {
      console.warn('⚠️ Health check opcional falhou:', err.message);
      console.warn('   URL:', API_BASE_URL);
    }
  });

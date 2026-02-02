// Configuração da API - detecta automaticamente o host
import { BACKEND_BASE_URL, BACKEND_HOST } from './env';

const getApiBaseUrl = () => {
  // Se estiver em desenvolvimento ou acessando via IP local
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = window.location.port;
  
  console.log('🌐 Detectando ambiente:', { hostname, protocol, port });
  
  // Se for localhost ou IP local, usar backend local
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const apiUrl = 'http://localhost:8000/api';
    console.log('📍 Ambiente local detectado (localhost), usando backend local:', apiUrl);
    return apiUrl;
  }
  
  // Se for IP local (10.x, 192.168.x), usar o mesmo IP para o backend
  if (hostname.startsWith('10.') || hostname.startsWith('192.168.')) {
    const apiUrl = `http://${hostname}:8000/api`;
    console.log('📍 Ambiente local detectado (IP), usando backend no mesmo IP:', apiUrl);
    return apiUrl;
  }
  
  // Se for o domínio lacosapp.com, www.lacosapp.com ou admin.lacosapp.com, usar gateway HTTPS
  if (hostname === 'lacosapp.com' || hostname === 'www.lacosapp.com' || hostname === 'admin.lacosapp.com') {
    // Se estiver em HTTPS, usar gateway HTTPS para evitar mixed content
    if (protocol === 'https:') {
      const apiUrl = 'https://gateway.lacosapp.com/api';
      console.log('📍 Domínio de produção detectado (HTTPS), usando gateway HTTPS:', apiUrl);
      return apiUrl;
    } else {
      // HTTP: usar IP configurado em env.js
      console.log('📍 Domínio de produção detectado (HTTP), usando backend configurado:', BACKEND_BASE_URL);
      return BACKEND_BASE_URL;
    }
  }
  
  // Se for o IP configurado, usar o mesmo
  if (hostname === BACKEND_HOST) {
    const apiUrl = `${protocol}//${hostname}:8000/api`;
    console.log('📍 IP configurado detectado:', apiUrl);
    return apiUrl;
  }
  
  // Default: usar IP configurado em env.js
  console.log('📍 Usando URL padrão do backend configurado:', BACKEND_BASE_URL);
  return BACKEND_BASE_URL;
};

export const API_BASE_URL = getApiBaseUrl();

// Log para debug
console.log('🌐 API Base URL configurada:', API_BASE_URL);
console.log('📍 Current hostname:', window.location.hostname);
console.log('📍 Current origin:', window.location.origin);

// Testar conectividade (sempre, para debug)
fetch(`${API_BASE_URL}/gateway/status`, { 
  method: 'GET',
  headers: {
    'Accept': 'application/json',
  },
})
  .then(async (res) => {
    const text = await res.text();
    console.log('✅ Backend acessível:', res.status, text);
  })
  .catch((err) => {
    console.error('⚠️  Não foi possível verificar conectividade com backend:', err);
    console.error('   URL tentada:', `${API_BASE_URL}/gateway/status`);
    console.error('   Origem atual:', window.location.origin);
    console.error('   Erro completo:', err.message);
  });

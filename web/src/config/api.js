// Configuração da API - detecta automaticamente o host
const getApiBaseUrl = () => {
  // Se estiver em desenvolvimento ou acessando via IP local
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = window.location.port;
  
  // Se for localhost ou IP local, usar o mesmo host para a API
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('10.') || hostname.startsWith('192.168.')) {
    // Usar o IP do servidor backend (193.203.182.22)
    return 'http://193.203.182.22/api';
  }
  
  // Se for o IP do servidor, usar o mesmo
  if (hostname === '193.203.182.22') {
    return `${protocol}//${hostname}/api`;
  }
  
  // Default: usar o IP do servidor
  return 'http://193.203.182.22/api';
};

export const API_BASE_URL = getApiBaseUrl();

// Log para debug
console.log('🌐 API Base URL:', API_BASE_URL);
console.log('📍 Current hostname:', window.location.hostname);


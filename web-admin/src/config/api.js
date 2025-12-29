// Configuração da API - detecta automaticamente o host
const getApiBaseUrl = () => {
  // Se estiver em desenvolvimento ou acessando via IP local
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = window.location.port;
  
  console.log('🌐 Detectando ambiente:', { hostname, protocol, port });
  
  // Se for localhost ou IP local, usar o mesmo host para a API
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('10.') || hostname.startsWith('192.168.')) {
    // Usar o IP do servidor backend (193.203.182.22)
    const apiUrl = 'http://193.203.182.22/api';
    console.log('📍 Ambiente local detectado, usando backend remoto:', apiUrl);
    return apiUrl;
  }
  
  // Se for o domínio lacosapp.com, www.lacosapp.com ou admin.lacosapp.com, usar IP do backend
  if (hostname === 'lacosapp.com' || hostname === 'www.lacosapp.com' || hostname === 'admin.lacosapp.com') {
    // Usar IP do backend diretamente (CORS já está configurado)
    const apiUrl = 'http://193.203.182.22/api';
    console.log('📍 Domínio de produção detectado, usando backend no IP:', apiUrl);
    return apiUrl;
  }
  
  // Se for o IP do servidor, usar o mesmo
  if (hostname === '193.203.182.22') {
    const apiUrl = `${protocol}//${hostname}/api`;
    console.log('📍 IP do servidor detectado:', apiUrl);
    return apiUrl;
  }
  
  // Default: usar o IP do servidor
  const apiUrl = 'http://193.203.182.22/api';
  console.log('📍 Usando URL padrão do backend:', apiUrl);
  return apiUrl;
};

export const API_BASE_URL = getApiBaseUrl();

// Log para debug
console.log('🌐 API Base URL configurada:', API_BASE_URL);
console.log('📍 Current hostname:', window.location.hostname);
console.log('📍 Current origin:', window.location.origin);

// Testar conectividade (opcional, apenas para debug)
if (process.env.NODE_ENV === 'development') {
  fetch(API_BASE_URL, { method: 'OPTIONS', mode: 'no-cors' })
    .then(() => console.log('✅ Backend acessível'))
    .catch(() => console.warn('⚠️  Não foi possível verificar conectividade com backend'));
}

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
  
  // Se for o domínio lacosapp.com, www.lacosapp.com ou admin.lacosapp.com, usar gateway HTTPS
  if (hostname === 'lacosapp.com' || hostname === 'www.lacosapp.com' || hostname === 'admin.lacosapp.com') {
    // Se estiver em HTTPS, usar gateway HTTPS para evitar mixed content
    if (protocol === 'https:') {
      const apiUrl = 'https://gateway.lacosapp.com/api';
      console.log('📍 Domínio de produção detectado (HTTPS), usando gateway HTTPS:', apiUrl);
      return apiUrl;
    } else {
      // HTTP: usar IP do backend diretamente
      const apiUrl = 'http://193.203.182.22/api';
      console.log('📍 Domínio de produção detectado (HTTP), usando backend no IP:', apiUrl);
      return apiUrl;
    }
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

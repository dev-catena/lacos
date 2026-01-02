// Configuração da API - detecta automaticamente o host
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  // Se for localhost ou IP local, usar o mesmo host para a API
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('10.') || hostname.startsWith('192.168.')) {
    return 'http://193.203.182.22/api';
  }
  
  // Se for o domínio lacosapp.com ou www.lacosapp.com, usar gateway HTTPS
  if (hostname === 'lacosapp.com' || hostname === 'www.lacosapp.com') {
    if (protocol === 'https:') {
      return 'https://gateway.lacosapp.com/api';
    } else {
      return 'http://193.203.182.22/api';
    }
  }
  
  // Se for o IP do servidor, usar o mesmo
  if (hostname === '193.203.182.22') {
    return `${protocol}//${hostname}/api`;
  }
  
  // Default: usar o IP do servidor
  return 'http://193.203.182.22/api';
};

export const API_BASE_URL = getApiBaseUrl();



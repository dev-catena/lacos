// Configuração da API - detecta automaticamente o host
import { BACKEND_BASE_URL, BACKEND_HOST } from './env';

const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  // Se for localhost, usar backend local
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8000/api';
  }
  
  // Se for IP local (10.x, 192.168.x), usar o mesmo IP para o backend
  if (hostname.startsWith('10.') || hostname.startsWith('192.168.')) {
    return `http://${hostname}:8000/api`;
  }
  
  // Se for o domínio lacosapp.com ou www.lacosapp.com, usar gateway HTTPS
  if (hostname === 'lacosapp.com' || hostname === 'www.lacosapp.com') {
    if (protocol === 'https:') {
      return 'https://gateway.lacosapp.com/api';
    } else {
      // HTTP: usar IP configurado em env.js
      return BACKEND_BASE_URL;
    }
  }
  
  // Se for o IP configurado, usar o mesmo
  if (hostname === BACKEND_HOST) {
    return `${protocol}//${hostname}:8000/api`;
  }
  
  // Default: usar IP configurado em env.js
  return BACKEND_BASE_URL;
};

export const API_BASE_URL = getApiBaseUrl();



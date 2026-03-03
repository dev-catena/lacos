// Configuração de ambiente - IP do servidor backend
// 
// Para alterar o IP do servidor, edite as constantes abaixo:
// - BACKEND_HOST: IP ou hostname do servidor backend
// - BACKEND_PORT: Porta do servidor backend (padrão: 8000)
//
// Em produção, essas variáveis podem ser definidas via variáveis de ambiente
// do sistema ou arquivo .env (se usando Vite com dotenv)

// IP padrão do servidor backend local
const BACKEND_HOST = import.meta.env.VITE_BACKEND_HOST || '192.168.0.20';
const BACKEND_PORT = import.meta.env.VITE_BACKEND_PORT || '8000';

// Construir URL base da API
export const BACKEND_BASE_URL = `http://${BACKEND_HOST}:${BACKEND_PORT}/api`;

// Exportar host e port separadamente para uso em outros lugares
export { BACKEND_HOST, BACKEND_PORT };

console.log('🌐 Configuração do Backend (Web Admin):', {
  host: BACKEND_HOST,
  port: BACKEND_PORT,
  baseUrl: BACKEND_BASE_URL,
  source: import.meta.env.VITE_BACKEND_HOST ? 'env' : 'default'
});











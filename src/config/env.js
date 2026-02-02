// Configuração de ambiente - IP do servidor backend
// 
// Para alterar o IP do servidor, edite as constantes abaixo:
// - BACKEND_HOST: IP ou hostname do servidor backend
// - BACKEND_PORT: Porta do servidor backend (padrão: 8000)
//
// Alternativamente, você pode criar um arquivo .env.local.js que exporte
// essas constantes para sobrescrever os valores padrão.

// IP padrão do servidor backend local
const BACKEND_HOST = '10.102.0.103';
const BACKEND_PORT = '8000';

// Construir URL base da API
export const BACKEND_BASE_URL = `http://${BACKEND_HOST}:${BACKEND_PORT}/api`;

// Exportar host e port separadamente para uso em outros lugares
export { BACKEND_HOST, BACKEND_PORT };

console.log('🌐 Configuração do Backend:', {
  host: BACKEND_HOST,
  port: BACKEND_PORT,
  baseUrl: BACKEND_BASE_URL
});


// Configuração de ambiente - IP do servidor backend
//
// Backend deste app: /home/darley/lacos/backend-laravel (Laravel).
// Para subir o servidor: cd /home/darley/lacos/backend-laravel && php artisan serve --host=0.0.0.0 --port=8000
// Use BACKEND_HOST com o IP que o celular/emulador usa para acessar a máquina (ex.: 192.168.0.20).
//
// Para alterar o IP/porta, edite:
// - BACKEND_HOST: IP ou hostname onde o backend está acessível
// - BACKEND_PORT: Porta (padrão 8000)
//
// EXPO GO: Para fotos aparecerem no Expo Go, use ngrok (HTTPS). O Expo Go bloqueia HTTP.
// 1. Instale: npm install -g ngrok
// 2. Terminal 1: cd backend-laravel && php artisan serve --host=0.0.0.0 --port=8000
// 3. Terminal 2: ngrok http 8000
// 4. Copie a URL HTTPS (ex: https://abc123.ngrok-free.app) e cole em NGROK_URL abaixo
// 5. Reinicie o Expo: npx expo start
const NGROK_URL = null; // ou 'https://abc123.ngrok-free.app'

// IP do servidor onde o backend Lacos (backend-laravel) está rodando
const BACKEND_HOST = '192.168.0.20';
const BACKEND_PORT = '8000';

// Construir URL base da API (usa ngrok se definido, senão IP local)
const BASE_URL = NGROK_URL || `http://${BACKEND_HOST}:${BACKEND_PORT}`;
export const BACKEND_BASE_URL = `${BASE_URL}/api`;

// Exportar host e port separadamente para uso em outros lugares
export { BACKEND_HOST, BACKEND_PORT };

console.log('🌐 Configuração do Backend:', {
  host: NGROK_URL ? 'ngrok' : BACKEND_HOST,
  port: BACKEND_PORT,
  baseUrl: BACKEND_BASE_URL
});


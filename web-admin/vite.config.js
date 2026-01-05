import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// IP para acesso na rede
const EXPO_IP = process.env.EXPO_IP || '10.102.0.149';
const EXPO_PORT = process.env.EXPO_PORT || '8081';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Escutar em todas as interfaces (acessível de outros dispositivos)
    port: parseInt(EXPO_PORT),
    strictPort: false,
  },
  define: {
    // Definir variáveis globais se necessário
    'process.env.EXPO_IP': JSON.stringify(EXPO_IP),
  },
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Permite acesso remoto
    port: 3000,
    strictPort: false, // Se a porta estiver ocupada, tenta outra
    open: false, // Não abrir navegador automaticamente
  },
});


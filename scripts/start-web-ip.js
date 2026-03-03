#!/usr/bin/env node

// Script para iniciar Expo Web no IP (não localhost)
// Permite acesso de outros dispositivos na rede

const { spawn } = require('child_process');

const EXPO_IP = '192.168.0.20';
const EXPO_PORT = '8081';

console.log('\n');
console.log('═'.repeat(70));
console.log('🌐 EXPO WEB NO IP (Acessível de Outros Dispositivos)');
console.log('═'.repeat(70));
console.log('');
console.log(`📱 IP: ${EXPO_IP}`);
console.log(`🔌 Porta: ${EXPO_PORT}`);
console.log('');
console.log('✅ Aplicação será acessível em:');
console.log(`   http://${EXPO_IP}:${EXPO_PORT}`);
console.log('');
console.log('📱 Para acessar de outros dispositivos:');
console.log(`   - Abra no navegador: http://${EXPO_IP}:${EXPO_PORT}`);
console.log('');
console.log('💡 Nota: Expo usa --lan e variáveis de ambiente para forçar IP');
console.log('═'.repeat(70));
console.log('');

// Configurar variáveis de ambiente para forçar IP
const env = {
  ...process.env,
  HOST: EXPO_IP,
  PORT: EXPO_PORT,
  EXPO_IP: EXPO_IP,
  EXPO_PORT: EXPO_PORT,
  EXPO_DEVTOOLS_LISTEN_ADDRESS: '0.0.0.0',
  REACT_NATIVE_PACKAGER_HOSTNAME: EXPO_IP,
  EXPO_PACKAGER_HOSTNAME: EXPO_IP,
  WEB_HOST: '0.0.0.0', // Para webpack/vite escutar em todas as interfaces
};

// Iniciar Expo Web no IP
// --host só aceita 'lan', 'tunnel' ou 'localhost'
// Usamos 'lan' e variáveis de ambiente para forçar o IP
const expo = spawn('npx', ['expo', 'start', '--web', '--lan', '--port', EXPO_PORT], {
  env: env,
  shell: true,
  stdio: 'inherit'
});

expo.on('error', (err) => {
  console.error('❌ Erro ao iniciar:', err);
  process.exit(1);
});

expo.on('exit', (code) => {
  process.exit(code || 0);
});

process.on('SIGINT', () => {
  expo.kill('SIGINT');
  process.exit(0);
});

#!/usr/bin/env node

// Script CORRIGIDO para iniciar Expo Web no IP
// Usa --lan (não aceita IP em --host) e configura servidor para escutar em 0.0.0.0

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
console.log('💡 Nota: Usando --lan (Expo não aceita IP em --host)');
console.log('   Servidor será configurado para escutar em 0.0.0.0');
console.log('═'.repeat(70));
console.log('');

// Configurar variáveis de ambiente para forçar IP e escutar em todas as interfaces
const env = {
  ...process.env,
  // IP para uso interno
  HOST: EXPO_IP,
  PORT: EXPO_PORT,
  EXPO_IP: EXPO_IP,
  EXPO_PORT: EXPO_PORT,
  
  // Forçar servidor a escutar em todas as interfaces (0.0.0.0)
  EXPO_DEVTOOLS_LISTEN_ADDRESS: '0.0.0.0',
  WEB_HOST: '0.0.0.0',
  HOSTNAME: '0.0.0.0',
  
  // Configurações do Metro/Packager
  REACT_NATIVE_PACKAGER_HOSTNAME: EXPO_IP,
  EXPO_PACKAGER_HOSTNAME: EXPO_IP,
  
  // Node.js
  NODE_ENV: process.env.NODE_ENV || 'development',
};

// Iniciar Expo Web
// --host só aceita 'lan', 'tunnel' ou 'localhost'
// Usamos 'lan' que deve detectar o IP automaticamente
// E variáveis de ambiente para forçar escutar em 0.0.0.0
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


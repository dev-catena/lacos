#!/usr/bin/env node

// Script para FORÇAR Expo Web a escutar em 0.0.0.0 (acessível de outros dispositivos)
// Usa variáveis de ambiente e configurações específicas

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const EXPO_IP = '10.102.0.103';
const EXPO_PORT = '8081';

console.log('\n');
console.log('═'.repeat(70));
console.log('🌐 EXPO WEB FORÇADO NO IP (0.0.0.0)');
console.log('═'.repeat(70));
console.log('');
console.log(`📱 IP: ${EXPO_IP}`);
console.log(`🔌 Porta: ${EXPO_PORT}`);
console.log('');
console.log('✅ Servidor será acessível em:');
console.log(`   http://${EXPO_IP}:${EXPO_PORT}`);
console.log(`   http://0.0.0.0:${EXPO_PORT}`);
console.log('');
console.log('📱 Para acessar de outros dispositivos:');
console.log(`   - Abra no navegador: http://${EXPO_IP}:${EXPO_PORT}`);
console.log('');
console.log('═'.repeat(70));
console.log('');

// Configurar TODAS as variáveis de ambiente possíveis
const env = {
  ...process.env,
  // IP para uso interno
  HOST: '0.0.0.0', // CRÍTICO: Forçar escutar em todas as interfaces
  PORT: EXPO_PORT,
  EXPO_IP: EXPO_IP,
  EXPO_PORT: EXPO_PORT,
  
  // Forçar servidor a escutar em todas as interfaces
  EXPO_DEVTOOLS_LISTEN_ADDRESS: '0.0.0.0',
  WEB_HOST: '0.0.0.0',
  HOSTNAME: '0.0.0.0',
  WDS_SOCKET_HOST: EXPO_IP, // Webpack Dev Server
  WDS_SOCKET_PORT: EXPO_PORT,
  
  // Configurações do Metro/Packager
  REACT_NATIVE_PACKAGER_HOSTNAME: EXPO_IP,
  EXPO_PACKAGER_HOSTNAME: EXPO_IP,
  
  // Node.js
  NODE_ENV: process.env.NODE_ENV || 'development',
};

// Iniciar Expo Web
// --lan deve fazer o servidor escutar em 0.0.0.0
// Variáveis de ambiente forçam isso
console.log('🚀 Iniciando Expo Web...');
console.log('   Configurado para escutar em 0.0.0.0 (todas as interfaces)');
console.log('');

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


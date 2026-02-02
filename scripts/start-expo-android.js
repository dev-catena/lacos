#!/usr/bin/env node

// Script para iniciar Expo com IP correto para Android
// Versão simplificada que permite o QR code aparecer

const EXPO_IP = '10.102.0.103';
const EXPO_PORT = '8081';
const EXPO_URL = `exp://${EXPO_IP}:${EXPO_PORT}`;

// Configurar TODAS as variáveis de ambiente necessárias ANTES de iniciar
process.env.REACT_NATIVE_PACKAGER_HOSTNAME = EXPO_IP;
process.env.EXPO_PACKAGER_HOSTNAME = EXPO_IP;
process.env.REACT_NATIVE_PACKAGER_PORT = EXPO_PORT;
process.env.EXPO_PACKAGER_PORT = EXPO_PORT;
process.env.EXPO_NO_DOTENV = '1';
process.env.EXPO_NO_LOCALHOST = '1';
process.env.EXPO_USE_LOCALHOST = '0';
process.env.EXPO_USE_DEV_CLIENT = '0';
process.env.HOST = EXPO_IP;
process.env.PORT = EXPO_PORT;

console.log('\n');
console.log('═'.repeat(60));
console.log('📱 Iniciando Expo para Android');
console.log('═'.repeat(60));
console.log(`🌐 IP configurado: ${EXPO_IP}:${EXPO_PORT}`);
console.log(`📱 URL esperada: ${EXPO_URL}`);
console.log('═'.repeat(60));
console.log('');
console.log('⚠️  Se o QR code mostrar localhost, use manualmente:');
console.log(`   ${EXPO_URL}`);
console.log('');

// Executar expo start diretamente usando require('child_process').exec para manter o TTY
const { exec } = require('child_process');

const command = `npx expo start --lan --port ${EXPO_PORT} --clear`;

exec(command, {
  env: process.env,
  stdio: 'inherit'
}, (error, stdout, stderr) => {
  if (error) {
    console.error(`❌ Erro: ${error}`);
    return;
  }
});


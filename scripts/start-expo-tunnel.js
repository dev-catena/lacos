#!/usr/bin/env node

// Script para iniciar Expo em modo tunnel com IP correto para Android
const { spawn } = require('child_process');

const EXPO_IP = '10.102.0.103';
const EXPO_PORT = '8081';

console.log('\n');
console.log('═'.repeat(60));
console.log('🚇 Iniciando Expo em modo TUNNEL para Android');
console.log('═'.repeat(60));
console.log('');
console.log(`📱 IP local: ${EXPO_IP}`);
console.log(`🔌 Porta: ${EXPO_PORT}`);
console.log('');
console.log('⚠️  IMPORTANTE:');
console.log('   - O QR code pode mostrar uma URL do tunnel');
console.log('   - Mas o Metro bundler estará acessível em:', `exp://${EXPO_IP}:${EXPO_PORT}`);
console.log('   - Se o Android não conectar, tente usar a URL do tunnel');
console.log('');
console.log('═'.repeat(60));
console.log('');

// Configurar variáveis de ambiente
process.env.REACT_NATIVE_PACKAGER_HOSTNAME = EXPO_IP;
process.env.EXPO_PACKAGER_HOSTNAME = EXPO_IP;
process.env.REACT_NATIVE_PACKAGER_PORT = EXPO_PORT;
process.env.EXPO_PACKAGER_PORT = EXPO_PORT;
process.env.EXPO_NO_DOTENV = '1';
process.env.EXPO_USE_METRO_WORKSPACE_ROOT = '1';
process.env.EXPO_NO_LOCALHOST = '1';
process.env.EXPO_USE_LOCALHOST = '0';
process.env.HOST = EXPO_IP;
process.env.PORT = EXPO_PORT;

// Obter argumentos da linha de comando
const args = process.argv.slice(2);
const useTunnel = args.includes('--tunnel') || !args.includes('--lan');

// Executar expo start
let expoArgs = ['expo', 'start', '--clear', '--go'];
if (useTunnel) {
  expoArgs.push('--tunnel');
  console.log('🌐 Usando modo TUNNEL (pode mostrar URL do tunnel)');
} else {
  expoArgs.push('--lan', '--host', EXPO_IP, '--port', EXPO_PORT);
  console.log(`🌐 Usando modo LAN (IP: ${EXPO_IP})`);
}

if (args.includes('--dev-client')) {
  expoArgs.push('--dev-client');
}

const expo = spawn('npx', expoArgs, {
  env: process.env,
  shell: true,
  stdio: 'inherit'
});

expo.on('error', (err) => {
  console.error('❌ Erro ao iniciar Expo:', err);
  process.exit(1);
});

expo.on('exit', (code) => {
  process.exit(code || 0);
});


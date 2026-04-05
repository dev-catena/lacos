#!/usr/bin/env node

/**
 * Script para iniciar Expo com IP DETECTADO AUTOMATICAMENTE
 * Use este script quando o IP fixo (192.168.0.20) não funcionar
 * 
 * Uso: node start-expo-ip-auto.js
 *      node start-expo-ip-auto.js --tunnel  (para usar tunnel)
 */

const { spawn } = require('child_process');
const os = require('os');

// Detectar IP da máquina na rede local
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    if (name.startsWith('docker') || name.startsWith('veth') || name === 'lo') continue;
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

const DETECTED_IP = getLocalIP();
const FORCED_PORT = '8081';
const useTunnel = process.argv.includes('--tunnel');

console.log('');
console.log('🚀 ============================================');
console.log('🚀 EXPO - IP AUTOMÁTICO');
console.log('🚀 ============================================');
console.log('');
console.log(`📱 IP DETECTADO: ${DETECTED_IP}`);
console.log(`📱 PORTA: ${FORCED_PORT}`);
console.log(`📱 URL: exp://${DETECTED_IP}:${FORCED_PORT}`);
if (useTunnel) {
  console.log('📱 MODO: Tunnel (via servidores Expo)');
} else {
  console.log('📱 MODO: LAN (rede local)');
}
console.log('');

// Parar processos antigos
console.log('🛑 Parando processos antigos...');
const { execSync } = require('child_process');
try {
  execSync('pkill -f "expo start" 2>/dev/null || true', { stdio: 'ignore' });
  execSync('pkill -f "metro" 2>/dev/null || true', { stdio: 'ignore' });
  execSync(`lsof -ti :${FORCED_PORT} 2>/dev/null | xargs kill -9 2>/dev/null || true`, { stdio: 'ignore' });
  console.log('✅ Pronto');
} catch (e) {}
console.log('');

const env = {
  ...process.env,
  REACT_NATIVE_PACKAGER_HOSTNAME: DETECTED_IP,
  EXPO_PACKAGER_HOSTNAME: DETECTED_IP,
  PACKAGER_HOSTNAME: DETECTED_IP,
  HOST: DETECTED_IP,
  METRO_HOST: DETECTED_IP,
  EXPO_IP: DETECTED_IP,
  EXPO_NO_LOCALHOST: '1',
  EXPO_USE_LOCALHOST: '0',
  RCT_METRO_PORT: FORCED_PORT,
  PORT: FORCED_PORT,
  EXPO_PACKAGER_PORT: FORCED_PORT,
};

const args = ['start', '--lan', '--port', FORCED_PORT, '--go', '--clear'];
if (useTunnel) {
  args.push('--tunnel');
}

console.log('🚀 Iniciando Expo...');
console.log('');

const expoProcess = spawn('npx', ['expo', ...args], {
  env,
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd()
});

expoProcess.on('exit', (code) => {
  process.exit(code || 0);
});

process.on('SIGINT', () => {
  expoProcess.kill('SIGINT');
  process.exit(0);
});

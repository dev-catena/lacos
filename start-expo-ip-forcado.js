#!/usr/bin/env node

/**
 * Script para iniciar Expo Go com IP FORÇADO
 * GARANTE que o QR code sempre mostra: exp://192.168.0.20:8081
 * NUNCA, NUNCA, NUNCA usa localhost
 */

const { spawn } = require('child_process');
const path = require('path');

// IP: use variável EXPO_IP para override, ou 192.168.0.20 como padrão
const FORCED_IP = process.env.EXPO_IP || '192.168.0.20';
const FORCED_PORT = '8081';

console.log('');
console.log('🚀 ============================================');
console.log('🚀 EXPO GO - IP FORÇADO');
console.log('🚀 ============================================');
console.log('');
console.log(`📱 IP FORÇADO: ${FORCED_IP}`);
console.log(`📱 PORTA: ${FORCED_PORT}`);
console.log(`📱 URL DO QR CODE: exp://${FORCED_IP}:${FORCED_PORT}`);
console.log('');
console.log('⚠️  GARANTINDO QUE NUNCA USE LOCALHOST!');
console.log('');

// Parar processos antigos
console.log('🛑 Parando processos antigos...');
const { execSync } = require('child_process');
try {
  execSync('pkill -f "expo start" || true', { stdio: 'ignore' });
  execSync('pkill -f "metro" || true', { stdio: 'ignore' });
  execSync('pkill -f "node.*expo" || true', { stdio: 'ignore' });
  // Liberar porta
  try {
    execSync(`lsof -ti :${FORCED_PORT} | xargs kill -9 2>/dev/null || true`, { stdio: 'ignore' });
  } catch (e) {}
  console.log('✅ Processos antigos parados');
} catch (e) {
  console.log('⚠️  Nenhum processo antigo encontrado');
}
console.log('');

// Limpar cache
console.log('🧹 Limpando cache...');
try {
  execSync('rm -rf .expo 2>/dev/null || true', { stdio: 'ignore' });
  execSync('rm -rf node_modules/.cache 2>/dev/null || true', { stdio: 'ignore' });
  execSync('rm -rf .metro 2>/dev/null || true', { stdio: 'ignore' });
  console.log('✅ Cache limpo');
} catch (e) {
  console.log('⚠️  Erro ao limpar cache (continuando...)');
}
console.log('');

// Configurar .expo/settings.json para forçar LAN
console.log('⚙️  Configurando Expo para usar IP fixo...');
const fs = require('fs');
const settingsPath = path.join(process.cwd(), '.expo', 'settings.json');
try {
  fs.mkdirSync(path.join(process.cwd(), '.expo'), { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify({
    hostType: 'lan',
    lanType: 'ip',
    dev: true,
    urlRandomness: null
  }, null, 2));
  console.log('✅ Configuração salva em .expo/settings.json');
} catch (e) {
  console.log('⚠️  Erro ao salvar configuração (continuando...)');
}
console.log('');

// Variáveis de ambiente para FORÇAR o IP
// Essas são as variáveis que o Expo/Metro realmente usam
const env = {
  ...process.env,
  // FORÇAR IP - NUNCA LOCALHOST (ESSENCIAIS!)
  REACT_NATIVE_PACKAGER_HOSTNAME: FORCED_IP,
  EXPO_PACKAGER_HOSTNAME: FORCED_IP,
  PACKAGER_HOSTNAME: FORCED_IP,
  HOST: FORCED_IP,
  METRO_HOST: FORCED_IP,
  
  // BLOQUEAR LOCALHOST COMPLETAMENTE
  EXPO_NO_LOCALHOST: '1',
  EXPO_USE_LOCALHOST: '0',
  
  // Metro bundler - ESCUTAR EM TODAS AS INTERFACES
  EXPO_USE_METRO_WORKSPACE_ROOT: '1',
  EXPO_DEVTOOLS_LISTEN_ADDRESS: '0.0.0.0', // Escutar em todas as interfaces
  
  // Porta fixa
  RCT_METRO_PORT: FORCED_PORT,
  PORT: FORCED_PORT,
  EXPO_PACKAGER_PORT: FORCED_PORT,
  
  // Evitar autenticação do Expo em modo não-interativo
  CI: 'false', // Não é CI, mas permite modo interativo
  EXPO_NO_DOTENV: '1',
  EXPO_OFFLINE: '1', // Usar modo offline para evitar autenticação
};

console.log('🔧 Variáveis de ambiente configuradas:');
console.log(`   REACT_NATIVE_PACKAGER_HOSTNAME=${env.REACT_NATIVE_PACKAGER_HOSTNAME}`);
console.log(`   EXPO_PACKAGER_HOSTNAME=${env.EXPO_PACKAGER_HOSTNAME}`);
console.log(`   EXPO_NO_LOCALHOST=${env.EXPO_NO_LOCALHOST}`);
console.log(`   EXPO_USE_LOCALHOST=${env.EXPO_USE_LOCALHOST}`);
console.log('');

// Argumentos para expo start - NÃO usar --lan e --tunnel juntos (Expo não permite)
const userArgs = process.argv.slice(2);
const useTunnel = userArgs.includes('--tunnel');

const args = [
  'start',
  useTunnel ? '--tunnel' : '--lan',  // Um ou outro, nunca ambos
  '--port', FORCED_PORT,
  '--go',
  '--clear',
];

if (useTunnel) {
  console.log('📱 MODO TUNNEL ativado - use quando LAN não funcionar (Android travado em "downloading")');
}
const forbiddenArgs = ['--localhost', '--offline', '--host', '--tunnel', '--lan'];
const filteredArgs = userArgs.filter(arg => !forbiddenArgs.some(f => arg === f || arg.startsWith(f + '=')));
if (filteredArgs.length > 0) {
  console.log('📝 Argumentos adicionais:', filteredArgs.join(' '));
  args.push(...filteredArgs);
}

console.log('');
console.log('🚀 Iniciando Expo Go...');
console.log('');
if (useTunnel) {
  console.log('📱 MODO TUNNEL: Aguarde o QR code (pode levar 1-2 min). Escaneie com Expo Go.');
  console.log('   O URL será diferente (expo.dev) - funciona mesmo com rede/firewall!');
} else {
  console.log('📱 O QR CODE DEVE MOSTRAR:');
  console.log(`   exp://${FORCED_IP}:${FORCED_PORT}`);
}
console.log('');

// Iniciar Expo
const expoProcess = spawn('npx', ['expo', ...args], {
  env,
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd()
});

// Tratamento de erros
expoProcess.on('error', (error) => {
  console.error('❌ Erro ao iniciar Expo:', error);
  process.exit(1);
});

expoProcess.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`❌ Expo terminou com código: ${code}`);
    process.exit(code);
  }
});

// Capturar Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n🛑 Parando Expo...');
  expoProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  expoProcess.kill('SIGTERM');
  process.exit(0);
});


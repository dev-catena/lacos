#!/usr/bin/env node

/**
 * Wrapper para npx expo start que força o IP correto para iOS e Android
 * Intercepta TODA a saída e substitui localhost pelo IP da rede
 */

const { spawn } = require('child_process');
const readline = require('readline');

// Tentar importar qrcode-terminal para gerar QR code
let qrcodeTerminal = null;
try {
  qrcodeTerminal = require('qrcode-terminal');
} catch (e) {
  // qrcode-terminal não instalado, continuar sem QR code
}

// IP correto
const EXPO_IP = '10.102.0.149';
const EXPO_PORT = '8081';

// Configurar TODAS as variáveis de ambiente ANTES de iniciar
process.env.EXPO_NO_DOTENV = '1';
process.env.EXPO_USE_METRO_WORKSPACE_ROOT = '1';
process.env.REACT_NATIVE_PACKAGER_HOSTNAME = EXPO_IP;
process.env.EXPO_PACKAGER_HOSTNAME = EXPO_IP;
process.env.PACKAGER_HOSTNAME = EXPO_IP;
process.env.REACT_NATIVE_PACKAGER_PORT = EXPO_PORT;
process.env.EXPO_PACKAGER_PORT = EXPO_PORT;
process.env.HOST = EXPO_IP;
process.env.PORT = EXPO_PORT;
process.env.METRO_HOST = EXPO_IP;
process.env.EXPO_DEVTOOLS_LISTEN_ADDRESS = '0.0.0.0';
process.env.EXPO_DEVTOOLS_LISTEN_PORT = EXPO_PORT;
// CRÍTICO: Forçar que NÃO use localhost
process.env.EXPO_NO_LOCALHOST = '1';
process.env.EXPO_USE_LOCALHOST = '0';
process.env.EXPO_USE_FAST_RESOLVER = '1';
// Evitar autenticação do Expo em modo não-interativo
process.env.CI = 'false'; // Não é CI, permite modo interativo
process.env.EXPO_OFFLINE = '1'; // Usar modo offline para evitar autenticação

console.log(`🔧 Forçando IP: ${EXPO_IP}:${EXPO_PORT}`);
console.log(`🚫 localhost está BLOQUEADO`);
console.log(`📱 Funciona para iOS e Android`);
console.log('');

// URL correta
const EXPO_URL = `exp://${EXPO_IP}:${EXPO_PORT}`;

// Função para gerar QR code
function mostrarQRCode() {
  console.log('');
  console.log('═'.repeat(70));
  console.log('📱 QR CODE PARA EXPO GO (iOS e Android)');
  console.log('═'.repeat(70));
  console.log('');
  
  if (qrcodeTerminal) {
    qrcodeTerminal.generate(EXPO_URL, { small: true }, (qr) => {
      console.log(qr);
      console.log('');
      console.log(`🎯 URL: ${EXPO_URL}`);
      console.log('');
      console.log('📱 INSTRUÇÕES:');
      console.log('   1. Abra o Expo Go no seu celular');
      console.log('   2. Escaneie o QR code acima');
      console.log('   3. OU toque em "Enter URL manually" e cole:');
      console.log(`      ${EXPO_URL}`);
      console.log('');
      console.log('═'.repeat(70));
      console.log('');
    });
  } else {
    console.log(`🎯 URL: ${EXPO_URL}`);
    console.log('');
    console.log('📱 INSTRUÇÕES:');
    console.log('   1. Abra o Expo Go no seu celular');
    console.log('   2. Toque em "Enter URL manually"');
    console.log('   3. Cole a URL:');
    console.log(`      ${EXPO_URL}`);
    console.log('');
    console.log('💡 Para ver QR code visual, instale: npm install -g qrcode-terminal');
    console.log('═'.repeat(70));
    console.log('');
  }
}

// Função para substituir localhost pelo IP em qualquer formato
function replaceLocalhost(text) {
  return text
    // Substituir exp://localhost:8081
    .replace(/exp:\/\/localhost:(\d+)/g, `exp://${EXPO_IP}:$1`)
    .replace(/exp:\/\/localhost/g, `exp://${EXPO_IP}:${EXPO_PORT}`)
    // Substituir http://localhost:8081
    .replace(/http:\/\/localhost:(\d+)/g, `http://${EXPO_IP}:$1`)
    .replace(/http:\/\/localhost/g, `http://${EXPO_IP}:${EXPO_PORT}`)
    // Substituir https://localhost:8081
    .replace(/https:\/\/localhost:(\d+)/g, `https://${EXPO_IP}:$1`)
    .replace(/https:\/\/localhost/g, `https://${EXPO_IP}:${EXPO_PORT}`)
    // Substituir localhost:8081 (sem protocolo)
    .replace(/localhost:(\d+)/g, `${EXPO_IP}:$1`)
    .replace(/localhost/g, EXPO_IP)
    // Substituir 127.0.0.1:8081
    .replace(/127\.0\.0\.1:(\d+)/g, `${EXPO_IP}:$1`)
    .replace(/127\.0\.0\.1/g, EXPO_IP);
}

// Obter argumentos (--clear, --lan, etc.)
const args = process.argv.slice(2);
const hasClear = args.includes('--clear');
const hasLan = args.includes('--lan');
const hasTunnel = args.includes('--tunnel');

// Construir comando
const expoArgs = ['expo', 'start'];
if (hasClear) {
  expoArgs.push('--clear');
}
if (!hasTunnel) {
  // Se não for tunnel, forçar --lan para garantir IP da rede
  if (!hasLan) {
    expoArgs.push('--lan');
  }
  // NÃO usar --offline aqui, pois pode bloquear conexões
  // O EXPO_OFFLINE=1 nas variáveis de ambiente já evita autenticação
} else {
  expoArgs.push('--tunnel');
}
// Adicionar outros argumentos (exceto os que já processamos)
args.forEach(arg => {
  if (!['--clear', '--lan', '--tunnel'].includes(arg)) {
    expoArgs.push(arg);
  }
});

console.log(`🚀 Executando: npx ${expoArgs.join(' ')}`);
console.log('');

// Iniciar processo
// IMPORTANTE: stdio: 'inherit' permite interação com o terminal
// Isso evita o erro de "non-interactive mode" do Expo
const expo = spawn('npx', expoArgs, {
  stdio: 'inherit', // Usar 'inherit' para permitir interação
  env: process.env,
  shell: true,
});

// Interceptar stdout linha por linha
const stdoutRl = readline.createInterface({
  input: expo.stdout,
  crlfDelay: Infinity,
});

let metroStarted = false;
let qrCodeShown = false;

stdoutRl.on('line', (line) => {
  const corrected = replaceLocalhost(line);
  console.log(corrected);
  
  // Detectar quando Metro está pronto
  if (!metroStarted && (line.includes('Metro waiting') || line.includes('Waiting on') || line.includes('Logs for your project') || line.includes('Metro Bundler') || line.includes('Starting Metro'))) {
    metroStarted = true;
    // Mostrar QR code após Metro estar pronto
    if (!qrCodeShown) {
      setTimeout(() => {
        mostrarQRCode();
        qrCodeShown = true;
      }, 1500);
    }
  }
});

// Interceptar stderr linha por linha
const stderrRl = readline.createInterface({
  input: expo.stderr,
  crlfDelay: Infinity,
});

stderrRl.on('line', (line) => {
  const corrected = replaceLocalhost(line);
  console.error(corrected);
});

// Gerenciar saída
expo.on('close', (code) => {
  process.exit(code || 0);
});

expo.on('error', (error) => {
  console.error('❌ Erro ao iniciar Expo:', error);
  process.exit(1);
});

// Interceptar Ctrl+C
process.on('SIGINT', () => {
  expo.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  expo.kill('SIGTERM');
  process.exit(0);
});

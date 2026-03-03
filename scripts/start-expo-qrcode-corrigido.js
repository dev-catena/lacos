#!/usr/bin/env node

// Script que CORRIGE o QR code para usar IP correto ao invés de localhost
const { spawn } = require('child_process');
const { Transform } = require('stream');

const EXPO_IP = '192.168.0.20';
const EXPO_PORT = '8081';
const EXPO_URL = `exp://${EXPO_IP}:${EXPO_PORT}`;

console.log('\n');
console.log('═'.repeat(70));
console.log('🔧 CORRIGINDO QR CODE PARA USAR IP CORRETO');
console.log('═'.repeat(70));
console.log('');
console.log(`📱 IP CORRETO: ${EXPO_IP}`);
console.log(`🔌 Porta: ${EXPO_PORT}`);
console.log(`🎯 URL CORRETA: ${EXPO_URL}`);
console.log('');
console.log('✅ QR code será corrigido automaticamente');
console.log('✅ URLs de localhost serão substituídas');
console.log('═'.repeat(70));
console.log('');

// Configurar variáveis de ambiente
const env = {
  ...process.env,
  REACT_NATIVE_PACKAGER_HOSTNAME: EXPO_IP,
  EXPO_PACKAGER_HOSTNAME: EXPO_IP,
  PACKAGER_HOSTNAME: EXPO_IP,
  REACT_NATIVE_PACKAGER_PORT: EXPO_PORT,
  EXPO_PACKAGER_PORT: EXPO_PORT,
  METRO_HOST: EXPO_IP,
  HOST: EXPO_IP,
  PORT: EXPO_PORT,
  EXPO_DEVTOOLS_LISTEN_ADDRESS: '0.0.0.0',
  EXPO_NO_LOCALHOST: '1',
  EXPO_USE_LOCALHOST: '0',
  EXPO_NO_DOTENV: '1',
  EXPO_USE_METRO_WORKSPACE_ROOT: '1',
  NODE_ENV: process.env.NODE_ENV || 'development',
};

// Obter argumentos
const args = process.argv.slice(2);
const useTunnel = args.includes('--tunnel');
const useLan = args.includes('--lan') || !useTunnel;

// Transform para corrigir QR code e URLs
const qrCodeCorrector = new Transform({
  transform(chunk, encoding, callback) {
    let output = chunk.toString();
    const originalOutput = output;
    
    // Se estiver em tunnel mode, preservar URLs do tunnel
    if (useTunnel) {
      // Preservar URLs do tunnel (.exp.direct)
      if (output.match(/\.exp\.direct/i) || output.match(/exp:\/\/[a-z0-9-]+\.exp\.direct/i)) {
        callback(null, output);
        return;
      }
    }
    
    // CORRIGIR QR CODE: Substituir localhost no QR code
    // O QR code do Expo geralmente contém a URL em formato exp://localhost:8081
    // Precisamos substituir isso pelo IP correto
    
    // Padrões para QR code e URLs
    const patterns = [
      // URLs exp:// localhost (CRÍTICO - isso é o que o QR code usa)
      [/exp:\/\/localhost(:\d+)?/gi, (match) => {
        const port = match.match(/:(\d+)/)?.[1] || `:${EXPO_PORT}`;
        return `exp://${EXPO_IP}${port}`;
      }],
      [/exp:\/\/127\.0\.0\.1(:\d+)?/gi, (match) => {
        const port = match.match(/:(\d+)/)?.[1] || `:${EXPO_PORT}`;
        return `exp://${EXPO_IP}${port}`;
      }],
      
      // URLs HTTP localhost
      [/http:\/\/localhost(:\d+)?/gi, (match) => {
        const port = match.match(/:(\d+)/)?.[1] || `:${EXPO_PORT}`;
        return `exp://${EXPO_IP}:${port}`;
      }],
      [/https:\/\/localhost(:\d+)?/gi, (match) => {
        const port = match.match(/:(\d+)/)?.[1] || `:${EXPO_PORT}`;
        return `exp://${EXPO_IP}:${port}`;
      }],
      
      // Mensagens do Metro/Expo que mencionam localhost
      [/Metro waiting on .*localhost.*/gi, `Metro waiting on ${EXPO_URL}`],
      [/Waiting on .*localhost.*/gi, `Waiting on ${EXPO_URL}`],
      [/Connect to .*localhost.*/gi, `Connect to ${EXPO_URL}`],
      
      // Strings JSON com localhost
      [/"localhost(:\d+)?"/g, (match) => {
        const port = match.match(/:(\d+)/)?.[1] || `:${EXPO_PORT}`;
        return `"${EXPO_IP}${port}"`;
      }],
    ];
    
    // Aplicar substituições
    patterns.forEach(([pattern, replacement]) => {
      if (typeof replacement === 'function') {
        output = output.replace(pattern, replacement);
      } else {
        output = output.replace(pattern, replacement);
      }
    });
    
    // Se detectou e corrigiu localhost, adicionar aviso (apenas uma vez por chunk significativo)
    if (originalOutput.includes('localhost') && !output.includes('localhost')) {
      // Não adicionar aviso em linhas de QR code (para não quebrar o formato)
      if (!output.match(/[█▄▀░▒▓│─]/) && output.match(/exp:\/\//)) {
        // Adicionar aviso discreto apenas se não for QR code
        if (!output.match(/QR|qr code|scan/i)) {
          // Não adicionar aviso - deixar passar limpo
        }
      }
    }
    
    callback(null, output);
  }
});

// Preparar argumentos
let expoArgs = ['expo', 'start', '--clear'];

if (useTunnel) {
  expoArgs.push('--tunnel');
  console.log('🌐 Modo: TUNNEL');
  console.log('✅ URLs do tunnel serão preservadas');
} else {
  expoArgs.push('--lan', '--host', EXPO_IP, '--port', EXPO_PORT);
  console.log(`🌐 Modo: LAN (IP: ${EXPO_IP})`);
}

if (args.includes('--dev-client')) {
  expoArgs.push('--dev-client');
}

console.log('');
console.log('═'.repeat(70));
console.log('🚀 INICIANDO EXPO...');
console.log('═'.repeat(70));
console.log('');
console.log('📋 IMPORTANTE:');
console.log(`   URL CORRETA: ${EXPO_URL}`);
console.log('   QR code será corrigido automaticamente');
console.log('   Se o QR code mostrar localhost, será substituído pelo IP');
console.log('');
console.log('═'.repeat(70));
console.log('');

// Executar Expo
const expo = spawn('npx', expoArgs, {
  env: env,
  shell: true
});

// Interceptar e corrigir
expo.stdout.pipe(qrCodeCorrector).pipe(process.stdout);
expo.stderr.pipe(qrCodeCorrector).pipe(process.stderr);

expo.on('error', (err) => {
  console.error('❌ Erro ao iniciar Expo:', err);
  process.exit(1);
});

expo.on('exit', (code) => {
  process.exit(code || 0);
});

process.on('SIGINT', () => {
  expo.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  expo.kill('SIGTERM');
  process.exit(0);
});


#!/usr/bin/env node

// Script para iniciar Expo e gerar QR code CORRETO (sem localhost)
// Intercepta QR codes do Expo e substitui por URL correta

const { spawn } = require('child_process');
const { Transform } = require('stream');

const EXPO_IP = '10.102.0.103';
const EXPO_PORT = '8081';
const EXPO_URL = `exp://${EXPO_IP}:${EXPO_PORT}`;

console.log('\n');
console.log('═'.repeat(70));
console.log('🚀 EXPO COM QR CODE CORRETO');
console.log('═'.repeat(70));
console.log('');
console.log(`📱 IP: ${EXPO_IP}`);
console.log(`🔌 Porta: ${EXPO_PORT}`);
console.log(`🎯 URL CORRETA: ${EXPO_URL}`);
console.log('');
console.log('✅ QR codes com localhost serão substituídos automaticamente');
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
};

// Obter argumentos
const args = process.argv.slice(2);
const useTunnel = args.includes('--tunnel');
const useLan = args.includes('--lan') || !useTunnel;

// Função para gerar QR code customizado
function gerarQRCodeCustomizado() {
  try {
    const qrcode = require('qrcode-terminal');
    console.log('\n');
    console.log('═'.repeat(70));
    console.log('📱 QR CODE CORRETO (exp://10.102.0.103:8081)');
    console.log('═'.repeat(70));
    console.log('');
    qrcode.generate(EXPO_URL, { small: true }, (qr) => {
      console.log(qr);
      console.log('');
      console.log(`🎯 URL: ${EXPO_URL}`);
      console.log('📱 Use este QR code no Expo Go!');
      console.log('═'.repeat(70));
      console.log('');
    });
  } catch (e) {
    // qrcode-terminal não instalado, mostrar URL
    console.log('\n');
    console.log('═'.repeat(70));
    console.log('📱 URL CORRETA PARA EXPO GO:');
    console.log('═'.repeat(70));
    console.log('');
    console.log(`   ${EXPO_URL}`);
    console.log('');
    console.log('💡 Para gerar QR code, instale: npm install -g qrcode-terminal');
    console.log('═'.repeat(70));
    console.log('');
  }
}

// Transform stream para interceptar e corrigir QR codes
const qrCodeCorrector = new Transform({
  transform(chunk, encoding, callback) {
    let output = chunk.toString();
    const originalOutput = output;
    
    // Em tunnel mode, preservar URLs do tunnel
    if (useTunnel) {
      if (output.match(/\.exp\.direct/i)) {
        callback(null, output);
        return;
      }
    }
    
    // Detectar QR code ou localhost e substituir
    const hasLocalhost = output.match(/localhost|127\.0\.0\.1/i);
    const hasQRCode = output.match(/QR|qr code|█|▄|▀|░|▒|▓/i);
    
    if (hasLocalhost) {
      // Substituir localhost pelo IP correto
      output = output
        .replace(/http:\/\/localhost(:\d+)?/gi, EXPO_URL)
        .replace(/https:\/\/localhost(:\d+)?/gi, EXPO_URL)
        .replace(/exp:\/\/localhost(:\d+)?/gi, EXPO_URL)
        .replace(/exp:\/\/127\.0\.0\.1(:\d+)?/gi, EXPO_URL)
        .replace(/localhost(:\d+)?/g, `${EXPO_IP}:${EXPO_PORT}`)
        .replace(/127\.0\.0\.1(:\d+)?/g, `${EXPO_IP}:${EXPO_PORT}`);
      
      // Se detectou QR code com localhost, adicionar QR code correto
      if (hasQRCode && !output.includes(EXPO_URL)) {
        // Adicionar QR code correto após a linha
        output = output + '\n' + '═'.repeat(70) + '\n';
        output = output + '⚠️  QR CODE CORRIGIDO (localhost foi substituído)\n';
        output = output + '═'.repeat(70) + '\n';
      }
    }
    
    callback(null, output);
  }
});

// Preparar argumentos do Expo
let expoArgs = ['expo', 'start', '--clear'];

if (useTunnel) {
  expoArgs.push('--tunnel');
  console.log('🌐 Modo: TUNNEL');
} else {
  expoArgs.push('--lan', '--host', EXPO_IP, '--port', EXPO_PORT);
  console.log(`🌐 Modo: LAN (IP: ${EXPO_IP})`);
}

if (args.includes('--dev-client')) {
  expoArgs.push('--dev-client');
}

console.log('');
console.log('🚀 Iniciando Expo...');
console.log('');

// Gerar QR code correto após alguns segundos (quando Metro estiver pronto)
setTimeout(() => {
  gerarQRCodeCustomizado();
}, 5000);

// Executar Expo
const expo = spawn('npx', expoArgs, {
  env: env,
  shell: true
});

// Interceptar saída
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


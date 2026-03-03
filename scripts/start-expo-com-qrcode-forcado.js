#!/usr/bin/env node

// Script que inicia Expo E gera QR code automaticamente após alguns segundos

const { spawn } = require('child_process');
const { Transform } = require('stream');

const EXPO_IP = '192.168.0.20';
const EXPO_PORT = '8081';
const EXPO_URL = `exp://${EXPO_IP}:${EXPO_PORT}`;

console.log('\n');
console.log('═'.repeat(70));
console.log('🚀 EXPO COM QR CODE FORÇADO');
console.log('═'.repeat(70));
console.log('');
console.log(`📱 IP: ${EXPO_IP}`);
console.log(`🔌 Porta: ${EXPO_PORT}`);
console.log(`🎯 URL: ${EXPO_URL}`);
console.log('');
console.log('✅ QR code será gerado automaticamente em 8 segundos');
console.log('═'.repeat(70));
console.log('');

// Configurar variáveis
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
};

// Interceptador que substitui localhost
const interceptador = new Transform({
  transform(chunk, encoding, callback) {
    let output = chunk.toString();
    
    // Substituir localhost
    output = output
      .replace(/http:\/\/localhost(:\d+)?/gi, `http://${EXPO_IP}:${EXPO_PORT}`)
      .replace(/https:\/\/localhost(:\d+)?/gi, `https://${EXPO_IP}:${EXPO_PORT}`)
      .replace(/exp:\/\/localhost(:\d+)?/gi, EXPO_URL)
      .replace(/<u[^>]*>http:\/\/localhost(:\d+)?<\/u>/gi, `<u style="text-decoration-style:solid">http://${EXPO_IP}:${EXPO_PORT}</u>`)
      .replace(/Metro waiting on\s+.*?localhost.*?/gi, `Metro waiting on http://${EXPO_IP}:${EXPO_PORT}`);
    
    callback(null, output);
  }
});

// Função para gerar QR code
function gerarQRCode() {
  try {
    const qrcode = require('qrcode-terminal');
    console.log('\n');
    console.log('═'.repeat(70));
    console.log('📱 QR CODE CORRETO (exp://192.168.0.20:8081)');
    console.log('═'.repeat(70));
    console.log('');
    qrcode.generate(EXPO_URL, { small: true }, (qr) => {
      console.log(qr);
      console.log('');
      console.log(`🎯 URL: ${EXPO_URL}`);
      console.log('');
      console.log('📱 Use este QR code no Expo Go!');
      console.log('   Ou cole a URL manualmente: ' + EXPO_URL);
      console.log('');
      console.log('═'.repeat(70));
      console.log('');
    });
  } catch (e) {
    console.log('\n');
    console.log('═'.repeat(70));
    console.log('📱 URL PARA EXPO GO:');
    console.log('═'.repeat(70));
    console.log('');
    console.log(`   ${EXPO_URL}`);
    console.log('');
    console.log('💡 Para gerar QR code, instale: npm install -g qrcode-terminal');
    console.log('═'.repeat(70));
    console.log('');
  }
}

// Obter argumentos
const args = process.argv.slice(2);
const useTunnel = args.includes('--tunnel');

let expoArgs = ['expo', 'start', '--clear'];

if (useTunnel) {
  expoArgs.push('--tunnel');
} else {
  expoArgs.push('--lan', '--host', EXPO_IP, '--port', EXPO_PORT);
}

if (args.includes('--dev-client')) {
  expoArgs.push('--dev-client');
}

// Gerar QR code após 8 segundos
setTimeout(() => {
  gerarQRCode();
}, 8000);

// Executar Expo
const expo = spawn('npx', expoArgs, {
  env: env,
  shell: true
});

expo.stdout.pipe(interceptador).pipe(process.stdout);
expo.stderr.pipe(interceptador).pipe(process.stderr);

expo.on('error', (err) => {
  console.error('❌ Erro:', err);
  process.exit(1);
});

expo.on('exit', (code) => {
  process.exit(code || 0);
});

process.on('SIGINT', () => {
  expo.kill('SIGINT');
  process.exit(0);
});


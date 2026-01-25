#!/usr/bin/env node

// Script que força Tunnel Mode E intercepta TODA saída para substituir localhost
// Garante que NENHUMA URL use localhost, mesmo em tunnel mode

const { spawn } = require('child_process');
const { Transform } = require('stream');

const EXPO_IP = '10.102.0.103';
const EXPO_PORT = '8081';
const EXPO_URL = `exp://${EXPO_IP}:${EXPO_PORT}`;

console.log('\n');
console.log('═'.repeat(70));
console.log('🚫 TUNNEL MODE COM BLOQUEIO TOTAL DE LOCALHOST');
console.log('═'.repeat(70));
console.log('');
console.log(`📱 IP Local: ${EXPO_IP}`);
console.log(`🔌 Porta: ${EXPO_PORT}`);
console.log(`🎯 URL Local: ${EXPO_URL}`);
console.log('');
console.log('✅ Tunnel Mode será usado (não precisa Metro local)');
console.log('✅ TODA saída será interceptada para remover localhost');
console.log('✅ QR code será gerado com URL correta');
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

// Interceptador ULTRA AGRESSIVO
const interceptador = new Transform({
  transform(chunk, encoding, callback) {
    let output = chunk.toString();
    const originalOutput = output;
    
    // Preservar URLs do tunnel (.exp.direct) - essas são válidas
    const temTunnelURL = output.match(/exp:\/\/[a-z0-9-]+\.exp\.direct(:\d+)?/i);
    let tunnelURL = null;
    if (temTunnelURL) {
      tunnelURL = temTunnelURL[0];
    }
    
    // SUBSTITUIR TODOS os localhost (exceto URLs do tunnel)
    // 1. URLs HTTP/HTTPS localhost
    output = output.replace(/http:\/\/localhost(:\d+)?/gi, (match) => {
      const port = match.match(/:(\d+)/)?.[1] || EXPO_PORT;
      return `http://${EXPO_IP}:${port}`;
    });
    
    output = output.replace(/https:\/\/localhost(:\d+)?/gi, (match) => {
      const port = match.match(/:(\d+)/)?.[1] || EXPO_PORT;
      return `https://${EXPO_IP}:${port}`;
    });
    
    // 2. URLs exp:// localhost (substituir por URL local ou tunnel)
    if (tunnelURL) {
      // Se tem tunnel URL, usar ela
      output = output.replace(/exp:\/\/localhost(:\d+)?/gi, tunnelURL);
    } else {
      // Senão, usar IP local
      output = output.replace(/exp:\/\/localhost(:\d+)?/gi, EXPO_URL);
    }
    
    output = output.replace(/exp:\/\/127\.0\.0\.1(:\d+)?/gi, tunnelURL || EXPO_URL);
    
    // 3. Tags HTML com localhost
    output = output.replace(/<u[^>]*>http:\/\/localhost(:\d+)?<\/u>/gi, 
      `<u style="text-decoration-style:solid">http://${EXPO_IP}:${EXPO_PORT}</u>`);
    
    if (tunnelURL) {
      output = output.replace(/<u[^>]*>exp:\/\/localhost(:\d+)?<\/u>/gi, 
        `<u style="text-decoration-style:solid">${tunnelURL}</u>`);
    } else {
      output = output.replace(/<u[^>]*>exp:\/\/localhost(:\d+)?<\/u>/gi, 
        `<u style="text-decoration-style=solid">${EXPO_URL}</u>`);
    }
    
    // 4. Mensagens do Metro
    if (tunnelURL) {
      output = output.replace(/Metro waiting on\s+.*?localhost.*?/gi, 
        `Metro waiting on ${tunnelURL}`);
    } else {
      output = output.replace(/Metro waiting on\s+.*?localhost.*?/gi, 
        `Metro waiting on http://${EXPO_IP}:${EXPO_PORT}`);
    }
    
    // 5. localhost isolado (com contexto)
    output = output.replace(/([^a-zA-Z0-9])localhost(:\d+)?([^a-zA-Z0-9])/g, (match, before, port, after) => {
      const portStr = port || `:${EXPO_PORT}`;
      return `${before}${EXPO_IP}${portStr}${after}`;
    });
    
    // 6. 127.0.0.1
    output = output.replace(/([^a-zA-Z0-9])127\.0\.0\.1(:\d+)?([^a-zA-Z0-9])/g, (match, before, port, after) => {
      const portStr = port || `:${EXPO_PORT}`;
      return `${before}${EXPO_IP}${portStr}${after}`;
    });
    
    // Se detectou e substituiu localhost, adicionar aviso
    if (originalOutput.includes('localhost') && !output.includes('localhost')) {
      if (output.match(/Metro waiting|Waiting on/i) && !output.includes('🎯 URL CORRIGIDA')) {
        const urlFinal = tunnelURL || EXPO_URL;
        output = output + '\n' + '═'.repeat(70) + '\n' +
                 '🎯 URL CORRIGIDA (localhost foi substituído):\n' +
                 `   ${urlFinal}\n` +
                 '   Use esta URL no Expo Go!\n' +
                 '═'.repeat(70) + '\n';
      }
    }
    
    callback(null, output);
  }
});

// Função para gerar QR code
function gerarQRCode(url) {
  try {
    const qrcode = require('qrcode-terminal');
    console.log('\n');
    console.log('═'.repeat(70));
    console.log('📱 QR CODE CORRETO');
    console.log('═'.repeat(70));
    console.log('');
    qrcode.generate(url, { small: true }, (qr) => {
      console.log(qr);
      console.log('');
      console.log(`🎯 URL: ${url}`);
      console.log('📱 Use este QR code no Expo Go!');
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
    console.log(`   ${url}`);
    console.log('');
    console.log('═'.repeat(70));
    console.log('');
  }
}

// Obter argumentos
const args = process.argv.slice(2);
const useDevClient = args.includes('--dev-client');

// Preparar argumentos - SEMPRE usar tunnel
let expoArgs = ['expo', 'start', '--tunnel', '--clear'];

if (useDevClient) {
  expoArgs.push('--dev-client');
}

console.log('🚀 Iniciando Expo em TUNNEL MODE...');
console.log('   (Aguardando túnel conectar...)');
console.log('');

// Gerar QR code após 15 segundos (quando tunnel estiver pronto)
let qrCodeGerado = false;
setTimeout(() => {
  if (!qrCodeGerado) {
    // Tentar obter URL do tunnel
    const http = require('http');
    const req = http.get('http://localhost:8081', (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const tunnelMatch = data.match(/exp:\/\/[a-z0-9-]+\.exp\.direct(:\d+)?/i);
        if (tunnelMatch) {
          gerarQRCode(tunnelMatch[0]);
        } else {
          gerarQRCode(EXPO_URL);
        }
        qrCodeGerado = true;
      });
    });
    req.on('error', () => {
      gerarQRCode(EXPO_URL);
      qrCodeGerado = true;
    });
    req.setTimeout(3000, () => {
      req.destroy();
      gerarQRCode(EXPO_URL);
      qrCodeGerado = true;
    });
  }
}, 15000);

// Executar Expo
const expo = spawn('npx', expoArgs, {
  env: env,
  shell: true,
  stdio: ['inherit', 'pipe', 'pipe']
});

// Interceptar TUDO
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


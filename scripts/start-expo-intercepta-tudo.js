#!/usr/bin/env node

// Script ULTRA AGRESSIVO que intercepta TUDO: terminal, HTTP, headers, respostas
// Garante que NENHUMA saída mostre localhost

const { spawn } = require('child_process');
const { Transform } = require('stream');

const EXPO_IP = '10.102.0.103';
const EXPO_PORT = '8081';
const EXPO_URL = `exp://${EXPO_IP}:${EXPO_PORT}`;

console.log('\n');
console.log('═'.repeat(70));
console.log('🚫 INTERCEPTAÇÃO TOTAL - NENHUM LOCALHOST PASSARÁ');
console.log('═'.repeat(70));
console.log('');
console.log(`📱 IP FORÇADO: ${EXPO_IP}`);
console.log(`🔌 Porta: ${EXPO_PORT}`);
console.log(`🎯 URL CORRETA: ${EXPO_URL}`);
console.log('');
console.log('✅ Interceptando: Terminal, HTTP, Headers, Respostas, QR codes');
console.log('═'.repeat(70));
console.log('');

// Configurar TODAS as variáveis de ambiente
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

// Transform stream ULTRA AGRESSIVO que intercepta TUDO
const interceptadorTotal = new Transform({
  transform(chunk, encoding, callback) {
    let output = chunk.toString();
    const originalOutput = output;
    
    // Em tunnel mode, preservar URLs do tunnel (.exp.direct)
    if (useTunnel) {
      if (output.match(/\.exp\.direct/i)) {
        callback(null, output);
        return;
      }
    }
    
    // Lista COMPLETA de padrões a substituir - MUITO MAIS AGRESSIVA
    const replacements = [
      // URLs HTTP/HTTPS localhost (qualquer porta, qualquer contexto)
      [/http:\/\/localhost(:\d+)?/gi, (match) => {
        const port = match.match(/:(\d+)/)?.[1] || EXPO_PORT;
        return `http://${EXPO_IP}:${port}`;
      }],
      [/https:\/\/localhost(:\d+)?/gi, (match) => {
        const port = match.match(/:(\d+)/)?.[1] || EXPO_PORT;
        return `https://${EXPO_IP}:${port}`;
      }],
      
      // URLs exp:// localhost
      [/exp:\/\/localhost(:\d+)?/gi, EXPO_URL],
      [/exp:\/\/127\.0\.0\.1(:\d+)?/gi, EXPO_URL],
      
      // Padrões com tags HTML (como <u>localhost</u>)
      [/<u[^>]*>http:\/\/localhost(:\d+)?<\/u>/gi, `<u style="text-decoration-style:solid">http://${EXPO_IP}:${EXPO_PORT}</u>`],
      [/<u[^>]*>https:\/\/localhost(:\d+)?<\/u>/gi, `<u style="text-decoration-style:solid">https://${EXPO_IP}:${EXPO_PORT}</u>`],
      [/<u[^>]*>exp:\/\/localhost(:\d+)?<\/u>/gi, `<u style="text-decoration-style:solid">${EXPO_URL}</u>`],
      
      // Mensagens específicas do Metro/Expo
      [/Metro waiting on .*localhost.*/gi, `Metro waiting on http://${EXPO_IP}:${EXPO_PORT}`],
      [/Waiting on .*localhost.*/gi, `Waiting on ${EXPO_URL}`],
      [/Connect to .*localhost.*/gi, `Connect to ${EXPO_URL}`],
      
      // Padrões simples localhost (sem protocolo, mas com contexto)
      // CUIDADO: não substituir "localhost" em palavras como "localhosted" ou em contextos irrelevantes
      // Mas substituir quando for claramente uma URL
      [/([^a-zA-Z0-9])localhost(:\d+)?([^a-zA-Z0-9])/g, (match, before, port, after) => {
        const portStr = port || `:${EXPO_PORT}`;
        return `${before}${EXPO_IP}${portStr}${after}`;
      }],
      [/([^a-zA-Z0-9])127\.0\.0\.1(:\d+)?([^a-zA-Z0-9])/g, (match, before, port, after) => {
        const portStr = port || `:${EXPO_PORT}`;
        return `${before}${EXPO_IP}${portStr}${after}`;
      }],
      
      // Padrões em strings JSON
      [/"localhost(:\d+)?"/g, (match) => {
        const port = match.match(/:(\d+)/)?.[1] || `:${EXPO_PORT}`;
        return `"${EXPO_IP}${port}"`;
      }],
      [/'localhost(:\d+)?'/g, (match) => {
        const port = match.match(/:(\d+)/)?.[1] || `:${EXPO_PORT}`;
        return `'${EXPO_IP}${port}'`;
      }],
    ];
    
    // Aplicar todas as substituições
    replacements.forEach(([pattern, replacement]) => {
      if (typeof replacement === 'function') {
        output = output.replace(pattern, replacement);
      } else {
        output = output.replace(pattern, replacement);
      }
    });
    
    // Se detectou e substituiu localhost, adicionar aviso (apenas uma vez por chunk significativo)
    if (originalOutput.includes('localhost') && !output.includes('localhost')) {
      // Verificar se é uma mensagem importante (Metro waiting, etc)
      if (output.match(/Metro waiting|Waiting on|Connect to/i) && !output.includes('🎯 URL CORRIGIDA')) {
        output = output.replace(
          /(Metro waiting on|Waiting on|Connect to).*/i,
          (match) => {
            return match + '\n\n' + '═'.repeat(70) + '\n' +
                   '🎯 URL CORRIGIDA (localhost foi substituído):\n' +
                   `   ${EXPO_URL}\n` +
                   '   Use esta URL no Expo Go!\n' +
                   '═'.repeat(70) + '\n';
          }
        );
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
  console.log('✅ URLs do tunnel (.exp.direct) serão preservadas');
} else {
  expoArgs.push('--lan', '--host', EXPO_IP, '--port', EXPO_PORT);
  console.log(`🌐 Modo: LAN (IP: ${EXPO_IP})`);
}

if (args.includes('--dev-client')) {
  expoArgs.push('--dev-client');
}

console.log('');
console.log('🚀 Iniciando Expo com interceptação total...');
console.log('');

// Executar Expo
const expo = spawn('npx', expoArgs, {
  env: env,
  shell: true
});

// Interceptar TUDO: stdout e stderr
expo.stdout.pipe(interceptadorTotal).pipe(process.stdout);
expo.stderr.pipe(interceptadorTotal).pipe(process.stderr);

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


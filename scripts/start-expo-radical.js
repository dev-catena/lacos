#!/usr/bin/env node

// SOLUÇÃO RADICAL: Intercepta TUDO e substitui localhost em TODAS as camadas
// Não permite que NENHUMA saída contenha localhost

const { spawn } = require('child_process');
const { Transform } = require('stream');

const EXPO_IP = '10.102.0.103';
const EXPO_PORT = '8081';
const EXPO_URL = `exp://${EXPO_IP}:${EXPO_PORT}`;

console.log('\n');
console.log('═'.repeat(70));
console.log('🚫 SOLUÇÃO RADICAL - BLOQUEIO TOTAL DE LOCALHOST');
console.log('═'.repeat(70));
console.log('');
console.log(`📱 IP FORÇADO: ${EXPO_IP}`);
console.log(`🔌 Porta: ${EXPO_PORT}`);
console.log(`🎯 URL: ${EXPO_URL}`);
console.log('');
console.log('⚠️  TODA saída será interceptada e localhost será substituído');
console.log('═'.repeat(70));
console.log('');

// Configurar TODAS as variáveis - SOBRESCREVER TUDO
const env = {
  ...process.env,
  // Variáveis críticas
  REACT_NATIVE_PACKAGER_HOSTNAME: EXPO_IP,
  EXPO_PACKAGER_HOSTNAME: EXPO_IP,
  PACKAGER_HOSTNAME: EXPO_IP,
  REACT_NATIVE_PACKAGER_PORT: EXPO_PORT,
  EXPO_PACKAGER_PORT: EXPO_PORT,
  METRO_HOST: EXPO_IP,
  HOST: EXPO_IP,
  PORT: EXPO_PORT,
  EXPO_DEVTOOLS_LISTEN_ADDRESS: '0.0.0.0',
  
  // BLOQUEAR localhost completamente
  EXPO_NO_LOCALHOST: '1',
  EXPO_USE_LOCALHOST: '0',
  EXPO_NO_DOTENV: '1',
  EXPO_USE_METRO_WORKSPACE_ROOT: '1',
  
  // SOBRESCREVER qualquer localhost
  LOCALHOST: EXPO_IP,
  HOSTNAME: EXPO_IP,
  
  NODE_ENV: process.env.NODE_ENV || 'development',
};

// Obter argumentos
const args = process.argv.slice(2);
const useTunnel = args.includes('--tunnel');

// Transform ULTRA AGRESSIVO - substitui QUALQUER localhost
const interceptadorRadical = new Transform({
  transform(chunk, encoding, callback) {
    let output = chunk.toString();
    
    // Em tunnel mode, preservar apenas URLs do tunnel
    if (useTunnel && output.match(/\.exp\.direct/i)) {
      callback(null, output);
      return;
    }
    
    // SUBSTITUIR TODOS os padrões de localhost - MUITO MAIS AGRESSIVO
    // Usar replace global com flag 'g' para pegar TODAS as ocorrências
    
    // 1. URLs completas (http://, https://, exp://)
    output = output.replace(/http:\/\/localhost(:\d+)?/gi, (match) => {
      const port = match.match(/:(\d+)/)?.[1] || EXPO_PORT;
      return `http://${EXPO_IP}:${port}`;
    });
    
    output = output.replace(/https:\/\/localhost(:\d+)?/gi, (match) => {
      const port = match.match(/:(\d+)/)?.[1] || EXPO_PORT;
      return `https://${EXPO_IP}:${port}`;
    });
    
    output = output.replace(/exp:\/\/localhost(:\d+)?/gi, EXPO_URL);
    output = output.replace(/exp:\/\/127\.0\.0\.1(:\d+)?/gi, EXPO_URL);
    
    // 2. Tags HTML com localhost
    output = output.replace(/<u[^>]*>http:\/\/localhost(:\d+)?<\/u>/gi, 
      `<u style="text-decoration-style:solid">http://${EXPO_IP}:${EXPO_PORT}</u>`);
    output = output.replace(/<u[^>]*>https:\/\/localhost(:\d+)?<\/u>/gi, 
      `<u style="text-decoration-style:solid">https://${EXPO_IP}:${EXPO_PORT}</u>`);
    output = output.replace(/<u[^>]*>exp:\/\/localhost(:\d+)?<\/u>/gi, 
      `<u style="text-decoration-style:solid">${EXPO_URL}</u>`);
    
    // 3. Mensagens específicas do Metro
    output = output.replace(/Metro waiting on\s+.*?localhost.*?/gi, 
      `Metro waiting on http://${EXPO_IP}:${EXPO_PORT}`);
    output = output.replace(/Waiting on\s+.*?localhost.*?/gi, 
      `Waiting on ${EXPO_URL}`);
    
    // 4. localhost isolado (com contexto de URL)
    // Substituir localhost:porta quando precedido por espaço, quebra de linha, ou caracteres especiais
    output = output.replace(/([^a-zA-Z0-9])localhost(:\d+)?([^a-zA-Z0-9])/g, (match, before, port, after) => {
      const portStr = port || `:${EXPO_PORT}`;
      return `${before}${EXPO_IP}${portStr}${after}`;
    });
    
    // 5. 127.0.0.1
    output = output.replace(/([^a-zA-Z0-9])127\.0\.0\.1(:\d+)?([^a-zA-Z0-9])/g, (match, before, port, after) => {
      const portStr = port || `:${EXPO_PORT}`;
      return `${before}${EXPO_IP}${portStr}${after}`;
    });
    
    // 6. Strings JSON
    output = output.replace(/"localhost(:\d+)?"/g, (match) => {
      const port = match.match(/:(\d+)/)?.[1] || `:${EXPO_PORT}`;
      return `"${EXPO_IP}${port}"`;
    });
    
    // 7. Qualquer outro localhost que sobrar (última tentativa)
    if (output.includes('localhost') && !useTunnel) {
      // Substituir localhost:porta quando claramente é uma URL
      output = output.replace(/localhost(:\d+)?/g, (match) => {
        const port = match.match(/:(\d+)/)?.[1] || `:${EXPO_PORT}`;
        return `${EXPO_IP}${port}`;
      });
    }
    
    callback(null, output);
  }
});

// Preparar argumentos
let expoArgs = ['expo', 'start', '--clear'];

if (useTunnel) {
  expoArgs.push('--tunnel');
  console.log('🌐 Modo: TUNNEL');
} else {
  expoArgs.push('--lan', '--host', EXPO_IP, '--port', EXPO_PORT);
  console.log(`🌐 Modo: LAN (${EXPO_IP})`);
}

if (args.includes('--dev-client')) {
  expoArgs.push('--dev-client');
}

console.log('');
console.log('🚀 Iniciando Expo com bloqueio radical de localhost...');
console.log('');

// Executar
const expo = spawn('npx', expoArgs, {
  env: env,
  shell: true,
  stdio: ['inherit', 'pipe', 'pipe']
});

// Interceptar TUDO
expo.stdout.pipe(interceptadorRadical).pipe(process.stdout);
expo.stderr.pipe(interceptadorRadical).pipe(process.stderr);

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

process.on('SIGTERM', () => {
  expo.kill('SIGTERM');
  process.exit(0);
});


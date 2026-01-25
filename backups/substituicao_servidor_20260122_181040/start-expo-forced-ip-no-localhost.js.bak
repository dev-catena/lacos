#!/usr/bin/env node

// Script ULTRA AGRESSIVO para forçar IP correto e BLOQUEAR localhost completamente
const { spawn } = require('child_process');
const { Transform } = require('stream');

const EXPO_IP = '10.102.0.103';
const EXPO_PORT = '8081';
const EXPO_URL = `exp://${EXPO_IP}:${EXPO_PORT}`;

console.log('\n');
console.log('═'.repeat(70));
console.log('🚫 BLOQUEANDO LOCALHOST - FORÇANDO IP CORRETO');
console.log('═'.repeat(70));
console.log('');
console.log(`📱 IP FORÇADO: ${EXPO_IP}`);
console.log(`🔌 Porta: ${EXPO_PORT}`);
console.log(`🎯 URL CORRETA: ${EXPO_URL}`);
console.log('');
console.log('⚠️  TODAS as URLs de localhost serão substituídas automaticamente');
console.log('═'.repeat(70));
console.log('');

// Configurar TODAS as variáveis de ambiente ANTES de qualquer coisa
const env = {
  ...process.env,
  // Variáveis críticas do React Native/Expo
  REACT_NATIVE_PACKAGER_HOSTNAME: EXPO_IP,
  EXPO_PACKAGER_HOSTNAME: EXPO_IP,
  PACKAGER_HOSTNAME: EXPO_IP,
  REACT_NATIVE_PACKAGER_PORT: EXPO_PORT,
  EXPO_PACKAGER_PORT: EXPO_PORT,
  
  // Variáveis do Metro
  METRO_HOST: EXPO_IP,
  HOST: EXPO_IP,
  PORT: EXPO_PORT,
  
  // Variáveis do Expo DevTools
  EXPO_DEVTOOLS_LISTEN_ADDRESS: '0.0.0.0',
  EXPO_DEVTOOLS_LISTEN_PORT: EXPO_PORT,
  
  // Forçar que NÃO use localhost
  EXPO_NO_LOCALHOST: '1',
  EXPO_USE_LOCALHOST: '0',
  EXPO_NO_DOTENV: '1',
  EXPO_USE_METRO_WORKSPACE_ROOT: '1',
  
  // Node.js
  NODE_ENV: process.env.NODE_ENV || 'development',
};

// Obter argumentos da linha de comando ANTES de criar o transform
const args = process.argv.slice(2);
const useTunnel = args.includes('--tunnel');

// Criar transform stream ULTRA AGRESSIVO para interceptar e substituir TUDO
const urlRewriter = new Transform({
  transform(chunk, encoding, callback) {
    let output = chunk.toString();
    const originalOutput = output;
    
    // Em tunnel mode, NÃO substituir URLs do tunnel (.exp.direct)
    // Apenas substituir localhost se não for uma URL do tunnel
    if (useTunnel) {
      // Verificar se a linha contém URL do tunnel - se sim, não substituir
      if (output.match(/\.exp\.direct/i) || output.match(/exp:\/\/[a-z0-9-]+\.exp\.direct/i)) {
        // É uma URL do tunnel, deixar passar sem alteração
        callback(null, output);
        return;
      }
      // Em tunnel mode, também não interferir com QR code ou mensagens do Expo
      // Deixar passar linhas que podem conter QR code ou informações importantes
      // Incluindo caracteres especiais de QR code (blocos, espaços, etc)
      if (output.match(/QR|qr code|scan|expo go|tunnel ready|tunnel connected|█|▄|▀|░|▒|▓|│|─/i)) {
        // Não interceptar essas linhas - deixar passar direto (inclui QR code ASCII)
        callback(null, output);
        return;
      }
      // Em tunnel mode, ser MUITO menos agressivo - apenas substituir localhost explícito
      // Não adicionar avisos extras que podem interferir
      const hasLocalhost = output.match(/localhost|127\.0\.0\.1/i);
      if (!hasLocalhost) {
        // Sem localhost, deixar passar direto em tunnel mode
        callback(null, output);
        return;
      }
    }
    
    // Lista COMPLETA de padrões a substituir (muito mais abrangente)
    const replacements = [
      // URLs HTTP/HTTPS localhost (qualquer porta)
      [/http:\/\/localhost(:\d+)?/gi, (match) => {
        const port = match.match(/:(\d+)/)?.[1] || EXPO_PORT;
        return `exp://${EXPO_IP}:${port}`;
      }],
      [/https:\/\/localhost(:\d+)?/gi, (match) => {
        const port = match.match(/:(\d+)/)?.[1] || EXPO_PORT;
        return `exp://${EXPO_IP}:${port}`;
      }],
      
      // URLs com 127.0.0.1
      [/http:\/\/127\.0\.0\.1(:\d+)?/gi, (match) => {
        const port = match.match(/:(\d+)/)?.[1] || EXPO_PORT;
        return `exp://${EXPO_IP}:${port}`;
      }],
      [/https:\/\/127\.0\.0\.1(:\d+)?/gi, (match) => {
        const port = match.match(/:(\d+)/)?.[1] || EXPO_PORT;
        return `exp://${EXPO_IP}:${port}`;
      }],
      
      // URLs exp:// localhost (já tem formato correto, só precisa trocar IP)
      [/exp:\/\/localhost(:\d+)?/gi, (match) => {
        const port = match.match(/:(\d+)/)?.[1] || EXPO_PORT;
        return `exp://${EXPO_IP}:${port}`;
      }],
      [/exp:\/\/127\.0\.0\.1(:\d+)?/gi, (match) => {
        const port = match.match(/:(\d+)/)?.[1] || EXPO_PORT;
        return `exp://${EXPO_IP}:${port}`;
      }],
      
      // Padrões simples localhost (sem protocolo)
      [/localhost(:\d+)?/g, (match) => {
        const port = match.match(/:(\d+)/)?.[1] || `:${EXPO_PORT}`;
        return `${EXPO_IP}${port}`;
      }],
      [/127\.0\.0\.1(:\d+)?/g, (match) => {
        const port = match.match(/:(\d+)/)?.[1] || `:${EXPO_PORT}`;
        return `${EXPO_IP}${port}`;
      }],
      
      // Mensagens do Metro/Expo (mais padrões)
      [/Metro waiting on .*localhost.*/gi, `Metro waiting on ${EXPO_URL}`],
      [/Waiting on .*localhost.*/gi, `Waiting on ${EXPO_URL}`],
      [/Connect to .*localhost.*/gi, `Connect to ${EXPO_URL}`],
      [/Scan QR code.*localhost.*/gi, `Scan QR code: ${EXPO_URL}`],
      
      // JSON e strings com localhost
      [/"localhost(:\d+)?"/g, (match) => {
        const port = match.match(/:(\d+)/)?.[1] || `:${EXPO_PORT}`;
        return `"${EXPO_IP}${port}"`;
      }],
      [/'localhost(:\d+)?'/g, (match) => {
        const port = match.match(/:(\d+)/)?.[1] || `:${EXPO_PORT}`;
        return `'${EXPO_IP}${port}'`;
      }],
      [/`localhost(:\d+)?`/g, (match) => {
        const port = match.match(/:(\d+)/)?.[1] || `:${EXPO_PORT}`;
        return `\`${EXPO_IP}${port}\``;
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
    
    // Em tunnel mode, não adicionar avisos extras que podem interferir com QR code
    if (!useTunnel) {
      // Se detectou localhost e substituiu, adicionar aviso destacado (apenas em LAN mode)
      if (originalOutput.includes('localhost') && !output.includes('localhost')) {
        // Adicionar mensagem destacada apenas uma vez por linha que foi alterada
        if (output.match(/Metro|Waiting|Connect|exp:\/\//i) && !output.match(/QR|qr code/i)) {
          output = '\n' + '🎯 URL CORRIGIDA (localhost foi substituído):\n' + 
                   `   ${EXPO_URL}\n` + 
                   '   Use esta URL no Expo Go!\n' + output;
        }
      }
    }
    
    callback(null, output);
  }
});

// useTunnel já foi definido acima
const useLan = args.includes('--lan') || !useTunnel;

// Preparar argumentos do Expo
let expoArgs = ['expo', 'start', '--clear'];

if (useTunnel) {
  expoArgs.push('--tunnel');
  console.log('🌐 Modo: TUNNEL');
  console.log('✅ URLs do tunnel (.exp.direct) serão preservadas');
  console.log('⚠️  Apenas localhost será substituído (se aparecer)');
  console.log('📱 O QR code deve aparecer automaticamente');
} else {
  expoArgs.push('--lan', '--host', EXPO_IP, '--port', EXPO_PORT);
  console.log(`🌐 Modo: LAN (IP: ${EXPO_IP})`);
}

// Forçar exibição do QR code (se disponível)
// O Expo mostra QR code automaticamente, mas podemos garantir

if (args.includes('--dev-client')) {
  expoArgs.push('--dev-client');
}

console.log('');
console.log('═'.repeat(70));
console.log('🚀 INICIANDO EXPO...');
console.log('═'.repeat(70));
console.log('');
console.log('📋 IMPORTANTE:');
console.log(`   1. URL CORRETA: ${EXPO_URL}`);
console.log('   2. Qualquer localhost será substituído automaticamente');
console.log('   3. Use a URL acima no Expo Go se necessário');
console.log('');
console.log('═'.repeat(70));
console.log('');

// Executar expo start
const expo = spawn('npx', expoArgs, {
  env: env,
  shell: true
});

// Interceptar stdout e stderr para reescrever URLs
expo.stdout.pipe(urlRewriter).pipe(process.stdout);
expo.stderr.pipe(urlRewriter).pipe(process.stderr);

expo.on('error', (err) => {
  console.error('❌ Erro ao iniciar Expo:', err);
  process.exit(1);
});

expo.on('exit', (code) => {
  process.exit(code || 0);
});

// Capturar sinais para encerrar corretamente
process.on('SIGINT', () => {
  expo.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  expo.kill('SIGTERM');
  process.exit(0);
});


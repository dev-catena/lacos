#!/usr/bin/env node

// Script para forçar o IP correto no Metro bundler
const { spawn } = require('child_process');
const { Transform } = require('stream');

const EXPO_IP = '10.102.0.103';
const EXPO_PORT = '8081';
const EXPO_URL = `exp://${EXPO_IP}:${EXPO_PORT}`;

// Configurar TODAS as variáveis de ambiente possíveis
process.env.REACT_NATIVE_PACKAGER_HOSTNAME = EXPO_IP;
process.env.EXPO_PACKAGER_HOSTNAME = EXPO_IP;
process.env.REACT_NATIVE_PACKAGER_PORT = EXPO_PORT;
process.env.EXPO_PACKAGER_PORT = EXPO_PORT;
process.env.EXPO_DEVTOOLS_LISTEN_ADDRESS = '0.0.0.0';
process.env.HOST = EXPO_IP;
process.env.PORT = EXPO_PORT;
process.env.EXPO_NO_DOTENV = '1';
process.env.EXPO_USE_METRO_WORKSPACE_ROOT = '1';

// Mostrar mensagem destacada ANTES de iniciar
console.log('\n');
console.log('═'.repeat(60));
console.log('📱 URL CORRETA PARA USAR NO EXPO GO:');
console.log('═'.repeat(60));
console.log('');
console.log(`   ${EXPO_URL}`);
console.log('');
console.log('═'.repeat(60));
console.log('');
console.log('⚠️  IMPORTANTE:');
console.log('   - O QR code pode mostrar localhost, mas IGNORE isso!');
console.log('   - Use a URL acima manualmente no Expo Go');
console.log('   - No Expo Go: "Enter URL manually" → Cole a URL acima');
console.log('');
console.log('═'.repeat(60));
console.log('');

// Obter argumentos da linha de comando
const args = process.argv.slice(2);
const expoArgs = ['start', '--lan', '--port', EXPO_PORT, ...args];

// Criar transform stream para interceptar e reescrever URLs
const urlRewriter = new Transform({
  transform(chunk, encoding, callback) {
    let output = chunk.toString();
    
    // Lista completa de padrões a substituir
    const replacements = [
      // URLs HTTP localhost (CRÍTICO: converter para exp://)
      [/http:\/\/localhost:8081/g, EXPO_URL],
      [/http:\/\/127\.0\.0\.1:8081/g, EXPO_URL],
      [/http:\/\/localhost:\d+/g, EXPO_URL],
      [/http:\/\/127\.0\.0\.1:\d+/g, EXPO_URL],
      
      // URLs exp:// localhost (já tem formato correto, só precisa trocar IP)
      [/exp:\/\/localhost:8081/g, EXPO_URL],
      [/exp:\/\/127\.0\.0\.1:8081/g, EXPO_URL],
      [/exp:\/\/localhost:\d+/g, EXPO_URL],
      [/exp:\/\/127\.0\.0\.1:\d+/g, EXPO_URL],
      
      // Padrões simples localhost (sem protocolo)
      [/localhost:8081/g, `${EXPO_IP}:${EXPO_PORT}`],
      [/127\.0\.0\.1:8081/g, `${EXPO_IP}:${EXPO_PORT}`],
      
      // Mensagens do Metro/Expo
      [/Metro waiting on http:\/\/localhost:8081/g, `Metro waiting on ${EXPO_URL}`],
      [/Metro waiting on http:\/\/127\.0\.0\.1:8081/g, `Metro waiting on ${EXPO_URL}`],
      [/Metro waiting on exp:\/\/localhost:8081/g, `Metro waiting on ${EXPO_URL}`],
      [/Waiting on http:\/\/localhost:8081/g, `Waiting on ${EXPO_URL}`],
      [/Waiting on exp:\/\/localhost:8081/g, `Waiting on ${EXPO_URL}`],
      
      // QR code e mensagens de conexão
      [/"http:\/\/localhost:8081"/g, `"${EXPO_URL}"`],
      [/'http:\/\/localhost:8081'/g, `'${EXPO_URL}'`],
      [/`http:\/\/localhost:8081`/g, `\`${EXPO_URL}\``],
    ];
    
    // Aplicar todas as substituições
    replacements.forEach(([pattern, replacement]) => {
      output = output.replace(pattern, replacement);
    });
    
    // Se detectar qualquer mensagem sobre conexão/QR code/Metro, adicionar aviso destacado
    if (output.match(/QR|Metro waiting|Waiting on|Connect|conectar/i)) {
      // Adicionar mensagem destacada apenas uma vez por chunk que contém essas palavras
      if (!output.includes('🎯 USE ESTA URL')) {
        const match = output.match(/Metro waiting on|Waiting on|QR code/i);
        if (match) {
          output = output.replace(
            match[0],
            match[0] + '\n\n' +
            '═'.repeat(70) + '\n' +
            '🎯 USE ESTA URL NO EXPO GO (IGNORE QUALQUER localhost):\n' +
            '═'.repeat(70) + '\n' +
            `   ${EXPO_URL}\n` +
            '═'.repeat(70) + '\n'
          );
        }
      }
    }
    
    callback(null, output);
  }
});

// Executar expo start
const expo = spawn('npx', ['expo', ...expoArgs], {
  env: process.env,
  shell: true
});

// Interceptar stdout e stderr para reescrever URLs
expo.stdout.pipe(urlRewriter).pipe(process.stdout);
expo.stderr.pipe(urlRewriter).pipe(process.stderr);

expo.on('error', (err) => {
  console.error('Erro ao iniciar Expo:', err);
  process.exit(1);
});

expo.on('exit', (code) => {
  process.exit(code || 0);
});


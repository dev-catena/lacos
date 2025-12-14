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
    
    // Reescrever localhost:8081 para o IP correto
    output = output.replace(/localhost:8081/g, `${EXPO_IP}:${EXPO_PORT}`);
    output = output.replace(/127\.0\.0\.1:8081/g, `${EXPO_IP}:${EXPO_PORT}`);
    output = output.replace(/http:\/\/localhost:8081/g, `http://${EXPO_IP}:${EXPO_PORT}`);
    output = output.replace(/exp:\/\/localhost:8081/g, EXPO_URL);
    
    // Reescrever a mensagem "Metro waiting on"
    output = output.replace(/Metro waiting on http:\/\/localhost:8081/g, `Metro waiting on http://${EXPO_IP}:${EXPO_PORT}`);
    
    // Se detectar a mensagem "Metro waiting on", adicionar aviso
    if (output.includes('Metro waiting on')) {
      output += '\n\n';
      output += '═'.repeat(60) + '\n';
      output += '📱 LEMBRE-SE: Use esta URL no Expo Go:\n';
      output += '═'.repeat(60) + '\n';
      output += `   ${EXPO_URL}\n`;
      output += '═'.repeat(60) + '\n\n';
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


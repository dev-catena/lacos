#!/usr/bin/env node

// Script para forçar o IP correto no Expo e interceptar TODAS as URLs
const { spawn } = require('child_process');
const { Transform } = require('stream');

const EXPO_IP = '10.102.0.103';
const EXPO_PORT = '8081';
const EXPO_URL = `exp://${EXPO_IP}:${EXPO_PORT}`;

console.log('');
console.log('═'.repeat(70));
console.log('📱 EXPO FORÇADO PARA USAR IP: ' + EXPO_IP + ':' + EXPO_PORT);
console.log('═'.repeat(70));
console.log('');
console.log('🎯 URL CORRETA PARA USAR:');
console.log('   ' + EXPO_URL);
console.log('');
console.log('⚠️  IMPORTANTE:');
console.log('   - Se o QR code mostrar localhost, IGNORE e use a URL acima');
console.log('   - No Expo Go: "Enter URL manually" → Cole: ' + EXPO_URL);
console.log('');
console.log('═'.repeat(70));
console.log('');

// Configurar TODAS as variáveis de ambiente possíveis ANTES de iniciar
process.env.REACT_NATIVE_PACKAGER_HOSTNAME = EXPO_IP;
process.env.EXPO_PACKAGER_HOSTNAME = EXPO_IP;
process.env.PACKAGER_HOSTNAME = EXPO_IP;
process.env.REACT_NATIVE_PACKAGER_PORT = EXPO_PORT;
process.env.EXPO_PACKAGER_PORT = EXPO_PORT;
process.env.EXPO_DEVTOOLS_LISTEN_ADDRESS = '0.0.0.0';
process.env.HOST = EXPO_IP;
process.env.PORT = EXPO_PORT;
process.env.METRO_HOST = EXPO_IP;
process.env.EXPO_NO_DOTENV = '1';
process.env.EXPO_USE_METRO_WORKSPACE_ROOT = '1';
process.env.EXPO_NO_LOCALHOST = '1';
process.env.EXPO_USE_LOCALHOST = '0';

// Obter argumentos da linha de comando
const args = process.argv.slice(2);
// Usar --lan (não --tunnel nem --host) e deixar as variáveis de ambiente fazerem o trabalho
const expoArgs = ['start', '--lan', '--port', EXPO_PORT, ...args];

// Criar transform stream para interceptar e reescrever TODAS as URLs
const urlRewriter = new Transform({
  transform(chunk, encoding, callback) {
    let output = chunk.toString();
    
    // Lista de padrões a substituir
    const replacements = [
      // URLs HTTP localhost
      [/http:\/\/localhost:8081/g, `http://${EXPO_IP}:${EXPO_PORT}`],
      [/http:\/\/127\.0\.0\.1:8081/g, `http://${EXPO_IP}:${EXPO_PORT}`],
      [/http:\/\/localhost:\d+/g, `http://${EXPO_IP}:${EXPO_PORT}`],
      [/http:\/\/127\.0\.0\.1:\d+/g, `http://${EXPO_IP}:${EXPO_PORT}`],
      
      // URLs exp:// localhost
      [/exp:\/\/localhost:8081/g, EXPO_URL],
      [/exp:\/\/127\.0\.0\.1:8081/g, EXPO_URL],
      [/exp:\/\/localhost:\d+/g, EXPO_URL],
      [/exp:\/\/127\.0\.0\.1:\d+/g, EXPO_URL],
      
      // Mensagens do Metro
      [/Metro waiting on http:\/\/localhost:8081/g, `Metro waiting on http://${EXPO_IP}:${EXPO_PORT}`],
      [/Metro waiting on http:\/\/127\.0\.0\.1:8081/g, `Metro waiting on http://${EXPO_IP}:${EXPO_PORT}`],
      
      // QR code e mensagens de conexão
      [/localhost:8081/g, `${EXPO_IP}:${EXPO_PORT}`],
      [/127\.0\.0\.1:8081/g, `${EXPO_IP}:${EXPO_PORT}`],
      
      // Padrões genéricos
      [/\blocalhost\b/g, EXPO_IP],
      [/\b127\.0\.0\.1\b/g, EXPO_IP],
    ];
    
    // Aplicar todas as substituições
    replacements.forEach(([pattern, replacement]) => {
      output = output.replace(pattern, replacement);
    });
    
    // Se detectar mensagens sobre QR code ou conexão, adicionar aviso
    if (output.includes('QR code') || output.includes('Metro waiting') || output.includes('exp://')) {
      // Não adicionar aviso repetidamente
      if (!output.includes('URL CORRETA PARA USAR')) {
        output += '\n\n';
        output += '═'.repeat(70) + '\n';
        output += '📱 LEMBRE-SE: Use esta URL no Expo Go:\n';
        output += '═'.repeat(70) + '\n';
        output += `   ${EXPO_URL}\n`;
        output += '═'.repeat(70) + '\n\n';
      }
    }
    
    callback(null, output);
  }
});

// Executar expo start
const expo = spawn('npx', ['expo', ...expoArgs], {
  env: {
    ...process.env,
    // Garantir que TODAS as variáveis estão definidas
    REACT_NATIVE_PACKAGER_HOSTNAME: EXPO_IP,
    EXPO_PACKAGER_HOSTNAME: EXPO_IP,
    PACKAGER_HOSTNAME: EXPO_IP,
    HOST: EXPO_IP,
    PORT: EXPO_PORT,
  },
  shell: true,
  stdio: 'pipe'
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


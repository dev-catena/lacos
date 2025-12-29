#!/usr/bin/env node

// Script que REALMENTE força o IP correto interceptando o output do Expo
const { spawn } = require('child_process');
const { Transform } = require('stream');

const EXPO_IP = '10.102.0.103';
const EXPO_PORT = '8081';
const EXPO_URL = `exp://${EXPO_IP}:${EXPO_PORT}`;

// Configurar TODAS as variáveis de ambiente
process.env.REACT_NATIVE_PACKAGER_HOSTNAME = EXPO_IP;
process.env.EXPO_PACKAGER_HOSTNAME = EXPO_IP;
process.env.REACT_NATIVE_PACKAGER_PORT = EXPO_PORT;
process.env.EXPO_PACKAGER_PORT = EXPO_PORT;
process.env.EXPO_NO_DOTENV = '1';
process.env.EXPO_NO_LOCALHOST = '1';
process.env.EXPO_USE_LOCALHOST = '0';
process.env.EXPO_USE_DEV_CLIENT = '0';
process.env.HOST = EXPO_IP;
process.env.PORT = EXPO_PORT;

// Stream transformer que SUBSTITUI localhost pelo IP correto
const replaceLocalhost = new Transform({
  transform(chunk, encoding, callback) {
    let output = chunk.toString();
    
    // SUBSTITUIR TODAS as ocorrências de localhost:8081
    output = output.replace(/localhost:8081/g, `${EXPO_IP}:${EXPO_PORT}`);
    output = output.replace(/127\.0\.0\.1:8081/g, `${EXPO_IP}:${EXPO_PORT}`);
    output = output.replace(/http:\/\/localhost:8081/g, `http://${EXPO_IP}:${EXPO_PORT}`);
    output = output.replace(/exp:\/\/localhost:8081/g, EXPO_URL);
    output = output.replace(/exp:\/\/127\.0\.0\.1:8081/g, EXPO_URL);
    
    // Substituir "Waiting on http://localhost:8081"
    output = output.replace(/Waiting on http:\/\/localhost:8081/g, `Waiting on http://${EXPO_IP}:${EXPO_PORT}`);
    output = output.replace(/Waiting on exp:\/\/localhost:8081/g, `Waiting on ${EXPO_URL}`);
    output = output.replace(/Metro waiting on http:\/\/localhost:8081/g, `Metro waiting on http://${EXPO_IP}:${EXPO_PORT}`);
    output = output.replace(/Metro waiting on exp:\/\/localhost:8081/g, `Metro waiting on ${EXPO_URL}`);
    
    // Substituir em qualquer contexto de URL
    output = output.replace(/localhost/gi, EXPO_IP);
    
    callback(null, output);
  }
});

// Executar expo start
const args = ['expo', 'start', '--lan', '--port', EXPO_PORT, '--clear'];

const expo = spawn('npx', args, {
  env: process.env,
  shell: true
});

// Interceptar E SUBSTITUIR todo o output
expo.stdout.pipe(replaceLocalhost).pipe(process.stdout);
expo.stderr.pipe(replaceLocalhost).pipe(process.stderr);

expo.on('error', (err) => {
  console.error('❌ Erro ao iniciar Expo:', err);
  process.exit(1);
});

expo.on('exit', (code) => {
  process.exit(code || 0);
});



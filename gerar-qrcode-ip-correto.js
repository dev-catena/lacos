#!/usr/bin/env node

// Script para gerar QR code com URL correta (exp://10.102.0.103:8081)
// Pode ser executado em paralelo enquanto o Expo está rodando

const EXPO_IP = '10.102.0.103';
const EXPO_PORT = '8081';
const EXPO_URL = `exp://${EXPO_IP}:${EXPO_PORT}`;

console.log('\n');
console.log('═'.repeat(70));
console.log('📱 QR CODE COM URL CORRETA');
console.log('═'.repeat(70));
console.log('');
console.log(`🎯 URL: ${EXPO_URL}`);
console.log('');
console.log('═'.repeat(70));
console.log('');

// Tentar usar qrcode-terminal se disponível
try {
  const qrcode = require('qrcode-terminal');
  qrcode.generate(EXPO_URL, { small: true }, (qr) => {
    console.log(qr);
    console.log('');
    console.log('═'.repeat(70));
    console.log('📱 Use este QR code no Expo Go!');
    console.log(`   URL: ${EXPO_URL}`);
    console.log('═'.repeat(70));
    console.log('');
  });
} catch (e) {
  // Se qrcode-terminal não estiver instalado, mostrar URL e instruções
  console.log('⚠️  qrcode-terminal não está instalado');
  console.log('');
  console.log('💡 Para instalar e gerar QR code:');
  console.log('   npm install -g qrcode-terminal');
  console.log('   qrcode-terminal "' + EXPO_URL + '"');
  console.log('');
  console.log('📱 Ou use a URL manualmente no Expo Go:');
  console.log(`   ${EXPO_URL}`);
  console.log('');
  console.log('═'.repeat(70));
  console.log('');
}














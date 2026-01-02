#!/usr/bin/env node

// Script para gerar QR code FORÇADO com URL correta
// Pode ser executado enquanto o Expo está rodando

const EXPO_IP = process.env.EXPO_IP || '10.102.0.103';
const EXPO_PORT = process.env.EXPO_PORT || '8081';
const EXPO_URL = `exp://${EXPO_IP}:${EXPO_PORT}`;

console.log('\n');
console.log('═'.repeat(70));
console.log('📱 QR CODE FORÇADO - URL CORRETA');
console.log('═'.repeat(70));
console.log('');
console.log(`🎯 URL: ${EXPO_URL}`);
console.log('');
console.log('═'.repeat(70));
console.log('');

// Tentar gerar QR code
try {
  const qrcode = require('qrcode-terminal');
  
  qrcode.generate(EXPO_URL, { small: true }, (qr) => {
    console.log(qr);
    console.log('');
    console.log('═'.repeat(70));
    console.log('📱 USE ESTE QR CODE NO EXPO GO!');
    console.log('═'.repeat(70));
    console.log('');
    console.log(`   URL: ${EXPO_URL}`);
    console.log('');
    console.log('📋 INSTRUÇÕES:');
    console.log('   1. Abra o Expo Go no seu celular');
    console.log('   2. Toque em "Enter URL manually"');
    console.log('   3. Cole: ' + EXPO_URL);
    console.log('   4. Ou escaneie o QR code acima');
    console.log('');
    console.log('═'.repeat(70));
    console.log('');
  });
} catch (e) {
  console.log('⚠️  qrcode-terminal não está instalado');
  console.log('');
  console.log('💡 Instalando...');
  const { execSync } = require('child_process');
  try {
    execSync('npm install -g qrcode-terminal', { stdio: 'inherit' });
    console.log('✅ Instalado! Execute novamente este script.');
  } catch (err) {
    console.log('❌ Erro ao instalar. Use a URL manualmente:');
    console.log(`   ${EXPO_URL}`);
  }
}











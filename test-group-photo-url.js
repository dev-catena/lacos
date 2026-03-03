#!/usr/bin/env node

/**
 * Script para testar a URL da foto do grupo diretamente
 * Execute: node test-group-photo-url.js
 */

const API_CONFIG = {
  BASE_URL: 'http://192.168.0.20:8000/api',
};

// Simular o que o backend retorna
const testPhotoUrl = 'http://192.168.0.20:8000/storage/groups/photo.jpg';
const testPhotoUrlRelative = '/storage/groups/photo.jpg';
const testPhotoUrlNoSlash = 'storage/groups/photo.jpg';

console.log('🧪 TESTE DE CONSTRUÇÃO DE URL DE FOTO DE GRUPO\n');

console.log('1. URL completa do backend (asset):');
console.log('   URL:', testPhotoUrl);
console.log('   ✅ Deve funcionar direto\n');

console.log('2. URL relativa com /:');
const baseUrl1 = API_CONFIG.BASE_URL.replace('/api', '');
const url1 = testPhotoUrlRelative.startsWith('/') 
  ? `${baseUrl1}${testPhotoUrlRelative}` 
  : `${baseUrl1}/${testPhotoUrlRelative}`;
console.log('   URL original:', testPhotoUrlRelative);
console.log('   URL construída:', url1);
console.log('   ✅ Deve funcionar\n');

console.log('3. URL relativa sem /:');
const url2 = testPhotoUrlNoSlash.startsWith('/') 
  ? `${baseUrl1}${testPhotoUrlNoSlash}` 
  : `${baseUrl1}/${testPhotoUrlNoSlash}`;
console.log('   URL original:', testPhotoUrlNoSlash);
console.log('   URL construída:', url2);
console.log('   ✅ Deve funcionar\n');

console.log('4. Teste com cache-busting:');
const separator = testPhotoUrl.includes('?') ? '&' : '?';
const timestamp = Date.now();
const urlWithCache = `${testPhotoUrl}${separator}t=${timestamp}`;
console.log('   URL original:', testPhotoUrl);
console.log('   URL com cache-busting:', urlWithCache);
console.log('   ✅ Deve funcionar\n');

console.log('📋 RESUMO:');
console.log('   Base URL:', baseUrl1);
console.log('   Todas as URLs devem ser acessíveis via HTTP GET');
console.log('   Verifique se o servidor está servindo arquivos de storage corretamente');











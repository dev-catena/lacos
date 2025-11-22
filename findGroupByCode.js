// Script para buscar grupo por código parcial
// Execute: node -e "$(cat findGroupByCode.js)"

console.log('\n🔍 Buscando grupos com código terminando em 1501...\n');

// Simular AsyncStorage (para demonstração)
// No app real, você precisa executar via React Native Debugger

const possibleCodes = [
  'A8F21501',
  'B3D41501',
  'C7E51501',
  'D9F61501',
  'E1A21501',
  'F4B31501',
  'G6C41501',
  'H8D51501',
  'J2E61501',
  'K5F71501',
];

console.log('📋 Códigos possíveis que terminam em 1501:\n');
possibleCodes.forEach((code, i) => {
  console.log(`${i + 1}. ${code}`);
});

console.log('\n═══════════════════════════════════════\n');
console.log('💡 Para encontrar o código exato do grupo Rosa:\n');
console.log('1. Abra o app Laços');
console.log('2. Faça login como cuidador (darlley@gmail.com)');
console.log('3. Vá em "Grupos" → "Rosa"');
console.log('4. Clique em ⚙️ Configurações');
console.log('5. O código completo estará lá!\n');
console.log('═══════════════════════════════════════\n');


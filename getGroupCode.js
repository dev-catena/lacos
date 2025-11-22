// Script para buscar o código de um grupo
const AsyncStorage = require('@react-native-async-storage/async-storage').default;

async function getGroupCode() {
  try {
    const groupsJson = await AsyncStorage.getItem('@lacos_groups');
    
    if (!groupsJson) {
      console.log('\n❌ Nenhum grupo encontrado no AsyncStorage');
      return;
    }

    const groups = JSON.parse(groupsJson);
    
    console.log('\n📋 GRUPOS CADASTRADOS:\n');
    console.log('═══════════════════════════════════════\n');
    
    groups.forEach((group, index) => {
      console.log(`${index + 1}. ${group.groupName}`);
      console.log(`   👤 Acompanhado: ${group.accompaniedName}`);
      console.log(`   🔑 Código: ${group.code}`);
      console.log(`   📅 Criado em: ${new Date(group.createdAt).toLocaleString('pt-BR')}`);
      console.log('');
    });
    
    console.log('═══════════════════════════════════════\n');
    
    // Buscar especificamente o grupo Rosa
    const rosaGroup = groups.find(g => 
      g.groupName.toLowerCase().includes('rosa') || 
      g.accompaniedName.toLowerCase().includes('rosa')
    );
    
    if (rosaGroup) {
      console.log('✅ GRUPO ROSA ENCONTRADO:\n');
      console.log(`📱 Nome do Grupo: ${rosaGroup.groupName}`);
      console.log(`👤 Acompanhado: ${rosaGroup.accompaniedName}`);
      console.log(`\n🔑 CÓDIGO DE ACESSO: ${rosaGroup.code}\n`);
      console.log('═══════════════════════════════════════\n');
    } else {
      console.log('⚠️  Grupo "Rosa" não encontrado\n');
    }
    
  } catch (error) {
    console.error('Erro:', error);
  }
}

getGroupCode();


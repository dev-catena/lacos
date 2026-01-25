import Contacts from 'react-native-contacts';
import { PermissionsAndroid, Platform, Alert } from 'react-native';

let permissionRequested = false;

export const requestContactsPermission = async () => {
  if (Platform.OS === 'android') {
    try {
      // Evitar loop - verificar se já tem permissão
      const hasRead = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_CONTACTS);
      const hasWrite = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.WRITE_CONTACTS);
      
      console.log('[Permission] READ_CONTACTS:', hasRead);
      console.log('[Permission] WRITE_CONTACTS:', hasWrite);
      
      if (hasRead && hasWrite) {
        console.log('[Permission] ✅ Já tem todas as permissões');
        return true;
      }
      
      // Evitar múltiplas solicitações simultâneas
      if (permissionRequested) {
        console.log('[Permission] ⚠️ Já existe uma solicitação em andamento');
        return false;
      }
      
      permissionRequested = true;
      
      // Solicitar ambas as permissões
      const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
        PermissionsAndroid.PERMISSIONS.WRITE_CONTACTS,
      ]);
      
      permissionRequested = false;
      
      const readGranted = result[PermissionsAndroid.PERMISSIONS.READ_CONTACTS] === PermissionsAndroid.RESULTS.GRANTED;
      const writeGranted = result[PermissionsAndroid.PERMISSIONS.WRITE_CONTACTS] === PermissionsAndroid.RESULTS.GRANTED;
      
      console.log('[Permission] Resultado READ:', readGranted);
      console.log('[Permission] Resultado WRITE:', writeGranted);
      
      return readGranted && writeGranted;
    } catch (err) {
      permissionRequested = false;
      console.error('[Permission] Erro:', err);
      return false;
    }
  }
  return true;
};

export const saveContactToPhone = async (name, phoneNumber, skipPermissionCheck = false) => {
  try {
    console.log(`[Contacts] Tentando salvar: ${name} - ${phoneNumber}`);
    
    // Pular verificação de permissão se já foi feita antes
    if (!skipPermissionCheck) {
      const hasPermission = await requestContactsPermission();
      
      if (!hasPermission) {
        console.log('[Contacts] ❌ Permissão negada para:', name);
        return false;
      }
    }

    // Limpar número (remove tudo exceto dígitos)
    let cleanPhone = phoneNumber.replace(/\D/g, '');
    
    // Se o número já começa com 55 (Brasil), usar como está
    // Se não, adicionar 55 no início
    if (!cleanPhone.startsWith('55')) {
      cleanPhone = '55' + cleanPhone;
    }
    
    // Adicionar + no formato internacional
    const formattedPhone = '+' + cleanPhone;
    
    console.log(`[Contacts] Número limpo: ${cleanPhone}`);
    console.log(`[Contacts] Número formatado: ${formattedPhone}`);
    
    // Verificar se contato já existe
    try {
      const existingContacts = await Contacts.getAll();
      const contactExists = existingContacts.some(c => 
        c.phoneNumbers.some(p => {
          const existingClean = p.number.replace(/\D/g, '');
          return existingClean === cleanPhone;
        })
      );
      
      if (contactExists) {
        console.log(`[Contacts] Contato ${name} já existe - atualizando...`);
        // Deletar contato existente para recriar com número correto
        const contactToUpdate = existingContacts.find(c => 
          c.phoneNumbers.some(p => p.number.replace(/\D/g, '') === cleanPhone)
        );
        if (contactToUpdate) {
          await Contacts.deleteContact(contactToUpdate);
          console.log(`[Contacts] Contato antigo removido`);
        }
      }
    } catch (err) {
      console.log('[Contacts] Erro ao verificar contatos existentes:', err);
    }
    
    // Criar contato
    const newContact = {
      givenName: name,
      familyName: '(Laços)',
      phoneNumbers: [{
        label: 'mobile',
        number: formattedPhone,
      }],
    };

    await Contacts.addContact(newContact);
    console.log(`[Contacts] ✅ ${name} salvo: ${formattedPhone}`);
    return true;
  } catch (error) {
    console.error('[Contacts] ❌ Erro ao salvar:', name, error);
    return false;
  }
};

export const saveAllContactsToPhone = async (contacts, sosContacts) => {
  try {
    console.log('[Contacts] Iniciando salvamento...');
    console.log('[Contacts] Contatos rápidos:', contacts.length);
    console.log('[Contacts] Contatos SOS:', sosContacts.length);
    
    // Pedir permissão UMA ÚNICA VEZ no início
    console.log('[Contacts] Solicitando permissões...');
    const hasPermission = await requestContactsPermission();
    
    if (!hasPermission) {
      console.log('[Contacts] ❌ Permissão negada pelo usuário');
      Alert.alert(
        'Permissão Negada',
        'Sem permissão, não é possível salvar os contatos.\n\nVocê precisará fechar a janela do Android manualmente ao ligar.',
        [{ text: 'Entendi' }]
      );
      return 0;
    }

    console.log('[Contacts] ✅ Permissões concedidas! Salvando...');
    let savedCount = 0;

    // Salvar contatos rápidos (sem pedir permissão novamente)
    for (const contact of contacts) {
      if (contact.name && contact.phone) {
        const success = await saveContactToPhone(contact.name, contact.phone, true);
        if (success) savedCount++;
      }
    }

    // Salvar contatos SOS (sem pedir permissão novamente)
    for (const contact of sosContacts) {
      if (contact.name && contact.phone) {
        const success = await saveContactToPhone(`${contact.name} (SOS)`, contact.phone, true);
        if (success) savedCount++;
      }
    }

    console.log(`[Contacts] ✅ Total salvos: ${savedCount}/${contacts.length + sosContacts.length}`);
    return savedCount;
  } catch (error) {
    console.error('[Contacts] ❌ Erro geral:', error);
    Alert.alert('Erro', 'Não foi possível salvar os contatos: ' + error.message);
    return 0;
  }
};


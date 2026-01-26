import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Switch,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import SafeIcon from '../../components/SafeIcon';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import colors from '../../constants/colors';
import emergencyContactService from '../../services/emergencyContactService';
import groupService from '../../services/groupService';

const GroupContactsScreen = ({ route, navigation }) => {
  const { groupId } = route.params;
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // Agora temos apenas 3 contatos, cada um com toggle SOS
  const [contacts, setContacts] = useState([
    { id: null, name: '', phone: '+55', relationship: '', photo: null, photoUri: null, isSOS: false },
    { id: null, name: '', phone: '+55', relationship: '', photo: null, photoUri: null, isSOS: false },
    { id: null, name: '', phone: '+55', relationship: '', photo: null, photoUri: null, isSOS: false },
  ]);

  // Função para formatar telefone: +55(00)00000-0000
  const formatPhoneNumber = (text) => {
    if (!text) return '+55';
    
    console.log('📞 [GroupContacts] formatPhoneNumber - Entrada:', text);
    
    // Primeiro, remover TODA a formatação e extrair apenas os dígitos
    const allDigits = text.replace(/\D/g, '');
    
    console.log('📞 [GroupContacts] formatPhoneNumber - Dígitos extraídos:', allDigits);
    
    // Se não tiver dígitos, retornar +55
    if (allDigits.length === 0) {
      console.log('📞 [GroupContacts] formatPhoneNumber - Sem dígitos, retornando +55');
      return '+55';
    }
    
    // Remover código do país (55) se estiver presente
    // Pode ter múltiplos 55 no início se o telefone estava mal formatado
    let digits = allDigits;
    while (digits.startsWith('55') && digits.length > 11) {
      digits = digits.substring(2);
      console.log('📞 [GroupContacts] formatPhoneNumber - Removendo código do país 55, restante:', digits);
    }
    
    // Se ainda tiver mais de 11 dígitos após remover 55, pegar os últimos 11
    if (digits.length > 11) {
      digits = digits.slice(-11);
      console.log('📞 [GroupContacts] formatPhoneNumber - Limitando a 11 dígitos:', digits);
    }
    
    // Limitar a 11 dígitos (DDD de 2 dígitos + número de 9 dígitos)
    const limitedDigits = digits.slice(0, 11);
    
    console.log('📞 [GroupContacts] formatPhoneNumber - Dígitos finais:', limitedDigits, 'Tamanho:', limitedDigits.length);
    
    // Sempre começa com +55
    let formatted = '+55';
    
    if (limitedDigits.length > 0) {
      formatted += `(${limitedDigits.slice(0, 2)}`;
    }
    
    if (limitedDigits.length > 2) {
      formatted += `)${limitedDigits.slice(2, 7)}`;
    }
    
    if (limitedDigits.length > 7) {
      formatted += `-${limitedDigits.slice(7, 11)}`;
    }
    
    console.log('📞 [GroupContacts] formatPhoneNumber - Resultado formatado:', formatted);
    
    return formatted;
  };

  useFocusEffect(
    React.useCallback(() => {
      loadGroupContacts();
    }, [groupId])
  );

  const loadGroupContacts = async () => {
    try {
      setLoading(true);
      console.log('📞 [GroupContacts] Carregando contatos para grupo:', groupId);
      
      // Carregar informações do grupo
      const groupResponse = await groupService.getGroup(groupId);
      if (groupResponse?.success && groupResponse.data) {
        const group = groupResponse.data;
        console.log('✅ [GroupContacts] Grupo encontrado:', group.name);
        setGroupName(group.name);
      }
      
      // Carregar contatos de emergência da API
      const contactsResponse = await emergencyContactService.getEmergencyContacts(groupId);
      
      if (contactsResponse?.success && contactsResponse.data) {
        const apiContacts = Array.isArray(contactsResponse.data) ? contactsResponse.data : [];
        console.log('✅ [GroupContacts] Contatos carregados:', apiContacts.length);
        console.log('📋 [GroupContacts] Detalhes dos contatos da API:', apiContacts.map(c => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          phoneType: typeof c.phone,
          relationship: c.relationship,
          is_primary: c.is_primary,
          photo: c.photo,
          photo_url: c.photo_url
        })));
        
        // NOVA LÓGICA: Carregar os 3 primeiros contatos (sem separar em rápidos e SOS)
        // Cada contato terá um toggle isSOS baseado em relationship === 'SOS' ou is_primary === true
        // IMPORTANTE: Ordenar por ID para garantir ordem consistente
        const sortedContacts = [...apiContacts].sort((a, b) => (a.id || 0) - (b.id || 0));
        const allContacts = sortedContacts.slice(0, 3); // Pegar apenas os 3 primeiros
        
        console.log('📋 [GroupContacts] Contatos ordenados e selecionados:', allContacts.map(c => ({
          id: c.id,
          name: c.name,
          phone: c.phone
        })));
        
        // Função auxiliar para formatar telefone vindo da API
        const formatPhoneFromAPI = (phone) => {
          console.log('📞 [GroupContacts] formatPhoneFromAPI - Telefone recebido da API:', phone, 'Tipo:', typeof phone);
          
          if (!phone) {
            console.log('📞 [GroupContacts] formatPhoneFromAPI - Telefone vazio, retornando +55');
            return '+55';
          }
          
          // Converter para string se necessário
          const phoneStr = String(phone);
          
          // Usar a função formatPhoneNumber que já lida com formatação incorreta
          // Ela remove toda formatação e reconstrói corretamente
          const formatted = formatPhoneNumber(phoneStr);
          console.log('📞 [GroupContacts] formatPhoneFromAPI - Telefone formatado:', {
            original: phoneStr,
            formatted
          });
          return formatted;
        };
        
        // Função auxiliar para obter a URL da foto
        const getPhotoUri = (contact) => {
          // Priorizar photo_url (URL completa da API)
          if (contact?.photo_url) {
            console.log('📸 [GroupContacts] Foto encontrada (photo_url):', contact.photo_url);
            return contact.photo_url;
          }
          // Se não tiver photo_url, tentar usar photo se for uma URL completa
          if (contact?.photo) {
            // Se já for uma URL completa, usar diretamente
            if (contact.photo.startsWith('http://') || contact.photo.startsWith('https://')) {
              console.log('📸 [GroupContacts] Foto encontrada (photo como URL):', contact.photo);
              return contact.photo;
            }
            // Se for um caminho relativo, a API deveria ter retornado photo_url
            console.warn('⚠️ [GroupContacts] Foto encontrada mas sem photo_url:', contact.photo);
          }
          console.log('📸 [GroupContacts] Nenhuma foto encontrada para contato:', contact?.name);
          return null;
        };
        
        // Preencher os 3 contatos com toggle SOS
        const filledContacts = [
          allContacts[0] ? {
            ...allContacts[0], 
            phone: formatPhoneFromAPI(allContacts[0].phone), 
            photoUri: getPhotoUri(allContacts[0]), // Mapear photo_url para photoUri
            isSOS: allContacts[0].relationship === 'SOS' || 
                   allContacts[0].relationship === 'sos' || 
                   allContacts[0].is_primary === true
          } : { id: null, name: '', phone: '+55', relationship: '', photo: null, photoUri: null, isSOS: false },
          allContacts[1] ? {
            ...allContacts[1], 
            phone: formatPhoneFromAPI(allContacts[1].phone), 
            photoUri: getPhotoUri(allContacts[1]), // Mapear photo_url para photoUri
            isSOS: allContacts[1].relationship === 'SOS' || 
                   allContacts[1].relationship === 'sos' || 
                   allContacts[1].is_primary === true
          } : { id: null, name: '', phone: '+55', relationship: '', photo: null, photoUri: null, isSOS: false },
          allContacts[2] ? {
            ...allContacts[2], 
            phone: formatPhoneFromAPI(allContacts[2].phone), 
            photoUri: getPhotoUri(allContacts[2]), // Mapear photo_url para photoUri
            isSOS: allContacts[2].relationship === 'SOS' || 
                   allContacts[2].relationship === 'sos' || 
                   allContacts[2].is_primary === true
          } : { id: null, name: '', phone: '+55', relationship: '', photo: null, photoUri: null, isSOS: false },
        ];
        
        setContacts(filledContacts);
        
        console.log('✅ [GroupContacts] Contatos configurados:', {
          total: filledContacts.filter(c => c.name).length,
          contacts: filledContacts.map(c => ({
            name: c.name,
            phone: c.phone,
            phoneOriginal: allContacts.find(ac => ac.id === c.id)?.phone,
            isSOS: c.isSOS,
            hasPhoto: !!c.photoUri,
            photoUri: c.photoUri
          }))
        });
        
        // Log detalhado de cada contato
        filledContacts.forEach((contact, index) => {
          if (contact.name) {
            const originalContact = allContacts[index];
            console.log(`📋 [GroupContacts] Contato ${index + 1}:`, {
              name: contact.name,
              phoneOriginal: originalContact?.phone,
              phoneFormatted: contact.phone,
              id: contact.id
            });
          }
        });
      } else {
        console.log('ℹ️ [GroupContacts] Nenhum contato encontrado, usando padrão');
      }
    } catch (error) {
      // Se o erro for 403 (sem acesso ao grupo), limpar contatos e mostrar mensagem
      if (error.status === 403 || (error.message && error.message.includes('não tem acesso'))) {
        console.warn('⚠️ [GroupContacts] Usuário não tem acesso ao grupo, limpando contatos');
        setContacts([
          { id: null, name: '', phone: '+55', relationship: '', photo: null, photoUri: null, isSOS: false },
          { id: null, name: '', phone: '+55', relationship: '', photo: null, photoUri: null, isSOS: false },
          { id: null, name: '', phone: '+55', relationship: '', photo: null, photoUri: null, isSOS: false },
        ]);
        Toast.show({
          type: 'error',
          text1: 'Acesso Negado',
          text2: 'Você não tem mais acesso a este grupo',
        });
        navigation.goBack();
        return;
      }
      console.error('❌ [GroupContacts] Erro ao carregar contatos:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível carregar os contatos',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handler para mudança do campo telefone
  // PERMITE EDIÇÃO LIVRE - não formata durante a digitação
  // A formatação acontece apenas quando o campo perde o foco (onBlur)
  const handlePhoneChange = (text, index) => {
    console.log('📞 [GroupContacts] handlePhoneChange chamado:', { text, index, textLength: text?.length });
    
    // Permitir edição livre - apenas atualizar o valor sem formatar
    // A formatação será feita no onBlur
    updateContact(index, 'phone', text || '');
  };

  const updateContact = (index, field, value) => {
    console.log('🔄 [GroupContacts] updateContact chamado:', { index, field, value });
    setContacts(prev => {
      // Criar novo array para garantir que o React detecte a mudança
      const updated = prev.map((contact, idx) => {
        if (idx === index) {
          // Verificar se o valor realmente mudou
          if (contact[field] === value) {
            console.log('⚠️ [GroupContacts] Valor não mudou, mas atualizando mesmo assim:', { field, value });
      }
          const newContact = { ...contact, [field]: value };
          console.log('🔄 [GroupContacts] Contato atualizado:', { 
            index: idx, 
            field, 
            oldValue: contact[field], 
            newValue: value,
            fullContact: newContact 
          });
          return newContact;
        }
        return contact;
      });
      console.log('🔄 [GroupContacts] Estado atualizado, novo estado:', updated.map(c => ({ name: c.name, phone: c.phone })));
      return updated;
    });
  };

  // Função para toggle SOS
  const toggleSOS = (index) => {
    setContacts(prev => prev.map((contact, idx) => 
      idx === index ? { ...contact, isSOS: !contact.isSOS } : contact
    ));
  };

  // Handler para quando o campo de telefone perde o foco (onBlur)
  // Formata o telefone quando o usuário termina de editar
  const handlePhoneBlur = (index) => {
    const contact = contacts[index];
    if (!contact || !contact.phone) {
      // Se estiver vazio, definir +55
      updateContact(index, 'phone', '+55');
      return;
    }
    
    // Formatar o telefone quando o usuário terminar de editar
    const formatted = formatPhoneNumber(contact.phone);
    console.log('📞 [GroupContacts] handlePhoneBlur - Formatando telefone ao sair do campo:', {
      original: contact.phone,
      formatted
    });
    updateContact(index, 'phone', formatted);
  };

  // Função para selecionar foto de contato
  const pickImage = async (index) => {
    try {
      // Solicitar permissão
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permissão Necessária',
          'Precisamos de permissão para acessar suas fotos.'
        );
        return;
      }

      // Abrir seletor de imagens
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log('📸 [GroupContacts] Foto selecionada:', imageUri);
        
        // Atualizar o contato com a URI da foto
          setContacts(prev => prev.map((contact, idx) => 
            idx === index ? { ...contact, photoUri: imageUri } : contact
          ));
      }
    } catch (error) {
      console.error('❌ [GroupContacts] Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
    }
  };

  const validatePhoneNumber = (phone) => {
    if (!phone) {
      console.warn('⚠️ [GroupContacts] validatePhoneNumber: telefone vazio');
      return false;
    }
    // Remove formatação e valida se tem pelo menos 10 dígitos
    const cleaned = phone.replace(/\D/g, '');
    const isValid = cleaned.length >= 10;
    console.log('📞 [GroupContacts] validatePhoneNumber:', { 
      original: phone, 
      cleaned, 
      length: cleaned.length, 
      isValid 
    });
    return isValid;
  };


  const saveContacts = async () => {
    try {
      setSaving(true);
      
      // Validar que pelo menos um contato está preenchido
      const validContacts = contacts.filter(c => c.name && c.phone);
      
      if (validContacts.length === 0) {
        Alert.alert(
          'Contatos Incompletos',
          'Preencha pelo menos um contato com nome e telefone.'
        );
        setSaving(false);
        return;
      }

      // Validar números de telefone
      for (const contact of validContacts) {
        if (!validatePhoneNumber(contact.phone)) {
          Alert.alert(
            'Telefone Inválido',
            `O telefone de ${contact.name} está incompleto. Um número válido deve ter pelo menos 10 dígitos.`
          );
          setSaving(false);
          return;
        }
      }

      // Salvar na API
      console.log('💾 [GroupContacts] Salvando contatos na API...');
      console.log('💾 [GroupContacts] Contatos válidos:', validContacts.length);
      
      let successCount = 0;
      let errorCount = 0;
      
      // Salvar/atualizar todos os contatos (com toggle SOS)
      for (const contact of validContacts) {
        // Preparar FormData se houver foto NOVA (URI local)
        // Se photoUri for uma URL remota (http/https), não fazer upload novamente
        let contactData;
        const isSOS = contact.isSOS === true;
        
        // Verificar se photoUri é uma URL local (do dispositivo) ou remota (da API)
        const isLocalPhoto = contact.photoUri && 
                             !contact.photoUri.startsWith('http://') && 
                             !contact.photoUri.startsWith('https://');
        
        if (isLocalPhoto) {
          // Foto nova selecionada do dispositivo - fazer upload
          contactData = new FormData();
          contactData.append('group_id', groupId);
          contactData.append('name', contact.name);
          contactData.append('phone', contact.phone.replace(/\D/g, ''));
          contactData.append('relationship', isSOS ? 'SOS' : (contact.relationship || 'Contato'));
          contactData.append('is_primary', isSOS ? '1' : '0');
          
          // Adicionar foto
          const filename = contact.photoUri.split('/').pop();
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';
          
          contactData.append('photo', {
            uri: contact.photoUri,
            name: filename,
            type: type,
          });
          
          console.log('📸 [GroupContacts] Upload de foto nova incluído:', filename);
        } else {
          // Sem foto nova ou foto já existe no servidor - não enviar foto
          // IMPORTANTE: Limpar formatação do telefone mas garantir que tenha pelo menos 10 dígitos
          const cleanedPhone = contact.phone ? contact.phone.replace(/\D/g, '') : '';
          
          console.log('📞 [GroupContacts] Preparando dados para atualização (sem foto):', {
            name: contact.name,
            phoneOriginal: contact.phone,
            phoneCleaned: cleanedPhone,
            phoneLength: cleanedPhone.length,
            isSOS: isSOS
          });
          
          contactData = {
            group_id: groupId,
            name: contact.name,
            phone: cleanedPhone, // Remove formatação
            relationship: isSOS ? 'SOS' : (contact.relationship || 'Contato'),
            is_primary: isSOS,
          };
          
          if (contact.photoUri) {
            console.log('📸 [GroupContacts] Foto já existe no servidor, não reenviando:', contact.photoUri);
          } else {
            console.log('📸 [GroupContacts] Nenhuma foto para este contato');
          }
        }
        
        try {
          // Validar dados antes de enviar
          if (!contact.name || !contact.name.trim()) {
            errorCount++;
            console.error('❌ [GroupContacts] Nome do contato vazio:', contact);
            continue;
          }
          
          if (!contact.phone || !validatePhoneNumber(contact.phone)) {
            errorCount++;
            console.error('❌ [GroupContacts] Telefone inválido:', contact.name, contact.phone);
            continue;
          }
          
          console.log('📤 [GroupContacts] Enviando contato:', {
            id: contact.id,
            name: contact.name,
            phone: contact.phone,
            phoneCleaned: contact.phone.replace(/\D/g, ''),
            isSOS: isSOS,
            hasPhoto: !!contact.photoUri,
            contactData: contactData instanceof FormData ? 'FormData' : contactData
          });
          
          // Log detalhado do que será enviado
          if (contactData instanceof FormData) {
            console.log('📤 [GroupContacts] FormData será enviado (com foto)');
          } else {
            console.log('📤 [GroupContacts] JSON será enviado:', JSON.stringify(contactData, null, 2));
          }
          
          if (contact.id) {
            // Atualizar contato existente
            console.log('🔄 [GroupContacts] Atualizando contato existente:', {
              id: contact.id,
              name: contact.name,
              phone: contact.phone,
              phoneCleaned: contact.phone.replace(/\D/g, ''),
              contactData: contactData instanceof FormData ? 'FormData' : contactData
            });
            
            const result = await emergencyContactService.updateEmergencyContact(contact.id, contactData);
            
            if (result.success) {
              successCount++;
              console.log('✅ [GroupContacts] Contato atualizado com sucesso:', {
                name: contact.name,
                phone: contact.phone,
                response: result.data
              });
              
              // Verificar se o telefone foi atualizado na resposta
              if (result.data && result.data.phone) {
                console.log('✅ [GroupContacts] Telefone na resposta da API:', result.data.phone);
              } else {
                console.warn('⚠️ [GroupContacts] Telefone não encontrado na resposta da API');
              }
            } else {
              errorCount++;
              console.error('❌ [GroupContacts] Erro ao atualizar:', contact.name, result.error);
              console.error('❌ [GroupContacts] Dados que foram enviados:', contactData instanceof FormData ? 'FormData' : JSON.stringify(contactData, null, 2));
            }
          } else {
            // Criar novo contato
            const result = await emergencyContactService.createEmergencyContact(contactData);
            if (result.success) {
              successCount++;
              console.log('✅ [GroupContacts] Contato criado:', contact.name, isSOS ? '(SOS)' : '');
            } else {
              errorCount++;
              console.error('❌ [GroupContacts] Erro ao criar:', contact.name, result.error);
              console.error('❌ [GroupContacts] Dados enviados:', contactData instanceof FormData ? 'FormData' : JSON.stringify(contactData, null, 2));
            }
          }
        } catch (error) {
          errorCount++;
          console.error('❌ [GroupContacts] Erro ao salvar contato:', contact.name, error);
          console.error('❌ [GroupContacts] Stack trace:', error.stack);
        }
      }
      
      console.log(`✅ [GroupContacts] Salvamento concluído: ${successCount} sucesso, ${errorCount} erros`);
      
      if (successCount > 0) {
        Toast.show({
          type: 'success',
          text1: 'Contatos Salvos! ✅',
          text2: `${successCount} contato(s) salvo(s)${errorCount > 0 ? `, ${errorCount} erro(s)` : ''}`,
        });

        // Recarregar contatos antes de voltar para garantir que os dados estão atualizados
        console.log('🔄 [GroupContacts] Recarregando contatos após salvar...');
        await loadGroupContacts();

        // Aguardar um pouco e voltar
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Erro ao Salvar',
          text2: 'Não foi possível salvar nenhum contato',
        });
      }
    } catch (error) {
      console.error('❌ [GroupContacts] Erro ao salvar contatos:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível salvar os contatos',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <SafeIcon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Contatos do Grupo</Text>
          <Text style={styles.headerSubtitle}>{groupName}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando contatos...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Info Card */}
          <View style={styles.infoCard}>
            <SafeIcon name="information-circle" size={24} color={colors.info} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Configuração de Contatos</Text>
              <Text style={styles.infoText}>
                Configure os contatos que o paciente poderá ligar com um único toque.
              </Text>
            </View>
          </View>

          {/* Contatos Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <SafeIcon name="call" size={24} color={colors.primary} />
              <Text style={styles.sectionTitle}>Contatos (3)</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Configure até 3 contatos. Ative o toggle SOS para marcar como contato de emergência.
            </Text>

            {contacts.map((contact, index) => (
              <View 
                key={`contact-${contact.id || index}-${contact.name || 'empty'}`} 
                style={[
                  styles.contactCard,
                  contact.isSOS && styles.sosContactCard
                ]}
              >
                <View style={styles.contactHeader}>
                  <View style={[
                    styles.contactNumber,
                    contact.isSOS && styles.sosContactNumber
                  ]}>
                    {contact.isSOS ? (
                      <SafeIcon name="alert-circle" size={16} color={colors.textWhite} />
                    ) : (
                    <Text style={styles.contactNumberText}>{index + 1}</Text>
                    )}
                  </View>
                  <Text style={styles.contactLabel}>
                    Contato {index + 1}
                  </Text>
                  {/* Toggle SOS */}
                  <View style={styles.sosToggleContainer}>
                    <Text style={styles.sosToggleLabel}>SOS</Text>
                    <Switch
                      value={contact.isSOS}
                      onValueChange={() => toggleSOS(index)}
                      trackColor={{ false: colors.gray300, true: colors.error + '80' }}
                      thumbColor={contact.isSOS ? colors.error : colors.white}
                      ios_backgroundColor={colors.gray300}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Nome</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: João Silva"
                    placeholderTextColor={colors.placeholder}
                    value={contact.name}
                    onChangeText={(text) => updateContact(index, 'name', text)}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Telefone</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="+55(00)00000-0000"
                    placeholderTextColor={colors.placeholder}
                    value={contact.phone || '+55'}
                    onChangeText={(text) => {
                      console.log('📱 [GroupContacts] TextInput onChangeText:', { text, index, currentValue: contact.phone });
                      handlePhoneChange(text, index);
                    }}
                    onBlur={() => {
                      console.log('📱 [GroupContacts] TextInput onBlur:', { index });
                      handlePhoneBlur(index);
                    }}
                    keyboardType="phone-pad"
                    editable={!saving}
                  />
                  <Text style={styles.hint}>
                    Formato: +55(DDD)XXXXX-XXXX (11 dígitos)
                  </Text>
                </View>

                {/* Foto do Contato */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Foto (Opcional)</Text>
                  <TouchableOpacity 
                    style={styles.photoButton}
                    onPress={() => pickImage(index)}
                  >
                    {contact.photoUri || contact.photo ? (
                      <Image 
                        source={{ uri: contact.photoUri || contact.photo }} 
                        style={styles.photoPreview}
                      />
                    ) : (
                      <View style={styles.photoPlaceholder}>
                        <SafeIcon name="camera" size={32} color={colors.textLight} />
                        <Text style={styles.photoPlaceholderText}>Adicionar Foto</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {/* Save Button */}
          <TouchableOpacity 
            style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
            onPress={saveContacts}
            disabled={saving}
          >
            {saving ? (
              <>
                <ActivityIndicator size="small" color={colors.textWhite} />
                <Text style={styles.saveButtonText}>Salvando...</Text>
              </>
            ) : (
              <>
                <SafeIcon name="checkmark-circle" size={24} color={colors.textWhite} />
                <Text style={styles.saveButtonText}>Salvar Contatos</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textLight,
  },
  content: {
    flex: 1,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.info + '20',
    padding: 16,
    margin: 20,
    borderRadius: 12,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.info,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 16,
  },
  contactCard: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sosContactCard: {
    borderColor: colors.error + '40',
    backgroundColor: colors.error + '05',
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
    justifyContent: 'space-between',
  },
  sosToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 'auto',
  },
  sosToggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  contactNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosContactNumber: {
    backgroundColor: colors.error,
  },
  contactNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textWhite,
  },
  contactLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  hint: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
    fontStyle: 'italic',
  },
  photoButton: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
  },
  photoPlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.textLight,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textWhite,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
});

export default GroupContactsScreen;


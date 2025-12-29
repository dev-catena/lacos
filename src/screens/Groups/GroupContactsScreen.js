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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
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
  const [contacts, setContacts] = useState([
    { id: null, name: '', phone: '+55', relationship: '', photo: null, photoUri: null, isSOS: false },
    { id: null, name: '', phone: '+55', relationship: '', photo: null, photoUri: null, isSOS: false },
    { id: null, name: '', phone: '+55', relationship: '', photo: null, photoUri: null, isSOS: false },
  ]);
  const [sosContacts, setSosContacts] = useState([
    { id: null, name: '', phone: '+55', relationship: 'SOS', photo: null, photoUri: null },
    { id: null, name: '', phone: '+55', relationship: 'SOS', photo: null, photoUri: null },
  ]);

  // Função para formatar telefone: +55(00)00000-0000
  const formatPhoneNumber = (text) => {
    // Se o texto não começar com +55, garantir que comece
    let cleanText = text;
    if (!text || !text.startsWith('+55')) {
      // Se não começar com +55, adicionar
      const digits = text ? text.replace(/\D/g, '') : '';
      cleanText = '+55' + digits;
    }
    
    // Remove o +55 temporariamente para processar apenas os dígitos
    const digitsOnly = cleanText.replace(/\+55/g, '').replace(/\D/g, '');
    
    // Limita a 11 dígitos (DDD + número)
    const limitedDigits = digitsOnly.slice(0, 11);
    
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
        
        // Separar contatos rápidos e SOS
        const quickContacts = apiContacts.filter(c => c.relationship !== 'SOS').slice(0, 3);
        const sosContactsList = apiContacts.filter(c => c.relationship === 'SOS').slice(0, 2);
        
        // Função auxiliar para formatar telefone vindo da API
        const formatPhoneFromAPI = (phone) => {
          if (!phone) return '+55';
          // Se já começar com +55, formatar normalmente
          if (phone.startsWith('+55')) {
            return formatPhoneNumber(phone);
          }
          // Se não começar com +55, adicionar
          const digits = phone.replace(/\D/g, '');
          return formatPhoneNumber('+55' + digits);
        };
        
        // Preencher contatos rápidos (sempre 3 slots)
        const filledQuickContacts = [
          quickContacts[0] ? {...quickContacts[0], phone: formatPhoneFromAPI(quickContacts[0].phone), photoUri: null} : { id: null, name: '', phone: '+55', relationship: '', photo: null, photoUri: null, isSOS: false },
          quickContacts[1] ? {...quickContacts[1], phone: formatPhoneFromAPI(quickContacts[1].phone), photoUri: null} : { id: null, name: '', phone: '+55', relationship: '', photo: null, photoUri: null, isSOS: false },
          quickContacts[2] ? {...quickContacts[2], phone: formatPhoneFromAPI(quickContacts[2].phone), photoUri: null} : { id: null, name: '', phone: '+55', relationship: '', photo: null, photoUri: null, isSOS: false },
        ];
        
        // Preencher contatos SOS (sempre 2 slots)
        const filledSosContacts = [
          sosContactsList[0] ? {...sosContactsList[0], phone: formatPhoneFromAPI(sosContactsList[0].phone), photoUri: null} : { id: null, name: '', phone: '+55', relationship: 'SOS', photo: null, photoUri: null },
          sosContactsList[1] ? {...sosContactsList[1], phone: formatPhoneFromAPI(sosContactsList[1].phone), photoUri: null} : { id: null, name: '', phone: '+55', relationship: 'SOS', photo: null, photoUri: null },
        ];
        
        setContacts(filledQuickContacts);
        setSosContacts(filledSosContacts);
        
        console.log('✅ [GroupContacts] Contatos configurados:', {
          quick: filledQuickContacts.length,
          sos: filledSosContacts.length
        });
      } else {
        console.log('ℹ️ [GroupContacts] Nenhum contato encontrado, usando padrão');
      }
    } catch (error) {
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
  const handlePhoneChange = (text, index, isSOS = false) => {
    // Se o texto estiver vazio ou não começar com +55, garantir +55
    if (!text || text.length === 0) {
      if (isSOS) {
        updateSOSContact(index, 'phone', '+55');
      } else {
        updateContact(index, 'phone', '+55');
      }
      return;
    }
    
    // Se o usuário tentar apagar o +55, restaurar
    if (!text.startsWith('+55')) {
      // Se não começar com +55, adicionar +55 e formatar
      const digits = text.replace(/\D/g, '');
      const formatted = formatPhoneNumber('+55' + digits);
      if (isSOS) {
        updateSOSContact(index, 'phone', formatted);
      } else {
        updateContact(index, 'phone', formatted);
      }
      return;
    }
    
    // Formatar o telefone mantendo o +55
    const formatted = formatPhoneNumber(text);
    if (isSOS) {
      updateSOSContact(index, 'phone', formatted);
    } else {
      updateContact(index, 'phone', formatted);
    }
  };

  const updateContact = (index, field, value) => {
    setContacts(prev => prev.map((contact, idx) => 
      idx === index ? { ...contact, [field]: value } : contact
    ));
  };

  const updateSOSContact = (index, field, value) => {
    setSosContacts(prev => prev.map((contact, idx) => 
      idx === index ? { ...contact, [field]: value } : contact
    ));
  };

  // Função para selecionar foto de contato
  const pickImage = async (index, isSOSContact = false) => {
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
        if (isSOSContact) {
          setSosContacts(prev => prev.map((contact, idx) => 
            idx === index ? { ...contact, photoUri: imageUri } : contact
          ));
        } else {
          setContacts(prev => prev.map((contact, idx) => 
            idx === index ? { ...contact, photoUri: imageUri } : contact
          ));
        }
      }
    } catch (error) {
      console.error('❌ [GroupContacts] Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
    }
  };

  const validatePhoneNumber = (phone) => {
    // Remove formatação e valida se tem pelo menos 10 dígitos
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10;
  };


  const saveContacts = async () => {
    try {
      setSaving(true);
      
      // Validar que pelo menos um contato rápido está preenchido
      const validQuickContacts = contacts.filter(c => c.name && c.phone);
      
      if (validQuickContacts.length === 0) {
        Alert.alert(
          'Contatos Incompletos',
          'Preencha pelo menos um contato rápido com nome e telefone.'
        );
        setSaving(false);
        return;
      }

      // Validar números de telefone
      for (const contact of validQuickContacts) {
        if (!validatePhoneNumber(contact.phone)) {
          Alert.alert(
            'Telefone Inválido',
            `O telefone de ${contact.name} está incompleto. Um número válido deve ter pelo menos 10 dígitos.`
          );
          setSaving(false);
          return;
        }
      }

      // Validar contatos SOS
      const validSOSContacts = sosContacts.filter(c => c.name && c.phone);
      for (const contact of validSOSContacts) {
        if (!validatePhoneNumber(contact.phone)) {
          Alert.alert(
            'Telefone SOS Inválido',
            `O telefone SOS de ${contact.name} está incompleto.`
          );
          setSaving(false);
          return;
        }
      }

      // Salvar na API
      console.log('💾 [GroupContacts] Salvando contatos na API...');
      console.log('💾 [GroupContacts] Quick Contacts válidos:', validQuickContacts.length);
      console.log('💾 [GroupContacts] SOS Contacts válidos:', validSOSContacts.length);
      
      let successCount = 0;
      let errorCount = 0;
      
      // Salvar/atualizar contatos rápidos
      for (const contact of validQuickContacts) {
        // Preparar FormData se houver foto
        let contactData;
        if (contact.photoUri) {
          contactData = new FormData();
          contactData.append('group_id', groupId);
          contactData.append('name', contact.name);
          contactData.append('phone', contact.phone.replace(/\D/g, ''));
          contactData.append('relationship', contact.relationship || 'Contato Rápido');
          contactData.append('is_primary', '0');
          
          // Adicionar foto
          const filename = contact.photoUri.split('/').pop();
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';
          
          contactData.append('photo', {
            uri: contact.photoUri,
            name: filename,
            type: type,
          });
          
          console.log('📸 [GroupContacts] Upload de foto incluído:', filename);
        } else {
          contactData = {
            group_id: groupId,
            name: contact.name,
            phone: contact.phone.replace(/\D/g, ''), // Remove formatação
            relationship: contact.relationship || 'Contato Rápido',
            is_primary: false,
          };
        }
        
        try {
          if (contact.id) {
            // Atualizar contato existente
            const result = await emergencyContactService.updateEmergencyContact(contact.id, contactData);
            if (result.success) {
              successCount++;
              console.log('✅ [GroupContacts] Contato atualizado:', contact.name);
            } else {
              errorCount++;
              console.error('❌ [GroupContacts] Erro ao atualizar:', contact.name, result.error);
            }
          } else {
            // Criar novo contato
            const result = await emergencyContactService.createEmergencyContact(contactData);
            if (result.success) {
              successCount++;
              console.log('✅ [GroupContacts] Contato criado:', contact.name);
            } else {
              errorCount++;
              console.error('❌ [GroupContacts] Erro ao criar:', contact.name, result.error);
            }
          }
        } catch (error) {
          errorCount++;
          console.error('❌ [GroupContacts] Erro ao salvar contato:', contact.name, error);
        }
      }
      
      // Salvar/atualizar contatos SOS
      for (const contact of validSOSContacts) {
        // Preparar FormData se houver foto
        let contactData;
        if (contact.photoUri) {
          contactData = new FormData();
          contactData.append('group_id', groupId);
          contactData.append('name', contact.name);
          contactData.append('phone', contact.phone.replace(/\D/g, ''));
          contactData.append('relationship', 'SOS');
          contactData.append('is_primary', '1');
          
          // Adicionar foto
          const filename = contact.photoUri.split('/').pop();
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';
          
          contactData.append('photo', {
            uri: contact.photoUri,
            name: filename,
            type: type,
          });
          
          console.log('📸 [GroupContacts] Upload de foto SOS incluído:', filename);
        } else {
          contactData = {
            group_id: groupId,
            name: contact.name,
            phone: contact.phone.replace(/\D/g, ''), // Remove formatação
            relationship: 'SOS',
            is_primary: true,
          };
        }
        
        try {
          if (contact.id) {
            // Atualizar contato existente
            const result = await emergencyContactService.updateEmergencyContact(contact.id, contactData);
            if (result.success) {
              successCount++;
              console.log('✅ [GroupContacts] Contato SOS atualizado:', contact.name);
            } else {
              errorCount++;
              console.error('❌ [GroupContacts] Erro ao atualizar SOS:', contact.name, result.error);
            }
          } else {
            // Criar novo contato
            const result = await emergencyContactService.createEmergencyContact(contactData);
            if (result.success) {
              successCount++;
              console.log('✅ [GroupContacts] Contato SOS criado:', contact.name);
            } else {
              errorCount++;
              console.error('❌ [GroupContacts] Erro ao criar SOS:', contact.name, result.error);
            }
          }
        } catch (error) {
          errorCount++;
          console.error('❌ [GroupContacts] Erro ao salvar contato SOS:', contact.name, error);
        }
      }
      
      console.log(`✅ [GroupContacts] Salvamento concluído: ${successCount} sucesso, ${errorCount} erros`);
      
      if (successCount > 0) {
        Toast.show({
          type: 'success',
          text1: 'Contatos Salvos! ✅',
          text2: `${successCount} contato(s) salvo(s)${errorCount > 0 ? `, ${errorCount} erro(s)` : ''}`,
        });

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
          <Ionicons name="arrow-back" size={24} color={colors.text} />
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
            <Ionicons name="information-circle" size={24} color={colors.info} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Configuração de Contatos</Text>
              <Text style={styles.infoText}>
                Configure os contatos que o paciente poderá ligar com um único toque.
              </Text>
            </View>
          </View>

          {/* Quick Contacts Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="call" size={24} color={colors.primary} />
              <Text style={styles.sectionTitle}>Contatos Rápidos (3)</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Configure até 3 contatos para ligação rápida
            </Text>

            {contacts.map((contact, index) => (
              <View key={`quick-${index}`} style={styles.contactCard}>
                <View style={styles.contactHeader}>
                  <View style={styles.contactNumber}>
                    <Text style={styles.contactNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.contactLabel}>Contato {index + 1}</Text>
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
                    onChangeText={(text) => handlePhoneChange(text, index, false)}
                    keyboardType="phone-pad"
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
                    onPress={() => pickImage(index, false)}
                  >
                    {contact.photoUri || contact.photo ? (
                      <Image 
                        source={{ uri: contact.photoUri || contact.photo }} 
                        style={styles.photoPreview}
                      />
                    ) : (
                      <View style={styles.photoPlaceholder}>
                        <Ionicons name="camera" size={32} color={colors.textLight} />
                        <Text style={styles.photoPlaceholderText}>Adicionar Foto</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {/* SOS Contacts Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="alert-circle" size={24} color={colors.error} />
              <Text style={styles.sectionTitle}>Contatos SOS</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Contatos que serão chamados em caso de emergência
            </Text>

            {sosContacts.map((contact, index) => (
              <View key={`sos-${index}`} style={[styles.contactCard, styles.sosContactCard]}>
                <View style={styles.contactHeader}>
                  <View style={[styles.contactNumber, styles.sosContactNumber]}>
                    <Ionicons name="alert" size={16} color={colors.textWhite} />
                  </View>
                  <Text style={styles.contactLabel}>SOS {index + 1}</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Nome</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: Maria Santos"
                    placeholderTextColor={colors.placeholder}
                    value={contact.name}
                    onChangeText={(text) => updateSOSContact(index, 'name', text)}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Telefone</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="+55(00)00000-0000"
                    placeholderTextColor={colors.placeholder}
                    value={contact.phone || '+55'}
                    onChangeText={(text) => handlePhoneChange(text, index, true)}
                    keyboardType="phone-pad"
                  />
                  <Text style={styles.hint}>
                    Formato: +55(DDD)XXXXX-XXXX (11 dígitos)
                  </Text>
                </View>

                {/* Foto do Contato SOS */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Foto (Opcional)</Text>
                  <TouchableOpacity 
                    style={styles.photoButton}
                    onPress={() => pickImage(index, true)}
                  >
                    {contact.photoUri || contact.photo ? (
                      <Image 
                        source={{ uri: contact.photoUri || contact.photo }} 
                        style={styles.photoPreview}
                      />
                    ) : (
                      <View style={styles.photoPlaceholder}>
                        <Ionicons name="camera" size={32} color={colors.textLight} />
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
                <Ionicons name="checkmark-circle" size={24} color={colors.textWhite} />
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


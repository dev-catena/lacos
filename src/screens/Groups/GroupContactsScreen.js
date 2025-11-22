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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import colors from '../../constants/colors';

const GROUPS_STORAGE_KEY = '@lacos_groups';

const GroupContactsScreen = ({ route, navigation }) => {
  const { groupId } = route.params;
  const [groupName, setGroupName] = useState('');
  const [contacts, setContacts] = useState([
    { id: '1', name: '', phone: '', isSOS: false },
    { id: '2', name: '', phone: '', isSOS: false },
    { id: '3', name: '', phone: '', isSOS: false },
  ]);
  const [sosContacts, setSosContacts] = useState([
    { id: 'sos1', name: '', phone: '' },
    { id: 'sos2', name: '', phone: '' },
  ]);

  useFocusEffect(
    React.useCallback(() => {
      loadGroupContacts();
    }, [groupId])
  );

  const loadGroupContacts = async () => {
    try {
      console.log('[GroupContacts] Carregando contatos para grupo:', groupId);
      const groupsJson = await AsyncStorage.getItem(GROUPS_STORAGE_KEY);
      
      if (groupsJson) {
        const groups = JSON.parse(groupsJson);
        console.log('[GroupContacts] Total de grupos encontrados:', groups.length);
        
        const group = groups.find(g => g.id === groupId);
        
        if (group) {
          console.log('[GroupContacts] Grupo encontrado:', group.groupName);
          console.log('[GroupContacts] Quick Contacts:', group.quickContacts);
          console.log('[GroupContacts] SOS Contacts:', group.sosContacts);
          
          setGroupName(group.groupName);
          
          // Carregar contatos existentes
          if (group.quickContacts && group.quickContacts.length > 0) {
            console.log('[GroupContacts] Carregando', group.quickContacts.length, 'contatos rápidos');
            setContacts(group.quickContacts);
          } else {
            console.log('[GroupContacts] Nenhum contato rápido salvo, usando padrão');
            // Resetar para o padrão se não houver contatos salvos
            setContacts([
              { id: '1', name: '', phone: '' },
              { id: '2', name: '', phone: '' },
              { id: '3', name: '', phone: '' },
            ]);
          }
          
          if (group.sosContacts && group.sosContacts.length > 0) {
            console.log('[GroupContacts] Carregando', group.sosContacts.length, 'contatos SOS');
            setSosContacts(group.sosContacts);
          } else {
            console.log('[GroupContacts] Nenhum contato SOS salvo, usando padrão');
            setSosContacts([
              { id: 'sos1', name: '', phone: '' },
              { id: 'sos2', name: '', phone: '' },
            ]);
          }
        } else {
          console.error('[GroupContacts] Grupo não encontrado com ID:', groupId);
        }
      } else {
        console.warn('[GroupContacts] Nenhum grupo encontrado no AsyncStorage');
      }
    } catch (error) {
      console.error('[GroupContacts] Erro ao carregar contatos:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível carregar os contatos',
      });
    }
  };

  const formatPhoneNumber = (text) => {
    // Remove tudo que não é número
    const cleaned = text.replace(/\D/g, '');
    
    // Formata: +55 (11) 99999-9999
    if (cleaned.length <= 2) {
      return `+${cleaned}`;
    } else if (cleaned.length <= 4) {
      return `+${cleaned.slice(0, 2)} (${cleaned.slice(2)}`;
    } else if (cleaned.length <= 9) {
      return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4)}`;
    } else {
      return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9, 13)}`;
    }
  };

  const updateContact = (id, field, value) => {
    setContacts(prev => prev.map(contact => 
      contact.id === id ? { ...contact, [field]: field === 'phone' ? formatPhoneNumber(value) : value } : contact
    ));
  };

  const updateSOSContact = (id, field, value) => {
    setSosContacts(prev => prev.map(contact => 
      contact.id === id ? { ...contact, [field]: field === 'phone' ? formatPhoneNumber(value) : value } : contact
    ));
  };

  const validatePhoneNumber = (phone) => {
    // Remove formatação e valida se tem pelo menos 10 dígitos
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10;
  };

  const showDebugInfo = async () => {
    try {
      const groupsJson = await AsyncStorage.getItem(GROUPS_STORAGE_KEY);
      if (groupsJson) {
        const groups = JSON.parse(groupsJson);
        const group = groups.find(g => g.id === groupId);
        
        if (group) {
          const quickCount = group.quickContacts?.length || 0;
          const sosCount = group.sosContacts?.length || 0;
          const quickNames = group.quickContacts?.map(c => c.name).join(', ') || 'Nenhum';
          const sosNames = group.sosContacts?.map(c => c.name).join(', ') || 'Nenhum';
          
          Alert.alert(
            'Debug - Dados Salvos',
            `Grupo: ${group.groupName}\n\n` +
            `Contatos Rápidos (${quickCount}):\n${quickNames}\n\n` +
            `Contatos SOS (${sosCount}):\n${sosNames}\n\n` +
            `Última atualização:\n${group.contactsUpdatedAt ? new Date(group.contactsUpdatedAt).toLocaleString('pt-BR') : 'Nunca'}`,
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('Debug', 'Grupo não encontrado');
        }
      } else {
        Alert.alert('Debug', 'Nenhum dado no AsyncStorage');
      }
    } catch (error) {
      Alert.alert('Erro', error.message);
    }
  };

  const saveContacts = async () => {
    try {
      // Validar que pelo menos um contato rápido está preenchido
      const validQuickContacts = contacts.filter(c => c.name && c.phone);
      
      if (validQuickContacts.length === 0) {
        Alert.alert(
          'Contatos Incompletos',
          'Preencha pelo menos um contato rápido com nome e telefone.'
        );
        return;
      }

      // Validar números de telefone
      for (const contact of validQuickContacts) {
        if (!validatePhoneNumber(contact.phone)) {
          Alert.alert(
            'Telefone Inválido',
            `O telefone de ${contact.name} está incompleto. Um número válido deve ter pelo menos 10 dígitos.`
          );
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
          return;
        }
      }

      // Salvar no AsyncStorage
      console.log('[GroupContacts] Salvando contatos...');
      console.log('[GroupContacts] Quick Contacts válidos:', validQuickContacts);
      console.log('[GroupContacts] SOS Contacts válidos:', validSOSContacts);
      
      const groupsJson = await AsyncStorage.getItem(GROUPS_STORAGE_KEY);
      if (groupsJson) {
        const groups = JSON.parse(groupsJson);
        console.log('[GroupContacts] Grupos antes da atualização:', groups.length);
        
        const updatedGroups = groups.map(g => {
          if (g.id === groupId) {
            console.log('[GroupContacts] Atualizando grupo:', g.groupName);
            return {
              ...g,
              quickContacts: validQuickContacts,
              sosContacts: validSOSContacts,
              contactsUpdatedAt: new Date().toISOString(),
            };
          }
          return g;
        });

        console.log('[GroupContacts] Salvando no AsyncStorage...');
        await AsyncStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(updatedGroups));
        
        // Verificar se foi salvo corretamente
        const verifyJson = await AsyncStorage.getItem(GROUPS_STORAGE_KEY);
        const verifyGroups = JSON.parse(verifyJson);
        const verifyGroup = verifyGroups.find(g => g.id === groupId);
        console.log('[GroupContacts] Verificação - Contatos salvos:', {
          quickContacts: verifyGroup?.quickContacts?.length || 0,
          sosContacts: verifyGroup?.sosContacts?.length || 0,
        });

        Toast.show({
          type: 'success',
          text1: 'Contatos Salvos! ✅',
          text2: `${validQuickContacts.length} rápidos e ${validSOSContacts.length} SOS salvos`,
        });

        // Aguardar um pouco e voltar
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        console.error('[GroupContacts] Nenhum grupo encontrado para salvar');
        Toast.show({
          type: 'error',
          text1: 'Erro',
          text2: 'Nenhum grupo encontrado',
        });
      }
    } catch (error) {
      console.error('Erro ao salvar contatos:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível salvar os contatos',
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
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
        <TouchableOpacity onPress={showDebugInfo} style={styles.debugButton}>
          <Ionicons name="bug" size={20} color={colors.textLight} />
        </TouchableOpacity>
      </View>

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
            <View key={contact.id} style={styles.contactCard}>
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
                  onChangeText={(text) => updateContact(contact.id, 'name', text)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Telefone</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+55 (11) 99999-9999"
                  placeholderTextColor={colors.placeholder}
                  value={contact.phone}
                  onChangeText={(text) => updateContact(contact.id, 'phone', text)}
                  keyboardType="phone-pad"
                />
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
            <View key={contact.id} style={[styles.contactCard, styles.sosContactCard]}>
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
                  onChangeText={(text) => updateSOSContact(contact.id, 'name', text)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Telefone</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+55 (11) 99999-9999"
                  placeholderTextColor={colors.placeholder}
                  value={contact.phone}
                  onChangeText={(text) => updateSOSContact(contact.id, 'phone', text)}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          ))}
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={saveContacts}>
          <Ionicons name="checkmark-circle" size={24} color={colors.textWhite} />
          <Text style={styles.saveButtonText}>Salvar Contatos</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  debugButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
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
});

export default GroupContactsScreen;


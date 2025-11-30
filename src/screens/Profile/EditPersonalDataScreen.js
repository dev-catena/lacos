import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import colors from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import userService from '../../services/userService';

const EditPersonalDataScreen = ({ navigation }) => {
  const { user, updateUser } = useAuth();
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    lastName: user?.lastName || user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    cpf: user?.cpf || '',
    birthDate: user?.birthDate || user?.birth_date || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    zipCode: user?.zipCode || user?.zip_code || '',
  });

  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    // Validações básicas
    if (!formData.name.trim()) {
      Alert.alert('Erro', 'Nome é obrigatório');
      return;
    }

    if (!formData.email.trim()) {
      Alert.alert('Erro', 'E-mail é obrigatório');
      return;
    }

    setLoading(true);

    try {
      console.log('💾 Salvando dados do usuário...');
      
      // Preparar dados para envio (usar snake_case para o backend)
      const dataToUpdate = {
        name: formData.name.trim(),
        email: formData.email.trim(),
      };

      // Adicionar campos opcionais apenas se preenchidos
      if (formData.phone) dataToUpdate.phone = formData.phone;
      if (formData.cpf) dataToUpdate.cpf = formData.cpf;
      if (formData.birthDate) dataToUpdate.birth_date = formData.birthDate;
      if (formData.address) dataToUpdate.address = formData.address;
      if (formData.city) dataToUpdate.city = formData.city;
      if (formData.state) dataToUpdate.state = formData.state;
      if (formData.zipCode) dataToUpdate.zip_code = formData.zipCode;

      // Enviar para API
      const response = await userService.updateUserData(user.id, dataToUpdate);
      
      console.log('📥 Resposta da API:', response);

      if (response.success && response.data) {
        // Atualizar contexto com novos dados
        if (updateUser) {
          updateUser(response.data);
        }
        
        Toast.show({
          type: 'success',
          text1: '✅ Dados atualizados',
          text2: 'Suas informações foram salvas com sucesso',
          position: 'bottom',
        });

        setTimeout(() => {
          navigation.goBack();
        }, 1000);
      } else {
        throw new Error(response.error || 'Erro ao atualizar dados');
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar dados:', error);
      Alert.alert('Erro', error.message || 'Não foi possível atualizar os dados');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Dados Pessoais</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Informações Básicas */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informações Básicas</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nome *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color={colors.gray400} />
                <TextInput
                  style={styles.input}
                  placeholder="Seu nome"
                  value={formData.name}
                  onChangeText={(value) => updateField('name', value)}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Sobrenome</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color={colors.gray400} />
                <TextInput
                  style={styles.input}
                  placeholder="Seu sobrenome"
                  value={formData.lastName}
                  onChangeText={(value) => updateField('lastName', value)}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>E-mail *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color={colors.gray400} />
                <TextInput
                  style={styles.input}
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChangeText={(value) => updateField('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Telefone</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="call-outline" size={20} color={colors.gray400} />
                <TextInput
                  style={styles.input}
                  placeholder="(11) 99999-9999"
                  value={formData.phone}
                  onChangeText={(value) => updateField('phone', value)}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>CPF</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="card-outline" size={20} color={colors.gray400} />
                <TextInput
                  style={styles.input}
                  placeholder="000.000.000-00"
                  value={formData.cpf}
                  onChangeText={(value) => updateField('cpf', value)}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Data de Nascimento</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="calendar-outline" size={20} color={colors.gray400} />
                <TextInput
                  style={styles.input}
                  placeholder="DD/MM/AAAA"
                  value={formData.birthDate}
                  onChangeText={(value) => updateField('birthDate', value)}
                  keyboardType="number-pad"
                />
              </View>
            </View>
          </View>

          {/* Endereço */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Endereço</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>CEP</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="location-outline" size={20} color={colors.gray400} />
                <TextInput
                  style={styles.input}
                  placeholder="00000-000"
                  value={formData.zipCode}
                  onChangeText={(value) => updateField('zipCode', value)}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Endereço</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="home-outline" size={20} color={colors.gray400} />
                <TextInput
                  style={styles.input}
                  placeholder="Rua, número, complemento"
                  value={formData.address}
                  onChangeText={(value) => updateField('address', value)}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputContainer, { flex: 2 }]}>
                <Text style={styles.label}>Cidade</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Cidade"
                    value={formData.city}
                    onChangeText={(value) => updateField('city', value)}
                  />
                </View>
              </View>

              <View style={[styles.inputContainer, { flex: 1 }]}>
                <Text style={styles.label}>UF</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="SP"
                    value={formData.state}
                    onChangeText={(value) => updateField('state', value)}
                    maxLength={2}
                    autoCapitalize="characters"
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Botão Salvar */}
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            <Ionicons name="checkmark-circle" size={24} color={colors.textWhite} />
            <Text style={styles.saveButtonText}>
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
  placeholder: {
    width: 40,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    minHeight: 52,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: colors.success,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EditPersonalDataScreen;


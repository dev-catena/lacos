import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import colors from '../../constants/colors';
import groupMemberService from '../../services/groupMemberService';
import apiService from '../../services/apiService';
import Toast from 'react-native-toast-message';
import {
  formatDateInputBR,
  formatDateToBR,
  isValidBirthDateBR,
  birthDateBRToISO,
} from '../../utils/dateInputMask';

const PATIENT_ROLES = ['patient', 'priority_contact', 'accompanied'];

const EditPatientDataScreen = ({ route, navigation }) => {
  const { groupId, groupName } = route.params || {};
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Dados do paciente
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('female');
  const [bloodType, setBloodType] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [chronicDiseases, setChronicDiseases] = useState('');
  const [allergies, setAllergies] = useState('');
  const [patientUserId, setPatientUserId] = useState(null);
  const [patientPhoto, setPatientPhoto] = useState(null);
  const [newPhoto, setNewPhoto] = useState(null);

  const findPatientMember = (members) => {
    for (const role of PATIENT_ROLES) {
      const member = members.find((m) => m.role === role);
      if (member?.user) return member;
    }
    return null;
  };

  // Formatar telefone: +55(00)00000-0000 com limite de 11 dígitos (DDD + número)
  const formatPhoneBR = (text) => {
    // Garantir que sempre exista +55 no início
    let cleanText = text || '';
    if (!cleanText.startsWith('+55')) {
      const digits = cleanText.replace(/\D/g, '');
      // remove 55 duplicado se usuário colar número com 55
      const without55 = digits.startsWith('55') ? digits.slice(2) : digits;
      cleanText = '+55' + without55;
    }

    // Processar apenas dígitos após +55
    const digitsOnly = cleanText.replace(/\+55/g, '').replace(/\D/g, '');
    const limited = digitsOnly.slice(0, 11); // DDD(2) + número(9)

    let formatted = '+55';
    if (limited.length > 0) {
      formatted += `(${limited.slice(0, 2)}`;
    }
    if (limited.length > 2) {
      formatted += `)${limited.slice(2, 7)}`;
    }
    if (limited.length > 7) {
      formatted += `-${limited.slice(7, 11)}`;
    }
    return formatted;
  };

  const handlePhoneChange = (text) => {
    // Se tentar apagar tudo, manter +55 fixo
    if (!text || text.length === 0) {
      setPhone('+55');
      return;
    }
    // Se o usuário tentar apagar o +55, restaura e formata
    if (!text.startsWith('+55')) {
      const digits = text.replace(/\D/g, '');
      setPhone(formatPhoneBR('+55' + digits));
      return;
    }
    setPhone(formatPhoneBR(text));
  };

  useEffect(() => {
    loadPatientData();
  }, []);

  const loadPatientData = async () => {
    try {
      setLoading(true);
      
      // Buscar membros do grupo
      const membersResult = await groupMemberService.getGroupMembers(groupId);
      
      if (membersResult.success && membersResult.data) {
        const members = membersResult.data;
        
        // Encontrar o paciente (patient, priority_contact ou accompanied)
        const patientMember = findPatientMember(members);
        
        if (patientMember && patientMember.user) {
          const patient = patientMember.user;
          
          console.log('👤 Dados do paciente:', patient);
          
          // Extrair nome e sobrenome
          const fullName = patient.name || '';
          const nameParts = fullName.trim().split(' ');
          const first = nameParts[0] || '';
          const last = nameParts.slice(1).join(' ') || '';
          
          setPatientUserId(patient.id);
          setFirstName(first);
          setLastName(last);
          setEmail(patient.email || '');
          // Normalizar para o padrão +55(00)00000-0000
          setPhone(formatPhoneBR(patient.phone || '+55'));
          setCpf(patient.cpf || '');
          setPatientPhoto(patient.photo_url || null);
          
          // Dados adicionais (se existirem na API)
          if (patient.gender) setGender(patient.gender);
          if (patient.blood_type) setBloodType(patient.blood_type);
          if (patient.birth_date) {
            setBirthDate(formatDateToBR(patient.birth_date));
          }
          // Sempre definir os campos, mesmo se vazios
          setChronicDiseases(patient.chronic_diseases || '');
          setAllergies(patient.allergies || '');
          
          console.log('📋 Doenças crônicas carregadas:', patient.chronic_diseases || '(vazio)');
          console.log('📋 Alergias carregadas:', patient.allergies || '(vazio)');
        } else {
          Alert.alert('Aviso', 'Nenhum paciente encontrado neste grupo');
          navigation.goBack();
        }
      } else {
        Alert.alert('Erro', 'Não foi possível carregar os membros do grupo');
      }
    } catch (error) {
      console.error('Erro ao carregar dados do paciente:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados do paciente');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validações
    if (!firstName.trim()) {
      Alert.alert('Atenção', 'Por favor, informe o nome do paciente');
      return;
    }

    if (!lastName.trim()) {
      Alert.alert('Atenção', 'Por favor, informe o sobrenome do paciente');
      return;
    }

    if (!patientUserId) {
      Alert.alert('Erro', 'ID do paciente não encontrado');
      return;
    }

    const trimmedBirthDate = birthDate.trim();
    let birthDateISO = null;
    if (trimmedBirthDate) {
      if (!isValidBirthDateBR(trimmedBirthDate)) {
        Alert.alert('Atenção', 'Data de nascimento inválida. Use o formato dd/mm/aaaa');
        return;
      }
      birthDateISO = birthDateBRToISO(trimmedBirthDate);
    }

    try {
      setSaving(true);

      // Se houver nova foto, enviar via FormData
      if (newPhoto) {
        const formData = new FormData();
        formData.append('name', `${firstName.trim()} ${lastName.trim()}`);
        formData.append('email', email.trim());
        formData.append('phone', phone.trim());
        formData.append('cpf', cpf ? cpf.replace(/\D/g, '') : '');
        formData.append('gender', gender);
        if (bloodType.trim()) {
          formData.append('blood_type', bloodType.trim());
        }
        if (birthDateISO) {
          formData.append('birth_date', birthDateISO);
        }
        formData.append('chronic_diseases', chronicDiseases ? chronicDiseases.trim() : '');
        formData.append('allergies', allergies ? allergies.trim() : '');

        const filename = newPhoto.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('photo', {
          uri: newPhoto,
          name: filename,
          type: type,
        });

        console.log('📤 Enviando dados com foto do paciente...');
        console.log('📋 Doenças crônicas enviadas:', chronicDiseases ? chronicDiseases.trim() : '(vazio)');
        console.log('📋 Alergias enviadas:', allergies ? allergies.trim() : '(vazio)');
        const response = await apiService.put(`/users/${patientUserId}`, formData);

        if (response) {
          Toast.show({
            type: 'success',
            text1: 'Sucesso!',
            text2: 'Dados e foto do paciente atualizados',
          });
          navigation.goBack();
        }
      } else {
        // Sem foto nova, envia apenas os dados
        const userData = {
          name: `${firstName.trim()} ${lastName.trim()}`,
          email: email.trim(),
          phone: phone.trim(),
          cpf: cpf ? cpf.replace(/\D/g, '') : '',
          gender: gender,
          chronic_diseases: chronicDiseases ? chronicDiseases.trim() : '',
          allergies: allergies ? allergies.trim() : '',
        };

        if (bloodType.trim()) {
          userData.blood_type = bloodType.trim();
        }
        if (birthDateISO) {
          userData.birth_date = birthDateISO;
        }

        console.log('💾 Atualizando usuário:', patientUserId, userData);
        console.log('📋 Doenças crônicas enviadas:', chronicDiseases ? chronicDiseases.trim() : '(vazio)');
        console.log('📋 Alergias enviadas:', allergies ? allergies.trim() : '(vazio)');
        
        const response = await apiService.put(`/users/${patientUserId}`, userData);

        if (response) {
          Toast.show({
            type: 'success',
            text1: 'Sucesso!',
            text2: 'Dados do paciente atualizados',
          });
          navigation.goBack();
        }
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      
      let errorMessage = 'Não foi possível atualizar os dados do paciente';
      if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Erro', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const pickPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permissão Necessária',
          'Precisamos de permissão para acessar suas fotos.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setNewPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem');
    }
  };

  const removePhoto = () => {
    Alert.alert(
      'Remover Foto',
      'Deseja remover a foto do paciente?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => {
            setNewPhoto(null);
            setPatientPhoto(null);
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Dados do Paciente</Text>
          <Text style={styles.headerSubtitle}>{groupName}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Foto do Paciente */}
        <View style={styles.photoSection}>
          <Text style={styles.sectionTitle}>Foto do Paciente</Text>
          
          {(newPhoto || patientPhoto) ? (
            <View style={styles.photoContainer}>
              <Image 
                source={{ uri: newPhoto || patientPhoto }} 
                style={styles.patientPhoto}
              />
              <View style={styles.photoActions}>
                <TouchableOpacity
                  style={styles.photoActionButton}
                  onPress={pickPhoto}
                  activeOpacity={0.7}
                >
                  <Ionicons name="camera" size={20} color={colors.primary} />
                  <Text style={styles.photoActionText}>Trocar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.photoActionButton, styles.photoRemoveButton]}
                  onPress={removePhoto}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                  <Text style={[styles.photoActionText, { color: colors.error }]}>Remover</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addPhotoButton}
              onPress={pickPhoto}
              activeOpacity={0.7}
            >
              <Ionicons name="person-add" size={48} color={colors.secondary} />
              <Text style={styles.addPhotoText}>Adicionar Foto</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Nome */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações Pessoais</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome *</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Nome do paciente"
              placeholderTextColor={colors.gray400}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Sobrenome *</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Sobrenome do paciente"
              placeholderTextColor={colors.gray400}
            />
          </View>

          {/* Data de Nascimento */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Data de Nascimento</Text>
            <TextInput
              style={styles.input}
              value={birthDate}
              onChangeText={(text) => setBirthDate(formatDateInputBR(text))}
              placeholder="dd/mm/aaaa"
              placeholderTextColor={colors.gray400}
              keyboardType="numeric"
              maxLength={10}
            />
          </View>

          {/* Sexo */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Sexo</Text>
            <View style={styles.genderContainer}>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  gender === 'female' && styles.genderButtonActive,
                ]}
                onPress={() => setGender('female')}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="female"
                  size={24}
                  color={gender === 'female' ? colors.textWhite : colors.text}
                />
                <Text
                  style={[
                    styles.genderButtonText,
                    gender === 'female' && styles.genderButtonTextActive,
                  ]}
                >
                  Feminino
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.genderButton,
                  gender === 'male' && styles.genderButtonActive,
                ]}
                onPress={() => setGender('male')}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="male"
                  size={24}
                  color={gender === 'male' ? colors.textWhite : colors.text}
                />
                <Text
                  style={[
                    styles.genderButtonText,
                    gender === 'male' && styles.genderButtonTextActive,
                  ]}
                >
                  Masculino
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Informações de Saúde */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações de Saúde</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tipo Sanguíneo</Text>
            <TextInput
              style={styles.input}
              value={bloodType}
              onChangeText={setBloodType}
              placeholder="Ex: A+, O-, AB+"
              placeholderTextColor={colors.gray400}
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Doenças Crônicas</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={chronicDiseases}
              onChangeText={setChronicDiseases}
              placeholder="Ex: Hipertensão, Diabetes tipo 2, Artrite reumatoide"
              placeholderTextColor={colors.gray400}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Alergias</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={allergies}
              onChangeText={setAllergies}
              placeholder="Ex: Penicilina, Dipirona, Amendoim"
              placeholderTextColor={colors.gray400}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Contato */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações de Contato</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Telefone</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={handlePhoneChange}
              placeholder="+55(00)00000-0000"
              placeholderTextColor={colors.gray400}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="email@exemplo.com"
              placeholderTextColor={colors.gray400}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>CPF</Text>
            <TextInput
              style={styles.input}
              value={cpf}
              onChangeText={(text) => {
                // Remove tudo que não é número
                const numbers = text.replace(/\D/g, '');
                // Limita a 11 dígitos
                const limited = numbers.slice(0, 11);
                // Formata: 000.000.000-00
                let formatted = limited;
                if (limited.length > 6) {
                  formatted = `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6, 9)}-${limited.slice(9)}`;
                } else if (limited.length > 3) {
                  formatted = `${limited.slice(0, 3)}.${limited.slice(3)}`;
                }
                setCpf(formatted);
              }}
              placeholder="000.000.000-00"
              placeholderTextColor={colors.gray400}
              keyboardType="numeric"
              maxLength={14}
            />
          </View>
        </View>

        {/* Botão Salvar */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color={colors.textWhite} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color={colors.textWhite} />
              <Text style={styles.saveButtonText}>Salvar Alterações</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: colors.border,
    gap: 8,
  },
  genderButtonActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  genderButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  genderButtonTextActive: {
    color: colors.textWhite,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 8,
    marginBottom: 32,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textWhite,
  },
  // Estilos da foto
  photoSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  photoContainer: {
    alignItems: 'center',
  },
  patientPhoto: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.gray200,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: colors.secondary,
  },
  photoActions: {
    flexDirection: 'row',
    gap: 12,
  },
  photoActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 6,
  },
  photoRemoveButton: {
    borderColor: colors.error,
  },
  photoActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  addPhotoButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.backgroundLight,
    borderWidth: 3,
    borderColor: colors.secondary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.secondary,
    marginTop: 8,
  },
});

export default EditPatientDataScreen;


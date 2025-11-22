import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../../constants/colors';
import { ElderlyIcon, InviteCodeIcon } from '../../components/CustomIcons';

const GROUPS_STORAGE_KEY = '@lacos_groups';

const CreateGroupScreen = ({ navigation }) => {
  const [step, setStep] = useState(1); // 1: Dados do acompanhado, 2: Dados do grupo
  const [loading, setLoading] = useState(false);
  
  // Dados do Acompanhado
  const [accompaniedData, setAccompaniedData] = useState({
    name: '',
    lastName: '',
    birthDate: '',
    gender: '',
    bloodType: '',
    phone: '',
    email: '',
  });

  // Dados do Grupo
  const [groupData, setGroupData] = useState({
    groupName: '',
    description: '',
    generateCode: true,
  });

  const [generatedCode, setGeneratedCode] = useState('');

  const handleNext = () => {
    // Validações do Step 1
    if (step === 1) {
      if (!accompaniedData.name || !accompaniedData.birthDate || !accompaniedData.gender) {
        Alert.alert('Erro', 'Preencha os campos obrigatórios');
        return;
      }
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    } else {
      navigation.goBack();
    }
  };

  const handleCreateGroup = async () => {
    if (!groupData.groupName) {
      Alert.alert('Erro', 'Digite um nome para o grupo');
      return;
    }

    setLoading(true);

    try {
      // Gerar código único
      const mockCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      setGeneratedCode(mockCode);

      // Criar objeto do grupo
      const newGroup = {
        id: Date.now().toString(), // ID único baseado em timestamp
        groupName: groupData.groupName,
        description: groupData.description,
        code: mockCode,
        accompaniedName: `${accompaniedData.name}${accompaniedData.lastName ? ' ' + accompaniedData.lastName : ''}`,
        accompaniedData: accompaniedData,
        createdAt: new Date().toISOString(),
        members: 1,
        medications: 0,
        appointments: 0,
      };

      // Carregar grupos existentes
      const groupsJson = await AsyncStorage.getItem(GROUPS_STORAGE_KEY);
      const existingGroups = groupsJson ? JSON.parse(groupsJson) : [];

      // Adicionar novo grupo
      const updatedGroups = [...existingGroups, newGroup];

      // Salvar no AsyncStorage
      await AsyncStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(updatedGroups));

      console.log('Grupo criado:', newGroup);
      console.log('Código gerado:', mockCode);
      console.log('Todos os grupos salvos:', updatedGroups);

      Alert.alert(
        'Sucesso! 🎉',
        `Grupo "${groupData.groupName}" criado com sucesso!\n\n` +
        `Acompanhado: ${accompaniedData.name}\n` +
        `Código de pareamento: ${mockCode}\n\n` +
        `Use este código para o paciente acessar o aplicativo.\n` +
        `Vá em Configurações do grupo para ver o código novamente.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Erro', error.message || 'Erro ao criar grupo');
    } finally {
      setLoading(false);
    }
  };

  const updateAccompaniedField = (field, value) => {
    setAccompaniedData(prev => ({ ...prev, [field]: value }));
  };

  const updateGroupField = (field, value) => {
    setGroupData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {step === 1 ? 'Dados do Acompanhado' : 'Dados do Grupo'}
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressStep, step >= 1 && styles.progressStepActive]}>
            <View style={[styles.progressCircle, step >= 1 && styles.progressCircleActive]}>
              <Text style={[styles.progressNumber, step >= 1 && styles.progressNumberActive]}>1</Text>
            </View>
            <Text style={[styles.progressLabel, step >= 1 && styles.progressLabelActive]}>
              Acompanhado
            </Text>
          </View>
          <View style={[styles.progressLine, step >= 2 && styles.progressLineActive]} />
          <View style={[styles.progressStep, step >= 2 && styles.progressStepActive]}>
            <View style={[styles.progressCircle, step >= 2 && styles.progressCircleActive]}>
              <Text style={[styles.progressNumber, step >= 2 && styles.progressNumberActive]}>2</Text>
            </View>
            <Text style={[styles.progressLabel, step >= 2 && styles.progressLabelActive]}>
              Grupo
            </Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
          {step === 1 ? (
            // STEP 1: Dados do Acompanhado
            <View style={styles.content}>
              <View style={styles.iconContainer}>
                <ElderlyIcon size={48} color={colors.primary} />
              </View>

              <Text style={styles.title}>Quem você vai acompanhar?</Text>
              <Text style={styles.subtitle}>
                Informe os dados da pessoa que será acompanhada neste grupo
              </Text>

              {/* Nome */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  Nome <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={20} color={colors.gray400} />
                  <TextInput
                    style={styles.input}
                    placeholder="Nome da pessoa"
                    value={accompaniedData.name}
                    onChangeText={(value) => updateAccompaniedField('name', value)}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* Sobrenome */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Sobrenome</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={20} color={colors.gray400} />
                  <TextInput
                    style={styles.input}
                    placeholder="Sobrenome"
                    value={accompaniedData.lastName}
                    onChangeText={(value) => updateAccompaniedField('lastName', value)}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* Data de Nascimento */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  Data de Nascimento <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="calendar-outline" size={20} color={colors.gray400} />
                  <TextInput
                    style={styles.input}
                    placeholder="DD/MM/AAAA"
                    value={accompaniedData.birthDate}
                    onChangeText={(value) => updateAccompaniedField('birthDate', value)}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Sexo */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  Sexo <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.genderContainer}>
                  {['masculino', 'feminino', 'outro'].map((gender) => (
                    <TouchableOpacity
                      key={gender}
                      style={[
                        styles.genderButton,
                        accompaniedData.gender === gender && styles.genderButtonActive,
                      ]}
                      onPress={() => updateAccompaniedField('gender', gender)}
                    >
                      <Text
                        style={[
                          styles.genderButtonText,
                          accompaniedData.gender === gender && styles.genderButtonTextActive,
                        ]}
                      >
                        {gender.charAt(0).toUpperCase() + gender.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Tipo Sanguíneo */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Tipo Sanguíneo</Text>
                <View style={styles.bloodTypeContainer}>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.bloodTypeButton,
                        accompaniedData.bloodType === type && styles.bloodTypeButtonActive,
                      ]}
                      onPress={() => updateAccompaniedField('bloodType', type)}
                    >
                      <Text
                        style={[
                          styles.bloodTypeButtonText,
                          accompaniedData.bloodType === type && styles.bloodTypeButtonTextActive,
                        ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Telefone */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Telefone</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="call-outline" size={20} color={colors.gray400} />
                  <TextInput
                    style={styles.input}
                    placeholder="(11) 99999-9999"
                    value={accompaniedData.phone}
                    onChangeText={(value) => updateAccompaniedField('phone', value)}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              {/* Email */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>E-mail</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={20} color={colors.gray400} />
                  <TextInput
                    style={styles.input}
                    placeholder="email@exemplo.com"
                    value={accompaniedData.email}
                    onChangeText={(value) => updateAccompaniedField('email', value)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.nextButton}
                onPress={handleNext}
              >
                <Text style={styles.nextButtonText}>Próximo</Text>
                <Ionicons name="arrow-forward" size={20} color={colors.textWhite} />
              </TouchableOpacity>
            </View>
          ) : (
            // STEP 2: Dados do Grupo
            <View style={styles.content}>
              <View style={styles.iconContainer}>
                <InviteCodeIcon size={48} color={colors.secondary} />
              </View>

              <Text style={styles.title}>Configure o Grupo</Text>
              <Text style={styles.subtitle}>
                Defina um nome e gere o código para o aplicativo do acompanhado
              </Text>

              {/* Nome do Grupo */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  Nome do Grupo <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="people-outline" size={20} color={colors.gray400} />
                  <TextInput
                    style={styles.input}
                    placeholder={`Grupo de ${accompaniedData.name || 'Cuidados'}`}
                    value={groupData.groupName}
                    onChangeText={(value) => updateGroupField('groupName', value)}
                  />
                </View>
              </View>

              {/* Descrição */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Descrição (opcional)</Text>
                <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Descreva o propósito deste grupo..."
                    value={groupData.description}
                    onChangeText={(value) => updateGroupField('description', value)}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </View>

              {/* Info sobre código */}
              <View style={styles.infoCard}>
                <Ionicons name="information-circle" size={24} color={colors.info} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoTitle}>Código de Pareamento</Text>
                  <Text style={styles.infoText}>
                    Um código único será gerado para que o acompanhado possa instalar e conectar o aplicativo companion.
                  </Text>
                </View>
              </View>

              {/* Resumo */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Resumo</Text>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Acompanhado:</Text>
                  <Text style={styles.summaryValue}>
                    {accompaniedData.name} {accompaniedData.lastName}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Data de Nascimento:</Text>
                  <Text style={styles.summaryValue}>{accompaniedData.birthDate}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Sexo:</Text>
                  <Text style={styles.summaryValue}>
                    {accompaniedData.gender.charAt(0).toUpperCase() + accompaniedData.gender.slice(1)}
                  </Text>
                </View>
                {accompaniedData.bloodType && (
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Tipo Sanguíneo:</Text>
                    <Text style={styles.summaryValue}>{accompaniedData.bloodType}</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={[styles.createButton, loading && styles.createButtonDisabled]}
                onPress={handleCreateGroup}
                disabled={loading}
              >
                {loading ? (
                  <Text style={styles.createButtonText}>Criando grupo...</Text>
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color={colors.textWhite} />
                    <Text style={styles.createButtonText}>Criar Grupo</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 24,
    backgroundColor: colors.backgroundLight,
  },
  progressStep: {
    alignItems: 'center',
    flex: 1,
  },
  progressCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressCircleActive: {
    backgroundColor: colors.primary,
  },
  progressNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.gray400,
  },
  progressNumberActive: {
    color: colors.textWhite,
  },
  progressLabel: {
    fontSize: 12,
    color: colors.textLight,
  },
  progressLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  progressLine: {
    height: 2,
    backgroundColor: colors.gray200,
    width: 60,
    marginBottom: 28,
  },
  progressLineActive: {
    backgroundColor: colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  required: {
    color: colors.error,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    height: 52,
    gap: 12,
  },
  textAreaWrapper: {
    height: 100,
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    textAlignVertical: 'top',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundLight,
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  genderButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  genderButtonTextActive: {
    color: colors.textWhite,
  },
  bloodTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bloodTypeButton: {
    width: '22%',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundLight,
    alignItems: 'center',
  },
  bloodTypeButtonActive: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  bloodTypeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  bloodTypeButtonTextActive: {
    color: colors.textWhite,
  },
  nextButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  nextButtonText: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.info + '20',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
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
  summaryCard: {
    backgroundColor: colors.backgroundLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textLight,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  createButton: {
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
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CreateGroupScreen;


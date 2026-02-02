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
import colors from '../../constants/colors';
import { LacosLogoFull, LacosIcon } from '../../components/LacosLogo';
import { ElderlyIcon } from '../../components/CustomIcons';

const RegisterPatientScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    birthDate: '',
    gender: '',
    phone: '',
    email: '',
    password: '',
    passwordConfirmation: '',
    pairingCode: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const handleRegister = async () => {
    // Validações básicas
    if (!formData.name || !formData.birthDate || !formData.gender || !formData.password || !formData.pairingCode) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (formData.password !== formData.passwordConfirmation) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      // Converter gênero de português para inglês (quando API for implementada)
      const genderMap = {
        'masculino': 'male',
        'feminino': 'female',
        'outro': 'other'
      };
      const genderInEnglish = genderMap[formData.gender] || null;
      
      // TODO: Chamar API real
      // const registerData = {
      //   name: formData.name,
      //   birth_date: formData.birthDate,
      //   gender: genderInEnglish, // ← Usar gênero convertido
      //   phone: formData.phone,
      //   email: formData.email,
      //   password: formData.password,
      //   pairing_code: formData.pairingCode,
      // };
      // await apiService.post('/register-patient', registerData);
      
      Alert.alert(
        'Em Desenvolvimento',
        'Integração com API em desenvolvimento.\n\nDados enviados:\n' +
        `Nome: ${formData.name}\n` +
        `Gênero: ${formData.gender} → ${genderInEnglish}\n` +
        `Código: ${formData.pairingCode}`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Erro', error.message || 'Erro ao criar conta');
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <LacosLogoFull width={120} height={37} />
            <View style={styles.placeholder} />
          </View>

          {/* Ícone de Paciente */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <ElderlyIcon size={60} color={colors.primary} />
            </View>
          </View>

          {/* Título */}
          <Text style={styles.title}>Criar Conta como Paciente</Text>
          <Text style={styles.subtitle}>
            Conecte-se ao seu grupo de cuidadores usando o código fornecido
          </Text>

          {/* Formulário */}
          <View style={styles.form}>
            {/* Nome */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Nome completo <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color={colors.gray400} />
                <TextInput
                  style={styles.input}
                  placeholder="Seu nome"
                  value={formData.name}
                  onChangeText={(value) => updateField('name', value)}
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
                  value={formData.birthDate}
                  onChangeText={(value) => updateField('birthDate', value)}
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
                      formData.gender === gender && styles.genderButtonActive,
                    ]}
                    onPress={() => updateField('gender', gender)}
                  >
                    <Text
                      style={[
                        styles.genderButtonText,
                        formData.gender === gender && styles.genderButtonTextActive,
                      ]}
                    >
                      {gender.charAt(0).toUpperCase() + gender.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Telefone */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Telefone (opcional)</Text>
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

            {/* Email */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>E-mail (opcional)</Text>
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

            {/* Código de Pareamento */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Código de Pareamento <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="key-outline" size={20} color={colors.gray400} />
                <TextInput
                  style={styles.input}
                  placeholder="Digite o código fornecido"
                  value={formData.pairingCode}
                  onChangeText={(value) => updateField('pairingCode', value.toUpperCase())}
                  autoCapitalize="characters"
                  maxLength={8}
                />
              </View>
              <Text style={styles.hint}>
                O código foi fornecido pelo seu cuidador
              </Text>
            </View>

            {/* Senha */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Senha <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.gray400} />
                <TextInput
                  style={styles.input}
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChangeText={(value) => updateField('password', value)}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.gray400}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirmar Senha */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Confirmar Senha <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.gray400} />
                <TextInput
                  style={styles.input}
                  placeholder="Digite a senha novamente"
                  value={formData.passwordConfirmation}
                  onChangeText={(value) => updateField('passwordConfirmation', value)}
                  secureTextEntry={!showPasswordConfirm}
                />
                <TouchableOpacity onPress={() => setShowPasswordConfirm(!showPasswordConfirm)}>
                  <Ionicons
                    name={showPasswordConfirm ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.gray400}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Botão Cadastrar */}
            <TouchableOpacity
              style={[styles.registerButton, loading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <Text style={styles.registerButtonText}>Criando conta...</Text>
              ) : (
                <Text style={styles.registerButtonText}>Criar Conta</Text>
              )}
            </TouchableOpacity>

            {/* Link para Login */}
            <View style={styles.loginLinkContainer}>
              <Text style={styles.loginLinkText}>Já tem uma conta? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Entrar</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 40,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 40,
    lineHeight: 24,
  },
  form: {
    paddingHorizontal: 20,
    paddingBottom: 40,
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
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  hint: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
    marginLeft: 4,
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
  registerButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginLinkText: {
    fontSize: 14,
    color: colors.textLight,
  },
  loginLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
});

export default RegisterPatientScreen;


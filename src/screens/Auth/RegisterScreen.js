import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import colors from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { LacosLogoFull } from '../../components/LacosLogo';
import medicalSpecialtyService from '../../services/medicalSpecialtyService';
import { navigationRef } from '../../../App';

const RegisterScreen = ({ navigation }) => {
  const { signUp, clearRegistering, savedFormData, getSavedFormData, isRegistering } = useAuth();
  const scrollViewRef = React.useRef(null);
  const emailInputRef = React.useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    email: '',
    phone: '+55', // Inicializar com +55
    password: '',
    confirmPassword: '',
    profile: 'caregiver', // Padrão: Cuidador
    // Campos específicos de cuidador profissional
    gender: '',
    city: '',
    neighborhood: '',
    formation_details: '',
    hourly_rate: '',
    availability: '',
    // Campos específicos de médico
    crm: '',
    medical_specialty_id: null,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [specialties, setSpecialties] = useState([]);
  const [specialtyModalVisible, setSpecialtyModalVisible] = useState(false);
  const [loadingSpecialties, setLoadingSpecialties] = useState(false);
  const [selectedSpecialtyName, setSelectedSpecialtyName] = useState('');
  const [emailError, setEmailError] = useState('');

  // Restaurar dados salvos quando a tela recebe foco e há dados salvos
  useFocusEffect(
    useCallback(() => {
      const saved = getSavedFormData();
      if (saved && isRegistering) {
        console.log('📝 RegisterScreen - Restaurando dados salvos do formulário:', saved);
        // Restaurar TODOS os campos salvos, mantendo apenas senhas vazias
        setFormData(saved);
        setEmailError('Este email já está cadastrado. Use outro email ou faça login.');
        
        // Carregar especialidades se for médico (para restaurar o nome depois)
        if (saved.profile === 'doctor') {
          loadSpecialties();
        }
        
        // Focar no campo de email após restaurar
        setTimeout(() => {
          if (emailInputRef.current) {
            emailInputRef.current.focus();
          }
          if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({ y: 250, animated: true });
          }
        }, 300);
        
        // Mostrar Toast
        Toast.show({
          type: 'error',
          text1: 'Email já cadastrado',
          text2: 'Este email já está cadastrado. Use outro email ou faça login.',
          position: 'top',
          visibilityTime: 4000,
        });
      }
    }, [getSavedFormData, isRegistering])
  );

  // Debug: Monitorar mudanças no emailError
  useEffect(() => {
    console.log('📝 RegisterScreen - emailError mudou:', emailError);
    if (emailError) {
      console.log('📝 RegisterScreen - ✅ emailError está DEFINIDO, deve aparecer na tela');
    } else {
      console.log('📝 RegisterScreen - ⚠️ emailError está VAZIO');
    }
  }, [emailError]);

  // Limpar flag de registro quando sair da tela (mas NÃO quando há erro de email)
  useFocusEffect(
    useCallback(() => {
      console.log('📝 RegisterScreen - Tela recebeu foco');
      
      // Cleanup: limpar flag quando sair da tela
      // IMPORTANTE: Só limpar se não houver erro de email ativo
      return () => {
        console.log('📝 RegisterScreen - Tela perdeu foco');
        // Só limpar se não houver erro de email ativo
        if (!emailError) {
          console.log('📝 RegisterScreen - Sem erro de email, limpando isRegistering');
          clearRegistering();
        } else {
          console.log('📝 RegisterScreen - Erro de email ativo, MANTENDO isRegistering');
        }
      };
    }, [clearRegistering, emailError])
  );

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Função para formatar telefone: +55(00)00000-0000
  const formatPhone = (text) => {
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

  // Handler para mudança do campo telefone
  const handlePhoneChange = (text) => {
    // Se o texto estiver vazio ou não começar com +55, garantir +55
    if (!text || text.length === 0) {
      updateFormData('phone', '+55');
      return;
    }
    
    // Se o usuário tentar apagar o +55, restaurar
    if (!text.startsWith('+55')) {
      // Se não começar com +55, adicionar +55 e formatar
      const digits = text.replace(/\D/g, '');
      const formatted = formatPhone('+55' + digits);
      updateFormData('phone', formatted);
      return;
    }
    
    // Formatar o telefone mantendo o +55
    const formatted = formatPhone(text);
    updateFormData('phone', formatted);
  };

  // Carregar especialidades quando o perfil for médico
  useEffect(() => {
    if (formData.profile === 'doctor') {
      loadSpecialties();
    }
  }, [formData.profile]);

  const loadSpecialties = async () => {
    try {
      setLoadingSpecialties(true);
      const response = await medicalSpecialtyService.getSpecialties();
      console.log('📋 Resposta completa das especialidades:', JSON.stringify(response, null, 2));
      
      // O backend retorna {success: true, data: [...]}
      // O apiService retorna o JSON parseado diretamente
      let specialtiesData = [];
      
      if (response && response.success && response.data && Array.isArray(response.data)) {
        // Se vier com success e data como array
        specialtiesData = response.data;
        console.log('✅ Especialidades extraídas de response.success.data');
      } else if (response && Array.isArray(response)) {
        // Se vier como array direto
        specialtiesData = response;
        console.log('✅ Especialidades extraídas como array direto');
      } else if (response && response.data && Array.isArray(response.data)) {
        // Se vier com data como array (sem success)
        specialtiesData = response.data;
        console.log('✅ Especialidades extraídas de response.data');
      } else {
        console.log('⚠️ Formato de resposta não reconhecido:', typeof response, Object.keys(response || {}));
      }
      
      console.log('📋 Especialidades processadas:', specialtiesData.length);
      
      // Remover duplicatas por nome (caso o backend ainda retorne)
      const uniqueSpecialties = specialtiesData.reduce((acc, current) => {
        const existing = acc.find(item => item.name === current.name);
        if (!existing) {
          acc.push(current);
        }
        return acc;
      }, []);
      
      // Ordenar por nome
      uniqueSpecialties.sort((a, b) => a.name.localeCompare(b.name));
      
      if (uniqueSpecialties.length > 0) {
        console.log('📋 Primeira especialidade:', JSON.stringify(uniqueSpecialties[0], null, 2));
        console.log(`✅ Especialidades únicas: ${uniqueSpecialties.length} (após remover duplicatas)`);
      } else {
        console.log('❌ Nenhuma especialidade foi carregada!');
      }
      setSpecialties(uniqueSpecialties);
    } catch (error) {
      console.error('❌ Erro ao carregar especialidades:', error);
      setSpecialties([]);
    } finally {
      setLoadingSpecialties(false);
    }
  };

  // Atualizar nome da especialidade quando medical_specialty_id ou specialties mudarem
  useEffect(() => {
    if (!formData.medical_specialty_id) {
      setSelectedSpecialtyName('');
      return;
    }
    
    console.log('🔍 Buscando especialidade ID:', formData.medical_specialty_id, 'Tipo:', typeof formData.medical_specialty_id);
    console.log('📋 Total de especialidades carregadas:', specialties.length);
    
    if (specialties.length > 0) {
      console.log('📋 Primeiras 3 especialidades:', specialties.slice(0, 3).map(s => ({ id: s.id, idType: typeof s.id, name: s.name })));
    }
    
    // Comparar com conversão de tipo para garantir match (pode ser string ou número)
    const specialty = specialties.find(s => {
      return String(s.id) === String(formData.medical_specialty_id) || s.id === formData.medical_specialty_id;
    });
    
    if (specialty) {
      console.log('✅ Especialidade encontrada:', specialty.name);
      setSelectedSpecialtyName(specialty.name);
    } else {
      console.log('❌ Especialidade não encontrada para ID:', formData.medical_specialty_id);
      if (specialties.length > 0) {
        console.log('📋 IDs disponíveis:', specialties.map(s => s.id).slice(0, 10));
      }
      setSelectedSpecialtyName('');
    }
  }, [formData.medical_specialty_id, specialties]);

  const handleRegister = async () => {
    // 🧪 TESTE: Log bem visível para verificar se o código está sendo executado
    console.log('🧪🧪🧪 TESTE - handleRegister foi chamado! 🧪🧪🧪');
    console.log('🧪 TESTE - Dados do formulário:', { email: formData.email, profile: formData.profile });
    
    // Validações básicas
    if (!formData.name || !formData.lastName || !formData.email || !formData.password) {
      Alert.alert('Atenção', 'Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Atenção', 'As senhas não coincidem');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Atenção', 'A senha deve ter pelo menos 6 caracteres');
      return;
    }

    // Validações específicas para cuidador profissional
    if (formData.profile === 'professional_caregiver') {
      if (!formData.gender || !formData.city || !formData.neighborhood || 
          !formData.formation_details || !formData.hourly_rate || !formData.availability) {
        Alert.alert('Atenção', 'Por favor, preencha todos os campos obrigatórios do perfil profissional');
        return;
      }
    }

    // Validações específicas para médico
    if (formData.profile === 'doctor') {
      if (!formData.gender || !formData.city || !formData.neighborhood || 
          !formData.crm || !formData.medical_specialty_id) {
        Alert.alert('Atenção', 'Por favor, preencha todos os campos obrigatórios do perfil médico');
        return;
      }
    }

    setLoading(true);
    setEmailError(''); // Limpar erro anterior
    
    console.log('📝 RegisterScreen - Iniciando signUp com email:', formData.email);
    const result = await signUp(formData);
    setLoading(false);

    console.log('📝 RegisterScreen - Resultado completo do signUp:', JSON.stringify(result, null, 2));
    console.log('📝 RegisterScreen - result.success:', result.success);
    console.log('📝 RegisterScreen - result.error:', result.error);
    console.log('📝 RegisterScreen - result.isEmailError:', result.isEmailError);

    // TESTE: Verificar TODOS os casos de erro
    if (!result) {
      console.log('📝 RegisterScreen - ❌ RESULT É NULL/UNDEFINED');
      setEmailError('Erro desconhecido. Tente novamente.');
      return;
    }

    if (!result.success) {
      console.log('📝 RegisterScreen - ⚠️ ERRO DETECTADO - result.success é false');
      console.log('📝 RegisterScreen - result completo:', JSON.stringify(result, null, 2));
      
      // Verificar se é erro de email duplicado - usar flag do AuthContext ou detectar pela mensagem
      const errorText = (result?.error || result?.message || '').toLowerCase();
      console.log('📝 RegisterScreen - errorText extraído:', errorText);
      
      const isEmailError = result?.isEmailError === true || (
        errorText && (
          errorText.includes('email já está cadastrado') ||
          errorText.includes('email has already been taken') ||
          errorText.includes('email já existe') ||
          errorText.includes('the email has already been taken') ||
          errorText.includes('already been taken') ||
          (errorText.includes('email') && (errorText.includes('cadastrado') || errorText.includes('taken') || errorText.includes('já')))
        )
      );
      
      console.log('📝 RegisterScreen - É erro de email?', isEmailError);
      console.log('📝 RegisterScreen - errorText:', errorText);
      console.log('📝 RegisterScreen - isEmailError flag do result:', result?.isEmailError);
      console.log('📝 RegisterScreen - result.error:', result?.error);
      console.log('📝 RegisterScreen - result.message:', result?.message);
      
      if (isEmailError) {
        // Para erro de email, mostrar mensagem no campo e manter no formulário
        // NÃO mostrar Alert - apenas mensagem no campo para evitar qualquer redirecionamento
        const errorMessage = result.error || 'Este email já está cadastrado. Use outro email ou faça login.';
        
        console.log('📝 RegisterScreen - ✅ ERRO DE EMAIL DETECTADO!');
        console.log('📝 RegisterScreen - Definindo emailError:', errorMessage);
        
        setEmailError(errorMessage);
        
        console.log('📝 RegisterScreen - EmailError definido no estado:', errorMessage);
        console.log('📝 RegisterScreen - NÃO VAI REDIRECIONAR - retornando AGORA');
        console.log('📝 RegisterScreen - Usuário permanece no formulário para corrigir o email');
        console.log('📝 RegisterScreen - isRegistering será mantido no AuthContext para preservar navegação');
        console.log('📝 RegisterScreen - formData preservado:', { 
          name: formData.name, 
          email: formData.email,
          phone: formData.phone,
          profile: formData.profile 
        });
        
        // Mostrar Toast com a mensagem de erro
        Toast.show({
          type: 'error',
          text1: 'Email já cadastrado',
          text2: errorMessage,
          position: 'top',
          visibilityTime: 4000,
        });
        
        // NÃO fazer navegação forçada - isso causa remontagem e perde os dados!
        // O isRegistering já está mantendo o AuthNavigator, então não precisa navegar
        
        // Focar no campo de email e rolar até ele após um pequeno delay
        // Usar múltiplos timeouts para garantir que o componente está renderizado
        setTimeout(() => {
          console.log('📝 RegisterScreen - Tentativa 1: Focando no campo de email');
          if (emailInputRef.current) {
            emailInputRef.current.focus();
            console.log('📝 RegisterScreen - ✅ Campo de email recebeu foco (tentativa 1)');
          } else {
            console.log('📝 RegisterScreen - ⚠️ emailInputRef ainda não disponível (tentativa 1)');
          }
          
          // Rolar até o campo de email
          if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({ y: 250, animated: true });
            console.log('📝 RegisterScreen - Scroll executado para campo de email');
          }
        }, 500);
        
        // Segunda tentativa de foco (caso a primeira não funcione)
        setTimeout(() => {
          console.log('📝 RegisterScreen - Tentativa 2: Focando no campo de email');
          if (emailInputRef.current) {
            emailInputRef.current.focus();
            console.log('📝 RegisterScreen - ✅ Campo de email recebeu foco (tentativa 2)');
          }
        }, 1000);
        
        // IMPORTANTE: NÃO mostrar Alert para evitar qualquer interação que possa causar redirecionamento
        // A mensagem de erro já está sendo exibida abaixo do campo de email
        // Retornar IMEDIATAMENTE para não continuar o fluxo
        console.log('📝 RegisterScreen - ⛔ RETORNANDO AGORA - NÃO DEVE CONTINUAR');
        return; // Este return DEVE parar a execução aqui - usuário fica no formulário
      } else {
        // Para outros erros, mostrar alerta genérico
        console.log('📝 RegisterScreen - Erro não é de email, mostrando alerta genérico');
        Alert.alert('Erro', result.error || 'Não foi possível criar a conta');
        return; // Também retornar aqui para não continuar
      }
    } else if (result.success || result.requiresApproval) {
      // Cadastro bem-sucedido ou requer aprovação
      console.log('📝 RegisterScreen - Cadastro bem-sucedido ou requer aprovação');
      clearRegistering(); // Limpar flag de registro
      
      if (result.requiresApproval) {
        // Médico precisa de aprovação
        Alert.alert(
          'Cadastro Realizado',
          result.message || 'Seu processo está em análise. Acompanhe pelo seu email.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login'),
            },
          ]
        );
      } else {
        // Cadastro bem-sucedido (outros perfis)
        Alert.alert('Sucesso', 'Conta criada com sucesso!', [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'),
          },
        ]);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          ref={scrollViewRef}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.logoContainer}>
              <LacosLogoFull width={150} height={47} />
            </View>
            <Text style={styles.title}>Criar Conta</Text>
            <Text style={styles.subtitle}>
              Junte-se a nós e cuide de quem você ama
            </Text>
          </View>

          {/* Formulário */}
          <View style={styles.form}>
            <View style={styles.row}>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>Nome *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Seu nome"
                  placeholderTextColor={colors.placeholder}
                  value={formData.name}
                  onChangeText={(value) => updateFormData('name', value)}
                />
              </View>

              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>Sobrenome *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Seu sobrenome"
                  placeholderTextColor={colors.placeholder}
                  value={formData.lastName}
                  onChangeText={(value) => updateFormData('lastName', value)}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>E-mail *</Text>
              <TextInput
                ref={emailInputRef}
                style={[styles.input, emailError && styles.inputError]}
                placeholder="seu@email.com"
                placeholderTextColor={colors.placeholder}
                value={formData.email}
                onChangeText={(value) => {
                  updateFormData('email', value);
                  // Limpar erro quando o usuário começar a digitar
                  if (emailError) {
                    setEmailError('');
                    // Limpar flag de registro quando o usuário corrigir o email
                    // Isso permite que o RootNavigator funcione normalmente
                    console.log('📝 RegisterScreen - Email corrigido, limpando isRegistering');
                    clearRegistering();
                  }
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {emailError ? (
                <View style={{ marginTop: 4 }}>
                  <Text style={styles.errorText}>{emailError}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Celular (opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="+55(00)00000-0000"
                placeholderTextColor={colors.placeholder}
                value={formData.phone || '+55'}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
                // Não usar maxLength - a função formatPhone já limita a 11 dígitos
              />
              <Text style={styles.hint}>
                Formato: +55(DDD)XXXXX-XXXX (11 dígitos)
              </Text>
            </View>

            {/* Seletor de Perfil */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Qual é o seu perfil? *</Text>
              <View style={styles.profileSelector}>
                {/* Primeira linha */}
                <View style={styles.profileRow}>
                  <TouchableOpacity
                    style={[
                      styles.profileOption,
                      formData.profile === 'caregiver' && styles.profileOptionActive
                    ]}
                    onPress={() => updateFormData('profile', 'caregiver')}
                  >
                    <View style={[
                      styles.profileIconContainer,
                      formData.profile === 'caregiver' && styles.profileIconContainerActive
                    ]}>
                      <Ionicons
                        name="heart"
                        size={28}
                        color={formData.profile === 'caregiver' ? colors.white : colors.primary}
                      />
                    </View>
                    <Text style={[
                      styles.profileOptionTitle,
                      formData.profile === 'caregiver' && styles.profileOptionTitleActive
                    ]}>
                      Amigo/cuidador
                    </Text>
                    <Text style={[
                      styles.profileOptionDescription,
                      formData.profile === 'caregiver' && styles.profileOptionDescriptionActive
                    ]}>
                      Vou cuidar de alguém
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.profileOption,
                      formData.profile === 'accompanied' && styles.profileOptionActive
                    ]}
                    onPress={() => updateFormData('profile', 'accompanied')}
                  >
                    <View style={[
                      styles.profileIconContainer,
                      formData.profile === 'accompanied' && styles.profileIconContainerActive
                    ]}>
                      <Ionicons
                        name="person"
                        size={28}
                        color={formData.profile === 'accompanied' ? colors.white : colors.secondary}
                      />
                    </View>
                    <Text style={[
                      styles.profileOptionTitle,
                      formData.profile === 'accompanied' && styles.profileOptionTitleActive
                    ]}>
                      Sou Paciente
                    </Text>
                    <Text style={[
                      styles.profileOptionDescription,
                      formData.profile === 'accompanied' && styles.profileOptionDescriptionActive
                    ]}>
                      Vou ser acompanhado
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Segunda linha */}
                <View style={styles.profileRow}>
                  <TouchableOpacity
                    style={[
                      styles.profileOption,
                      formData.profile === 'professional_caregiver' && [
                        styles.profileOptionActive,
                        { borderColor: colors.success, backgroundColor: colors.success + '10' }
                      ]
                    ]}
                    onPress={() => updateFormData('profile', 'professional_caregiver')}
                  >
                    <View style={[
                      styles.profileIconContainer,
                      formData.profile === 'professional_caregiver' && [
                        styles.profileIconContainerActive,
                        { backgroundColor: colors.success }
                      ]
                    ]}>
                      <Ionicons
                        name="medical"
                        size={28}
                        color={formData.profile === 'professional_caregiver' ? colors.white : colors.success}
                      />
                    </View>
                    <Text style={[
                      styles.profileOptionTitle,
                      formData.profile === 'professional_caregiver' && [
                        styles.profileOptionTitleActive,
                        { color: colors.success }
                      ]
                    ]}>
                      Cuidador profissional
                    </Text>
                    <Text style={[
                      styles.profileOptionDescription,
                      formData.profile === 'professional_caregiver' && [
                        styles.profileOptionDescriptionActive,
                        { color: colors.success }
                      ]
                    ]}>
                      Profissional de saúde
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.profileOption,
                      formData.profile === 'doctor' && [
                        styles.profileOptionActive,
                        { borderColor: '#4A90E2', backgroundColor: '#4A90E2' + '10' }
                      ]
                    ]}
                    onPress={() => updateFormData('profile', 'doctor')}
                  >
                    <View style={[
                      styles.profileIconContainer,
                      formData.profile === 'doctor' && [
                        styles.profileIconContainerActive,
                        { backgroundColor: '#4A90E2' }
                      ]
                    ]}>
                      <Ionicons
                        name="medical-outline"
                        size={28}
                        color={formData.profile === 'doctor' ? colors.white : '#4A90E2'}
                      />
                    </View>
                    <Text style={[
                      styles.profileOptionTitle,
                      formData.profile === 'doctor' && [
                        styles.profileOptionTitleActive,
                        { color: '#4A90E2' }
                      ]
                    ]}>
                      Médico
                    </Text>
                    <Text style={[
                      styles.profileOptionDescription,
                      formData.profile === 'doctor' && [
                        styles.profileOptionDescriptionActive,
                        { color: '#4A90E2' }
                      ]
                    ]}>
                      Profissional médico
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Campos específicos para Cuidador Profissional e Médico */}
            {(formData.profile === 'professional_caregiver' || formData.profile === 'doctor') && (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Sexo *</Text>
                  <View style={styles.genderSelector}>
                    {['Masculino', 'Feminino'].map((gender) => (
                      <TouchableOpacity
                        key={gender}
                        style={[
                          styles.genderOption,
                          formData.gender === gender && styles.genderOptionActive,
                        ]}
                        onPress={() => updateFormData('gender', gender)}
                      >
                        <Text
                          style={[
                            styles.genderOptionText,
                            formData.gender === gender && styles.genderOptionTextActive,
                          ]}
                        >
                          {gender}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputContainer, styles.halfWidth]}>
                    <Text style={styles.label}>Cidade *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Ex: Belo Horizonte"
                      placeholderTextColor={colors.placeholder}
                      value={formData.city}
                      onChangeText={(value) => updateFormData('city', value)}
                    />
                  </View>

                  <View style={[styles.inputContainer, styles.halfWidth]}>
                    <Text style={styles.label}>Bairro *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Ex: Centro"
                      placeholderTextColor={colors.placeholder}
                      value={formData.neighborhood}
                      onChangeText={(value) => updateFormData('neighborhood', value)}
                    />
                  </View>
                </View>

                {/* Campos específicos para Cuidador Profissional */}
                {formData.profile === 'professional_caregiver' && (
                  <>
                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Formação *</Text>
                      <View style={styles.formationSelector}>
                        {['Cuidador', 'Auxiliar de enfermagem'].map((formation) => (
                          <TouchableOpacity
                            key={formation}
                            style={[
                              styles.formationOption,
                              formData.formation_details === formation && styles.formationOptionActive,
                            ]}
                            onPress={() => updateFormData('formation_details', formation)}
                          >
                            <Text
                              style={[
                                styles.formationOptionText,
                                formData.formation_details === formation && styles.formationOptionTextActive,
                              ]}
                            >
                              {formation}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Valor por hora (R$) *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Ex: 50.00"
                        placeholderTextColor={colors.placeholder}
                        value={formData.hourly_rate}
                        onChangeText={(value) => {
                          const cleaned = value.replace(/[^0-9.]/g, '');
                          updateFormData('hourly_rate', cleaned);
                        }}
                        keyboardType="decimal-pad"
                      />
                    </View>
                  </>
                )}

                {/* Campos específicos para Médico */}
                {formData.profile === 'doctor' && (
                  <>
                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>CRM *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Ex: CRM 123456"
                        placeholderTextColor={colors.placeholder}
                        value={formData.crm}
                        onChangeText={(value) => updateFormData('crm', value)}
                        autoCapitalize="characters"
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Especialidade *</Text>
                      <TouchableOpacity
                        style={styles.specialtySelector}
                        activeOpacity={0.7}
                        onPress={() => {
                          console.log('🔘 TouchableOpacity pressionado - Abrindo modal de especialidades');
                          console.log('📋 Especialidades carregadas:', specialties.length);
                          setSpecialtyModalVisible(true);
                        }}
                      >
                        <Text style={[
                          styles.specialtySelectorText,
                          !formData.medical_specialty_id && styles.specialtySelectorPlaceholder
                        ]}>
                          {selectedSpecialtyName || 'Selecione a especialidade'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color={colors.textLight} />
                      </TouchableOpacity>
                    </View>
                  </>
                )}

                {/* Campo Disponibilidade - apenas para cuidador profissional */}
                {formData.profile === 'professional_caregiver' && (
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Disponibilidade *</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="Ex: 24 horas ou Segunda a Sexta, 8h às 18h"
                      placeholderTextColor={colors.placeholder}
                      value={formData.availability}
                      onChangeText={(value) => updateFormData('availability', value)}
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                )}
              </>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Senha *</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor={colors.placeholder}
                  value={formData.password}
                  onChangeText={(value) => updateFormData('password', value)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={colors.gray400}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirmar Senha *</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Digite a senha novamente"
                  placeholderTextColor={colors.placeholder}
                  value={formData.confirmPassword}
                  onChangeText={(value) => updateFormData('confirmPassword', value)}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={colors.gray400}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.registerButton, loading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.registerButtonText}>
                {loading ? 'Criando conta...' : 'Criar Conta'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.termsText}>
              Ao criar uma conta, você concorda com nossos{' '}
              <Text style={styles.termsLink}>Termos de Uso</Text> e{' '}
              <Text style={styles.termsLink}>Política de Privacidade</Text>
            </Text>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Já tem uma conta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Entrar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Modal de Especialidades */}
        <Modal
          visible={specialtyModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => {
            console.log('🔘 Modal onRequestClose chamado');
            setSpecialtyModalVisible(false);
          }}
          onShow={() => {
            console.log('✅ Modal de especialidades foi exibido');
          }}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => {
              console.log('🔘 Overlay pressionado - Fechando modal');
              setSpecialtyModalVisible(false);
            }}
          >
            <TouchableOpacity
              style={styles.modalContent}
              activeOpacity={1}
              onPress={(e) => {
                // Prevenir que o toque no conteúdo feche o modal
                e.stopPropagation();
              }}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Selecione a Especialidade</Text>
                <TouchableOpacity
                  onPress={() => setSpecialtyModalVisible(false)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              {loadingSpecialties ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Carregando especialidades...</Text>
                </View>
              ) : (
                <View style={styles.flatListContainer}>
                  <FlatList
                    data={specialties}
                    keyExtractor={(item) => item.id.toString()}
                    style={styles.flatList}
                    contentContainerStyle={styles.flatListContent}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          styles.specialtyItem,
                          formData.medical_specialty_id === item.id && styles.specialtyItemSelected
                        ]}
                        onPress={() => {
                          console.log('✅ Especialidade selecionada:', item.id, item.name);
                          updateFormData('medical_specialty_id', item.id);
                          console.log('📝 medical_specialty_id atualizado para:', item.id);
                          setSpecialtyModalVisible(false);
                        }}
                      >
                        <Text style={[
                          styles.specialtyItemText,
                          formData.medical_specialty_id === item.id && styles.specialtyItemTextSelected
                        ]}>
                          {item.name}
                        </Text>
                        {formData.medical_specialty_id === item.id && (
                          <Ionicons name="checkmark" size={24} color={colors.primary} />
                        )}
                      </TouchableOpacity>
                    )}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    nestedScrollEnabled={true}
                  />
                </View>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
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
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    marginTop: 20,
    marginBottom: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textLight,
  },
  form: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  inputContainer: {
    marginBottom: 20,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  hint: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
    marginLeft: 4,
  },
  inputError: {
    borderColor: colors.error,
    borderWidth: 2,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '500',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  eyeButton: {
    padding: 12,
  },
  profileSelector: {
    flexDirection: 'column',
    gap: 12,
  },
  profileRow: {
    flexDirection: 'row',
    gap: 12,
  },
  profileOption: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  profileOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  profileIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  profileIconContainerActive: {
    backgroundColor: colors.primary,
  },
  profileOptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  profileOptionTitleActive: {
    color: colors.primary,
  },
  profileOptionDescription: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: 'center',
  },
  profileOptionDescriptionActive: {
    color: colors.primary,
  },
  registerButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: '600',
  },
  termsText: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
  termsLink: {
    color: colors.primary,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 14,
    color: colors.textLight,
  },
  footerLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  genderSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.backgroundLight,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  genderOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  genderOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  genderOptionTextActive: {
    color: colors.primary,
  },
  formationSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  formationOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.backgroundLight,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  formationOptionActive: {
    borderColor: colors.success,
    backgroundColor: colors.success + '10',
  },
  formationOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  formationOptionTextActive: {
    color: colors.success,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  specialtySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    minHeight: 50,
  },
  specialtySelectorText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  specialtySelectorPlaceholder: {
    color: colors.placeholder,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '50%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  flatListContainer: {
    flex: 1,
  },
  flatList: {
    flex: 1,
  },
  flatListContent: {
    padding: 16,
  },
  specialtyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  specialtyItemSelected: {
    backgroundColor: '#E3F2FD',
  },
  specialtyItemText: {
    fontSize: 16,
    color: colors.text,
  },
  specialtyItemTextSelected: {
    fontWeight: '600',
    color: colors.primary,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textLight,
  },
});

export default RegisterScreen;


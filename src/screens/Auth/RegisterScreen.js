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
import { ArrowBackIcon, ChevronDownIcon, EyeIcon, EyeOffIcon } from '../../components/CustomIcons';
import medicalSpecialtyService from '../../services/medicalSpecialtyService';
import { navigationRef } from '../../../App';
import { BR_UFS } from '../../constants/brUfs';
import { parseCrm, formatCrmValue } from '../../utils/crm';
import { formatCPF, validateCPF, unformatCPF } from '../../utils/cpf';
import Svg, { Path, Circle } from 'react-native-svg';

const RegisterScreen = ({ navigation }) => {
  const { signUp, clearRegistering, savedFormData, getSavedFormData, isRegistering } = useAuth();
  const scrollViewRef = React.useRef(null);
  const emailInputRef = React.useRef(null);
  const cpfInputRef = React.useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    email: '',
    cpf: '', // CPF para médicos
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
    crmUf: '',
    crmNumber: '',
    medical_specialty_id: null,
    medical_specialty_ids: [], // Array para múltiplas especialidades
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [specialties, setSpecialties] = useState([]);
  const [specialtyModalVisible, setSpecialtyModalVisible] = useState(false);
  const [loadingSpecialties, setLoadingSpecialties] = useState(false);
  const [selectedSpecialtyNames, setSelectedSpecialtyNames] = useState([]);
  const [ufModalVisible, setUfModalVisible] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const [errorModalTitle, setErrorModalTitle] = useState('');
  const [hasValidationError, setHasValidationError] = useState(false); // Flag para indicar que há erro de validação ativo

  // Restaurar dados salvos quando a tela recebe foco e há dados salvos
  useFocusEffect(
    useCallback(() => {
      const saved = getSavedFormData();
      if (saved && isRegistering) {
        console.log('📝 RegisterScreen - Restaurando dados salvos do formulário:', saved);
        console.log('📝 RegisterScreen - saved.cpf:', saved.cpf, 'saved.email:', saved.email);
        
        // Restaurar TODOS os campos salvos. Se for médico e vier CRM antigo, converter para UF + número.
        if (saved.profile === 'doctor') {
          const parsed = parseCrm(saved.crm || '');
          setFormData({
            ...saved,
            crmUf: saved.crmUf || parsed.uf || '',
            crmNumber: saved.crmNumber || parsed.number || '',
          });
        } else {
          setFormData(saved);
        }
        
        // IMPORTANTE: Só mostrar erro de email se NÃO for erro de CPF
        // Se é médico com CPF, o erro é de CPF, não de email
        const isCpfError = saved.profile === 'doctor' && saved.cpf;
        const isEmailError = !isCpfError && saved.email;
        
        console.log('📝 RegisterScreen - isCpfError:', isCpfError, 'isEmailError:', isEmailError);
        
        if (isEmailError) {
          setEmailError('Este email já está cadastrado. Use outro email ou faça login.');
        } else {
          // Limpar erro de email se não for erro de email
          setEmailError('');
        }
        
        // Marcar que há erro de validação para manter usuário na tela
        setHasValidationError(true);
        
        // Carregar especialidades se for médico (para restaurar o nome depois)
        if (saved.profile === 'doctor') {
          loadSpecialties();
        }
        
        // Focar no campo correto após restaurar (CPF se houver CPF, email se houver email)
        setTimeout(() => {
          if (isCpfError && cpfInputRef.current) {
            // Se é erro de CPF, focar no campo CPF
            console.log('📝 RegisterScreen - Focando no campo CPF');
            cpfInputRef.current.focus();
            if (scrollViewRef.current) {
              scrollViewRef.current.scrollTo({ y: 0, animated: true });
            }
          } else if (isEmailError && emailInputRef.current) {
            // Se é erro de email, focar no campo email
            console.log('📝 RegisterScreen - Focando no campo Email');
            emailInputRef.current.focus();
            if (scrollViewRef.current) {
              scrollViewRef.current.scrollTo({ y: 250, animated: true });
            }
          }
        }, 300);
        
        // Mostrar Toast apenas se não houver modal de erro aberta
        // (a modal já mostra o erro, não precisa de Toast também)
        if (!errorModalVisible) {
          Toast.show({
            type: 'error',
            text1: isCpfError ? 'CPF já cadastrado' : 'Email já cadastrado',
            text2: isCpfError 
              ? 'Já existe uma conta de médico com este CPF. Por favor, verifique o número informado ou entre em contato com o suporte.'
              : 'Este email já está cadastrado. Use outro email ou faça login.',
            position: 'top',
            visibilityTime: 4000,
          });
        }
      }
    }, [getSavedFormData, isRegistering, errorModalVisible])
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

  // PROTEÇÃO CRÍTICA: Garantir que isRegistering seja mantido quando há erro de validação
  useEffect(() => {
    if (hasValidationError || emailError || errorModalVisible) {
      console.log('📝 RegisterScreen - ⚠️ Erro de validação detectado - GARANTINDO isRegistering=true');
      console.log('📝 RegisterScreen - hasValidationError:', hasValidationError, 'emailError:', !!emailError, 'errorModalVisible:', errorModalVisible);
      // Não limpar isRegistering aqui - apenas garantir que está true
      // O AuthContext já deve ter setado isso, mas vamos garantir
    }
  }, [hasValidationError, emailError, errorModalVisible]);

  // REMOVIDO: Não limpar isRegistering automaticamente quando a tela perde foco
  // Isso estava causando redirecionamento para Welcome mesmo com erro de validação
  // O isRegistering só será limpo explicitamente quando:
  // 1. Cadastro bem-sucedido
  // 2. Usuário navegar manualmente para outra tela (sem erro)
  // 3. Usuário clicar em "Voltar" explicitamente

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
      console.log('🔄 Iniciando carregamento de especialidades...');
      
      const response = await medicalSpecialtyService.getSpecialties();
      console.log('📋 Resposta completa das especialidades:', JSON.stringify(response, null, 2));
      console.log('📋 Tipo da resposta:', typeof response);
      console.log('📋 É array?', Array.isArray(response));
      console.log('📋 Chaves da resposta:', response ? Object.keys(response) : 'null/undefined');
      
      // O backend retorna {success: true, data: [...]}
      // O apiService retorna o JSON parseado diretamente
      let specialtiesData = [];
      
      // Verificar se response é um objeto com success e data
      if (response && typeof response === 'object') {
        if (response.success === true && response.data && Array.isArray(response.data)) {
          // Formato: {success: true, data: [...]}
          specialtiesData = response.data;
          console.log('✅ Especialidades extraídas de response.success.data:', specialtiesData.length);
        } else if (response.data && Array.isArray(response.data)) {
          // Formato: {data: [...]}
          specialtiesData = response.data;
          console.log('✅ Especialidades extraídas de response.data:', specialtiesData.length);
        } else if (Array.isArray(response)) {
          // Formato: [...] (array direto)
          specialtiesData = response;
          console.log('✅ Especialidades extraídas como array direto:', specialtiesData.length);
        } else if (response.error || response.message) {
          // Erro na resposta
          console.error('❌ Erro na resposta:', response.error || response.message);
          Alert.alert('Erro', response.message || 'Não foi possível carregar as especialidades. Tente novamente.');
          setSpecialties([]);
          return;
        } else {
          console.log('⚠️ Formato de resposta não reconhecido:', typeof response);
          console.log('⚠️ Resposta completa:', JSON.stringify(response, null, 2));
          if (response) {
            console.log('⚠️ Chaves disponíveis:', Object.keys(response));
          }
        }
      } else if (Array.isArray(response)) {
        // Se a resposta for um array direto
        specialtiesData = response;
        console.log('✅ Especialidades extraídas como array direto:', specialtiesData.length);
      } else {
        console.log('⚠️ Formato de resposta não reconhecido:', typeof response);
        console.log('⚠️ Resposta:', response);
      }
      
      console.log('📋 Especialidades processadas:', specialtiesData.length);
      
      if (specialtiesData.length === 0) {
        console.log('⚠️ Nenhuma especialidade encontrada na resposta');
        setSpecialties([]);
        return;
      }
      
      // Remover duplicatas por nome (caso o backend ainda retorne)
      const uniqueSpecialties = specialtiesData.reduce((acc, current) => {
        if (!current || !current.name) {
          console.warn('⚠️ Especialidade inválida encontrada:', current);
          return acc;
        }
        // Verificar se já existe uma especialidade com o mesmo nome
        const existing = acc.find(item => item.name === current.name);
        if (!existing) {
          acc.push(current);
        } else {
          // Se já existe, manter a que tem o menor ID (assumindo que IDs menores são mais antigos/corretos)
          if (current.id < existing.id) {
            const index = acc.indexOf(existing);
            acc[index] = current;
          }
        }
        return acc;
      }, []);
      
      // Ordenar por nome
      uniqueSpecialties.sort((a, b) => a.name.localeCompare(b.name));
      
      console.log(`✅ Especialidades únicas: ${uniqueSpecialties.length} (após remover duplicatas)`);
      if (uniqueSpecialties.length > 0) {
        console.log('📋 Primeira especialidade:', JSON.stringify(uniqueSpecialties[0], null, 2));
        console.log('📋 Última especialidade:', JSON.stringify(uniqueSpecialties[uniqueSpecialties.length - 1], null, 2));
      }
      
      console.log('🔄 Atualizando estado specialties com', uniqueSpecialties.length, 'itens');
      setSpecialties(uniqueSpecialties);
      console.log('✅ Estado specialties atualizado');
    } catch (error) {
      console.error('❌ Erro ao carregar especialidades:', error);
      console.error('❌ Stack trace:', error.stack);
      Alert.alert('Erro', `Erro ao carregar especialidades: ${error.message || 'Erro desconhecido'}`);
      setSpecialties([]);
    } finally {
      setLoadingSpecialties(false);
    }
  };

  // Atualizar nomes das especialidades quando medical_specialty_ids ou specialties mudarem
  useEffect(() => {
    if (!formData.medical_specialty_ids || formData.medical_specialty_ids.length === 0) {
      setSelectedSpecialtyNames([]);
      return;
    }
    
    const selectedNames = formData.medical_specialty_ids
      .map(id => {
        const specialty = specialties.find(s => String(s.id) === String(id) || s.id === id);
        return specialty ? specialty.name : null;
      })
      .filter(name => name !== null);
    
    setSelectedSpecialtyNames(selectedNames);
  }, [formData.medical_specialty_ids, specialties]);

  const handleRegister = async () => {
    // 🧪 TESTE: Log bem visível para verificar se o código está sendo executado
    console.log('🧪🧪🧪 TESTE - handleRegister foi chamado! 🧪🧪🧪');
    console.log('🧪 TESTE - Dados do formulário:', { email: formData.email, profile: formData.profile });
    
    // Validações básicas
    if (!formData.name || !formData.lastName || !formData.password) {
      Alert.alert('Atenção', 'Por favor, preencha todos os campos obrigatórios');
      return;
    }

    // Validação específica por perfil
    if (formData.profile === 'doctor') {
      // Médico: CPF obrigatório, email opcional
      if (!formData.cpf) {
        Alert.alert('Atenção', 'CPF é obrigatório para médicos');
        return;
      }
      const cpfNumbers = unformatCPF(formData.cpf);
      console.log('🔍 RegisterScreen - Validando CPF:', { 
        cpfFormatado: formData.cpf, 
        cpfNumeros: cpfNumbers, 
        tamanho: cpfNumbers.length,
        isValid: validateCPF(cpfNumbers)
      });
      if (!validateCPF(cpfNumbers)) {
        Alert.alert('Atenção', 'CPF inválido. Verifique o número e tente novamente.');
        return;
      }
    } else {
      // Outros perfis: Email obrigatório
      if (!formData.email) {
        Alert.alert('Atenção', 'E-mail é obrigatório');
        return;
      }
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
          !formData.crmUf || !formData.crmNumber || 
          !formData.medical_specialty_ids || formData.medical_specialty_ids.length === 0) {
        Alert.alert('Atenção', 'Por favor, preencha todos os campos obrigatórios do perfil médico, incluindo pelo menos uma especialidade');
        return;
      }
      // CPF já foi validado acima
    }

    setLoading(true);
    setEmailError(''); // Limpar erro anterior
    
    console.log('📝 RegisterScreen - Iniciando signUp');
    
    // Limpar flag de erro de validação ao tentar cadastrar novamente
    setHasValidationError(false);
    
    // Enviar para o backend o campo `crm` no formato UF-NÚMERO (ex: MG-123456)
    const signUpPayload = { ...formData };
    if (formData.profile === 'doctor') {
      signUpPayload.crm = formatCrmValue(formData.crmUf, formData.crmNumber);
      // Enviar CPF sem formatação
      signUpPayload.cpf = unformatCPF(formData.cpf);
      // Enviar especialidades como array
      signUpPayload.medical_specialty_ids = formData.medical_specialty_ids || [];
      // Manter compatibilidade com backend que pode esperar medical_specialty_id (primeira especialidade)
      if (formData.medical_specialty_ids && formData.medical_specialty_ids.length > 0) {
        signUpPayload.medical_specialty_id = formData.medical_specialty_ids[0];
      }
    }
    // Nunca enviar campos auxiliares
    delete signUpPayload.crmUf;
    delete signUpPayload.crmNumber;
    const result = await signUp(signUpPayload);
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
      
      // Verificar se é erro de validação (422)
      const isValidationError = result?.isValidationError === true;
      const isEmailError = result?.isEmailError === true;
      const isCpfError = result?.isCpfError === true;
      const isDuplicateError = result?.isDuplicateError === true;
      
      console.log('📝 RegisterScreen - É erro de validação?', isValidationError);
      console.log('📝 RegisterScreen - É erro de email?', isEmailError);
      console.log('📝 RegisterScreen - É erro de CPF?', isCpfError);
      console.log('📝 RegisterScreen - É erro de duplicado?', isDuplicateError);
      console.log('📝 RegisterScreen - Erros por campo:', result?.errors);
      
      // Se for erro de validação, mostrar mensagens específicas
      if (isValidationError) {
        // Limpar erro de email anterior se houver
        if (isEmailError) {
          setEmailError('');
        }
        
        // Construir mensagem principal
        let mainMessage = result.error || 'Erro ao criar conta. Verifique os dados e tente novamente.';
        let title = 'Erro ao criar conta';
        
        if (isDuplicateError) {
          if (isCpfError) {
            // CPF duplicado - mostrar MODAL
            title = 'CPF já cadastrado';
            mainMessage = 'Já existe uma conta de médico com este CPF. Por favor, verifique o número informado ou entre em contato com o suporte.';
            
            // Mostrar modal para CPF duplicado
            setErrorModalTitle(title);
            setErrorModalMessage(mainMessage);
            setErrorModalVisible(true);
            setHasValidationError(true); // Marcar que há erro de validação ativo
            
            // Focar no campo CPF após mostrar a modal
            setTimeout(() => {
              if (cpfInputRef.current) {
                cpfInputRef.current.focus();
                if (scrollViewRef.current) {
                  scrollViewRef.current.scrollTo({ y: 0, animated: true });
                }
              }
            }, 500);
            
            console.log('📝 RegisterScreen - ✅ Erro de CPF duplicado - Modal será exibida');
            console.log('📝 RegisterScreen - isRegistering mantido=true para evitar redirecionamento');
            console.log('📝 RegisterScreen - hasValidationError=true para manter usuário na tela');
            return; // Retornar para não continuar - usuário fica no formulário
          } else if (isEmailError) {
            title = 'Email já cadastrado';
            mainMessage = 'Este email já está cadastrado. Use outro email ou faça login.';
            setEmailError(mainMessage);
            setHasValidationError(true); // Marcar que há erro de validação ativo
            
            // Mostrar Toast para email
            Toast.show({
              type: 'error',
              text1: title,
              text2: mainMessage,
              position: 'top',
              visibilityTime: 5000,
            });
            
            // Focar no campo de email
            if (emailInputRef.current) {
              setTimeout(() => {
                emailInputRef.current?.focus();
                if (scrollViewRef.current) {
                  scrollViewRef.current.scrollTo({ y: 250, animated: true });
                }
              }, 500);
            }
            
            console.log('📝 RegisterScreen - ✅ Erro de email tratado - Usuário permanece no formulário');
            console.log('📝 RegisterScreen - hasValidationError=true para manter usuário na tela');
            return; // Retornar para não continuar
          } else {
            title = 'Dado já cadastrado';
            // Mostrar modal para outros dados duplicados
            setErrorModalTitle(title);
            setErrorModalMessage(mainMessage);
            setErrorModalVisible(true);
            setHasValidationError(true); // Marcar que há erro de validação ativo
            return;
          }
        } else if (isCpfError) {
          // CPF inválido - mostrar modal
          title = 'CPF inválido';
          mainMessage = 'O CPF informado é inválido. Verifique o número e tente novamente.';
          setErrorModalTitle(title);
          setErrorModalMessage(mainMessage);
          setErrorModalVisible(true);
          setHasValidationError(true); // Marcar que há erro de validação ativo
          
          // Focar no campo CPF
          setTimeout(() => {
            if (cpfInputRef.current) {
              cpfInputRef.current.focus();
              if (scrollViewRef.current) {
                scrollViewRef.current.scrollTo({ y: 0, animated: true });
              }
            }
          }, 500);
          
          return;
        } else if (isEmailError) {
          title = 'Email inválido';
          setEmailError(mainMessage);
          setHasValidationError(true); // Marcar que há erro de validação ativo
          
          Toast.show({
            type: 'error',
            text1: title,
            text2: mainMessage,
            position: 'top',
            visibilityTime: 5000,
          });
          
          if (emailInputRef.current) {
            setTimeout(() => {
              emailInputRef.current?.focus();
              if (scrollViewRef.current) {
                scrollViewRef.current.scrollTo({ y: 250, animated: true });
              }
            }, 500);
          }
          
          console.log('📝 RegisterScreen - ✅ Erro de email tratado - hasValidationError=true');
          return;
        } else {
          // Outros erros de validação - mostrar Toast
          setHasValidationError(true); // Marcar que há erro de validação ativo
          
          Toast.show({
            type: 'error',
            text1: title,
            text2: mainMessage,
            position: 'top',
            visibilityTime: 5000,
          });
          
          // Se houver erros por campo, mostrar todos
          if (result.errors && Object.keys(result.errors).length > 1) {
            setTimeout(() => {
              Object.keys(result.errors).forEach((field, index) => {
                if (index > 0) {
                  const fieldErrors = result.errors[field];
                  if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
                    Toast.show({
                      type: 'error',
                      text1: `Erro no campo ${field}`,
                      text2: fieldErrors[0],
                      position: 'top',
                      visibilityTime: 4000,
                    });
                  }
                }
              });
            }, 2000);
          }
        }
        
        console.log('📝 RegisterScreen - ✅ Erro de validação tratado - Usuário permanece no formulário');
        console.log('📝 RegisterScreen - isRegistering mantido=true para evitar redirecionamento');
        console.log('📝 RegisterScreen - hasValidationError=true para manter usuário na tela');
        return; // Retornar para não continuar - usuário fica no formulário
      } else {
        // Para outros erros (não 422), mostrar Toast genérico
        console.log('📝 RegisterScreen - Erro não é de validação, mostrando mensagem genérica');
        const errorMessage = result.error || 'Não foi possível criar a conta. Tente novamente.';
        
        Toast.show({
          type: 'error',
          text1: 'Erro ao criar conta',
          text2: errorMessage,
          position: 'top',
          visibilityTime: 5000,
        });
        
        // Manter no formulário mesmo para outros erros
        console.log('📝 RegisterScreen - Usuário permanece no formulário');
        return; // Retornar para não continuar
      }
    } else if (result.success || result.requiresApproval) {
      // Cadastro bem-sucedido ou requer aprovação
      console.log('📝 RegisterScreen - Cadastro bem-sucedido ou requer aprovação');
      setHasValidationError(false); // Limpar flag de erro de validação
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
              <View style={{ width: 24, height: 24, justifyContent: 'center', alignItems: 'center' }}>
                <ArrowBackIcon size={24} color={colors.text || '#1e293b'} />
              </View>
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

            {/* Campo CPF para médicos */}
            {formData.profile === 'doctor' && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>CPF *</Text>
                <TextInput
                  ref={cpfInputRef}
                  style={styles.input}
                  placeholder="000.000.000-00"
                  placeholderTextColor={colors.placeholder}
                  value={formData.cpf}
                  onChangeText={(value) => {
                    const formatted = formatCPF(value);
                    updateFormData('cpf', formatted);
                  }}
                  keyboardType="numeric"
                  maxLength={14}
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                E-mail {formData.profile === 'doctor' ? '(opcional)' : '*'}
              </Text>
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
                      <View style={{ width: 28, height: 28, justifyContent: 'center', alignItems: 'center' }}>
                        <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                          <Path
                            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                            fill={formData.profile === 'caregiver' ? colors.white : colors.primary}
                          />
                        </Svg>
                      </View>
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
                      <View style={{ width: 28, height: 28, justifyContent: 'center', alignItems: 'center' }}>
                        <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                          <Circle cx="12" cy="8" r="4" fill={formData.profile === 'accompanied' ? colors.white : colors.secondary} />
                          <Path
                            d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"
                            stroke={formData.profile === 'accompanied' ? colors.white : colors.secondary}
                            strokeWidth="2"
                            fill="none"
                          />
                        </Svg>
                      </View>
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
                      <View style={{ width: 28, height: 28, justifyContent: 'center', alignItems: 'center' }}>
                        <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                          <Path
                            d="M12 2L2 7l10 5 10-5-10-5z"
                            fill={formData.profile === 'professional_caregiver' ? colors.white : colors.success}
                          />
                          <Path
                            d="M2 17l10 5 10-5M2 12l10 5 10-5"
                            stroke={formData.profile === 'professional_caregiver' ? colors.white : colors.success}
                            strokeWidth="1.5"
                            fill="none"
                          />
                        </Svg>
                      </View>
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
                      <View style={{ width: 28, height: 28, justifyContent: 'center', alignItems: 'center' }}>
                        <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                          <Path
                            d="M12 2L2 7l10 5 10-5-10-5z"
                            stroke={formData.profile === 'doctor' ? colors.white : '#4A90E2'}
                            strokeWidth="2"
                            fill="none"
                          />
                          <Path
                            d="M2 17l10 5 10-5M2 12l10 5 10-5"
                            stroke={formData.profile === 'doctor' ? colors.white : '#4A90E2'}
                            strokeWidth="1.5"
                            fill="none"
                          />
                        </Svg>
                      </View>
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
                      <View style={styles.crmRow}>
                        <TouchableOpacity
                          style={styles.ufSelector}
                          activeOpacity={0.7}
                          onPress={() => {
                            console.log('🔘 TouchableOpacity UF pressionado');
                            setUfModalVisible(true);
                          }}
                        >
                          <Text style={[
                            styles.ufSelectorText,
                            !formData.crmUf && styles.ufSelectorPlaceholder
                          ]}>
                            {formData.crmUf || 'UF'}
                          </Text>
                          <View style={{ width: 24, height: 24, justifyContent: 'center', alignItems: 'center' }} pointerEvents="none">
                            <ChevronDownIcon size={18} color={colors.textLight} />
                          </View>
                        </TouchableOpacity>
                        <TextInput
                          style={[styles.input, styles.crmNumberInput]}
                          placeholder="Número do CRM"
                          placeholderTextColor={colors.placeholder}
                          value={formData.crmNumber}
                          onChangeText={(value) => updateFormData('crmNumber', value.replace(/\\D/g, '').slice(0, 12))}
                          keyboardType="number-pad"
                        />
                      </View>
                    </View>

                    {/* Modal UF */}
                    <Modal
                      visible={ufModalVisible}
                      animationType="slide"
                      transparent={true}
                      onRequestClose={() => setUfModalVisible(false)}
                    >
                      <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                          <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Selecione o UF</Text>
                            <TouchableOpacity
                              style={styles.modalCloseButton}
                              onPress={() => setUfModalVisible(false)}
                            >
                              <View style={{ width: 24, height: 24, justifyContent: 'center', alignItems: 'center' }}>
                                <Ionicons name="close" size={24} color={colors.text} />
                              </View>
                            </TouchableOpacity>
                          </View>
                          <FlatList
                            data={BR_UFS}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                              <TouchableOpacity
                                style={[
                                  styles.specialtyItem,
                                  formData.crmUf === item && styles.specialtyItemSelected
                                ]}
                                onPress={() => {
                                  updateFormData('crmUf', item);
                                  setUfModalVisible(false);
                                }}
                              >
                                <Text style={[
                                  styles.specialtyItemText,
                                  formData.crmUf === item && styles.specialtyItemTextSelected
                                ]}>
                                  {item}
                                </Text>
                                {formData.crmUf === item && (
                                  <View style={{ width: 24, height: 24, justifyContent: 'center', alignItems: 'center' }}>
                                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                                  </View>
                                )}
                              </TouchableOpacity>
                            )}
                            ItemSeparatorComponent={() => <View style={styles.separator} />}
                          />
                        </View>
                      </View>
                    </Modal>

                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>
                        Especialidades * {formData.medical_specialty_ids?.length > 0 && `(${formData.medical_specialty_ids.length} selecionada${formData.medical_specialty_ids.length > 1 ? 's' : ''})`}
                      </Text>
                      <TouchableOpacity
                        style={styles.specialtySelector}
                        activeOpacity={0.7}
                        onPress={() => {
                          console.log('🔘 TouchableOpacity pressionado - Abrindo modal de especialidades');
                          console.log('📋 Especialidades carregadas:', specialties.length);
                          if (specialties.length === 0 && !loadingSpecialties) {
                            console.log('⚠️ Nenhuma especialidade carregada, tentando carregar...');
                            loadSpecialties();
                          }
                          setSpecialtyModalVisible(true);
                        }}
                      >
                        <Text style={[
                          styles.specialtySelectorText,
                          (!formData.medical_specialty_ids || formData.medical_specialty_ids.length === 0) && styles.specialtySelectorPlaceholder
                        ]}>
                          {selectedSpecialtyNames.length > 0 
                            ? selectedSpecialtyNames.join(', ') 
                            : 'Selecione as especialidades'}
                        </Text>
                        <View style={{ width: 24, height: 24, justifyContent: 'center', alignItems: 'center' }} pointerEvents="none">
                          <ChevronDownIcon size={20} color={colors.textLight} />
                        </View>
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
                  <View style={{ width: 24, height: 24, justifyContent: 'center', alignItems: 'center' }}>
                    {showPassword ? (
                      <EyeOffIcon size={20} color={colors.gray400} />
                    ) : (
                      <EyeIcon size={20} color={colors.gray400} />
                    )}
                  </View>
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
                  <View style={{ width: 24, height: 24, justifyContent: 'center', alignItems: 'center' }}>
                    {showConfirmPassword ? (
                      <EyeOffIcon size={20} color={colors.gray400} />
                    ) : (
                      <EyeIcon size={20} color={colors.gray400} />
                    )}
                  </View>
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
            console.log('📋 Especialidades no estado:', specialties.length);
            console.log('📋 Estado loadingSpecialties:', loadingSpecialties);
            console.log('📋 Primeiras 3 especialidades:', specialties.slice(0, 3));
            console.log('📋 Todas as especialidades:', JSON.stringify(specialties, null, 2));
            if (specialties.length === 0 && !loadingSpecialties) {
              console.log('⚠️ Nenhuma especialidade carregada, tentando carregar...');
              loadSpecialties();
            }
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Selecione as Especialidades</Text>
                  <TouchableOpacity
                    onPress={() => {
                      console.log('🔘 Botão fechar pressionado');
                      setSpecialtyModalVisible(false);
                    }}
                    style={styles.modalCloseButton}
                  >
                    <View style={{ width: 24, height: 24, justifyContent: 'center', alignItems: 'center' }}>
                      <Ionicons name="close" size={24} color={colors.text} />
                    </View>
                  </TouchableOpacity>
              </View>
              {loadingSpecialties ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Carregando especialidades...</Text>
                </View>
              ) : specialties.length === 0 ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Nenhuma especialidade disponível</Text>
                  <TouchableOpacity
                    style={[styles.modalConfirmButton, { marginTop: 16, backgroundColor: colors.primary }]}
                    onPress={() => {
                      console.log('🔄 Tentando recarregar especialidades...');
                      loadSpecialties();
                    }}
                  >
                    <Text style={styles.modalConfirmButtonText}>Tentar novamente</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.flatListContainer}>
                  <View style={{ padding: 16, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                    <Text style={{ fontSize: 14, color: colors.textLight, fontWeight: '600' }}>
                      {specialties.length} especialidade{specialties.length !== 1 ? 's' : ''} disponível{specialties.length !== 1 ? 'eis' : ''}
                    </Text>
                  </View>
                  <FlatList
                    data={specialties}
                    keyExtractor={(item, index) => {
                      const key = item?.id ? String(item.id) : `specialty-${index}`;
                      return key;
                    }}
                    style={styles.flatList}
                    contentContainerStyle={styles.flatListContent}
                    showsVerticalScrollIndicator={true}
                    removeClippedSubviews={false}
                    initialNumToRender={20}
                    maxToRenderPerBatch={10}
                    windowSize={10}
                    renderItem={({ item, index }) => {
                      console.log(`🎨 Renderizando especialidade ${index}:`, item?.name, 'ID:', item?.id);
                      if (!item || !item.id || !item.name) {
                        console.warn('⚠️ Item inválido na lista:', item);
                        return null;
                      }
                      const currentIds = formData.medical_specialty_ids || [];
                      const isSelected = currentIds.some(id => String(id) === String(item.id));
                      return (
                        <TouchableOpacity
                          style={[
                            styles.specialtyItem,
                            isSelected && styles.specialtyItemSelected
                          ]}
                          onPress={() => {
                            console.log('✅ Especialidade clicada:', item.id, item.name);
                            const currentIds = formData.medical_specialty_ids || [];
                            let newIds;
                            if (isSelected) {
                              // Remover se já estiver selecionada
                              newIds = currentIds.filter(id => {
                                const idStr = String(id);
                                const itemIdStr = String(item.id);
                                return idStr !== itemIdStr;
                              });
                            } else {
                              // Adicionar se não estiver selecionada
                              newIds = [...currentIds, item.id];
                            }
                            console.log('📝 IDs antes:', currentIds);
                            console.log('📝 IDs depois:', newIds);
                            updateFormData('medical_specialty_ids', newIds);
                            console.log('📝 medical_specialty_ids atualizado para:', newIds);
                          }}
                        >
                          <Text style={[
                            styles.specialtyItemText,
                            isSelected && styles.specialtyItemTextSelected
                          ]}>
                            {item.name}
                          </Text>
                          {isSelected && (
                            <View style={{ width: 24, height: 24, justifyContent: 'center', alignItems: 'center' }}>
                              <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    }}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    nestedScrollEnabled={true}
                  />
                </View>
              )}
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.modalConfirmButton}
                  onPress={() => {
                    console.log('✅ Botão Confirmar pressionado');
                    setSpecialtyModalVisible(false);
                  }}
                >
                  <Text style={styles.modalConfirmButtonText}>
                    Confirmar ({formData.medical_specialty_ids?.length || 0} selecionada{formData.medical_specialty_ids?.length !== 1 ? 's' : ''})
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal de Erro (CPF duplicado, etc) */}
        <Modal
          visible={errorModalVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={() => {
            console.log('📝 RegisterScreen - Modal de erro fechada via onRequestClose');
            console.log('📝 RegisterScreen - MANTENDO isRegistering=true para evitar redirecionamento');
            setErrorModalVisible(false);
            
            // Focar no campo CPF após fechar a modal (se for erro de CPF)
            setTimeout(() => {
              if (cpfInputRef.current && formData.profile === 'doctor' && formData.cpf) {
                console.log('📝 RegisterScreen - Focando no campo CPF após fechar modal');
                cpfInputRef.current.focus();
                if (scrollViewRef.current) {
                  scrollViewRef.current.scrollTo({ y: 0, animated: true });
                }
              }
            }, 300);
            
            // NÃO limpar isRegistering aqui - deixar o usuário corrigir os dados
          }}
        >
          <View style={styles.errorModalOverlay}>
            <View style={styles.errorModalContent}>
              <View style={styles.errorModalHeader}>
                <Text style={styles.errorModalTitle}>{errorModalTitle}</Text>
                <TouchableOpacity
                  onPress={() => {
                    console.log('📝 RegisterScreen - Botão fechar modal de erro pressionado');
                    console.log('📝 RegisterScreen - Fechando modal mas MANTENDO isRegistering=true');
                    setErrorModalVisible(false);
                    
                    // Focar no campo CPF após fechar a modal (se for erro de CPF)
                    setTimeout(() => {
                      if (cpfInputRef.current && formData.profile === 'doctor' && formData.cpf) {
                        console.log('📝 RegisterScreen - Focando no campo CPF após fechar modal');
                        cpfInputRef.current.focus();
                        if (scrollViewRef.current) {
                          scrollViewRef.current.scrollTo({ y: 0, animated: true });
                        }
                      }
                    }, 300);
                    
                    // NÃO limpar isRegistering aqui - deixar o usuário corrigir os dados
                  }}
                  style={styles.errorModalCloseButton}
                >
                  <View style={{ width: 24, height: 24, justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="close" size={24} color={colors.text} />
                  </View>
                </TouchableOpacity>
              </View>
              <View style={styles.errorModalBody}>
                <View style={{ width: 64, height: 64, justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
                  <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="alert-circle" size={32} color="#EF4444" />
                  </View>
                </View>
                <Text style={styles.errorModalMessage}>{errorModalMessage}</Text>
              </View>
              <View style={styles.errorModalFooter}>
                <TouchableOpacity
                  style={styles.errorModalButton}
                  onPress={() => {
                    console.log('📝 RegisterScreen - Botão "Entendi" pressionado - Modal fechada');
                    console.log('📝 RegisterScreen - Usuário permanece no formulário para corrigir');
                    setErrorModalVisible(false);
                  }}
                >
                  <Text style={styles.errorModalButtonText}>Entendi</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
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
  crmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ufSelector: {
    width: 92,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    minHeight: 50,
  },
  ufSelectorText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  ufSelectorPlaceholder: {
    color: colors.textLight,
    fontWeight: '500',
  },
  crmNumberInput: {
    flex: 1,
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
    width: '100%',
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
    maxHeight: '70%',
    minHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    flexDirection: 'column',
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
    height: 400,
    width: '100%',
  },
  flatList: {
    flex: 1,
    width: '100%',
  },
  flatListContent: {
    padding: 16,
    paddingBottom: 20,
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
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalConfirmButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalConfirmButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  errorModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  errorModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  errorModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  errorModalCloseButton: {
    padding: 4,
  },
  errorModalBody: {
    padding: 20,
    alignItems: 'center',
  },
  errorModalMessage: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorModalFooter: {
    padding: 20,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  errorModalButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  errorModalButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RegisterScreen;


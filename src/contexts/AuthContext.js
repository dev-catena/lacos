                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../services/apiService';
import { navigationRef } from '../../App';

// Criação do contexto
export const AuthContext = createContext({});

// Provider do contexto de autenticação
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false); // Flag para indicar que estamos em processo de registro
  const [savedFormData, setSavedFormData] = useState(null); // Salvar dados do formulário quando há erro de email

  // Carrega os dados do usuário ao iniciar o app
  useEffect(() => {
    loadStorageData();
  }, []);

  // Carrega dados do AsyncStorage
  const loadStorageData = async () => {
    try {
      console.log('🔑 AuthContext - Carregando dados do storage...');
      const storedUser = await AsyncStorage.getItem('@lacos:user');
      const storedToken = await AsyncStorage.getItem('@lacos:token');

      console.log('🔑 AuthContext - storedUser:', storedUser ? 'EXISTE' : 'NULL');
      console.log('🔑 AuthContext - storedToken:', storedToken ? 'EXISTE' : 'NULL');

      if (storedUser && storedToken) {
        console.log('🔑 AuthContext - Token encontrado, validando com servidor...');
        const parsedUser = JSON.parse(storedUser);
        console.log('🔑 AuthContext - User do storage:', parsedUser.name);
         
        // Validar token com o servidor
        try {
          const response = await apiService.get('/user');
          console.log('✅ AuthContext - Token VÁLIDO, usuário:', response.name);
          setUser(response);
        } catch (error) {
          // Token inválido, limpar dados
          console.error('❌ AuthContext - Token INVÁLIDO, limpando dados...');
          await AsyncStorage.removeItem('@lacos:user');
          await AsyncStorage.removeItem('@lacos:token');
          await AsyncStorage.removeItem('@lacos_patient_session');
          setUser(null);
        }
      } else {
        console.log('✅ AuthContext - Nenhum token armazenado (primeira vez ou logout)');
        setUser(null);
      }
    } catch (error) {
      console.error('❌ AuthContext - Erro ao carregar dados do storage:', error);
      setUser(null);
    } finally {
      setLoading(false);
      console.log('🔑 AuthContext - Loading finalizado, signed:', !!user);
    }
  };

  // Função de login
  const signIn = async (login, password) => {
    try {
      console.log('🔑 AuthContext - Iniciando login...');
      
      // Chamada à API real (aceita CPF ou email)
      const response = await apiService.post('/login', 
        { login, password },
        { requiresAuth: false }
      );

      // Se houver múltiplos perfis, retornar para seleção
      if (response && response.requires_profile_selection) {
        console.log('🔑 AuthContext - Múltiplos perfis encontrados:', response.profiles?.length);
        return {
          success: false,
          requiresProfileSelection: true,
          profiles: response.profiles,
          message: response.message || 'Selecione o perfil para fazer login',
        };
      }

      // Fluxo 2FA: backend pode responder com requires_2fa=true e NÃO retornar token
      if (response && response.requires_2fa) {
        console.log('🔐 AuthContext - Login requer 2FA (WhatsApp)');
        // Garantir que não persistimos sessão parcial
        await AsyncStorage.removeItem('@lacos:user');
        await AsyncStorage.removeItem('@lacos:token');
        setUser(null);
        return {
          success: false,
          requires2FA: true,
          message: response.message || 'Código enviado via WhatsApp',
        };
      }

      console.log('🔑 AuthContext - Login bem-sucedido:', response.user.name);

      // Salva no AsyncStorage apenas se tiver token e user
      if (response.token && response.user) {
        await AsyncStorage.setItem('@lacos:user', JSON.stringify(response.user));
        await AsyncStorage.setItem('@lacos:token', response.token);
        setUser(response.user);
        console.log('🔑 AuthContext - User setado, signed agora é true');
      } else {
        // Se não tiver token, remover do storage
        await AsyncStorage.removeItem('@lacos:user');
        await AsyncStorage.removeItem('@lacos:token');
        setUser(null);
        console.log('🔑 AuthContext - Token não recebido, dados removidos');
      }

      return { success: true };
    } catch (error) {
      console.error('🔑 AuthContext - Erro no login:', error);
      
      // Verificar se é erro de múltiplos perfis
      if (error.response?.data?.requires_profile_selection) {
        return {
          success: false,
          requiresProfileSelection: true,
          profiles: error.response.data.profiles,
          message: error.response.data.message || 'Selecione o perfil para fazer login',
        };
      }
      
      // Tratar erros específicos de médico
      const errorMessage = error.message || 'Erro ao fazer login. Verifique suas credenciais.';
      
      if (error.error === 'doctor_pending_approval' || error.status === 'pending_approval') {
        return { 
          success: false, 
          error: 'Seu processo está em análise. Acompanhe pelo seu email.',
          requiresApproval: true
        };
      }
      
      if (error.error === 'doctor_pending_activation' || error.status === 'pending_activation') {
        return { 
          success: false, 
          error: 'Por favor, ative sua conta clicando no link enviado por email.',
          requiresActivation: true
        };
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  // Concluir login com 2FA (código enviado via WhatsApp)
  const completeTwoFactorLogin = async (email, code) => {
    try {
      const response = await apiService.post(
        '/2fa/login/verify',
        { email, code },
        { requiresAuth: false }
      );

      if (response && response.token && response.user) {
        await AsyncStorage.setItem('@lacos:user', JSON.stringify(response.user));
        await AsyncStorage.setItem('@lacos:token', response.token);
        setUser(response.user);
        return { success: true };
      }

      return {
        success: false,
        error: response?.message || response?.error || 'Não foi possível validar o código',
      };
    } catch (error) {
      return {
        success: false,
        error: error?.message || 'Erro ao validar código',
      };
    }
  };

  // Função de cadastro
  const signUp = async (userData) => {
    try {
      console.log('🔑 AuthContext - Iniciando cadastro...');
      setIsRegistering(true); // IMPORTANTE: Setar flag ANTES de fazer a chamada
      console.log('🔑 AuthContext - isRegistering setado para TRUE');
      
      // Preparar dados para API
      // Processar telefone: remover formatação e manter apenas +55 + dígitos
      let phoneValue = null;
      if (userData.phone && userData.phone.trim() && userData.phone !== '+55') {
        // Garantir que começa com +55 e extrair apenas os dígitos após +55
        const digits = userData.phone.replace(/\+55/g, '').replace(/\D/g, '');
        if (digits.length > 0) {
          phoneValue = `+55${digits}`;
        }
      }

      const registerData = {
        name: `${userData.name} ${userData.lastName || ''}`.trim(),
        email: userData.email,
        password: userData.password,
        password_confirmation: userData.password,
        phone: phoneValue,
        birth_date: userData.birthDate,
        gender: userData.gender,
        profile: userData.profile || 'caregiver', // Novo: Perfil do usuário
      };

      // Adicionar campos específicos de cuidador profissional
      if (userData.profile === 'professional_caregiver') {
        registerData.city = userData.city;
        registerData.neighborhood = userData.neighborhood;
        registerData.formation_details = userData.formation_details;
        registerData.hourly_rate = userData.hourly_rate ? parseFloat(userData.hourly_rate) : null;
        registerData.availability = userData.availability;
      }
      
      // Adicionar campos específicos de médico
      if (userData.profile === 'doctor') {
        // CPF é obrigatório para médicos - remover formatação antes de enviar
        if (userData.cpf) {
          const cpfNumbers = userData.cpf.replace(/\D/g, '');
          registerData.cpf = cpfNumbers;
        }
        registerData.city = userData.city;
        registerData.neighborhood = userData.neighborhood;
        registerData.crm = userData.crm;
        registerData.medical_specialty_id = userData.medical_specialty_id;
        registerData.availability = userData.availability;
      }

      console.log('🔑 AuthContext - Dados de registro:', { ...registerData, password: '***' });

      // Chamada à API real
      const response = await apiService.post('/register', 
        registerData,
        { requiresAuth: false }
      );

      console.log('🔑 AuthContext - Cadastro bem-sucedido:', response.user.name);

      // Se for médico, não salvar token (precisa aprovação)
      if (response.requires_approval || response.status === 'pending_approval') {
        return { 
          success: true, 
          requiresApproval: true,
          message: response.message || 'Seu processo está em análise. Acompanhe pelo seu email.'
        };
      }

      // Salva no AsyncStorage apenas se tiver token e user
      if (response.token && response.user) {
        await AsyncStorage.setItem('@lacos:user', JSON.stringify(response.user));
        await AsyncStorage.setItem('@lacos:token', response.token);
        setUser(response.user);
        console.log('🔑 AuthContext - User setado após cadastro, signed agora é true');
      } else {
        // Se não tiver token (ex: médico pendente), garantir que storage está limpo
        await AsyncStorage.removeItem('@lacos:user');
        await AsyncStorage.removeItem('@lacos:token');
        setUser(null);
        console.log('🔑 AuthContext - Token não recebido (aprovação pendente), storage limpo');
      }

      return { success: true };
    } catch (error) {
      console.error('🔑 AuthContext - Erro no cadastro:', error);
      
      // Tratar erros de validação (422) com mensagens específicas
      // O backend pode retornar 'errors' (inglês) ou 'erros' (português)
      if (error.status === 422) {
        console.log('🔑 AuthContext - Erro 422 detectado');
        console.log('🔑 AuthContext - error completo:', JSON.stringify(error, null, 2));
        console.log('🔑 AuthContext - error.errors:', error.errors);
        console.log('🔑 AuthContext - error._rawErrorData:', error._rawErrorData);
        console.log('🔑 AuthContext - error.message:', error.message);
        
        // Verificar se o erro tem 'erros' (português) ou 'errors' (inglês)
        const rawData = error._rawErrorData || {};
        const errors = error.errors || rawData.erros || rawData.errors || {};
        console.log('🔑 AuthContext - errors extraído:', errors);
        console.log('🔑 AuthContext - Object.keys(errors).length:', Object.keys(errors).length);
        
        // Se errors estiver vazio mas há mensagem, tratar como erro de validação
        const hasErrors = error.errors && Object.keys(error.errors).length > 0;
        
        if (!hasErrors) {
          console.log('🔑 AuthContext - ⚠️ Erro 422 sem errors detalhados');
          console.log('🔑 AuthContext - userData:', userData ? { profile: userData.profile, hasCpf: !!userData.cpf, hasEmail: !!userData.email } : 'null');
          
          // Tentar extrair informações da mensagem e dos dados enviados
          const errorMessage = error.message || 'Erro ao criar conta. Verifique os dados e tente novamente.';
          const msgLower = errorMessage.toLowerCase();
          
          let isCpfError = false;
          let isEmailError = false;
          let isDuplicateError = false;
          let finalMessage = errorMessage;
          
          // Se o usuário está cadastrando um médico com CPF e deu erro 422,
          // provavelmente é CPF duplicado (mesmo que o backend não retorne erro específico)
          if (userData && userData.profile === 'doctor' && userData.cpf) {
            console.log('🔑 AuthContext - Médico com CPF detectado, assumindo erro de CPF duplicado');
            isCpfError = true;
            isDuplicateError = true;
            finalMessage = 'Já existe uma conta de médico com este CPF. Por favor, verifique o número informado ou entre em contato com o suporte.';
          }
          // Detectar tipo de erro pela mensagem
          else if (msgLower.includes('cpf') && (msgLower.includes('já') || msgLower.includes('cadastrado') || msgLower.includes('existe'))) {
            isCpfError = true;
            isDuplicateError = true;
            finalMessage = 'Já existe uma conta de médico com este CPF. Por favor, verifique o número informado ou entre em contato com o suporte.';
          } else if (msgLower.includes('cpf') && msgLower.includes('inválido')) {
            isCpfError = true;
            finalMessage = 'O CPF informado é inválido. Verifique o número e tente novamente.';
          } else if (msgLower.includes('email') && (msgLower.includes('já') || msgLower.includes('cadastrado') || msgLower.includes('taken'))) {
            isEmailError = true;
            isDuplicateError = true;
            finalMessage = 'Este email já está cadastrado. Use outro email ou faça login.';
          } else if (msgLower.includes('422') || msgLower.includes('fttp')) {
            // Se a mensagem é genérica de erro 422, assumir que é erro de validação
            // Se é médico com CPF, provavelmente é CPF duplicado
            if (userData && userData.profile === 'doctor' && userData.cpf) {
              isCpfError = true;
              isDuplicateError = true;
              finalMessage = 'Já existe uma conta de médico com este CPF. Por favor, verifique o número informado ou entre em contato com o suporte.';
            } else {
              finalMessage = 'Erro ao criar conta. Verifique os dados informados e tente novamente.';
            }
          }
          
          // SEMPRE MANTER isRegistering=true para erros 422
          console.log('🔑 AuthContext - ✅ ERRO 422 - Mantendo isRegistering=TRUE para preservar navegação e permitir correção');
          setIsRegistering(true);
          
          // Salvar dados do formulário se for erro de CPF ou email
          if ((isCpfError || isEmailError) && userData) {
            const fullFormData = {
              name: userData.name || '',
              lastName: userData.lastName || '',
              email: userData.email || '',
              cpf: userData.cpf || '',
              phone: userData.phone || '+55',
              password: '',
              confirmPassword: '',
              profile: userData.profile || 'caregiver',
              gender: userData.gender || '',
              city: userData.city || '',
              neighborhood: userData.neighborhood || '',
              formation_details: userData.formation_details || '',
              hourly_rate: userData.hourly_rate || '',
              availability: userData.availability || '',
              crm: userData.crm || '',
              crmUf: userData.crmUf || '',
              crmNumber: userData.crmNumber || '',
              medical_specialty_id: userData.medical_specialty_id || null,
              medical_specialty_ids: userData.medical_specialty_ids || [],
            };
            console.log('🔑 AuthContext - Salvando formData COMPLETO para restaurar depois');
            setSavedFormData(fullFormData);
          }
          
          return {
            success: false,
            error: finalMessage,
            errors: {},
            isEmailError: isEmailError,
            isCpfError: isCpfError,
            isDuplicateError: isDuplicateError,
            isValidationError: true,
          };
        }
        
        // Se tiver errors, processar normalmente
        console.log('🔑 AuthContext - Erro 422 com errors detalhados, processando...');
        
        // Extrair todas as mensagens de erro de validação
        const errorMessages = [];
        const fieldErrors = {}; // Objeto para armazenar erros por campo
        let isEmailFieldError = false;
        let isCpfFieldError = false;
        let isDuplicateError = false;
        
        // Verificar se errors existe e tem chaves
        if (!error.errors || Object.keys(error.errors).length === 0) {
          console.log('🔑 AuthContext - ⚠️ errors está vazio, retornando erro genérico');
          setIsRegistering(true);
          return {
            success: false,
            error: error.message || 'Erro ao criar conta. Verifique os dados e tente novamente.',
            errors: {},
            isValidationError: true,
          };
        }
        
        Object.keys(error.errors).forEach(field => {
          const fieldName = field.toLowerCase();
          
          // Verificar se é erro no campo email
          if (fieldName === 'email' || fieldName.includes('email')) {
            isEmailFieldError = true;
          }
          
          // Verificar se é erro no campo CPF
          if (fieldName === 'cpf' || fieldName.includes('cpf')) {
            isCpfFieldError = true;
          }
          
          if (Array.isArray(errors[field])) {
            errors[field].forEach(msg => {
              // Traduzir mensagens do Laravel para português
              let translatedMsg = msg;
              const msgLower = msg.toLowerCase();
              
              // Erros de dados duplicados
              if (msgLower.includes('already been taken') || 
                  msgLower.includes('já está cadastrado') ||
                  msgLower.includes('já existe') ||
                  msgLower.includes('já está em uso') ||
                  msgLower.includes('duplicado')) {
                isDuplicateError = true;
                
                if (fieldName.includes('cpf')) {
                  translatedMsg = 'Já existe uma conta de médico com este CPF.';
                  isCpfFieldError = true;
                } else if (fieldName.includes('email')) {
                  translatedMsg = 'Este email já está cadastrado. Use outro email ou faça login.';
                  isEmailFieldError = true;
                } else if (fieldName.includes('crm')) {
                  translatedMsg = 'Este CRM já está cadastrado.';
                } else {
                  translatedMsg = `O ${field} informado já está em uso.`;
                }
              } else if (msgLower.includes('password')) {
                translatedMsg = 'A senha deve ter pelo menos 6 caracteres.';
              } else if (msgLower.includes('required')) {
                translatedMsg = `O campo ${field} é obrigatório.`;
              } else if (msgLower.includes('invalid')) {
                if (fieldName.includes('cpf')) {
                  translatedMsg = 'CPF inválido. Verifique o número informado.';
                } else if (fieldName.includes('email')) {
                  translatedMsg = 'Email inválido. Verifique o endereço informado.';
                } else {
                  translatedMsg = `O campo ${field} é inválido.`;
                }
              } else if (msgLower.includes('confirmed')) {
                translatedMsg = 'As senhas não coincidem.';
              } else if (msgLower.includes('min:')) {
                const minMatch = msg.match(/min:(\d+)/);
                if (minMatch) {
                  translatedMsg = `O campo ${field} deve ter no mínimo ${minMatch[1]} caracteres.`;
                }
              }
              
              errorMessages.push(translatedMsg);
              
              // Armazenar erro por campo para exibição específica
              if (!fieldErrors[field]) {
                fieldErrors[field] = [];
              }
              fieldErrors[field].push(translatedMsg);
            });
          } else if (errors[field]) {
            errorMessages.push(errors[field]);
            fieldErrors[field] = [errors[field]];
          }
        });
        
        // Retornar primeira mensagem ou mensagem genérica
        const finalMessage = errorMessages.length > 0 
          ? errorMessages[0] 
          : (error.message || 'Erro ao criar conta. Verifique os dados e tente novamente.');
        
        console.log('🔑 AuthContext - Mensagem final:', finalMessage);
        console.log('🔑 AuthContext - É erro de email?', isEmailFieldError);
        console.log('🔑 AuthContext - É erro de CPF?', isCpfFieldError);
        console.log('🔑 AuthContext - É erro de duplicado?', isDuplicateError);
        console.log('🔑 AuthContext - Erros por campo:', fieldErrors);
        
        // SEMPRE MANTER isRegistering=true para erros 422 (validação)
        // Isso permite que o usuário corrija os dados sem ser redirecionado
        console.log('🔑 AuthContext - ✅ ERRO 422 - Mantendo isRegistering=TRUE para preservar navegação e permitir correção');
        setIsRegistering(true); // Garantir que está true
        
        // Salvar dados do formulário se for erro de email ou CPF (dados duplicados)
        if ((isEmailFieldError || isCpfFieldError || isDuplicateError) && userData) {
          // Criar cópia completa de todos os campos do formulário
          const fullFormData = {
            name: userData.name || '',
            lastName: userData.lastName || '',
            email: userData.email || '',
            cpf: userData.cpf || '',
            phone: userData.phone || '+55',
            password: '', // Não salvar senha por segurança
            confirmPassword: '', // Não salvar senha por segurança
            profile: userData.profile || 'caregiver',
            // Campos específicos de cuidador profissional e médico
            gender: userData.gender || '',
            city: userData.city || '',
            neighborhood: userData.neighborhood || '',
            formation_details: userData.formation_details || '',
            hourly_rate: userData.hourly_rate || '',
            availability: userData.availability || '',
            // Campos específicos de médico
            crm: userData.crm || '',
            crmUf: userData.crmUf || '',
            crmNumber: userData.crmNumber || '',
            medical_specialty_id: userData.medical_specialty_id || null,
            medical_specialty_ids: userData.medical_specialty_ids || [],
          };
          console.log('🔑 AuthContext - Salvando formData COMPLETO para restaurar depois:', fullFormData);
          setSavedFormData(fullFormData);
        }
        
        return { 
          success: false, 
          error: finalMessage,
          errors: fieldErrors, // Retornar erros por campo
          isEmailError: isEmailFieldError,
          isCpfError: isCpfFieldError,
          isDuplicateError: isDuplicateError,
          isValidationError: true // Flag para indicar que é erro de validação
        };
      }
      
      // Para outros erros (não 422), limpar flag apenas se não for erro de rede/servidor
      // Se for erro 500 ou similar, manter isRegistering para não redirecionar
      if (error.status && error.status >= 500) {
        console.log('🔑 AuthContext - ⚠️ Erro de servidor - MANTENDO isRegistering=TRUE');
        setIsRegistering(true);
      } else {
        console.log('🔑 AuthContext - ⚠️ Outro tipo de erro - Limpando isRegistering');
        setIsRegistering(false);
      }
      
      return { 
        success: false, 
        error: error.message || 'Erro ao criar conta. Tente novamente.' 
      };
    } finally {
      // NÃO limpar isRegistering aqui - deixar a tela de registro limpar quando necessário
    }
  };

  // Função para limpar flag de registro (chamada pela tela de registro quando necessário)
  const clearRegistering = () => {
    console.log('🔑 AuthContext - Limpando flag isRegistering');
    setIsRegistering(false);
    setSavedFormData(null); // Limpar dados salvos também
  };
  
  // Função para obter dados salvos do formulário
  const getSavedFormData = () => {
    return savedFormData;
  };

  // Função de logout - VERSÃO ROBUSTA
  const signOut = async () => {
    try {
      console.log('🔑 AuthContext - ========== INICIANDO LOGOUT ==========');
      console.log('🔑 AuthContext - Estado ANTES do logout:', { 
        hasUser: !!user, 
        userName: user?.name,
        loading,
        signed: !!user
      });
      
      // PASSO 1: Limpar estado IMEDIATAMENTE para forçar re-render
      setUser(null);
      setLoading(false);
      setIsRegistering(false);
      console.log('🔑 AuthContext - ✅ Estado limpo (user=null, loading=false)');
      
      // PASSO 2: Limpar AsyncStorage (não esperar)
      const clearStorage = async () => {
        try {
          const keys = [
            '@lacos:user',
            '@lacos:token',
            '@lacos_patient_session',
            '@lacos:current_profile'
          ];
          
          for (const key of keys) {
            try {
              await AsyncStorage.removeItem(key);
              console.log(`🔑 AuthContext - ✅ Removido: ${key}`);
            } catch (e) {
              console.warn(`🔑 AuthContext - ⚠️ Erro ao remover ${key}:`, e);
            }
          }
          
          // Verificar se realmente foi limpo
          const remainingUser = await AsyncStorage.getItem('@lacos:user');
          const remainingToken = await AsyncStorage.getItem('@lacos:token');
          console.log('🔑 AuthContext - Verificação pós-limpeza:', {
            userRemains: !!remainingUser,
            tokenRemains: !!remainingToken
          });
        } catch (storageError) {
          console.error('❌ AuthContext - Erro ao limpar AsyncStorage:', storageError);
        }
      };
      
      // Executar limpeza de storage em paralelo (não bloquear)
      clearStorage();
      
      // PASSO 3: Chamar API de logout (não bloquear)
      const callLogoutAPI = async () => {
        try {
          await apiService.post('/logout');
          console.log('🔑 AuthContext - ✅ Logout na API bem-sucedido');
        } catch (error) {
          console.warn('⚠️ AuthContext - Erro ao fazer logout na API (continuando):', error);
        }
      };
      callLogoutAPI();
      
      // PASSO 4: Forçar delay para garantir que React atualizou
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // PASSO 5: Verificar estado final
      console.log('🔑 AuthContext - Estado APÓS logout:', { 
        hasUser: false, 
        loading: false,
        signed: false
      });
      console.log('🔑 AuthContext - ========== LOGOUT CONCLUÍDO ==========');
      
      // PASSO 6: FORÇAR NAVEGAÇÃO DIRETAMENTE para Welcome
      // IMPORTANTE: NÃO redirecionar se isRegistering=true (usuário está em processo de registro com erro)
      if (navigationRef?.current && !isRegistering) {
        setTimeout(() => {
          try {
            // Verificar rota atual antes de redirecionar
            const state = navigationRef.current.getState();
            const currentRoute = state?.routes[state?.index]?.name;
            
            // PROTEÇÃO: Se estiver em Register, NÃO redirecionar
            if (currentRoute === 'Register') {
              console.log('🔑 AuthContext - ⚠️ Estamos em Register - NÃO redirecionando para Welcome no logout');
              return;
            }
            
            console.log('🔑 AuthContext - Forçando navegação para Welcome...');
            console.log('🔑 AuthContext - isRegistering:', isRegistering, '- NÃO redirecionando se isRegistering=true');
            navigationRef.current?.reset({
              index: 0,
              routes: [{ name: 'Welcome' }],
            });
            console.log('🔑 AuthContext - ✅ Navegação resetada para Welcome');
          } catch (navError) {
            console.error('❌ AuthContext - Erro ao forçar navegação:', navError);
            // Fallback: tentar navigate APENAS se não estiver em Register
            try {
              const state = navigationRef.current.getState();
              const currentRoute = state?.routes[state?.index]?.name;
              if (currentRoute !== 'Register' && !isRegistering) {
                navigationRef.current?.navigate('Welcome');
              }
            } catch (e2) {
              console.error('❌ AuthContext - Erro no fallback de navegação:', e2);
            }
          }
        }, 100);
      } else if (isRegistering) {
        console.log('🔑 AuthContext - ⚠️ isRegistering=true - NÃO redirecionando para Welcome no logout');
      }
      
    } catch (error) {
      console.error('❌ AuthContext - ERRO CRÍTICO no logout:', error);
      
      // EM CASO DE ERRO: Forçar limpeza completa
      try {
        // Limpar storage
        await AsyncStorage.multiRemove([
          '@lacos:user',
          '@lacos:token',
          '@lacos_patient_session',
          '@lacos:current_profile'
        ]);
        
        // Limpar estado
        setUser(null);
        setLoading(false);
        setIsRegistering(false);
        
        console.log('🔑 AuthContext - ✅ Logout forçado concluído após erro');
      } catch (forceError) {
        console.error('❌ AuthContext - ERRO ao forçar logout:', forceError);
        // Última tentativa: apenas limpar estado
        setUser(null);
        setLoading(false);
      }
    }
  };

  // Função para forçar limpeza completa (debug)
  const forceLogout = async () => {
    try {
      console.log('🧹 AuthContext - FORÇANDO limpeza completa...');
      
      // Limpar TUDO do AsyncStorage
      const keys = await AsyncStorage.getAllKeys();
      console.log('🧹 Chaves encontradas:', keys);
      await AsyncStorage.multiRemove(keys);
      console.log('🧹 AsyncStorage COMPLETAMENTE limpo');
      
      setUser(null);
      setLoading(false);
      console.log('🧹 Estado resetado para inicial');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao forçar limpeza:', error);
      return { success: false, error: error.message };
    }
  };

  // Atualiza dados do usuário
  const updateUser = async (updatedData) => {
    try {
      console.log('🔄 AuthContext - updateUser chamado com:', updatedData);
      
      if (!user) {
        console.warn('⚠️ AuthContext - updateUser: user é null');
        return { success: false, error: 'Usuário não encontrado' };
      }
      
      const updatedUser = { ...user, ...updatedData };
      console.log('🔄 AuthContext - updatedUser criado:', {
        has_certificate: updatedUser.has_certificate,
        certificate_type: updatedUser.certificate_type,
        certificate_path: updatedUser.certificate_path,
      });
      
      // Verificar se updatedUser é válido antes de salvar
      if (updatedUser && typeof updatedUser === 'object') {
        await AsyncStorage.setItem('@lacos:user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        console.log('✅ AuthContext - User atualizado no estado e storage');
        return { success: true, user: updatedUser };
      } else {
        console.error('❌ AuthContext - updatedUser inválido');
        return { success: false, error: 'Dados inválidos' };
      }
    } catch (error) {
      console.error('❌ AuthContext - Erro ao atualizar usuário:', error);
      return { success: false, error: error.message };
    }
  };

  // Função de login com perfil selecionado
  const signInWithProfile = async (login, password, profileId) => {
    try {
      console.log('🔑 AuthContext - Login com perfil selecionado:', profileId);
      
      const response = await apiService.post('/login/select-profile', 
        { login, password, profile_id: profileId },
        { requiresAuth: false }
      );

      if (response && response.requires_2fa) {
        await AsyncStorage.removeItem('@lacos:user');
        await AsyncStorage.removeItem('@lacos:token');
        setUser(null);
        return {
          success: false,
          requires2FA: true,
          message: response.message || 'Código enviado via WhatsApp',
        };
      }

      if (response.token && response.user) {
        await AsyncStorage.setItem('@lacos:user', JSON.stringify(response.user));
        await AsyncStorage.setItem('@lacos:token', response.token);
        setUser(response.user);
        return { success: true };
      }

      return { success: false, error: 'Token não recebido' };
    } catch (error) {
      console.error('🔑 AuthContext - Erro no login com perfil:', error);
      return {
        success: false,
        error: error.message || 'Erro ao fazer login com perfil selecionado',
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        signed: !!user,
        user,
        loading,
        isRegistering, // Adicionar flag de registro
        savedFormData, // Dados salvos do formulário
        signIn,
        signInWithProfile,
        completeTwoFactorLogin,
        signUp,
        signOut,
        updateUser,
        forceLogout,
        clearRegistering, // Função para limpar flag
        getSavedFormData, // Função para obter dados salvos
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook customizado para usar o contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  
  return context;
};


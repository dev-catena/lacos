                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../services/apiService';

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
  const signIn = async (email, password) => {
    try {
      console.log('🔑 AuthContext - Iniciando login...');
      
      // Chamada à API real
      const response = await apiService.post('/login', 
        { email, password },
        { requiresAuth: false }
      );

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
      if (error.status === 422 && error.errors) {
        console.log('🔑 AuthContext - Erro 422 detectado, errors:', error.errors);
        
        // Extrair todas as mensagens de erro de validação
        const errorMessages = [];
        let isEmailFieldError = false;
        
        Object.keys(error.errors).forEach(field => {
          // Verificar se é erro no campo email
          if (field === 'email' || field.toLowerCase().includes('email')) {
            isEmailFieldError = true;
          }
          
          if (Array.isArray(error.errors[field])) {
            error.errors[field].forEach(msg => {
              // Traduzir mensagens do Laravel para português
              let translatedMsg = msg;
              if (msg.includes('email has already been taken') || 
                  msg.includes('email já está em uso') ||
                  msg.includes('has already been taken') ||
                  msg.toLowerCase().includes('already been taken')) {
                translatedMsg = 'Este email já está cadastrado. Use outro email ou faça login.';
                isEmailFieldError = true;
              } else if (msg.includes('password')) {
                translatedMsg = 'A senha deve ter pelo menos 6 caracteres.';
              } else if (msg.includes('required')) {
                translatedMsg = `O campo ${field} é obrigatório.`;
              } else if (msg.includes('invalid')) {
                translatedMsg = `O campo ${field} é inválido.`;
              }
              errorMessages.push(translatedMsg);
            });
          } else if (error.errors[field]) {
            errorMessages.push(error.errors[field]);
          }
        });
        
        // Retornar primeira mensagem ou mensagem genérica
        const finalMessage = errorMessages.length > 0 
          ? errorMessages[0] 
          : (error.message || 'Erro ao criar conta. Verifique os dados e tente novamente.');
        
        console.log('🔑 AuthContext - Mensagem final:', finalMessage, 'É erro de email?', isEmailFieldError);
        
        // Se for erro de email, MANTER isRegistering=true explicitamente E salvar dados do formulário
        if (isEmailFieldError) {
          console.log('🔑 AuthContext - ✅ ERRO DE EMAIL - Mantendo isRegistering=TRUE para preservar navegação');
          setIsRegistering(true); // Garantir que está true
          // Salvar TODOS os dados do formulário para restaurar depois (caso componente seja remontado)
          if (userData) {
            // Criar cópia completa de todos os campos do formulário
            const fullFormData = {
              name: userData.name || '',
              lastName: userData.lastName || '',
              email: userData.email || '',
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
              medical_specialty_id: userData.medical_specialty_id || null,
            };
            console.log('🔑 AuthContext - Salvando formData COMPLETO para restaurar depois:', fullFormData);
            setSavedFormData(fullFormData);
          }
        } else {
          console.log('🔑 AuthContext - ⚠️ Erro não é de email - Limpando isRegistering');
          setIsRegistering(false); // Só limpar se não for erro de email
          setSavedFormData(null); // Limpar dados salvos
        }
        
        return { 
          success: false, 
          error: finalMessage,
          isEmailError: isEmailFieldError // Adicionar flag para facilitar detecção
        };
      }
      
      setIsRegistering(false); // Outros erros, limpar flag
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

  // Função de logout
  const signOut = async () => {
    try {
      console.log('🔑 AuthContext - Iniciando logout...');
      setLoading(true);
      
      // Chamar API de logout (se houver token)
      try {
        await apiService.post('/logout');
        console.log('🔑 AuthContext - Logout na API bem-sucedido');
      } catch (error) {
        console.warn('⚠️ AuthContext - Erro ao fazer logout na API:', error);
        // Continua o logout local mesmo se falhar na API
      }

      // Remove TODOS os dados do AsyncStorage relacionados à sessão
      await AsyncStorage.removeItem('@lacos:user');
      await AsyncStorage.removeItem('@lacos:token');
      await AsyncStorage.removeItem('@lacos_patient_session');
      await AsyncStorage.removeItem('@lacos:current_profile');
      console.log('🔑 AuthContext - AsyncStorage limpo');

      setUser(null);
      console.log('🔑 AuthContext - User removido, signed agora é false');
    } catch (error) {
      console.error('❌ AuthContext - Erro ao fazer logout:', error);
    } finally {
      setLoading(false);
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
      // Atualizar no servidor (se necessário)
      // TODO: Implementar endpoint de atualização de perfil
      
      if (!user) {
        return { success: false, error: 'Usuário não encontrado' };
      }
      
      const updatedUser = { ...user, ...updatedData };
      
      // Verificar se updatedUser é válido antes de salvar
      if (updatedUser && typeof updatedUser === 'object') {
        await AsyncStorage.setItem('@lacos:user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        return { success: true };
      } else {
        return { success: false, error: 'Dados inválidos' };
      }
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      return { success: false, error: error.message };
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


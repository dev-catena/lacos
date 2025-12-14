import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../services/apiService';

// Criação do contexto
export const AuthContext = createContext({});

// Provider do contexto de autenticação
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
      setLoading(true);
      
      // Chamada à API real
      const response = await apiService.post('/login', 
        { email, password },
        { requiresAuth: false }
      );

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
    } finally {
      setLoading(false);
    }
  };

  // Função de cadastro
  const signUp = async (userData) => {
    try {
      console.log('🔑 AuthContext - Iniciando cadastro...');
      setLoading(true);
      
      // Preparar dados para API
      const registerData = {
        name: `${userData.name} ${userData.lastName || ''}`.trim(),
        email: userData.email,
        password: userData.password,
        password_confirmation: userData.password,
        phone: userData.phone,
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
        // Extrair todas as mensagens de erro de validação
        const errorMessages = [];
        Object.keys(error.errors).forEach(field => {
          if (Array.isArray(error.errors[field])) {
            error.errors[field].forEach(msg => {
              // Traduzir mensagens do Laravel para português
              let translatedMsg = msg;
              if (msg.includes('email has already been taken') || msg.includes('email já está em uso')) {
                translatedMsg = 'Este email já está cadastrado. Use outro email ou faça login.';
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
        
        return { 
          success: false, 
          error: finalMessage
        };
      }
      
      return { 
        success: false, 
        error: error.message || 'Erro ao criar conta. Tente novamente.' 
      };
    } finally {
      setLoading(false);
    }
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
        signIn,
        signUp,
        signOut,
        updateUser,
        forceLogout,
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


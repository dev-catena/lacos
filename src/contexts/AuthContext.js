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

      // Salva no AsyncStorage
      await AsyncStorage.setItem('@lacos:user', JSON.stringify(response.user));
      await AsyncStorage.setItem('@lacos:token', response.token);

      setUser(response.user);
      console.log('🔑 AuthContext - User setado, signed agora é true');
      return { success: true };
    } catch (error) {
      console.error('🔑 AuthContext - Erro no login:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao fazer login. Verifique suas credenciais.' 
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
      };

      // Chamada à API real
      const response = await apiService.post('/register', 
        registerData,
        { requiresAuth: false }
      );

      console.log('🔑 AuthContext - Cadastro bem-sucedido:', response.user.name);

      // Salva no AsyncStorage
      await AsyncStorage.setItem('@lacos:user', JSON.stringify(response.user));
      await AsyncStorage.setItem('@lacos:token', response.token);

      setUser(response.user);
      console.log('🔑 AuthContext - User setado após cadastro, signed agora é true');
      return { success: true };
    } catch (error) {
      console.error('🔑 AuthContext - Erro no cadastro:', error);
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
      
      const updatedUser = { ...user, ...updatedData };
      await AsyncStorage.setItem('@lacos:user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return { success: true };
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


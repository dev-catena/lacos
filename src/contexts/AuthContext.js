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
      const storedUser = await AsyncStorage.getItem('@lacos:user');
      const storedToken = await AsyncStorage.getItem('@lacos:token');

      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        // Validar token com o servidor (opcional)
        try {
          const response = await apiService.get('/user');
          setUser(response);
        } catch (error) {
          // Token inválido, limpar dados
          console.warn('Token inválido, fazendo logout...');
          await signOut();
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados do storage:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função de login
  const signIn = async (email, password) => {
    try {
      setLoading(true);
      
      // Chamada à API real
      const response = await apiService.post('/login', 
        { email, password },
        { requiresAuth: false }
      );

      // Salva no AsyncStorage
      await AsyncStorage.setItem('@lacos:user', JSON.stringify(response.user));
      await AsyncStorage.setItem('@lacos:token', response.token);

      setUser(response.user);
      return { success: true };
    } catch (error) {
      console.error('Erro no login:', error);
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

      // Salva no AsyncStorage
      await AsyncStorage.setItem('@lacos:user', JSON.stringify(response.user));
      await AsyncStorage.setItem('@lacos:token', response.token);

      setUser(response.user);
      return { success: true };
    } catch (error) {
      console.error('Erro no cadastro:', error);
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
      setLoading(true);
      
      // Chamar API de logout (se houver token)
      try {
        await apiService.post('/logout');
      } catch (error) {
        console.warn('Erro ao fazer logout na API:', error);
        // Continua o logout local mesmo se falhar na API
      }

      // Remove TODOS os dados do AsyncStorage relacionados à sessão
      await AsyncStorage.removeItem('@lacos:user');
      await AsyncStorage.removeItem('@lacos:token');
      await AsyncStorage.removeItem('@lacos_patient_session'); // Remove sessão do paciente também

      setUser(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      setLoading(false);
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


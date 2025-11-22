import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      
      // TODO: Implementar chamada à API real
      // Por enquanto, apenas simulação
      const mockUser = {
        id: '1',
        name: 'Usuário Teste',
        email: email,
        groups: [],
      };
      
      const mockToken = 'mock-token-123';

      // Salva no AsyncStorage
      await AsyncStorage.setItem('@lacos:user', JSON.stringify(mockUser));
      await AsyncStorage.setItem('@lacos:token', mockToken);

      setUser(mockUser);
      return { success: true };
    } catch (error) {
      console.error('Erro no login:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Função de cadastro
  const signUp = async (userData) => {
    try {
      setLoading(true);
      
      // TODO: Implementar chamada à API real
      // Simulação de criação de conta
      const newUser = {
        id: Date.now().toString(),
        name: userData.name,
        lastName: userData.lastName,
        email: userData.email,
        phone: userData.phone,
        birthDate: userData.birthDate,
        gender: userData.gender,
        groups: [],
      };
      
      const mockToken = 'mock-token-456';

      // Salva no AsyncStorage
      await AsyncStorage.setItem('@lacos:user', JSON.stringify(newUser));
      await AsyncStorage.setItem('@lacos:token', mockToken);

      setUser(newUser);
      return { success: true };
    } catch (error) {
      console.error('Erro no cadastro:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Função de logout
  const signOut = async () => {
    try {
      setLoading(true);
      
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


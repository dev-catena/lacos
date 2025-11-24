import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

import { useAuth } from '../contexts/AuthContext';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import colors from '../constants/colors';

const RootNavigator = () => {
  const { signed, loading, user } = useAuth();

  // Debug: Log do estado de autenticação
  useEffect(() => {
    console.log('🔐 RootNavigator - Estado:', {
      signed,
      loading,
      hasUser: !!user,
      userName: user?.name,
    });
    
    // ALERTA: Se signed=true mas não tem user, algo está errado
    if (signed && !user) {
      console.error('❌ ERRO CRÍTICO: signed=true mas user é null!');
    }
  }, [signed, loading, user]);

  // Exibe tela de loading enquanto verifica autenticação
  if (loading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: colors.background,
      }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.gray600 }}>
          Verificando autenticação...
        </Text>
      </View>
    );
  }

  // GUARD: FORÇAR autenticação
  // Só renderiza AppNavigator se signed=true E user existe
  const isAuthenticated = signed && user !== null;
  
  console.log(`🔐 RootNavigator - isAuthenticated: ${isAuthenticated}`);
  console.log(`🔐 RootNavigator - Renderizando: ${isAuthenticated ? 'AppNavigator (Autenticado)' : 'AuthNavigator (Não autenticado)'}`);
  
  // PROTEÇÃO: Mesmo que signed seja true, se não tem user, mostrar login
  if (!isAuthenticated) {
    return <AuthNavigator />;
  }
  
  return <AppNavigator />;
};

export default RootNavigator;


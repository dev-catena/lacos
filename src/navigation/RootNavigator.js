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

  // Renderiza AuthNavigator se não estiver autenticado
  // Renderiza AppNavigator se estiver autenticado
  console.log(`🔐 RootNavigator - Renderizando: ${signed ? 'AppNavigator (Autenticado)' : 'AuthNavigator (Não autenticado)'}`);
  return signed ? <AppNavigator /> : <AuthNavigator />;
};

export default RootNavigator;


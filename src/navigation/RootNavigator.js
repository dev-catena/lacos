import React from 'react';
import { View, ActivityIndicator } from 'react-native';

import { useAuth } from '../contexts/AuthContext';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import colors from '../constants/colors';

const RootNavigator = () => {
  const { signed, loading } = useAuth();

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
      </View>
    );
  }

  // Renderiza AuthNavigator se não estiver autenticado
  // Renderiza AppNavigator se estiver autenticado
  return signed ? <AppNavigator /> : <AuthNavigator />;
};

export default RootNavigator;


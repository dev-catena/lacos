import React, { useEffect, useRef, useMemo } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { navigationRef } from '../../App';

import { useAuth } from '../contexts/AuthContext';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import colors from '../constants/colors';

const RootNavigator = () => {
  const { signed, loading, user, isRegistering } = useAuth();
  
  // Usar useRef para preservar a instância do AuthNavigator
  // Isso evita que o componente seja remontado e perca o estado de navegação
  const authNavigatorRef = useRef(null);
  
  if (!authNavigatorRef.current) {
    console.log('🔐 RootNavigator - Criando AuthNavigator pela primeira vez');
    authNavigatorRef.current = <AuthNavigator key="auth-navigator-stable" />;
  }

  // Debug: Log do estado de autenticação
  useEffect(() => {
    console.log('🔐 RootNavigator - Estado:', {
      signed,
      loading,
      hasUser: !!user,
      userName: user?.name,
      isRegistering, // Adicionar flag de registro
    });
    
    // ALERTA: Se signed=true mas não tem user, algo está errado
    if (signed && !user) {
      console.error('❌ ERRO CRÍTICO: signed=true mas user é null!');
    }
  }, [signed, loading, user, isRegistering]);

  // SOLUÇÃO RADICAL: Forçar navegação para Register se isRegistering=true e não estiver lá
  // IMPORTANTE: Este useEffect DEVE estar fora de qualquer condicional para seguir as regras dos hooks
  useEffect(() => {
    if (isRegistering && navigationRef?.current) {
      const timeout = setTimeout(() => {
        try {
          const state = navigationRef.current.getState();
          const currentRoute = state?.routes[state?.index]?.name;
          console.log('🔐 RootNavigator - Rota atual quando isRegistering=true:', currentRoute);
          
          if (currentRoute !== 'Register') {
            console.log('🔐 RootNavigator - ⚠️ Não estamos em Register, forçando navegação...');
            navigationRef.current.navigate('Register');
          }
        } catch (e) {
          console.error('🔐 RootNavigator - Erro ao verificar/forçar navegação:', e);
        }
      }, 100);
      
      return () => clearTimeout(timeout);
    }
  }, [isRegistering]);

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
  
  console.log(`🔐 RootNavigator - isAuthenticated: ${isAuthenticated}, isRegistering: ${isRegistering}`);
  console.log(`🔐 RootNavigator - Renderizando: ${isAuthenticated ? 'AppNavigator (Autenticado)' : 'AuthNavigator (Não autenticado)'}`);
  
  // PROTEÇÃO: Se estamos em processo de registro, SEMPRE mostrar AuthNavigator
  // Isso evita que o RootNavigator reset a navegação quando há erro de email
  if (isRegistering) {
    console.log('🔐 RootNavigator - isRegistering=true, mantendo AuthNavigator para preservar navegação');
    return authNavigatorRef.current;
  }
  
  // PROTEÇÃO: Mesmo que signed seja true, se não tem user, mostrar login
  if (!isAuthenticated) {
    console.log('🔐 RootNavigator - Usuário não autenticado, renderizando AuthNavigator preservado');
    // Usar o AuthNavigator preservado para manter estado de navegação
    return authNavigatorRef.current;
  }
  
  return <AppNavigator />;
};

export default RootNavigator;


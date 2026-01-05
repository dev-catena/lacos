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
  const prevSignedRef = useRef(signed);
  
  // Se o estado de autenticação mudou (logout), recriar AuthNavigator
  if (prevSignedRef.current !== signed) {
    console.log('🔐 RootNavigator - Estado de autenticação mudou!', {
      prevSigned: prevSignedRef.current,
      currentSigned: signed
    });
    prevSignedRef.current = signed;
    
    // Se deslogou, recriar AuthNavigator para garantir navegação limpa
    if (!signed) {
      console.log('🔐 RootNavigator - Usuário deslogou, recriando AuthNavigator');
      authNavigatorRef.current = <AuthNavigator key={`auth-navigator-${Date.now()}`} />;
    }
  }
  
  if (!authNavigatorRef.current) {
    console.log('🔐 RootNavigator - Criando AuthNavigator pela primeira vez');
    authNavigatorRef.current = <AuthNavigator key="auth-navigator-stable" />;
  }

  // Debug: Log do estado de autenticação
  useEffect(() => {
    const isAuthenticated = signed && user !== null;
    console.log('🔐 RootNavigator - Estado:', {
      signed,
      loading,
      hasUser: !!user,
      userName: user?.name,
      isRegistering,
      isAuthenticated,
    });
    
    // ALERTA: Se signed=true mas não tem user, algo está errado
    if (signed && !user) {
      console.error('❌ ERRO CRÍTICO: signed=true mas user é null!');
    }
    
    // AÇÃO CRÍTICA: Se usuário deslogou, forçar navegação para Welcome
    // IMPORTANTE: NÃO redirecionar se isRegistering=true (usuário está em processo de registro)
    // PROTEÇÃO EXTRA: Verificar também a rota atual antes de redirecionar
    if (!signed && !loading && !isRegistering && !user) {
      console.log('🔐 RootNavigator - ✅ Usuário deslogado detectado!');
      console.log('🔐 RootNavigator - isRegistering:', isRegistering, '- NÃO redirecionando se isRegistering=true');
      
      // Forçar reset da navegação para Welcome APENAS se não estiver em registro
      if (navigationRef?.current && !isRegistering) {
        setTimeout(() => {
          try {
            const state = navigationRef.current.getState();
            const currentRoute = state?.routes[state?.index]?.name;
            console.log('🔐 RootNavigator - Rota atual:', currentRoute);
            
            // PROTEÇÃO EXTRA: Se estiver em Register, NÃO redirecionar (mesmo que isRegistering seja false)
            if (currentRoute === 'Register') {
              console.log('🔐 RootNavigator - ⚠️ Estamos em Register - NÃO redirecionando para Welcome');
              return;
            }
            
            if (currentRoute !== 'Welcome') {
              console.log('🔐 RootNavigator - ⚠️ Não estamos em Welcome, forçando reset...');
              navigationRef.current.reset({
                index: 0,
                routes: [{ name: 'Welcome' }],
              });
              console.log('🔐 RootNavigator - ✅ Navegação resetada para Welcome');
            }
          } catch (e) {
            console.error('🔐 RootNavigator - Erro ao forçar navegação:', e);
            // Tentar navigate como fallback APENAS se não estiver em Register
            try {
              const state = navigationRef.current.getState();
              const currentRoute = state?.routes[state?.index]?.name;
              if (currentRoute !== 'Register') {
                navigationRef.current.navigate('Welcome');
              }
            } catch (e2) {
              console.error('🔐 RootNavigator - Erro ao navegar para Welcome:', e2);
            }
          }
        }, 300);
      } else if (isRegistering) {
        console.log('🔐 RootNavigator - ⚠️ isRegistering=true - NÃO redirecionando para Welcome');
      }
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
    console.log('🔐 RootNavigator - ✅ Usuário NÃO autenticado, renderizando AuthNavigator');
    console.log('🔐 RootNavigator - Detalhes:', {
      signed,
      hasUser: !!user,
      loading,
      isRegistering
    });
    
    // Forçar renderização do AuthNavigator
    // Se authNavigatorRef.current não existe, criar agora
    if (!authNavigatorRef.current) {
      console.log('🔐 RootNavigator - Criando AuthNavigator na hora (fallback)');
      authNavigatorRef.current = <AuthNavigator key={`auth-navigator-fallback-${Date.now()}`} />;
    }
    
    return authNavigatorRef.current;
  }
  
  console.log('🔐 RootNavigator - ✅ Usuário autenticado, renderizando AppNavigator');
  return <AppNavigator />;
};

export default RootNavigator;


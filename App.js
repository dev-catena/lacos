import 'react-native-gesture-handler';
// IMPORTANTE: Pusher será inicializado de forma lazy para evitar erros durante a inicialização
// import './src/config/pusher-init'; // Comentado temporariamente para evitar erro de protocol
import React, { useEffect, useState } from 'react';
import { Linking, Platform, View, ActivityIndicator, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';
import Toast from 'react-native-toast-message';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import colors from './src/constants/colors';

// Manter splash screen visível enquanto carrega fontes
SplashScreen.preventAutoHideAsync();

// Criar navigationRef para preservar estado de navegação
export const navigationRef = React.createRef();

// Função para extrair código de convite da URL
// Suporta: lacos.com (produção) e 192.168.1.105 (desenvolvimento local)
// IMPORTANTE: Ignora URLs do Expo (exp://, exp+://) para não interferir com Expo Go
const extractInviteCodeFromUrl = (url) => {
  if (!url) return null;
  
  try {
    // IGNORAR URLs do Expo Go ANTES de tentar criar URL object
    // Isso evita erro "Cannot assign to property 'protocol'"
    if (url.startsWith('exp://') || url.startsWith('exp+://') || url.startsWith('exps://')) {
      console.log('🔗 Deep Link - URL do Expo ignorada (não é deep link de convite):', url);
      return null;
    }
    
    // Só criar URL object para URLs HTTP/HTTPS válidas ou lacos://
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('lacos://')) {
      return null;
    }
    
    const urlObj = new URL(url);
    
    // Verificar se é um domínio/host suportado
    const supportedHosts = [
      'lacos.com',
      'www.lacos.com',
      '192.168.1.105',
      'localhost',
      '127.0.0.1'
    ];
    
    const host = urlObj.hostname.toLowerCase();
    const isSupportedHost = supportedHosts.some(supported => 
      host === supported || host.endsWith('.' + supported)
    );
    
    // Se não for um host suportado e não for o scheme lacos://, ignorar
    if (!isSupportedHost && urlObj.protocol !== 'lacos:') {
      console.log('🔗 Deep Link - Host não suportado:', host);
      return null;
    }
    
    // Formato: https://lacos.com/grupo/ABC123 ou http://192.168.1.105/grupo/ABC123
    const pathMatch = urlObj.pathname.match(/\/(grupo|join)\/([A-Z0-9]+)/i);
    if (pathMatch && pathMatch[2]) {
      return pathMatch[2];
    }
    
    // Formato: https://lacos.com/join?code=ABC123 ou http://192.168.1.105/join?code=ABC123
    const codeParam = urlObj.searchParams.get('code');
    if (codeParam) {
      return codeParam;
    }
    
    // Formato: lacos://grupo/ABC123 ou lacos://join?code=ABC123
    if (urlObj.protocol === 'lacos:') {
      const pathMatch = urlObj.pathname.match(/\/(grupo|join)\/([A-Z0-9]+)/i);
      if (pathMatch && pathMatch[2]) {
        return pathMatch[2];
      }
      const codeParam = urlObj.searchParams.get('code');
      if (codeParam) {
        return codeParam;
      }
    }
    
    // Se a URL contém apenas o código (ex: https://lacos.com/ABC123 ou http://192.168.1.105/ABC123)
    const simpleCodeMatch = urlObj.pathname.match(/^\/([A-Z0-9]{6,20})$/i);
    if (simpleCodeMatch && simpleCodeMatch[1]) {
      return simpleCodeMatch[1];
    }
    
    console.log('🔗 Deep Link - Não foi possível extrair código da URL:', url);
    return null;
  } catch (error) {
    console.error('🔗 Deep Link - Erro ao processar URL:', error);
    return null;
  }
};

// Componente interno para processar deep links
const DeepLinkHandler = () => {
  const { signed, user } = useAuth();
  
  // Processar código pendente quando o usuário faz login
  useEffect(() => {
    if (signed && user && global.pendingInviteCode) {
      const code = global.pendingInviteCode;
      console.log('🔗 Deep Link - Processando código pendente após login:', code);
      
      // Aguardar um pouco para garantir que a navegação está pronta
      setTimeout(() => {
        handleDeepLinkNavigation(code);
        // Limpar código pendente após processar
        global.pendingInviteCode = undefined;
      }, 1500);
    }
  }, [signed, user]);
  
  useEffect(() => {
    // Processar URL inicial quando o app é aberto
    // IMPORTANTE: Não processar URLs do Expo (exp://) - essas são para o Expo Go funcionar
    // Só processar deep links de convite (HTTP/HTTPS específicos)
    const handleInitialUrl = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          // IGNORAR COMPLETAMENTE URLs do Expo Go - não são deep links de convite
          if (initialUrl.startsWith('exp://') || initialUrl.startsWith('exp+')) {
            // Não fazer nada - deixar Expo Go funcionar normalmente
            return;
          }
          
          // Só processar se for uma URL HTTP/HTTPS de convite
          console.log('🔗 Deep Link - URL inicial detectada:', initialUrl);
          const code = extractInviteCodeFromUrl(initialUrl);
          if (code) {
            console.log('🔗 Deep Link - Código extraído:', code);
            // Aguardar um pouco para garantir que a navegação está pronta
            setTimeout(() => {
              handleDeepLinkNavigation(code);
            }, 1000);
          }
        }
      } catch (error) {
        // Silenciar erros para não interferir com Expo Go
        // console.error('🔗 Deep Link - Erro ao obter URL inicial:', error);
      }
    };
    
    // Processar URLs quando o app já está aberto
    // IMPORTANTE: Ignorar URLs do Expo (exp://) - essas são para o Expo Go funcionar
    // Só processar deep links de convite (HTTP/HTTPS específicos)
    const handleUrlChange = (event) => {
      const { url } = event;
      
      // IGNORAR COMPLETAMENTE URLs do Expo Go - não são deep links de convite
      if (url.startsWith('exp://') || url.startsWith('exp+')) {
        // Não fazer nada - deixar Expo Go funcionar normalmente
        return;
      }
      
      // Só processar se for uma URL HTTP/HTTPS de convite
      console.log('🔗 Deep Link - URL recebida:', url);
      const code = extractInviteCodeFromUrl(url);
      if (code) {
        console.log('🔗 Deep Link - Código extraído:', code);
        handleDeepLinkNavigation(code);
      }
    };
    
    // Função para navegar com o código
    const handleDeepLinkNavigation = (code) => {
      if (!navigationRef.current) {
        console.log('🔗 Deep Link - NavigationRef não está pronto, aguardando...');
        setTimeout(() => handleDeepLinkNavigation(code), 500);
        return;
      }
      
      try {
        const state = navigationRef.current.getState();
        const currentRoute = state?.routes[state?.index]?.name;
        console.log('🔗 Deep Link - Rota atual:', currentRoute);
        
        // Se o usuário está autenticado, navegar para a tela de grupos
        if (signed && user) {
          // Verificar se está na tela de grupos ou pode navegar
          if (currentRoute === 'Groups' || currentRoute === 'GroupsTabs') {
            // Navegar para Groups com parâmetro para abrir modal
            navigationRef.current.navigate('Groups', { 
              inviteCode: code,
              openModal: true 
            });
          } else {
            // Tentar navegar para Groups
            navigationRef.current.navigate('Groups', { 
              inviteCode: code,
              openModal: true 
            });
          }
          
          Toast.show({
            type: 'info',
            text1: 'Código de convite detectado',
            text2: 'Abrindo tela de grupos...',
          });
        } else {
          // Se não está autenticado, salvar o código para usar depois do login
          console.log('🔗 Deep Link - Usuário não autenticado, código será usado após login');
          // Armazenar temporariamente
          global.pendingInviteCode = code;
          
          Toast.show({
            type: 'info',
            text1: 'Código de convite recebido',
            text2: 'Faça login para entrar no grupo',
            visibilityTime: 4000,
          });
        }
      } catch (error) {
        console.error('🔗 Deep Link - Erro ao navegar:', error);
      }
    };
    
    // Configurar listeners
    handleInitialUrl();
    
    const subscription = Linking.addEventListener('url', handleUrlChange);
    
    return () => {
      subscription.remove();
    };
  }, [signed, user]);
  
  return null;
};

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [fontError, setFontError] = useState(null);

  // Carregar fontes de ícones (crítico para Android)
  useEffect(() => {
    async function loadFonts() {
      try {
        console.log('🔤 Carregando fontes de ícones...');
        // Carregar fontes do Ionicons
        await Font.loadAsync({
          ...Ionicons.font,
        });
        console.log('✅ Fontes de ícones carregadas com sucesso');
        setFontsLoaded(true);
        // Esconder splash screen quando fontes carregarem
        await SplashScreen.hideAsync();
      } catch (error) {
        console.error('❌ Erro ao carregar fontes de ícones:', error);
        setFontError(error);
        setFontsLoaded(true); // Continuar mesmo com erro
        await SplashScreen.hideAsync();
      }
    }

    loadFonts();
  }, []);

  // Mostrar loading enquanto fontes não carregam
  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.text }}>Carregando fontes...</Text>
      </View>
    );
  }

  // Se houver erro ao carregar fontes, logar mas continuar (pode funcionar mesmo assim)
  if (fontError) {
    console.warn('⚠️ Erro ao carregar fontes de ícones, continuando mesmo assim:', fontError);
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AuthProvider>
            <NavigationContainer 
              ref={navigationRef}
              onReady={() => {
                console.log('🧭 NavigationContainer pronto');
              }}
              onStateChange={(state) => {
                // Preservar estado de navegação
                const currentRoute = state?.routes[state?.index]?.name;
                console.log('🧭 NavigationContainer - Rota atual:', currentRoute);
              }}
            >
              <DeepLinkHandler />
              <RootNavigator />
              <Toast />
            </NavigationContainer>
          </AuthProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}



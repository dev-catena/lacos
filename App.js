import 'react-native-gesture-handler';
// IMPORTANTE: Inicializar Pusher globalmente antes de qualquer outro import
import './src/config/pusher-init';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { AuthProvider } from './src/contexts/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';

// Criar navigationRef para preservar estado de navegação
export const navigationRef = React.createRef();

export default function App() {
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
              <RootNavigator />
              <Toast />
            </NavigationContainer>
          </AuthProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}


import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Importa as telas de autenticação
import WelcomeScreen from '../screens/Auth/WelcomeScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import TwoFactorScreen from '../screens/Auth/TwoFactorScreen';

// Importa as telas do paciente (mantidas por compatibilidade)
import PatientLoginScreen from '../screens/Patient/PatientLoginScreen';
import PatientNavigator from './PatientNavigator';

const Stack = createStackNavigator();

const AuthNavigator = () => {
  // O initialRouteName só é usado na primeira renderização
  // Como o componente está memoizado no RootNavigator, o estado de navegação é preservado
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#ffffff' },
      }}
      initialRouteName="Welcome"
    >
      {/* Nova tela inicial */}
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="TwoFactor" component={TwoFactorScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      
      {/* Mantido por compatibilidade (acesso simplificado para pacientes) */}
      <Stack.Screen name="PatientLogin" component={PatientLoginScreen} />
      <Stack.Screen name="PatientApp" component={PatientNavigator} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;


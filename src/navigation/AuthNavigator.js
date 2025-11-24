import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Importa as telas de autenticação
import WelcomeScreen from '../screens/Auth/WelcomeScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';

// Importa as telas do paciente (mantidas por compatibilidade)
import PatientLoginScreen from '../screens/Patient/PatientLoginScreen';
import PatientNavigator from './PatientNavigator';

const Stack = createStackNavigator();

const AuthNavigator = () => {
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
      <Stack.Screen name="Register" component={RegisterScreen} />
      
      {/* Mantido por compatibilidade (acesso simplificado para pacientes) */}
      <Stack.Screen name="PatientLogin" component={PatientLoginScreen} />
      <Stack.Screen name="PatientApp" component={PatientNavigator} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;


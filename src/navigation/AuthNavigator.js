import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Importa as telas de autenticação
import ProfileSelectionScreen from '../screens/Auth/ProfileSelectionScreen';
import WelcomeScreen from '../screens/Auth/WelcomeScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import RegisterPatientScreen from '../screens/Auth/RegisterPatientScreen';

// Importa as telas do paciente
import PatientLoginScreen from '../screens/Patient/PatientLoginScreen';
import PatientNavigator from './PatientNavigator';
import colors from '../constants/colors';

const Stack = createStackNavigator();
const PATIENT_SESSION_KEY = '@lacos_patient_session';

const AuthNavigator = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasPatientSession, setHasPatientSession] = useState(false);

  useEffect(() => {
    checkPatientSession();
  }, []);

  const checkPatientSession = async () => {
    try {
      const sessionJson = await AsyncStorage.getItem(PATIENT_SESSION_KEY);
      if (sessionJson) {
        const session = JSON.parse(sessionJson);
        // Verificar se a sessão é válida
        if (session.groupId && session.loginTime) {
          setHasPatientSession(true);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar sessão do paciente:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
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

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#ffffff' },
      }}
      initialRouteName={hasPatientSession ? "PatientApp" : "ProfileSelection"}
    >
      <Stack.Screen name="ProfileSelection" component={ProfileSelectionScreen} />
      <Stack.Screen name="PatientLogin" component={PatientLoginScreen} />
      <Stack.Screen name="PatientApp" component={PatientNavigator} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="RegisterPatient" component={RegisterPatientScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;


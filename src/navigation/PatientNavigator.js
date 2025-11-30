import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Platform } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '../constants/colors';
import groupService from '../services/groupService';

import PatientHomeScreen from '../screens/Patient/PatientHomeScreen';
import AppointmentDetailsScreen from '../screens/Patient/AppointmentDetailsScreen';
import RecordingScreen from '../screens/Patient/RecordingScreen';
import PatientProfileScreen from '../screens/Patient/PatientProfileScreen';
import PatientJoinGroupScreen from '../screens/Patient/PatientJoinGroupScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Navigator para Home e Perfil
const PatientTabNavigator = () => {
  const insets = useSafeAreaInsets();
  
  // Calcular altura do tab bar considerando a barra de navegação do Android
  const tabBarHeight = 60;
  const tabBarPaddingBottom = Platform.OS === 'android' 
    ? Math.max(insets.bottom, 8) // Usar o inset do Android ou mínimo de 8
    : 8;
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray400,
        tabBarStyle: {
          backgroundColor: colors.backgroundLight,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: tabBarHeight + tabBarPaddingBottom,
          paddingBottom: tabBarPaddingBottom,
          paddingTop: 5,
          elevation: 8,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
        tabBarItemStyle: {
          paddingVertical: 0,
          gap: 2,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'PatientHomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'PatientProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="PatientHomeTab" 
        component={PatientHomeScreen}
        options={{ tabBarLabel: 'Início' }}
      />
      <Tab.Screen 
        name="PatientProfileTab" 
        component={PatientProfileScreen}
        options={{ tabBarLabel: 'Perfil' }}
      />
    </Tab.Navigator>
  );
};

// Stack Navigator principal com verificação de grupo
const PatientNavigator = () => {
  const [loading, setLoading] = useState(true);
  const [hasGroup, setHasGroup] = useState(false);

  useEffect(() => {
    checkPatientGroup();
  }, []);

  const checkPatientGroup = async () => {
    try {
      console.log('🔍 PatientNavigator - Verificando se paciente tem grupo...');
      
      const result = await groupService.getMyGroups();
      
      if (result.success && result.data && result.data.length > 0) {
        console.log('✅ PatientNavigator - Paciente tem grupo:', result.data[0].name);
        setHasGroup(true);
      } else {
        console.log('⚠️ PatientNavigator - Paciente SEM grupo, precisa entrar com código');
        setHasGroup(false);
      }
    } catch (error) {
      console.error('❌ PatientNavigator - Erro ao verificar grupos:', error);
      setHasGroup(false);
    } finally {
      setLoading(false);
    }
  };

  // Mostrar loading enquanto verifica
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator 
      screenOptions={{ headerShown: false }}
      initialRouteName={hasGroup ? 'PatientTabs' : 'PatientJoinGroup'}
    >
      {/* Tela de entrada com código (se não tiver grupo) */}
      <Stack.Screen 
        name="PatientJoinGroup" 
        component={PatientJoinGroupScreen}
      />
      
      {/* Tabs principais (se já tiver grupo) */}
      <Stack.Screen 
        name="PatientTabs" 
        component={PatientTabNavigator} 
      />
      
      {/* Outras telas */}
      <Stack.Screen 
        name="AppointmentDetails" 
        component={AppointmentDetailsScreen} 
      />
      <Stack.Screen 
        name="RecordingScreen" 
        component={RecordingScreen} 
      />
    </Stack.Navigator>
  );
};

export default PatientNavigator;


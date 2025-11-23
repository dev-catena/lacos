import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import colors from '../constants/colors';

import PatientHomeScreen from '../screens/Patient/PatientHomeScreen';
import AppointmentDetailsScreen from '../screens/Patient/AppointmentDetailsScreen';
import RecordingScreen from '../screens/Patient/RecordingScreen';
import PatientProfileScreen from '../screens/Patient/PatientProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Navigator para Home e Perfil
const PatientTabNavigator = () => {
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
          height: 60,
          paddingBottom: 8,
          paddingTop: 5,
          elevation: 8,
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

// Stack Navigator principal
const PatientNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PatientTabs" component={PatientTabNavigator} />
      <Stack.Screen name="AppointmentDetails" component={AppointmentDetailsScreen} />
      <Stack.Screen name="RecordingScreen" component={RecordingScreen} />
    </Stack.Navigator>
  );
};

export default PatientNavigator;


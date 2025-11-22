import React from 'react';
import { TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import colors from '../constants/colors';

// Importa as telas principais
import HomeScreen from '../screens/Home/HomeScreen';
import GroupsScreen from '../screens/Groups/GroupsScreen';
import CreateGroupScreen from '../screens/Groups/CreateGroupScreen';
import GroupSettingsScreen from '../screens/Groups/GroupSettingsScreen';
import GroupContactsScreen from '../screens/Groups/GroupContactsScreen';
import AddVitalSignsScreen from '../screens/Groups/AddVitalSignsScreen';
import AgendaScreen from '../screens/Groups/AgendaScreen';
import AddAppointmentScreen from '../screens/Groups/AddAppointmentScreen';
import NotificationsScreen from '../screens/Notifications/NotificationsScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';

// Importa as telas de Medicamentos
import MedicationsScreen from '../screens/Medications/MedicationsScreen';
import AddMedicationChoiceScreen from '../screens/Medications/AddMedicationChoiceScreen';
import SelectDoctorScreen from '../screens/Medications/SelectDoctorScreen';
import AddMedicationScreen from '../screens/Medications/AddMedicationScreen';
import MedicationDetailsScreen from '../screens/Medications/MedicationDetailsScreen';

// Importa telas de Debug
import ShowGroupCodesScreen from '../screens/Debug/ShowGroupCodesScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack Navigator para Home
const HomeStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="HomeMain" 
        component={HomeScreen}
        options={{ 
          headerShown: false 
        }}
      />
    </Stack.Navigator>
  );
};

// Stack Navigator para Grupos
const GroupsStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="GroupsMain" 
        component={GroupsScreen}
        options={{ 
          headerShown: false 
        }}
      />
      <Stack.Screen 
        name="CreateGroup" 
        component={CreateGroupScreen}
        options={{ 
          headerShown: false 
        }}
      />
      <Stack.Screen 
        name="GroupSettings" 
        component={GroupSettingsScreen}
        options={{ 
          headerShown: false 
        }}
      />
      <Stack.Screen 
        name="GroupContacts" 
        component={GroupContactsScreen}
        options={{ 
          headerShown: false 
        }}
      />
      <Stack.Screen 
        name="AddVitalSigns" 
        component={AddVitalSignsScreen}
        options={{ 
          headerShown: false 
        }}
      />
      <Stack.Screen 
        name="Agenda" 
        component={AgendaScreen}
        options={{ 
          headerShown: false 
        }}
      />
      <Stack.Screen 
        name="AddAppointment" 
        component={AddAppointmentScreen}
        options={{ 
          headerShown: false 
        }}
      />
      <Stack.Screen 
        name="Medications" 
        component={MedicationsScreen}
        options={{ 
          headerShown: false 
        }}
      />
      <Stack.Screen 
        name="AddMedicationChoice" 
        component={AddMedicationChoiceScreen}
        options={{ 
          headerShown: false 
        }}
      />
      <Stack.Screen 
        name="SelectDoctor" 
        component={SelectDoctorScreen}
        options={{ 
          headerShown: false 
        }}
      />
      <Stack.Screen 
        name="AddMedication" 
        component={AddMedicationScreen}
        options={{ 
          headerShown: false 
        }}
      />
      <Stack.Screen 
        name="MedicationDetails" 
        component={MedicationDetailsScreen}
        options={{ 
          headerShown: false 
        }}
      />
    </Stack.Navigator>
  );
};

// Stack Navigator para Notificações
const NotificationsStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="NotificationsMain" 
        component={NotificationsScreen}
        options={{ 
          headerShown: false 
        }}
      />
    </Stack.Navigator>
  );
};

// Stack Navigator para Perfil
const ProfileStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ProfileMain" 
        component={ProfileScreen}
        options={{ 
          headerShown: false 
        }}
      />
      <Stack.Screen 
        name="ShowGroupCodes" 
        component={ShowGroupCodesScreen}
        options={{ 
          headerShown: false 
        }}
      />
    </Stack.Navigator>
  );
};

// Tab Navigator principal
const AppNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Groups') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Notifications') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        headerShown: false,
        lazy: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray400,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: -2,
          marginBottom: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
        tabBarStyle: {
          height: 65,
          paddingBottom: 10,
          paddingTop: 8,
          backgroundColor: colors.backgroundLight,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        tabBarButton: (props) => (
          <TouchableOpacity
            {...props}
            activeOpacity={0.7}
            style={[
              props.style,
              {
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
              }
            ]}
          />
        ),
      })}
      detachInactiveScreens={false}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStack}
        options={{ tabBarLabel: 'Início' }}
      />
      <Tab.Screen 
        name="Groups" 
        component={GroupsStack}
        options={{ tabBarLabel: 'Grupos' }}
      />
      <Tab.Screen 
        name="Notifications" 
        component={NotificationsStack}
        options={{ tabBarLabel: 'Notificações' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStack}
        options={{ tabBarLabel: 'Perfil' }}
      />
    </Tab.Navigator>
  );
};

export default AppNavigator;


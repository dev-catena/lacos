import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import colors from '../constants/colors';

// Importa as telas principais
import HomeScreen from '../screens/Home/HomeScreen';
import NoGroupsScreen from '../screens/Groups/NoGroupsScreen';
import GroupsScreen from '../screens/Groups/GroupsScreen';
import CreateGroupScreen from '../screens/Groups/CreateGroupScreen';
import GroupDetailScreen from '../screens/Groups/GroupDetailScreen';
import GroupSettingsScreen from '../screens/Groups/GroupSettingsScreen';
import GroupContactsScreen from '../screens/Groups/GroupContactsScreen';
import PanicSettingsScreen from '../screens/Groups/PanicSettingsScreen';
import AddVitalSignsScreen from '../screens/Groups/AddVitalSignsScreen';
import AgendaScreen from '../screens/Groups/AgendaScreen';
import AddAppointmentScreen from '../screens/Groups/AddAppointmentScreen';
import NotificationsScreen from '../screens/Notifications/NotificationsScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import EditPersonalDataScreen from '../screens/Profile/EditPersonalDataScreen';
import SecurityScreen from '../screens/Profile/SecurityScreen';
import NotificationPreferencesScreen from '../screens/Profile/NotificationPreferencesScreen';

// Importa as telas de Medicamentos
import MedicationsScreen from '../screens/Medications/MedicationsScreen';
import AddMedicationChoiceScreen from '../screens/Medications/AddMedicationChoiceScreen';
import SelectDoctorScreen from '../screens/Medications/SelectDoctorScreen';
import AddMedicationScreen from '../screens/Medications/AddMedicationScreen';
import MedicationDetailsScreen from '../screens/Medications/MedicationDetailsScreen';

// Importa as telas de Consultas
import ConsultationsScreen from '../screens/Consultations/ConsultationsScreen';
import AddConsultationScreen from '../screens/Consultations/AddConsultationScreen';
import ConsultationDetailsScreen from '../screens/Consultations/ConsultationDetailsScreen';

// Importa as telas de Médicos
import DoctorsScreen from '../screens/Doctors/DoctorsScreen';
import AddDoctorScreen from '../screens/Doctors/AddDoctorScreen';

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
      <Stack.Screen 
        name="NoGroups" 
        component={NoGroupsScreen}
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
        name="GroupDetail" 
        component={GroupDetailScreen}
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
        name="PanicSettings" 
        component={PanicSettingsScreen}
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
      <Stack.Screen 
        name="Consultations" 
        component={ConsultationsScreen}
        options={{ 
          headerShown: false 
        }}
      />
      <Stack.Screen 
        name="AddConsultation" 
        component={AddConsultationScreen}
        options={{ 
          headerShown: false 
        }}
      />
      <Stack.Screen 
        name="ConsultationDetails" 
        component={ConsultationDetailsScreen}
        options={{ 
          headerShown: false 
        }}
      />
      <Stack.Screen 
        name="Doctors" 
        component={DoctorsScreen}
        options={{ 
          headerShown: false 
        }}
      />
      <Stack.Screen 
        name="AddDoctor" 
        component={AddDoctorScreen}
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
        name="GroupDetail" 
        component={GroupDetailScreen}
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
        name="PanicSettings" 
        component={PanicSettingsScreen}
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
      <Stack.Screen 
        name="Consultations" 
        component={ConsultationsScreen}
        options={{ 
          headerShown: false 
        }}
      />
      <Stack.Screen 
        name="AddConsultation" 
        component={AddConsultationScreen}
        options={{ 
          headerShown: false 
        }}
      />
      <Stack.Screen 
        name="ConsultationDetails" 
        component={ConsultationDetailsScreen}
        options={{ 
          headerShown: false 
        }}
      />
      <Stack.Screen 
        name="Doctors" 
        component={DoctorsScreen}
        options={{ 
          headerShown: false 
        }}
      />
      <Stack.Screen 
        name="AddDoctor" 
        component={AddDoctorScreen}
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
        name="EditPersonalData" 
        component={EditPersonalDataScreen}
        options={{ 
          headerShown: false 
        }}
      />
      <Stack.Screen 
        name="Security" 
        component={SecurityScreen}
        options={{ 
          headerShown: false 
        }}
      />
      <Stack.Screen 
        name="NotificationPreferences" 
        component={NotificationPreferencesScreen}
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
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 5,
          backgroundColor: colors.backgroundLight,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarItemStyle: {
          paddingVertical: 0,
          gap: 2,
        },
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


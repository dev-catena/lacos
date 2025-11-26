import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import colors from '../constants/colors';
import CustomTabBar from '../components/CustomTabBar';
import { useAuth } from '../contexts/AuthContext';

// Importa as telas principais
import HomeScreen from '../screens/Home/HomeScreen';
import NoGroupsScreen from '../screens/Groups/NoGroupsScreen';
import GroupsScreen from '../screens/Groups/GroupsScreen';
import CreateGroupScreen from '../screens/Groups/CreateGroupScreen';
import GroupDetailScreen from '../screens/Groups/GroupDetailScreen';
import GroupSettingsScreen from '../screens/Groups/GroupSettingsScreen';
import GroupMembersScreen from '../screens/Groups/GroupMembersScreen';
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

// Importa o PatientNavigator COMPLETO (já testado e funcionando)
import PatientNavigator from './PatientNavigator';

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

// Importa as telas de Histórico
import HistoryScreen from '../screens/History/HistoryScreen';

// Importa as telas de Ocorrências
import AddOccurrenceScreen from '../screens/Occurrences/AddOccurrenceScreen';

// Importa as telas de Médicos
import DoctorsScreen from '../screens/Doctors/DoctorsScreen';
import AddDoctorScreen from '../screens/Doctors/AddDoctorScreen';

// Importa as telas de Documentos
import DocumentsScreen from '../screens/Documents/DocumentsScreen';
import AddDocumentScreen from '../screens/Documents/AddDocumentScreen';
import DocumentDetailsScreen from '../screens/Documents/DocumentDetailsScreen';

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
        name="GroupMembers" 
        component={GroupMembersScreen}
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
      <Stack.Screen 
        name="History" 
        component={HistoryScreen}
        options={{ 
          headerShown: false 
        }}
      />
      <Stack.Screen 
        name="AddOccurrence" 
        component={AddOccurrenceScreen}
        options={{ 
          headerShown: false 
        }}
      />
      <Stack.Screen 
        name="Documents" 
        component={DocumentsScreen}
        options={{ 
          headerShown: false 
        }}
      />
      <Stack.Screen 
        name="AddDocument" 
        component={AddDocumentScreen}
        options={{ 
          headerShown: false 
        }}
      />
      <Stack.Screen 
        name="DocumentDetails" 
        component={DocumentDetailsScreen}
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
        name="GroupMembers" 
        component={GroupMembersScreen}
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
      <Stack.Screen 
        name="History" 
        component={HistoryScreen}
        options={{ 
          headerShown: false 
        }}
      />
      <Stack.Screen 
        name="AddOccurrence" 
        component={AddOccurrenceScreen}
        options={{ 
          headerShown: false 
        }}
      />
      <Stack.Screen 
        name="Documents" 
        component={DocumentsScreen}
        options={{ 
          headerShown: false 
        }}
      />
      <Stack.Screen 
        name="AddDocument" 
        component={AddDocumentScreen}
        options={{ 
          headerShown: false 
        }}
      />
      <Stack.Screen 
        name="DocumentDetails" 
        component={DocumentDetailsScreen}
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

// Tab Navigator Principal - CUIDADOR
const CaregiverNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        lazy: false,
        unmountOnBlur: false,
        freezeOnBlur: false,
      }}
      backBehavior="history"
      sceneContainerStyle={{ backgroundColor: colors.background }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStack}
        options={{ 
          tabBarLabel: 'Início',
          tabBarTestID: 'tab-home',
        }}
      />
      <Tab.Screen 
        name="Groups" 
        component={GroupsStack}
        options={{ 
          tabBarLabel: 'Grupos',
          tabBarTestID: 'tab-groups',
        }}
      />
      <Tab.Screen 
        name="Notifications" 
        component={NotificationsStack}
        options={{ 
          tabBarLabel: 'Notificações',
          tabBarTestID: 'tab-notifications',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStack}
        options={{ 
          tabBarLabel: 'Perfil',
          tabBarTestID: 'tab-profile',
        }}
      />
    </Tab.Navigator>
  );
};

// AppNavigator Principal - Detecta o perfil e redireciona
const AppNavigator = () => {
  const { user } = useAuth();

  // Verificar se o usuário é PACIENTE
  // Assumindo que user.profile ou user.role contém o tipo de perfil
  const isPatient = user?.profile === 'accompanied' || user?.role === 'accompanied';

  console.log('===========================================');
  console.log('👤 AppNavigator - DETECÇÃO DE PERFIL:');
  console.log('   User Name:', user?.name);
  console.log('   User Email:', user?.email);
  console.log('   User Profile:', user?.profile);
  console.log('   User Role:', user?.role);
  console.log('   Is Patient?:', isPatient);
  console.log('   User Object:', JSON.stringify(user, null, 2));
  console.log('===========================================');

  // Se for PACIENTE, mostra navegação simplificada (PatientNavigator já existe e está testado!)
  // Se for CUIDADOR, mostra navegação completa
  if (isPatient) {
    console.log('✅ AppNavigator - Redirecionando para PatientNavigator');
    return <PatientNavigator />;
  } else {
    console.log('✅ AppNavigator - Redirecionando para CaregiverNavigator');
    return <CaregiverNavigator />;
  }
};

export default AppNavigator;


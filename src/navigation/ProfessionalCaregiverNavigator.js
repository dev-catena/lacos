import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import colors from '../constants/colors';
import CustomTabBar from '../components/CustomTabBar';

// Importa as telas principais (mesmas do CaregiverNavigator)
import HomeScreen from '../screens/Home/HomeScreen';
import NoGroupsScreen from '../screens/Groups/NoGroupsScreen';
import GroupsScreen from '../screens/Groups/GroupsScreen';
import CreateGroupScreen from '../screens/Groups/CreateGroupScreen';
import GroupDetailScreen from '../screens/Groups/GroupDetailScreen';
import GroupChatScreen from '../screens/Groups/GroupChatScreen';
import GroupSettingsScreen from '../screens/Groups/GroupSettingsScreen';
import GroupMembersScreen from '../screens/Groups/GroupMembersScreen';
import GroupContactsScreen from '../screens/Groups/GroupContactsScreen';
import EditPatientDataScreen from '../screens/Groups/EditPatientDataScreen';
import PanicSettingsScreen from '../screens/Groups/PanicSettingsScreen';
import AddVitalSignsScreen from '../screens/Groups/AddVitalSignsScreen';
import VitalSignsDetailScreen from '../screens/VitalSigns/VitalSignsDetailScreen';
import AgendaScreen from '../screens/Groups/AgendaScreen';
import AddAppointmentScreen from '../screens/Groups/AddAppointmentScreen';
import AppointmentDetailsScreen from '../screens/Groups/AppointmentDetailsScreen';
import NotificationsScreen from '../screens/Notifications/NotificationsScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import EditPersonalDataScreen from '../screens/Profile/EditPersonalDataScreen';
import ProfessionalCaregiverDataScreen from '../screens/Profile/ProfessionalCaregiverDataScreen';
import SecurityScreen from '../screens/Profile/SecurityScreen';
import NotificationPreferencesScreen from '../screens/Profile/NotificationPreferencesScreen';
import MedicationsScreen from '../screens/Medications/MedicationsScreen';
import AddMedicationChoiceScreen from '../screens/Medications/AddMedicationChoiceScreen';
import SelectDoctorScreen from '../screens/Medications/SelectDoctorScreen';
import AddMedicationScreen from '../screens/Medications/AddMedicationScreen';
import MedicationDetailsScreen from '../screens/Medications/MedicationDetailsScreen';
import PrescriptionsScreen from '../screens/Prescriptions/PrescriptionsScreen';
import PrescriptionDetailsScreen from '../screens/Prescriptions/PrescriptionDetailsScreen';
import AddPrescriptionScreen from '../screens/Prescriptions/AddPrescriptionScreen';
import ConsultationsScreen from '../screens/Consultations/ConsultationsScreen';
import AddConsultationScreen from '../screens/Consultations/AddConsultationScreen';
import ConsultationDetailsScreen from '../screens/Consultations/ConsultationDetailsScreen';
import HistoryScreen from '../screens/History/HistoryScreen';
import AddOccurrenceScreen from '../screens/Occurrences/AddOccurrenceScreen';
import DoctorsScreen from '../screens/Doctors/DoctorsScreen';
import AddDoctorScreen from '../screens/Doctors/AddDoctorScreen';
import DocumentsScreen from '../screens/Documents/DocumentsScreen';
import AddDocumentScreen from '../screens/Documents/AddDocumentScreen';
import DocumentDetailsScreen from '../screens/Documents/DocumentDetailsScreen';
import MediaScreen from '../screens/Media/MediaScreen';
import ShowGroupCodesScreen from '../screens/Debug/ShowGroupCodesScreen';
import CaregiversListScreen from '../screens/Caregivers/CaregiversListScreen';
import CaregiverDetailsScreen from '../screens/Caregivers/CaregiverDetailsScreen';
import CaregiverChatScreen from '../screens/Caregivers/CaregiverChatScreen';
import ClientsListScreen from '../screens/Clients/ClientsListScreen';
import ClientDetailsScreen from '../screens/Clients/ClientDetailsScreen';
import ClientChatScreen from '../screens/Clients/ClientChatScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack Navigator para Home
const HomeStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="HomeMain"
    >
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
        name="EditPatientData" 
        component={EditPatientDataScreen}
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
        name="VitalSignsDetail" 
        component={VitalSignsDetailScreen}
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
        name="AppointmentDetails" 
        component={AppointmentDetailsScreen}
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
        name="Prescriptions" 
        component={PrescriptionsScreen}
        options={{ 
          headerShown: false 
        }}
      />
      <Stack.Screen 
        name="PrescriptionDetails" 
        component={PrescriptionDetailsScreen}
        options={{ 
          headerShown: false 
        }}
      />
      <Stack.Screen 
        name="AddPrescription" 
        component={AddPrescriptionScreen}
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
      <Stack.Screen 
        name="Profile" 
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
        name="ProfessionalCaregiverData" 
        component={ProfessionalCaregiverDataScreen}
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
        name="CaregiversList" 
        component={CaregiversListScreen}
        options={{ 
          headerShown: false 
        }}
      />
        <Stack.Screen 
          name="CaregiverDetails" 
          component={CaregiverDetailsScreen}
          options={{ 
            headerShown: false 
          }}
        />
        <Stack.Screen 
          name="CaregiverChat" 
          component={CaregiverChatScreen}
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
        name="GroupChat" 
        component={GroupChatScreen}
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
        name="GroupMedia" 
        component={MediaScreen}
        options={{ 
          headerShown: false 
        }}
      />
      <Stack.Screen 
        name="EditPatientData" 
        component={EditPatientDataScreen}
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
        name="VitalSignsDetail" 
        component={VitalSignsDetailScreen}
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
        name="AppointmentDetails" 
        component={AppointmentDetailsScreen}
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
        name="Prescriptions" 
        component={PrescriptionsScreen}
        options={{ 
          headerShown: false 
        }}
      />
      <Stack.Screen 
        name="PrescriptionDetails" 
        component={PrescriptionDetailsScreen}
        options={{ 
          headerShown: false 
        }}
      />
      <Stack.Screen 
        name="AddPrescription" 
        component={AddPrescriptionScreen}
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
      <Stack.Screen 
        name="Profile" 
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
        name="ProfessionalCaregiverData" 
        component={ProfessionalCaregiverDataScreen}
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
    </Stack.Navigator>
  );
};

// Stack Navigator para Clientes
const ClientsStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="ClientsMain"
    >
      <Stack.Screen 
        name="ClientsMain" 
        component={ClientsListScreen}
        options={{ 
          headerShown: false 
        }}
      />
      <Stack.Screen 
        name="ClientDetails" 
        component={ClientDetailsScreen}
        options={{ 
          headerShown: false 
        }}
      />
      <Stack.Screen 
        name="ClientChat" 
        component={ClientChatScreen}
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

// Tab Navigator Principal - CUIDADOR PROFISSIONAL (iOS)
const ProfessionalCaregiverTabNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
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
        name="Notifications" 
        component={NotificationsStack}
        options={{ 
          tabBarLabel: 'Notificações',
          tabBarTestID: 'tab-notifications',
        }}
      />
      <Tab.Screen 
        name="Clients" 
        component={ClientsStack}
        options={{ 
          tabBarLabel: 'Clientes',
          tabBarTestID: 'tab-clients',
        }}
      />
    </Tab.Navigator>
  );
};

// Navigator para Android - TAB NAVIGATOR com CustomTabBar + SafeArea
const ProfessionalCaregiverAndroidNavigator = () => {
  const Tab = createBottomTabNavigator();
  
  console.log('🤖 PROFESSIONAL CAREGIVER ANDROID NAVIGATOR - CustomTabBar COM SafeArea');
  
  return (
    <Tab.Navigator
      initialRouteName="Home"
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
        name="Notifications" 
        component={NotificationsStack}
        options={{ 
          tabBarLabel: 'Notificações',
          tabBarTestID: 'tab-notifications',
        }}
      />
      <Tab.Screen 
        name="Clients" 
        component={ClientsStack}
        options={{ 
          tabBarLabel: 'Clientes',
          tabBarTestID: 'tab-clients',
        }}
      />
    </Tab.Navigator>
  );
};

// Navigator Principal - CUIDADOR PROFISSIONAL (FAB no Android, Tabs no iOS)
const ProfessionalCaregiverNavigator = () => {
  console.log('📱 ProfessionalCaregiverNavigator - Platform:', Platform.OS);
  
  if (Platform.OS === 'android') {
    console.log('✅ ProfessionalCaregiverNavigator - Usando Navigator ANDROID (sem tabs)');
    return <ProfessionalCaregiverAndroidNavigator />;
  }
  
  console.log('✅ ProfessionalCaregiverNavigator - Usando Navigator iOS (com tabs)');
  return <ProfessionalCaregiverTabNavigator />;
};

export default ProfessionalCaregiverNavigator;


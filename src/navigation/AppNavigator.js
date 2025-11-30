import React, { useState, useEffect } from 'react';
import { Platform, View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useNavigation, useNavigationState, NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import colors from '../constants/colors';
import CustomTabBar from '../components/CustomTabBar';
import ExpandableFAB from '../components/ExpandableFAB';
import { useAuth } from '../contexts/AuthContext';
import groupService from '../services/groupService';

// Importa as telas principais
import HomeScreen from '../screens/Home/HomeScreen';
import NoGroupsScreen from '../screens/Groups/NoGroupsScreen';
import GroupsScreen from '../screens/Groups/GroupsScreen';
import CreateGroupScreen from '../screens/Groups/CreateGroupScreen';
import GroupDetailScreen from '../screens/Groups/GroupDetailScreen';
import GroupSettingsScreen from '../screens/Groups/GroupSettingsScreen';
import GroupMembersScreen from '../screens/Groups/GroupMembersScreen';
import GroupContactsScreen from '../screens/Groups/GroupContactsScreen';
import EditPatientDataScreen from '../screens/Groups/EditPatientDataScreen';
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

// Importa as telas de Mídias
import MediaScreen from '../screens/Media/MediaScreen';

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

// Tab Navigator Principal - CUIDADOR (iOS)
const CaregiverTabNavigator = () => {
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
    </Tab.Navigator>
  );
};

// Navigator para Android - TAB NAVIGATOR com CustomTabBar + SafeArea
const CaregiverAndroidNavigator = () => {
  const Tab = createBottomTabNavigator();
  
  console.log('🤖 ANDROID NAVIGATOR - CustomTabBar COM SafeArea (acima da barra do Android)');
  
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
    </Tab.Navigator>
  );
};

// Navigator Principal - CUIDADOR (FAB no Android, Tabs no iOS)
const CaregiverNavigator = () => {
  console.log('📱 CaregiverNavigator - Platform:', Platform.OS);
  
  if (Platform.OS === 'android') {
    console.log('✅ CaregiverNavigator - Usando Navigator ANDROID (sem tabs)');
    return <CaregiverAndroidNavigator />;
  }
  
  console.log('✅ CaregiverNavigator - Usando Navigator iOS (com tabs)');
  return <CaregiverTabNavigator />;
};

// AppNavigator Principal - Detecta o perfil e redireciona
const AppNavigator = () => {
  const { user } = useAuth();
  const [isPatient, setIsPatient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        console.log('===========================================');
        console.log('🔍 AppNavigator - INICIANDO VERIFICAÇÃO');
        console.log('===========================================');
        console.log('👤 Usuário logado:', user?.name, '(ID:', user?.id, ')');
        
        // Primeiro, verificar o perfil cadastral
        const profileIsPatient = user?.profile === 'accompanied';
        console.log(`📋 Perfil cadastral: ${user?.profile} → ${profileIsPatient ? '👤 PACIENTE' : '👨‍⚕️ CUIDADOR'}`);
        
        // Depois, verificar a role nos grupos COM TIMEOUT
        console.log('📡 Buscando grupos do usuário...');
        
        // Criar promise de timeout (5 segundos)
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout ao buscar grupos')), 5000)
        );
        
        // Fazer requisição com timeout
        const groupsResult = await Promise.race([
          groupService.getMyGroups(),
          timeoutPromise
        ]);
        
        console.log('📦 Resultado da API:', groupsResult);
        
        if (groupsResult.success && groupsResult.data) {
          const groups = Array.isArray(groupsResult.data) ? groupsResult.data : [];
          console.log(`📊 Total de grupos: ${groups.length}`);
          
          // Verificar se em algum grupo ele é paciente
          let isPatientInAnyGroup = false;
          
          groups.forEach((group, index) => {
            console.log(`\n📁 Grupo ${index + 1}: "${group.name}" (ID: ${group.id})`);
            console.log('   group_members:', group.group_members);
            
            // Buscar o membro atual no grupo
            const member = group.group_members?.find(m => {
              console.log(`      Comparando: m.user_id (${m.user_id}) === user.id (${user?.id})`);
              return m.user_id === user?.id;
            });
            
            if (member) {
              console.log(`   ✅ Encontrado! Role: ${member.role}`);
              const roleIsPatient = member.role === 'patient';
              console.log(`   É paciente? ${roleIsPatient ? '👤 SIM' : '❌ NÃO'}`);
              
              if (roleIsPatient) {
                isPatientInAnyGroup = true;
              }
            } else {
              console.log(`   ⚠️ Usuário não encontrado nos membros deste grupo`);
            }
          });
          
          console.log(`\n📊 Resultado da verificação:`);
          console.log(`   isPatientInAnyGroup = ${isPatientInAnyGroup}`);
          
          // Se for paciente em algum grupo OU se o perfil cadastral for paciente
          const shouldShowPatientNav = profileIsPatient || isPatientInAnyGroup;
          
          console.log('\n===========================================');
          console.log('🎯 AppNavigator - DECISÃO FINAL:');
          console.log('===========================================');
          console.log(`   📋 Perfil cadastral é paciente: ${profileIsPatient}`);
          console.log(`   👥 É paciente em algum grupo: ${isPatientInAnyGroup}`);
          console.log(`   🚦 Mostrar PatientNavigator: ${shouldShowPatientNav}`);
          console.log('===========================================\n');
          
          console.log(`🔧 Chamando setIsPatient(${shouldShowPatientNav})`);
          setIsPatient(shouldShowPatientNav);
        } else {
          // Se não conseguiu buscar grupos, usa apenas o perfil cadastral
          console.log('⚠️ Não foi possível buscar grupos, usando perfil cadastral');
          setIsPatient(profileIsPatient);
        }
      } catch (error) {
        console.error('❌ Erro ao verificar role:', error);
        console.error('❌ Detalhes do erro:', error.message);
        // Em caso de erro ou timeout, usa o perfil cadastral
        const fallbackIsPatient = user?.profile === 'accompanied';
        console.log(`⚠️ Usando perfil cadastral como fallback: ${fallbackIsPatient ? 'PACIENTE' : 'CUIDADOR'}`);
        setIsPatient(fallbackIsPatient);
      } finally {
        console.log('✅ AppNavigator - Finalizando verificação');
        setIsLoading(false);
      }
    };

    if (user) {
      checkUserRole();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  // Mostrar loading enquanto verifica
  if (isLoading) {
    console.log('⏳ AppNavigator - LOADING (verificando role...)');
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: colors.background,
      }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ 
          marginTop: 16, 
          color: colors.gray600,
          fontSize: 16,
        }}>
          Carregando...
        </Text>
      </View>
    );
  }

  // Se for PACIENTE, mostra navegação simplificada (PatientNavigator já existe e está testado!)
  // Se for CUIDADOR, mostra navegação completa
  console.log('\n🎬 AppNavigator - RENDERIZANDO:');
  console.log(`   isPatient = ${isPatient}`);
  console.log(`   Navegador: ${isPatient ? 'PatientNavigator 👤' : 'CaregiverNavigator 👨‍⚕️'}\n`);
  
  if (isPatient) {
    return <PatientNavigator />;
  } else {
    return <CaregiverNavigator />;
  }
};

export default AppNavigator;


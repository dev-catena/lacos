import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Platform } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../constants/colors';
import groupService from '../services/groupService';
import { HomeIcon, PersonIcon } from '../components/CustomIcons';

import PatientHomeScreen from '../screens/Patient/PatientHomeScreen';
import AppointmentDetailsScreen from '../screens/Patient/AppointmentDetailsScreen';
import RecordingScreen from '../screens/Patient/RecordingScreen';
import PatientProfileScreen from '../screens/Patient/PatientProfileScreen';
import PatientJoinGroupScreen from '../screens/Patient/PatientJoinGroupScreen';
import PatientVideoCallScreen from '../screens/Patient/PatientVideoCallScreen';

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
          if (route.name === 'PatientHomeTab') {
            return <HomeIcon size={size || 24} color={color} filled={focused} />;
          } else if (route.name === 'PatientProfileTab') {
            return <PersonIcon size={size || 24} color={color} filled={focused} />;
          }
          return null;
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

  const checkPatientGroup = async (shouldNavigate = false) => {
    try {
      console.log('🔍 PatientNavigator - Verificando se paciente tem grupo...');
      console.log('🔍 PatientNavigator - shouldNavigate:', shouldNavigate);
      console.log('🔍 PatientNavigator - hasGroup atual:', hasGroup);
      
      const result = await groupService.getMyGroups();
      console.log('📦 PatientNavigator - Resultado da API:', JSON.stringify(result, null, 2));
      
      // Verificar se result.data é um array e se tem elementos
      // IMPORTANTE: Verificar também se result.data não é null/undefined
      let hasGroups = false;
      
      if (result && result.success !== false) {
        // Se result.success é true ou undefined, verificar result.data
        if (result.data) {
          if (Array.isArray(result.data)) {
            hasGroups = result.data.length > 0;
          } else if (typeof result.data === 'object' && result.data !== null) {
            // Se result.data é um objeto, pode ser que a API retornou diretamente um array
            // Verificar se tem propriedade length
            hasGroups = result.data.length > 0;
          }
        } else if (Array.isArray(result)) {
          // Se result é diretamente um array (caso a API retorne array diretamente)
          hasGroups = result.length > 0;
        }
      }
      
      console.log('📊 PatientNavigator - Análise detalhada:', {
        hasGroups,
        resultSuccess: result?.success,
        resultDataExists: !!result?.data,
        resultDataIsArray: Array.isArray(result?.data),
        resultDataLength: result?.data?.length || 0,
        resultIsArray: Array.isArray(result),
        resultLength: Array.isArray(result) ? result.length : 'N/A',
        firstGroup: result?.data?.[0] || result?.[0] || null
      });
      
      if (hasGroups) {
        const groups = Array.isArray(result.data) ? result.data : (Array.isArray(result) ? result : []);
        console.log('📊 PatientNavigator - Número de grupos:', groups.length);
        console.log('📊 PatientNavigator - Primeiro grupo:', groups[0]?.name || groups[0]?.id || 'N/A');
        if (groups[0]) {
          console.log('📊 PatientNavigator - Detalhes do primeiro grupo:', {
            id: groups[0].id,
            name: groups[0].name,
            hasGroupMembers: !!groups[0].group_members,
            groupMembersCount: groups[0].group_members?.length || 0
          });
        }
      }
      
      if (hasGroups) {
        const groups = Array.isArray(result.data) ? result.data : (Array.isArray(result) ? result : []);
        const firstGroup = groups[0];
        console.log('✅ PatientNavigator - Paciente tem grupo:', firstGroup?.name || firstGroup?.id || 'N/A');
        const previousHasGroup = hasGroup;
        setHasGroup(true);
        
        // IMPORTANTE: A navegação será feita pelo NavigationControllerWrapper
        // que usa useNavigation hook para acessar o navigator corretamente
        console.log('✅ PatientNavigator - Paciente tem grupo, NavigationControllerWrapper vai navegar');
      } else {
        console.log('⚠️ PatientNavigator - Paciente SEM grupo, precisa entrar com código');
        console.log('📊 PatientNavigator - Detalhes:', {
          success: result.success,
          hasData: !!result.data,
          isArray: Array.isArray(result.data),
          length: result.data?.length || 0
        });
        setHasGroup(false);
        
        // IMPORTANTE: A navegação será feita pelo NavigationControllerWrapper
        // que usa useNavigation hook para acessar o navigator corretamente
        console.log('⚠️ PatientNavigator - Paciente sem grupo, NavigationControllerWrapper vai navegar');
      }
    } catch (error) {
      console.error('❌ PatientNavigator - Erro ao verificar grupos:', error);
      setHasGroup(false);
      
      // Em caso de erro, NavigationControllerWrapper vai lidar com a navegação
      console.log('❌ PatientNavigator - Erro ao verificar grupos, NavigationControllerWrapper vai lidar');
    } finally {
      setLoading(false);
    }
  };

  // Verificar grupos quando o componente monta
  useEffect(() => {
    // Aguardar um pouco para garantir que o navigator está pronto
    const timer1 = setTimeout(() => {
      console.log('🔄 PatientNavigator - Executando verificação inicial de grupos (primeira tentativa)...');
      checkPatientGroup(true); // Forçar navegação na primeira verificação
    }, 200);
    
    // Segunda tentativa após um delay maior (caso a primeira falhe)
    const timer2 = setTimeout(() => {
      console.log('🔄 PatientNavigator - Executando verificação inicial de grupos (segunda tentativa)...');
      checkPatientGroup(true);
    }, 1000);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Verificar grupos periodicamente (a cada 5 segundos) para detectar remoção
  useEffect(() => {
    if (loading) return; // Não verificar enquanto está carregando
    
    const interval = setInterval(() => {
      checkPatientGroup(true);
    }, 5000); // Verificar a cada 5 segundos

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, hasGroup]);

  // Mostrar loading enquanto verifica
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // IMPORTANTE: Determinar rota inicial baseado no estado hasGroup
  // Se já detectou que tem grupo, começar direto em PatientTabs
  // Caso contrário, começar em PatientJoinGroup e a verificação vai redirecionar
  const initialRoute = hasGroup ? 'PatientTabs' : 'PatientJoinGroup';
  console.log('🎯 PatientNavigator - Rota inicial:', initialRoute, '(hasGroup:', hasGroup, ', loading:', loading, ')');

  // Se não tem grupo, garantir que a tela de entrar em grupo seja sempre a primeira
  // Colocar PatientJoinGroup como primeira rota no Stack para garantir que seja acessível
  return (
    <>
      <Stack.Navigator 
        screenOptions={{ headerShown: false }}
        initialRouteName={initialRoute}
      >
        {/* Tela de entrada com código (para pacientes sem grupo) */}
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
        name="PatientVideoCall" 
        component={PatientVideoCallScreen} 
        options={{ 
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen 
        name="RecordingScreen" 
        component={RecordingScreen} 
      />
      </Stack.Navigator>
      {/* Componente de controle de navegação - renderizado fora do Stack mas com acesso via useNavigation */}
      <NavigationControllerWrapper hasGroup={hasGroup} />
    </>
  );
};

// Wrapper que usa useNavigation para acessar o navigator
const NavigationControllerWrapper = ({ hasGroup }) => {
  const navigation = useNavigation();
  
  useEffect(() => {
    if (navigation) {
      const timer = setTimeout(() => {
        try {
          const state = navigation.getState();
          const currentRoute = state?.routes?.[state?.index]?.name;
          
          if (hasGroup && currentRoute !== 'PatientTabs') {
            console.log('🔄 NavigationControllerWrapper - Navegando para PatientTabs (tem grupo)');
            navigation.reset({
              index: 0,
              routes: [{ name: 'PatientTabs' }],
            });
          } else if (!hasGroup && currentRoute !== 'PatientJoinGroup') {
            console.log('🔄 NavigationControllerWrapper - Navegando para PatientJoinGroup (sem grupo)');
            navigation.reset({
              index: 0,
              routes: [{ name: 'PatientJoinGroup' }],
            });
          }
        } catch (error) {
          console.error('❌ NavigationControllerWrapper - Erro ao navegar:', error);
        }
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [hasGroup, navigation]);
  
  return null;
};

export default PatientNavigator;


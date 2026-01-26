import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../constants/colors';
import { 
  CalendarIcon, 
  PulseIcon, 
  SettingsIcon,
  HistoryIcon,
  MedicationIcon,
  MedicalKitIcon,
  FolderIcon,
  ImagesIcon,
  WarningIcon,
  ArrowBackIcon,
  PeopleIcon,
  ChevronForwardIcon,
  ChatIcon,
  InfoIcon,
  DocumentIcon,
} from '../../components/CustomIcons';
import { useAuth } from '../../contexts/AuthContext';
import groupService from '../../services/groupService';
import planService from '../../services/planService';

const GroupDetailScreen = ({ route, navigation }) => {
  const { groupId, groupName, accompaniedName } = route.params || {};
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState(null);

  useEffect(() => {
    checkAdminStatus();
    loadUserPlan();
  }, [groupId, user?.id]); // Adicionar user?.id como dependência

  const checkAdminStatus = async () => {
    try {
      const result = await groupService.getGroup(groupId);
      if (result.success && result.data) {
        const group = result.data;
        
        console.log('🔐 GroupDetail - Dados do grupo recebidos:', {
          groupId: group.id,
          groupName: group.name,
          created_by: group.created_by,
          is_creator: group.is_creator,
          is_admin: group.is_admin,
          user_id: user?.id,
          group_members: group.group_members?.length || 0
        });
        
        // Verificar manualmente primeiro (mais confiável)
        const createdById = String(group.created_by || group.admin_user_id || '');
        const userId = String(user?.id || '');
        const isCreatorManual = createdById === userId || group.is_creator === true;
        
        const memberData = group.group_members?.find(m => {
          const memberUserId = String(m.user_id || m.id || '');
          return memberUserId === userId;
        });
        const hasAdminRole = memberData?.role === 'admin' || memberData?.is_admin === true;
        
        const manualIsAdmin = isCreatorManual || hasAdminRole;
        
        // Usar is_admin do backend se disponível, mas sempre verificar manualmente também
        if (group.is_admin !== undefined) {
          const backendIsAdmin = Boolean(group.is_admin);
          console.log('🔐 GroupDetail - is_admin do backend:', backendIsAdmin, '(tipo:', typeof group.is_admin, ')');
          console.log('🔐 GroupDetail - Verificação manual:', manualIsAdmin, '(criador:', isCreatorManual, ', role admin:', hasAdminRole, ')');
          
          // Usar o valor mais permissivo (se qualquer um for true, usar true)
          const finalIsAdmin = backendIsAdmin || manualIsAdmin;
          setIsAdmin(finalIsAdmin);
          
          if (backendIsAdmin !== manualIsAdmin) {
            console.warn('⚠️ GroupDetail - Diferença entre backend e verificação manual! Usando:', finalIsAdmin);
          }
        } else {
          // Fallback: usar verificação manual
          setIsAdmin(manualIsAdmin);
          
          console.log('🔐 GroupDetail - Verificação manual (fallback):', {
            isCreator: isCreatorManual,
            createdById,
            userId,
            hasAdminRole,
            memberData: memberData ? { role: memberData.role, is_admin: memberData.is_admin } : null,
            finalIsAdmin: manualIsAdmin
          });
        }
      } else {
        console.warn('⚠️ GroupDetail - Não foi possível carregar dados do grupo');
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('❌ GroupDetail - Erro ao verificar admin:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const loadUserPlan = async () => {
    try {
      const result = await planService.getUserPlan();
      if (result.success && result.plan) {
        setUserPlan(result.plan);
        console.log('📦 GroupDetail - Plano carregado:', result.plan.name);
      } else {
        console.warn('⚠️ GroupDetail - Não foi possível carregar o plano do usuário');
      }
    } catch (error) {
      console.error('❌ GroupDetail - Erro ao carregar plano:', error);
    }
  };

  const menuItems = [
    {
      id: 'history',
      featureKey: 'historico', // Key da feature no plano
      title: 'Histórico',
      subtitle: 'Timeline completa de eventos',
      icon: 'time',
      IconComponent: HistoryIcon,
      color: colors.info,
      backgroundColor: colors.info + '20',
      onPress: () => navigation.navigate('History', { 
        groupId, 
        groupName,
        accompaniedName
      }),
    },
    {
      id: 'medications',
      featureKey: 'remedios',
      title: 'Remédios',
      subtitle: 'Gerenciar medicamentos e horários',
      icon: 'medical',
      IconComponent: MedicationIcon,
      color: colors.secondary,
      backgroundColor: colors.secondary + '20',
      onPress: () => navigation.navigate('Medications', { 
        groupId, 
        groupName 
      }),
    },
    {
      id: 'prescriptions',
      featureKey: 'receitas',
      title: 'Receitas',
      subtitle: 'Receitas médicas e prescrições',
      icon: 'document-text',
      IconComponent: DocumentIcon,
      color: '#8B5CF6',
      backgroundColor: '#8B5CF620',
      onPress: () => navigation.navigate('Prescriptions', { 
        groupId, 
        groupName 
      }),
    },
    {
      id: 'agenda',
      featureKey: 'agenda',
      title: 'Agenda',
      subtitle: 'Consultas e compromissos',
      icon: 'calendar',
      IconComponent: CalendarIcon,
      color: colors.warning,
      backgroundColor: colors.warning + '20',
      onPress: () => navigation.navigate('Agenda', { 
        groupId, 
        groupName 
      }),
    },
    {
      id: 'doctors',
      featureKey: 'medicos',
      title: 'Médicos',
      subtitle: 'Gerenciar médicos vinculados',
      icon: 'medkit',
      IconComponent: MedicalKitIcon,
      color: '#FF6B6B',
      backgroundColor: '#FF6B6B20',
      onPress: () => navigation.navigate('Doctors', { 
        groupId, 
        groupName 
      }),
    },
    {
      id: 'documents',
      featureKey: 'arquivos',
      title: 'Arquivos',
      subtitle: 'Exames, receitas e laudos',
      icon: 'folder-open',
      IconComponent: FolderIcon,
      color: '#9C27B0',
      backgroundColor: '#9C27B020',
      onPress: () => navigation.navigate('Documents', { 
        groupId, 
        groupName 
      }),
    },
    {
      id: 'media',
      featureKey: 'midias',
      title: 'Mídias',
      subtitle: 'Fotos e vídeos do grupo',
      icon: 'images',
      IconComponent: ImagesIcon,
      color: '#FF6F00',
      backgroundColor: '#FF6F0020',
      onPress: () => navigation.navigate('GroupMedia', { 
        groupId, 
        groupName 
      }),
    },
    {
      id: 'vitalsigns',
      featureKey: 'sinaisVitais',
      title: 'Sinais Vitais',
      subtitle: 'Visualizar gráficos e histórico',
      icon: 'pulse',
      IconComponent: PulseIcon,
      color: colors.success,
      backgroundColor: colors.success + '20',
      onPress: () => navigation.navigate('VitalSignsDetail', { 
        groupId, 
        groupName
      }),
    },
    {
      id: 'settings',
      featureKey: 'configuracoes',
      title: 'Configurações',
      subtitle: 'Gerenciar grupo e contatos',
      icon: 'settings',
      IconComponent: SettingsIcon,
      color: colors.primary,
      backgroundColor: colors.primary + '20',
      onPress: () => navigation.navigate('GroupSettings', { 
        groupId, 
        groupName 
      }),
    },
    {
      id: 'fallSensor',
      featureKey: 'sensorQuedas',
      title: 'Sensor de Queda',
      subtitle: 'Monitoramento de postura e quedas',
      icon: 'warning',
      IconComponent: WarningIcon,
      color: '#FF6B6B',
      backgroundColor: '#FF6B6B20',
      onPress: () => navigation.navigate('FallSensor', { 
        groupId, 
        groupName 
      }),
    },
  ];

  // Filtrar menuItems baseado no plano do usuário e permissões de admin
  const visibleMenuItems = menuItems.filter(item => {
    // Configurações só aparece se for admin (sempre habilitada para admins)
    if (item.id === 'settings') {
      console.log('🔐 GroupDetail - Verificando se deve mostrar configurações:', {
        isAdmin,
        isAdminType: typeof isAdmin,
        userPlan: userPlan ? userPlan.name : 'não carregado'
      });
      return isAdmin; // Sempre mostrar para admins, independente do plano
    }
    
    // Se o plano ainda não foi carregado, não mostrar outros itens
    if (!userPlan) {
      return false; // Não mostrar funcionalidades enquanto carrega o plano
    }
    
    // Outros itens aparecem se a feature estiver habilitada no plano
    return planService.isFeatureEnabled(userPlan, item.featureKey);
  });
  
  console.log('🔐 GroupDetail - Menu items visíveis:', {
    total: visibleMenuItems.length,
    items: visibleMenuItems.map(i => i.id),
    hasSettings: visibleMenuItems.some(i => i.id === 'settings'),
    isAdmin
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? insets.top + 16 : 16 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowBackIcon size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{groupName}</Text>
          {accompaniedName && (
            <Text style={styles.headerSubtitle}>{accompaniedName}</Text>
          )}
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Informação do Grupo */}
        <TouchableOpacity 
          style={styles.infoCard}
          onPress={() => navigation.navigate('GroupChat', { 
            groupId, 
            groupName 
          })}
          activeOpacity={0.7}
        >
          <View style={styles.infoIconContainer}>
            <PeopleIcon size={32} color={colors.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Grupo de Cuidados</Text>
            <Text style={styles.infoText}>
              Feed de comunicação do grupo
            </Text>
          </View>
          <ChatIcon 
            size={24} 
            color={colors.primary} 
          />
        </TouchableOpacity>

        {/* Cards de Menu */}
        <View style={styles.menuContainer}>
          {visibleMenuItems.map((item) => {
            const IconComponent = item.IconComponent;
            
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.menuCard}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View 
                  style={[
                    styles.menuIconContainer, 
                    { backgroundColor: item.backgroundColor }
                  ]}
                >
                  {IconComponent ? (
                    <IconComponent size={32} color={item.color} />
                  ) : (
                    <Ionicons name={item.icon} size={32} color={item.color} />
                  )}
                </View>
                
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
                
                <ChevronForwardIcon 
                  size={24} 
                  color={colors.gray400} 
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Info adicional */}
        <View style={styles.tipsCard}>
          <InfoIcon size={24} color={colors.info} />
          <View style={styles.tipsContent}>
            <Text style={styles.tipsTitle}>💡 Dica</Text>
            <Text style={styles.tipsText}>
              Mantenha as informações médicas sempre atualizadas para melhor acompanhamento
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textLight,
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    padding: 20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '10',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  infoArrow: {
    marginLeft: 12,
  },
  infoIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
    justifyContent: 'center',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
  },
  menuContainer: {
    gap: 16,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 18,
  },
  tipsCard: {
    flexDirection: 'row',
    backgroundColor: colors.info + '10',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    borderWidth: 1,
    borderColor: colors.info + '20',
    gap: 12,
  },
  tipsContent: {
    flex: 1,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  tipsText: {
    fontSize: 13,
    color: colors.textLight,
    lineHeight: 18,
  },
});

export default GroupDetailScreen;


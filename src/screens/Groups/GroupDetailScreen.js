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
} from '../../components/CustomIcons';
import { useAuth } from '../../contexts/AuthContext';
import groupService from '../../services/groupService';

const GroupDetailScreen = ({ route, navigation }) => {
  const { groupId, groupName, accompaniedName } = route.params || {};
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminStatus();
  }, [groupId]);

  const checkAdminStatus = async () => {
    try {
      const result = await groupService.getGroup(groupId);
      if (result.success && result.data) {
        const group = result.data;
        // Verificar se o usuário é o criador ou tem role=admin no grupo
        const isCreator = group.created_by === user?.id;
        const memberData = group.group_members?.find(m => m.user_id === user?.id);
        const hasAdminRole = memberData?.role === 'admin';
        
        setIsAdmin(isCreator || hasAdminRole);
        console.log('🔐 GroupDetail - É admin?', isCreator || hasAdminRole);
      }
    } catch (error) {
      console.error('Erro ao verificar admin:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    {
      id: 'history',
      title: 'Histórico',
      subtitle: 'Timeline completa de eventos',
      icon: 'time',
      IconComponent: null,
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
      title: 'Remédios',
      subtitle: 'Gerenciar medicamentos e horários',
      icon: 'medical',
      color: colors.secondary,
      backgroundColor: colors.secondary + '20',
      onPress: () => navigation.navigate('Medications', { 
        groupId, 
        groupName 
      }),
    },
    {
      id: 'agenda',
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
      title: 'Médicos',
      subtitle: 'Gerenciar médicos vinculados',
      icon: 'medkit',
      IconComponent: null,
      color: '#FF6B6B',
      backgroundColor: '#FF6B6B20',
      onPress: () => navigation.navigate('Doctors', { 
        groupId, 
        groupName 
      }),
    },
    {
      id: 'documents',
      title: 'Arquivos',
      subtitle: 'Exames, receitas e laudos',
      icon: 'folder-open',
      IconComponent: null,
      color: '#9C27B0',
      backgroundColor: '#9C27B020',
      onPress: () => navigation.navigate('Documents', { 
        groupId, 
        groupName 
      }),
    },
    {
      id: 'media',
      title: 'Mídias',
      subtitle: 'Fotos e vídeos do grupo',
      icon: 'images',
      IconComponent: null,
      color: '#FF6F00',
      backgroundColor: '#FF6F0020',
      onPress: () => navigation.navigate('GroupMedia', { 
        groupId, 
        groupName 
      }),
    },
    {
      id: 'vitalsigns',
      title: 'Sinais Vitais',
      subtitle: 'Registrar pressão, glicose e peso',
      icon: 'pulse',
      IconComponent: PulseIcon,
      color: colors.success,
      backgroundColor: colors.success + '20',
      onPress: () => navigation.navigate('AddVitalSigns', { 
        groupId, 
        groupName,
        accompaniedPersonId: groupId 
      }),
    },
    {
      id: 'settings',
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
  ];

  // Filtrar menuItems: só mostrar Configurações se for admin
  const visibleMenuItems = menuItems.filter(item => {
    if (item.id === 'settings') {
      return isAdmin;
    }
    return true;
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
          <Ionicons name="arrow-back" size={24} color={colors.text} />
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
            <Ionicons name="people" size={32} color={colors.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Grupo de Cuidados</Text>
            <Text style={styles.infoText}>
              Feed de comunicação do grupo
            </Text>
          </View>
          <Ionicons 
            name="chatbubbles" 
            size={24} 
            color={colors.primary} 
            style={styles.infoArrow}
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
                
                <Ionicons 
                  name="chevron-forward" 
                  size={24} 
                  color={colors.gray400} 
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Info adicional */}
        <View style={styles.tipsCard}>
          <Ionicons name="information-circle" size={24} color={colors.info} />
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


import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import colors from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { LacosIcon, LacosLogoFull } from '../../components/LacosLogo';
import ProfileSwitcher from '../../components/ProfileSwitcher';
import groupService from '../../services/groupService';
import {
  MedicationIcon,
  VitalSignsIcon,
  AppointmentIcon,
  MessagesIcon,
} from '../../components/CustomIcons';

const CURRENT_PROFILE_KEY = '@lacos_current_profile';

const HomeScreen = ({ navigation }) => {
  const { user, signed } = useAuth();
  const [myGroups, setMyGroups] = useState([]);
  const [participatingGroups, setParticipatingGroups] = useState([]);
  const [selectedTab, setSelectedTab] = useState('myGroups');
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentProfile, setCurrentProfile] = useState('caregiver');

  // Verificar autenticação
  useEffect(() => {
    if (!signed || !user) {
      console.error('❌ HomeScreen - ACESSO NEGADO: Usuário não autenticado!');
      console.error('❌ Este é um BUG DE SEGURANÇA - bloqueando acesso');
    }
  }, [signed, user]);

  // Carregar perfil salvo
  useEffect(() => {
    loadCurrentProfile();
  }, []);

  // Carregar grupos quando a tela recebe foco
  useFocusEffect(
    React.useCallback(() => {
      if (signed && user) {
        loadGroups();
      }
    }, [signed, user])
  );

  const loadCurrentProfile = async () => {
    try {
      const savedProfile = await AsyncStorage.getItem(CURRENT_PROFILE_KEY);
      if (savedProfile) {
        setCurrentProfile(savedProfile);
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    }
  };

  const handleProfileChange = async (newProfile) => {
    setCurrentProfile(newProfile);
    try {
      await AsyncStorage.setItem(CURRENT_PROFILE_KEY, newProfile);
      
      // Se mudar para paciente, navegar para PatientApp
      if (newProfile === 'patient') {
        // TODO: Implementar navegação para interface do paciente
        Alert.alert(
          'Modo Paciente',
          'Navegação para interface simplificada em desenvolvimento'
        );
      }
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
    }
  };

  const loadGroups = async () => {
    console.log('🔄 HomeScreen - Carregando grupos...');
    setLoading(true);
    try {
      // Buscar grupos da API
      const result = await groupService.getMyGroups();
      
      if (result.success && result.data) {
        const groups = result.data;
        console.log(`✅ HomeScreen - ${groups.length} grupo(s) encontrado(s)`);
        
        // Se não tem grupos, apenas setar estado vazio
        // HomeScreen vai renderizar NoGroupsScreen condicionalmente
        if (groups.length === 0) {
          console.log('ℹ️ HomeScreen - Nenhum grupo encontrado');
          setMyGroups([]);
          setParticipatingGroups([]);
          setLoading(false);
          return;
        }
        
        // "Meus Grupos" = grupos onde sou admin
        // "Participo" = grupos onde não sou admin
        const myCreatedGroups = groups.filter(g => g.is_admin || g.isAdmin);
        const joinedGroups = groups.filter(g => !g.is_admin && !g.isAdmin);
        
        console.log(`✅ HomeScreen - Meus Grupos: ${myCreatedGroups.length}, Participo: ${joinedGroups.length}`);
        
        setMyGroups(myCreatedGroups);
        setParticipatingGroups(joinedGroups);
      } else {
        console.warn('⚠️ HomeScreen - Erro ao buscar grupos');
        // Em caso de erro, setar estado vazio
        setMyGroups([]);
        setParticipatingGroups([]);
      }
    } catch (error) {
      console.error('❌ HomeScreen - Erro ao carregar grupos:', error);
      // Em caso de erro, setar estado vazio
      setMyGroups([]);
      setParticipatingGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNotifications = () => {
    navigation.navigate('Notifications');
  };

  const handleGroupPress = () => {
    navigation.navigate('Groups');
  };

  const handleCreateGroup = () => {
    navigation.navigate('CreateGroup');
  };

  const handleMedication = () => {
    Alert.alert(
      'Em Desenvolvimento',
      'Funcionalidade de Medicação em desenvolvimento',
      [{ text: 'OK' }]
    );
  };

  const handleVitalSigns = () => {
    Alert.alert(
      'Em Desenvolvimento',
      'Funcionalidade de Sinais Vitais em desenvolvimento',
      [{ text: 'OK' }]
    );
  };

  const handleAppointment = () => {
    Alert.alert(
      'Em Desenvolvimento',
      'Funcionalidade de Consultas em desenvolvimento',
      [{ text: 'OK' }]
    );
  };

  const handleMessages = () => {
    Alert.alert(
      'Em Desenvolvimento',
      'Funcionalidade de Mensagens em desenvolvimento',
      [{ text: 'OK' }]
    );
  };

  // GUARD: Se não estiver autenticado, mostrar mensagem de erro
  if (!signed || !user) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar style="dark" />
        <View style={styles.errorContainer}>
          <Ionicons name="lock-closed-outline" size={80} color={colors.error} />
          <Text style={styles.errorTitle}>Acesso Negado</Text>
          <Text style={styles.errorText}>
            Você precisa estar logado para acessar esta tela.
          </Text>
          <Text style={styles.errorSubtext}>
            Este é um erro de navegação. Por favor, reinicie o aplicativo.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando grupos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <LacosIcon size={40} />
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>Olá,</Text>
            <Text style={styles.userName}>{user?.name || 'Usuário'}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <ProfileSwitcher 
            currentProfile={currentProfile}
            onProfileChange={handleProfileChange}
            style={{ marginRight: 12 }}
          />
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={handleNotifications}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Tabs de Grupos */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'myGroups' && styles.tabActive]}
            onPress={() => setSelectedTab('myGroups')}
          >
            <Text style={[styles.tabText, selectedTab === 'myGroups' && styles.tabTextActive]}>
              Meus Grupos
            </Text>
            {selectedTab === 'myGroups' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'participating' && styles.tabActive]}
            onPress={() => setSelectedTab('participating')}
          >
            <Text style={[styles.tabText, selectedTab === 'participating' && styles.tabTextActive]}>
              Participo
            </Text>
            {selectedTab === 'participating' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        </View>

        {/* Conteúdo das Tabs */}
        <View style={styles.tabContent}>
          {selectedTab === 'myGroups' ? (
            // Meus Grupos
            myGroups.length > 0 ? (
              myGroups.map((group) => (
                <TouchableOpacity 
                  key={group.id}
                  style={styles.groupCard}
                  onPress={() => navigation.navigate('GroupDetail', {
                    groupId: group.id,
                    groupName: group.name,
                    accompaniedName: group.accompanied_name,
                  })}
                  activeOpacity={0.7}
                >
                  {group.photo_url ? (
                    <Image source={{ uri: group.photo_url }} style={styles.groupPhoto} />
                  ) : (
                    <View style={styles.groupIcon}>
                      <Ionicons name="people" size={32} color={colors.primary} />
                    </View>
                  )}
                  <View style={styles.groupInfo}>
                    <Text style={styles.groupName}>{group.name}</Text>
                    <Text style={styles.groupDescription}>
                      {group.accompanied_name ? `Acompanhando ${group.accompanied_name}` : 'Grupo de cuidados'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color={colors.gray400} />
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color={colors.gray300} />
                <Text style={styles.emptyStateTitle}>Nenhum grupo criado</Text>
                <Text style={styles.emptyStateText}>
                  Crie um grupo para acompanhar alguém especial
                </Text>
                <TouchableOpacity 
                  style={styles.createButton}
                  onPress={handleCreateGroup}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={20} color={colors.textWhite} />
                  <Text style={styles.createButtonText}>Criar Grupo</Text>
                </TouchableOpacity>
              </View>
            )
          ) : (
            // Grupos que Participo
            participatingGroups.length > 0 ? (
              participatingGroups.map((group) => (
                <TouchableOpacity 
                  key={group.id}
                  style={styles.groupCard}
                  onPress={() => navigation.navigate('GroupDetail', {
                    groupId: group.id,
                    groupName: group.name,
                    accompaniedName: group.accompanied_name,
                  })}
                  activeOpacity={0.7}
                >
                  {group.photo_url ? (
                    <Image source={{ uri: group.photo_url }} style={styles.groupPhoto} />
                  ) : (
                    <View style={styles.groupIcon}>
                      <Ionicons name="people" size={32} color={colors.secondary} />
                    </View>
                  )}
                  <View style={styles.groupInfo}>
                    <Text style={styles.groupName}>{group.name}</Text>
                    <Text style={styles.groupDescription}>
                      {group.accompanied_name ? `Acompanhando ${group.accompanied_name}` : 'Membro do grupo'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color={colors.gray400} />
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="enter-outline" size={48} color={colors.gray300} />
                <Text style={styles.emptyStateTitle}>Nenhum grupo ainda</Text>
                <Text style={styles.emptyStateText}>
                  Use um código de convite para entrar em um grupo
                </Text>
                <TouchableOpacity 
                  style={[styles.createButton, { backgroundColor: colors.secondary }]}
                  onPress={() => navigation.navigate('Groups')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="enter" size={20} color={colors.textWhite} />
                  <Text style={styles.createButtonText}>Entrar em Grupo</Text>
                </TouchableOpacity>
              </View>
            )
          )}
        </View>

        {/* Últimas Atualizações */}
        {(() => {
          const currentGroups = selectedTab === 'myGroups' ? myGroups : participatingGroups;
          const hasGroups = currentGroups.length > 0;
          
          // Filtrar atividades apenas dos grupos da aba atual
          const filteredActivities = recentActivities.filter(activity => {
            return currentGroups.some(group => group.groupName === activity.groupName);
          });

          if (!hasGroups) {
            return null; // Não mostrar seção se não há grupos
          }

          return (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Últimas Atualizações</Text>
                {filteredActivities.length > 0 && (
                  <TouchableOpacity>
                    <Text style={styles.seeAllText}>Ver todas</Text>
                  </TouchableOpacity>
                )}
              </View>

              {filteredActivities.length > 0 ? (
                filteredActivities.map((activity) => (
                  <View key={activity.id} style={styles.activityCard}>
                    <View style={[styles.activityIcon, { backgroundColor: activity.color + '20' }]}>
                      <Ionicons name={activity.icon} size={24} color={activity.color} />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>{activity.title}</Text>
                      <Text style={styles.activityDescription}>{activity.description}</Text>
                      <View style={styles.activityMeta}>
                        <Text style={styles.activityGroup}>{activity.groupName}</Text>
                        <Text style={styles.activityTime}>• {activity.time}</Text>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyActivities}>
                  <Ionicons name="time-outline" size={48} color={colors.gray300} />
                  <Text style={styles.emptyActivitiesText}>
                    {selectedTab === 'myGroups' 
                      ? 'Nenhuma atividade recente nos seus grupos'
                      : 'Nenhuma atividade recente nos grupos que você participa'}
                  </Text>
                </View>
              )}
            </View>
          );
        })()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.error,
    marginTop: 24,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: colors.gray600,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.gray600,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'android' ? 8 : 16,
    backgroundColor: colors.background,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greetingContainer: {
    flexDirection: 'column',
  },
  greeting: {
    fontSize: 14,
    color: colors.textLight,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.error,
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: colors.textWhite,
    fontSize: 10,
    fontWeight: 'bold',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    position: 'relative',
  },
  tabActive: {
    // Tab ativo
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textLight,
  },
  tabTextActive: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.primary,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  tabContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  groupIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupPhoto: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    color: colors.textLight,
  },
  emptyState: {
    backgroundColor: colors.backgroundLight,
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 16,
  },
  createButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    gap: 8,
  },
  createButtonText: {
    color: colors.textWhite,
    fontSize: 14,
    fontWeight: '600',
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
    gap: 8,
  },
  viewMoreText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '48%',
    backgroundColor: colors.backgroundLight,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  actionBigCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionBigCardIcon: {
    marginRight: 16,
  },
  actionBigCardContent: {
    flex: 1,
  },
  actionBigCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textWhite,
    marginBottom: 4,
  },
  actionBigCardDescription: {
    fontSize: 13,
    color: colors.textWhite,
    opacity: 0.9,
  },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 6,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activityGroup: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  activityTime: {
    fontSize: 12,
    color: colors.textLight,
  },
  emptyActivities: {
    backgroundColor: colors.backgroundLight,
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyActivitiesText: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 12,
  },
});

export default HomeScreen;


import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import colors from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { LacosIcon, LacosLogoFull } from '../../components/LacosLogo';
import {
  MedicationIcon,
  VitalSignsIcon,
  AppointmentIcon,
  MessagesIcon,
} from '../../components/CustomIcons';

const GROUPS_STORAGE_KEY = '@lacos_groups';

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [myGroups, setMyGroups] = useState([]);
  const [participatingGroups, setParticipatingGroups] = useState([]);
  const [selectedTab, setSelectedTab] = useState('myGroups'); // 'myGroups' ou 'participating'
  const [recentActivities, setRecentActivities] = useState([
    {
      id: 1,
      type: 'medication',
      title: 'Medicamento adicionado',
      description: 'Losartana 50mg foi cadastrado',
      groupName: 'Grupo Pessoal',
      time: '2 horas atrás',
      icon: 'medical',
      color: colors.secondary,
    },
    {
      id: 2,
      type: 'appointment',
      title: 'Consulta agendada',
      description: 'Dr. João Silva - Cardiologia',
      groupName: 'Grupo Pessoal',
      time: '5 horas atrás',
      icon: 'calendar',
      color: colors.warning,
    },
    {
      id: 3,
      type: 'exam',
      title: 'Exame anexado',
      description: 'Hemograma completo',
      groupName: 'Cuidados Maria',
      time: '1 dia atrás',
      icon: 'document-text',
      color: colors.info,
    },
  ]);

  // Carregar grupos quando a tela recebe foco
  useFocusEffect(
    React.useCallback(() => {
      loadGroups();
    }, [])
  );

  const loadGroups = async () => {
    try {
      const groupsJson = await AsyncStorage.getItem(GROUPS_STORAGE_KEY);
      let groups = [];
      
      if (groupsJson) {
        groups = JSON.parse(groupsJson);
      }
      
      // TEMPORÁRIO: Adicionar grupo de teste do banco de dados
      // TODO: Substituir por chamada à API quando groupService estiver integrado
      const testGroup = {
        id: 1, // ID real do banco de dados
        groupName: 'Grupo Pessoal (Teste)',
        accompaniedName: 'João Silva',
        accessCode: 'TESTE123',
        isAdmin: true,
        memberCount: 1,
        createdAt: new Date().toISOString(),
      };
      
      // Verificar se o grupo de teste já existe
      const hasTestGroup = groups.some(g => g.id === 1);
      if (!hasTestGroup) {
        groups.unshift(testGroup); // Adiciona no início
      }
      
      // "Meus Grupos" = grupos que EU criei (isAdmin ou criado por mim)
      // "Participo" = grupos que OUTRO criou e me convidou
      const myCreatedGroups = groups.filter(g => g.isAdmin !== false);
      const joinedGroups = groups.filter(g => g.isAdmin === false);
      setMyGroups(myCreatedGroups);
      setParticipatingGroups(joinedGroups);
    } catch (error) {
      console.error('Erro ao carregar grupos:', error);
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

  return (
    <SafeAreaView style={styles.container}>
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
                    groupName: group.groupName,
                    accompaniedName: group.accompaniedName,
                  })}
                  activeOpacity={0.7}
                >
                  <View style={styles.groupIcon}>
                    <Ionicons name="people" size={32} color={colors.primary} />
                  </View>
                  <View style={styles.groupInfo}>
                    <Text style={styles.groupName}>{group.groupName}</Text>
                    <Text style={styles.groupDescription}>
                      {group.accompaniedName ? `Acompanhando ${group.accompaniedName}` : 'Grupo de cuidados'}
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
                    groupName: group.groupName,
                    accompaniedName: group.accompaniedName,
                  })}
                  activeOpacity={0.7}
                >
                  <View style={styles.groupIcon}>
                    <Ionicons name="people" size={32} color={colors.secondary} />
                  </View>
                  <View style={styles.groupInfo}>
                    <Text style={styles.groupName}>{group.groupName}</Text>
                    <Text style={styles.groupDescription}>
                      {group.accompaniedName ? `Acompanhando ${group.accompaniedName}` : 'Membro do grupo'}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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


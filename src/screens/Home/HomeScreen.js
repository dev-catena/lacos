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

  // Carregar grupos quando a tela recebe foco
  useFocusEffect(
    React.useCallback(() => {
      loadGroups();
    }, [])
  );

  const loadGroups = async () => {
    try {
      const groupsJson = await AsyncStorage.getItem(GROUPS_STORAGE_KEY);
      if (groupsJson) {
        const groups = JSON.parse(groupsJson);
        setMyGroups(groups);
      } else {
        setMyGroups([]);
      }
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
    navigation.navigate('Groups');
    // TODO: Abrir modal ou tela de criação de grupo
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
        {/* Grupos que acompanho */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Meus Grupos</Text>
            <TouchableOpacity onPress={handleGroupPress}>
              <Text style={styles.seeAllText}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          
          {myGroups.length > 0 ? (
            <>
              {myGroups.slice(0, 3).map((group) => (
                <TouchableOpacity 
                  key={group.id}
                  style={styles.groupCard}
                  onPress={() => navigation.navigate('Groups')}
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
              ))}
              {myGroups.length > 3 && (
                <TouchableOpacity 
                  style={styles.viewMoreButton}
                  onPress={handleGroupPress}
                >
                  <Text style={styles.viewMoreText}>Ver mais {myGroups.length - 3} grupos</Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.primary} />
                </TouchableOpacity>
              )}
            </>
          ) : (
          <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color={colors.gray300} />
            <Text style={styles.emptyStateTitle}>Nenhum grupo ainda</Text>
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
          )}
        </View>

        {/* Ações Rápidas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ações Rápidas</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={handleMedication}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.primary + '20' }]}>
                <MedicationIcon size={28} color={colors.primary} />
              </View>
              <Text style={styles.actionText}>Registrar Medicação</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={handleVitalSigns}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.secondary + '20' }]}>
                <VitalSignsIcon size={28} color={colors.secondary} />
              </View>
              <Text style={styles.actionText}>Sinais Vitais</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={handleAppointment}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.info + '20' }]}>
                <AppointmentIcon size={28} color={colors.info} />
              </View>
              <Text style={styles.actionText}>Agendar Consulta</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={handleMessages}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.success + '20' }]}>
                <MessagesIcon size={28} color={colors.success} />
              </View>
              <Text style={styles.actionText}>Mensagens</Text>
            </TouchableOpacity>
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
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
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
});

export default HomeScreen;


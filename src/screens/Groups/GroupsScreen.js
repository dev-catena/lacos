import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import colors from '../../constants/colors';
import { LacosIcon } from '../../components/LacosLogo';
import { 
  CalendarIcon, 
  PulseIcon, 
  SettingsIcon, 
  PersonIcon,
  AddIcon,
  CloseIcon 
} from '../../components/CustomIcons';

const GROUPS_STORAGE_KEY = '@lacos_groups';

const GroupsScreen = ({ navigation }) => {
  const [searchText, setSearchText] = useState('');
  const [myGroups, setMyGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Carregar grupos quando a tela recebe foco
  useFocusEffect(
    React.useCallback(() => {
      loadGroups();
    }, [])
  );

  const loadGroups = async () => {
    try {
      setLoading(true);
      const groupsJson = await AsyncStorage.getItem(GROUPS_STORAGE_KEY);
      if (groupsJson) {
        const groups = JSON.parse(groupsJson);
        setMyGroups(groups);
      }
    } catch (error) {
      console.error('Erro ao carregar grupos:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <LacosIcon size={36} />
          <Text style={styles.title}>Grupos</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateGroup')}
        >
          <AddIcon size={24} color={colors.textWhite} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.gray400} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar grupos..."
          placeholderTextColor={colors.placeholder}
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Ionicons name="close-circle" size={20} color={colors.gray400} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Meus Grupos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meus Grupos</Text>
          
          {myGroups.length > 0 ? (
            myGroups.map((group) => (
              <TouchableOpacity 
                key={group.id} 
                style={styles.groupCard}
                onPress={() => navigation.navigate('GroupSettings', {
                  groupId: group.id,
                  groupName: group.groupName
                })}
                activeOpacity={0.7}
              >
            <View style={styles.groupHeader}>
              <View style={styles.groupIconContainer}>
                <PersonIcon size={28} color={colors.primary} />
              </View>
              <View style={styles.groupContent}>
                    <Text style={styles.groupName}>{group.groupName}</Text>
                    <View style={styles.groupMembersRow}>
                      <Ionicons name="people" size={14} color={colors.textLight} />
                      <Text style={styles.groupMembers}>2 membros</Text>
                    </View>
                    {group.accompaniedName && (
                      <View style={styles.membersListContainer}>
                        <View style={styles.memberItem}>
                          <Ionicons name="shield-checkmark" size={12} color={colors.primary} />
                          <Text style={styles.memberName}>Você (Admin)</Text>
                        </View>
                        <View style={styles.memberItem}>
                          <Ionicons name="heart" size={12} color={colors.secondary} />
                          <Text style={styles.memberName}>{group.accompaniedName}</Text>
                        </View>
                      </View>
                    )}
              </View>
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>Admin</Text>
              </View>
            </View>
            <View style={styles.groupFooter}>
              <View style={styles.groupStats}>
                <View style={styles.groupStat}>
                      <Ionicons name="medical" size={16} color={colors.info} />
                      <Text style={styles.groupStatText}>0 medicações</Text>
                </View>
                <View style={styles.groupStat}>
                      <Ionicons name="calendar" size={16} color={colors.warning} />
                      <Text style={styles.groupStatText}>0 consultas</Text>
                </View>
              </View>
              <View style={styles.groupActions}>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => navigation.navigate('Medications', { 
                        groupId: group.id, 
                        groupName: group.groupName
                      })}
                    >
                      <Ionicons name="medical" size={18} color={colors.secondary} />
                      <Text style={styles.actionButtonText}>Remédios</Text>
                    </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('Agenda', { 
                        groupId: group.id, 
                        groupName: group.groupName
                  })}
                >
                  <CalendarIcon size={18} color={colors.warning} />
                  <Text style={styles.actionButtonText}>Agenda</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('AddVitalSigns', { 
                        groupId: group.id, 
                        groupName: group.groupName,
                        accompaniedPersonId: group.id
                  })}
                >
                  <PulseIcon size={18} color={colors.success} />
                  <Text style={styles.actionButtonText}>Sinais</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('GroupSettings', { 
                        groupId: group.id, 
                        groupName: group.groupName
                  })}
                >
                  <SettingsIcon size={18} color={colors.primary} />
                  <Text style={styles.actionButtonText}>Config</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <PersonIcon size={40} color={colors.gray300} />
              <Text style={styles.emptyTitle}>Nenhum grupo criado</Text>
              <Text style={styles.emptyText}>
                Crie seu primeiro grupo para começar a acompanhar alguém
              </Text>
            </View>
          )}
        </View>

        {/* Grupos que Participo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Grupos que Participo</Text>
          
          {/* Empty state */}
          <View style={styles.emptyCard}>
            <Ionicons name="people-outline" size={40} color={colors.gray300} />
            <Text style={styles.emptyTitle}>Nenhum grupo ainda</Text>
            <Text style={styles.emptyText}>
              Você ainda não foi adicionado a nenhum grupo de cuidados
            </Text>
          </View>
        </View>

        {/* Convites Pendentes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Convites Pendentes</Text>
          
          {/* Convite exemplo (comentado - placeholder) */}
          {/* <View style={styles.inviteCard}>
            <View style={styles.inviteHeader}>
              <View style={styles.groupIconContainer}>
                <Ionicons name="mail" size={28} color={colors.secondary} />
              </View>
              <View style={styles.inviteContent}>
                <Text style={styles.inviteName}>Grupo da Maria Silva</Text>
                <Text style={styles.inviteFrom}>Convidado por João Silva</Text>
              </View>
            </View>
            <View style={styles.inviteActions}>
              <TouchableOpacity style={styles.rejectButton}>
                <Text style={styles.rejectButtonText}>Recusar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.acceptButton}>
                <Text style={styles.acceptButtonText}>Aceitar</Text>
              </TouchableOpacity>
            </View>
          </View> */}
          
          <View style={styles.emptyCard}>
            <Ionicons name="mail-outline" size={40} color={colors.gray300} />
            <Text style={styles.emptyTitle}>Nenhum convite</Text>
            <Text style={styles.emptyText}>
              Você não tem convites pendentes no momento
            </Text>
          </View>
        </View>

        {/* Botão criar novo grupo */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.createGroupButton}
            onPress={() => navigation.navigate('CreateGroup')}
          >
            <Ionicons name="add-circle" size={24} color={colors.primary} />
            <Text style={styles.createGroupText}>Criar Novo Grupo</Text>
          </TouchableOpacity>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  groupCard: {
    backgroundColor: colors.backgroundLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  groupIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupContent: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  groupMembersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  groupMembers: {
    fontSize: 13,
    color: colors.textLight,
  },
  membersListContainer: {
    marginTop: 8,
    gap: 4,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  memberName: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
  },
  groupAccompanied: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
    fontStyle: 'italic',
  },
  adminBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adminBadgeText: {
    fontSize: 12,
    color: colors.textWhite,
    fontWeight: '600',
  },
  groupFooter: {
    flexDirection: 'column',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  groupStats: {
    flexDirection: 'row',
    gap: 16,
  },
  groupStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  groupStatText: {
    fontSize: 13,
    color: colors.textLight,
  },
  groupActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  emptyCard: {
    backgroundColor: colors.backgroundLight,
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
  },
  createGroupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundLight,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    gap: 8,
  },
  createGroupText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
});

export default GroupsScreen;


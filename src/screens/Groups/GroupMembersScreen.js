import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import colors from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import groupMemberService from '../../services/groupMemberService';

const GroupMembersScreen = ({ route, navigation }) => {
  const { groupId, groupName } = route.params;
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [members, setMembers] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadMembers();
    }, [groupId])
  );

  const loadMembers = async () => {
    try {
      console.log('👥 Carregando membros do grupo:', groupId);
      console.log('👤 Usuário logado ID:', user?.id);
      console.log('👤 Usuário logado Nome:', user?.name);
      
      const result = await groupMemberService.getGroupMembers(groupId);
      
      if (result.success && result.data) {
        console.log('📋 Membros retornados pela API:', JSON.stringify(result.data, null, 2));
        setMembers(result.data);
        
        // Verificar se o usuário logado é admin
        const currentUserMember = result.data.find(m => m.user_id === user?.id);
        console.log('🔍 Membro atual encontrado:', currentUserMember);
        console.log('🔍 Role do membro atual:', currentUserMember?.role);
        
        const userIsAdmin = currentUserMember?.role === 'admin';
        setIsAdmin(userIsAdmin);
        
        console.log(`👑 É ADMIN? ${userIsAdmin ? 'SIM ✅' : 'NÃO ❌'}`);
        console.log(`✅ ${result.data.length} membro(s) carregado(s)`);
        
        // Log de cada membro
        result.data.forEach(m => {
          console.log(`  - ${m.user?.name} (ID: ${m.user_id}, Role: ${m.role})`);
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Erro',
          text2: result.error || 'Não foi possível carregar membros',
        });
      }
    } catch (error) {
      console.error('❌ Erro ao carregar membros:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível carregar membros',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMembers();
  };

  const handlePromoteToAdmin = (member) => {
    if (!isAdmin) {
      Toast.show({
        type: 'error',
        text1: 'Sem Permissão',
        text2: 'Apenas administradores podem promover membros',
      });
      return;
    }

    Alert.alert(
      'Promover para Administrador',
      `Deseja promover ${member.user?.name} para administrador?\n\nEle terá acesso total às configurações do grupo.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Promover',
          style: 'default',
          onPress: async () => {
            try {
              const result = await groupMemberService.promoteMemberToAdmin(groupId, member.id);
              if (result.success) {
                Toast.show({
                  type: 'success',
                  text1: 'Sucesso!',
                  text2: `${member.user?.name} agora é administrador`,
                });
                loadMembers();
              } else {
                Toast.show({
                  type: 'error',
                  text1: 'Erro',
                  text2: result.error || 'Não foi possível promover',
                });
              }
            } catch (error) {
              console.error('Erro ao promover:', error);
              Toast.show({
                type: 'error',
                text1: 'Erro',
                text2: 'Não foi possível promover membro',
              });
            }
          },
        },
      ]
    );
  };

  const handleDemoteAdmin = (member) => {
    if (!isAdmin) return;

    Alert.alert(
      'Remover Administrador',
      `Deseja rebaixar ${member.user?.name} para cuidador?\n\nEle perderá acesso às configurações do grupo.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rebaixar',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await groupMemberService.demoteAdminToCaregiver(groupId, member.id);
              if (result.success) {
                Toast.show({
                  type: 'success',
                  text1: 'Sucesso!',
                  text2: `${member.user?.name} agora é cuidador`,
                });
                loadMembers();
              } else {
                Toast.show({
                  type: 'error',
                  text1: 'Erro',
                  text2: result.error || 'Não foi possível rebaixar',
                });
              }
            } catch (error) {
              console.error('Erro ao rebaixar:', error);
              Toast.show({
                type: 'error',
                text1: 'Erro',
                text2: 'Não foi possível rebaixar membro',
              });
            }
          },
        },
      ]
    );
  };

  const handleRemoveMember = (member) => {
    if (!isAdmin) return;

    // Não pode remover a si mesmo
    if (member.user_id === user?.id) {
      Toast.show({
        type: 'error',
        text1: 'Não Permitido',
        text2: 'Você não pode remover a si mesmo do grupo',
      });
      return;
    }

    Alert.alert(
      'Remover Membro',
      `Deseja remover ${member.user?.name} do grupo?\n\nEsta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await groupMemberService.removeMember(groupId, member.id);
              if (result.success) {
                Toast.show({
                  type: 'success',
                  text1: 'Membro Removido',
                  text2: `${member.user?.name} foi removido do grupo`,
                });
                loadMembers();
              } else {
                Toast.show({
                  type: 'error',
                  text1: 'Erro',
                  text2: result.error || 'Não foi possível remover',
                });
              }
            } catch (error) {
              console.error('Erro ao remover:', error);
              Toast.show({
                type: 'error',
                text1: 'Erro',
                text2: 'Não foi possível remover membro',
              });
            }
          },
        },
      ]
    );
  };

  const handleChangePatient = (member) => {
    if (!isAdmin) return;

    // Só pode trocar se for um cuidador
    if (member.role === 'patient') {
      Toast.show({
        type: 'info',
        text1: 'Info',
        text2: 'Este membro já é o paciente',
      });
      return;
    }

    // Encontrar paciente atual
    const currentPatient = members.find(m => m.role === 'patient');

    Alert.alert(
      'Trocar Paciente',
      `Deseja tornar ${member.user?.name} o paciente do grupo?\n\n${currentPatient ? `${currentPatient.user?.name} voltará a ser cuidador.` : 'Esta pessoa será o novo paciente.'}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: 'default',
          onPress: async () => {
            try {
              const result = await groupMemberService.changePatient(
                groupId,
                currentPatient?.id || null,
                member.id
              );
              if (result.success) {
                Toast.show({
                  type: 'success',
                  text1: 'Paciente Alterado',
                  text2: `${member.user?.name} agora é o paciente`,
                });
                loadMembers();
              } else {
                Toast.show({
                  type: 'error',
                  text1: 'Erro',
                  text2: result.error || 'Não foi possível trocar paciente',
                });
              }
            } catch (error) {
              console.error('Erro ao trocar paciente:', error);
              Toast.show({
                type: 'error',
                text1: 'Erro',
                text2: 'Não foi possível trocar paciente',
              });
            }
          },
        },
      ]
    );
  };

  const renderMemberActions = (member) => {
    console.log('─────────────────────────────────────');
    console.log(`🎯 renderMemberActions chamado para: ${member.user?.name}`);
    console.log(`   - Member ID: ${member.id}`);
    console.log(`   - User ID: ${member.user_id}`);
    console.log(`   - Role: ${member.role}`);
    console.log(`   - isAdmin global: ${isAdmin}`);
    console.log(`   - user?.id (logado): ${user?.id}`);
    
    if (!isAdmin) {
      console.log('❌ BLOQUEADO: Usuário não é admin');
      return null;
    }
    if (member.user_id === user?.id) {
      console.log('❌ BLOQUEADO: É o próprio usuário');
      return null;
    }

    console.log('✅ PASSOU nas validações! Renderizando botões...');
    console.log(`   - Role: ${member.role}`);
    console.log(`   - É admin? ${member.role === 'admin'}`);
    console.log(`   - É cuidador? ${member.role === 'caregiver'}`);
    console.log(`   - É paciente? ${member.role === 'patient'}`);

    return (
      <View style={styles.memberActions}>
        {/* Promover/Rebaixar Admin */}
        {member.role === 'admin' ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.demoteButton]}
            onPress={() => handleDemoteAdmin(member)}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-down-circle-outline" size={20} color={colors.warning} />
            <Text style={[styles.actionButtonText, { color: colors.warning }]}>
              Rebaixar
            </Text>
          </TouchableOpacity>
        ) : member.role === 'caregiver' ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.promoteButton]}
            onPress={() => handlePromoteToAdmin(member)}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-up-circle-outline" size={20} color={colors.success} />
            <Text style={[styles.actionButtonText, { color: colors.success }]}>
              Promover
            </Text>
          </TouchableOpacity>
        ) : null}

        {/* Trocar Paciente */}
        {member.role !== 'patient' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.changePatientButton]}
            onPress={() => handleChangePatient(member)}
            activeOpacity={0.7}
          >
            <Ionicons name="swap-horizontal-outline" size={20} color={colors.info} />
            <Text style={[styles.actionButtonText, { color: colors.info }]}>
              Tornar Paciente
            </Text>
          </TouchableOpacity>
        )}

        {/* Remover */}
        <TouchableOpacity
          style={[styles.actionButton, styles.removeButton]}
          onPress={() => handleRemoveMember(member)}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={20} color={colors.error} />
          <Text style={[styles.actionButtonText, { color: colors.error }]}>
            Remover
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const getRoleBadge = (role) => {
    if (role === 'admin') {
      return (
        <View style={styles.adminBadge}>
          <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
          <Text style={styles.adminBadgeText}>Administrador</Text>
        </View>
      );
    } else if (role === 'patient') {
      return (
        <View style={styles.patientBadge}>
          <Ionicons name="medkit" size={14} color={colors.secondary} />
          <Text style={styles.patientBadgeText}>Paciente</Text>
        </View>
      );
    } else {
      return (
        <View style={styles.caregiverBadge}>
          <Ionicons name="heart" size={14} color={colors.info} />
          <Text style={styles.caregiverBadgeText}>Cuidador</Text>
        </View>
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando membros...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Membros do Grupo</Text>
          <Text style={styles.headerSubtitle}>{groupName}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.memberCount}>{members.length}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Info Card */}
        {isAdmin && (
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={20} color={colors.primary} />
            <Text style={styles.infoText}>
              Como administrador, você pode promover cuidadores, trocar o paciente ou remover membros.
            </Text>
          </View>
        )}

        {/* Lista de Membros */}
        <View style={styles.section}>
          {members.map((member) => {
            const isCurrentUser = member.user_id === user?.id;
            const isPatientRole = member.role === 'patient';

            return (
              <View
                key={member.id}
                style={[
                  styles.memberCard,
                  isPatientRole && styles.patientCard,
                  isCurrentUser && styles.currentUserCard,
                ]}
              >
                <View style={styles.memberHeader}>
                  <View style={styles.memberAvatarContainer}>
                    <View
                      style={[
                        styles.memberAvatar,
                        isPatientRole && styles.patientAvatar,
                      ]}
                    >
                      <Ionicons
                        name={isPatientRole ? 'heart' : 'person'}
                        size={28}
                        color={isPatientRole ? colors.secondary : colors.primary}
                      />
                    </View>
                    <View style={styles.memberInfo}>
                      <View style={styles.memberNameRow}>
                        <Text style={styles.memberName}>
                          {member.user?.name || 'Membro'}
                          {isCurrentUser && (
                            <Text style={styles.youText}> (Você)</Text>
                          )}
                        </Text>
                        {getRoleBadge(member.role)}
                      </View>
                      {member.user?.email && (
                        <View style={styles.memberDetail}>
                          <Ionicons name="mail-outline" size={14} color={colors.textLight} />
                          <Text style={styles.memberDetailText}>
                            {member.user.email}
                          </Text>
                        </View>
                      )}
                      {member.joined_at && (
                        <View style={styles.memberDetail}>
                          <Ionicons name="calendar-outline" size={14} color={colors.textLight} />
                          <Text style={styles.memberDetailText}>
                            Entrou em: {new Date(member.joined_at).toLocaleDateString('pt-BR')}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {/* Ações (só para admin e não para si mesmo) */}
                {renderMemberActions(member)}
              </View>
            );
          })}
        </View>

        {/* Empty State */}
        {members.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={colors.gray300} />
            <Text style={styles.emptyStateTitle}>Nenhum membro</Text>
            <Text style={styles.emptyStateText}>
              Este grupo ainda não tem membros
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 2,
  },
  headerRight: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primary + '10',
    padding: 16,
    margin: 20,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: 20,
  },
  memberCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  patientCard: {
    backgroundColor: colors.secondary + '05',
    borderWidth: 2,
    borderColor: colors.secondary + '30',
  },
  currentUserCard: {
    borderWidth: 2,
    borderColor: colors.primary + '30',
  },
  memberHeader: {
    marginBottom: 12,
  },
  memberAvatarContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  memberAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  patientAvatar: {
    backgroundColor: colors.secondary + '20',
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  memberName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  youText: {
    fontSize: 14,
    fontWeight: 'normal',
    color: colors.primary,
  },
  memberDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  memberDetailText: {
    fontSize: 13,
    color: colors.textLight,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  adminBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  patientBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  patientBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.secondary,
  },
  caregiverBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.info + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  caregiverBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.info,
  },
  memberActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    gap: 8,
  },
  promoteButton: {
    backgroundColor: colors.success + '10',
    borderColor: colors.success + '30',
  },
  demoteButton: {
    backgroundColor: colors.warning + '10',
    borderColor: colors.warning + '30',
  },
  changePatientButton: {
    backgroundColor: colors.info + '10',
    borderColor: colors.info + '30',
  },
  removeButton: {
    backgroundColor: colors.error + '10',
    borderColor: colors.error + '30',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray600,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.gray500,
    textAlign: 'center',
  },
});

export default GroupMembersScreen;


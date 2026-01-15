import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import colors from '../../constants/colors';
import { LacosIcon } from '../../components/LacosLogo';
import { 
  CalendarIcon, 
  PulseIcon, 
  SettingsIcon, 
  PersonIcon,
  CloseIcon 
} from '../../components/CustomIcons';
import groupService from '../../services/groupService';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../contexts/AuthContext';

const GroupsScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const [searchText, setSearchText] = useState('');
  const [myGroups, setMyGroups] = useState([]);
  const [participatingGroups, setParticipatingGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joiningGroup, setJoiningGroup] = useState(false);
  
  // Processar código de convite de deep link
  useEffect(() => {
    // Verificar se há código de convite nos parâmetros da rota
    if (route?.params?.inviteCode) {
      const code = route.params.inviteCode;
      console.log('🔗 GroupsScreen - Código de convite recebido via deep link:', code);
      setInviteCode(code);
      setInviteModalVisible(true);
      // Limpar parâmetros para evitar reprocessamento
      navigation.setParams({ inviteCode: undefined, openModal: undefined });
    } else if (route?.params?.openModal && global.pendingInviteCode) {
      // Se há código pendente (de quando o usuário não estava autenticado)
      const code = global.pendingInviteCode;
      console.log('🔗 GroupsScreen - Usando código pendente:', code);
      setInviteCode(code);
      setInviteModalVisible(true);
      global.pendingInviteCode = undefined;
      navigation.setParams({ inviteCode: undefined, openModal: undefined });
    } else if (route?.params?.openModal) {
      // Apenas abrir o modal se solicitado
      setInviteModalVisible(true);
      navigation.setParams({ openModal: undefined });
    }
  }, [route?.params?.inviteCode, route?.params?.openModal, navigation]);
  
  // Função para testar deep link manualmente (útil para Expo Go)
  const testDeepLink = () => {
    const testUrl = 'http://10.102.0.103/grupo/TESTE123';
    console.log('🧪 Testando deep link manualmente:', testUrl);
    // Simular processamento de deep link
    const code = 'TESTE123';
    setInviteCode(code);
    setInviteModalVisible(true);
  };

  // Função auxiliar para verificar se é admin do grupo
  const isAdminOfGroup = (group) => {
    if (!user) return false;
    // Verificar se é criador
    if (group.created_by === user.id || group.is_creator === true) return true;
    // Verificar se tem role=admin
    const memberData = group.group_members?.find(m => m.user_id === user.id);
    return memberData?.role === 'admin';
  };

  // Carregar grupos quando a tela recebe foco
  useFocusEffect(
    React.useCallback(() => {
      loadGroups();
    }, [])
  );

  const loadGroups = async () => {
    try {
      setLoading(true);
      console.log('📋 GroupsScreen - Carregando grupos da API...');
      
      const result = await groupService.getMyGroups();
      
      if (result.success && result.data) {
        const allGroups = result.data;
        console.log(`✅ GroupsScreen - ${allGroups.length} grupo(s) encontrado(s)`);
        
        // Debug: verificar photo_url
        allGroups.forEach(g => {
          console.log(`📸 GroupsScreen - Grupo ${g.id} (${g.name}): photo_url = ${g.photo_url || 'null'}`);
        });
        
        // "Meus Grupos" = grupos que EU criei (is_creator=true)
        // FALLBACK: Se is_creator não existir, usa is_admin como critério temporário
        const myCreatedGroups = allGroups.filter(g => {
          if (g.is_creator !== undefined) {
            return g.is_creator === true;
          }
          // Fallback: considera que admins são criadores
          return g.is_admin === true;
        });
        
        // "Participo" = grupos onde fui convidado (is_creator=false)
        const joinedGroups = allGroups.filter(g => {
          if (g.is_creator !== undefined) {
            return g.is_creator === false;
          }
          // Fallback: não-admins são participantes
          return g.is_admin === false;
        });
        
        console.log(`📊 GroupsScreen - Meus: ${myCreatedGroups.length}, Participo: ${joinedGroups.length}`);
        
        setMyGroups(myCreatedGroups);
        setParticipatingGroups(joinedGroups);
      }
    } catch (error) {
      console.error('❌ GroupsScreen - Erro ao carregar grupos:', error);
      setMyGroups([]);
      setParticipatingGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinWithCode = async () => {
    if (!inviteCode.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Código obrigatório',
        text2: 'Digite o código de convite',
      });
      return;
    }

    setJoiningGroup(true);
    try {
      const result = await groupService.joinWithCode(inviteCode.trim());
      
      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Sucesso!',
          text2: `Você entrou no grupo ${result.data.group.name}${result.data.your_role ? ` como ${result.data.your_role === 'patient' ? 'paciente' : 'cuidador'}` : ''}`,
        });
        setInviteModalVisible(false);
        setInviteCode('');
        
        // Recarregar grupos
        loadGroups();
      } else {
        // Tratar erro específico de paciente duplicado
        const errorMessage = result.error || 'Código inválido';
        const isPatientLimitError = errorMessage.includes('já possui um paciente');
        
        Toast.show({
          type: 'error',
          text1: isPatientLimitError ? 'Grupo Completo' : 'Erro',
          text2: errorMessage,
          visibilityTime: isPatientLimitError ? 5000 : 3000, // Mais tempo para ler mensagem importante
        });
      }
    } catch (error) {
      console.error('Erro ao entrar no grupo:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível entrar no grupo',
      });
    }
    setJoiningGroup(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <LacosIcon size={36} />
          <Text style={styles.title}>Grupos</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person-circle-outline" size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>
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
                onPress={() => navigation.navigate('GroupDetail', {
                  groupId: group.id,
                  groupName: group.name,
                  accompaniedName: group.accompanied_name,
                })}
                activeOpacity={0.7}
              >
            <View style={styles.groupHeader}>
              {group.photo_url ? (
                <Image 
                  source={{ uri: group.photo_url }} 
                  style={styles.groupPhoto}
                />
              ) : (
                <View style={styles.groupIconContainer}>
                  <PersonIcon size={28} color={colors.primary} />
                </View>
              )}
              <View style={styles.groupContent}>
                    <Text style={styles.groupName}>{group.name}</Text>
                    <View style={styles.groupMembersRow}>
                      <Ionicons name="people" size={14} color={colors.textLight} />
                      <Text style={styles.groupMembers}>{group.members_count || 0} membro{group.members_count !== 1 ? 's' : ''}</Text>
                    </View>
                    {group.accompanied_name && (
                      <View style={styles.membersListContainer}>
                        <View style={styles.memberItem}>
                          <Ionicons name="shield-checkmark" size={12} color={colors.primary} />
                          <Text style={styles.memberName}>Você (Admin)</Text>
                        </View>
                        <View style={styles.memberItem}>
                          <Ionicons name="heart" size={12} color={colors.secondary} />
                          <Text style={styles.memberName}>{group.accompanied_name}</Text>
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
                        groupName: group.name
                      })}
                    >
                      <Ionicons name="medical" size={18} color={colors.secondary} />
                      <Text style={styles.actionButtonText}>Remédios</Text>
                    </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('Agenda', { 
                        groupId: group.id, 
                        groupName: group.name
                  })}
                >
                  <CalendarIcon size={18} color={colors.warning} />
                  <Text style={styles.actionButtonText}>Agenda</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('AddVitalSigns', { 
                        groupId: group.id, 
                        groupName: group.name,
                        accompaniedPersonId: group.id
                  })}
                >
                  <PulseIcon size={18} color={colors.success} />
                  <Text style={styles.actionButtonText}>Sinais</Text>
                </TouchableOpacity>
                {isAdminOfGroup(group) && (
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('GroupSettings', { 
                          groupId: group.id, 
                          groupName: group.name
                    })}
                  >
                    <SettingsIcon size={18} color={colors.primary} />
                    <Text style={styles.actionButtonText}>Config</Text>
                  </TouchableOpacity>
                )}
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
          
          {participatingGroups.length > 0 ? (
            participatingGroups.map((group) => (
              <TouchableOpacity
                key={group.id}
                style={styles.groupCard}
                onPress={() => navigation.navigate('GroupDetail', {
                  groupId: group.id,
                  groupName: group.name,
                  accompaniedName: group.accompanied_name
                })}
                activeOpacity={0.7}
              >
                <View style={styles.groupCardHeader}>
                  {group.photo_url ? (
                    <Image 
                      source={{ uri: group.photo_url }} 
                      style={styles.groupPhotoSmall}
                    />
                  ) : (
                    <View style={styles.groupIconContainer}>
                      <PersonIcon size={24} color={colors.primary} />
                    </View>
                  )}
                  <View style={styles.groupInfo}>
                    <Text style={styles.groupName}>{group.name}</Text>
                    {group.accompanied_name && (
                      <Text style={styles.groupSubtitle}>Paciente: {group.accompanied_name}</Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={24} color={colors.gray400} />
                </View>

                {/* Actions */}
                <View style={styles.groupActions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('Medications', { 
                      groupId: group.id, 
                      groupName: group.name
                    })}
                  >
                    <Ionicons name="medical" size={18} color={colors.secondary} />
                    <Text style={styles.actionButtonText}>Remédios</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('Agenda', { 
                      groupId: group.id, 
                      groupName: group.name
                    })}
                  >
                    <CalendarIcon size={18} color={colors.warning} />
                    <Text style={styles.actionButtonText}>Agenda</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('AddVitalSigns', { 
                      groupId: group.id, 
                      groupName: group.name,
                      accompaniedPersonId: group.id
                    })}
                  >
                    <PulseIcon size={18} color={colors.success} />
                    <Text style={styles.actionButtonText}>Sinais</Text>
                  </TouchableOpacity>
                  {isAdminOfGroup(group) && (
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => navigation.navigate('GroupSettings', { 
                        groupId: group.id, 
                        groupName: group.name
                      })}
                    >
                      <SettingsIcon size={18} color={colors.primary} />
                      <Text style={styles.actionButtonText}>Config</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="people-outline" size={40} color={colors.gray300} />
              <Text style={styles.emptyTitle}>Nenhum grupo ainda</Text>
              <Text style={styles.emptyText}>
                Você ainda não foi adicionado a nenhum grupo de cuidados
              </Text>
            </View>
          )}
        </View>

        {/* Botões de ação */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.createGroupButton}
            onPress={() => navigation.navigate('CreateGroup')}
          >
            <Ionicons name="add-circle" size={24} color={colors.primary} />
            <Text style={styles.createGroupText}>Criar Novo Grupo</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.joinGroupButton}
            onPress={() => setInviteModalVisible(true)}
          >
            <Ionicons name="key" size={24} color={colors.secondary} />
            <Text style={styles.joinGroupText}>Entrar com Código</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal de Código de Convite */}
      <Modal
        visible={inviteModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setInviteModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Entrar no Grupo</Text>
              <TouchableOpacity
                onPress={() => setInviteModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>
                Digite o código de convite que você recebeu:
              </Text>
              
              <View style={styles.codeInputContainer}>
                <Ionicons name="key-outline" size={20} color={colors.gray400} />
                <TextInput
                  style={styles.codeInput}
                  placeholder="Ex: ABC123XYZ"
                  placeholderTextColor={colors.gray400}
                  value={inviteCode}
                  onChangeText={setInviteCode}
                  autoCapitalize="characters"
                  maxLength={20}
                />
              </View>

              <TouchableOpacity
                style={[styles.joinButton, joiningGroup && styles.joinButtonDisabled]}
                onPress={handleJoinWithCode}
                disabled={joiningGroup}
              >
                <Text style={styles.joinButtonText}>
                  {joiningGroup ? 'Entrando...' : 'Entrar no Grupo'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
  groupPhoto: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
    backgroundColor: colors.gray200,
  },
  groupPhotoSmall: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: colors.gray200,
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
    marginBottom: 12,
  },
  createGroupText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  joinGroupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  joinGroupText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    backgroundColor: '#FFFFFF',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  modalLabel: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
  },
  codeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  codeInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 16,
    color: colors.text,
  },
  joinButton: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  joinButtonDisabled: {
    opacity: 0.6,
  },
  joinButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GroupsScreen;


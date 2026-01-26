import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import groupService from '../../services/groupService';
import Toast from 'react-native-toast-message';

const NoGroupsScreen = ({ navigation, route, onGroupJoined }) => {
  const { user, signed } = useAuth();
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  // Verificar se é paciente
  const isPatient = user?.profile === 'accompanied' || user?.role === 'accompanied';
  console.log('👤 NoGroupsScreen - User:', user?.name, '| Profile:', user?.profile, '| Is Patient:', isPatient);

  // Verificar autenticação
  useEffect(() => {
    if (!signed || !user) {
      console.error('❌ NoGroupsScreen - ACESSO NEGADO: Usuário não autenticado!');
      console.error('❌ Este é um BUG DE SEGURANÇA - bloqueando acesso');
      // Redirecionar imediatamente para login
      Alert.alert(
        'Acesso Negado',
        'Você precisa estar logado para acessar esta tela.',
        [{ text: 'OK' }]
      );
      return;
    }
  }, [signed, user]);

  // Processar código de convite de deep link
  useEffect(() => {
    // Verificar se há código de convite nos parâmetros da rota
    if (route?.params?.inviteCode) {
      const code = route.params.inviteCode;
      console.log('🔗 NoGroupsScreen - Código de convite recebido via deep link:', code);
      setInviteCode(code);
      setInviteModalVisible(true);
      // Limpar parâmetros para evitar reprocessamento
      navigation.setParams({ inviteCode: undefined, openModal: undefined });
    } else if (route?.params?.openModal && global.pendingInviteCode) {
      // Se há código pendente (de quando o usuário não estava autenticado)
      const code = global.pendingInviteCode;
      console.log('🔗 NoGroupsScreen - Usando código pendente:', code);
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

  const handleCreateGroup = () => {
    // GUARD: Verificar autenticação antes de qualquer ação
    if (!signed || !user) {
      console.error('❌ Tentativa de criar grupo sem autenticação bloqueada');
      Alert.alert(
        'Acesso Negado',
        'Você precisa estar logado para criar um grupo.',
        [{ text: 'OK' }]
      );
      return;
    }
    navigation.navigate('CreateGroup');
  };

  const handleJoinWithCode = async () => {
    // GUARD: Verificar autenticação
    if (!signed || !user) {
      console.error('❌ Tentativa de entrar em grupo sem autenticação bloqueada');
      Alert.alert(
        'Acesso Negado',
        'Você precisa estar logado para entrar em um grupo.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!inviteCode.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Código obrigatório',
        text2: 'Digite o código de convite',
      });
      return;
    }

    setLoading(true);
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
        
        // Notificar que entrou em um grupo
        if (onGroupJoined) {
          onGroupJoined();
        }
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
    setLoading(false);
  };

  // GUARD: Se não estiver autenticado, mostrar mensagem de erro
  if (!signed || !user) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
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

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      <StatusBar style="dark" />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Ilustração */}
          <View style={styles.illustrationContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="people-outline" size={80} color={colors.primary} />
            </View>
            <Text style={styles.title}>Bem-vindo ao Laços!</Text>
            <Text style={styles.description}>
              {isPatient
                ? 'Você ainda não faz parte de nenhum grupo de cuidados.\nPeça ao seu cuidador para te enviar um código de convite.'
                : 'Você ainda não faz parte de nenhum grupo de cuidados.\nCrie seu primeiro grupo ou entre em um usando um código de convite.'}
            </Text>
          </View>

          {/* Botões de Ação */}
          <View style={styles.actionsContainer}>
            {/* Botão "Criar Grupo" - SOMENTE para Cuidadores */}
            {!isPatient && (
              <TouchableOpacity
                style={[styles.actionCard, styles.createCard]}
                onPress={handleCreateGroup}
                activeOpacity={0.7}
              >
                <View style={styles.actionIconContainer}>
                  <Ionicons name="add-circle" size={40} color={colors.primary} />
                </View>
                <Text style={styles.actionTitle}>Criar Novo Grupo</Text>
                <Text style={styles.actionDescription}>
                  Crie um grupo para gerenciar os cuidados de um familiar ou amigo
                </Text>
                <View style={styles.actionArrow}>
                  <Ionicons name="arrow-forward" size={20} color={colors.primary} />
                </View>
              </TouchableOpacity>
            )}

            {/* Botão "Entrar com Código" - Para TODOS */}
            <TouchableOpacity
              style={[styles.actionCard, styles.joinCard]}
              onPress={() => setInviteModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="qr-code" size={40} color={colors.success} />
              </View>
              <Text style={styles.actionTitle}>Entrar com Código</Text>
              <Text style={styles.actionDescription}>
                Use um código de convite para entrar em um grupo existente
              </Text>
              <View style={styles.actionArrow}>
                <Ionicons name="arrow-forward" size={20} color={colors.success} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <View style={styles.infoIcon}>
              <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
            </View>
            <Text style={styles.infoText}>
              {isPatient
                ? 'Peça ao seu cuidador para criar um grupo e compartilhar o código de convite com você.'
                : 'Você pode fazer parte de vários grupos ao mesmo tempo e ter diferentes papéis em cada um.'}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal de Código de Convite */}
      <Modal
        visible={inviteModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setInviteModalVisible(false)}
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
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
                style={[styles.joinButton, loading && styles.joinButtonDisabled]}
                onPress={handleJoinWithCode}
                disabled={loading}
              >
                <Text style={styles.joinButtonText}>
                  {loading ? 'Entrando...' : 'Entrar no Grupo'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: colors.gray600,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  actionsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  actionCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: colors.gray200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  createCard: {
    borderColor: colors.primary + '30',
  },
  joinCard: {
    borderColor: colors.success + '30',
  },
  actionIconContainer: {
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  actionDescription: {
    fontSize: 14,
    color: colors.gray600,
    lineHeight: 20,
    marginBottom: 12,
  },
  actionArrow: {
    alignSelf: 'flex-end',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primary + '10',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginTop: 8,
  },
  infoIcon: {
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 15,
    zIndex: 1001,
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    paddingHorizontal: 24,
    paddingTop: 24,
    backgroundColor: '#FFFFFF',
  },
  modalLabel: {
    fontSize: 15,
    color: colors.text,
    marginBottom: 16,
    lineHeight: 22,
  },
  codeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    marginBottom: 24,
  },
  codeInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  joinButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  joinButtonDisabled: {
    opacity: 0.6,
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
});

export default NoGroupsScreen;


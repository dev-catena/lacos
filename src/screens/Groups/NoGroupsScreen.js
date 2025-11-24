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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import groupService from '../../services/groupService';
import Toast from 'react-native-toast-message';

const NoGroupsScreen = ({ navigation, onGroupJoined }) => {
  const { user, signed } = useAuth();
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  // Verificar autenticação
  useEffect(() => {
    if (!signed || !user) {
      console.warn('⚠️ NoGroupsScreen - Usuário não autenticado, não deveria estar aqui!');
    }
  }, [signed, user]);

  const handleCreateGroup = () => {
    navigation.navigate('CreateGroup');
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

    setLoading(true);
    try {
      const result = await groupService.joinWithCode(inviteCode.trim());
      
      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Sucesso!',
          text2: `Você entrou no grupo ${result.data.group.name}`,
        });
        setInviteModalVisible(false);
        setInviteCode('');
        
        // Notificar que entrou em um grupo
        if (onGroupJoined) {
          onGroupJoined();
        }
      } else {
        Toast.show({
          type: 'error',
          text1: 'Erro',
          text2: result.error || 'Código inválido',
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

  return (
    <SafeAreaView style={styles.container}>
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
              Você ainda não faz parte de nenhum grupo de cuidados.{'\n'}
              Crie seu primeiro grupo ou entre em um usando um código de convite.
            </Text>
          </View>

          {/* Botões de Ação */}
          <View style={styles.actionsContainer}>
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
              Você pode fazer parte de vários grupos ao mesmo tempo e ter diferentes papéis em cada um.
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
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


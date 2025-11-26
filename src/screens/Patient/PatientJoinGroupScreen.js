import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import { LacosLogoFull } from '../../components/LacosLogo';
import groupService from '../../services/groupService';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../contexts/AuthContext';

const PatientJoinGroupScreen = ({ navigation }) => {
  const { signOut } = useAuth();
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Você ainda não entrou em um grupo. Deseja sair e fazer login novamente?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🚪 PatientJoinGroupScreen - Fazendo logout...');
              await signOut();
              console.log('✅ PatientJoinGroupScreen - Logout concluído');
            } catch (error) {
              console.error('❌ PatientJoinGroupScreen - Erro ao fazer logout:', error);
              Toast.show({
                type: 'error',
                text1: 'Erro',
                text2: 'Não foi possível sair. Tente novamente.',
              });
            }
          },
        },
      ]
    );
  };

  const handleJoinGroup = async () => {
    if (!inviteCode.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Código obrigatório',
        text2: 'Digite o código de convite que você recebeu',
      });
      return;
    }

    setLoading(true);
    try {
      console.log('👤 PatientJoinGroupScreen - Tentando entrar no grupo com código:', inviteCode.trim());
      
      const result = await groupService.joinWithCode(inviteCode.trim());
      
      if (result.success) {
        console.log('✅ PatientJoinGroupScreen - Entrou no grupo:', result.data.group.name);
        
        Toast.show({
          type: 'success',
          text1: 'Bem-vindo!',
          text2: `Você entrou no grupo ${result.data.group.name}`,
        });

        // Aguardar um pouco para mostrar o toast
        setTimeout(() => {
          // Recarregar a navegação para que o PatientNavigator detecte o grupo
          navigation.reset({
            index: 0,
            routes: [{ name: 'PatientTabs' }],
          });
        }, 1500);
      } else {
        console.error('❌ PatientJoinGroupScreen - Erro:', result.error);
        
        // Tratar erro específico de paciente duplicado
        const errorMessage = result.error || 'Código não encontrado ou expirado';
        const isPatientLimitError = errorMessage.includes('já possui um paciente');
        
        Toast.show({
          type: 'error',
          text1: isPatientLimitError ? 'Grupo Completo' : 'Código inválido',
          text2: errorMessage,
          visibilityTime: isPatientLimitError ? 6000 : 3000, // Mais tempo para ler mensagem importante
        });
        
        // Se for erro de limite, sugerir alternativas
        if (isPatientLimitError) {
          setTimeout(() => {
            Alert.alert(
              'O que fazer?',
              'Este grupo já tem um paciente cadastrado.\n\n' +
              'Opções:\n' +
              '• Verifique se você recebeu o código correto\n' +
              '• Peça ao administrador para criar um novo grupo\n' +
              '• Ou cadastre-se como cuidador se for esse o seu papel',
              [{ text: 'Entendi' }]
            );
          }, 500);
        }
      }
    } catch (error) {
      console.error('❌ PatientJoinGroupScreen - Erro ao entrar no grupo:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível entrar no grupo',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      
      {/* Botão Sair no topo */}
      <View style={styles.topBar}>
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
          disabled={loading}
        >
          <Ionicons name="log-out-outline" size={22} color={colors.danger} />
          <Text style={styles.logoutButtonText}>Sair</Text>
        </TouchableOpacity>
      </View>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Logo e Título */}
          <View style={styles.header}>
            <LacosLogoFull width={180} height={56} />
            <View style={styles.iconCircle}>
              <Ionicons name="qr-code-outline" size={64} color={colors.primary} />
            </View>
            <Text style={styles.title}>Bem-vindo!</Text>
            <Text style={styles.description}>
              Para começar, digite o código de convite que você recebeu do seu cuidador.
            </Text>
          </View>

          {/* Campo de Código */}
          <View style={styles.form}>
            <Text style={styles.label}>Código de Convite *</Text>
            <View style={styles.codeInputContainer}>
              <Ionicons name="key-outline" size={22} color={colors.gray400} />
              <TextInput
                style={styles.codeInput}
                placeholder="Ex: ABC123XYZ"
                placeholderTextColor={colors.gray400}
                value={inviteCode}
                onChangeText={setInviteCode}
                autoCapitalize="characters"
                maxLength={20}
                editable={!loading}
              />
            </View>

            {/* Botão Entrar */}
            <TouchableOpacity
              style={[styles.joinButton, loading && styles.joinButtonDisabled]}
              onPress={handleJoinGroup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Ionicons name="log-in-outline" size={22} color={colors.white} />
                  <Text style={styles.joinButtonText}>Entrar no Grupo</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={24} color={colors.info} />
            <Text style={styles.infoText}>
              Peça ao seu cuidador para criar um grupo e compartilhar o código de convite com você.
            </Text>
          </View>

          {/* Ajuda */}
          <View style={styles.helpBox}>
            <Ionicons name="help-circle-outline" size={20} color={colors.gray600} />
            <Text style={styles.helpText}>
              Não recebeu o código? Entre em contato com seu cuidador.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.danger + '10',
  },
  logoutButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.danger,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: colors.gray600,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  form: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  codeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.gray200,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 20,
  },
  codeInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    paddingVertical: 14,
    paddingLeft: 12,
    letterSpacing: 2,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  joinButtonDisabled: {
    opacity: 0.6,
  },
  joinButtonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.info + '15',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.info,
    lineHeight: 20,
  },
  helpBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  helpText: {
    fontSize: 13,
    color: colors.gray600,
  },
});

export default PatientJoinGroupScreen;


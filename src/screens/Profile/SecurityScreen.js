import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import colors from '../../constants/colors';

const SecurityScreen = ({ navigation }) => {
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorMethod, setTwoFactorMethod] = useState('sms'); // 'sms' ou 'app'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword) {
      Alert.alert('Erro', 'Digite sua senha atual');
      return;
    }

    if (!passwordData.newPassword) {
      Alert.alert('Erro', 'Digite uma nova senha');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      Alert.alert('Erro', 'A nova senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }

    setLoading(true);

    try {
      // TODO: Integrar com API
      // await changePassword(passwordData);
      
      Toast.show({
        type: 'success',
        text1: '✅ Senha alterada',
        text2: 'Sua senha foi atualizada com sucesso',
        position: 'bottom',
      });

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setShowChangePassword(false);
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      Alert.alert('Erro', 'Não foi possível alterar a senha');
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    if (twoFactorMethod === 'sms' && !phoneNumber) {
      Alert.alert('Erro', 'Digite um número de telefone');
      return;
    }

    setLoading(true);

    try {
      // TODO: Integrar com API
      // await enable2FA({ method: twoFactorMethod, phone: phoneNumber });
      
      setTwoFactorEnabled(true);
      
      Toast.show({
        type: 'success',
        text1: '✅ 2FA ativado',
        text2: 'Autenticação de dois fatores configurada',
        position: 'bottom',
      });

      setShow2FA(false);
    } catch (error) {
      console.error('Erro ao ativar 2FA:', error);
      Alert.alert('Erro', 'Não foi possível ativar a autenticação de dois fatores');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = () => {
    Alert.alert(
      'Desativar 2FA',
      'Tem certeza que deseja desativar a autenticação de dois fatores?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desativar',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Integrar com API
              // await disable2FA();
              
              setTwoFactorEnabled(false);
              
              Toast.show({
                type: 'info',
                text1: '2FA desativado',
                text2: 'Autenticação de dois fatores removida',
                position: 'bottom',
              });
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível desativar o 2FA');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Segurança</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Alterar Senha */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setShowChangePassword(!showChangePassword)}
              activeOpacity={0.7}
            >
              <View style={styles.sectionHeaderLeft}>
                <View style={[styles.sectionIcon, { backgroundColor: colors.warning + '20' }]}>
                  <Ionicons name="key" size={24} color={colors.warning} />
                </View>
                <View>
                  <Text style={styles.sectionTitle}>Alterar Senha</Text>
                  <Text style={styles.sectionSubtitle}>Trocar sua senha de acesso</Text>
                </View>
              </View>
              <Ionicons 
                name={showChangePassword ? 'chevron-up' : 'chevron-down'} 
                size={24} 
                color={colors.gray400} 
              />
            </TouchableOpacity>

            {showChangePassword && (
              <View style={styles.expandedContent}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Senha Atual *</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={20} color={colors.gray400} />
                    <TextInput
                      style={styles.input}
                      placeholder="Digite sua senha atual"
                      value={passwordData.currentPassword}
                      onChangeText={(value) => setPasswordData({...passwordData, currentPassword: value})}
                      secureTextEntry={!showCurrentPassword}
                    />
                    <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                      <Ionicons 
                        name={showCurrentPassword ? 'eye-off' : 'eye'} 
                        size={20} 
                        color={colors.gray400} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Nova Senha *</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={20} color={colors.gray400} />
                    <TextInput
                      style={styles.input}
                      placeholder="Mínimo 6 caracteres"
                      value={passwordData.newPassword}
                      onChangeText={(value) => setPasswordData({...passwordData, newPassword: value})}
                      secureTextEntry={!showNewPassword}
                    />
                    <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                      <Ionicons 
                        name={showNewPassword ? 'eye-off' : 'eye'} 
                        size={20} 
                        color={colors.gray400} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Confirmar Nova Senha *</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={20} color={colors.gray400} />
                    <TextInput
                      style={styles.input}
                      placeholder="Digite novamente"
                      value={passwordData.confirmPassword}
                      onChangeText={(value) => setPasswordData({...passwordData, confirmPassword: value})}
                      secureTextEntry={!showConfirmPassword}
                    />
                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                      <Ionicons 
                        name={showConfirmPassword ? 'eye-off' : 'eye'} 
                        size={20} 
                        color={colors.gray400} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.actionButton, loading && styles.actionButtonDisabled]}
                  onPress={handleChangePassword}
                  disabled={loading}
                >
                  <Text style={styles.actionButtonText}>
                    {loading ? 'Alterando...' : 'Alterar Senha'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Autenticação de Dois Fatores */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => !twoFactorEnabled && setShow2FA(!show2FA)}
              activeOpacity={0.7}
            >
              <View style={styles.sectionHeaderLeft}>
                <View style={[styles.sectionIcon, { backgroundColor: colors.success + '20' }]}>
                  <Ionicons name="shield-checkmark" size={24} color={colors.success} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>Autenticação de Dois Fatores</Text>
                  <Text style={styles.sectionSubtitle}>
                    {twoFactorEnabled ? 'Ativa' : 'Adicione uma camada extra de segurança'}
                  </Text>
                </View>
              </View>
              {twoFactorEnabled ? (
                <Switch
                  value={twoFactorEnabled}
                  onValueChange={handleDisable2FA}
                  trackColor={{ false: colors.gray300, true: colors.success }}
                  thumbColor={colors.textWhite}
                />
              ) : (
                <Ionicons 
                  name={show2FA ? 'chevron-up' : 'chevron-down'} 
                  size={24} 
                  color={colors.gray400} 
                />
              )}
            </TouchableOpacity>

            {show2FA && !twoFactorEnabled && (
              <View style={styles.expandedContent}>
                <Text style={styles.helpText}>
                  Escolha como deseja receber o código de verificação:
                </Text>

                {/* Método SMS */}
                <TouchableOpacity
                  style={[
                    styles.methodCard,
                    twoFactorMethod === 'sms' && styles.methodCardActive,
                  ]}
                  onPress={() => setTwoFactorMethod('sms')}
                >
                  <View style={styles.methodIcon}>
                    <Ionicons 
                      name="chatbubble" 
                      size={24} 
                      color={twoFactorMethod === 'sms' ? colors.primary : colors.gray400} 
                    />
                  </View>
                  <View style={styles.methodContent}>
                    <Text style={styles.methodTitle}>SMS</Text>
                    <Text style={styles.methodSubtitle}>Receber código por SMS</Text>
                  </View>
                  {twoFactorMethod === 'sms' && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  )}
                </TouchableOpacity>

                {twoFactorMethod === 'sms' && (
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Número de Telefone *</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="call-outline" size={20} color={colors.gray400} />
                      <TextInput
                        style={styles.input}
                        placeholder="(11) 99999-9999"
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        keyboardType="phone-pad"
                      />
                    </View>
                  </View>
                )}

                {/* Método Aplicativo */}
                <TouchableOpacity
                  style={[
                    styles.methodCard,
                    twoFactorMethod === 'app' && styles.methodCardActive,
                  ]}
                  onPress={() => setTwoFactorMethod('app')}
                >
                  <View style={styles.methodIcon}>
                    <Ionicons 
                      name="phone-portrait" 
                      size={24} 
                      color={twoFactorMethod === 'app' ? colors.primary : colors.gray400} 
                    />
                  </View>
                  <View style={styles.methodContent}>
                    <Text style={styles.methodTitle}>Aplicativo Autenticador</Text>
                    <Text style={styles.methodSubtitle}>Google Authenticator, Authy, etc</Text>
                  </View>
                  {twoFactorMethod === 'app' && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  )}
                </TouchableOpacity>

                {twoFactorMethod === 'app' && (
                  <View style={styles.infoCard}>
                    <Ionicons name="information-circle" size={20} color={colors.info} />
                    <Text style={styles.infoText}>
                      Você precisará escanear um QR Code com seu aplicativo autenticador na próxima etapa.
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.actionButton, loading && styles.actionButtonDisabled]}
                  onPress={handleEnable2FA}
                  disabled={loading}
                >
                  <Text style={styles.actionButtonText}>
                    {loading ? 'Ativando...' : 'Ativar Autenticação'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {twoFactorEnabled && (
              <View style={styles.expandedContent}>
                <View style={styles.successCard}>
                  <Ionicons name="checkmark-circle" size={32} color={colors.success} />
                  <Text style={styles.successText}>
                    Autenticação de dois fatores está ativa
                  </Text>
                  <Text style={styles.successSubtext}>
                    Método: {twoFactorMethod === 'sms' ? 'SMS' : 'Aplicativo Autenticador'}
                  </Text>
                </View>
              </View>
            )}
          </View>

          <View style={{ height: 40 }} />
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
  placeholder: {
    width: 40,
  },
  content: {
    padding: 20,
  },
  section: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  sectionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.textLight,
    marginTop: 2,
  },
  expandedContent: {
    padding: 16,
    paddingTop: 0,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    minHeight: 52,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  actionButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: colors.textWhite,
    fontSize: 15,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 16,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: 12,
  },
  methodCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  methodIcon: {
    marginRight: 12,
  },
  methodContent: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  methodSubtitle: {
    fontSize: 13,
    color: colors.textLight,
    marginTop: 2,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.info + '20',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  successCard: {
    alignItems: 'center',
    padding: 20,
  },
  successText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 12,
    textAlign: 'center',
  },
  successSubtext: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default SecurityScreen;


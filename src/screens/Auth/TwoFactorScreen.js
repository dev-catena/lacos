import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { LacosLogoFull } from '../../components/LacosLogo';

const TwoFactorScreen = ({ navigation, route }) => {
  const { completeTwoFactorLogin, signIn } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const email = route?.params?.email || '';
  const password = route?.params?.password || '';

  const maskedDestination = useMemo(() => {
    // A API pode retornar algo mais rico no futuro; por enquanto, mensagem genérica
    return 'WhatsApp';
  }, []);

  const handleVerify = async () => {
    if (!email) {
      Alert.alert('Erro', 'Sessão inválida. Volte e faça login novamente.');
      navigation.navigate('Login');
      return;
    }

    const normalized = (code || '').replace(/\D/g, '');
    if (normalized.length !== 6) {
      Alert.alert('Atenção', 'Digite o código de 6 dígitos');
      return;
    }

    setLoading(true);
    const result = await completeTwoFactorLogin(email, normalized);
    setLoading(false);

    if (!result.success) {
      Alert.alert('Erro', result.error || 'Código inválido ou expirado. Tente novamente.');
    }
  };

  const handleResend = async () => {
    if (!email || !password) {
      Alert.alert('Atenção', 'Para reenviar o código, volte e faça login novamente.');
      navigation.navigate('Login');
      return;
    }

    setResending(true);
    const result = await signIn(email, password);
    setResending(false);

    if (result.requires2FA) {
      Alert.alert('Código reenviado', 'Enviamos um novo código via WhatsApp.');
      setCode('');
      return;
    }

    if (!result.success) {
      Alert.alert('Erro', result.error || 'Não foi possível reenviar o código.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.logoContainer}>
              <LacosLogoFull width={150} height={47} />
            </View>
            <Text style={styles.title}>Verificação</Text>
            <Text style={styles.subtitle}>
              Digite o código enviado via {maskedDestination}
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Código (6 dígitos)</Text>
              <TextInput
                style={styles.input}
                placeholder="000000"
                placeholderTextColor={colors.placeholder}
                value={code}
                onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
              onPress={handleVerify}
              disabled={loading}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? 'Verificando...' : 'Confirmar'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, resending && styles.primaryButtonDisabled]}
              onPress={handleResend}
              disabled={resending}
            >
              <Text style={styles.secondaryButtonText}>
                {resending ? 'Reenviando...' : 'Reenviar código'}
              </Text>
            </TouchableOpacity>
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
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    marginTop: 20,
    marginBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textLight,
    lineHeight: 20,
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 20,
    letterSpacing: 6,
    textAlign: 'center',
    color: colors.text,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundLight,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
});

export default TwoFactorScreen;



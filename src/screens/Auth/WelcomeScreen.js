import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import { LacosLogoFull } from '../../components/LacosLogo';
import { useAuth } from '../../contexts/AuthContext';
import Svg, { Path } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
  const { forceLogout } = useAuth();
  const [debugTaps, setDebugTaps] = useState(0);

  const handleDebugTap = () => {
    const newTaps = debugTaps + 1;
    setDebugTaps(newTaps);
    
    // 5 toques rápidos ativa o botão de limpeza
    if (newTaps >= 5) {
      Alert.alert(
        '🧹 Limpar Dados',
        'Deseja limpar TODOS os dados do AsyncStorage?\n\nIsso vai forçar logout e remover todas as sessões salvas.',
        [
          { text: 'Cancelar', style: 'cancel', onPress: () => setDebugTaps(0) },
          {
            text: 'Limpar Tudo',
            style: 'destructive',
            onPress: async () => {
              const result = await forceLogout();
              if (result.success) {
                Alert.alert('✅ Sucesso', 'Dados limpos! Reinicie o app.');
              } else {
                Alert.alert('❌ Erro', result.error || 'Não foi possível limpar');
              }
              setDebugTaps(0);
            },
          },
        ]
      );
    }
    
    // Reset após 3 segundos
    setTimeout(() => setDebugTaps(0), 3000);
  };
  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      <StatusBar style="light" />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.logoContainer}
            onPress={handleDebugTap}
            activeOpacity={0.9}
          >
            <LacosLogoFull width={220} height={68} />
          </TouchableOpacity>
          <Text style={styles.subtitle}>
            Cuidado e conexão para quem você ama
          </Text>
          <Text style={styles.description}>
            Gerencie medicamentos, consultas e cuidados de saúde de forma simples e organizada
          </Text>
        </View>

        {/* Ilustração */}
        <View style={styles.illustrationContainer}>
          <View style={styles.iconCircle}>
            <Svg width={120} height={120} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                fill={colors.textWhite}
                opacity="0.9"
              />
            </Svg>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Criar Conta</Text>
            <View style={{ width: 20, height: 20, justifyContent: 'center', alignItems: 'center' }}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M9 18l6-6-6-6"
                  stroke={colors.primary}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Já tenho conta</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            • Gerenciar grupos de cuidados{'\n'}
            • Acompanhar medicamentos e consultas{'\n'}
            • Compartilhar informações com familiares
          </Text>
          {debugTaps > 0 && (
            <Text style={styles.debugText}>
              🧹 Debug: {debugTaps}/5 toques (toque no logo 5x para limpar dados)
            </Text>
          )}
        </View>
      </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: height,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
  },
  logoContainer: {
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: colors.textWhite,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: colors.textWhite,
    textAlign: 'center',
    opacity: 0.85,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  iconCircle: {
    opacity: 0.3,
  },
  buttonsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: colors.textWhite,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primary,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.textWhite,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textWhite,
  },
  footer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: colors.textWhite,
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: 20,
  },
  debugText: {
    fontSize: 10,
    color: '#FFD700',
    marginTop: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default WelcomeScreen;

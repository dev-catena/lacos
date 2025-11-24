import React from 'react';
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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import { LacosLogoFull } from '../../components/LacosLogo';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
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
          <View style={styles.logoContainer}>
            <LacosLogoFull width={220} height={68} />
          </View>
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
            <Ionicons name="heart-circle" size={120} color={colors.textWhite} />
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
            <Ionicons name="arrow-forward" size={20} color={colors.primary} />
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
});

export default WelcomeScreen;

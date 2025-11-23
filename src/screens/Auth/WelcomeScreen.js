import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import { LacosLogoFull } from '../../components/LacosLogo';
import { CaregiverIcon, ElderlyIcon } from '../../components/CustomIcons';

const WelcomeScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.content}>
        {/* Logo e Título */}
        <View style={styles.header}>
          <LacosLogoFull width={200} height={62} />
          <Text style={styles.subtitle}>
            Cuidando de quem amamos, juntos
          </Text>
        </View>

        {/* Botões de ação */}
        <View style={styles.buttonsContainer}>
          
          {/* Botão Cuidador */}
          <TouchableOpacity
            style={styles.roleButton}
            onPress={() => navigation.navigate('Register')}
          >
            <View style={styles.roleButtonContent}>
              <View style={styles.roleIconContainer}>
                <CaregiverIcon size={32} color={colors.primary} />
              </View>
              <View style={styles.roleTextContainer}>
                <Text style={styles.roleButtonTitle}>Entrar como Cuidador</Text>
                <Text style={styles.roleButtonSubtitle}>
                  Criar conta e gerenciar grupos de cuidados
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.primary} />
            </View>
          </TouchableOpacity>

          {/* Botão Paciente */}
          <TouchableOpacity
            style={styles.roleButton}
            onPress={() => navigation.navigate('RegisterPatient')}
          >
            <View style={styles.roleButtonContent}>
              <View style={styles.roleIconContainer}>
                <ElderlyIcon size={32} color={colors.secondary} />
              </View>
              <View style={styles.roleTextContainer}>
                <Text style={styles.roleButtonTitle}>Entrar como Paciente</Text>
                <Text style={styles.roleButtonSubtitle}>
                  Usar código do cuidador para conectar ao grupo
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.secondary} />
            </View>
          </TouchableOpacity>

          {/* Link para Login */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginButtonText}>Já tenho conta - Entrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'flex-start',
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 60,
  },
  subtitle: {
    fontSize: 16,
    color: colors.primaryLight,
    textAlign: 'center',
    marginTop: 12,
  },
  buttonsContainer: {
    gap: 16,
    marginTop: 40,
  },
  roleButton: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  roleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  roleIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleTextContainer: {
    flex: 1,
  },
  roleButtonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  roleButtonSubtitle: {
    fontSize: 13,
    color: colors.textLight,
    lineHeight: 18,
  },
  loginButton: {
    backgroundColor: 'transparent',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.backgroundLight,
    marginTop: 16,
  },
  loginButtonText: {
    color: colors.backgroundLight,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WelcomeScreen;


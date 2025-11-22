import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import { LacosLogoFull } from '../../components/LacosLogo';

const { width } = Dimensions.get('window');

const ProfileSelectionScreen = ({ navigation }) => {
  const handlePatientAccess = () => {
    navigation.navigate('PatientLogin');
  };

  const handleCaretakerAccess = () => {
    navigation.navigate('Welcome');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Laços</Text>
          <View style={styles.logoContainer}>
            <LacosLogoFull width={200} height={62} />
          </View>
          <Text style={styles.subtitle}>
            Cuidado e conexão para quem você ama
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.button, styles.patientButton]}
            onPress={handlePatientAccess}
            activeOpacity={0.8}
          >
            <View style={styles.buttonIconContainer}>
              <Ionicons name="person" size={36} color={colors.textWhite} />
            </View>
            <Text style={styles.buttonTitle}>Sou Paciente</Text>
            <Text style={styles.buttonDescription}>
              Acesso simplificado para quem recebe cuidados
            </Text>
            <Ionicons name="arrow-forward" size={20} color={colors.textWhite} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.caretakerButton]}
            onPress={handleCaretakerAccess}
            activeOpacity={0.8}
          >
            <View style={styles.buttonIconContainer}>
              <Ionicons name="heart" size={36} color={colors.textWhite} />
            </View>
            <Text style={styles.buttonTitle}>Sou Acompanhante</Text>
            <Text style={styles.buttonDescription}>
              Acesso completo para cuidar de quem você ama
            </Text>
            <Ionicons name="arrow-forward" size={20} color={colors.textWhite} />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Selecione o tipo de acesso apropriado
          </Text>
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
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: colors.textWhite,
    marginBottom: 20,
  },
  logoContainer: {
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textWhite,
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: 20,
  },
  buttonsContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
    marginVertical: 20,
  },
  button: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  patientButton: {
    backgroundColor: colors.secondary,
  },
  caretakerButton: {
    backgroundColor: colors.success,
  },
  buttonIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textWhite,
    marginBottom: 6,
  },
  buttonDescription: {
    fontSize: 13,
    color: colors.textWhite,
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: 12,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: colors.textWhite,
    opacity: 0.7,
  },
});

export default ProfileSelectionScreen;


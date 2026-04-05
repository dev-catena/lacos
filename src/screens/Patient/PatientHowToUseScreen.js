import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import { LacosIcon } from '../../components/LacosLogo';

const PatientHowToUseScreen = ({ navigation }) => {
  const steps = [
    {
      icon: 'phone-portrait-outline',
      title: 'Ligações Rápidas',
      desc: 'Toque nos contatos na tela inicial para ligar para cuidadores ou contatos de emergência com um toque.',
    },
    {
      icon: 'warning-outline',
      title: 'Botão de Pânico',
      desc: 'Em caso de emergência, toque no botão vermelho. Os contatos configurados serão notificados automaticamente.',
    },
    {
      icon: 'medical-outline',
      title: 'Medicamentos',
      desc: 'Acesse seus medicamentos, horários e doses. Marque quando tomar para acompanhar a adesão ao tratamento.',
    },
    {
      icon: 'calendar-outline',
      title: 'Consultas',
      desc: 'Veja suas consultas agendadas e entre nas videoconferências pelo app quando chegar o horário.',
    },
    {
      icon: 'document-text-outline',
      title: 'Prescrições',
      desc: 'Consulte receitas e laudos médicos cadastrados pelos cuidadores do seu grupo.',
    },
    {
      icon: 'chatbubbles-outline',
      title: 'Mensagens',
      desc: 'Troque mensagens com os cuidadores do seu grupo pela aba Mensagens.',
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Como Usar</Text>
          <Text style={styles.headerSubtitle}>Tutorial do aplicativo</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introCard}>
          <LacosIcon size={48} />
          <Text style={styles.introTitle}>Bem-vindo ao Laços</Text>
          <Text style={styles.introText}>
            Este app foi feito para facilitar sua rotina de cuidados. Aqui está um guia rápido das principais funcionalidades.
          </Text>
        </View>

        {steps.map((step, index) => (
          <View key={index} style={styles.stepCard}>
            <View style={[styles.stepIcon, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name={step.icon} size={28} color={colors.primary} />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDesc}>{step.desc}</Text>
            </View>
          </View>
        ))}

        <View style={styles.footerCard}>
          <Ionicons name="help-circle" size={24} color={colors.info} />
          <Text style={styles.footerText}>
            Em caso de dúvidas, entre em contato com o administrador do seu grupo de cuidados.
          </Text>
        </View>

        <View style={{ height: 40 }} />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
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
  headerSubtitle: {
    fontSize: 13,
    color: colors.textLight,
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  introCard: {
    backgroundColor: colors.primary + '10',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  introTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  introText: {
    fontSize: 15,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
  },
  stepCard: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'flex-start',
    ...(Platform.OS === 'android' && { elevation: 0 }),
  },
  stepIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  stepDesc: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
  },
  footerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.info + '15',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    gap: 12,
  },
  footerText: {
    flex: 1,
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
  },
});

export default PatientHowToUseScreen;

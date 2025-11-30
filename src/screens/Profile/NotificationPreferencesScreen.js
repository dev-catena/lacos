import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import colors from '../../constants/colors';

const NotificationPreferencesScreen = ({ navigation }) => {
  const [preferences, setPreferences] = useState({
    // Medicamentos
    medicationReminders: true,
    medicationLateAlerts: true,
    medicationRunningOut: true,
    
    // Consultas e Compromissos
    appointmentReminders: true,
    appointmentConfirmation: true,
    appointmentCancellation: true,
    
    // Sinais Vitais
    vitalSignsAlerts: true,
    vitalSignsAbnormal: true,
    vitalSignsReminders: false,
    
    // Atualizações do Grupo
    groupInvites: true,
    groupMemberAdded: true,
    groupChanges: false,
    
    // Sistema
    systemUpdates: true,
    newsAndTips: false,
    emailNotifications: true,
  });

  const [loading, setLoading] = useState(false);

  const togglePreference = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSavePreferences = async () => {
    setLoading(true);

    try {
      // TODO: Integrar com API
      // await updateNotificationPreferences(preferences);
      
      Toast.show({
        type: 'success',
        text1: '✅ Preferências salvas',
        text2: 'Suas configurações foram atualizadas',
        position: 'bottom',
      });
    } catch (error) {
      console.error('Erro ao salvar preferências:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível salvar as preferências',
        position: 'bottom',
      });
    } finally {
      setLoading(false);
    }
  };

  const NotificationToggle = ({ icon, title, subtitle, value, onToggle, color = colors.primary }) => (
    <View style={styles.toggleItem}>
      <View style={[styles.toggleIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.toggleContent}>
        <Text style={styles.toggleTitle}>{title}</Text>
        {subtitle && <Text style={styles.toggleSubtitle}>{subtitle}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.gray300, true: color }}
        thumbColor={colors.textWhite}
      />
    </View>
  );

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
          <Text style={styles.headerTitle}>Notificações</Text>
        </View>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSavePreferences}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Medicamentos */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="medical" size={24} color={colors.secondary} />
              <Text style={styles.sectionTitle}>Medicamentos</Text>
            </View>
            <View style={styles.sectionContent}>
              <NotificationToggle
                icon="alarm"
                title="Lembretes de Medicação"
                subtitle="Receber avisos dos horários dos remédios"
                value={preferences.medicationReminders}
                onToggle={() => togglePreference('medicationReminders')}
                color={colors.secondary}
              />
              <NotificationToggle
                icon="warning"
                title="Alertas de Atraso"
                subtitle="Avisar quando dose não for tomada"
                value={preferences.medicationLateAlerts}
                onToggle={() => togglePreference('medicationLateAlerts')}
                color={colors.error}
              />
              <NotificationToggle
                icon="flask"
                title="Estoque Acabando"
                subtitle="Avisar quando medicamento estiver acabando"
                value={preferences.medicationRunningOut}
                onToggle={() => togglePreference('medicationRunningOut')}
                color={colors.warning}
              />
            </View>
          </View>

          {/* Consultas e Compromissos */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar" size={24} color={colors.warning} />
              <Text style={styles.sectionTitle}>Consultas e Compromissos</Text>
            </View>
            <View style={styles.sectionContent}>
              <NotificationToggle
                icon="time"
                title="Lembretes de Consultas"
                subtitle="Avisos antes das consultas agendadas"
                value={preferences.appointmentReminders}
                onToggle={() => togglePreference('appointmentReminders')}
                color={colors.warning}
              />
              <NotificationToggle
                icon="checkmark-circle"
                title="Confirmações"
                subtitle="Confirmar presença em consultas"
                value={preferences.appointmentConfirmation}
                onToggle={() => togglePreference('appointmentConfirmation')}
                color={colors.success}
              />
              <NotificationToggle
                icon="close-circle"
                title="Cancelamentos"
                subtitle="Avisar sobre consultas canceladas"
                value={preferences.appointmentCancellation}
                onToggle={() => togglePreference('appointmentCancellation')}
                color={colors.error}
              />
            </View>
          </View>

          {/* Sinais Vitais */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="pulse" size={24} color={colors.success} />
              <Text style={styles.sectionTitle}>Sinais Vitais</Text>
            </View>
            <View style={styles.sectionContent}>
              <NotificationToggle
                icon="notifications"
                title="Alertas de Sinais Vitais"
                subtitle="Receber notificações sobre medições"
                value={preferences.vitalSignsAlerts}
                onToggle={() => togglePreference('vitalSignsAlerts')}
                color={colors.success}
              />
              <NotificationToggle
                icon="warning"
                title="Valores Anormais"
                subtitle="Avisar quando valores estiverem fora do normal"
                value={preferences.vitalSignsAbnormal}
                onToggle={() => togglePreference('vitalSignsAbnormal')}
                color={colors.error}
              />
              <NotificationToggle
                icon="alarm"
                title="Lembretes de Medição"
                subtitle="Lembrar de medir periodicamente"
                value={preferences.vitalSignsReminders}
                onToggle={() => togglePreference('vitalSignsReminders')}
                color={colors.info}
              />
            </View>
          </View>

          {/* Atualizações do Grupo */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="people" size={24} color={colors.primary} />
              <Text style={styles.sectionTitle}>Atualizações do Grupo</Text>
            </View>
            <View style={styles.sectionContent}>
              <NotificationToggle
                icon="mail"
                title="Convites de Grupo"
                subtitle="Receber convites para participar de grupos"
                value={preferences.groupInvites}
                onToggle={() => togglePreference('groupInvites')}
                color={colors.primary}
              />
              <NotificationToggle
                icon="person-add"
                title="Novos Membros"
                subtitle="Avisar quando alguém entrar no grupo"
                value={preferences.groupMemberAdded}
                onToggle={() => togglePreference('groupMemberAdded')}
                color={colors.info}
              />
              <NotificationToggle
                icon="create"
                title="Alterações no Grupo"
                subtitle="Notificar mudanças de configurações"
                value={preferences.groupChanges}
                onToggle={() => togglePreference('groupChanges')}
                color={colors.textLight}
              />
            </View>
          </View>

          {/* Sistema */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="settings" size={24} color={colors.text} />
              <Text style={styles.sectionTitle}>Sistema</Text>
            </View>
            <View style={styles.sectionContent}>
              <NotificationToggle
                icon="cloud-download"
                title="Atualizações do App"
                subtitle="Novidades e melhorias disponíveis"
                value={preferences.systemUpdates}
                onToggle={() => togglePreference('systemUpdates')}
                color={colors.primary}
              />
              <NotificationToggle
                icon="bulb"
                title="Dicas e Novidades"
                subtitle="Receber dicas de uso e notícias"
                value={preferences.newsAndTips}
                onToggle={() => togglePreference('newsAndTips')}
                color={colors.warning}
              />
              <NotificationToggle
                icon="mail"
                title="Notificações por E-mail"
                subtitle="Receber resumos por e-mail"
                value={preferences.emailNotifications}
                onToggle={() => togglePreference('emailNotifications')}
                color={colors.info}
              />
            </View>
          </View>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color={colors.info} />
            <Text style={styles.infoText}>
              Você pode gerenciar notificações críticas (como lembretes de medicação) diretamente nas configurações do seu dispositivo.
            </Text>
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
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  saveButtonText: {
    color: colors.textWhite,
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  sectionContent: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    overflow: 'hidden',
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  toggleIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  toggleContent: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  toggleSubtitle: {
    fontSize: 13,
    color: colors.textLight,
    marginTop: 2,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.info + '20',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
});

export default NotificationPreferencesScreen;


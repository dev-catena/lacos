import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  Alert,
  Clipboard,
  Share,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import colors from '../../constants/colors';
import {
  VitalSignsIcon,
  PermissionsIcon,
  NotificationIcon,
  MedicalHistoryIcon,
  MedicationIcon,
  AppointmentIcon,
  MessagesIcon,
} from '../../components/CustomIcons';

const GROUPS_STORAGE_KEY = '@lacos_groups';

const GroupSettingsScreen = ({ route, navigation }) => {
  const { groupId, groupName } = route.params || {};
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [groupData, setGroupData] = useState(null);

  // Sinais Vitais
  const [vitalSigns, setVitalSigns] = useState({
    monitor_blood_pressure: false,
    monitor_heart_rate: false,
    monitor_oxygen_saturation: false,
    monitor_blood_glucose: false,
    monitor_temperature: false,
    monitor_respiratory_rate: false,
  });

  // Permissões do Acompanhado
  const [permissions, setPermissions] = useState({
    accompanied_notify_medication: true,
    accompanied_notify_appointment: true,
    accompanied_access_history: true,
    accompanied_access_medication: true,
    accompanied_access_schedule: true,
    accompanied_access_chat: false,
  });

  useFocusEffect(
    React.useCallback(() => {
      loadGroupData();
    }, [groupId])
  );

  const loadGroupData = async () => {
    setLoading(true);
    try {
      const groupsJson = await AsyncStorage.getItem(GROUPS_STORAGE_KEY);
      if (groupsJson) {
        const groups = JSON.parse(groupsJson);
        const group = groups.find(g => g.id === groupId);
        if (group) {
          setGroupData(group);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados do grupo:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyCodeToClipboard = () => {
    if (groupData?.code) {
      Clipboard.setString(groupData.code);
      Alert.alert('Código Copiado!', 'O código foi copiado para a área de transferência.');
    }
  };

  const shareCode = async () => {
    if (groupData?.code) {
      try {
        await Share.share({
          message: `Olá! Use este código para acessar o aplicativo Laços como paciente:\n\nCódigo: ${groupData.code}\n\nAbra o app, selecione "Sou Paciente" e digite este código.`,
        });
      } catch (error) {
        console.error('Erro ao compartilhar código:', error);
      }
    }
  };

  const toggleVitalSign = (key) => {
    setVitalSigns(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const togglePermission = (key) => {
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    // Validar se pelo menos um sinal vital está habilitado
    const hasAnyVitalSignEnabled = Object.values(vitalSigns).some(v => v);
    
    if (!hasAnyVitalSignEnabled) {
      Alert.alert(
        'Atenção',
        'Selecione pelo menos um sinal vital para ativar a funcionalidade'
      );
      return;
    }

    setSaving(true);
    try {
      // TODO: Implementar chamada à API
      Alert.alert(
        'Em Desenvolvimento',
        `Configurações salvas!\n\n` +
        `Sinais vitais ativos: ${Object.keys(vitalSigns).filter(k => vitalSigns[k]).length}\n` +
        `Permissões do acompanhado configuradas\n\n` +
        `Integração com API em desenvolvimento.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Erro', 'Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const vitalSignsConfig = [
    {
      key: 'monitor_blood_pressure',
      label: 'Pressão Arterial',
      icon: 'pulse',
      description: 'Alerta: >160/100 ou <90/60 mmHg',
      color: colors.error,
    },
    {
      key: 'monitor_heart_rate',
      label: 'Frequência Cardíaca',
      icon: 'heart',
      description: 'Alerta: >110 ou <50 bpm',
      color: colors.secondary,
    },
    {
      key: 'monitor_oxygen_saturation',
      label: 'Saturação de Oxigênio',
      icon: 'water',
      description: 'Alerta: <90%',
      color: colors.info,
    },
    {
      key: 'monitor_blood_glucose',
      label: 'Glicemia',
      icon: 'fitness',
      description: 'Alerta: >200 ou <60 mg/dL',
      color: colors.warning,
    },
    {
      key: 'monitor_temperature',
      label: 'Temperatura Corporal',
      icon: 'thermometer',
      description: 'Limites podem ser ajustados',
      color: colors.success,
    },
    {
      key: 'monitor_respiratory_rate',
      label: 'Frequência Respiratória',
      icon: 'leaf',
      description: 'Alerta: >25 ou <12 ipm',
      color: colors.primary,
    },
  ];

  const permissionsConfig = [
    {
      key: 'accompanied_notify_medication',
      label: 'Notificar Remédio',
      description: 'Alertas de horário de medicação',
      icon: MedicationIcon,
    },
    {
      key: 'accompanied_notify_appointment',
      label: 'Notificar Lembrete de Consulta',
      description: 'Lembretes de consultas agendadas',
      icon: AppointmentIcon,
    },
    {
      key: 'accompanied_access_history',
      label: 'Histórico',
      description: 'Visualizar histórico de cuidados',
      icon: MedicalHistoryIcon,
    },
    {
      key: 'accompanied_access_medication',
      label: 'Remédios',
      description: 'Ver lista de medicamentos',
      icon: MedicationIcon,
    },
    {
      key: 'accompanied_access_schedule',
      label: 'Agenda',
      description: 'Acessar calendário de consultas',
      icon: AppointmentIcon,
    },
    {
      key: 'accompanied_access_chat',
      label: 'Chat',
      description: 'Conversar com cuidadores',
      icon: MessagesIcon,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
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
          <Text style={styles.headerTitle}>Configurações</Text>
          <Text style={styles.headerSubtitle}>{groupName || 'Grupo'}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Código do Paciente */}
        {groupData?.code && (
          <View style={styles.codeSection}>
            <View style={styles.codeHeader}>
              <Ionicons name="key" size={24} color={colors.secondary} />
              <Text style={styles.codeHeaderTitle}>Código do Paciente</Text>
            </View>
            <Text style={styles.codeDescription}>
              Compartilhe este código com o paciente para que ele possa acessar o aplicativo
            </Text>
            
            <View style={styles.codeCard}>
              <View style={styles.codeDisplay}>
                <Text style={styles.codeLabel}>Código:</Text>
                <Text style={styles.codeText}>{groupData.code}</Text>
              </View>
              
              <View style={styles.codeActions}>
                <TouchableOpacity
                  style={styles.codeActionButton}
                  onPress={copyCodeToClipboard}
                >
                  <Ionicons name="copy-outline" size={20} color={colors.primary} />
                  <Text style={styles.codeActionText}>Copiar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.codeActionButton, styles.shareButton]}
                  onPress={shareCode}
                >
                  <Ionicons name="share-social-outline" size={20} color={colors.textWhite} />
                  <Text style={[styles.codeActionText, styles.shareButtonText]}>Compartilhar</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.codeInfoCard}>
              <Ionicons name="information-circle" size={20} color={colors.info} />
              <Text style={styles.codeInfoText}>
                O paciente deve abrir o app, selecionar "Sou Paciente" e digitar este código
              </Text>
            </View>
          </View>
        )}

        {/* Botão de Gerenciar Contatos */}
        <View style={styles.quickActionSection}>
          <TouchableOpacity
            style={styles.contactsButton}
            onPress={() => navigation.navigate('GroupContacts', { groupId })}
          >
            <View style={styles.contactsButtonIcon}>
              <Ionicons name="call" size={24} color={colors.textWhite} />
            </View>
            <View style={styles.contactsButtonContent}>
              <Text style={styles.contactsButtonTitle}>Gerenciar Contatos</Text>
              <Text style={styles.contactsButtonSubtitle}>
                Configure contatos rápidos e SOS para o paciente
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.textWhite} />
          </TouchableOpacity>
        </View>

        {/* Membros do Grupo */}
        {groupData && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="people" size={24} color={colors.secondary} />
              <Text style={styles.sectionTitle}>Membros do Grupo</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Pessoas que fazem parte deste grupo de cuidados
            </Text>

            {/* Administrador / Cuidador */}
            <View style={styles.memberCard}>
              <View style={styles.memberAvatar}>
                <Ionicons name="person" size={32} color={colors.primary} />
              </View>
              <View style={styles.memberInfo}>
                <View style={styles.memberHeader}>
                  <Text style={styles.memberName}>Você</Text>
                  <View style={styles.adminBadge}>
                    <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
                    <Text style={styles.adminBadgeText}>Administrador</Text>
                  </View>
                </View>
                <Text style={styles.memberRole}>Cuidador Principal</Text>
                <View style={styles.memberDetail}>
                  <Ionicons name="calendar-outline" size={14} color={colors.textLight} />
                  <Text style={styles.memberDetailText}>
                    Criado em: {new Date(groupData.createdAt).toLocaleDateString('pt-BR')}
                  </Text>
                </View>
              </View>
            </View>

            {/* Paciente / Pessoa Acompanhada */}
            <View style={[styles.memberCard, styles.patientCard]}>
              <View style={[styles.memberAvatar, styles.patientAvatar]}>
                <Ionicons name="heart" size={32} color={colors.secondary} />
              </View>
              <View style={styles.memberInfo}>
                <View style={styles.memberHeader}>
                  <Text style={styles.memberName}>{groupData.accompaniedName || 'Paciente'}</Text>
                  <View style={styles.patientBadge}>
                    <Ionicons name="medkit" size={14} color={colors.secondary} />
                    <Text style={styles.patientBadgeText}>Paciente</Text>
                  </View>
                </View>
                <Text style={styles.memberRole}>Pessoa Acompanhada</Text>
                {groupData.accompaniedBirthDate && (
                  <View style={styles.memberDetail}>
                    <Ionicons name="calendar-outline" size={14} color={colors.textLight} />
                    <Text style={styles.memberDetailText}>
                      Nascimento: {new Date(groupData.accompaniedBirthDate).toLocaleDateString('pt-BR')}
                    </Text>
                  </View>
                )}
                {groupData.accompaniedRelationship && (
                  <View style={styles.memberDetail}>
                    <Ionicons name="link-outline" size={14} color={colors.textLight} />
                    <Text style={styles.memberDetailText}>
                      Relação: {groupData.accompaniedRelationship}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.membersInfoCard}>
              <Ionicons name="information-circle" size={20} color={colors.info} />
              <Text style={styles.membersInfoText}>
                Atualmente este grupo tem 2 membros: você como cuidador e {groupData.accompaniedName || 'o paciente'}.
              </Text>
            </View>
          </View>
        )}

        {/* Sinais Vitais */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <VitalSignsIcon size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Sinais Vitais</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Selecione os sinais que deseja monitorar. Alertas serão enviados quando os valores
            estiverem fora dos limites.
          </Text>

          {vitalSignsConfig.map((item) => (
            <View key={item.key} style={styles.settingCard}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: item.color + '20' }]}>
                  <Ionicons name={item.icon} size={24} color={item.color} />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingLabel}>{item.label}</Text>
                  <Text style={styles.settingDescription}>{item.description}</Text>
                </View>
              </View>
              <Switch
                value={vitalSigns[item.key]}
                onValueChange={() => toggleVitalSign(item.key)}
                trackColor={{ false: colors.gray200, true: item.color + '60' }}
                thumbColor={vitalSigns[item.key] ? item.color : colors.gray400}
              />
            </View>
          ))}
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={colors.info} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Limites Automáticos</Text>
            <Text style={styles.infoText}>
              Os limites iniciais são baseados em valores recomendados. Após coletar dados
              históricos, o sistema calculará os valores basais personalizados do paciente (±20%).
            </Text>
          </View>
        </View>

        {/* Permissões do Acompanhado */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <PermissionsIcon size={24} color={colors.secondary} />
            <Text style={styles.sectionTitle}>Telas do Acompanhado</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Configure quais funcionalidades e notificações estarão disponíveis no aplicativo do
            acompanhado.
          </Text>

          {permissionsConfig.map((item) => {
            const IconComponent = item.icon;
            return (
              <View key={item.key} style={styles.settingCard}>
                <View style={styles.settingLeft}>
                  <View style={[styles.settingIcon, { backgroundColor: colors.secondary + '20' }]}>
                    <IconComponent size={24} color={colors.secondary} />
                  </View>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingLabel}>{item.label}</Text>
                    <Text style={styles.settingDescription}>{item.description}</Text>
                  </View>
                </View>
                <Switch
                  value={permissions[item.key]}
                  onValueChange={() => togglePermission(item.key)}
                  trackColor={{ false: colors.gray200, true: colors.secondary + '60' }}
                  thumbColor={permissions[item.key] ? colors.secondary : colors.gray400}
                />
              </View>
            );
          })}
        </View>

        {/* Botão Salvar */}
        <View style={styles.saveContainer}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <Text style={styles.saveButtonText}>Salvando...</Text>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color={colors.textWhite} />
                <Text style={styles.saveButtonText}>Salvar Configurações</Text>
              </>
            )}
          </TouchableOpacity>
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
  headerSubtitle: {
    fontSize: 13,
    color: colors.textLight,
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
    marginBottom: 16,
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  settingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: colors.textLight,
    lineHeight: 18,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.info + '20',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.info,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  saveContainer: {
    paddingHorizontal: 20,
    marginTop: 12,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: colors.success,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Estilos do Código do Paciente
  codeSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: colors.secondary + '10',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  codeHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  codeDescription: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 16,
    lineHeight: 20,
  },
  codeCard: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.secondary,
    marginBottom: 12,
  },
  codeDisplay: {
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 16,
  },
  codeLabel: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 8,
  },
  codeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.secondary,
    letterSpacing: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  codeActions: {
    flexDirection: 'row',
    gap: 12,
  },
  codeActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  shareButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  codeActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  shareButtonText: {
    color: colors.textWhite,
  },
  codeInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.info + '20',
    padding: 12,
    borderRadius: 8,
  },
  codeInfoText: {
    flex: 1,
    fontSize: 12,
    color: colors.text,
    lineHeight: 16,
  },
  quickActionSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  contactsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    padding: 20,
    borderRadius: 16,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    gap: 16,
  },
  contactsButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactsButtonContent: {
    flex: 1,
  },
  contactsButtonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textWhite,
    marginBottom: 4,
  },
  contactsButtonSubtitle: {
    fontSize: 14,
    color: colors.textWhite,
    opacity: 0.9,
  },
  memberCard: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  patientCard: {
    borderColor: colors.secondary + '40',
    backgroundColor: colors.secondary + '05',
  },
  memberAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  patientAvatar: {
    backgroundColor: colors.secondary + '20',
  },
  memberInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  memberName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  adminBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  patientBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  patientBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.secondary,
  },
  memberRole: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 6,
  },
  memberDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  memberDetailText: {
    fontSize: 12,
    color: colors.textLight,
  },
  membersInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.info + '20',
    padding: 12,
    borderRadius: 8,
  },
  membersInfoText: {
    flex: 1,
    fontSize: 12,
    color: colors.text,
    lineHeight: 16,
  },
});

export default GroupSettingsScreen;


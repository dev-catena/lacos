import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  TextInput,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import * as Location from 'expo-location';
import colors from '../../constants/colors';
import {
  generateAdhesionReport,
  shareViaWhatsApp,
  shareViaEmail,
  saveAndShareReport,
} from '../../services/medicationReportService';

const MEDICATIONS_STORAGE_KEY = '@lacos_medications';
const DOSE_HISTORY_STORAGE_KEY = '@lacos_dose_history';

const MedicationDetailsScreen = ({ route, navigation }) => {
  const { medicationId, groupId } = route.params;
  const [medication, setMedication] = useState(null);
  const [doseHistory, setDoseHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nearestPharmacy, setNearestPharmacy] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedScheduleTime, setSelectedScheduleTime] = useState(null);
  const [customTime, setCustomTime] = useState('');
  const [justification, setJustification] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Carregar medicamento
      const medsJson = await AsyncStorage.getItem(MEDICATIONS_STORAGE_KEY);
      if (medsJson) {
        const meds = JSON.parse(medsJson);
        const med = meds.find(m => m.id === medicationId);
        setMedication(med);
      }

      // Carregar histórico de doses
      const historyJson = await AsyncStorage.getItem(DOSE_HISTORY_STORAGE_KEY);
      if (historyJson) {
        const allHistory = JSON.parse(historyJson);
        const medHistory = allHistory.filter(h => h.medicationId === medicationId);
        setDoseHistory(medHistory);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDoseStatus = (scheduleTime) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const [hours, minutes] = scheduleTime.split(':');
    const scheduledDateTime = new Date(today);
    scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // Verificar se já foi tomado hoje
    const takenToday = doseHistory.find(h => {
      const hDate = new Date(h.takenAt);
      return hDate.toISOString().split('T')[0] === today && h.scheduledTime === scheduleTime;
    });

    if (takenToday) {
      return {
        status: 'taken',
        color: colors.success,
        icon: 'checkmark-circle',
        label: `Tomado às ${new Date(takenToday.takenAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
      };
    }

    // Verificar se está atrasado (mais de 30min depois do horário)
    const thirtyMinAfter = new Date(scheduledDateTime.getTime() + 30 * 60000);
    if (now > thirtyMinAfter) {
      return {
        status: 'missed',
        color: colors.error,
        icon: 'alert-circle',
        label: 'Atrasado',
      };
    }

    // Verificar se está próximo (15min antes até 30min depois)
    const fifteenMinBefore = new Date(scheduledDateTime.getTime() - 15 * 60000);
    if (now >= fifteenMinBefore && now <= thirtyMinAfter) {
      return {
        status: 'due',
        color: colors.warning,
        icon: 'time',
        label: 'Hora de tomar',
      };
    }

    // Ainda não chegou a hora
    return {
      status: 'pending',
      color: colors.gray400,
      icon: 'time-outline',
      label: 'Agendado',
    };
  };

  const handleRegisterDose = async (scheduledTime, actualTime = null) => {
    try {
      const doseRecord = {
        id: Date.now().toString(),
        medicationId,
        scheduledTime,
        takenAt: actualTime || new Date().toISOString(),
        registeredBy: 'caregiver', // Ou 'patient'
        status: 'taken',
      };

      const historyJson = await AsyncStorage.getItem(DOSE_HISTORY_STORAGE_KEY);
      const history = historyJson ? JSON.parse(historyJson) : [];
      history.push(doseRecord);
      await AsyncStorage.setItem(DOSE_HISTORY_STORAGE_KEY, JSON.stringify(history));

      setDoseHistory(history.filter(h => h.medicationId === medicationId));

      Toast.show({
        type: 'success',
        text1: '✅ Dose registrada',
        text2: `${medication.name} - ${scheduledTime}`,
        position: 'bottom',
      });
    } catch (error) {
      console.error('Erro ao registrar dose:', error);
      Alert.alert('Erro', 'Não foi possível registrar a dose');
    }
  };

  const handleNotAdministered = async (scheduledTime, reason) => {
    try {
      const doseRecord = {
        id: Date.now().toString(),
        medicationId,
        scheduledTime,
        takenAt: new Date().toISOString(),
        registeredBy: 'caregiver',
        status: 'not_administered',
        justification: reason,
      };

      const historyJson = await AsyncStorage.getItem(DOSE_HISTORY_STORAGE_KEY);
      const history = historyJson ? JSON.parse(historyJson) : [];
      history.push(doseRecord);
      await AsyncStorage.setItem(DOSE_HISTORY_STORAGE_KEY, JSON.stringify(history));

      setDoseHistory(history.filter(h => h.medicationId === medicationId));

      Toast.show({
        type: 'info',
        text1: 'ℹ️ Não administrado',
        text2: reason || 'Registrado sem justificativa',
        position: 'bottom',
      });
    } catch (error) {
      console.error('Erro ao registrar não administração:', error);
      Alert.alert('Erro', 'Não foi possível registrar');
    }
  };

  const handleDiscontinue = async () => {
    Alert.alert(
      'Descontinuar Medicamento',
      `Tem certeza que deseja descontinuar ${medication.name}? O medicamento não será mais exibido na lista principal.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Descontinuar',
          style: 'destructive',
          onPress: async () => {
            try {
              const medsJson = await AsyncStorage.getItem(MEDICATIONS_STORAGE_KEY);
              if (medsJson) {
                const meds = JSON.parse(medsJson);
                const updatedMeds = meds.map(m => 
                  m.id === medicationId 
                    ? { ...m, active: false, discontinuedAt: new Date().toISOString() }
                    : m
                );
                await AsyncStorage.setItem(MEDICATIONS_STORAGE_KEY, JSON.stringify(updatedMeds));
                
                Toast.show({
                  type: 'success',
                  text1: 'Medicamento descontinuado',
                  text2: `${medication.name} foi removido da lista`,
                });

                navigation.goBack();
              }
            } catch (error) {
              console.error('Erro ao descontinuar:', error);
              Alert.alert('Erro', 'Não foi possível descontinuar o medicamento');
            }
          },
        },
      ]
    );
  };

  const openRegisterModal = (time) => {
    setSelectedScheduleTime(time);
    setCustomTime('');
    setJustification('');
    setShowRegisterModal(true);
  };

  const handleExportReport = () => {
    Alert.alert(
      'Exportar Relatório',
      'Escolha como deseja exportar o relatório de adesão:',
      [
        {
          text: 'WhatsApp',
          onPress: async () => {
            try {
              const endDate = new Date();
              const startDate = new Date();
              startDate.setDate(startDate.getDate() - 30); // Últimos 30 dias

              const report = await generateAdhesionReport(groupId, startDate, endDate);
              await shareViaWhatsApp(report, 'Grupo', medication.name);
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível gerar o relatório');
            }
          },
        },
        {
          text: 'Email',
          onPress: async () => {
            try {
              const endDate = new Date();
              const startDate = new Date();
              startDate.setDate(startDate.getDate() - 30);

              const report = await generateAdhesionReport(groupId, startDate, endDate);
              await shareViaEmail(report, 'Grupo', medication.name);
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível gerar o relatório');
            }
          },
        },
        {
          text: 'Outro App',
          onPress: async () => {
            try {
              const endDate = new Date();
              const startDate = new Date();
              startDate.setDate(startDate.getDate() - 30);

              const report = await generateAdhesionReport(groupId, startDate, endDate);
              await saveAndShareReport(report, 'Grupo', medication.name);
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível gerar o relatório');
            }
          },
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]
    );
  };

  const handleFindPharmacy = async () => {
    try {
      setLoadingLocation(true);

      // Solicitar permissão de localização
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permissão negada',
          'Precisamos da sua localização para encontrar a farmácia mais próxima'
        );
        return;
      }

      // Obter localização atual
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // URL do Google Maps para buscar "Farmácia Popular" próxima
      const url = `https://www.google.com/maps/search/Farm%C3%A1cia+Popular/@${latitude},${longitude},14z`;

      // Abrir no Google Maps
      await Linking.openURL(url);

      Toast.show({
        type: 'info',
        text1: 'Abrindo Google Maps',
        text2: 'Buscando Farmácia Popular próxima...',
      });
    } catch (error) {
      console.error('Erro ao buscar localização:', error);
      Alert.alert('Erro', 'Não foi possível obter sua localização');
    } finally {
      setLoadingLocation(false);
    }
  };

  if (loading || !medication) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Detalhes do Remédio</Text>
        <TouchableOpacity style={styles.editButton}>
          <Ionicons name="create-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.medicationHeader}>
            <View style={styles.medicationIcon}>
              <Ionicons name="medical" size={32} color={colors.secondary} />
            </View>
            <View style={styles.medicationTitleContainer}>
              <Text style={styles.medicationName}>{medication.name}</Text>
              <Text style={styles.medicationDosage}>
                {medication.dosage} {medication.unit} - {medication.form}
              </Text>
            </View>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Ionicons name="repeat" size={20} color={colors.info} />
              <Text style={styles.infoLabel}>Frequência</Text>
              <Text style={styles.infoValue}>
                {medication.frequency === 'advanced' && medication.advancedFrequency
                  ? 'Personalizada'
                  : `A cada ${medication.frequency}h`}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="water" size={20} color={colors.info} />
              <Text style={styles.infoLabel}>Via</Text>
              <Text style={styles.infoValue}>{medication.route}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="calendar" size={20} color={colors.info} />
              <Text style={styles.infoLabel}>Duração</Text>
              <Text style={styles.infoValue}>
                {medication.durationType === 'continuo' ? 'Contínuo' : `${medication.durationDays} dias`}
              </Text>
            </View>
          </View>

          {medication.instructions && (
            <View style={styles.instructionsBox}>
              <Ionicons name="information-circle" size={20} color={colors.primary} />
              <Text style={styles.instructionsText}>{medication.instructions}</Text>
            </View>
          )}
        </View>

        {/* Horários de Hoje */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Horários de Hoje</Text>
            <Text style={styles.sectionHint}>
              Pressione e segure para mais opções
            </Text>
          </View>
          {medication.schedule && medication.schedule.map((time, index) => {
            const status = getDoseStatus(time);
            return (
              <TouchableOpacity
                key={index}
                style={[styles.scheduleCard, { borderLeftColor: status.color }]}
                onPress={() => status.status !== 'taken' && handleRegisterDose(time)}
                onLongPress={() => openRegisterModal(time)}
                delayLongPress={500}
                activeOpacity={0.7}
              >
                <View style={styles.scheduleLeft}>
                  <Ionicons name={status.icon} size={32} color={status.color} />
                  <View style={styles.scheduleInfo}>
                    <Text style={styles.scheduleTime}>{time}</Text>
                    <Text style={[styles.scheduleStatus, { color: status.color }]}>
                      {status.label}
                    </Text>
                  </View>
                </View>
                {status.status !== 'taken' && (
                  <View style={[styles.quickRegisterBadge, { backgroundColor: status.color + '20' }]}>
                    <Ionicons name="checkmark" size={16} color={status.color} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Farmácia Popular */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Farmácia Popular</Text>
          <TouchableOpacity
            style={styles.pharmacyCard}
            onPress={handleFindPharmacy}
            disabled={loadingLocation}
          >
            <View style={styles.pharmacyIcon}>
              <Ionicons name="location" size={28} color={colors.success} />
            </View>
            <View style={styles.pharmacyInfo}>
              <Text style={styles.pharmacyTitle}>
                {loadingLocation ? 'Buscando...' : 'Encontrar Farmácia Próxima'}
              </Text>
              <Text style={styles.pharmacySubtitle}>
                Verifique disponibilidade do medicamento
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.gray400} />
          </TouchableOpacity>
        </View>

        {/* Relatório de Adesão */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Relatórios</Text>
          <TouchableOpacity
            style={styles.reportButton}
            onPress={handleExportReport}
          >
            <View style={styles.reportIcon}>
              <Ionicons name="document-text" size={28} color={colors.primary} />
            </View>
            <View style={styles.reportInfo}>
              <Text style={styles.reportTitle}>Relatório de Adesão</Text>
              <Text style={styles.reportSubtitle}>
                Exportar para WhatsApp, Email ou outro app
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.gray400} />
          </TouchableOpacity>
        </View>

        {/* Ações do Medicamento */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.discontinueButton}
            onPress={handleDiscontinue}
          >
            <Ionicons name="close-circle" size={24} color={colors.error} />
            <Text style={styles.discontinueButtonText}>Descontinuar Medicamento</Text>
          </TouchableOpacity>
        </View>

        {/* Histórico Recente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Histórico Recente</Text>
          {doseHistory.length > 0 ? (
            doseHistory.slice(0, 10).map((record) => (
              <View key={record.id} style={styles.historyCard}>
                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                <View style={styles.historyInfo}>
                  <Text style={styles.historyTime}>
                    {new Date(record.takenAt).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                  <Text style={styles.historyScheduled}>
                    Horário agendado: {record.scheduledTime}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyHistory}>
              <Ionicons name="calendar-outline" size={48} color={colors.gray300} />
              <Text style={styles.emptyHistoryText}>Nenhum registro ainda</Text>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal de Registro Avançado */}
      {showRegisterModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Registrar Dose</Text>
              <TouchableOpacity onPress={() => setShowRegisterModal(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalMedicationName}>{medication.name}</Text>
              <Text style={styles.modalScheduledTime}>
                Horário agendado: {selectedScheduleTime}
              </Text>

              {/* Opção 1: Registrar como tomado */}
              <TouchableOpacity
                style={[styles.modalOption, styles.modalOptionSuccess]}
                onPress={() => {
                  handleRegisterDose(selectedScheduleTime);
                  setShowRegisterModal(false);
                }}
              >
                <Ionicons name="checkmark-circle" size={32} color={colors.success} />
                <View style={styles.modalOptionContent}>
                  <Text style={styles.modalOptionTitle}>Tomado</Text>
                  <Text style={styles.modalOptionDescription}>
                    Registrar como tomado agora
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Opção 2: Registrar com horário customizado */}
              <View style={styles.modalOption}>
                <Ionicons name="time" size={32} color={colors.warning} />
                <View style={styles.modalOptionContent}>
                  <Text style={styles.modalOptionTitle}>Horário Real</Text>
                  <Text style={styles.modalOptionDescription}>
                    Informe quando foi tomado de fato
                  </Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Ex: 09:30"
                    value={customTime}
                    onChangeText={setCustomTime}
                    keyboardType="numeric"
                  />
                  <TouchableOpacity
                    style={styles.modalSubmitButton}
                    onPress={() => {
                      if (customTime) {
                        const [h, m] = customTime.split(':');
                        const today = new Date();
                        today.setHours(parseInt(h), parseInt(m), 0, 0);
                        handleRegisterDose(selectedScheduleTime, today.toISOString());
                        setShowRegisterModal(false);
                      } else {
                        Alert.alert('Erro', 'Digite o horário no formato HH:MM');
                      }
                    }}
                  >
                    <Text style={styles.modalSubmitButtonText}>Confirmar</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Opção 3: Não administrado */}
              <View style={[styles.modalOption, styles.modalOptionDanger]}>
                <Ionicons name="close-circle" size={32} color={colors.error} />
                <View style={styles.modalOptionContent}>
                  <Text style={styles.modalOptionTitle}>Não Administrado</Text>
                  <Text style={styles.modalOptionDescription}>
                    Medicamento não foi tomado
                  </Text>
                  <TextInput
                    style={[styles.modalInput, styles.modalTextArea]}
                    placeholder="Justificativa (opcional)"
                    value={justification}
                    onChangeText={setJustification}
                    multiline
                    numberOfLines={3}
                  />
                  <TouchableOpacity
                    style={[styles.modalSubmitButton, styles.modalSubmitButtonDanger]}
                    onPress={() => {
                      handleNotAdministered(selectedScheduleTime, justification);
                      setShowRegisterModal(false);
                    }}
                  >
                    <Text style={styles.modalSubmitButtonText}>Registrar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    backgroundColor: colors.backgroundLight,
    margin: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  medicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  medicationIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.secondary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  medicationTitleContainer: {
    flex: 1,
  },
  medicationName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  medicationDosage: {
    fontSize: 16,
    color: colors.textLight,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  instructionsBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.primary + '10',
    padding: 12,
    borderRadius: 8,
  },
  instructionsText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  sectionHint: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
    fontStyle: 'italic',
  },
  scheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scheduleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleTime: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  scheduleStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  quickRegisterBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  discontinueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.error + '10',
    borderWidth: 2,
    borderColor: colors.error + '40',
    borderRadius: 12,
    padding: 16,
  },
  discontinueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 20,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalBody: {
    padding: 20,
  },
  modalMedicationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  modalScheduledTime: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.backgroundLight,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  modalOptionSuccess: {
    borderColor: colors.success + '40',
    backgroundColor: colors.success + '10',
  },
  modalOptionDanger: {
    borderColor: colors.error + '40',
    backgroundColor: colors.error + '10',
  },
  modalOptionContent: {
    flex: 1,
  },
  modalOptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  modalOptionDescription: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    marginTop: 8,
  },
  modalTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalSubmitButton: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  modalSubmitButtonDanger: {
    backgroundColor: colors.error,
  },
  modalSubmitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textWhite,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '10',
    borderWidth: 2,
    borderColor: colors.primary + '40',
    borderRadius: 12,
    padding: 16,
  },
  reportIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  reportSubtitle: {
    fontSize: 14,
    color: colors.textLight,
  },
  pharmacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '10',
    borderWidth: 2,
    borderColor: colors.success + '40',
    borderRadius: 12,
    padding: 16,
  },
  pharmacyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.success + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pharmacyInfo: {
    flex: 1,
  },
  pharmacyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  pharmacySubtitle: {
    fontSize: 14,
    color: colors.textLight,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.backgroundLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  historyInfo: {
    flex: 1,
  },
  historyTime: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  historyScheduled: {
    fontSize: 12,
    color: colors.textLight,
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyHistoryText: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 12,
  },
});

export default MedicationDetailsScreen;


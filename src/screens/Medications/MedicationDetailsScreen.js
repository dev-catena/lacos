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
  Pressable,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import * as Location from 'expo-location';
import colors from '../../constants/colors';
import medicationService from '../../services/medicationService';
import medicationSearchService from '../../services/medicationSearchService';
import medicationPriceService from '../../services/medicationPriceService';
import NearbyPharmacies from '../../components/NearbyPharmacies';
import PopularPharmacies from '../../components/PopularPharmacies';

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
  const [isFarmaciaPopular, setIsFarmaciaPopular] = useState(false);
  const [medicationPrice, setMedicationPrice] = useState(null);
  const [loadingPrice, setLoadingPrice] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Carregar medicamento da API
      try {
        const result = await medicationService.getMedication(medicationId);
        if (result.success && result.data) {
          const med = result.data;
          
          // Transformar dados da API para o formato esperado pela UI
          const frequency = typeof med.frequency === 'string' 
            ? JSON.parse(med.frequency) 
            : (med.frequency || {});
          
          const frequencyDetails = frequency.details || {};
          const frequencyType = frequency.type || 'simple';
          
          const duration = typeof med.duration === 'string'
            ? JSON.parse(med.duration)
            : (med.duration || { type: 'continuo', value: null });
          
          const transformedMed = {
            ...med,
            form: med.pharmaceutical_form || med.form,
            route: med.administration_route || med.route || '',
            frequency: frequencyType === 'advanced' ? 'advanced' : (frequencyDetails.interval || '24'),
            schedule: med.times || frequencyDetails.schedule || [],
            advancedFrequency: frequencyType === 'advanced' ? frequencyDetails : null,
            durationType: duration.type || 'continuo',
            durationDays: duration.value || null,
          };
          
          setMedication(transformedMed);
          
          // Verificar se é da Farmácia Popular
          if (med.name) {
            const isPopular = medicationSearchService.isFarmaciaPopular(med.name);
            setIsFarmaciaPopular(isPopular);
            
            // Buscar preço de referência
            loadMedicationPrice(med.name);
          }
        }
      } catch (apiError) {
        console.warn('Erro ao carregar da API, tentando AsyncStorage:', apiError);
        // Fallback para AsyncStorage se a API falhar
        const medsJson = await AsyncStorage.getItem(MEDICATIONS_STORAGE_KEY);
        if (medsJson) {
          const meds = JSON.parse(medsJson);
          const med = meds.find(m => m.id === medicationId);
          setMedication(med);
          
          if (med && med.name) {
            const isPopular = medicationSearchService.isFarmaciaPopular(med.name);
            setIsFarmaciaPopular(isPopular);
            loadMedicationPrice(med.name);
          }
        }
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

  // Buscar preço de referência do medicamento
  const loadMedicationPrice = async (medicationName) => {
    if (!medicationName) return;
    
    try {
      setLoadingPrice(true);
      const priceResult = await medicationPriceService.getMedicationPrice(medicationName);
      
      if (priceResult.success && priceResult.data && priceResult.data.price) {
        setMedicationPrice(priceResult.data.price);
      }
    } catch (error) {
      console.warn('Erro ao buscar preço (não crítico):', error);
    } finally {
      setLoadingPrice(false);
    }
  };

  const getDoseStatus = (scheduleTime) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const [hours, minutes] = scheduleTime.split(':');
    const scheduledDateTime = new Date(today);
    scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // Verificar se há registro para este horário hoje
    const recordToday = doseHistory.find(h => {
      const hDate = new Date(h.takenAt);
      return hDate.toISOString().split('T')[0] === today && h.scheduledTime === scheduleTime;
    });

    // Verificar se foi marcado como não administrado
    if (recordToday && recordToday.status === 'not_administered') {
      return {
        status: 'not_administered',
        color: colors.error,
        icon: 'close-circle',
        label: recordToday.justification || 'Não administrado',
      };
    }

    // Verificar se já foi tomado hoje
    if (recordToday && recordToday.status === 'taken') {
      return {
        status: 'taken',
        color: colors.success,
        icon: 'checkmark-circle',
        label: `Tomado às ${new Date(recordToday.takenAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
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
        justification: reason || '',
      };

      const historyJson = await AsyncStorage.getItem(DOSE_HISTORY_STORAGE_KEY);
      const history = historyJson ? JSON.parse(historyJson) : [];
      
      // Remover registro anterior do mesmo horário no mesmo dia, se houver
      const today = new Date().toISOString().split('T')[0];
      const filteredHistory = history.filter(h => {
        const hDate = new Date(h.takenAt);
        const hToday = hDate.toISOString().split('T')[0];
        return !(h.medicationId === medicationId && h.scheduledTime === scheduledTime && hToday === today);
      });
      
      filteredHistory.push(doseRecord);
      await AsyncStorage.setItem(DOSE_HISTORY_STORAGE_KEY, JSON.stringify(filteredHistory));

      // Atualizar o estado local
      const updatedHistory = filteredHistory.filter(h => h.medicationId === medicationId);
      setDoseHistory(updatedHistory);

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
              // Buscar dados completos do medicamento primeiro
              const medResult = await medicationService.getMedication(medicationId);
              
              if (!medResult.success || !medResult.data) {
                throw new Error('Não foi possível carregar dados do medicamento');
              }
              
              const med = medResult.data;
              
              // Preparar dados para atualização
              const frequency = typeof med.frequency === 'string' 
                ? JSON.parse(med.frequency) 
                : (med.frequency || {});
              
              const frequencyDetails = frequency.details || {};
              const frequencyType = frequency.type || 'simple';
              
              const duration = typeof med.duration === 'string'
                ? JSON.parse(med.duration)
                : (med.duration || { type: 'continuo', value: null });
              
              // Preparar frequencyDetails para envio
              let frequencyDetailsToSend;
              if (frequencyType === 'advanced') {
                frequencyDetailsToSend = frequencyDetails;
              } else {
                frequencyDetailsToSend = {
                  interval: frequencyDetails.interval || '24',
                  schedule: med.times || frequencyDetails.schedule || [],
                };
              }
              
              console.log('📋 MedicationDetailsScreen - Dados para descontinuar:', {
                medicationId,
                isActive: false,
                frequencyType,
                frequencyDetails: frequencyDetailsToSend,
              });
              
              // Atualizar na API - apenas marcar como inativo
              const result = await medicationService.updateMedication(medicationId, {
                name: med.name,
                form: med.pharmaceutical_form || '',
                dosage: med.dosage || '',
                unit: med.unit || '',
                administrationRoute: med.administration_route || '',
                frequencyType: frequencyType,
                frequencyDetails: frequencyDetailsToSend,
                firstDoseAt: med.first_dose_at || null,
                durationType: duration.type || 'continuo',
                durationValue: duration.value || null,
                notes: med.notes || '',
                isActive: false, // Descontinuar = inativo
              });

              if (result.success) {
                Toast.show({
                  type: 'success',
                  text1: 'Medicamento descontinuado',
                  text2: `${medication.name} foi removido da lista`,
                });

                navigation.goBack();
              } else {
                throw new Error(result.error || 'Erro ao descontinuar');
              }
            } catch (error) {
              console.error('❌ MedicationDetailsScreen - Erro ao descontinuar:', error);
              console.error('❌ MedicationDetailsScreen - Detalhes do erro:', error.response?.data || error.message);
              
              let errorMessage = 'Não foi possível descontinuar o medicamento';
              
              // Tentar extrair mensagem de erro mais específica
              if (error.response?.data) {
                if (error.response.data.message) {
                  errorMessage = error.response.data.message;
                } else if (error.response.data.error) {
                  errorMessage = error.response.data.error;
                } else if (error.response.data.errors) {
                  const errors = Object.values(error.response.data.errors).flat();
                  errorMessage = errors.join(', ');
                }
              } else if (error.message) {
                errorMessage = error.message;
              }
              
              Alert.alert('Erro', errorMessage);
            }
          },
        },
      ]
    );
  };

  const handleComplete = async () => {
    Alert.alert(
      'Concluir Medicamento',
      `Tem certeza que deseja marcar ${medication.name} como concluído? O medicamento será movido para a lista de concluídos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Concluir',
          style: 'default',
          onPress: async () => {
            try {
              // Buscar dados completos do medicamento primeiro
              const medResult = await medicationService.getMedication(medicationId);
              
              if (!medResult.success || !medResult.data) {
                throw new Error('Não foi possível carregar dados do medicamento');
              }
              
              const med = medResult.data;
              
              // Preparar dados para atualização
              const frequency = typeof med.frequency === 'string' 
                ? JSON.parse(med.frequency) 
                : (med.frequency || {});
              
              const frequencyDetails = frequency.details || {};
              const frequencyType = frequency.type || 'simple';
              
              const duration = typeof med.duration === 'string'
                ? JSON.parse(med.duration)
                : (med.duration || { type: 'continuo', value: null });
              
              // Definir end_date como hoje para marcar como concluído
              const today = new Date();
              today.setHours(23, 59, 59, 999); // Final do dia
              const endDate = today.toISOString().split('T')[0]; // Formato YYYY-MM-DD
              
              // Preparar frequencyDetails para envio
              let frequencyDetailsToSend;
              if (frequencyType === 'advanced') {
                frequencyDetailsToSend = frequencyDetails;
              } else {
                frequencyDetailsToSend = {
                  interval: frequencyDetails.interval || '24',
                  schedule: med.times || frequencyDetails.schedule || [],
                };
              }
              
              console.log('📋 MedicationDetailsScreen - Dados para atualização:', {
                medicationId,
                endDate,
                frequencyType,
                frequencyDetails: frequencyDetailsToSend,
              });
              
              // Atualizar na API - definir end_date
              const result = await medicationService.updateMedication(medicationId, {
                name: med.name,
                form: med.pharmaceutical_form || '',
                dosage: med.dosage || '',
                unit: med.unit || '',
                administrationRoute: med.administration_route || '',
                frequencyType: frequencyType,
                frequencyDetails: frequencyDetailsToSend,
                firstDoseAt: med.first_dose_at || null,
                durationType: duration.type || 'continuo',
                durationValue: duration.value || null,
                notes: med.notes || '',
                isActive: med.is_active !== false, // Manter status ativo
                endDate: endDate, // Definir data de conclusão
              });

              if (result.success) {
                Toast.show({
                  type: 'success',
                  text1: 'Medicamento concluído',
                  text2: `${medication.name} foi movido para concluídos`,
                });

                navigation.goBack();
              } else {
                throw new Error(result.error || 'Erro ao concluir medicamento');
              }
            } catch (error) {
              console.error('❌ MedicationDetailsScreen - Erro ao concluir:', error);
              console.error('❌ MedicationDetailsScreen - Detalhes do erro:', error.response?.data || error.message);
              
              let errorMessage = 'Não foi possível concluir o medicamento';
              
              // Tentar extrair mensagem de erro mais específica
              if (error.response?.data) {
                if (error.response.data.message) {
                  errorMessage = error.response.data.message;
                } else if (error.response.data.error) {
                  errorMessage = error.response.data.error;
                } else if (error.response.data.errors) {
                  const errors = Object.values(error.response.data.errors).flat();
                  errorMessage = errors.join(', ');
                }
              } else if (error.message) {
                errorMessage = error.message;
              }
              
              Alert.alert('Erro', errorMessage);
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
      <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
        <View style={styles.loadingContainer}>
          <Text>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
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
              <Text style={styles.infoValue}>{medication.route || 'Não informado'}</Text>
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
                onPress={() => status.status !== 'taken' && status.status !== 'not_administered' && handleRegisterDose(time)}
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
                {status.status !== 'taken' && status.status !== 'not_administered' && (
                  <View style={[styles.quickRegisterBadge, { backgroundColor: status.color + '20' }]}>
                    <Ionicons name="checkmark" size={16} color={status.color} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Preço e Farmácias */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preço e Farmácias</Text>
          
          {/* Preço de Referência */}
          {loadingPrice ? (
            <View style={styles.priceCard}>
              <Text style={styles.priceNote}>Buscando preço de referência...</Text>
            </View>
          ) : medicationPrice !== null && (
            <View style={styles.priceCard}>
              <View style={styles.priceHeader}>
                <Ionicons name="cash-outline" size={24} color={colors.primary} />
                <Text style={styles.priceLabel}>Preço de Referência</Text>
              </View>
              <Text style={styles.priceValue}>
                R$ {medicationPrice.toFixed(2).replace('.', ',')}
              </Text>
              <Text style={styles.priceNote}>
                Preço médio de referência no mercado
              </Text>
            </View>
          )}
          
          {/* Badge Farmácia Popular */}
          {isFarmaciaPopular && (
            <View style={styles.farmaciaPopularBadge}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.farmaciaPopularText}>
                Disponível na Farmácia Popular
              </Text>
            </View>
          )}
          
          {/* Farmácias Populares Próximas */}
          {isFarmaciaPopular && medication && medication.name && (
            <View style={{ marginTop: 12 }}>
              <PopularPharmacies 
                medicationName={medication.name} 
                groupId={groupId} 
              />
            </View>
          )}
          
          {/* Farmácias Próximas (genéricas) */}
          {medication && medication.name && (
            <View style={{ marginTop: 12 }}>
              <NearbyPharmacies 
                medicationName={medication.name} 
                groupId={groupId} 
              />
            </View>
          )}
        </View>

        {/* Ações do Medicamento */}
        <View style={styles.section}>
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.completeButton}
              onPress={handleComplete}
            >
              <Ionicons name="checkmark-done-circle" size={24} color={colors.info} />
              <Text style={styles.completeButtonText}>Concluir Medicamento</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.discontinueButton}
              onPress={handleDiscontinue}
            >
              <Ionicons name="close-circle" size={24} color={colors.error} />
              <Text style={styles.discontinueButtonText}>Descontinuar Medicamento</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal de Registro Avançado */}
      <Modal
        visible={showRegisterModal && medication !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRegisterModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowRegisterModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Registrar Dose</Text>
              <TouchableOpacity onPress={() => setShowRegisterModal(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            {medication && (
            <View style={styles.modalBodyContainer}>
              <ScrollView 
                style={styles.modalBodyScroll}
                contentContainerStyle={styles.modalBodyContent}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
                keyboardShouldPersistTaps="handled"
                bounces={false}
              >
              <Text style={styles.modalMedicationName}>{medication.name || 'Medicamento'}</Text>
              <Text style={styles.modalScheduledTime}>
                Horário agendado: {selectedScheduleTime || 'N/A'}
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
                    placeholder="HH:MM (ex: 09:30)"
                    value={customTime}
                    onChangeText={(text) => {
                      // Remover tudo que não é número
                      const numbers = text.replace(/\D/g, '');
                      
                      // Limitar a 4 dígitos (HHMM)
                      const limitedNumbers = numbers.slice(0, 4);
                      
                      // Aplicar máscara HH:MM automaticamente
                      let formatted = '';
                      if (limitedNumbers.length === 0) {
                        formatted = '';
                      } else if (limitedNumbers.length <= 2) {
                        // Apenas horas (ex: "09")
                        formatted = limitedNumbers;
                      } else {
                        // Horas e minutos (ex: "0930" -> "09:30")
                        const hours = limitedNumbers.slice(0, 2);
                        const minutes = limitedNumbers.slice(2, 4);
                        formatted = `${hours}:${minutes}`;
                      }
                      
                      setCustomTime(formatted);
                    }}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                  <TouchableOpacity
                    style={styles.modalSubmitButton}
                    onPress={() => {
                      if (customTime) {
                        // Validar formato HH:MM
                        const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
                        if (timeRegex.test(customTime)) {
                          const [h, m] = customTime.split(':');
                          const today = new Date();
                          today.setHours(parseInt(h), parseInt(m), 0, 0);
                          handleRegisterDose(selectedScheduleTime, today.toISOString());
                          setShowRegisterModal(false);
                        } else {
                          Alert.alert('Erro', 'Digite o horário no formato HH:MM (ex: 09:30)');
                        }
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
              </ScrollView>
            </View>
            )}
          </View>
        </Pressable>
      </Modal>
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
  actionsContainer: {
    gap: 12,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.info + '10',
    borderWidth: 2,
    borderColor: colors.info + '40',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.info,
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
    height: Dimensions.get('window').height * 0.75,
    width: '90%',
    flexDirection: 'column',
    maxWidth: 500,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
  modalBodyContainer: {
    height: Dimensions.get('window').height * 0.75 - 80, // Altura total menos header
  },
  modalBodyScroll: {
    height: '100%',
  },
  modalBodyContent: {
    padding: 20,
    paddingBottom: 120,
    paddingTop: 0,
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
  priceCard: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  priceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    marginVertical: 4,
  },
  priceNote: {
    fontSize: 12,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  farmaciaPopularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '15',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.success + '30',
    gap: 8,
    marginBottom: 12,
  },
  farmaciaPopularText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success,
    flex: 1,
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
});

export default MedicationDetailsScreen;


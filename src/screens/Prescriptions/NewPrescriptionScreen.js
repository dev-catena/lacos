import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../constants/colors';
import SafeIcon from '../../components/SafeIcon';
import doctorService from '../../services/doctorService';
import moment from 'moment';
import 'moment/locale/pt-br';

moment.locale('pt-br');

const NewPrescriptionScreen = ({ route, navigation }) => {
  const { groupId, groupName } = route.params || {};
  const insets = useSafeAreaInsets();
  
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(moment());

  useEffect(() => {
    loadDoctors();
  }, [groupId]);

  const loadDoctors = async () => {
    try {
      setLoadingDoctors(true);
      const result = await doctorService.getDoctors(groupId);
      if (result.success && result.data) {
        setDoctors(result.data);
        // Selecionar o primeiro médico (assistente) se houver
        const primaryDoctor = result.data.find(d => d.is_primary);
        if (primaryDoctor) {
          setSelectedDoctor(primaryDoctor);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar médicos:', error);
    } finally {
      setLoadingDoctors(false);
    }
  };

  const handleSelectDoctor = () => {
    navigation.navigate('SelectDoctor', {
      groupId,
      groupName,
      onSelect: (doctor) => {
        setSelectedDoctor(doctor);
        navigation.goBack();
      }
    });
  };

  const handleAddMedication = () => {
    navigation.navigate('AddMedication', {
      groupId,
      groupName,
      doctorId: selectedDoctor?.id,
      doctorName: selectedDoctor?.name,
      prescriptionId: null,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <SafeIcon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Nova Receita</Text>
          <Text style={styles.headerSubtitle}>{groupName}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Data e Hora */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data e Hora</Text>
          <View style={styles.dateTimeContainer}>
            <SafeIcon name="calendar-outline" size={20} color={colors.primary} />
            <Text style={styles.dateTimeText}>
              {currentDateTime.format('DD/MM/YYYY [às] HH:mm')}
            </Text>
          </View>
        </View>

        {/* Seleção de Médico */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Médico</Text>
          {loadingDoctors ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <TouchableOpacity
              style={styles.doctorSelectButton}
              onPress={handleSelectDoctor}
            >
              <Text style={[styles.doctorSelectText, !selectedDoctor && styles.placeholderText]}>
                {selectedDoctor ? selectedDoctor.name : 'Selecionar Médico'}
              </Text>
              <SafeIcon name="chevron-forward" size={24} color={colors.gray400} />
            </TouchableOpacity>
          )}
          {selectedDoctor && (
            <View style={styles.doctorInfo}>
              {selectedDoctor.specialty && (
                <Text style={styles.doctorSpecialty}>{selectedDoctor.specialty}</Text>
              )}
              {selectedDoctor.crm && (
                <Text style={styles.doctorCrm}>CRM: {selectedDoctor.crm}</Text>
              )}
            </View>
          )}
        </View>

        {/* Botão para Incluir Medicamento */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.addMedicationButton, !selectedDoctor && styles.addMedicationButtonDisabled]}
            onPress={handleAddMedication}
            disabled={!selectedDoctor}
          >
            <SafeIcon name="medical-outline" size={24} color={colors.white} />
            <Text style={styles.addMedicationButtonText}>Incluir Medicamento</Text>
          </TouchableOpacity>
          {!selectedDoctor && (
            <Text style={styles.helperText}>Selecione um médico primeiro</Text>
          )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 14,
    color: colors.gray400,
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    gap: 12,
  },
  dateTimeText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  doctorSelectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  doctorSelectText: {
    fontSize: 16,
    color: colors.text,
  },
  placeholderText: {
    color: colors.gray400,
  },
  doctorInfo: {
    marginTop: 12,
    paddingLeft: 4,
  },
  doctorSpecialty: {
    fontSize: 14,
    color: colors.gray600,
    marginBottom: 4,
  },
  doctorCrm: {
    fontSize: 14,
    color: colors.gray600,
  },
  addMedicationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  addMedicationButtonDisabled: {
    backgroundColor: colors.gray400,
    opacity: 0.6,
  },
  addMedicationButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  helperText: {
    fontSize: 12,
    color: colors.gray400,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default NewPrescriptionScreen;



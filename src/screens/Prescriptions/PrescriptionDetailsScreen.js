import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../constants/colors';
import SafeIcon from '../../components/SafeIcon';
import prescriptionService from '../../services/prescriptionService';
import Toast from 'react-native-toast-message';
import moment from 'moment';
import 'moment/locale/pt-br';

moment.locale('pt-br');

const PrescriptionDetailsScreen = ({ route, navigation }) => {
  const { prescription, prescriptionId, groupId, groupName } = route.params || {};
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [prescriptionData, setPrescriptionData] = useState(prescription);

  useEffect(() => {
    // Se tiver prescriptionId mas não tiver prescription, buscar da API
    if (prescriptionId && !prescription) {
      loadPrescription();
    }
  }, [prescriptionId]);

  const loadPrescription = async () => {
    try {
      setLoading(true);
      const result = await prescriptionService.getPrescription(prescriptionId);
      if (result.success && result.data) {
        setPrescriptionData(result.data);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Erro ao carregar receita',
          text2: result.error || 'Tente novamente',
        });
        navigation.goBack();
      }
    } catch (error) {
      console.error('Erro ao carregar receita:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro ao carregar receita',
        text2: error.message || 'Tente novamente',
      });
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  if (!prescriptionData) {
    return (
      <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <SafeIcon name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalhes da Receita</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.emptyState}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <Text style={styles.emptyText}>Receita não encontrada</Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Data não informada';
    return moment(dateString).format('DD/MM/YYYY [às] HH:mm');
  };

  const formatDateShort = (dateString) => {
    if (!dateString) return 'Data não informada';
    return moment(dateString).format('DD/MM/YYYY');
  };
  
  const formatPrescriptionTitle = (prescription) => {
    const date = formatDateShort(prescription.prescriptionDate);
    const specialty = prescription.doctorSpecialty || '';
    const doctorName = prescription.doctorName || 'Médico não informado';
    
    // Formato: data, especialidade, nome do médico
    let title = date;
    if (specialty) {
      title += `, ${specialty}`;
    }
    title += `, Dr(a). ${doctorName}`;
    
    return title;
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
          <Text style={styles.headerTitle}>Receita Médica</Text>
          <Text style={styles.headerSubtitle}>{groupName}</Text>
        </View>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => {
            navigation.navigate('AddPrescription', {
              prescriptionId: prescriptionData.id,
              prescription: prescriptionData,
              groupId,
              groupName,
              isEditing: true,
            });
          }}
        >
          <SafeIcon name="create-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Informações do Médico */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <SafeIcon name="person" size={20} color={colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Médico</Text>
          </View>
          <View style={styles.sectionContent}>
            <Text style={styles.prescriptionTitle}>
              {formatPrescriptionTitle(prescriptionData)}
            </Text>
          </View>
        </View>


        {/* Medicamentos */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <SafeIcon name="medical-outline" size={20} color={colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>
              Medicamentos ({(prescriptionData.medications || []).length})
            </Text>
          </View>
          <View style={styles.medicationsContainer}>
            {(prescriptionData.medications || []).map((medication, index) => (
              <TouchableOpacity
                key={medication.id}
                style={styles.medicationCard}
                onPress={() => {
                  navigation.navigate('MedicationDetails', {
                    medicationId: medication.id,
                    groupId,
                    groupName,
                  });
                }}
                activeOpacity={0.7}
              >
                <View style={styles.medicationHeader}>
                  <View style={styles.medicationNumber}>
                    <Text style={styles.medicationNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.medicationInfo}>
                    <Text style={styles.medicationName}>{medication.name}</Text>
                    {(medication.form || medication.dosage) && (
                      <Text style={styles.medicationDetails}>
                        {medication.form && `${medication.form}`}
                        {medication.form && medication.dosage && ' - '}
                        {medication.dosage && `${medication.dosage}${medication.unit || ''}`}
                      </Text>
                    )}
                  </View>
                  {medication.isActive && (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>Ativo</Text>
                    </View>
                  )}
                </View>
                <SafeIcon
                  name="chevron-forward"
                  size={20}
                  color={colors.gray400}
                  style={styles.chevron}
                />
              </TouchableOpacity>
            ))}
          </View>
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
  editButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: colors.gray200,
    ...Platform.select({
      android: {
        elevation: 0,
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  sectionContent: {
    paddingLeft: 44, // Alinhar com o ícone
  },
  doctorName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  prescriptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 24,
  },
  dateText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  medicationsContainer: {
    paddingLeft: 44, // Alinhar com o ícone
    gap: 12,
  },
  medicationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  medicationHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  medicationNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  medicationNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  medicationDetails: {
    fontSize: 14,
    color: colors.gray600,
  },
  activeBadge: {
    backgroundColor: colors.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.success,
  },
  chevron: {
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray400,
  },
});

export default PrescriptionDetailsScreen;


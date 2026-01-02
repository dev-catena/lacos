import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../constants/colors';
import medicationService from '../../services/medicationService';
import SafeIcon from '../../components/SafeIcon';
import Toast from 'react-native-toast-message';
import moment from 'moment';
import 'moment/locale/pt-br';

moment.locale('pt-br');

const PrescriptionsScreen = ({ route, navigation }) => {
  const { groupId, groupName } = route.params || {};
  const insets = useSafeAreaInsets();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Validar e corrigir groupId
  const validGroupId = typeof groupId === 'number' && groupId > 1000000000000
    ? 1
    : groupId;

  useFocusEffect(
    useCallback(() => {
      loadPrescriptions();
    }, [validGroupId])
  );

  const loadPrescriptions = async () => {
    try {
      setLoading(true);
      const result = await medicationService.getMedications(validGroupId);
      
      if (result.success && result.data) {
        // Filtrar apenas medicamentos com doctor_id (receitas)
        const medicationsWithDoctor = result.data.filter(med => med.doctor_id);
        
        // Debug: verificar dados recebidos do backend
        const firstMedWithDoctor = medicationsWithDoctor[0];
        
        // Procurar especificamente por Ariadna
        const ariadnaMed = medicationsWithDoctor.find(med => 
          med.doctor && med.doctor.name && med.doctor.name.includes('Ariadna')
        );
        
        console.log('📋 PrescriptionsScreen - Dados recebidos do backend:', {
          total: result.data.length,
          totalWithDoctor: medicationsWithDoctor.length,
          firstMedWithDoctor: firstMedWithDoctor ? {
            id: firstMedWithDoctor.id,
            name: firstMedWithDoctor.name,
            doctor_id: firstMedWithDoctor.doctor_id,
            doctor: firstMedWithDoctor.doctor ? {
              id: firstMedWithDoctor.doctor.id,
              name: firstMedWithDoctor.doctor.name,
              medical_specialty: firstMedWithDoctor.doctor.medical_specialty,
              medical_specialty_id: firstMedWithDoctor.doctor.medical_specialty_id,
              user_id: firstMedWithDoctor.doctor.user_id,
              keys: Object.keys(firstMedWithDoctor.doctor),
              doctorFull: JSON.stringify(firstMedWithDoctor.doctor, null, 2),
            } : null,
          } : null,
        });
        
        // Log específico para Ariadna
        if (ariadnaMed) {
          console.log('🔍🔍🔍 ARIADNA ENCONTRADA NO BACKEND:', {
            medication_id: ariadnaMed.id,
            medication_name: ariadnaMed.name,
            doctor: ariadnaMed.doctor ? {
              id: ariadnaMed.doctor.id,
              name: ariadnaMed.doctor.name,
              medical_specialty: ariadnaMed.doctor.medical_specialty,
              medical_specialty_type: typeof ariadnaMed.doctor.medical_specialty,
              medical_specialty_id: ariadnaMed.doctor.medical_specialty_id,
              all_keys: Object.keys(ariadnaMed.doctor),
              doctor_full_json: JSON.stringify(ariadnaMed.doctor, null, 2),
            } : 'SEM DOCTOR',
          });
        } else {
          console.log('⚠️ ARIADNA NÃO ENCONTRADA nos medicamentos com doctor');
        }
        
        // Agrupar medicamentos por receita (médico + data de prescrição)
        const prescriptionsMap = new Map();
        
        medicationsWithDoctor.forEach(med => {
          const doctorId = med.doctor_id;
          const prescriptionDate = med.start_date || med.created_at;
          
          // Criar chave única para a receita: doctor_id + data (apenas data, sem hora)
          const dateKey = prescriptionDate 
            ? moment(prescriptionDate).format('YYYY-MM-DD')
            : moment(med.created_at).format('YYYY-MM-DD');
          
          const prescriptionKey = `${doctorId}_${dateKey}`;
          
          if (!prescriptionsMap.has(prescriptionKey)) {
            // Extrair especialidade do médico
            let doctorSpecialty = null;
            
            if (med.doctor) {
              // Log detalhado para Ariadna
              if (med.doctor.name && med.doctor.name.includes('Ariadna')) {
                console.log('🔍 ARIADNA - Dados completos do doctor:', JSON.stringify(med.doctor, null, 2));
                console.log('🔍 ARIADNA - medical_specialty:', med.doctor.medical_specialty);
                console.log('🔍 ARIADNA - medical_specialty_id:', med.doctor.medical_specialty_id);
                console.log('🔍 ARIADNA - Todas as chaves:', Object.keys(med.doctor));
              }
              
              // Extrair especialidade - tentar todas as formas possíveis
              if (med.doctor.medical_specialty) {
                if (typeof med.doctor.medical_specialty === 'object') {
                  doctorSpecialty = med.doctor.medical_specialty.name || 
                                   med.doctor.medical_specialty.title || 
                                   med.doctor.medical_specialty.label ||
                                   null;
                  
                  // Log para Ariadna
                  if (med.doctor.name && med.doctor.name.includes('Ariadna')) {
                    console.log('🔍 ARIADNA - Especialidade extraída do objeto:', doctorSpecialty);
                  }
                } else if (typeof med.doctor.medical_specialty === 'string') {
                  doctorSpecialty = med.doctor.medical_specialty;
                  
                  // Log para Ariadna
                  if (med.doctor.name && med.doctor.name.includes('Ariadna')) {
                    console.log('🔍 ARIADNA - Especialidade extraída da string:', doctorSpecialty);
                  }
                }
              }
              
              // Se ainda não encontrou, verificar outras propriedades possíveis
              if (!doctorSpecialty) {
                doctorSpecialty = med.doctor.specialty || 
                                 med.doctor.specialty_name ||
                                 med.doctor.medicalSpecialty ||
                                 null;
                
                // Log para Ariadna
                if (med.doctor.name && med.doctor.name.includes('Ariadna')) {
                  console.log('⚠️ ARIADNA - Especialidade NÃO encontrada após todas as tentativas');
                }
              }
            }
            
            // Criar nova receita
            prescriptionsMap.set(prescriptionKey, {
              id: prescriptionKey, // ID composto para a receita
              doctorId: doctorId,
              doctorName: med.doctor?.name || 'Médico não informado',
              doctorCrm: med.doctor?.crm || null,
              doctorSpecialty: doctorSpecialty,
              prescriptionDate: prescriptionDate || med.created_at,
              medications: [],
            });
          }
          
          // Adicionar medicamento à receita
          const prescription = prescriptionsMap.get(prescriptionKey);
          prescription.medications.push({
            id: med.id,
            name: med.name,
            form: med.pharmaceutical_form || med.form,
            dosage: med.dosage,
            unit: med.unit,
            isActive: med.is_active,
            createdAt: med.created_at,
            startDate: med.start_date,
          });
        });
        
        // Converter Map para Array e ordenar por data (mais recentes primeiro)
        const prescriptionsList = Array.from(prescriptionsMap.values())
          .map(prescription => ({
            ...prescription,
            medicationCount: prescription.medications.length,
            hasActiveMedications: prescription.medications.some(m => m.isActive),
          }))
          .sort((a, b) => {
            const dateA = new Date(a.prescriptionDate);
            const dateB = new Date(b.prescriptionDate);
            return dateB - dateA; // Mais recentes primeiro
          });
        
        // Debug: verificar receitas agrupadas antes de setar
        console.log('📋 PrescriptionsScreen - Receitas agrupadas:', prescriptionsList.map(p => ({
          id: p.id,
          doctorName: p.doctorName,
          doctorSpecialty: p.doctorSpecialty,
          prescriptionDate: p.prescriptionDate,
          medicationCount: p.medicationCount,
        })));
        
        setPrescriptions(prescriptionsList);
      } else {
        console.error('Erro ao carregar receitas:', result.error);
        setPrescriptions([]);
      }
    } catch (error) {
      console.error('Erro ao carregar receitas:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro ao carregar receitas',
        text2: error.message || 'Tente novamente',
      });
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPrescription = () => {
    setShowAddMenu(true);
  };

  const handleCreatePrescription = () => {
    setShowAddMenu(false);
    navigation.navigate('SelectDoctor', { groupId: validGroupId, groupName });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Data não informada';
    return moment(dateString).format('DD/MM/YYYY');
  };
  
  const formatPrescriptionTitle = (prescription) => {
    const date = formatDate(prescription.prescriptionDate);
    const specialty = prescription.doctorSpecialty || '';
    const doctorName = prescription.doctorName || 'Médico não informado';
    
    // Debug
    console.log('📝 formatPrescriptionTitle - Dados:', {
      date,
      specialty,
      doctorName,
      prescriptionKeys: Object.keys(prescription),
      doctorSpecialty: prescription.doctorSpecialty,
    });
    
    // Formato: data, especialidade, nome do médico
    let title = date;
    if (specialty) {
      title += `, ${specialty}`;
    }
    title += `, Dr(a). ${doctorName}`;
    
    console.log('📝 formatPrescriptionTitle - Título final:', title);
    return title;
  };

  const renderPrescriptionItem = ({ item }) => (
    <TouchableOpacity
      style={styles.prescriptionCard}
      onPress={() => {
        // Navegar para detalhes da receita (mostrar todos os medicamentos)
        navigation.navigate('PrescriptionDetails', {
          prescription: item,
          groupId: validGroupId,
          groupName,
        });
      }}
      activeOpacity={0.7}
    >
      <View style={styles.prescriptionHeader}>
        <View style={styles.prescriptionIcon}>
          <SafeIcon name="document-text" size={24} color={colors.primary} />
        </View>
        <View style={styles.prescriptionInfo}>
          <Text style={styles.prescriptionTitle} numberOfLines={2}>
            {formatPrescriptionTitle(item)}
          </Text>
          <View style={styles.medicationCountContainer}>
            <SafeIcon name="medical-outline" size={14} color={colors.gray400} />
            <Text style={styles.medicationCount}>
              {item.medicationCount} {item.medicationCount === 1 ? 'medicamento' : 'medicamentos'}
            </Text>
          </View>
        </View>
        {item.hasActiveMedications && (
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>Ativa</Text>
          </View>
        )}
      </View>

      <View style={styles.prescriptionDetails}>
        {/* Lista de medicamentos (máximo 3, depois "e mais X") */}
        <View style={styles.medicationsList}>
          {item.medications.slice(0, 3).map((med, index) => (
            <View key={med.id} style={styles.medicationItem}>
              <SafeIcon name="ellipse" size={6} color={colors.primary} />
              <Text style={styles.medicationItemText} numberOfLines={1}>
                {med.name}
                {med.dosage && ` - ${med.dosage}${med.unit || ''}`}
              </Text>
            </View>
          ))}
          {item.medications.length > 3 && (
            <Text style={styles.moreMedicationsText}>
              e mais {item.medications.length - 3} medicamento{item.medications.length - 3 > 1 ? 's' : ''}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <SafeIcon name="document-text" size={64} color={colors.gray300} />
      </View>
      <Text style={styles.emptyTitle}>Nenhuma receita cadastrada</Text>
      <Text style={styles.emptyText}>
        Cadastre receitas médicas para organizar as prescrições
      </Text>
    </View>
  );

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
          <Text style={styles.headerTitle}>Receitas</Text>
          <Text style={styles.headerSubtitle}>{groupName}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Lista de Receitas */}
      <FlatList
        data={prescriptions}
        renderItem={renderPrescriptionItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[
          styles.listContent,
          prescriptions.length === 0 && styles.listContentEmpty,
        ]}
        ListEmptyComponent={!loading && renderEmptyState}
        refreshing={loading}
        onRefresh={loadPrescriptions}
        showsVerticalScrollIndicator={false}
      />

      {/* Botão Flutuante */}
      {prescriptions.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleAddPrescription}
          activeOpacity={0.8}
        >
          <SafeIcon name="add" size={28} color={colors.textWhite} />
        </TouchableOpacity>
      )}

      {/* Botão de Adicionar quando vazio */}
      {prescriptions.length === 0 && !loading && (
        <View style={styles.emptyButtonContainer}>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={handleAddPrescription}
            activeOpacity={0.8}
          >
            <SafeIcon name="add" size={24} color={colors.white} />
            <Text style={styles.emptyButtonText}>Cadastrar Primeira Receita</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Menu Suspenso de Opções */}
      <Modal
        visible={showAddMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddMenu(false)}
      >
        <Pressable 
          style={styles.menuOverlay}
          onPress={() => setShowAddMenu(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuOption}
              onPress={handleCreatePrescription}
              activeOpacity={0.7}
            >
              <View style={[styles.menuOptionIcon, { backgroundColor: colors.secondary + '20' }]}>
                <SafeIcon name="document-text" size={24} color={colors.secondary} />
              </View>
              <View style={styles.menuOptionText}>
                <Text style={styles.menuOptionTitle}>Nova Receita</Text>
                <Text style={styles.menuOptionSubtitle}>Com prescrição médica</Text>
              </View>
              <SafeIcon name="chevron-forward" size={20} color={colors.gray400} />
            </TouchableOpacity>
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
  listContent: {
    padding: 20,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  prescriptionCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
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
  prescriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  prescriptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  prescriptionInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  doctorName: {
    fontSize: 14,
    color: colors.gray600,
  },
  prescriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  activeBadge: {
    backgroundColor: colors.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.success,
  },
  prescriptionDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: colors.gray600,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray400,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  medicationCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  medicationCount: {
    fontSize: 13,
    color: colors.gray600,
  },
  medicationsList: {
    marginTop: 8,
    gap: 6,
  },
  medicationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  medicationItemText: {
    fontSize: 13,
    color: colors.gray600,
    flex: 1,
  },
  moreMedicationsText: {
    fontSize: 12,
    color: colors.gray400,
    fontStyle: 'italic',
    marginTop: 2,
  },
  emptyButtonContainer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 20 : 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    paddingHorizontal: 20,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  menuOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuOptionText: {
    flex: 1,
  },
  menuOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  menuOptionSubtitle: {
    fontSize: 14,
    color: colors.gray400,
  },
});

export default PrescriptionsScreen;


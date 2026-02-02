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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../constants/colors';
import prescriptionService from '../../services/prescriptionService';
import SafeIcon from '../../components/SafeIcon';
import Toast from 'react-native-toast-message';
import moment from 'moment';
import 'moment/locale/pt-br';

moment.locale('pt-br');

// Cor azul pastel para componentes
const PASTEL_BLUE = '#93C5FD';

const PrescriptionsScreen = ({ route, navigation }) => {
  const { groupId, groupName } = route.params || {};
  const insets = useSafeAreaInsets();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

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
      const result = await prescriptionService.getPrescriptions(validGroupId);
      
      console.log('📋 PrescriptionsScreen - Resultado do serviço:', {
        success: result.success,
        hasData: !!result.data,
        dataType: typeof result.data,
        isArray: Array.isArray(result.data),
        dataKeys: result.data ? Object.keys(result.data) : null,
      });
      
      if (result.success && result.data) {
        // Garantir que result.data é um array
        const prescriptionsData = Array.isArray(result.data) ? result.data : [];
        
        console.log('📋 PrescriptionsScreen - Prescrições processadas:', prescriptionsData.length);
        
        // Ordenar receitas por data (mais recentes primeiro)
        const prescriptionsList = prescriptionsData
          .map(prescription => ({
            id: prescription.id,
            doctorId: prescription.doctor_id,
            doctorName: prescription.doctor_name || 'Médico não informado',
            doctorSpecialty: prescription.doctor_specialty,
            doctorCrm: prescription.doctor_crm,
            prescriptionDate: prescription.prescription_date,
            notes: prescription.notes,
            medicationCount: prescription.medication_count,
            medications: prescription.medications || [],
            hasActiveMedications: (prescription.medications || []).some(m => m.is_active),
            createdAt: prescription.created_at,
          }))
          .sort((a, b) => {
            const dateA = new Date(a.prescriptionDate);
            const dateB = new Date(b.prescriptionDate);
            return dateB - dateA; // Mais recentes primeiro
          });
        
        console.log('📋 PrescriptionsScreen - Receitas carregadas:', prescriptionsList.length);
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

  const formatDate = (dateString) => {
    if (!dateString) return 'Data não informada';
    return moment(dateString).format('DD/MM/YYYY');
  };

  const handleAddPrescription = () => {
    navigation.navigate('AddPrescription', {
      groupId: validGroupId,
      groupName,
    });
  };
  
  const renderPrescriptionItem = ({ item }) => {
    const date = formatDate(item.prescriptionDate);
    const doctorName = item.doctorName || 'Médico não informado';
    const specialty = item.doctorSpecialty || 'Especialidade não informada';

    return (
      <TouchableOpacity
        style={styles.prescriptionCard}
        onPress={() => {
          navigation.navigate('AddPrescription', {
            prescriptionId: item.id,
            prescription: item,
            groupId: validGroupId,
            groupName,
            isEditing: true,
          });
        }}
        activeOpacity={0.7}
      >
        <View style={styles.prescriptionHeader}>
          <View style={styles.prescriptionIcon}>
            <SafeIcon name="document-text" size={24} color={colors.primary} />
          </View>
          <View style={styles.prescriptionInfo}>
            <Text style={styles.prescriptionDate}>{date}</Text>
            <Text style={styles.doctorName}>{doctorName}</Text>
            <Text style={styles.doctorSpecialty}>{specialty}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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

      {/* Botão Flutuante para Adicionar Receita */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddPrescription}
        activeOpacity={0.8}
      >
        <SafeIcon name="add" size={28} color={colors.white} />
      </TouchableOpacity>

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
  prescriptionDate: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  doctorName: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  doctorSpecialty: {
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
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: PASTEL_BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default PrescriptionsScreen;


import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import colors from '../../constants/colors';
import { LacosIcon } from '../../components/LacosLogo';
import { ArrowBackIcon } from '../../components/CustomIcons';
import SafeIcon from '../../components/SafeIcon';
import medicationService from '../../services/medicationService';

const MedicationsScreen = ({ route, navigation }) => {
  let { groupId, groupName } = route.params || {};
  
  // TEMPORÁRIO: Se groupId é um timestamp, usar o grupo de teste
  if (groupId && groupId > 999999999999) {
    groupId = 1;
  }
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('all'); // all, morning, afternoon, night
  const [selectedStatus, setSelectedStatus] = useState('active'); // active, discontinued, completed

  useFocusEffect(
    React.useCallback(() => {
      loadMedications();
    }, [groupId, selectedStatus])
  );

  const loadMedications = async () => {
    try {
      setLoading(true);
      const result = await medicationService.getMedications(groupId);
      
      if (result.success) {
        const allMeds = result.data || [];
        // Filtrar por status (ativo/descontinuado/concluído) baseado no selectedStatus
        const filteredMeds = allMeds.filter(med => {
          if (selectedStatus === 'active') {
            // Em uso: ativo e não concluído
            if (!med.is_active) return false;
            if (med.end_date) {
              const endDate = new Date(med.end_date);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              return endDate >= today; // Ainda não terminou
            }
            return true; // Sem end_date = contínuo
          }
          if (selectedStatus === 'discontinued') {
            // Descontinuado: não ativo (independente de end_date)
            // Mas não deve aparecer se já foi concluído (end_date no passado)
            if (med.is_active) return false;
            
            // Se tem end_date e está no passado, é concluído, não descontinuado
            if (med.end_date) {
              const endDate = new Date(med.end_date);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              if (endDate < today) {
                return false; // Já concluído, não é descontinuado
              }
            }
            
            // is_active === false e (sem end_date ou end_date no futuro) = descontinuado
            return true;
          }
          if (selectedStatus === 'completed') {
            // Concluído: medicamento que terminou (end_date no passado)
            if (med.end_date) {
              const endDate = new Date(med.end_date);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              return endDate < today;
            }
            return false;
          }
          return true; // 'all' - mostrar todos
        });
        
        // Transformar dados da API para o formato esperado pela UI
        const transformedMeds = filteredMeds.map(med => {
          // O backend agora retorna frequency como array { type, details }
          // e duration como array { type, value }
          const frequency = typeof med.frequency === 'string' 
            ? JSON.parse(med.frequency) 
            : (med.frequency || {});
          
          const frequencyDetails = frequency.details || {};
          const frequencyType = frequency.type || 'simple';
          
          const duration = typeof med.duration === 'string'
            ? JSON.parse(med.duration)
            : (med.duration || { type: 'continuo', value: null });
          
          return {
            id: med.id,
            groupId: med.group_id,
            name: med.name,
            form: med.pharmaceutical_form || med.form, // Backend retorna pharmaceutical_form
            dosage: med.dosage,
            unit: med.unit,
            route: med.administration_route,
            frequency: frequencyType === 'advanced' ? 'advanced' : (frequencyDetails.interval || '24'),
            schedule: med.times || frequencyDetails.schedule || [],
            advancedFrequency: frequencyType === 'advanced' ? frequencyDetails : null,
            instructions: med.notes,
            durationType: duration.type || 'continuo',
            durationDays: duration.value || null,
            active: med.is_active,
            created_at: med.created_at, // Data de criação/prescrição
            start_date: med.start_date, // Data de início
          };
        });
        
        // Ordenar por data de prescrição (mais recentes primeiro)
        // Usar start_date se disponível, senão usar created_at
        transformedMeds.sort((a, b) => {
          const dateA = a.start_date || a.created_at;
          const dateB = b.start_date || b.created_at;
          
          if (!dateA && !dateB) return 0;
          if (!dateA) return 1; // Sem data vai para o final
          if (!dateB) return -1; // Sem data vai para o final
          
          // Converter para Date e comparar (mais recente primeiro = ordem decrescente)
          return new Date(dateB) - new Date(dateA);
        });
        
        setMedications(transformedMeds);
      } else {
        console.error('Erro ao carregar medicamentos:', result.error);
      }
    } catch (error) {
      console.error('Erro ao carregar medicamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMedicationsByPeriod = () => {
    const periods = {
      morning: { name: 'Manhã', icon: 'sunny', color: colors.warning, meds: [] },
      afternoon: { name: 'Tarde', icon: 'partly-sunny', color: colors.info, meds: [] },
      night: { name: 'Noite', icon: 'moon', color: colors.secondary, meds: [] },
    };

    medications.forEach(med => {
      if (med.schedule && med.schedule.length > 0) {
        med.schedule.forEach(time => {
          const hour = parseInt(time.split(':')[0]);
          if (hour >= 6 && hour < 12) {
            periods.morning.meds.push({ ...med, time });
          } else if (hour >= 12 && hour < 18) {
            periods.afternoon.meds.push({ ...med, time });
          } else {
            periods.night.meds.push({ ...med, time });
          }
        });
      }
    });

    return periods;
  };

  const handleAddMedication = () => {
    // Agora apenas cadastra sem prescrição diretamente
    navigation.navigate('AddMedication', { groupId, groupName, prescriptionId: null });
  };

  const periods = getMedicationsByPeriod();
  
  const getFilteredPeriods = () => {
    if (selectedPeriod === 'all') return periods;
    
    const filtered = {};
    if (selectedPeriod === 'morning') filtered.morning = periods.morning;
    if (selectedPeriod === 'afternoon') filtered.afternoon = periods.afternoon;
    if (selectedPeriod === 'night') filtered.night = periods.night;
    return filtered;
  };

  const filteredPeriods = getFilteredPeriods();

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowBackIcon size={24} color={colors.text || '#1e293b'} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <View style={styles.headerLeft}>
            <LacosIcon size={36} />
            <View>
              <Text style={styles.title}>Remédios</Text>
              <Text style={styles.subtitle}>{groupName}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.headerRight} />
      </View>

      {/* Filtros de Status - Estilo Tab */}
      <View style={styles.statusFiltersContainer}>
        <View style={styles.statusFilters}>
          <TouchableOpacity
            style={[styles.statusTab, selectedStatus === 'active' && styles.statusTabActive]}
            onPress={() => setSelectedStatus('active')}
          >
            <SafeIcon 
              name="checkmark-circle-outline" 
              size={20} 
              color={selectedStatus === 'active' ? colors.success : colors.textLight} 
            />
            <Text style={[styles.statusTabText, selectedStatus === 'active' && styles.statusTabTextActive]}>
              Em uso
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.statusTab, selectedStatus === 'discontinued' && styles.statusTabActive]}
            onPress={() => setSelectedStatus('discontinued')}
          >
            <SafeIcon 
              name="archive-outline" 
              size={20} 
              color={selectedStatus === 'discontinued' ? colors.error : colors.textLight} 
            />
            <Text style={[styles.statusTabText, selectedStatus === 'discontinued' && styles.statusTabTextActive]}>
              Descontinuado
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.statusTab, selectedStatus === 'completed' && styles.statusTabActive]}
            onPress={() => setSelectedStatus('completed')}
          >
            <SafeIcon 
              name="checkmark-done-circle" 
              size={20} 
              color={selectedStatus === 'completed' ? colors.info : colors.textLight} 
            />
            <Text style={[styles.statusTabText, selectedStatus === 'completed' && styles.statusTabTextActive]}>
              Concluído
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filtros por turno - Estilo Chip */}
      {medications.length > 0 && (
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
            <TouchableOpacity
              style={[styles.filterChip, selectedPeriod === 'all' && styles.filterChipActive]}
              onPress={() => setSelectedPeriod('all')}
            >
              <SafeIcon 
                name="apps-outline" 
                size={18} 
                color={selectedPeriod === 'all' ? colors.textWhite : colors.text} 
              />
              <Text style={[styles.filterChipText, selectedPeriod === 'all' && styles.filterChipTextActive]}>
                Todos
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.filterChip, selectedPeriod === 'morning' && styles.filterChipActive]}
              onPress={() => setSelectedPeriod('morning')}
            >
            <SafeIcon 
              name="sunny" 
              size={18} 
              color={selectedPeriod === 'morning' ? colors.textWhite : colors.warning} 
            />
              <Text style={[styles.filterChipText, selectedPeriod === 'morning' && styles.filterChipTextActive]}>
                Manhã
              </Text>
              {periods.morning.meds.length > 0 && (
                <View style={[styles.filterBadge, selectedPeriod === 'morning' && styles.filterBadgeActive]}>
                  <Text style={[styles.filterBadgeText, selectedPeriod === 'morning' && styles.filterBadgeTextActive]}>
                    {periods.morning.meds.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.filterChip, selectedPeriod === 'afternoon' && styles.filterChipActive]}
              onPress={() => setSelectedPeriod('afternoon')}
            >
            <SafeIcon 
              name="partly-sunny" 
              size={18} 
              color={selectedPeriod === 'afternoon' ? colors.textWhite : colors.info} 
            />
              <Text style={[styles.filterChipText, selectedPeriod === 'afternoon' && styles.filterChipTextActive]}>
                Tarde
              </Text>
              {periods.afternoon.meds.length > 0 && (
                <View style={[styles.filterBadge, selectedPeriod === 'afternoon' && styles.filterBadgeActive]}>
                  <Text style={[styles.filterBadgeText, selectedPeriod === 'afternoon' && styles.filterBadgeTextActive]}>
                    {periods.afternoon.meds.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.filterChip, selectedPeriod === 'night' && styles.filterChipActive]}
              onPress={() => setSelectedPeriod('night')}
            >
            <SafeIcon 
              name="moon" 
              size={18} 
              color={selectedPeriod === 'night' ? colors.textWhite : colors.secondary} 
            />
              <Text style={[styles.filterChipText, selectedPeriod === 'night' && styles.filterChipTextActive]}>
                Noite
              </Text>
              {periods.night.meds.length > 0 && (
                <View style={[styles.filterBadge, selectedPeriod === 'night' && styles.filterBadgeActive]}>
                  <Text style={[styles.filterBadgeText, selectedPeriod === 'night' && styles.filterBadgeTextActive]}>
                    {periods.night.meds.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Carregando medicamentos...</Text>
          </View>
        ) : medications.length === 0 ? (
          <View style={styles.emptyState}>
            <SafeIcon 
              name={
                selectedStatus === 'discontinued' ? "archive-outline" :
                selectedStatus === 'completed' ? "checkmark-done-circle-outline" :
                "medical-outline"
              } 
              size={80} 
              color={colors.gray300} 
            />
            <Text style={styles.emptyTitle}>
              {selectedStatus === 'discontinued' 
                ? 'Nenhum remédio descontinuado' 
                : selectedStatus === 'completed'
                ? 'Nenhum remédio concluído'
                : 'Nenhum remédio em uso'}
            </Text>
            <Text style={styles.emptyText}>
              {selectedStatus === 'discontinued'
                ? 'Medicamentos descontinuados aparecerão aqui'
                : selectedStatus === 'completed'
                ? 'Medicamentos concluídos aparecerão aqui'
                : 'Cadastre os medicamentos da pessoa acompanhada para gerenciar horários e doses'}
            </Text>
          </View>
        ) : (
          <>
            {Object.entries(filteredPeriods).map(([key, period]) => (
              period.meds.length > 0 && (
                <View key={key} style={styles.periodSection}>
                  <View style={styles.periodHeader}>
                    <SafeIcon name={period.icon} size={24} color={period.color} />
                    <Text style={styles.periodTitle}>{period.name}</Text>
                    <View style={styles.periodBadge}>
                      <Text style={styles.periodBadgeText}>{period.meds.length}</Text>
                    </View>
                  </View>

                  {period.meds.map((med, index) => {
                    const getFormIcon = (form) => {
                      const formLower = form.toLowerCase();
                      if (formLower.includes('comprimido')) return 'medical-outline';
                      if (formLower.includes('cápsula')) return 'ellipse-outline';
                      if (formLower.includes('gotas') || formLower.includes('solução')) return 'water-outline';
                      if (formLower.includes('xarope')) return 'flask-outline';
                      if (formLower.includes('pomada') || formLower.includes('creme') || formLower.includes('gel')) return 'fitness-outline';
                      if (formLower.includes('injetável') || formLower.includes('ampola')) return 'bandage-outline';
                      if (formLower.includes('adesivo')) return 'square-outline';
                      if (formLower.includes('supositório') || formLower.includes('óvulo')) return 'cube-outline';
                      if (formLower.includes('spray') || formLower.includes('inal')) return 'airplane-outline';
                      if (formLower.includes('colírio')) return 'eye-outline';
                      return 'medical-outline';
                    };

                    return (
                      <TouchableOpacity
                        key={`${med.id}-${index}`}
                        style={styles.medicationCard}
                        onPress={() => navigation.navigate('MedicationDetails', { medicationId: med.id, groupId })}
                        onLongPress={() => navigation.navigate('MedicationDetails', { medicationId: med.id, groupId })}
                        delayLongPress={500}
                      >
                        <View style={styles.medicationLeft}>
                          <View style={[styles.medicationIcon, { backgroundColor: period.color + '20' }]}>
                            <SafeIcon name={getFormIcon(med.form)} size={24} color={period.color} />
                          </View>
                          <View style={styles.medicationInfo}>
                            <Text style={styles.medicationName}>{med.name}</Text>
                            <Text style={styles.medicationDosage}>
                              {med.dosage} {med.unit} - {med.form}
                            </Text>
                            {med.time && (
                              <Text style={styles.medicationTime}>
                                <SafeIcon name="time-outline" size={14} color={colors.textLight} /> {med.time}
                              </Text>
                            )}
                          </View>
                        </View>
                        <SafeIcon name="chevron-forward" size={20} color={colors.gray400} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )
            ))}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Botão Flutuante */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddMedication}
        activeOpacity={0.8}
      >
        <SafeIcon name="add" size={28} color={colors.textWhite} />
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerRight: {
    width: 40,
  },
  statusFiltersContainer: {
    backgroundColor: colors.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 8,
  },
  statusFilters: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
  },
  statusTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
  },
  statusTabActive: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  statusTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
  },
  statusTabTextActive: {
    color: colors.text,
    fontWeight: '700',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.backgroundLight,
    borderWidth: 2,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  filterChipTextActive: {
    color: colors.textWhite,
  },
  filterBadge: {
    backgroundColor: colors.primary + '30',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  filterBadgeActive: {
    backgroundColor: colors.textWhite + '40',
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.primary,
  },
  filterBadgeTextActive: {
    color: colors.textWhite,
  },
  periodSection: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  periodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  periodTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  periodBadge: {
    backgroundColor: colors.backgroundLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  periodBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textLight,
  },
  medicationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  medicationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  medicationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
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
  medicationDosage: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 4,
  },
  medicationTime: {
    fontSize: 12,
    color: colors.textLight,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
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
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.backgroundLight,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
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
    color: colors.textLight,
  },
});

export default MedicationsScreen;


import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import colors from '../../constants/colors';
import { LacosIcon } from '../../components/LacosLogo';
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
  const [showDiscontinued, setShowDiscontinued] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadMedications();
    }, [groupId, showDiscontinued])
  );

  const loadMedications = async () => {
    try {
      setLoading(true);
      const result = await medicationService.getMedications(groupId);
      
      if (result.success) {
        const allMeds = result.data || [];
        // Filtrar por ativos ou descontinuados
        const filteredMeds = allMeds.filter(med => 
          showDiscontinued ? !med.is_active : med.is_active
        );
        
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
          };
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
    setShowAddMenu(true);
  };

  const handleWithPrescription = () => {
    setShowAddMenu(false);
    navigation.navigate('SelectDoctor', { groupId, groupName });
  };

  const handleWithoutPrescription = () => {
    setShowAddMenu(false);
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
        
        <View style={styles.headerCenter}>
          <View style={styles.headerLeft}>
            <LacosIcon size={36} />
            <View>
              <Text style={styles.title}>Remédios</Text>
              <Text style={styles.subtitle}>{groupName}</Text>
            </View>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setShowDiscontinued(!showDiscontinued)}
        >
          <Ionicons 
            name={showDiscontinued ? "list" : "archive"} 
            size={24} 
            color={colors.primary} 
          />
        </TouchableOpacity>
      </View>

      {/* Filtros por turno */}
      {medications.length > 0 && (
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
            <TouchableOpacity
              style={[styles.filterChip, selectedPeriod === 'all' && styles.filterChipActive]}
              onPress={() => setSelectedPeriod('all')}
            >
              <Ionicons 
                name="grid" 
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
              <Ionicons 
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
              <Ionicons 
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
              <Ionicons 
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
            <Ionicons 
              name={showDiscontinued ? "archive-outline" : "medical-outline"} 
              size={80} 
              color={colors.gray300} 
            />
            <Text style={styles.emptyTitle}>
              {showDiscontinued ? 'Nenhum remédio descontinuado' : 'Nenhum remédio cadastrado'}
            </Text>
            <Text style={styles.emptyText}>
              {showDiscontinued 
                ? 'Medicamentos descontinuados aparecerão aqui' 
                : 'Cadastre os medicamentos da pessoa acompanhada para gerenciar horários e doses'}
            </Text>
          </View>
        ) : (
          <>
            {Object.entries(filteredPeriods).map(([key, period]) => (
              period.meds.length > 0 && (
                <View key={key} style={styles.periodSection}>
                  <View style={styles.periodHeader}>
                    <Ionicons name={period.icon} size={24} color={period.color} />
                    <Text style={styles.periodTitle}>{period.name}</Text>
                    <View style={styles.periodBadge}>
                      <Text style={styles.periodBadgeText}>{period.meds.length}</Text>
                    </View>
                  </View>

                  {period.meds.map((med, index) => {
                    const getFormIcon = (form) => {
                      const formLower = form.toLowerCase();
                      if (formLower.includes('comprimido')) return 'medical';
                      if (formLower.includes('cápsula')) return 'ellipse';
                      if (formLower.includes('gotas') || formLower.includes('solução')) return 'water';
                      if (formLower.includes('xarope')) return 'flask';
                      if (formLower.includes('pomada') || formLower.includes('creme')) return 'fitness';
                      if (formLower.includes('injetável')) return 'bandage';
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
                            <Ionicons name={getFormIcon(med.form)} size={24} color={period.color} />
                          </View>
                          <View style={styles.medicationInfo}>
                            <Text style={styles.medicationName}>{med.name}</Text>
                            <Text style={styles.medicationDosage}>
                              {med.dosage} {med.unit} - {med.form}
                            </Text>
                            <Text style={styles.medicationTime}>
                              <Ionicons name="time-outline" size={14} color={colors.textLight} /> {med.time}
                            </Text>
                          </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
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
        <Ionicons name="add" size={28} color={colors.textWhite} />
      </TouchableOpacity>

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
              onPress={handleWithPrescription}
              activeOpacity={0.7}
            >
              <View style={[styles.menuOptionIcon, { backgroundColor: colors.secondary + '20' }]}>
                <Ionicons name="document-text" size={24} color={colors.secondary} />
              </View>
              <View style={styles.menuOptionText}>
                <Text style={styles.menuOptionTitle}>Receita</Text>
                <Text style={styles.menuOptionSubtitle}>Com prescrição médica</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuOption}
              onPress={handleWithoutPrescription}
              activeOpacity={0.7}
            >
              <View style={[styles.menuOptionIcon, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="add-circle" size={24} color={colors.primary} />
              </View>
              <View style={styles.menuOptionText}>
                <Text style={styles.menuOptionTitle}>Sem prescrição</Text>
                <Text style={styles.menuOptionSubtitle}>Cadastro rápido</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
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
  toggleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
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


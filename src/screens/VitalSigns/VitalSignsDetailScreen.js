import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  Alert,
  Pressable,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import colors from '../../constants/colors';
import { ArrowBackIcon, AddIcon, PulseIcon } from '../../components/CustomIcons';
import SafeIcon from '../../components/SafeIcon';
import vitalSignService from '../../services/vitalSignService';
import VitalSignsLineChart from '../../components/VitalSignsLineChart';
import moment from 'moment';
import AddVitalSignModal from './AddVitalSignModal';

const VitalSignsDetailScreen = ({ route, navigation }) => {
  const { groupId, groupName } = route.params || {};
  
  const [loading, setLoading] = useState(true);
  const [vitalSignsData, setVitalSignsData] = useState({});
  const [basalValues, setBasalValues] = useState({});
  const [selectedIndicator, setSelectedIndicator] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedIndicatorData, setSelectedIndicatorData] = useState([]);

  // Configuração dos indicadores
  const indicatorsConfig = [
    {
      key: 'blood_pressure',
      label: 'Pressão Arterial',
      icon: 'pulse',
      color: colors.error,
      unit: 'mmHg',
      enabledKey: 'monitor_blood_pressure',
    },
    {
      key: 'heart_rate',
      label: 'Frequência Cardíaca',
      icon: 'heart',
      color: colors.secondary,
      unit: 'bpm',
      enabledKey: 'monitor_heart_rate',
    },
    {
      key: 'oxygen_saturation',
      label: 'Saturação de Oxigênio',
      icon: 'water',
      color: colors.info,
      unit: '%',
      enabledKey: 'monitor_oxygen_saturation',
    },
    {
      key: 'blood_glucose',
      label: 'Glicemia',
      icon: 'fitness',
      color: colors.warning,
      unit: 'mg/dL',
      enabledKey: 'monitor_blood_glucose',
    },
    {
      key: 'temperature',
      label: 'Temperatura',
      icon: 'thermometer',
      color: colors.success,
      unit: '°C',
      enabledKey: 'monitor_temperature',
    },
    {
      key: 'respiratory_rate',
      label: 'Frequência Respiratória',
      icon: 'leaf',
      color: colors.primary,
      unit: 'ipm',
      enabledKey: 'monitor_respiratory_rate',
    },
  ];

  useEffect(() => {
    loadVitalSigns();
  }, [groupId]);

  const loadVitalSigns = async () => {
    try {
      setLoading(true);
      const result = await vitalSignService.getVitalSigns(groupId);
      
      if (result.success && result.data) {
        // Organizar dados por tipo de indicador
        const organized = {};
        const basals = {};

        indicatorsConfig.forEach(indicator => {
          const typeData = result.data.filter(item => item.type === indicator.key);
          
          // Ordenar por data (mais antigo primeiro) para pegar as últimas 20
          const sortedData = [...typeData].sort((a, b) => 
            new Date(a.measured_at) - new Date(b.measured_at)
          );
          
          // Pegar as últimas 20 medidas (mais recentes) e manter ordenadas do mais antigo para o mais recente
          // Isso permite que o gráfico mostre a evolução temporal da esquerda para a direita
          organized[indicator.key] = sortedData.slice(-20);

          // Calcular basal (média de TODAS as medidas, não só as 20 mostradas)
          if (typeData.length > 0) {
            const values = typeData.map(item => {
              // Se value é array (formato do banco), pegar primeiro elemento ou objeto
              let value = item.value;
              if (Array.isArray(value) && value.length > 0) {
                value = value[0];
              }
              
              if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                // Objeto com systolic/diastolic
                if (value.systolic && value.diastolic) {
                  return (value.systolic + value.diastolic) / 2;
                }
                // Se for array dentro do objeto, pegar primeiro
                if (Array.isArray(value) && value.length > 0) {
                  return parseFloat(value[0]) || 0;
                }
              }
              return parseFloat(value) || 0;
            });
            const sum = values.reduce((a, b) => a + b, 0);
            basals[indicator.key] = sum / values.length;
          }
        });

        setVitalSignsData(organized);
        setBasalValues(basals);
        
        // Log para depuração
        console.log('📊 VitalSignsDetailScreen - Dados organizados:', Object.keys(organized));
        console.log('📊 VitalSignsDetailScreen - Total de dados:', result.data.length);
        indicatorsConfig.forEach(indicator => {
          const count = organized[indicator.key]?.length || 0;
          if (count > 0) {
            console.log(`📊 ${indicator.label}: ${count} medidas, basal: ${basals[indicator.key]?.toFixed(2) || 'N/A'}`);
          }
        });
      } else {
        console.log('⚠️ VitalSignsDetailScreen - Nenhum dado retornado da API');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar sinais vitais:', error);
      Alert.alert('Erro', 'Não foi possível carregar os sinais vitais');
    } finally {
      setLoading(false);
    }
  };

  const handleChartPress = async (indicatorKey) => {
    // Buscar TODAS as medidas deste indicador (não só as 20 do gráfico)
    try {
      const result = await vitalSignService.getVitalSigns(groupId, indicatorKey);
      if (result.success && result.data) {
        // Ordenar por data (mais recente primeiro)
        const allData = [...result.data].sort((a, b) => 
          new Date(b.measured_at) - new Date(a.measured_at)
        );
        setSelectedIndicatorData(allData);
        setSelectedIndicator(indicatorKey);
        setShowDetailsModal(true);
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
      // Fallback: usar dados já carregados
      const result = vitalSignsData[indicatorKey] || [];
      const allData = [...result].sort((a, b) => 
        new Date(b.measured_at) - new Date(a.measured_at)
      );
      setSelectedIndicatorData(allData);
      setSelectedIndicator(indicatorKey);
      setShowDetailsModal(true);
    }
  };

  const handleAddMeasure = () => {
    setShowAddModal(true);
  };

  const handleAddSuccess = () => {
    setShowAddModal(false);
    loadVitalSigns();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const enabledIndicators = indicatorsConfig.filter(indicator => {
    // Por enquanto, mostrar todos. Depois pode filtrar por configuração do grupo
    return true;
  });

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowBackIcon size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.title}>Sinais Vitais</Text>
          <Text style={styles.subtitle}>{groupName}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {enabledIndicators.length === 0 ? (
          <View style={styles.emptyState}>
            <PulseIcon size={64} color={colors.gray300} />
            <Text style={styles.emptyTitle}>Nenhum indicador habilitado</Text>
            <Text style={styles.emptyText}>
              Configure os indicadores nas configurações do grupo
            </Text>
          </View>
        ) : (
          enabledIndicators.map((indicator) => {
            const data = vitalSignsData[indicator.key] || [];
            const basal = basalValues[indicator.key];

            return (
              <TouchableOpacity
                key={indicator.key}
                style={styles.indicatorCard}
                onPress={() => handleChartPress(indicator.key)}
                activeOpacity={0.7}
              >
                <View style={styles.indicatorHeader}>
                  <View style={[styles.indicatorIcon, { backgroundColor: indicator.color + '20' }]}>
                    <SafeIcon name={indicator.icon} size={24} color={indicator.color} />
                  </View>
                  <Text style={styles.indicatorLabel}>{indicator.label}</Text>
                </View>

                {data.length > 0 ? (
                  <VitalSignsLineChart
                    data={data}
                    basalValue={basal}
                    unit={indicator.unit}
                    color={indicator.color}
                    label={indicator.label}
                  />
                ) : (
                  <View style={styles.noDataContainer}>
                    <Text style={styles.noDataText}>Nenhuma medida registrada</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Modal de Detalhes */}
      <Modal
        visible={showDetailsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDetailsModal(false)}
        statusBarTranslucent={true}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowDetailsModal(false)}
        >
          <Pressable 
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {indicatorsConfig.find(i => i.key === selectedIndicator)?.label || 'Detalhes'}
              </Text>
              <TouchableOpacity
                onPress={() => setShowDetailsModal(false)}
                style={styles.modalCloseButton}
              >
                <SafeIcon name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              {selectedIndicatorData.map((item, index) => (
                <View key={index} style={styles.detailItem}>
                  <View style={styles.detailItemLeft}>
                    <Text style={styles.detailDate}>
                      {moment(item.measured_at).format('DD/MM/YYYY')}
                    </Text>
                    <Text style={styles.detailTime}>
                      {moment(item.measured_at).format('HH:mm')}
                    </Text>
                  </View>
                  <View style={styles.detailItemCenter}>
                    <Text style={styles.detailValue}>
                      {typeof item.value === 'object' && item.value !== null
                        ? `${item.value.systolic}/${item.value.diastolic}`
                        : parseFloat(item.value || 0).toFixed(1)}
                      {' '}
                      {indicatorsConfig.find(i => i.key === selectedIndicator)?.unit || ''}
                    </Text>
                    <Text style={styles.detailSource}>
                      {item.measured_by_name || item.wearable_name || 'Manual'}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal de Adicionar Medida */}
      <AddVitalSignModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddSuccess}
        groupId={groupId}
        groupName={groupName}
      />

      {/* Botão Flutuante */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddMeasure}
        activeOpacity={0.8}
      >
        <AddIcon size={28} color={colors.white} />
      </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 2,
  },
  headerSpacer: {
    width: 40,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  indicatorCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  indicatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  indicatorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  indicatorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  noDataContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 14,
    color: colors.textLight,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 1001,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalScrollView: {
    maxHeight: 400,
    paddingHorizontal: 20,
    backgroundColor: colors.white,
  },
  detailItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  detailItemLeft: {
    width: 100,
    marginRight: 16,
  },
  detailDate: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  detailTime: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
  },
  detailItemCenter: {
    flex: 1,
  },
  detailValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  detailSource: {
    fontSize: 13,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  emptyModalState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyModalText: {
    fontSize: 14,
    color: colors.textLight,
  },
});

export default VitalSignsDetailScreen;


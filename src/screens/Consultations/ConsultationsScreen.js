import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import colors from '../../constants/colors';
import { LacosIcon } from '../../components/CustomIcons';

const ConsultationsScreen = ({ route, navigation }) => {
  let { groupId, groupName } = route.params || {};
  
  // TEMPORÁRIO: Se groupId é um timestamp, usar o grupo de teste
  if (groupId && groupId > 999999999999) {
    groupId = 1;
  }

  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // all, medical, fisioterapia, exames, urgency

  useFocusEffect(
    React.useCallback(() => {
      loadConsultations();
    }, [groupId, filterType])
  );

  const loadConsultations = async () => {
    if (!groupId) {
      setConsultations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // TODO: Integrar com API
      // const result = await consultationService.getConsultations(groupId, filterType);
      
      // Mock data temporário
      const mockData = [
        {
          id: 1,
          type: 'medical',
          title: 'Consulta Cardiologista',
          doctorName: 'Dr. João Silva',
          date: '2025-11-23T14:30:00',
          status: 'completed',
          hasAudios: true,
          hasDocuments: true,
          hasExams: false,
          summary: 'Avaliação cardiovascular de rotina',
          isUrgency: false,
        },
        {
          id: 2,
          type: 'urgency',
          title: 'Consulta de Urgência - Hospital Santa Casa',
          doctorName: 'Dra. Maria Santos',
          date: '2025-11-22T03:15:00',
          status: 'completed',
          hasAudios: false,
          hasDocuments: true,
          hasExams: true,
          summary: 'Atendimento emergencial - dor no peito',
          isUrgency: true,
        },
        {
          id: 3,
          type: 'fisioterapia',
          title: 'Sessão de Fisioterapia',
          doctorName: 'Fisioterapeuta Carlos',
          date: '2025-11-20T10:00:00',
          status: 'completed',
          hasAudios: false,
          hasDocuments: false,
          hasExams: false,
          summary: 'Exercícios para fortalecimento muscular',
          isUrgency: false,
        },
      ];

      setConsultations(mockData);
    } catch (error) {
      console.error('Erro ao carregar consultas:', error);
      setConsultations([]);
    } finally {
      setLoading(false);
    }
  };

  const filterOptions = [
    { value: 'all', label: 'Todas', icon: 'list' },
    { value: 'medical', label: 'Médicas', icon: 'medical' },
    { value: 'fisioterapia', label: 'Fisioterapia', icon: 'fitness' },
    { value: 'exames', label: 'Exames', icon: 'flask' },
    { value: 'urgency', label: 'Urgências', icon: 'alert-circle' },
  ];

  const getTypeInfo = (type, isUrgency) => {
    if (isUrgency) {
      return { icon: 'alert-circle', color: colors.error, label: 'Urgência' };
    }
    
    const typeMap = {
      medical: { icon: 'medical', color: colors.secondary, label: 'Médica' },
      fisioterapia: { icon: 'fitness', color: colors.success, label: 'Fisioterapia' },
      exames: { icon: 'flask', color: colors.info, label: 'Exames' },
      common: { icon: 'calendar', color: colors.primary, label: 'Comum' },
    };
    
    return typeMap[type] || typeMap.common;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return {
      day: date.getDate().toString().padStart(2, '0'),
      month: date.toLocaleString('pt-BR', { month: 'short' }),
      year: date.getFullYear(),
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      weekday: date.toLocaleString('pt-BR', { weekday: 'short' }),
    };
  };

  const renderConsultationCard = ({ item }) => {
    const typeInfo = getTypeInfo(item.type, item.isUrgency);
    const dateInfo = formatDate(item.date);

    return (
      <TouchableOpacity
        style={styles.consultationCard}
        onPress={() => navigation.navigate('ConsultationDetails', {
          consultationId: item.id,
          groupId,
          groupName,
        })}
        activeOpacity={0.7}
      >
        {/* Data */}
        <View style={styles.dateContainer}>
          <Text style={styles.dateDay}>{dateInfo.day}</Text>
          <Text style={styles.dateMonth}>{dateInfo.month}</Text>
          <Text style={styles.dateYear}>{dateInfo.year}</Text>
        </View>

        {/* Informações */}
        <View style={styles.consultationInfo}>
          {/* Cabeçalho */}
          <View style={styles.consultationHeader}>
            <View style={styles.titleContainer}>
              <Ionicons name={typeInfo.icon} size={18} color={typeInfo.color} />
              <Text style={styles.consultationTitle} numberOfLines={1}>
                {item.title}
              </Text>
            </View>
            <View style={[styles.typeBadge, { backgroundColor: typeInfo.color + '20' }]}>
              <Text style={[styles.typeBadgeText, { color: typeInfo.color }]}>
                {typeInfo.label}
              </Text>
            </View>
          </View>

          {/* Médico */}
          {item.doctorName && (
            <View style={styles.infoRow}>
              <Ionicons name="person" size={14} color={colors.textLight} />
              <Text style={styles.infoText}>{item.doctorName}</Text>
            </View>
          )}

          {/* Horário */}
          <View style={styles.infoRow}>
            <Ionicons name="time" size={14} color={colors.textLight} />
            <Text style={styles.infoText}>{dateInfo.time} - {dateInfo.weekday}</Text>
          </View>

          {/* Resumo */}
          {item.summary && (
            <Text style={styles.summaryText} numberOfLines={2}>
              {item.summary}
            </Text>
          )}

          {/* Anexos */}
          <View style={styles.attachmentsRow}>
            {item.hasAudios && (
              <View style={styles.attachmentBadge}>
                <Ionicons name="mic" size={14} color={colors.secondary} />
                <Text style={styles.attachmentText}>Áudio</Text>
              </View>
            )}
            {item.hasDocuments && (
              <View style={styles.attachmentBadge}>
                <Ionicons name="document-text" size={14} color={colors.primary} />
                <Text style={styles.attachmentText}>Laudos</Text>
              </View>
            )}
            {item.hasExams && (
              <View style={styles.attachmentBadge}>
                <Ionicons name="flask" size={14} color={colors.info} />
                <Text style={styles.attachmentText}>Exames</Text>
              </View>
            )}
          </View>
        </View>

        {/* Ícone */}
        <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
      </TouchableOpacity>
    );
  };

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
        <View style={styles.headerCenter}>
          <LacosIcon size={36} />
          <View>
            <Text style={styles.headerTitle}>Consultas</Text>
            <Text style={styles.headerSubtitle}>{groupName}</Text>
          </View>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Filtros */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {filterOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.filterChip,
              filterType === option.value && styles.filterChipActive,
            ]}
            onPress={() => setFilterType(option.value)}
          >
            <Ionicons
              name={option.icon}
              size={16}
              color={filterType === option.value ? colors.textWhite : colors.text}
            />
            <Text
              style={[
                styles.filterChipText,
                filterType === option.value && styles.filterChipTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Lista de Consultas */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando consultas...</Text>
        </View>
      ) : consultations.length > 0 ? (
        <FlatList
          data={consultations}
          renderItem={renderConsultationCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={64} color={colors.gray300} />
          <Text style={styles.emptyTitle}>Nenhuma consulta registrada</Text>
          <Text style={styles.emptyText}>
            Adicione consultas realizadas ou registre consultas de urgência
          </Text>
        </View>
      )}

      {/* Botão Flutuante */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddConsultation', {
          groupId,
          groupName,
        })}
      >
        <Ionicons name="add" size={28} color={colors.textWhite} />
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
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textLight,
  },
  placeholder: {
    width: 40,
  },
  filtersContainer: {
    maxHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filtersContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  filterChipTextActive: {
    color: colors.textWhite,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textLight,
  },
  listContainer: {
    padding: 20,
    gap: 12,
  },
  consultationCard: {
    flexDirection: 'row',
    backgroundColor: colors.textWhite,
    borderRadius: 16,
    padding: 16,
    gap: 16,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.primary + '10',
    borderRadius: 12,
    minWidth: 70,
  },
  dateDay: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  dateMonth: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  dateYear: {
    fontSize: 10,
    color: colors.textLight,
  },
  consultationInfo: {
    flex: 1,
    gap: 8,
  },
  consultationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  consultationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    color: colors.textLight,
  },
  summaryText: {
    fontSize: 13,
    color: colors.textLight,
    fontStyle: 'italic',
    marginTop: 4,
  },
  attachmentsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  attachmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
  },
  attachmentText: {
    fontSize: 11,
    color: colors.text,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 8,
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
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default ConsultationsScreen;


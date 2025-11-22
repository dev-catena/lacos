import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import { 
  AppointmentIcon,
  CalendarIcon,
  MedicalIcon,
  TimeIcon,
  PersonIcon,
  MapPinIcon,
  NavigateIcon,
  EditIcon,
  AddIcon,
  ArrowBackIcon,
} from '../../components/CustomIcons';

const AgendaScreen = ({ route, navigation }) => {
  const { groupId, groupName } = route.params || {};

  // Mock de compromissos
  const [appointments] = useState([
    {
      id: 1,
      title: 'Consulta com Dr. João Silva',
      type: 'medical',
      date: '2025-11-25',
      time: '14:30',
      location: 'Clínica São Lucas',
      doctor: 'Dr. João Silva - Cardiologista',
    },
    {
      id: 2,
      title: 'Fisioterapia',
      type: 'common',
      date: '2025-11-26',
      time: '10:00',
      location: 'Centro de Reabilitação',
    },
    {
      id: 3,
      title: 'Exames de Rotina',
      type: 'medical',
      date: '2025-11-28',
      time: '08:00',
      location: 'Laboratório Vida',
    },
  ]);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.toLocaleString('pt-BR', { month: 'short' });
    const weekDay = date.toLocaleString('pt-BR', { weekday: 'short' });
    return { day, month, weekDay };
  };

  const renderAppointmentCard = ({ item }) => {
    const { day, month, weekDay } = formatDate(item.date);
    const isMedical = item.type === 'medical';

    return (
      <TouchableOpacity style={styles.appointmentCard}>
        {/* Data */}
        <View style={styles.dateContainer}>
          <Text style={styles.dateDay}>{day}</Text>
          <Text style={styles.dateMonth}>{month}</Text>
          <Text style={styles.dateWeekday}>{weekDay}</Text>
        </View>

        {/* Informações */}
        <View style={styles.appointmentInfo}>
          <View style={styles.appointmentHeader}>
            <View style={styles.titleContainer}>
              {isMedical ? (
                <MedicalIcon size={18} color={colors.secondary} />
              ) : (
                <CalendarIcon size={18} color={colors.primary} />
              )}
              <Text style={styles.appointmentTitle}>{item.title}</Text>
            </View>
            {isMedical && (
              <View style={styles.medicalBadge}>
                <Text style={styles.medicalBadgeText}>Médico</Text>
              </View>
            )}
          </View>

          {item.doctor && (
            <View style={styles.infoRow}>
              <PersonIcon size={14} color={colors.textLight} />
              <Text style={styles.infoText}>{item.doctor}</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <TimeIcon size={14} color={colors.textLight} />
            <Text style={styles.infoText}>{item.time}</Text>
          </View>

          {item.location && (
            <View style={styles.infoRow}>
              <MapPinIcon size={14} color={colors.textLight} />
              <Text style={styles.infoText}>{item.location}</Text>
            </View>
          )}
        </View>

        {/* Ações */}
        <View style={styles.appointmentActions}>
          <TouchableOpacity style={styles.actionIconButton}>
            <NavigateIcon size={20} color={colors.info} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIconButton}>
            <EditIcon size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
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
          <ArrowBackIcon size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Agenda</Text>
          <Text style={styles.headerSubtitle}>{groupName || 'Grupo'}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Filtros */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity style={[styles.filterChip, styles.filterChipActive]}>
          <Text style={[styles.filterChipText, styles.filterChipTextActive]}>
            Próximos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterChip}>
          <Text style={styles.filterChipText}>Passados</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterChip}>
          <Text style={styles.filterChipText}>Médicos</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Compromissos */}
      {appointments.length > 0 ? (
        <FlatList
          data={appointments}
          renderItem={renderAppointmentCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <AppointmentIcon size={64} color={colors.gray300} />
          <Text style={styles.emptyTitle}>Nenhum compromisso</Text>
          <Text style={styles.emptyText}>
            Toque no botão + para agendar um compromisso ou consulta
          </Text>
        </View>
      )}

      {/* Botão Flutuante */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddAppointment', {
          groupId,
          groupName,
        })}
      >
        <AddIcon size={28} color={colors.textWhite} />
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
    fontSize: 13,
    color: colors.textLight,
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  filterChip: {
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
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  appointmentCard: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dateContainer: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingRight: 16,
    marginRight: 16,
  },
  dateDay: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    lineHeight: 32,
  },
  dateMonth: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  dateWeekday: {
    fontSize: 12,
    color: colors.textLight,
    textTransform: 'capitalize',
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  appointmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  medicalBadge: {
    backgroundColor: colors.secondary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  medicalBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.secondary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: colors.textLight,
  },
  appointmentActions: {
    flexDirection: 'column',
    gap: 8,
    marginLeft: 12,
  },
  actionIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
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
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
});

export default AgendaScreen;


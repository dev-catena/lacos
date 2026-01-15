import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
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
import appointmentService from '../../services/appointmentService';
import { useAuth } from '../../contexts/AuthContext';

const AgendaScreen = ({ route, navigation }) => {
  let { groupId, groupName } = route.params || {};
  const { user } = useAuth();
  
  // TEMPORÁRIO: Se groupId é um timestamp, usar o grupo de teste
  if (groupId && groupId > 999999999999) {
    groupId = 1;
  }

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('upcoming'); // 'upcoming', 'past', 'medical'

  // Expandir compromissos recorrentes em múltiplos registros
  const expandRecurringAppointments = (appointmentsList) => {
    const expanded = [];
    
    appointmentsList.forEach(appointment => {
      const recurrenceType = appointment.recurrence_type || appointment.recurrenceType;
      const recurrenceEnd = appointment.recurrence_end || appointment.recurrenceEnd;
      const recurrenceDays = appointment.recurrence_days || appointment.recurrenceDays || [];
      
      // Se não tem recorrência, adicionar como está
      if (!recurrenceType || recurrenceType === 'none' || !recurrenceEnd) {
        // Log para debug - verificar se doctorUser está presente antes de adicionar
        if (appointment.is_teleconsultation || appointment.type === 'medical') {
          console.log('📋 AgendaScreen - expandRecurringAppointments - Appointment sem recorrência:', {
            id: appointment.id,
            title: appointment.title,
            doctor_id: appointment.doctor_id,
            has_doctorUser: !!appointment.doctorUser,
            doctorUser_name: appointment.doctorUser?.name,
            has_doctor: !!appointment.doctor,
            doctor_name: appointment.doctor?.name,
          });
        }
        expanded.push(appointment);
        return;
      }
      
      const startDate = new Date(appointment.appointment_date || appointment.scheduled_at);
      const endDate = new Date(recurrenceEnd);
      const time = startDate.toTimeString().slice(0, 5); // HH:MM
      
      let currentDate = new Date(startDate);
      
      // Expandir baseado no tipo de recorrência
      while (currentDate <= endDate) {
        let shouldInclude = false;
        
        if (recurrenceType === 'daily') {
          // Diariamente: incluir todos os dias
          shouldInclude = true;
        } else if (recurrenceType === 'weekdays') {
          // Segunda a Sexta: 1-5
          const dayOfWeek = currentDate.getDay();
          shouldInclude = dayOfWeek >= 1 && dayOfWeek <= 5;
        } else if (recurrenceType === 'custom') {
          // Personalizado: verificar se o dia está na lista
          const dayOfWeek = currentDate.getDay();
          const daysArray = Array.isArray(recurrenceDays) 
            ? recurrenceDays 
            : (typeof recurrenceDays === 'string' ? JSON.parse(recurrenceDays) : []);
          shouldInclude = daysArray.includes(dayOfWeek);
        }
        
        if (shouldInclude) {
          // Verificar se esta data está nas exceções
          const dateStr = currentDate.toISOString().split('T')[0];
          const exceptions = appointment.exceptions || [];
          const isException = exceptions.some(exception => {
            const exceptionDate = exception.exception_date || exception.exceptionDate;
            return exceptionDate && exceptionDate.split('T')[0] === dateStr;
          });
          
          // Se não for uma exceção, incluir
          if (!isException) {
            // Criar uma cópia do compromisso para esta data
            // IMPORTANTE: Preservar todos os relacionamentos, incluindo doctorUser
            const expandedAppointment = {
              ...appointment,
              id: `${appointment.id}_${dateStr}`,
              appointment_date: new Date(currentDate.toISOString().split('T')[0] + 'T' + time).toISOString(),
              scheduled_at: new Date(currentDate.toISOString().split('T')[0] + 'T' + time).toISOString(),
              isRecurringInstance: true,
              originalAppointmentId: appointment.id,
              instanceDate: dateStr, // Guardar a data da instância para exclusão
              // Preservar relacionamentos do médico
              doctorUser: appointment.doctorUser,
              doctor: appointment.doctor,
              doctor_id: appointment.doctor_id,
              doctor_name: appointment.doctor_name,
            };
            expanded.push(expandedAppointment);
          }
        }
        
        // Avançar para o próximo dia
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });
    
    return expanded;
  };

  // Carregar compromissos da API
  const loadAppointments = async () => {
    try {
      setLoading(true);
      const result = await appointmentService.getAppointments(groupId);
      
      if (result.success) {
        const rawAppointments = result.data || [];
        
        // Log para debug - verificar se doctorUser está presente
        rawAppointments.forEach(apt => {
          if (apt.is_teleconsultation || apt.type === 'medical') {
            console.log('📋 AgendaScreen - Appointment com médico:', {
              id: apt.id,
              title: apt.title,
              doctor_id: apt.doctor_id,
              has_doctorUser: !!apt.doctorUser,
              doctorUser_name: apt.doctorUser?.name,
              has_doctor: !!apt.doctor,
              doctor_name: apt.doctor?.name,
              doctor_name_field: apt.doctor_name,
            });
          }
        });
        
        // Expandir compromissos recorrentes
        const expandedAppointments = expandRecurringAppointments(rawAppointments);
        setAppointments(expandedAppointments);
      } else {
        console.error('Erro ao carregar compromissos:', result.error);
      }
    } catch (error) {
      console.error('Erro ao carregar compromissos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Recarregar quando a tela ganhar foco
  useFocusEffect(
    React.useCallback(() => {
      loadAppointments();
    }, [groupId])
  );

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.toLocaleString('pt-BR', { month: 'short' });
    const weekDay = date.toLocaleString('pt-BR', { weekday: 'short' });
    return { day, month, weekDay };
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  // Filtrar appointments baseado no filtro ativo
  const getFilteredAppointments = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Zerar horas para comparar apenas datas

    return appointments.filter(item => {
      const dateStr = item.appointment_date || item.scheduled_at || item.date;
      if (!dateStr) return false;

      const appointmentDate = new Date(dateStr);
      appointmentDate.setHours(0, 0, 0, 0); // Zerar horas para comparar apenas datas

      if (activeFilter === 'upcoming') {
        // Próximos: data >= hoje
        return appointmentDate >= now;
      } else if (activeFilter === 'past') {
        // Passados: data < hoje
        return appointmentDate < now;
      }
      return true;
    });
  };

  const renderAppointmentCard = ({ item }) => {
    // Backend retorna appointment_date, mas adicionamos scheduled_at para compatibilidade
    const dateStr = item.appointment_date || item.scheduled_at || item.date;
    const { day, month, weekDay } = formatDate(dateStr);
    const time = formatTime(dateStr);
    const isMedical = item.type === 'medical';
    
    // Log detalhado para teleconsultas
    if (item.is_teleconsultation) {
      console.log('📋 AgendaScreen - renderAppointmentCard - Teleconsulta:', {
        id: item.id,
        title: item.title,
        doctor_id: item.doctor_id,
        has_doctorUser: !!item.doctorUser,
        doctorUser: item.doctorUser,
        doctorUser_name: item.doctorUser?.name,
        has_doctor: !!item.doctor,
        doctor: item.doctor,
        doctor_name: item.doctor_name,
        all_keys: Object.keys(item),
      });
    }

    return (
      <TouchableOpacity 
        style={styles.appointmentCard}
        onPress={() => {
          navigation.navigate('AppointmentDetails', {
            appointmentId: item.id,
            appointment: item,
            groupId,
          });
        }}
      >
        {/* Data */}
        <View style={styles.dateContainer}>
          <Text style={styles.dateDay}>{day}</Text>
          <Text style={styles.dateMonth}>{month}</Text>
          <Text style={styles.dateWeekday}>{weekDay}</Text>
        </View>

        {/* Informações */}
        <View style={styles.appointmentInfo}>
          {/* Título em linha própria */}
          <View style={styles.titleContainer}>
            {isMedical ? (
              <MedicalIcon size={14} color={colors.secondary} />
            ) : (
              <CalendarIcon size={14} color={colors.primary} />
            )}
            <Text style={styles.appointmentTitle} numberOfLines={2}>{item.title}</Text>
          </View>

          {/* Badges */}
          <View style={styles.badgesContainer}>
            {item.is_teleconsultation && (
              <View style={styles.teleconsultationBadge}>
                <Ionicons 
                  name="videocam" 
                  size={12} 
                  color={colors.primary} 
                />
                <Text style={styles.teleconsultationBadgeText}>Teleconsulta</Text>
              </View>
            )}
            {isMedical && (
              <View style={styles.medicalBadge}>
                <Text style={styles.medicalBadgeText}>Médico</Text>
              </View>
            )}
          </View>

          {/* Banner de Pagamento para Teleconsultas - Só para cuidadores/amigos */}
          {(() => {
            const isTeleconsultation = item.is_teleconsultation;
            const hasUser = !!user;
            const isCaregiver = user && (
              user.profile === 'caregiver' || 
              user.profile === 'professional_caregiver' || 
              user.role === 'caregiver' ||
              user.profile === 'accompanied' // Fallback: acompanhado também pode pagar
            );
            const paymentPending = !item.payment_status || item.payment_status === 'pending' || item.payment_status === null;
            
            const shouldShowBanner = isTeleconsultation && hasUser && isCaregiver && paymentPending;
            
            // Debug log
            if (isTeleconsultation) {
              console.log('💳 AgendaScreen - Verificando banner de pagamento:', {
                appointmentId: item.id,
                isTeleconsultation,
                hasUser,
                userProfile: user?.profile,
                userRole: user?.role,
                isCaregiver,
                payment_status: item.payment_status,
                paymentPending,
                shouldShowBanner,
              });
            }
            
            return shouldShowBanner ? (
              <TouchableOpacity
                style={styles.paymentBanner}
              onPress={(e) => {
                e.stopPropagation();
                console.log('💳 AgendaScreen - Navegando para PaymentScreen:', {
                  appointmentId: item.id,
                  groupId,
                });
                // Verificar se já foi pago - se sim, mostrar status
                if (item.payment_status === 'paid_held' || item.payment_status === 'released') {
                  navigation.navigate('PaymentStatus', {
                    appointmentId: item.id,
                    appointment: item,
                  });
                } else {
                  navigation.navigate('PaymentScreen', {
                    appointmentId: item.id,
                    appointment: item,
                    groupId,
                  });
                }
              }}
              >
                <Ionicons name="card-outline" size={16} color={colors.warning} />
                <Text style={styles.paymentBannerText}>
                  {item.doctorUser?.consultation_price || item.doctor?.consultation_price 
                    ? `Aguarda pagamento (R$ ${(parseFloat(item.doctorUser?.consultation_price || item.doctor?.consultation_price || 0) * 1.2).toFixed(2).replace('.', ',')}). Clique para pagar`
                    : 'Aguarda pagamento. Clique aqui para pagar'}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.warning} />
              </TouchableOpacity>
            ) : null;
          })()}

          {/* Exibir médico para consultas médicas ou teleconsultas */}
          {(isMedical || item.is_teleconsultation) && (
            <View style={styles.infoRow}>
              <PersonIcon size={12} color={colors.textLight} />
              <Text style={styles.infoText}>
                {(() => {
                  // Tentar obter o nome do médico de diferentes formas
                  const doctorName = 
                    item.doctorUser?.name || 
                    item.doctor?.name || 
                    item.doctor_name || 
                    (typeof item.doctor === 'string' ? item.doctor : null);
                  
                  if (doctorName) {
                    return `Dr(a). ${doctorName}`;
                  }
                  
                  // Se tem doctor_id mas não tem nome, logar para debug
                  if (item.doctor_id || item.is_teleconsultation) {
                    console.log('⚠️ AgendaScreen - Card: Appointment tem doctor_id mas sem nome:', {
                      appointmentId: item.id,
                      title: item.title,
                      doctor_id: item.doctor_id,
                      has_doctorUser: !!item.doctorUser,
                      doctorUser_type: typeof item.doctorUser,
                      doctorUser_name: item.doctorUser?.name,
                      has_doctor: !!item.doctor,
                      doctor_type: typeof item.doctor,
                      doctor_name: item.doctor?.name,
                      doctor_name_field: item.doctor_name,
                      is_teleconsultation: item.is_teleconsultation,
                      isRecurringInstance: item.isRecurringInstance,
                      full_item_keys: Object.keys(item),
                    });
                  }
                  
                  return 'Dr(a). Médico não informado';
                })()}
              </Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <TimeIcon size={12} color={colors.textLight} />
            <Text style={styles.infoText}>{time}</Text>
          </View>

          {item.location && (
            <View style={styles.infoRow}>
              <MapPinIcon size={12} color={colors.textLight} />
              <Text style={styles.infoText}>{item.location}</Text>
            </View>
          )}
        </View>

        {/* Ações */}
        <View style={styles.appointmentActions}>
          <TouchableOpacity 
            style={styles.actionIconButton}
            onPress={(e) => {
              e.stopPropagation();
              // TODO: Implementar navegação para localização
              console.log('Navegar para localização:', item.location);
            }}
          >
            <NavigateIcon size={16} color={colors.info} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionIconButton}
            onPress={(e) => {
              e.stopPropagation();
              // Navegar para tela de edição
              navigation.navigate('AddAppointment', {
                groupId,
                groupName,
                appointmentId: item.isRecurringInstance ? item.originalAppointmentId : item.id,
                appointment: item,
              });
            }}
          >
            <EditIcon size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

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
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Agenda</Text>
          <Text style={styles.headerSubtitle}>{groupName || 'Grupo'}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Filtros */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity 
          style={[styles.filterChip, activeFilter === 'upcoming' && styles.filterChipActive]}
          onPress={() => setActiveFilter('upcoming')}
        >
          <Text style={[styles.filterChipText, activeFilter === 'upcoming' && styles.filterChipTextActive]}>
            Próximos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterChip, activeFilter === 'past' && styles.filterChipActive]}
          onPress={() => setActiveFilter('past')}
        >
          <Text style={[styles.filterChipText, activeFilter === 'past' && styles.filterChipTextActive]}>
            Passados
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Compromissos */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando compromissos...</Text>
        </View>
      ) : (() => {
        const filteredAppointments = getFilteredAppointments();
        return filteredAppointments.length > 0 ? (
          <FlatList
            data={filteredAppointments}
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
              {activeFilter === 'upcoming' && 'Nenhum compromisso futuro encontrado'}
              {activeFilter === 'past' && 'Nenhum compromisso passado encontrado'}
              {!activeFilter && 'Toque no botão + para agendar um compromisso ou consulta'}
            </Text>
          </View>
        );
      })()}

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
    padding: 16,
    paddingBottom: 100,
  },
  appointmentCard: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dateContainer: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingRight: 12,
    marginRight: 12,
  },
  dateDay: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    lineHeight: 24,
  },
  dateMonth: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  dateWeekday: {
    fontSize: 10,
    color: colors.textLight,
    textTransform: 'capitalize',
  },
  appointmentInfo: {
    flex: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 6,
  },
  appointmentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    flexWrap: 'wrap',
  },
  badgesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  teleconsultationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  teleconsultationBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textWhite,
    textTransform: 'uppercase',
  },
  medicalBadge: {
    backgroundColor: colors.secondary + '20',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  medicalBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.secondary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
  },
  infoText: {
    fontSize: 12,
    color: colors.textLight,
  },
  appointmentActions: {
    flexDirection: 'column',
    gap: 6,
    marginLeft: 8,
    justifyContent: 'center',
  },
  actionIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 12,
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
  paymentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.warning + '15',
    borderWidth: 1,
    borderColor: colors.warning + '40',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    gap: 8,
  },
  paymentBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.warning,
    textAlign: 'center',
  },
});

export default AgendaScreen;


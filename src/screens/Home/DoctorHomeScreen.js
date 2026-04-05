import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import colors from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { LacosLogoFull } from '../../components/LacosLogo';
import {
  ProfileIcon,
  CalendarIcon,
  AppointmentIcon,
  CheckmarkCircleIcon,
  CloseCircleIcon,
  ChevronBackIcon,
  ChevronForwardIcon,
  SaveOutlineIcon,
  TrashOutlineIcon,
  VideoCamIcon,
  MedicalIcon,
  TimeOutlineIcon,
  LocationOutlineIcon,
} from '../../components/CustomIcons';
import appointmentService from '../../services/appointmentService';
import { appointmentMatchesLoggedInDoctor } from '../../utils/appointmentDoctorMatch';
import {
  isTeleconsultAwaitingHonorariumConfirmation,
  teleconsultationSlotStillOccupied,
  getDoctorAgendaSlotBookingLabel,
  isTeleconsultAppointment,
  isTeleconsultPaidForVideoStart,
} from '../../utils/teleconsultationHonorarium';
import doctorService from '../../services/doctorService';
import groupService from '../../services/groupService';
import moment from 'moment';
import 'moment/locale/pt-br';

moment.locale('pt-br');

function isAppointmentCancelled(apt) {
  const st = apt?.status;
  return st === 'cancelled' || st === 'cancelada';
}

function getAppointmentTimeMs(apt) {
  const dateStr = apt?.appointment_date || apt?.scheduled_at;
  if (!dateStr) return null;
  const t = new Date(dateStr).getTime();
  return Number.isNaN(t) ? null : t;
}

/** Consulta que o médico pode marcar como “Realizada” (concluída ou teleconsulta com pagamento liberado). */
function isAppointmentCompletedForDoctor(apt, nowMs = Date.now()) {
  if (!apt || isAppointmentCancelled(apt)) return false;
  if (apt.status === 'completed') return true;
  const ps = apt.payment_status || apt.paymentStatus;
  if (isTeleconsultAppointment(apt) && ps === 'released') return true;
  return false;
}

/** Passou o horário, não cancelada e ainda não contada como realizada para o médico. */
function isAppointmentIncompletePast(apt, nowMs = Date.now()) {
  if (!apt || isAppointmentCancelled(apt)) return false;
  const t = getAppointmentTimeMs(apt);
  if (t == null || t >= nowMs) return false;
  if (isAppointmentCompletedForDoctor(apt, nowMs)) return false;
  return true;
}

const DoctorHomeScreen = ({ navigation, route }) => {
  const { user, signed } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('appointments'); // 'appointments' ou 'agenda'
  const [showCompleted, setShowCompleted] = useState(false);
  const [showPastIncomplete, setShowPastIncomplete] = useState(false);
  const [groupNamesCache, setGroupNamesCache] = useState({}); // Cache de nomes de grupos
  const [patientNamesCache, setPatientNamesCache] = useState({}); // Cache de nomes de pacientes por group_id
  
  // Estados para a agenda
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availableDays, setAvailableDays] = useState(new Set()); // Dias disponíveis
  const [blockedDays, setBlockedDays] = useState(new Set()); // Dias bloqueados
  const [daySchedules, setDaySchedules] = useState({}); // { '2024-12-15': ['08:00', '09:00', '14:00'] }
  const [savingAvailability, setSavingAvailability] = useState(false);
  /** Só o primeiro carregamento de consultas usa tela cheia de loading; evita piscar ao voltar da edição de horários */
  const isInitialAppointmentsLoadRef = useRef(true);
  const routeRef = useRef(route);
  routeRef.current = route;

  useFocusEffect(
    React.useCallback(() => {
      if (!signed || !user) return;

      const draft = routeRef.current.params?.dayScheduleDraft;
      if (draft && Array.isArray(draft.availableDays)) {
        setAvailableDays(new Set(draft.availableDays));
        setBlockedDays(new Set(draft.blockedDays || []));
        setDaySchedules(draft.daySchedules || {});
        navigation.setParams({ dayScheduleDraft: undefined });
      }

      loadAppointments();
      // Só busca agenda no servidor quando não acabamos de aplicar rascunho (ref le params atuais sem reexecutar o foco ao limpar params)
      const hadDraft = draft && Array.isArray(draft.availableDays);
      if (activeTab === 'agenda' && !hadDraft) {
        loadAvailability();
      }
    }, [signed, user, activeTab, navigation])
  );

  // Recarregar consultas quando mudar para a aba de agenda
  useEffect(() => {
    if (activeTab === 'agenda' && signed && user) {
      loadAppointments();
    }
  }, [activeTab]);

  const loadAppointments = async () => {
    try {
      if (isInitialAppointmentsLoadRef.current) {
        setLoading(true);
      }
      console.log('📅 DoctorHomeScreen - Carregando consultas agendadas...');
      
      if (!user || !user.id) {
        console.warn('⚠️ DoctorHomeScreen - Usuário não disponível');
        setAppointments([]);
        return;
      }

      // Calcular range de datas (últimos 30 dias até próximos 90 dias)
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 30);
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 90);

      // Buscar todas as consultas
      const result = await appointmentService.getAppointments(
        null, // groupId = null para buscar todas
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      if (result.success && result.data) {
        const raw = result.data;
        const rows = Array.isArray(raw)
          ? raw
          : raw && Array.isArray(raw.data)
            ? raw.data
            : raw && Array.isArray(raw.appointments)
              ? raw.appointments
              : [];

        // Filtrar apenas consultas deste médico
        // Converter IDs para números para comparação correta
        const currentDoctorId = Number(user.id);
        
        const doctorAppointments = rows.filter((appointment) => {
          const isDoctorAppointment = appointmentMatchesLoggedInDoctor(
            appointment,
            currentDoctorId
          );

          return isDoctorAppointment;
        });

        console.log(`✅ DoctorHomeScreen - ${doctorAppointments.length} consulta(s) do médico carregada(s)`, {
          totalAppointments: rows.length,
          doctorAppointments: doctorAppointments.length,
          doctorId: user.id,
        });

        const cacheKey = (gid) => (gid != null && gid !== '' ? String(gid) : null);

        const patientPatchFromApi = {};
        doctorAppointments.forEach((apt) => {
          console.log('📋 Consulta do médico:', {
            id: apt.id,
            title: apt.title,
            appointment_date: apt.appointment_date,
            scheduled_at: apt.scheduled_at,
            doctor_id: apt.doctor_id,
            dateKey: apt.appointment_date ? formatDateKey(new Date(apt.appointment_date)) : null,
            time: apt.appointment_date ? moment(apt.appointment_date).format('HH:mm') : null,
            patient_name: apt.patient_name,
            group: apt.group,
            group_name: apt.group_name,
            group_id: apt.group_id,
            is_teleconsultation: apt.is_teleconsultation,
          });
          const k = cacheKey(apt.group_id);
          if (k && apt.patient_name) {
            patientPatchFromApi[k] = apt.patient_name;
          } else if (k && !apt.patient_name) {
            console.warn('⚠️ Consulta sem patient_name da API:', {
              appointment_id: apt.id,
              group_id: apt.group_id,
              scheduled_at: apt.scheduled_at,
            });
          }
        });

        const uniqueGroupIds = [
          ...new Set(doctorAppointments.map((apt) => apt.group_id).filter((id) => id != null && id !== '')),
        ];

        const groupIdsToFetch = uniqueGroupIds.filter((id) => {
          const k = cacheKey(id);
          if (!k) return false;
          const hasPatient =
            patientPatchFromApi[k] || patientNamesCache[k] || patientNamesCache[id];
          const hasGroup = groupNamesCache[k] || groupNamesCache[id];
          return !hasPatient || !hasGroup;
        });

        let patientPatchFromFetch = {};
        let groupPatchFromFetch = {};

        if (groupIdsToFetch.length > 0) {
          console.log('🔍 Buscando nomes de grupos e pacientes:', groupIdsToFetch);
          const groupPromises = groupIdsToFetch.map(async (groupId) => {
            try {
              const groupResult = await groupService.getGroup(groupId);
              let groupName = null;
              let patientName = null;
              if (groupResult.success && groupResult.data) {
                groupName = groupResult.data.name || groupResult.data.groupName || null;
                if (groupResult.data.accompanied_name) {
                  patientName = groupResult.data.accompanied_name;
                }
              }
              if (!patientName) {
                try {
                  const membersResult = await groupService.getGroupMembers(groupId);
                  if (membersResult.success && membersResult.data) {
                    const patientMember = membersResult.data.find(
                      (m) =>
                        ['patient', 'priority_contact', 'accompanied'].includes(m.role) &&
                        (m.user?.name || m.name)
                    );
                    if (patientMember) {
                      patientName = patientMember.user?.name || patientMember.name;
                    }
                  }
                } catch (error) {
                  console.error(`Erro ao buscar paciente do grupo ${groupId}:`, error);
                }
              }
              return { groupId, groupName, patientName };
            } catch (error) {
              console.error(`Erro ao buscar grupo ${groupId}:`, error);
              return { groupId, groupName: null, patientName: null };
            }
          });

          const groupData = await Promise.all(groupPromises);
          groupData.forEach(({ groupId, groupName, patientName }) => {
            const k = cacheKey(groupId);
            if (!k) return;
            if (groupName) groupPatchFromFetch[k] = groupName;
            if (patientName) patientPatchFromFetch[k] = patientName;
          });

          setGroupNamesCache((prev) => ({ ...prev, ...groupPatchFromFetch }));
          setPatientNamesCache((prev) => ({ ...prev, ...patientPatchFromApi, ...patientPatchFromFetch }));
        } else if (Object.keys(patientPatchFromApi).length > 0) {
          setPatientNamesCache((prev) => ({ ...prev, ...patientPatchFromApi }));
        }

        const resolvePatientForAppointment = (apt) => {
          const k = cacheKey(apt.group_id);
          const fromApt = apt.patient_name && String(apt.patient_name).trim();
          if (fromApt) return fromApt;
          if (!k) return null;
          return (
            patientPatchFromApi[k] ||
            patientPatchFromFetch[k] ||
            patientNamesCache[k] ||
            patientNamesCache[apt.group_id] ||
            null
          );
        };

        const withResolvedNames = doctorAppointments.map((apt) => {
          const resolved = resolvePatientForAppointment(apt);
          if (resolved && resolved !== apt.patient_name) {
            return { ...apt, patient_name: resolved };
          }
          return apt;
        });

        // Ordenar por data (mais próximas primeiro)
        withResolvedNames.sort((a, b) => {
          const dateA = new Date(a.appointment_date || a.scheduled_at);
          const dateB = new Date(b.appointment_date || b.scheduled_at);
          return dateA - dateB;
        });

        setAppointments(withResolvedNames);
      } else {
        console.warn('⚠️ DoctorHomeScreen - Nenhuma consulta encontrada ou erro na API:', result);
        setAppointments([]);
      }
      
    } catch (error) {
      console.error('❌ DoctorHomeScreen - Erro ao carregar consultas:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
      isInitialAppointmentsLoadRef.current = false;
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAppointments();
  };

  const formatDate = (dateString) => {
    const date = moment(dateString);
    const today = moment().startOf('day');
    const tomorrow = moment().add(1, 'days').startOf('day');
    
    if (date.isSame(today, 'day')) {
      return 'Hoje';
    } else if (date.isSame(tomorrow, 'day')) {
      return 'Amanhã';
    } else {
      return date.format('DD/MM/YYYY');
    }
  };

  const formatTime = (dateString) => {
    const date = moment(dateString);
    return date.format('HH:mm');
  };

  const handleAppointmentPress = (appointment) => {
    // Navegar para detalhes da consulta do médico
    navigation.navigate('DoctorAppointmentDetails', { 
      appointment: appointment
    });
  };

  // Funções para gerenciar a agenda
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const formatDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isDayAvailable = (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateKey = formatDateKey(date);
    return availableDays.has(dateKey);
  };

  const isDayBlocked = (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateKey = formatDateKey(date);
    return blockedDays.has(dateKey);
  };

  const getDayBookedTimes = (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateKey = formatDateKey(date);
    return getBookedTimesForDay(dateKey);
  };

  const toggleDayAvailability = (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateKey = formatDateKey(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Não permitir alterar dias passados
    if (date < today) {
      Alert.alert('Aviso', 'Não é possível alterar dias passados');
      return;
    }

    const newAvailableDays = new Set(availableDays);
    const newBlockedDays = new Set(blockedDays);

    if (isDayBlocked(day)) {
      // Se está bloqueado, desbloquear (voltar ao estado neutro)
      newBlockedDays.delete(dateKey);
      // Remover horários do dia se existirem
      const newSchedules = { ...daySchedules };
      delete newSchedules[dateKey];
      setDaySchedules(newSchedules);
    } else if (isDayAvailable(day)) {
      // Se está disponível, abrir modal para editar horários ou bloquear
      openScheduleModal(day, date, dateKey);
    } else {
      // Se não está nem disponível nem bloqueado, abrir modal para definir horários
      openScheduleModal(day, date, dateKey);
    }
  };

  const getBookedTimesForDay = (dateKey) => {
    // Buscar consultas agendadas para o dia
    const bookedTimesSet = new Set();
    
    if (!appointments || appointments.length === 0) {
      return bookedTimesSet;
    }

    if (!user || !user.id) {
      console.warn('⚠️ getBookedTimesForDay - Usuário não disponível');
      return bookedTimesSet;
    }

    // Formatar a data para comparação (YYYY-MM-DD)
    const targetDate = dateKey;

    appointments.forEach((appointment) => {
      if (!appointment.appointment_date && !appointment.scheduled_at) {
        return;
      }

      const st = appointment.status;
      if (st === 'cancelled' || st === 'cancelada') {
        return;
      }

      const appointmentDate = appointment.appointment_date || appointment.scheduled_at;
      const appointmentDateObj = new Date(appointmentDate);
      const appointmentDateKey = formatDateKey(appointmentDateObj);

      // Verificar se é o mesmo dia
      if (appointmentDateKey === targetDate) {
        // Verificar se a consulta é deste médico (comparar como números)
        const currentDoctorId = Number(user.id);
        const isDoctorAppointment = appointmentMatchesLoggedInDoctor(
          appointment,
          currentDoctorId
        );

        if (isDoctorAppointment) {
          if (
            isTeleconsultAppointment(appointment) &&
            !teleconsultationSlotStillOccupied(appointment, Date.now())
          ) {
            return;
          }
          const hours = String(appointmentDateObj.getHours()).padStart(2, '0');
          const minutes = String(appointmentDateObj.getMinutes()).padStart(2, '0');
          const time = `${hours}:${minutes}`;

          bookedTimesSet.add(time);
        }
      }
    });

    return bookedTimesSet;
  };

  const openScheduleModal = (day, date, dateKey) => {
    const dayAppointments = appointments.filter((apt) => {
      const apptDate = apt.appointment_date || apt.scheduled_at;
      if (!apptDate) return false;
      return formatDateKey(new Date(apptDate)) === dateKey;
    });
    navigation.navigate('DoctorDaySchedule', {
      dateKey,
      dateMs: date.getTime(),
      initialAvailableDays: Array.from(availableDays),
      initialBlockedDays: Array.from(blockedDays),
      initialDaySchedules: { ...daySchedules },
      dayAppointments,
    });
  };

  const clearAllDays = () => {
    Alert.alert(
      'Limpar Agenda',
      'Deseja indisponibilizar todos os dias da agenda?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: () => {
            setAvailableDays(new Set());
            setBlockedDays(new Set());
            setDaySchedules({});
          },
        },
      ]
    );
  };

  const saveAvailability = async () => {
    try {
      setSavingAvailability(true);
      
      // Validar se há dados para salvar
      if (availableDays.size === 0) {
        Alert.alert('Aviso', 'Nenhuma agenda configurada para salvar. Adicione pelo menos um dia com horários disponíveis.');
        setSavingAvailability(false);
        return;
      }
      
      // Validar se há horários configurados
      const hasSchedules = Object.keys(daySchedules).some(dateKey => {
        const times = daySchedules[dateKey];
        return Array.isArray(times) && times.length > 0;
      });
      
      if (!hasSchedules) {
        Alert.alert('Aviso', 'Nenhum horário configurado. Adicione horários aos dias disponíveis antes de salvar.');
        setSavingAvailability(false);
        return;
      }
      
      // Converter Set para Array e daySchedules para formato esperado
      const availableDaysArray = Array.from(availableDays);
      const daySchedulesObject = {};
      
      // Converter daySchedules para formato de objeto simples
      Object.keys(daySchedules).forEach(dateKey => {
        if (availableDays.has(dateKey)) {
          daySchedulesObject[dateKey] = daySchedules[dateKey];
        }
      });

      const availabilityData = {
        availableDays: availableDaysArray,
        daySchedules: daySchedulesObject,
      };

      console.log('💾 Salvando agenda:', {
        doctorId: user.id,
        doctorName: user.name,
        doctorEmail: user.email,
        doctorProfile: user.profile,
        availableDays: availableDaysArray,
        availableDays_count: availableDaysArray.length,
        daySchedules: daySchedulesObject,
        daySchedules_keys: Object.keys(daySchedulesObject),
        daySchedules_values: Object.values(daySchedulesObject).map(times => ({
          count: Array.isArray(times) ? times.length : 0,
          times: times
        })),
        fullData: availabilityData,
        daySchedules_raw: daySchedules,
        availableDays_raw: Array.from(availableDays),
      });
      
      console.log('📡 Enviando requisição POST para:', `/doctors/${user.id}/availability`);
      
      // Validar se user.id existe
      if (!user || !user.id) {
        throw new Error('ID do médico não encontrado. Faça logout e login novamente.');
      }
      
      let result;
      try {
        result = await doctorService.saveAvailability(user.id, availabilityData);
      } catch (apiError) {
        console.error('❌ Erro na chamada da API:', apiError);
        
        // Se o erro tem response.data, pode ser que o backend retornou erro mas com dados
        if (apiError.response?.data) {
          result = apiError.response.data;
          console.log('📥 Usando dados do erro como resposta:', result);
        } else {
          throw apiError;
        }
      }
      
      console.log('📥 Resposta completa do servidor:', JSON.stringify(result, null, 2));
      console.log('📥 Tipo da resposta:', typeof result);
      console.log('📥 result.success:', result?.success);
      console.log('📥 result.message:', result?.message);
      console.log('📥 Chaves do objeto result:', result ? Object.keys(result) : 'result é null/undefined');
      
      const isSuccess = result && result.success === true;
      
      if (isSuccess) {
        Alert.alert('Sucesso', result.message || 'Agenda atualizada com sucesso');
        // Recarregar agenda após salvar para confirmar
        setTimeout(async () => {
          await loadAvailability();
        }, 500);
      } else {
        const errorMessage = result?.message || result?.error || result?.data?.message || 'Erro ao salvar agenda';
        console.error('❌ Erro na resposta:', {
          result,
          success: result?.success,
          message: result?.message,
          error: result?.error,
          status: result?.status,
        });
        Alert.alert('Erro', errorMessage);
        throw new Error(errorMessage);
      }
      } catch (error) {
      console.error('❌ Erro ao salvar agenda:', error);
      console.error('❌ Detalhes completos do erro:', {
        message: error.message,
        status: error.status,
        response: error.response,
        data: error.response?.data,
        errors: error.errors,
        _rawErrorData: error._rawErrorData,
      });
      
      let errorMessage = 'Não foi possível salvar a agenda';
      
      // Verificar diferentes formatos de erro
      if (error.status === 404) {
        errorMessage = 'Médico não encontrado. Verifique se você está logado como médico.';
      } else if (error.status === 403) {
        errorMessage = 'Você não tem permissão para salvar esta agenda.';
      } else if (error.status === 422) {
        errorMessage = error.response?.data?.message || error.message || 'Dados inválidos. Verifique os horários informados.';
        if (error.response?.data?.errors) {
          const errors = error.response.data.errors;
          const errorList = Object.values(errors).flat().join('\n');
          errorMessage += '\n\n' + errorList;
        }
      } else if (error.status === 500) {
        errorMessage = 'Erro no servidor. Tente novamente mais tarde.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.error('❌ Mensagem de erro final:', errorMessage);
      Alert.alert('Erro ao Salvar Agenda', errorMessage);
    } finally {
      setSavingAvailability(false);
    }
  };

  const loadAvailability = async () => {
    try {
      if (!user || !user.id) {
        console.warn('⚠️ DoctorHomeScreen - Usuário não disponível para carregar agenda');
        return;
      }

      console.log('📅 DoctorHomeScreen - Carregando agenda do médico...');
      const result = await doctorService.getDoctorAvailability(user.id, { excludeBooked: false });
      
      if (result && result.success && result.data) {
        // Converter array de availableDays para Set
        const availableDaysSet = new Set(result.data.availableDays || []);
        setAvailableDays(availableDaysSet);
        
        // Converter daySchedules para objeto
        setDaySchedules(result.data.daySchedules || {});
        
        console.log('✅ DoctorHomeScreen - Agenda carregada:', {
          availableDays: Array.from(availableDaysSet),
          daySchedules: result.data.daySchedules,
        });
      } else {
        console.warn('⚠️ DoctorHomeScreen - Nenhuma agenda encontrada ou resposta inválida:', result);
        // Se não houver dados, inicializar vazio
        setAvailableDays(new Set());
        setDaySchedules({});
      }
    } catch (error) {
      console.error('❌ DoctorHomeScreen - Erro ao carregar agenda:', error);
      // Não limpar estado local: GET quebrado (ex.: 500) não deve apagar o que já estava na tela ou acabou de ser salvo
    }
  };

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
    const days = [];
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    // Adicionar células vazias para os dias antes do primeiro dia do mês
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
    }
    
    // Adicionar os dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      const isAvailable = isDayAvailable(day);
      const isBlocked = isDayBlocked(day);
      const date = new Date(year, month, day);
      const dateKey = formatDateKey(date);
      const today = new Date();
      const isToday = date.toDateString() === today.toDateString();
      const isPast = date < today && !isToday;
      
      // Verificar se há consultas agendadas neste dia
      const bookedTimes = getDayBookedTimes(day);
      const hasBookedAppointments = bookedTimes.size > 0;
      const slotsTemplate = daySchedules[dateKey] || [];
      const freeSlotsCount = slotsTemplate.filter((t) => {
        const norm =
          typeof t === 'string' && t.length >= 5 ? t.substring(0, 5) : String(t || '');
        return norm && !bookedTimes.has(norm);
      }).length;
      
      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.calendarDay,
            isToday && styles.calendarDayToday,
            isAvailable && styles.calendarDayAvailable,
            isBlocked && styles.calendarDayBlocked,
            isPast && styles.calendarDayPast,
            hasBookedAppointments && styles.calendarDayHasAppointments,
          ]}
          onPress={() => !isPast && toggleDayAvailability(day)}
          disabled={isPast}
        >
          <Text
            style={[
              styles.calendarDayText,
              isToday && styles.calendarDayTextToday,
              isAvailable && styles.calendarDayTextAvailable,
              isBlocked && styles.calendarDayTextBlocked,
              isPast && styles.calendarDayTextPast,
            ]}
          >
            {day}
          </Text>
          {isAvailable && (
            <>
              <View style={styles.calendarDayIndicator}>
                <CheckmarkCircleIcon size={12} color={colors.success} />
              </View>
              {freeSlotsCount > 0 && (
                <Text style={styles.calendarDayTimesCount}>
                  {freeSlotsCount}h
                </Text>
              )}
            </>
          )}
          {isBlocked && (
            <View style={styles.calendarDayIndicator}>
              <CloseCircleIcon size={12} color={colors.error} />
            </View>
          )}
          {hasBookedAppointments && !isBlocked && (
            <View style={styles.calendarDayAppointmentIndicator}>
              <CalendarIcon size={10} color={colors.primary} />
            </View>
          )}
        </TouchableOpacity>
      );
    }
    
    return (
      <View style={styles.calendarContainer}>
        {/* Cabeçalho do calendário */}
        <View style={styles.calendarHeader}>
          <TouchableOpacity
            onPress={() => navigateMonth(-1)}
            style={styles.calendarNavButton}
          >
            <ChevronBackIcon size={24} color={colors.primary} />
          </TouchableOpacity>
          
          <Text style={styles.calendarMonthText}>
            {moment(currentMonth).format('MMMM [de] YYYY')}
          </Text>
          
          <TouchableOpacity
            onPress={() => navigateMonth(1)}
            style={styles.calendarNavButton}
          >
            <ChevronForwardIcon size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
        
        {/* Dias da semana */}
        <View style={styles.calendarWeekDays}>
          {weekDays.map((day, index) => (
            <View key={index} style={styles.calendarWeekDay}>
              <Text style={styles.calendarWeekDayText}>{day}</Text>
            </View>
          ))}
        </View>
        
        {/* Grid de dias */}
        <View style={styles.calendarGrid}>
          {days}
        </View>
        
        {/* Legenda */}
        <View style={styles.calendarLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, styles.calendarDayAvailable]} />
            <Text style={styles.legendText}>Disponível</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, styles.calendarDayBlocked]} />
            <Text style={styles.legendText}>Bloqueado</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: colors.backgroundLight }]} />
            <Text style={styles.legendText}>Indisponível</Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando consultas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <LacosLogoFull width={120} height={40} />
        <TouchableOpacity
          onPress={() => {
            console.log('📱 DoctorHomeScreen - Navegando para Profile');
            navigation.navigate('Profile');
          }}
          style={styles.profileButton}
          activeOpacity={0.7}
        >
          <View style={styles.profileIconContainer}>
            {/* Ícone SVG de silhueta de perfil */}
            <ProfileIcon size={32} color={colors.primary} filled={false} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'appointments' && styles.tabActive]}
          onPress={() => setActiveTab('appointments')}
          activeOpacity={0.7}
        >
          <AppointmentIcon 
            size={20} 
            color={activeTab === 'appointments' ? colors.primary : colors.textLight} 
          />
          <Text style={[styles.tabText, activeTab === 'appointments' && styles.tabTextActive]}>
            Consultas Agendadas
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'agenda' && styles.tabActive]}
          onPress={() => setActiveTab('agenda')}
          activeOpacity={0.7}
        >
          <CalendarIcon 
            size={20} 
            color={activeTab === 'agenda' ? colors.primary : colors.textLight} 
          />
          <Text style={[styles.tabText, activeTab === 'agenda' && styles.tabTextActive]}>
            Agenda
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
        >
        {activeTab === 'appointments' ? (
          <View style={styles.section}>
            <View style={styles.appointmentsSectionHeader}>
              <Text style={styles.sectionTitle}>Consultas Agendadas</Text>
              <View style={styles.toggleColumn}>
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>Realizadas</Text>
                  <Switch
                    value={showCompleted}
                    onValueChange={setShowCompleted}
                    trackColor={{ false: colors.gray300, true: colors.primary + '80' }}
                    thumbColor={showCompleted ? colors.primary : colors.gray400}
                    ios_backgroundColor={colors.gray300}
                  />
                </View>
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>Não realizadas</Text>
                  <Switch
                    value={showPastIncomplete}
                    onValueChange={setShowPastIncomplete}
                    trackColor={{ false: colors.gray300, true: colors.warning + '80' }}
                    thumbColor={showPastIncomplete ? colors.warning : colors.gray400}
                    ios_backgroundColor={colors.gray300}
                  />
                </View>
              </View>
            </View>
            
            {(() => {
              const nowMs = Date.now();
              const completedList = appointments.filter(
                (apt) => !isAppointmentCancelled(apt) && isAppointmentCompletedForDoctor(apt, nowMs)
              );
              const incompletePastList = appointments.filter((apt) =>
                isAppointmentIncompletePast(apt, nowMs)
              );
              const upcomingList = appointments.filter((apt) => {
                if (isAppointmentCancelled(apt)) {
                  return false;
                }
                const t = getAppointmentTimeMs(apt);
                return t != null && t >= nowMs;
              });

              let filteredAppointments = [];
              if (showCompleted && showPastIncomplete) {
                const byId = new Map();
                completedList.forEach((a) => byId.set(a.id, a));
                incompletePastList.forEach((a) => byId.set(a.id, a));
                filteredAppointments = Array.from(byId.values()).sort(
                  (a, b) => (getAppointmentTimeMs(b) ?? 0) - (getAppointmentTimeMs(a) ?? 0)
                );
              } else if (showCompleted) {
                filteredAppointments = [...completedList].sort(
                  (a, b) => (getAppointmentTimeMs(b) ?? 0) - (getAppointmentTimeMs(a) ?? 0)
                );
              } else if (showPastIncomplete) {
                filteredAppointments = [...incompletePastList].sort(
                  (a, b) => (getAppointmentTimeMs(b) ?? 0) - (getAppointmentTimeMs(a) ?? 0)
                );
              } else {
                filteredAppointments = [...upcomingList];
              }

              if (filteredAppointments.length === 0) {
                let emptyText = 'Nenhuma consulta agendada';
                let emptySubtext = 'Suas consultas com pacientes aparecerão aqui';
                if (showCompleted && showPastIncomplete) {
                  emptyText = 'Nenhuma consulta encontrada';
                  emptySubtext =
                    'Não há consultas concluídas nem pendentes de conclusão neste período';
                } else if (showCompleted) {
                  emptyText = 'Nenhuma consulta realizada';
                  emptySubtext =
                    'Consultas com confirmação e pagamento liberado aparecem aqui';
                } else if (showPastIncomplete) {
                  emptyText = 'Nenhuma consulta não realizada';
                  emptySubtext =
                    'Consultas passadas que aguardam confirmação de realização ou fechamento aparecem aqui';
                }
                return (
                  <View style={styles.emptyContainer}>
                    <CalendarIcon size={64} color={colors.gray300} />
                    <Text style={styles.emptyText}>{emptyText}</Text>
                    <Text style={styles.emptySubtext}>{emptySubtext}</Text>
                  </View>
                );
              }
              
              return filteredAppointments.map((appointment) => {
                const appointmentDate = new Date(appointment.appointment_date || appointment.scheduled_at);
                const isPast = appointmentDate < new Date();
                const isTele = isTeleconsultAppointment(appointment);
                const doctorViewsCompleted = isAppointmentCompletedForDoctor(appointment, Date.now());
                const awaitingPatientConfirm = isTeleconsultAwaitingHonorariumConfirmation(
                  appointment,
                  Date.now()
                );
                
                // Buscar nome do paciente de várias fontes possíveis
                // 1. patient_name direto (se vier da API) - PRIORIDADE MÁXIMA
                // 2. Cache de nomes de pacientes (busca através dos membros do grupo)
                // 3. Fallback para nome do grupo apenas se não encontrar paciente
                const patientName = 
                  appointment.patient_name ||
                  (appointment.group_id && patientNamesCache[appointment.group_id]) ||
                  appointment.group?.name ||
                  appointment.group_name ||
                  (appointment.group_id && groupNamesCache[appointment.group_id]) ||
                  (appointment.group && typeof appointment.group === 'string' ? appointment.group : null) ||
                  'Não informado';
                
                // Log para debug de teleconsultas
                if (isTele) {
                  console.log('🔍 Teleconsulta - Nome do paciente:', {
                    appointment_id: appointment.id,
                    patient_name_from_api: appointment.patient_name,
                    patient_name_from_cache: appointment.group_id ? patientNamesCache[appointment.group_id] : null,
                    group_id: appointment.group_id,
                    final_patient_name: patientName,
                  });
                }
                
                const isCancelled = isAppointmentCancelled(appointment);
                const teleconsultPago =
                  isTele && isTeleconsultPaidForVideoStart(appointment);

                return (
                <TouchableOpacity
                  key={appointment.id}
                  style={[
                    styles.appointmentCard,
                    isPast && !isCancelled && styles.appointmentCardPast,
                    isCancelled && styles.appointmentCardCancelled
                  ]}
                  onPress={() => handleAppointmentPress(appointment)}
                >
                  <View style={styles.appointmentHeader}>
                    <View style={styles.appointmentIconContainer}>
                      {isTele ? (
                        <VideoCamIcon size={24} color={isPast ? colors.textLight : colors.primary} />
                      ) : (
                        <CalendarIcon size={24} color={isPast ? colors.textLight : colors.primary} />
                      )}
                    </View>
                    <View style={styles.appointmentInfo}>
                      <View style={styles.appointmentTitleContainer}>
                        <Text style={styles.appointmentTitle}>
                          Consulta
                        </Text>
                      </View>
                      {isTele && (
                        <View style={styles.teleconsultationBadge}>
                          <VideoCamIcon size={18} color={colors.textWhite} />
                          <Text style={styles.teleconsultationBadgeText}>Teleconsulta</Text>
                        </View>
                      )}
                      {/* Sempre mostrar nome do paciente nas teleconsultas */}
                      {isTele && (
                        <Text style={styles.appointmentPatient}>
                          Paciente: {patientName}
                        </Text>
                      )}
                      {isTele &&
                        appointment.status !== 'cancelled' &&
                        appointment.status !== 'cancelada' && (
                          <Text
                            style={[
                              styles.teleconsultAgendaStatus,
                              teleconsultPago && styles.teleconsultAgendaStatusPaid,
                            ]}
                          >
                            {getDoctorAgendaSlotBookingLabel(appointment)}
                          </Text>
                        )}
                      {isTele && (appointment.doctorUser || appointment.doctor) && (
                        <View style={styles.doctorInfoRow}>
                          <MedicalIcon size={14} color={colors.primary} />
                          <Text style={styles.doctorInfoText}>
                            Dr(a). {appointment.doctorUser?.name || appointment.doctor?.name || 'Médico'}
                          </Text>
                        </View>
                      )}
                      {appointment.description && (
                        <Text style={styles.appointmentDescription} numberOfLines={2}>
                          {appointment.description}
                        </Text>
                      )}
                    </View>
                  </View>
                  
                  <View style={styles.appointmentFooter}>
                    <View style={styles.appointmentDateContainer}>
                      <TimeOutlineIcon size={16} color={colors.textLight} />
                      <Text style={styles.appointmentDate}>
                        {formatDate(appointmentDate)} às {formatTime(appointmentDate)}
                      </Text>
                    </View>
                    {appointment.location && (
                      <View style={styles.appointmentLocationContainer}>
                        <LocationOutlineIcon size={16} color={colors.textLight} />
                        <Text style={styles.appointmentLocation} numberOfLines={1}>
                          {appointment.location}
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  {appointment.status === 'cancelled' && (
                    <View style={styles.cancelledBadge}>
                      <CloseCircleIcon size={14} color={colors.textWhite} />
                      <Text style={styles.cancelledBadgeText}>Cancelada</Text>
                    </View>
                  )}
                  {!isCancelled && doctorViewsCompleted && (
                    <View style={styles.completedBadgeDoctor}>
                      <Text style={styles.completedBadgeDoctorText}>Realizada</Text>
                    </View>
                  )}
                  {!isCancelled && !doctorViewsCompleted && isPast && (
                    <View
                      style={
                        awaitingPatientConfirm
                          ? styles.awaitingConfirmBadge
                          : styles.notCompletedBadge
                      }
                    >
                      <Text
                        style={
                          awaitingPatientConfirm
                            ? styles.awaitingConfirmBadgeText
                            : styles.notCompletedBadgeText
                        }
                      >
                        {awaitingPatientConfirm
                          ? 'Aguardando confirmação'
                          : 'Não realizada'}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
                );
              });
            })()}
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gerenciar Agenda</Text>
            <Text style={styles.sectionSubtitle}>
              Toque nos dias para marcar como disponível ou bloqueado
            </Text>
            
            {renderCalendar()}
            
            {/* Botões de ação */}
            <View style={styles.agendaActions}>
              <TouchableOpacity
                style={[styles.agendaButton, styles.agendaButtonSave]}
                onPress={saveAvailability}
                disabled={savingAvailability}
                activeOpacity={0.7}
              >
                <SaveOutlineIcon size={20} color={colors.textWhite} />
                <Text style={styles.agendaButtonText}>
                  {savingAvailability ? 'Salvando...' : 'Salvar Agenda'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.agendaButton, styles.agendaButtonClear]}
                onPress={clearAllDays}
                activeOpacity={0.7}
              >
                <TrashOutlineIcon size={20} color={colors.error} />
                <Text style={[styles.agendaButtonText, { color: colors.error }]}>
                  Limpar Agenda
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
  },
  tabTextActive: {
    color: colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textLight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  profileIconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  appointmentsSectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  toggleColumn: {
    marginTop: 12,
    gap: 10,
    alignSelf: 'stretch',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleLabel: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 8,
    textAlign: 'center',
  },
  appointmentCard: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  appointmentCardPast: {
    opacity: 0.6,
    borderColor: colors.border,
  },
  appointmentCardCancelled: {
    opacity: 0.7,
    borderColor: colors.error + '40',
    backgroundColor: colors.error + '05',
  },
  appointmentHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  appointmentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  appointmentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    flex: 1,
  },
  teleconsultationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
    marginBottom: 8,
    alignSelf: 'flex-start',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  teleconsultationBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textWhite,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  appointmentPatient: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
    marginBottom: 4,
  },
  teleconsultAgendaStatus: {
    fontSize: 13,
    color: colors.warning,
    fontWeight: '600',
    marginBottom: 4,
  },
  teleconsultAgendaStatusPaid: {
    color: colors.success,
  },
  appointmentDescription: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 4,
  },
  doctorInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  doctorInfoText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  appointmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  appointmentDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  appointmentDate: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 6,
    fontWeight: '500',
  },
  appointmentLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 12,
  },
  appointmentLocation: {
    fontSize: 12,
    color: colors.textLight,
    marginLeft: 6,
    flex: 1,
  },
  cancelledBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.error,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cancelledBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textWhite,
    textTransform: 'uppercase',
  },
  pastBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.textLight + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pastBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textLight,
    textTransform: 'uppercase',
  },
  completedBadgeDoctor: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.success + '28',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  completedBadgeDoctorText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.success,
    textTransform: 'uppercase',
  },
  awaitingConfirmBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.warning + '28',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  awaitingConfirmBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.warning,
    textTransform: 'uppercase',
  },
  notCompletedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.textLight + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  notCompletedBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textLight,
    textTransform: 'uppercase',
  },
  // Estilos do calendário
  calendarContainer: {
    alignSelf: 'flex-start',
    width: '100%',
    flexGrow: 0,
    flexShrink: 0,
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  calendarNavButton: {
    padding: 8,
  },
  calendarMonthText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'capitalize',
  },
  calendarWeekDays: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  calendarWeekDay: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  calendarWeekDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textLight,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    alignContent: 'flex-start',
    marginBottom: 0,
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 0.9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    margin: 1,
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  calendarDayToday: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  calendarDayAvailable: {
    backgroundColor: colors.success + '20',
    borderColor: colors.success,
  },
  calendarDayBlocked: {
    backgroundColor: colors.error + '20',
    borderColor: colors.error,
  },
  calendarDayPast: {
    opacity: 0.4,
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  calendarDayTextToday: {
    color: colors.primary,
    fontWeight: '700',
  },
  calendarDayTextAvailable: {
    color: colors.success,
  },
  calendarDayTextBlocked: {
    color: colors.error,
  },
  calendarDayTextPast: {
    color: colors.textLight,
  },
  calendarDayIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  calendarDayHasAppointments: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  calendarDayAppointmentIndicator: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    backgroundColor: colors.primary + '20',
    borderRadius: 8,
    padding: 2,
  },
  calendarLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  legendText: {
    fontSize: 12,
    color: colors.textLight,
  },
  agendaActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  agendaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 12,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 2,
  },
  agendaButtonSave: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  agendaButtonClear: {
    backgroundColor: colors.backgroundLight,
    borderColor: colors.error,
  },
  agendaButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textWhite,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.textLight,
    marginBottom: 6,
  },
  calendarDayTimesCount: {
    position: 'absolute',
    bottom: 2,
    fontSize: 9,
    color: colors.success,
    fontWeight: '600',
  },
});

export default DoctorHomeScreen;


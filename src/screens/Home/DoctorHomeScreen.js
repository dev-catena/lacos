import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import colors from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { LacosLogoFull } from '../../components/LacosLogo';
import appointmentService from '../../services/appointmentService';
import doctorService from '../../services/doctorService';
import groupService from '../../services/groupService';
import moment from 'moment';
import 'moment/locale/pt-br';

moment.locale('pt-br');

const DoctorHomeScreen = ({ navigation }) => {
  const { user, signed } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('appointments'); // 'appointments' ou 'agenda'
  const [showCompleted, setShowCompleted] = useState(false); // Toggle para mostrar consultas realizadas
  const [groupNamesCache, setGroupNamesCache] = useState({}); // Cache de nomes de grupos
  
  // Estados para a agenda
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availableDays, setAvailableDays] = useState(new Set()); // Dias disponíveis
  const [blockedDays, setBlockedDays] = useState(new Set()); // Dias bloqueados
  const [daySchedules, setDaySchedules] = useState({}); // { '2024-12-15': ['08:00', '09:00', '14:00'] }
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null); // { date: Date, dateKey: string }
  const [selectedDayTimes, setSelectedDayTimes] = useState([]); // Horários selecionados para o dia
  const [bookedTimes, setBookedTimes] = useState(new Set()); // Horários agendados (não podem ser removidos)

  useFocusEffect(
    React.useCallback(() => {
      if (signed && user) {
        loadAppointments();
        if (activeTab === 'agenda') {
          loadAvailability();
        }
      }
    }, [signed, user, activeTab])
  );

  // Recarregar consultas quando mudar para a aba de agenda
  useEffect(() => {
    if (activeTab === 'agenda' && signed && user) {
      loadAppointments();
    }
  }, [activeTab]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
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
        // Filtrar apenas consultas deste médico
        // Converter IDs para números para comparação correta
        const currentDoctorId = Number(user.id);
        
        const doctorAppointments = result.data.filter((appointment) => {
          const appointmentDoctorId = appointment.doctor_id ? Number(appointment.doctor_id) : null;
          const doctorUserId = appointment.doctorUser?.id ? Number(appointment.doctorUser.id) : null;
          const doctorId = appointment.doctor?.id ? Number(appointment.doctor.id) : null;
          
          const isDoctorAppointment = 
            appointmentDoctorId === currentDoctorId ||
            doctorUserId === currentDoctorId ||
            doctorId === currentDoctorId;
          
          return isDoctorAppointment;
        });

        console.log(`✅ DoctorHomeScreen - ${doctorAppointments.length} consulta(s) do médico carregada(s)`, {
          totalAppointments: result.data.length,
          doctorAppointments: doctorAppointments.length,
          doctorId: user.id,
        });

        // Log detalhado das consultas
        doctorAppointments.forEach(apt => {
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
          });
        });

        // Buscar nomes dos grupos que não estão no cache
        const groupIdsToFetch = doctorAppointments
          .map(apt => apt.group_id)
          .filter(id => id && !groupNamesCache[id]);
        
        if (groupIdsToFetch.length > 0) {
          console.log('🔍 Buscando nomes de grupos:', groupIdsToFetch);
          // Buscar nomes dos grupos em paralelo
          const groupPromises = groupIdsToFetch.map(async (groupId) => {
            try {
              const groupResult = await groupService.getGroup(groupId);
              if (groupResult.success && groupResult.data) {
                return { groupId, name: groupResult.data.name || groupResult.data.groupName || null };
              }
            } catch (error) {
              console.error(`Erro ao buscar grupo ${groupId}:`, error);
            }
            return { groupId, name: null };
          });
          
          const groupNames = await Promise.all(groupPromises);
          const newCache = { ...groupNamesCache };
          groupNames.forEach(({ groupId, name }) => {
            if (name) {
              newCache[groupId] = name;
            }
          });
          setGroupNamesCache(newCache);
        }

        // Ordenar por data (mais próximas primeiro)
        doctorAppointments.sort((a, b) => {
          const dateA = new Date(a.appointment_date || a.scheduled_at);
          const dateB = new Date(b.appointment_date || b.scheduled_at);
          return dateA - dateB;
        });

        setAppointments(doctorAppointments);
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
      console.log('📅 getBookedTimesForDay - Nenhuma consulta disponível');
      return bookedTimesSet;
    }

    if (!user || !user.id) {
      console.warn('⚠️ getBookedTimesForDay - Usuário não disponível');
      return bookedTimesSet;
    }

    // Formatar a data para comparação (YYYY-MM-DD)
    const targetDate = dateKey;
    console.log('🔍 getBookedTimesForDay - Buscando horários agendados para:', targetDate);

    appointments.forEach((appointment) => {
      if (!appointment.appointment_date && !appointment.scheduled_at) {
        return;
      }

      const appointmentDate = appointment.appointment_date || appointment.scheduled_at;
      const appointmentDateObj = new Date(appointmentDate);
      const appointmentDateKey = formatDateKey(appointmentDateObj);

      // Verificar se é o mesmo dia
      if (appointmentDateKey === targetDate) {
        // Verificar se a consulta é deste médico (comparar como números)
        const currentDoctorId = Number(user.id);
        const appointmentDoctorId = appointment.doctor_id ? Number(appointment.doctor_id) : null;
        const doctorUserId = appointment.doctorUser?.id ? Number(appointment.doctorUser.id) : null;
        const doctorId = appointment.doctor?.id ? Number(appointment.doctor.id) : null;
        
        const isDoctorAppointment = 
          appointmentDoctorId === currentDoctorId ||
          doctorUserId === currentDoctorId ||
          doctorId === currentDoctorId;

        if (isDoctorAppointment) {
          // Extrair o horário (HH:MM) usando métodos locais para garantir timezone correto
          const appointmentDateObj = new Date(appointmentDate);
          const hours = String(appointmentDateObj.getHours()).padStart(2, '0');
          const minutes = String(appointmentDateObj.getMinutes()).padStart(2, '0');
          const time = `${hours}:${minutes}`;
          
          bookedTimesSet.add(time);
          console.log('✅ getBookedTimesForDay - Horário agendado encontrado:', {
            appointmentId: appointment.id,
            title: appointment.title,
            date: appointmentDateKey,
            time: time,
            appointmentDate: appointmentDate,
            localDateString: appointmentDateObj.toLocaleString('pt-BR'),
          });
        } else {
          console.log('⚠️ getBookedTimesForDay - Consulta não é deste médico:', {
            appointmentId: appointment.id,
            appointmentDoctorId: appointment.doctor_id,
            currentDoctorId: user.id,
          });
        }
      }
    });

    console.log('📅 getBookedTimesForDay - Horários agendados encontrados:', Array.from(bookedTimesSet));
    return bookedTimesSet;
  };

  const openScheduleModal = (day, date, dateKey) => {
    setSelectedDay({ day, date, dateKey });
    
    // Buscar horários agendados para este dia
    const booked = getBookedTimesForDay(dateKey);
    setBookedTimes(booked);
    
    // Combinar horários da agenda disponível com horários agendados
    // Isso garante que horários agendados apareçam na modal mesmo que não estejam na agenda
    const availableTimes = daySchedules[dateKey] || [];
    const bookedTimesArray = Array.from(booked);
    
    // Criar um Set com todos os horários (disponíveis + agendados) para evitar duplicatas
    const allTimesSet = new Set([...availableTimes, ...bookedTimesArray]);
    const allTimes = Array.from(allTimesSet).sort();
    
    console.log('📅 openScheduleModal - Horários para exibir:', {
      dateKey,
      availableTimes,
      bookedTimesArray,
      allTimes,
    });
    
    setSelectedDayTimes(allTimes);
    
    setScheduleModalVisible(true);
  };

  const closeScheduleModal = () => {
    setScheduleModalVisible(false);
    setSelectedDay(null);
    setSelectedDayTimes([]);
    setBookedTimes(new Set());
  };

  const getNextTimeSlot = () => {
    // Se não há horários, começar com 08:00
    if (selectedDayTimes.length === 0) {
      return '08:00';
    }

    // Ordenar horários para pegar o último
    const sortedTimes = [...selectedDayTimes].sort();
    const lastTime = sortedTimes[sortedTimes.length - 1];
    
    // Validar formato HH:MM
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(lastTime)) {
      return '08:00';
    }

    // Extrair horas e minutos
    const [hours, minutes] = lastTime.split(':').map(Number);
    
    // Adicionar 1 hora
    let nextHours = hours + 1;
    let nextMinutes = minutes;

    // Se ultrapassar 23:59, voltar para 08:00
    if (nextHours > 23) {
      return '08:00';
    }

    // Formatar com zero à esquerda
    const formattedHours = String(nextHours).padStart(2, '0');
    const formattedMinutes = String(nextMinutes).padStart(2, '0');
    
    return `${formattedHours}:${formattedMinutes}`;
  };

  const addTimeSlot = () => {
    const nextTime = getNextTimeSlot();
    
    // Verificar se o horário já existe
    if (selectedDayTimes.includes(nextTime)) {
      Alert.alert('Aviso', 'Este horário já está cadastrado. Por favor, escolha outro horário.');
      return;
    }

    const newTimes = [...selectedDayTimes, nextTime];
    setSelectedDayTimes(newTimes);
  };

  const removeTimeSlot = (index) => {
    const timeToRemove = selectedDayTimes[index];
    
    // Verificar se o horário está agendado
    if (bookedTimes.has(timeToRemove)) {
      Alert.alert(
        'Horário Agendado',
        'Este horário não pode ser removido pois já possui uma consulta agendada.',
        [{ text: 'OK' }]
      );
      return;
    }

    const newTimes = selectedDayTimes.filter((_, i) => i !== index);
    setSelectedDayTimes(newTimes);
  };

  const updateTimeSlot = (index, time) => {
    const currentTime = selectedDayTimes[index];
    
    // Verificar se o horário atual está agendado
    if (bookedTimes.has(currentTime)) {
      Alert.alert(
        'Horário Agendado',
        'Este horário não pode ser editado pois já possui uma consulta agendada.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Validar formato HH:MM
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    
    if (time.length === 5 && timeRegex.test(time)) {
      // Verificar se o horário já existe em outro índice
      const existingIndex = selectedDayTimes.findIndex((t, i) => i !== index && t === time);
      if (existingIndex !== -1) {
        Alert.alert('Aviso', 'Este horário já está cadastrado. Por favor, escolha outro horário.');
        return;
      }

      const newTimes = [...selectedDayTimes];
      newTimes[index] = time;
      setSelectedDayTimes(newTimes);
    } else if (time.length <= 5) {
      // Permitir digitação parcial
      const newTimes = [...selectedDayTimes];
      newTimes[index] = time;
      setSelectedDayTimes(newTimes);
    }
  };

  const formatTimeInput = (time) => {
    // Formatar automaticamente para HH:MM
    let formatted = time.replace(/\D/g, ''); // Remove tudo que não é dígito
    if (formatted.length >= 2) {
      formatted = formatted.substring(0, 2) + ':' + formatted.substring(2, 4);
    }
    return formatted.substring(0, 5);
  };

  const saveDaySchedule = () => {
    if (!selectedDay) return;

    const { dateKey } = selectedDay;
    const newAvailableDays = new Set(availableDays);
    const newBlockedDays = new Set(blockedDays);
    const newSchedules = { ...daySchedules };

    // Filtrar apenas horários que NÃO estão agendados para salvar na agenda disponível
    // Horários agendados devem aparecer na modal mas não devem ser salvos na agenda disponível
    const availableOnlyTimes = selectedDayTimes.filter(time => {
      // Normalizar horário para comparação
      const normalizeTime = (t) => {
        if (!t) return '';
        const trimmed = t.trim();
        if (/^\d{2}:\d{2}:\d{2}/.test(trimmed)) return trimmed.substring(0, 5);
        return trimmed;
      };
      
      const normalizedTime = normalizeTime(time);
      return !bookedTimes.has(normalizedTime) && !bookedTimes.has(time);
    });

    if (availableOnlyTimes.length === 0) {
      // Se não há horários disponíveis (apenas agendados), remover da lista de disponíveis
      newAvailableDays.delete(dateKey);
      delete newSchedules[dateKey];
    } else {
      // Remover horários duplicados e inválidos apenas dos horários disponíveis
      const validTimes = [];
      const seenTimes = new Set();
      const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;

      for (const time of availableOnlyTimes) {
        // Validar formato
        if (!timeRegex.test(time)) {
          continue;
        }
        
        // Verificar duplicatas
        if (!seenTimes.has(time)) {
          validTimes.push(time);
          seenTimes.add(time);
        }
      }

      // Ordenar horários
      validTimes.sort();

      if (validTimes.length === 0) {
        // Se não há horários válidos, remover da lista de disponíveis
        newAvailableDays.delete(dateKey);
        delete newSchedules[dateKey];
      } else {
        // Adicionar como disponível e salvar apenas horários disponíveis (não agendados)
        newAvailableDays.add(dateKey);
        newBlockedDays.delete(dateKey);
        newSchedules[dateKey] = validTimes;
      }
    }

    setAvailableDays(newAvailableDays);
    setBlockedDays(newBlockedDays);
    setDaySchedules(newSchedules);
    closeScheduleModal();
  };

  const blockDay = () => {
    if (!selectedDay) return;

    const { dateKey } = selectedDay;
    const newAvailableDays = new Set(availableDays);
    const newBlockedDays = new Set(blockedDays);
    const newSchedules = { ...daySchedules };

    newAvailableDays.delete(dateKey);
    newBlockedDays.add(dateKey);
    delete newSchedules[dateKey];

    setAvailableDays(newAvailableDays);
    setBlockedDays(newBlockedDays);
    setDaySchedules(newSchedules);
    closeScheduleModal();
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

      console.log('💾 Salvando agenda:', availabilityData);
      
      const result = await doctorService.saveAvailability(user.id, availabilityData);
      
      if (result && result.success) {
        Alert.alert('Sucesso', 'Agenda atualizada com sucesso');
      } else {
        throw new Error(result?.message || 'Erro ao salvar agenda');
      }
    } catch (error) {
      console.error('Erro ao salvar agenda:', error);
      Alert.alert('Erro', error.message || 'Não foi possível salvar a agenda');
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
      const result = await doctorService.getDoctorAvailability(user.id);
      
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
      // Em caso de erro, inicializar vazio
      setAvailableDays(new Set());
      setDaySchedules({});
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
                <Ionicons name="checkmark-circle" size={12} color={colors.success} />
              </View>
              {daySchedules[dateKey] && daySchedules[dateKey].length > 0 && (
                <Text style={styles.calendarDayTimesCount}>
                  {daySchedules[dateKey].length}h
                </Text>
              )}
            </>
          )}
          {isBlocked && (
            <View style={styles.calendarDayIndicator}>
              <Ionicons name="close-circle" size={12} color={colors.error} />
            </View>
          )}
          {hasBookedAppointments && !isBlocked && (
            <View style={styles.calendarDayAppointmentIndicator}>
              <Ionicons name="calendar" size={10} color={colors.primary} />
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
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          
          <Text style={styles.calendarMonthText}>
            {moment(currentMonth).format('MMMM [de] YYYY')}
          </Text>
          
          <TouchableOpacity
            onPress={() => navigateMonth(1)}
            style={styles.calendarNavButton}
          >
            <Ionicons name="chevron-forward" size={24} color={colors.primary} />
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
          onPress={() => navigation.navigate('Profile')}
          style={styles.profileButton}
        >
          <Ionicons name="person-circle-outline" size={32} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'appointments' && styles.tabActive]}
          onPress={() => setActiveTab('appointments')}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="calendar" 
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
          <Ionicons 
            name="calendar-outline" 
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
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Consultas Agendadas</Text>
              <View style={styles.toggleContainer}>
                <Text style={styles.toggleLabel}>Mostrar Realizadas</Text>
                <Switch
                  value={showCompleted}
                  onValueChange={setShowCompleted}
                  trackColor={{ false: colors.gray300, true: colors.primary + '80' }}
                  thumbColor={showCompleted ? colors.primary : colors.gray400}
                  ios_backgroundColor={colors.gray300}
                />
              </View>
            </View>
            
            {(() => {
              // Filtrar consultas baseado no toggle
              const filteredAppointments = showCompleted 
                ? appointments 
                : appointments.filter(apt => {
                    const aptDate = new Date(apt.appointment_date || apt.scheduled_at);
                    return aptDate >= new Date();
                  });
              
              if (filteredAppointments.length === 0) {
                return (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="calendar-outline" size={64} color={colors.textLight} />
                    <Text style={styles.emptyText}>
                      {showCompleted ? 'Nenhuma consulta encontrada' : 'Nenhuma consulta agendada'}
                    </Text>
                    <Text style={styles.emptySubtext}>
                      {showCompleted 
                        ? 'Não há consultas para exibir'
                        : 'Suas consultas com pacientes aparecerão aqui'}
                    </Text>
                  </View>
                );
              }
              
              return filteredAppointments.map((appointment) => {
                const appointmentDate = new Date(appointment.appointment_date || appointment.scheduled_at);
                const isPast = appointmentDate < new Date();
                
                // Buscar nome do paciente de várias fontes possíveis
                // 1. patient_name direto
                // 2. group.name (se o relacionamento group foi carregado)
                // 3. group_name (se vier direto da API)
                // 4. Cache de nomes de grupos
                // 5. group como string
                const patientName = 
                  appointment.patient_name ||
                  appointment.group?.name ||
                  appointment.group_name ||
                  (appointment.group_id && groupNamesCache[appointment.group_id]) ||
                  (appointment.group && typeof appointment.group === 'string' ? appointment.group : null) ||
                  'Não informado';
                
                return (
                <TouchableOpacity
                  key={appointment.id}
                  style={[
                    styles.appointmentCard,
                    isPast && styles.appointmentCardPast
                  ]}
                  onPress={() => handleAppointmentPress(appointment)}
                >
                  <View style={styles.appointmentHeader}>
                    <View style={styles.appointmentIconContainer}>
                      <Ionicons 
                        name={appointment.is_teleconsultation ? "videocam" : "calendar"} 
                        size={24} 
                        color={isPast ? colors.textLight : colors.primary} 
                      />
                    </View>
                    <View style={styles.appointmentInfo}>
                      <View style={styles.appointmentTitleContainer}>
                        <Text style={styles.appointmentTitle}>
                          Consulta
                        </Text>
                      </View>
                      {appointment.is_teleconsultation && (
                        <View style={styles.teleconsultationBadge}>
                          <Ionicons 
                            name="videocam" 
                            size={18} 
                            color={colors.textWhite} 
                          />
                          <Text style={styles.teleconsultationBadgeText}>Teleconsulta</Text>
                        </View>
                      )}
                      <Text style={styles.appointmentPatient}>
                        Paciente: {patientName}
                      </Text>
                      {appointment.is_teleconsultation && (appointment.doctorUser || appointment.doctor) && (
                        <View style={styles.doctorInfoRow}>
                          <Ionicons 
                            name="medical" 
                            size={14} 
                            color={colors.primary} 
                          />
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
                      <Ionicons 
                        name="time-outline" 
                        size={16} 
                        color={colors.textLight} 
                      />
                      <Text style={styles.appointmentDate}>
                        {formatDate(appointmentDate)} às {formatTime(appointmentDate)}
                      </Text>
                    </View>
                    {appointment.location && (
                      <View style={styles.appointmentLocationContainer}>
                        <Ionicons 
                          name="location-outline" 
                          size={16} 
                          color={colors.textLight} 
                        />
                        <Text style={styles.appointmentLocation} numberOfLines={1}>
                          {appointment.location}
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  {isPast && (
                    <View style={styles.pastBadge}>
                      <Text style={styles.pastBadgeText}>Realizada</Text>
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
              >
                <Ionicons name="save-outline" size={20} color={colors.textWhite} />
                <Text style={styles.agendaButtonText}>
                  {savingAvailability ? 'Salvando...' : 'Salvar Agenda'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.agendaButton, styles.agendaButtonClear]}
                onPress={clearAllDays}
              >
                <Ionicons name="trash-outline" size={20} color={colors.error} />
                <Text style={[styles.agendaButtonText, { color: colors.error }]}>
                  Limpar Agenda
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Modal de Horários */}
      <Modal
        visible={scheduleModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeScheduleModal}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeScheduleModal}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            style={styles.modalKeyboardView}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              style={styles.modalContent}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {selectedDay && selectedDay.date ? `Horários - ${moment(selectedDay.date).format('DD/MM/YYYY')}` : 'Horários'}
                </Text>
                <TouchableOpacity onPress={closeScheduleModal} style={styles.modalCloseButton}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalBody}
                contentContainerStyle={styles.modalBodyContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.modalSubtitle}>
                  Defina os horários disponíveis para este dia
                </Text>

                {/* Lista de horários */}
                <View style={styles.timeSlotsContainer}>
                  {selectedDayTimes.map((time, index) => {
                    // Normalizar horário para comparação (remover segundos se houver)
                    const normalizeTimeForComparison = (t) => {
                      if (!t) return '';
                      const trimmed = t.trim();
                      // Se está no formato HH:MM:SS, remover segundos
                      if (/^\d{2}:\d{2}:\d{2}/.test(trimmed)) {
                        return trimmed.substring(0, 5);
                      }
                      return trimmed;
                    };
                    
                    const normalizedTime = normalizeTimeForComparison(time);
                    const isBooked = bookedTimes.has(normalizedTime) || bookedTimes.has(time);
                    
                    console.log('🔍 Verificando horário na modal:', {
                      time,
                      normalizedTime,
                      isBooked,
                      bookedTimes: Array.from(bookedTimes),
                    });
                    
                    return (
                      <View key={index} style={[
                        styles.timeSlotRow,
                        isBooked && styles.timeSlotRowBooked
                      ]}>
                        <View style={styles.timeInputContainer}>
                          <TextInput
                            style={[
                              styles.timeInput,
                              isBooked && styles.timeInputBooked
                            ]}
                            value={time}
                            onChangeText={(text) => {
                              if (!isBooked) {
                                const formatted = formatTimeInput(text);
                                updateTimeSlot(index, formatted);
                              }
                            }}
                            placeholder="HH:MM"
                            placeholderTextColor={colors.gray400}
                            keyboardType="numeric"
                            maxLength={5}
                            editable={!isBooked}
                            selectTextOnFocus={!isBooked}
                          />
                          {isBooked && (
                            <View style={styles.bookedBadge}>
                              <Ionicons name="lock-closed" size={12} color={colors.textWhite} />
                              <Text style={styles.bookedBadgeText}>Agendado</Text>
                            </View>
                          )}
                        </View>
                        {/* Só mostrar botão de excluir se o horário NÃO estiver agendado */}
                        {!isBooked && (
                          <TouchableOpacity
                            style={styles.removeTimeButton}
                            onPress={() => removeTimeSlot(index)}
                          >
                            <Ionicons 
                              name="trash-outline" 
                              size={20} 
                              color={colors.error} 
                            />
                          </TouchableOpacity>
                        )}
                        {isBooked && (
                          <View style={styles.bookedLockIcon}>
                            <Ionicons 
                              name="lock-closed" 
                              size={20} 
                              color={colors.primary} 
                            />
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>

                {/* Botão adicionar horário */}
                <TouchableOpacity
                  style={styles.addTimeButton}
                  onPress={addTimeSlot}
                >
                  <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
                  <Text style={styles.addTimeButtonText}>Adicionar Horário</Text>
                </TouchableOpacity>

                {/* Botões de ação */}
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonBlock]}
                    onPress={blockDay}
                  >
                    <Ionicons name="close-circle" size={20} color={colors.textWhite} />
                    <Text style={styles.modalButtonText}>Bloquear Dia</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonSave]}
                    onPress={saveDaySchedule}
                  >
                    <Ionicons name="checkmark-circle" size={20} color={colors.textWhite} />
                    <Text style={styles.modalButtonText}>Salvar</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>
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
    padding: 4,
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
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
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
  // Estilos do calendário
  calendarContainer: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarNavButton: {
    padding: 8,
  },
  calendarMonthText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'capitalize',
  },
  calendarWeekDays: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  calendarWeekDay: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  calendarWeekDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textLight,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    margin: 2,
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
    paddingTop: 16,
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
    gap: 12,
    marginTop: 8,
  },
  agendaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
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
    fontSize: 16,
    fontWeight: '600',
    color: colors.textWhite,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 16,
  },
  calendarDayTimesCount: {
    position: 'absolute',
    bottom: 2,
    fontSize: 9,
    color: colors.success,
    fontWeight: '600',
  },
  // Estilos do modal de horários
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalKeyboardView: {
    width: '100%',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    minHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    flexGrow: 1,
  },
  modalBodyContent: {
    padding: 20,
    paddingBottom: 100,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 20,
  },
  timeSlotsContainer: {
    marginBottom: 20,
  },
  timeSlotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  timeSlotRowBooked: {
    opacity: 0.9,
  },
  timeInputContainer: {
    flex: 1,
    position: 'relative',
  },
  timeInput: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    textAlign: 'center',
  },
  timeInputBooked: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
    borderWidth: 2,
    color: colors.primary,
    fontWeight: '600',
  },
  bookedBadge: {
    position: 'absolute',
    top: -8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  bookedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textWhite,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bookedLockIcon: {
    padding: 12,
    backgroundColor: colors.primary + '20',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  removeTimeButton: {
    padding: 12,
    backgroundColor: colors.error + '20',
    borderRadius: 12,
  },
  removeTimeButtonDisabled: {
    backgroundColor: colors.textLight + '20',
    opacity: 0.5,
  },
  addTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    marginBottom: 20,
  },
  addTimeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 40,
    paddingTop: 20,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  modalButtonSave: {
    backgroundColor: colors.primary,
  },
  modalButtonBlock: {
    backgroundColor: colors.error,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textWhite,
  },
});

export default DoctorHomeScreen;


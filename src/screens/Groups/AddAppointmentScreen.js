import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Linking,
  Modal,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import DateTimePicker from '@react-native-community/datetimepicker';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import Toast from 'react-native-toast-message';
import colors from '../../constants/colors';
import {
  AppointmentIcon,
  LocationIcon,
  CloseIcon,
  TextOutlineIcon,
  MedicalOutlineIcon,
  CalendarIcon,
  ChevronDownIcon,
  VideoCamOutlineIcon,
  PersonIcon,
  AlertCircleOutlineIcon,
  TimeIcon,
  EditIcon,
  InformationCircleIcon,
  NavigateIcon,
  CheckmarkCircleIcon,
  CheckmarkIcon,
  StarIcon,
  StarHalfIcon,
  StarOutlineIcon,
  SchoolIcon,
  InformationCircleOutlineIcon,
  AlertIcon,
  FitnessOutlineIcon,
  FlaskOutlineIcon,
} from '../../components/CustomIcons';
import appointmentService from '../../services/appointmentService';
import doctorService from '../../services/doctorService';
import medicalSpecialtyService from '../../services/medicalSpecialtyService';
import groupService from '../../services/groupService';
import apiService from '../../services/apiService';
import GOOGLE_MAPS_CONFIG from '../../config/maps';
import { checkGoogleMapsConfig } from '../../utils/checkGoogleMapsConfig';
import { formatCrmDisplay } from '../../utils/crm';

const AddAppointmentScreen = ({ route, navigation }) => {
  let { groupId, groupName, appointmentId, appointment } = route.params || {};
  
  // TEMPORÁRIO: Se groupId é um timestamp (> 999999999999), usar o grupo de teste
  if (groupId && groupId > 999999999999) {
    console.warn('⚠️ GroupId é um timestamp! Usando grupo de teste (ID=1)');
    groupId = 1;
  }
  
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showRecurrenceEndPicker, setShowRecurrenceEndPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const googlePlacesRef = useRef(null);
  
  // Estados para especialidades médicas
  const [specialties, setSpecialties] = useState([]);
  const [specialtyModalVisible, setSpecialtyModalVisible] = useState(false);
  
  // Estados para médicos (teleconsulta)
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [doctorModalVisible, setDoctorModalVisible] = useState(false);
  const [doctorDetailsModalVisible, setDoctorDetailsModalVisible] = useState(false);
  const [selectedDoctorDetails, setSelectedDoctorDetails] = useState(null);
  
  // Estados para agenda do médico
  const [availabilityModalVisible, setAvailabilityModalVisible] = useState(false);
  const [doctorAvailability, setDoctorAvailability] = useState(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [selectedAvailabilityDate, setSelectedAvailabilityDate] = useState(null);
  const [selectedAvailabilityTime, setSelectedAvailabilityTime] = useState(null);
  
  // Dados do compromisso
  const [formData, setFormData] = useState({
    title: '',
    type: 'medical', // common, medical, fisioterapia, exames
    date: new Date().toISOString(),
    duration: '60',
    address: '',
    notes: '',
    selectedDoctor: null,
    medicalSpecialtyId: null,
    isTeleconsultation: false, // Teleconsulta
    recurrenceType: 'none', // none, daily, weekdays, custom
    recurrenceDays: [], // [0,1,2,3,4,5,6]
    recurrenceStart: new Date().toISOString(),
    recurrenceEnd: '',
    reminderOption: '3', // Opções pré-definidas
  });

  // Carregar especialidades ao montar o componente
  useEffect(() => {
    loadSpecialties();
    
    // Se está editando, carregar dados do compromisso
    if (appointmentId || appointment) {
      loadAppointmentData();
    }
  }, [appointmentId, appointment]);

  const loadSpecialties = async () => {
    try {
      const response = await medicalSpecialtyService.getSpecialties();
      if (response.success && response.data) {
        // Remover duplicatas por nome (caso o backend ainda retorne)
        const uniqueSpecialties = response.data.reduce((acc, current) => {
          const existing = acc.find(item => item.name === current.name);
          if (!existing) {
            acc.push(current);
          }
          return acc;
        }, []);
        
        // Ordenar por nome
        uniqueSpecialties.sort((a, b) => a.name.localeCompare(b.name));
        
        setSpecialties(uniqueSpecialties);
        console.log(`✅ Especialidades carregadas: ${uniqueSpecialties.length} (após remover duplicatas)`);
        
        // Definir "Clínica Médica" como padrão se não estiver editando e tipo for "medical"
        if (!isEditing && formData.type === 'medical' && !formData.medicalSpecialtyId) {
          const clinicaMedica = uniqueSpecialties.find(s => 
            s.name.toLowerCase() === 'clínica médica' || 
            s.name.toLowerCase() === 'clinica medica' ||
            s.name.toLowerCase() === 'clínica médica geral' ||
            s.name.toLowerCase() === 'medicina geral'
          );
          
          if (clinicaMedica) {
            updateField('medicalSpecialtyId', clinicaMedica.id);
            console.log(`✅ Especialidade padrão definida: ${clinicaMedica.name} (ID: ${clinicaMedica.id})`);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar especialidades:', error);
    }
  };

  const loadAppointmentData = async () => {
    try {
      setIsEditing(true);
      let appointmentData = appointment;
      
      // Se não veio nos params, buscar da API
      if (!appointmentData && appointmentId) {
        const result = await appointmentService.getAppointment(appointmentId);
        if (result.success) {
          appointmentData = result.data;
        }
      }
      
      if (appointmentData) {
        const appointmentDate = new Date(appointmentData.appointment_date || appointmentData.scheduled_at);
        setSelectedDate(appointmentDate);
        
        setFormData({
          title: appointmentData.title || '',
          type: appointmentData.type || 'medical',
          date: appointmentDate.toISOString(),
          duration: '60',
          address: appointmentData.location || '',
          notes: appointmentData.notes || appointmentData.description || '',
          selectedDoctor: appointmentData.doctor || null,
          medicalSpecialtyId: appointmentData.medical_specialty_id || null,
          isTeleconsultation: appointmentData.is_teleconsultation || appointmentData.isTeleconsultation || false,
          recurrenceType: appointmentData.recurrence_type || 'none',
          recurrenceDays: appointmentData.recurrence_days || (typeof appointmentData.recurrence_days === 'string' ? JSON.parse(appointmentData.recurrence_days) : []),
          recurrenceStart: appointmentData.recurrence_start || appointmentDate.toISOString(),
          recurrenceEnd: appointmentData.recurrence_end || '',
          reminderOption: '3',
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados do compromisso:', error);
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Se mudou o tipo e não é mais "medical", limpar especialidade
      if (field === 'type' && value !== 'medical') {
        newData.medicalSpecialtyId = null;
      }
      
      return newData;
    });
  };

  // Definir especialidade padrão quando o tipo mudar para "medical"
  useEffect(() => {
    if (formData.type === 'medical' && !isEditing && !formData.medicalSpecialtyId && specialties.length > 0) {
      const clinicaMedica = specialties.find(s => 
        s.name.toLowerCase() === 'clínica médica' || 
        s.name.toLowerCase() === 'clinica medica' ||
        s.name.toLowerCase() === 'clínica médica geral' ||
        s.name.toLowerCase() === 'medicina geral'
      );
      
      if (clinicaMedica) {
        updateField('medicalSpecialtyId', clinicaMedica.id);
        console.log(`✅ Especialidade padrão definida: ${clinicaMedica.name} (ID: ${clinicaMedica.id})`);
      }
    }
  }, [formData.type, formData.medicalSpecialtyId, specialties, isEditing]);

  // Carregar médicos quando teleconsulta estiver marcada e especialidade selecionada
  useEffect(() => {
    if (formData.isTeleconsultation && formData.medicalSpecialtyId && formData.type === 'medical') {
      loadDoctorsBySpecialty();
    } else {
      setDoctors([]);
    }
  }, [formData.isTeleconsultation, formData.medicalSpecialtyId, formData.type]);

  const loadDoctorsBySpecialty = async () => {
    if (!formData.medicalSpecialtyId || !groupId) return;
    
    try {
      setLoadingDoctors(true);
      
      console.log('🔍 Buscando médicos da PLATAFORMA para especialidade:', formData.medicalSpecialtyId);
      
      // Buscar TODOS os médicos da plataforma (não apenas do grupo)
      // Filtrar por: profile='doctor', medical_specialty_id, is_available=true
      const params = {
        profile: 'doctor',
        medical_specialty_id: formData.medicalSpecialtyId,
        is_available: true,
      };
      
      const queryString = Object.keys(params)
        .map(key => `${key}=${encodeURIComponent(params[key])}`)
        .join('&');
      
      const endpoint = `/caregivers?${queryString}`;
      console.log('📡 Endpoint:', endpoint);
      
      const response = await apiService.get(endpoint);
      
      console.log('📥 Resposta da API:', JSON.stringify(response, null, 2));
      
      // Normalizar resposta (pode vir como array direto ou {success: true, data: [...]})
      let doctorsList = [];
      if (Array.isArray(response)) {
        doctorsList = response;
      } else if (response && response.success && response.data) {
        doctorsList = response.data;
      } else if (response && response.data && Array.isArray(response.data)) {
        doctorsList = response.data;
      }
      
      console.log(`📋 Total de registros recebidos: ${doctorsList.length}`);
      
      // Filtrar apenas médicos (profile='doctor') e disponíveis
      // O backend já deve ter filtrado por especialidade e is_available, mas vamos garantir
      const availableDoctors = doctorsList.filter(doctor => {
        const isDoctor = doctor.profile === 'doctor';
        const isAvailable = doctor.is_available === true || doctor.is_available === 1;
        const hasCorrectSpecialty = doctor.medical_specialty_id === formData.medicalSpecialtyId ||
                                   String(doctor.medical_specialty_id) === String(formData.medicalSpecialtyId);
        
        if (isDoctor) {
          console.log(`👨‍⚕️ Médico: ${doctor.name}`, {
            isAvailable,
            medical_specialty_id: doctor.medical_specialty_id,
            selectedSpecialtyId: formData.medicalSpecialtyId,
            hasCorrectSpecialty
          });
        }
        
        return isDoctor && isAvailable && hasCorrectSpecialty;
      });
      
      console.log(`✅ ${availableDoctors.length} médico(s) disponível(is) encontrado(s) na plataforma`);
      
      // Mapear para o formato esperado
      const doctorsFormatted = availableDoctors.map(doctor => ({
        id: doctor.id,
        name: doctor.name,
        email: doctor.email,
        crm: doctor.crm,
        photo: doctor.photo || doctor.photo_url,
        photo_url: doctor.photo_url || doctor.photo,
        medical_specialty_id: doctor.medical_specialty_id,
        medical_specialty: doctor.medical_specialty,
        average_rating: doctor.average_rating || null,
        total_reviews: doctor.total_reviews || 0,
        city: doctor.city,
        neighborhood: doctor.neighborhood,
        formation_details: doctor.formation_details,
        courses: doctor.courses || [],
      }));
      
      setDoctors(doctorsFormatted);
      console.log('📋 Médicos encontrados:', doctorsFormatted);
    } catch (error) {
      console.error('❌ Erro ao carregar médicos:', error);
      setDoctors([]);
    } finally {
      setLoadingDoctors(false);
    }
  };

  const loadDoctorAvailability = async (doctorId) => {
    try {
      setLoadingAvailability(true);
      console.log('📞 loadDoctorAvailability - Buscando agenda para médico ID:', doctorId);
      const response = await doctorService.getDoctorAvailability(doctorId);
      
      console.log('📥 loadDoctorAvailability - Resposta completa do backend:', JSON.stringify(response, null, 2));
      
      // Formato esperado: { availableDays: [], daySchedules: {} }
      if (response && response.success) {
        console.log('✅ loadDoctorAvailability - Resposta válida recebida:', {
          availableDaysCount: response.data?.availableDays?.length || 0,
          availableDays: response.data?.availableDays || [],
          daySchedulesKeys: response.data?.daySchedules ? Object.keys(response.data.daySchedules) : [],
          daySchedules: response.data?.daySchedules || {},
        });
        // Buscar consultas agendadas para este médico para filtrar horários ocupados
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - 1); // Incluir consultas de ontem também
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + 90); // Próximos 90 dias
        
        try {
          const appointmentsResult = await appointmentService.getAppointments(
            null, // groupId = null para buscar todas
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0]
          );
          
          // Criar mapa de horários agendados por data
          const bookedTimesByDate = {};
          const currentDoctorId = Number(doctorId); // ID do médico cuja agenda estamos carregando
          
          console.log('🔍 loadDoctorAvailability - Buscando consultas para médico:', {
            doctorId,
            currentDoctorId,
            totalAppointments: appointmentsResult.data?.length || 0,
          });
          
          if (appointmentsResult.success && appointmentsResult.data) {
            appointmentsResult.data.forEach((appointment) => {
              const appointmentDoctorId = appointment.doctor_id ? Number(appointment.doctor_id) : null;
              const doctorUserId = appointment.doctorUser?.id ? Number(appointment.doctorUser.id) : null;
              const appointmentDoctorIdFromRelation = appointment.doctor?.id ? Number(appointment.doctor.id) : null;
              
              // Verificar se a consulta é deste médico
              const isDoctorAppointment = 
                appointmentDoctorId === currentDoctorId || 
                doctorUserId === currentDoctorId || 
                appointmentDoctorIdFromRelation === currentDoctorId;
              
              if (isDoctorAppointment) {
                const appointmentDate = appointment.appointment_date || appointment.scheduled_at;
                if (appointmentDate) {
                  // Criar data a partir da string ISO
                  const dateObj = new Date(appointmentDate);
                  
                  // Usar métodos LOCAIS (não UTC) para extrair data e hora
                  // Isso garante que pegamos a data/hora no timezone local do dispositivo
                  const year = dateObj.getFullYear();
                  const month = dateObj.getMonth() + 1; // getMonth() retorna 0-11
                  const day = dateObj.getDate();
                  const hours = dateObj.getHours(); // getHours() retorna no timezone local
                  const minutes = dateObj.getMinutes(); // getMinutes() retorna no timezone local
                  
                  const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const time = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                  
                  if (!bookedTimesByDate[dateKey]) {
                    bookedTimesByDate[dateKey] = new Set();
                  }
                  bookedTimesByDate[dateKey].add(time);
                  
                  console.log('📅 loadDoctorAvailability - Horário agendado encontrado:', {
                    dateKey,
                    time,
                    appointmentId: appointment.id,
                    appointmentDate: appointmentDate,
                    extracted: { year, month, day, hours, minutes },
                    localDateString: dateObj.toLocaleString('pt-BR'),
                    appointmentDoctorId,
                    doctorUserId,
                    appointmentDoctorIdFromRelation,
                    currentDoctorId,
                  });
                }
              } else {
                // Log para debug - verificar por que consultas não estão sendo consideradas
                if (appointment.doctor_id || appointment.doctorUser || appointment.doctor) {
                  console.log('⚠️ loadDoctorAvailability - Consulta não é deste médico:', {
                    appointmentId: appointment.id,
                    appointmentDoctorId,
                    doctorUserId,
                    appointmentDoctorIdFromRelation,
                    currentDoctorId,
                    match: {
                      byDoctorId: appointmentDoctorId === currentDoctorId,
                      byDoctorUserId: doctorUserId === currentDoctorId,
                      byDoctorRelation: appointmentDoctorIdFromRelation === currentDoctorId,
                    },
                  });
                }
              }
            });
          }
          
          console.log('📊 loadDoctorAvailability - Horários agendados encontrados:', {
            bookedTimesByDate: Object.keys(bookedTimesByDate).reduce((acc, key) => {
              acc[key] = Array.from(bookedTimesByDate[key]);
              return acc;
            }, {}),
          });
          
          // Filtrar horários agendados da disponibilidade
          const filteredDaySchedules = {};
          const filteredAvailableDays = [];
          
          (response.data.availableDays || []).forEach((dateKey) => {
            const availableTimes = response.data.daySchedules?.[dateKey] || [];
            const bookedTimes = bookedTimesByDate[dateKey] || new Set();
            
            // Função para normalizar horário para formato HH:MM
            const normalizeTime = (timeStr) => {
              if (!timeStr) return '';
              const trimmed = timeStr.trim();
              
              // Se está no formato HH:MM:SS ou HH:MM:SS.SSS, remover os segundos
              if (/^\d{2}:\d{2}:\d{2}/.test(trimmed)) {
                return trimmed.substring(0, 5); // "08:00:00" -> "08:00"
              }
              
              // Se já está no formato HH:MM, retornar
              if (/^\d{2}:\d{2}$/.test(trimmed)) {
                return trimmed;
              }
              
              // Se está no formato H:MM, adicionar zero à esquerda
              if (/^\d{1}:\d{2}$/.test(trimmed)) {
                return `0${trimmed}`;
              }
              
              // Se está no formato HHMM, adicionar dois pontos
              if (/^\d{4}$/.test(trimmed)) {
                return `${trimmed.substring(0, 2)}:${trimmed.substring(2, 4)}`;
              }
              
              // Se está no formato HMM, adicionar zero e dois pontos
              if (/^\d{3}$/.test(trimmed)) {
                return `0${trimmed.substring(0, 1)}:${trimmed.substring(1, 3)}`;
              }
              
              return trimmed;
            };
            
            // Filtrar apenas horários não agendados
            const freeTimes = availableTimes.filter(time => {
              if (!time || time.trim() === '') return false;
              
              const normalizedAvailableTime = normalizeTime(time);
              
              // Verificar se o horário está agendado (comparar com todas as variações possíveis)
              let isBooked = false;
              
              if (bookedTimes.size > 0) {
                bookedTimes.forEach(bookedTime => {
                  if (!bookedTime) return;
                  
                  const normalizedBookedTime = normalizeTime(bookedTime);
                  
                  // Comparar horários normalizados (principal comparação)
                  if (normalizedAvailableTime === normalizedBookedTime && normalizedAvailableTime !== '') {
                    isBooked = true;
                    return;
                  }
                  
                  // Comparar também formatos originais
                  if (time === bookedTime) {
                    isBooked = true;
                    return;
                  }
                  
                  // Comparar normalizado com original
                  if (normalizedAvailableTime === bookedTime || time === normalizedBookedTime) {
                    isBooked = true;
                    return;
                  }
                  
                  // Comparar removendo zeros à esquerda (ex: "08:00" vs "8:00")
                  const removeLeadingZero = (t) => t.replace(/^0(\d:)/, '$1');
                  if (removeLeadingZero(normalizedAvailableTime) === removeLeadingZero(normalizedBookedTime)) {
                    isBooked = true;
                    return;
                  }
                });
              }
              
              if (isBooked) {
                console.log('🚫 Horário filtrado (agendado):', { 
                  dateKey, 
                  availableTime: time, 
                  normalizedAvailableTime,
                  bookedTimes: Array.from(bookedTimes),
                  bookedTimesNormalized: Array.from(bookedTimes).map(t => normalizeTime(t)),
                });
              }
              
              return !isBooked;
            });
            
            // Log detalhado para debug
            if (availableTimes.length > 0) {
              console.log('🔍 Comparação de horários para', dateKey, ':', {
                availableTimes,
                bookedTimes: Array.from(bookedTimes),
                bookedTimesNormalized: Array.from(bookedTimes).map(t => normalizeTime(t)),
                freeTimes,
                filteredCount: availableTimes.length - freeTimes.length,
                allNormalized: availableTimes.map(t => normalizeTime(t)),
              });
            }
            
            if (freeTimes.length > 0) {
              filteredAvailableDays.push(dateKey);
              filteredDaySchedules[dateKey] = freeTimes;
            } else {
              console.log('📅 Dia removido (sem horários disponíveis):', dateKey);
            }
          });
          
          console.log('📅 loadDoctorAvailability - Horários filtrados:', {
            originalDays: response.data.availableDays?.length || 0,
            filteredDays: filteredAvailableDays.length,
            bookedTimesByDate: Object.keys(bookedTimesByDate).reduce((acc, key) => {
              acc[key] = Array.from(bookedTimesByDate[key]);
              return acc;
            }, {}),
            filteredDaySchedules: Object.keys(filteredDaySchedules).reduce((acc, key) => {
              acc[key] = filteredDaySchedules[key];
              return acc;
            }, {}),
          });
          
          setDoctorAvailability({
            availableDays: filteredAvailableDays,
            daySchedules: filteredDaySchedules,
          });
        } catch (appointmentsError) {
          console.warn('⚠️ Erro ao buscar consultas agendadas, usando agenda completa:', appointmentsError);
          // Se houver erro ao buscar consultas, usar agenda completa
          console.log('📋 Usando agenda completa (sem filtrar consultas agendadas):', {
            availableDays: response.data?.availableDays || [],
            daySchedules: response.data?.daySchedules || {},
          });
          setDoctorAvailability(response.data);
        }
      } else {
        // Response não tem success: true ou estrutura diferente
        console.error('❌ loadDoctorAvailability - Resposta inválida ou sem success:', {
          response: response,
          hasSuccess: response?.success,
          hasData: !!response?.data,
        });
        
        // Mock data para desenvolvimento
        console.warn('⚠️ Endpoint de agenda não implementado ou retornou erro, usando dados mock');
        setDoctorAvailability({
          availableDays: ['2025-12-15', '2025-12-16', '2025-12-17'],
          daySchedules: {
            '2025-12-15': ['08:00', '09:00', '10:00', '14:00', '15:00'],
            '2025-12-16': ['08:00', '09:00', '14:00', '15:00', '16:00'],
            '2025-12-17': ['08:00', '10:00', '11:00', '14:00'],
          },
        });
      }
    } catch (error) {
      console.error('❌ Erro ao carregar agenda do médico:', error);
      console.error('❌ Detalhes do erro:', {
        message: error.message,
        stack: error.stack,
        response: error.response,
      });
      // Em caso de erro, usar dados mock
      console.warn('⚠️ Usando dados mock devido ao erro');
      setDoctorAvailability({
        availableDays: ['2025-12-15', '2025-12-16', '2025-12-17'],
        daySchedules: {
          '2025-12-15': ['08:00', '09:00', '10:00', '14:00', '15:00'],
          '2025-12-16': ['08:00', '09:00', '14:00', '15:00', '16:00'],
          '2025-12-17': ['08:00', '10:00', '11:00', '14:00'],
        },
      });
    } finally {
      setLoadingAvailability(false);
    }
  };

  const handleDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      updateField('date', date.toISOString());
    }
  };
  
  const handleAvailabilityDateSelect = (dateKey) => {
    setSelectedAvailabilityDate(dateKey);
    setSelectedAvailabilityTime(null); // Resetar horário ao mudar data
  };
  
  const handleAvailabilityTimeSelect = (time) => {
    setSelectedAvailabilityTime(time);
  };
  
  const handleConfirmAvailability = () => {
    if (!selectedAvailabilityDate || !selectedAvailabilityTime) {
      Alert.alert('Atenção', 'Por favor, selecione uma data e um horário disponível.');
      return;
    }
    
    // Verificar se o médico está selecionado (deve estar, pois a agenda só aparece após seleção)
    if (!formData.selectedDoctor || !formData.selectedDoctor.id) {
      Alert.alert('Erro', 'Médico não selecionado. Por favor, selecione um médico primeiro.');
      return;
    }
    
    // Combinar data e horário
    // Criar data no timezone local para evitar deslocamento de um dia
    // selectedAvailabilityDate está no formato "YYYY-MM-DD"
    const [year, month, day] = selectedAvailabilityDate.split('-').map(Number);
    const [hours, minutes] = selectedAvailabilityTime.split(':');
    
    // Criar data no timezone local (month é 0-indexed)
    const selectedDateTime = new Date(year, month - 1, day, parseInt(hours), parseInt(minutes), 0, 0);
    
    console.log('📅 handleConfirmAvailability - Data criada:', {
      selectedAvailabilityDate,
      selectedAvailabilityTime,
      year,
      month,
      day,
      hours,
      minutes,
      selectedDateTime: selectedDateTime.toISOString(),
      localDate: selectedDateTime.toLocaleString('pt-BR'),
    });
    
    // Atualizar data do compromisso e garantir que o tipo seja 'medical' se ainda não for
    if (formData.type !== 'medical') {
      updateField('type', 'medical');
    }
    
    // Garantir que is_teleconsultation seja true quando agenda disponível é usada
    if (!formData.isTeleconsultation) {
      updateField('isTeleconsultation', true);
    }
    
    updateField('date', selectedDateTime.toISOString());
    setAvailabilityModalVisible(false);
    setSelectedAvailabilityDate(null);
    setSelectedAvailabilityTime(null);
    
    Toast.show({
      type: 'success',
      text1: 'Data e horário selecionados',
      text2: `${selectedAvailabilityDate} às ${selectedAvailabilityTime}`,
    });
  };

  const handleRecurrenceEndChange = (event, date) => {
    setShowRecurrenceEndPicker(false);
    if (date) {
      // Validar que a data não ultrapasse 3 meses
      const startDate = new Date(formData.date);
      const maxDate = new Date(startDate);
      maxDate.setMonth(maxDate.getMonth() + 3);
      
      if (date > maxDate) {
        Alert.alert(
          'Data Inválida',
          'A data final não pode ser superior a 3 meses após a data inicial.',
        );
        return;
      }
      
      updateField('recurrenceEnd', date.toISOString());
    }
  };

  const handleTimeChange = (event, time) => {
    setShowTimePicker(false);
    if (time) {
      const newDate = new Date(selectedDate);
      newDate.setHours(time.getHours());
      newDate.setMinutes(time.getMinutes());
      setSelectedDate(newDate);
      updateField('date', newDate.toISOString());
    }
  };

  const openGoogleMaps = () => {
    if (!formData.address) {
      Alert.alert('Atenção', 'Digite um endereço primeiro');
      return;
    }
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formData.address)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Erro', 'Não foi possível abrir o Google Maps');
    });
  };

  const openWaze = () => {
    if (!formData.address) {
      Alert.alert('Atenção', 'Digite um endereço primeiro');
      return;
    }
    const url = `https://waze.com/ul?q=${encodeURIComponent(formData.address)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Erro', 'Não foi possível abrir o Waze');
    });
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Atenção', 'Digite um título para o compromisso');
      return;
    }

    if (!groupId) {
      Alert.alert('Erro', 'ID do grupo não foi fornecido. Por favor, volte e tente novamente.');
      return;
    }

    // Validar se teleconsulta requer médico selecionado
    if (formData.isTeleconsultation && !formData.selectedDoctor) {
      Alert.alert('Atenção', 'Para teleconsulta, é necessário selecionar um médico.');
      return;
    }

    // Validar se o horário ainda está disponível (evitar duplicatas)
    // Esta validação é uma camada extra de segurança, mas a filtragem principal deve garantir
    // que apenas horários disponíveis apareçam na modal
    if (formData.isTeleconsultation && formData.selectedDoctor?.id && formData.date) {
      const appointmentDate = new Date(formData.date);
      const dateKey = `${appointmentDate.getFullYear()}-${String(appointmentDate.getMonth() + 1).padStart(2, '0')}-${String(appointmentDate.getDate()).padStart(2, '0')}`;
      const time = `${String(appointmentDate.getHours()).padStart(2, '0')}:${String(appointmentDate.getMinutes()).padStart(2, '0')}`;
      
      const availableTimes = doctorAvailability.daySchedules?.[dateKey] || [];
      
      // Função de normalização mais robusta (mesma usada na filtragem)
      const normalizeTime = (t) => {
        if (!t) return '';
        const trimmed = t.trim();
        
        // Se está no formato HH:MM:SS ou HH:MM:SS.SSS, remover os segundos
        if (/^\d{2}:\d{2}:\d{2}/.test(trimmed)) {
          return trimmed.substring(0, 5); // "08:00:00" -> "08:00"
        }
        
        if (/^\d{2}:\d{2}$/.test(trimmed)) return trimmed;
        if (/^\d{1}:\d{2}$/.test(trimmed)) return `0${trimmed}`;
        if (/^\d{4}$/.test(trimmed)) return `${trimmed.substring(0, 2)}:${trimmed.substring(2, 4)}`;
        if (/^\d{3}$/.test(trimmed)) return `0${trimmed.substring(0, 1)}:${trimmed.substring(1, 3)}`;
        return trimmed;
      };
      
      const normalizedBookedTime = normalizeTime(time);
      const isStillAvailable = availableTimes.some(availableTime => {
        if (!availableTime) return false;
        const normalizedAvailable = normalizeTime(availableTime);
        
        // Comparar de múltiplas formas
        if (normalizedAvailable === normalizedBookedTime && normalizedAvailable !== '') {
          return true;
        }
        if (availableTime === time) {
          return true;
        }
        if (normalizedAvailable === time || availableTime === normalizedBookedTime) {
          return true;
        }
        
        // Comparar removendo zeros à esquerda
        const removeLeadingZero = (t) => t.replace(/^0(\d:)/, '$1');
        if (removeLeadingZero(normalizedAvailable) === removeLeadingZero(normalizedBookedTime)) {
          return true;
        }
        
        return false;
      });
      
      if (!isStillAvailable) {
        console.warn('⚠️ handleSave - Horário não está mais disponível:', {
          dateKey,
          time,
          normalizedTime: normalizedBookedTime,
          availableTimes,
          availableTimesNormalized: availableTimes.map(t => normalizeTime(t)),
        });
        
        Alert.alert(
          'Horário Indisponível',
          'Este horário não está mais disponível. Por favor, selecione outro horário.',
        );
        return;
      }
    }

    // Validar data final de recorrência (máximo 3 meses)
    if (formData.recurrenceType !== 'none' && formData.recurrenceEnd) {
      const startDate = new Date(formData.date);
      const endDate = new Date(formData.recurrenceEnd);
      const maxDate = new Date(startDate);
      maxDate.setMonth(maxDate.getMonth() + 3);
      
      if (endDate > maxDate) {
        Alert.alert(
          'Data Inválida',
          'A data final não pode ser superior a 3 meses após a data inicial.',
        );
        return;
      }
    }

    setLoading(true);

    try {
      // Preparar dados para API
      const doctorId = formData.selectedDoctor?.id || null;
      
      console.log('📤 Preparando dados do compromisso:', {
        selectedDoctor: formData.selectedDoctor,
        doctorId: doctorId,
        type: formData.type,
        isTeleconsultation: formData.isTeleconsultation,
        date: formData.date,
      });
      
      const appointmentData = {
        group_id: parseInt(groupId), // Converter para número
        title: formData.title.trim(),
        type: formData.type, // ADICIONADO: tipo do compromisso
        description: formData.notes.trim() || null,
        scheduled_at: formData.date,
        appointment_date: formData.date, // Backend espera este campo também
        doctor_id: doctorId, // ID do médico (obrigatório para consultas médicas)
        medical_specialty_id: formData.medicalSpecialtyId || null, // Especialidade médica
        is_teleconsultation: formData.isTeleconsultation || false, // Teleconsulta
        location: formData.address.trim() || null,
        notes: formData.notes.trim() || null,
        // Dados de recorrência
        recurrence_type: formData.recurrenceType !== 'none' ? formData.recurrenceType : null,
        recurrence_days: formData.recurrenceType === 'custom' && formData.recurrenceDays.length > 0 
          ? JSON.stringify(formData.recurrenceDays) 
          : null,
        recurrence_start: formData.recurrenceType !== 'none' ? formData.date : null,
        recurrence_end: formData.recurrenceType !== 'none' && formData.recurrenceEnd 
          ? formData.recurrenceEnd 
          : null,
      };

      console.log('📤 Salvando compromisso:', appointmentData);
      console.log('📋 Tipo selecionado:', formData.type);
      console.log('👨‍⚕️ Doctor ID:', doctorId);

      let result;
      if (isEditing && appointmentId) {
        // Atualizar compromisso existente
        result = await appointmentService.updateAppointment(appointmentId, {
          title: formData.title.trim(),
          type: formData.type,
          description: formData.notes.trim() || null,
          scheduledAt: formData.date,
          appointmentDate: formData.date,
          doctorId: formData.selectedDoctor?.id || null,
          medicalSpecialtyId: formData.medicalSpecialtyId || null,
          isTeleconsultation: formData.isTeleconsultation || false,
          location: formData.address.trim() || null,
          notes: formData.notes.trim() || null,
        });
      } else {
        // Criar novo compromisso
        result = await appointmentService.createAppointment(appointmentData);
      }

      if (result.success) {
        // Se foi uma teleconsulta com agenda disponível, remover o horário agendado imediatamente
        if (formData.isTeleconsultation && formData.selectedDoctor?.id) {
          console.log('🔄 Removendo horário agendado da disponibilidade...');
          
          // Remover o horário agendado do estado imediatamente
          const appointmentDate = new Date(formData.date);
          const dateKey = `${appointmentDate.getFullYear()}-${String(appointmentDate.getMonth() + 1).padStart(2, '0')}-${String(appointmentDate.getDate()).padStart(2, '0')}`;
          const time = `${String(appointmentDate.getHours()).padStart(2, '0')}:${String(appointmentDate.getMinutes()).padStart(2, '0')}`;
          
          console.log('📅 Removendo horário:', { dateKey, time });
          
          // Atualizar estado imediatamente removendo o horário agendado
          setDoctorAvailability(prevAvailability => {
            const updatedDaySchedules = { ...prevAvailability.daySchedules };
            const updatedAvailableDays = [...(prevAvailability.availableDays || [])];
            
            if (updatedDaySchedules[dateKey]) {
              // Filtrar o horário agendado
              updatedDaySchedules[dateKey] = updatedDaySchedules[dateKey].filter(
                availableTime => {
                  // Normalizar horários para comparação
                  const normalizeTime = (t) => {
                    if (!t) return '';
                    const trimmed = t.trim();
                    if (/^\d{2}:\d{2}$/.test(trimmed)) return trimmed;
                    if (/^\d{1}:\d{2}$/.test(trimmed)) return `0${trimmed}`;
                    return trimmed;
                  };
                  
                  const normalizedAvailable = normalizeTime(availableTime);
                  const normalizedBooked = normalizeTime(time);
                  
                  const isMatch = normalizedAvailable === normalizedBooked || 
                                 availableTime === time || 
                                 availableTime === normalizedBooked ||
                                 normalizedAvailable === time;
                  
                  if (isMatch) {
                    console.log('🚫 Removendo horário da disponibilidade:', { 
                      dateKey, 
                      availableTime, 
                      bookedTime: time 
                    });
                  }
                  
                  return !isMatch;
                }
              );
              
              // Se não há mais horários disponíveis neste dia, remover o dia
              if (updatedDaySchedules[dateKey].length === 0) {
                delete updatedDaySchedules[dateKey];
                const dayIndex = updatedAvailableDays.indexOf(dateKey);
                if (dayIndex > -1) {
                  updatedAvailableDays.splice(dayIndex, 1);
                }
              }
            }
            
            return {
              availableDays: updatedAvailableDays,
              daySchedules: updatedDaySchedules,
            };
          });
          
          // Também recarregar a agenda completa para garantir sincronização
          setTimeout(async () => {
            console.log('🔄 Recarregando agenda completa após agendamento...');
            await loadDoctorAvailability(formData.selectedDoctor.id);
          }, 500);
        }
        
        Toast.show({
          type: 'success',
          text1: isEditing ? '✅ Compromisso atualizado!' : '✅ Compromisso agendado!',
          text2: `${formData.title} foi ${isEditing ? 'atualizado' : 'cadastrado'} com sucesso`,
          position: 'bottom',
        });
        navigation.goBack();
      } else {
        console.error('Erro da API:', result.error);
        Alert.alert('Erro', result.error || 'Não foi possível agendar o compromisso');
      }
    } catch (error) {
      console.error('Erro ao agendar compromisso:', error);
      Alert.alert('Erro', error.message || 'Erro ao agendar compromisso');
    } finally {
      setLoading(false);
    }
  };

  const recurrenceOptions = [
    { value: 'none', label: 'Não se repete' },
    { value: 'daily', label: 'Diariamente' },
    { value: 'weekdays', label: 'Segunda a Sexta' },
    { value: 'custom', label: 'Personalizado' },
  ];

  const reminderOptions = [
    { value: '1', label: '24h, 3h, 1h e 15min antes' },
    { value: '2', label: '3h, 1h e 15min antes' },
    { value: '3', label: '1h e 15min antes' },
    { value: '4', label: '15min antes' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <CloseIcon size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Novo Compromisso</Text>
            <Text style={styles.headerSubtitle}>{groupName || 'Grupo'}</Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
          <View style={styles.content}>
            {/* Ícone */}
            <View style={styles.iconContainer}>
              <AppointmentIcon size={48} color={colors.primary} />
            </View>

            <Text style={styles.title}>
              {isEditing ? 'Editar Compromisso' : 'Agendar Compromisso'}
            </Text>
            <Text style={styles.subtitle}>
              {isEditing 
                ? 'Edite as informações do compromisso'
                : 'Crie um compromisso ou consulta médica para o acompanhado'}
            </Text>

            {/* Título */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Título *</Text>
              <View style={styles.inputWrapper}>
                <TextOutlineIcon size={20} color={colors.gray400} />
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Consulta com Dr. João"
                  value={formData.title}
                  onChangeText={(value) => updateField('title', value)}
                />
              </View>
            </View>

            {/* Tipo */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Tipo de Compromisso *</Text>
              
              {/* Linha 1: Médico e Comum */}
              <View style={styles.typeContainer}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    formData.type === 'medical' && styles.typeButtonActive,
                  ]}
                  onPress={() => updateField('type', 'medical')}
                >
                  <MedicalOutlineIcon
                    size={24}
                    color={formData.type === 'medical' ? colors.secondary : colors.gray400}
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      formData.type === 'medical' && styles.typeButtonTextActive,
                    ]}
                  >
                    Médico
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    formData.type === 'common' && styles.typeButtonActive,
                  ]}
                  onPress={() => updateField('type', 'common')}
                >
                  <CalendarIcon
                    size={24}
                    color={formData.type === 'common' ? colors.primary : colors.gray400}
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      formData.type === 'common' && styles.typeButtonTextActive,
                    ]}
                  >
                    Comum
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Linha 2: Fisioterapia e Exames */}
              <View style={styles.typeContainer}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    formData.type === 'fisioterapia' && styles.typeButtonActive,
                  ]}
                  onPress={() => updateField('type', 'fisioterapia')}
                >
                  <FitnessOutlineIcon
                    size={24}
                    color={formData.type === 'fisioterapia' ? colors.success : colors.gray400}
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      formData.type === 'fisioterapia' && styles.typeButtonTextActive,
                    ]}
                  >
                    Fisioterapia
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    formData.type === 'exames' && styles.typeButtonActive,
                  ]}
                  onPress={() => updateField('type', 'exames')}
                >
                  <FlaskOutlineIcon
                    size={24}
                    color={formData.type === 'exames' ? colors.info : colors.gray400}
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      formData.type === 'exames' && styles.typeButtonTextActive,
                    ]}
                  >
                    Exames
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Especialidade Médica - apenas para compromissos médicos */}
            {formData.type === 'medical' && (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Especialidade Médica</Text>
                  <TouchableOpacity
                    style={styles.inputWrapper}
                    onPress={() => setSpecialtyModalVisible(true)}
                  >
                    <MedicalOutlineIcon size={20} color={colors.gray400} />
                    <Text style={[
                      styles.input,
                      !formData.medicalSpecialtyId && styles.placeholder
                    ]}>
                      {formData.medicalSpecialtyId
                        ? specialties.find(s => s.id === formData.medicalSpecialtyId)?.name
                        : 'Selecione a especialidade...'}
                    </Text>
                    <ChevronDownIcon size={20} color={colors.gray400} />
                  </TouchableOpacity>
                </View>

                {/* Teleconsulta */}
                <View style={styles.switchContainer}>
                  <View style={styles.switchLabelContainer}>
                    <VideoCamOutlineIcon size={20} color={colors.text} />
                    <Text style={styles.switchLabel}>Teleconsulta</Text>
                  </View>
                  <Switch
                    value={formData.isTeleconsultation}
                    onValueChange={(value) => {
                      updateField('isTeleconsultation', value);
                      if (!value) {
                        // Se desmarcar teleconsulta, limpar médico selecionado
                        updateField('selectedDoctor', null);
                      }
                    }}
                    trackColor={{ false: colors.gray300, true: colors.primary + '80' }}
                    thumbColor={formData.isTeleconsultation ? colors.primary : colors.gray400}
                    ios_backgroundColor={colors.gray300}
                  />
                </View>

                {/* Seleção de Médico - apenas para teleconsulta */}
                {formData.isTeleconsultation && formData.medicalSpecialtyId && (
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Selecione o Médico *</Text>
                    {loadingDoctors ? (
                      <View style={styles.loadingDoctorsContainer}>
                        <ActivityIndicator size="small" color={colors.primary} />
                        <Text style={styles.loadingDoctorsText}>Carregando médicos...</Text>
                      </View>
                    ) : doctors.length > 0 ? (
                      <TouchableOpacity
                        style={styles.inputWrapper}
                        onPress={() => setDoctorModalVisible(true)}
                      >
                        {formData.selectedDoctor ? (
                          <View style={styles.selectedDoctorPreview}>
                            {formData.selectedDoctor.photo || formData.selectedDoctor.photo_url ? (
                              <Image
                                source={{ uri: formData.selectedDoctor.photo_url || formData.selectedDoctor.photo }}
                                style={styles.doctorThumbnail}
                              />
                            ) : (
                              <View style={styles.doctorThumbnailPlaceholder}>
                                <PersonIcon size={20} color={colors.gray400} />
                              </View>
                            )}
                            <Text style={styles.input} numberOfLines={1}>
                              {formData.selectedDoctor.name}
                            </Text>
                          </View>
                        ) : (
                          <>
                            <PersonIcon size={20} color={colors.gray400} />
                            <Text style={[styles.input, styles.placeholder]}>
                              Selecione o médico...
                            </Text>
                          </>
                        )}
                        <ChevronDownIcon size={20} color={colors.gray400} />
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.noDoctorsContainer}>
                        <AlertCircleOutlineIcon size={20} color={colors.warning} />
                        <Text style={styles.noDoctorsText}>
                          Nenhum médico encontrado para esta especialidade
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </>
            )}

            {/* Data e Hora - Ocultar se for teleconsulta */}
            {!formData.isTeleconsultation && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Data e Hora *</Text>
              
              <View style={styles.dateTimeRow}>
                  {/* Data */}
                  <TouchableOpacity 
                    style={[
                      styles.inputWrapper, 
                      { flex: 1 },
                      formData.recurrenceType !== 'none' && styles.inputWrapperDisabled
                    ]}
                    onPress={() => {
                      if (formData.recurrenceType === 'none') {
                        setShowDatePicker(true);
                      }
                    }}
                    disabled={formData.recurrenceType !== 'none'}
                  >
                    <CalendarIcon size={20} color={colors.gray400} />
                    <Text style={styles.dateText}>
                      {new Date(formData.date).toLocaleDateString('pt-BR')}
                    </Text>
                    {formData.recurrenceType === 'none' && (
                      <EditIcon size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>

                  {/* Hora */}
                  <TouchableOpacity 
                    style={[
                      styles.inputWrapper, 
                      { flex: 1 },
                      formData.recurrenceType !== 'none' && styles.inputWrapperDisabled
                    ]}
                    onPress={() => {
                      if (formData.recurrenceType === 'none') {
                        setShowTimePicker(true);
                      }
                    }}
                    disabled={formData.recurrenceType !== 'none'}
                  >
                    <TimeIcon size={20} color={colors.gray400} />
                    <Text style={styles.dateText}>
                      {new Date(formData.date).toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Text>
                    {formData.recurrenceType === 'none' && (
                      <EditIcon size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                </View>
              
              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                />
              )}
              
              {showTimePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleTimeChange}
                  is24Hour={true}
                />
              )}
            </View>
            )}

            {/* Recorrência - Ocultar se for teleconsulta */}
            {!formData.isTeleconsultation && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Recorrência</Text>
              {recurrenceOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.radioOption}
                  onPress={() => updateField('recurrenceType', option.value)}
                >
                  <View style={[
                    styles.radio,
                    formData.recurrenceType === option.value && styles.radioActive,
                  ]}>
                    {formData.recurrenceType === option.value && (
                      <View style={styles.radioDot} />
                    )}
                  </View>
                  <Text style={styles.radioLabel}>{option.label}</Text>
                </TouchableOpacity>
              ))}

              {/* Campo "Até quando" para recorrências */}
              {(formData.recurrenceType === 'daily' || 
                formData.recurrenceType === 'weekdays' || 
                formData.recurrenceType === 'custom') && (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Até quando *</Text>
                  <TouchableOpacity 
                    style={styles.inputWrapper}
                    onPress={() => setShowRecurrenceEndPicker(true)}
                  >
                    <CalendarIcon size={20} color={colors.gray400} />
                    <Text style={styles.dateText}>
                      {formData.recurrenceEnd 
                        ? new Date(formData.recurrenceEnd).toLocaleDateString('pt-BR')
                        : 'Selecione a data final'}
                    </Text>
                    <EditIcon size={20} color={colors.primary} />
                  </TouchableOpacity>
                  {showRecurrenceEndPicker && (
                    <DateTimePicker
                      value={formData.recurrenceEnd ? new Date(formData.recurrenceEnd) : new Date()}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={handleRecurrenceEndChange}
                      minimumDate={new Date(formData.date)}
                      maximumDate={(() => {
                        const maxDate = new Date(formData.date);
                        maxDate.setMonth(maxDate.getMonth() + 3); // 3 meses após a data inicial
                        return maxDate;
                      })()}
                    />
                  )}
                </View>
              )}

              {/* Checkboxes de dias da semana para Personalizado */}
              {formData.recurrenceType === 'custom' && (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Dias da Semana *</Text>
                  <View style={styles.weekDaysContainer}>
                    {[
                      { value: 0, label: 'Dom' },
                      { value: 1, label: 'Seg' },
                      { value: 2, label: 'Ter' },
                      { value: 3, label: 'Qua' },
                      { value: 4, label: 'Qui' },
                      { value: 5, label: 'Sex' },
                      { value: 6, label: 'Sáb' },
                    ].map((day) => {
                      const isSelected = formData.recurrenceDays.includes(day.value);
                      return (
                        <TouchableOpacity
                          key={day.value}
                          style={[
                            styles.dayCheckbox,
                            isSelected && styles.dayCheckboxActive,
                          ]}
                          onPress={() => {
                            const newDays = isSelected
                              ? formData.recurrenceDays.filter(d => d !== day.value)
                              : [...formData.recurrenceDays, day.value].sort();
                            updateField('recurrenceDays', newDays);
                          }}
                        >
                          <Text style={[
                            styles.dayCheckboxText,
                            isSelected && styles.dayCheckboxTextActive,
                          ]}>
                            {day.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
            )}

            {/* Endereço com Autocomplete - Ocultar se for teleconsulta */}
            {!formData.isTeleconsultation && (
            <View style={styles.inputContainer}>
              <View style={styles.labelWithHelp}>
                <Text style={styles.label}>Endereço (opcional)</Text>
                {GOOGLE_MAPS_CONFIG.API_KEY === 'SUA_API_KEY_AQUI' && (
                  <TouchableOpacity 
                    onPress={checkGoogleMapsConfig}
                    style={styles.helpButton}
                  >
                    <InformationCircleIcon size={20} color={colors.warning} />
                  </TouchableOpacity>
                )}
              </View>
              
              {GOOGLE_MAPS_CONFIG.API_KEY !== 'SUA_API_KEY_AQUI' ? (
                // Autocomplete do Google (quando configurado)
                <View style={styles.autocompleteContainer}>
                  <GooglePlacesAutocomplete
                    ref={googlePlacesRef}
                    placeholder="Digite o endereço..."
                    fetchDetails={true}
                    onPress={(data, details = null) => {
                      try {
                        if (data && data.description) {
                          updateField('address', data.description);
                        } else if (details && details.formatted_address) {
                          updateField('address', details.formatted_address);
                        } else {
                          console.warn('Dados do endereço incompletos:', { data, details });
                        }
                      } catch (error) {
                        console.error('Erro ao processar endereço do Google:', error);
                        Toast.show({
                          type: 'error',
                          text1: 'Erro ao selecionar endereço',
                          text2: 'Tente digitar manualmente',
                          position: 'bottom',
                        });
                      }
                    }}
                    onFail={(error) => {
                      console.error('Erro no Google Places:', error);
                    }}
                    query={{
                      key: GOOGLE_MAPS_CONFIG.API_KEY,
                      language: GOOGLE_MAPS_CONFIG.language,
                      components: 'country:br',
                    }}
                    enablePoweredByContainer={false}
                    debounce={400}
                    styles={{
                      container: {
                        flex: 0,
                      },
                      textInputContainer: {
                        backgroundColor: colors.backgroundLight,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: colors.border,
                        paddingHorizontal: 8,
                      },
                      textInput: {
                        height: 52,
                        color: colors.text,
                        fontSize: 16,
                        backgroundColor: 'transparent',
                      },
                      predefinedPlacesDescription: {
                        color: colors.primary,
                      },
                      listView: {
                        backgroundColor: colors.backgroundLight,
                        borderRadius: 12,
                        marginTop: 8,
                        borderWidth: 1,
                        borderColor: colors.border,
                      },
                      row: {
                        backgroundColor: colors.backgroundLight,
                        paddingVertical: 12,
                        paddingHorizontal: 12,
                      },
                      separator: {
                        height: 1,
                        backgroundColor: colors.border,
                      },
                      description: {
                        color: colors.text,
                        fontSize: 14,
                      },
                      poweredContainer: {
                        backgroundColor: colors.backgroundLight,
                        paddingVertical: 4,
                      },
                    }}
                    textInputProps={{
                      placeholderTextColor: colors.placeholder,
                      value: formData.address,
                      onChangeText: (text) => updateField('address', text),
                    }}
                    enablePoweredByContainer={true}
                    nearbyPlacesAPI="GooglePlacesSearch"
                    debounce={400}
                    minLength={3}
                  />
                </View>
              ) : (
                // Campo manual (fallback quando API Key não configurada)
                <View style={styles.inputWrapper}>
                  <LocationIcon size={20} color={colors.gray400} />
                  <TextInput
                    style={styles.input}
                    placeholder="Digite o endereço manualmente"
                    value={formData.address}
                    onChangeText={(value) => updateField('address', value)}
                    multiline
                  />
                </View>
              )}
              
              {formData.address.trim() && (
                <View style={styles.mapButtons}>
                  <TouchableOpacity 
                    style={styles.mapButton}
                    onPress={openGoogleMaps}
                  >
                    <NavigateIcon size={16} color={colors.info} />
                    <Text style={styles.mapButtonText}>Google Maps</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.mapButton}
                    onPress={openWaze}
                  >
                    <NavigateIcon size={16} color={colors.info} />
                    <Text style={styles.mapButtonText}>Waze</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            )}

            {/* Lembretes */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Lembretes</Text>
              {reminderOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.radioOption}
                  onPress={() => updateField('reminderOption', option.value)}
                >
                  <View style={[
                    styles.radio,
                    formData.reminderOption === option.value && styles.radioActive,
                  ]}>
                    {formData.reminderOption === option.value && (
                      <View style={styles.radioDot} />
                    )}
                  </View>
                  <Text style={styles.radioLabel}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Observações */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Observações</Text>
              <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Adicione observações..."
                  value={formData.notes}
                  onChangeText={(value) => updateField('notes', value)}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>

            {/* Info Card */}
            <View style={styles.infoCard}>
              <InformationCircleIcon size={24} color={colors.info} />
              <View style={styles.infoContent}>
                <Text style={styles.infoText}>
                  Os lembretes serão enviados mesmo se o app estiver fechado. 
                  Compromissos médicos habilitam a gravação de áudio durante a consulta.
                </Text>
              </View>
            </View>

            {/* Botão Salvar */}
            <TouchableOpacity
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <Text style={styles.saveButtonText}>Salvando...</Text>
              ) : (
                <>
                  <CheckmarkCircleIcon size={20} color={colors.textWhite} />
                  <Text style={styles.saveButtonText}>
                    {isEditing ? 'Salvar Alterações' : 'Agendar Compromisso'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </View>
        </ScrollView>

        {/* Modal de Especialidades */}
        <Modal
          visible={specialtyModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setSpecialtyModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Selecione a Especialidade</Text>
                <TouchableOpacity
                  onPress={() => setSpecialtyModalVisible(false)}
                  style={styles.modalCloseButton}
                >
                  <CloseIcon size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={specialties}
                keyExtractor={(item) => item.id.toString()}
                style={styles.flatList}
                contentContainerStyle={styles.flatListContent}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.specialtyItem,
                      formData.medicalSpecialtyId === item.id && styles.specialtyItemSelected
                    ]}
                    onPress={() => {
                      updateField('medicalSpecialtyId', item.id);
                      setSpecialtyModalVisible(false);
                    }}
                  >
                    <Text style={[
                      styles.specialtyItemText,
                      formData.medicalSpecialtyId === item.id && styles.specialtyItemTextSelected
                    ]}>
                      {item.name}
                    </Text>
                    {formData.medicalSpecialtyId === item.id && (
                      <CheckmarkIcon size={24} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            </View>
          </View>
        </Modal>

        {/* Modal de Seleção de Médicos */}
        <Modal
          visible={doctorModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setDoctorModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Selecione o Médico</Text>
                <TouchableOpacity
                  onPress={() => setDoctorModalVisible(false)}
                  style={styles.modalCloseButton}
                >
                  <CloseIcon size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={doctors}
                keyExtractor={(item) => item.id.toString()}
                style={styles.flatList}
                contentContainerStyle={styles.flatListContent}
                renderItem={({ item }) => {
                  const renderStars = (rating) => {
                    if (!rating || rating === 0) return null;
                    const stars = [];
                    const fullStars = Math.floor(rating);
                    const hasHalfStar = rating % 1 >= 0.5;

                    for (let i = 0; i < fullStars; i++) {
                      stars.push(
                        <StarIcon key={i} size={14} color={colors.warning} />
                      );
                    }

                    if (hasHalfStar) {
                      stars.push(
                        <StarHalfIcon key="half" size={14} color={colors.warning} />
                      );
                    }

                    const emptyStars = 5 - Math.ceil(rating);
                    for (let i = 0; i < emptyStars; i++) {
                      stars.push(
                        <StarOutlineIcon key={`empty-${i}`} size={14} color={colors.gray400} />
                      );
                    }

                    return <View style={styles.starsContainer}>{stars}</View>;
                  };

                  return (
                    <View style={styles.doctorItemContainer}>
                      <TouchableOpacity
                        style={[
                          styles.doctorItem,
                          formData.selectedDoctor?.id === item.id && styles.doctorItemSelected
                        ]}
                        onPress={async () => {
                          updateField('selectedDoctor', item);
                          setDoctorModalVisible(false);
                          // Se for teleconsulta, buscar agenda do médico e abrir modal de seleção
                          if (formData.isTeleconsultation) {
                            await loadDoctorAvailability(item.id);
                            setTimeout(() => {
                              setAvailabilityModalVisible(true);
                            }, 300);
                          }
                        }}
                      >
                        <View style={styles.doctorItemLeft}>
                          {item.photo || item.photo_url ? (
                            <Image
                              source={{ uri: item.photo_url || item.photo }}
                              style={styles.doctorItemThumbnail}
                            />
                          ) : (
                            <View style={styles.doctorItemThumbnailPlaceholder}>
                              <PersonIcon size={24} color={colors.gray400} />
                            </View>
                          )}
                          <View style={styles.doctorItemInfo}>
                            <Text style={[
                              styles.doctorItemName,
                              formData.selectedDoctor?.id === item.id && styles.doctorItemNameSelected
                            ]}>
                              {item.name}
                            </Text>
                            {item.crm && (
                              <Text style={styles.doctorItemCrm}>CRM: {formatCrmDisplay(item.crm)}</Text>
                            )}
                            {item.average_rating && (
                              <View style={styles.ratingContainer}>
                                {renderStars(item.average_rating)}
                                <Text style={styles.ratingText}>
                                  {item.average_rating.toFixed(1)} ({item.total_reviews || 0} avaliações)
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                        {formData.selectedDoctor?.id === item.id && (
                          <CheckmarkCircleIcon size={24} color={colors.primary} />
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.doctorDetailsButton}
                        onPress={() => {
                          setSelectedDoctorDetails(item);
                          setDoctorDetailsModalVisible(true);
                        }}
                      >
                        <InformationCircleOutlineIcon size={20} color={colors.primary} />
                        <Text style={styles.doctorDetailsButtonText}>Ver detalhes</Text>
                      </TouchableOpacity>
                    </View>
                  );
                }}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            </View>
          </View>
        </Modal>

        {/* Modal de Detalhes do Médico */}
        <Modal
          visible={doctorDetailsModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setDoctorDetailsModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Dados Profissionais</Text>
                <TouchableOpacity
                  onPress={() => setDoctorDetailsModalVisible(false)}
                  style={styles.modalCloseButton}
                >
                  <CloseIcon size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              <ScrollView 
                style={styles.doctorDetailsScroll}
                showsVerticalScrollIndicator={false}
              >
                {selectedDoctorDetails && (
                  <View style={styles.doctorDetailsContent}>
                    {/* Foto e Nome */}
                    <View style={styles.doctorDetailsHeader}>
                      {selectedDoctorDetails.photo || selectedDoctorDetails.photo_url ? (
                        <Image
                          source={{ uri: selectedDoctorDetails.photo_url || selectedDoctorDetails.photo }}
                          style={styles.doctorDetailsPhoto}
                        />
                      ) : (
                        <View style={styles.doctorDetailsPhotoPlaceholder}>
                          <PersonIcon size={48} color={colors.gray400} />
                        </View>
                      )}
                      <Text style={styles.doctorDetailsName}>{selectedDoctorDetails.name}</Text>
                      {selectedDoctorDetails.crm && (
                        <Text style={styles.doctorDetailsCrm}>CRM: {formatCrmDisplay(selectedDoctorDetails.crm)}</Text>
                      )}
                      {selectedDoctorDetails.average_rating && (
                        <View style={styles.doctorDetailsRating}>
                          {(() => {
                            const stars = [];
                            const fullStars = Math.floor(selectedDoctorDetails.average_rating);
                            const hasHalfStar = selectedDoctorDetails.average_rating % 1 >= 0.5;

                            for (let i = 0; i < fullStars; i++) {
                              stars.push(
                                <StarIcon key={i} size={20} color={colors.warning} />
                              );
                            }

                            if (hasHalfStar) {
                              stars.push(
                                <StarHalfIcon key="half" size={20} color={colors.warning} />
                              );
                            }

                            const emptyStars = 5 - Math.ceil(selectedDoctorDetails.average_rating);
                            for (let i = 0; i < emptyStars; i++) {
                              stars.push(
                                <StarOutlineIcon key={`empty-${i}`} size={20} color={colors.gray400} />
                              );
                            }

                            return <View style={styles.starsContainer}>{stars}</View>;
                          })()}
                          <Text style={styles.doctorDetailsRatingText}>
                            {selectedDoctorDetails.average_rating.toFixed(1)} ({selectedDoctorDetails.total_reviews || 0} avaliações)
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Especialidade */}
                    {selectedDoctorDetails.medical_specialty && (
                      <View style={styles.doctorDetailsSection}>
                        <Text style={styles.doctorDetailsLabel}>Especialidade</Text>
                        <Text style={styles.doctorDetailsValue}>
                          {selectedDoctorDetails.medical_specialty.name || selectedDoctorDetails.medical_specialty}
                        </Text>
                      </View>
                    )}

                    {/* Localização */}
                    {(selectedDoctorDetails.city || selectedDoctorDetails.neighborhood) && (
                      <View style={styles.doctorDetailsSection}>
                        <Text style={styles.doctorDetailsLabel}>Localização</Text>
                        <Text style={styles.doctorDetailsValue}>
                          {[selectedDoctorDetails.city, selectedDoctorDetails.neighborhood]
                            .filter(Boolean)
                            .join(', ')}
                        </Text>
                      </View>
                    )}

                    {/* Formação */}
                    {selectedDoctorDetails.formation_details && (
                      <View style={styles.doctorDetailsSection}>
                        <Text style={styles.doctorDetailsLabel}>Formação</Text>
                        <Text style={styles.doctorDetailsValue}>
                          {selectedDoctorDetails.formation_details}
                        </Text>
                      </View>
                    )}

                    {/* Cursos e Certificações */}
                    {selectedDoctorDetails.courses && selectedDoctorDetails.courses.length > 0 && (
                      <View style={styles.doctorDetailsSection}>
                        <Text style={styles.doctorDetailsLabel}>Cursos e Certificações</Text>
                        {selectedDoctorDetails.courses.map((course, index) => (
                          <View key={index} style={styles.courseItem}>
                            <SchoolIcon size={16} color={colors.primary} />
                            <Text style={styles.courseText}>
                              {course.name || course.course_name} 
                              {course.institution && ` - ${course.institution}`}
                              {course.year && ` (${course.year})`}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Modal de Seleção de Agenda do Médico */}
        <Modal
          visible={availabilityModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setAvailabilityModalVisible(false)}
          onShow={() => {
            // Recarregar agenda sempre que o modal for aberto para garantir dados atualizados
            if (formData.selectedDoctor?.id) {
              console.log('🔄 Recarregando agenda ao abrir modal...');
              loadDoctorAvailability(formData.selectedDoctor.id);
            }
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.availabilityModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Selecionar Data e Horário
                </Text>
                <TouchableOpacity
                  onPress={() => setAvailabilityModalVisible(false)}
                  style={styles.modalCloseButton}
                >
                  <CloseIcon size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              {loadingAvailability ? (
                <View style={styles.availabilityLoadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.availabilityLoadingText}>
                    Carregando agenda do médico...
                  </Text>
                </View>
              ) : doctorAvailability ? (
                <ScrollView style={styles.availabilityScrollView}>
                  <Text style={styles.availabilitySubtitle}>
                    Selecione uma data e horário disponível:
                  </Text>

                  {/* Lista de Datas Disponíveis */}
                  <View style={styles.availabilityDatesContainer}>
                    {doctorAvailability.availableDays && doctorAvailability.availableDays.length > 0 ? (
                      doctorAvailability.availableDays.map((dateKey) => {
                        // Criar data no timezone local para evitar deslocamento de um dia
                        // dateKey está no formato "YYYY-MM-DD"
                        const [year, month, day] = dateKey.split('-').map(Number);
                        const date = new Date(year, month - 1, day); // month é 0-indexed
                        const isSelected = selectedAvailabilityDate === dateKey;
                        const times = doctorAvailability.daySchedules?.[dateKey] || [];

                        return (
                          <View key={dateKey} style={styles.availabilityDateCard}>
                            <TouchableOpacity
                              style={[
                                styles.availabilityDateButton,
                                isSelected && styles.availabilityDateButtonSelected
                              ]}
                              onPress={() => handleAvailabilityDateSelect(dateKey)}
                            >
                              <Text style={[
                                styles.availabilityDateText,
                                isSelected && styles.availabilityDateTextSelected
                              ]}>
                                {date.toLocaleDateString('pt-BR', { 
                                  weekday: 'long', 
                                  day: 'numeric', 
                                  month: 'long' 
                                })}
                              </Text>
                              {isSelected && (
                                <CheckmarkCircleIcon size={20} color={colors.primary} />
                              )}
                            </TouchableOpacity>

                            {/* Horários disponíveis para esta data */}
                            {isSelected && times.length > 0 && (
                              <View style={styles.availabilityTimesContainer}>
                                <Text style={styles.availabilityTimesLabel}>
                                  Horários disponíveis:
                                </Text>
                                <View style={styles.availabilityTimesGrid}>
                                  {times.map((time) => {
                                    const isTimeSelected = selectedAvailabilityTime === time;
                                    return (
                                      <TouchableOpacity
                                        key={time}
                                        style={[
                                          styles.availabilityTimeButton,
                                          isTimeSelected && styles.availabilityTimeButtonSelected
                                        ]}
                                        onPress={() => handleAvailabilityTimeSelect(time)}
                                      >
                                        <Text style={[
                                          styles.availabilityTimeText,
                                          isTimeSelected && styles.availabilityTimeTextSelected
                                        ]}>
                                          {time}
                                        </Text>
                                      </TouchableOpacity>
                                    );
                                  })}
                                </View>
                              </View>
                            )}
                          </View>
                        );
                      })
                    ) : (
                      <View style={styles.availabilityEmptyContainer}>
                        <CalendarIcon size={48} color={colors.gray400} />
                        <Text style={styles.availabilityEmptyText}>
                          Nenhuma data disponível no momento
                        </Text>
                        <Text style={styles.availabilityEmptySubtext}>
                          Entre em contato com o médico para verificar disponibilidade
                        </Text>
                      </View>
                    )}
                  </View>
                </ScrollView>
              ) : (
                <View style={styles.availabilityEmptyContainer}>
                  <AlertCircleOutlineIcon size={48} color={colors.error} />
                  <Text style={styles.availabilityEmptyText}>
                    Erro ao carregar agenda
                  </Text>
                </View>
              )}

              {/* Botões de ação */}
              <View style={styles.availabilityFooter}>
                <TouchableOpacity
                  style={styles.availabilityCancelButton}
                  onPress={() => {
                    setAvailabilityModalVisible(false);
                    setSelectedAvailabilityDate(null);
                    setSelectedAvailabilityTime(null);
                  }}
                >
                  <Text style={styles.availabilityCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.availabilityConfirmButton,
                    (!selectedAvailabilityDate || !selectedAvailabilityTime) && styles.availabilityConfirmButtonDisabled
                  ]}
                  onPress={handleConfirmAvailability}
                  disabled={!selectedAvailabilityDate || !selectedAvailabilityTime}
                >
                  <Text style={styles.availabilityConfirmText}>Confirmar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  labelWithHelp: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  helpButton: {
    padding: 4,
  },
  autocompleteContainer: {
    flex: 1,
    zIndex: 1,
    minHeight: 52,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    minHeight: 52,
    gap: 12,
  },
  inputWrapperDisabled: {
    opacity: 0.5,
    backgroundColor: colors.gray100,
  },
  weekDaysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  dayCheckbox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCheckboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayCheckboxText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  dayCheckboxTextActive: {
    color: colors.textWhite,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  textAreaWrapper: {
    minHeight: 100,
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  textArea: {
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
    marginLeft: 4,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.backgroundLight,
    gap: 8,
  },
  typeButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  typeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  typeButtonTextActive: {
    color: colors.primary,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioActive: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  radioLabel: {
    fontSize: 15,
    color: colors.text,
  },
  mapButtons: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.info + '20',
    borderRadius: 8,
    gap: 6,
  },
  mapButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.info,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.info + '20',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: colors.success,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: 'bold',
  },
  placeholder: {
    color: colors.gray400,
  },
  // Estilos para Modal de Especialidades
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    backgroundColor: '#FFFFFF',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  flatList: {
    backgroundColor: '#FFFFFF',
  },
  flatListContent: {
    backgroundColor: '#FFFFFF',
  },
  specialtyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  specialtyItemSelected: {
    backgroundColor: '#E3F2FD',
  },
  specialtyItemText: {
    fontSize: 16,
    color: colors.text,
  },
  specialtyItemTextSelected: {
    fontWeight: '600',
    color: colors.primary,
  },
  separator: {
    height: 1,
    backgroundColor: colors.gray100,
  },
  // Estilos para Switch de Teleconsulta
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  switchLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  // Estilos para seleção de médico (teleconsulta)
  loadingDoctorsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
  },
  loadingDoctorsText: {
    fontSize: 14,
    color: colors.textLight,
  },
  selectedDoctorPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  doctorThumbnail: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.backgroundLight,
  },
  doctorThumbnailPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDoctorsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.warning + '20',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warning + '40',
  },
  noDoctorsText: {
    fontSize: 14,
    color: colors.warning,
    flex: 1,
  },
  // Estilos para modal de médicos
  doctorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  doctorItemSelected: {
    backgroundColor: '#E3F2FD',
  },
  doctorItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  doctorItemThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundLight,
  },
  doctorItemThumbnailPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doctorItemInfo: {
    flex: 1,
  },
  doctorItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  doctorItemNameSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  doctorItemCrm: {
    fontSize: 13,
    color: colors.textLight,
  },
  doctorItemContainer: {
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: colors.gray400,
  },
  doctorDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
    marginTop: 4,
    gap: 6,
  },
  doctorDetailsButtonText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  doctorDetailsScroll: {
    flex: 1,
  },
  doctorDetailsContent: {
    padding: 20,
  },
  doctorDetailsHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  doctorDetailsPhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  doctorDetailsPhotoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  doctorDetailsName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  doctorDetailsCrm: {
    fontSize: 14,
    color: colors.gray400,
    marginBottom: 8,
  },
  doctorDetailsRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  doctorDetailsRatingText: {
    fontSize: 14,
    color: colors.gray400,
  },
  doctorDetailsSection: {
    marginBottom: 20,
  },
  doctorDetailsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray400,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  doctorDetailsValue: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  courseItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  courseText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  // Estilos do modal de agenda
  availabilityModalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    height: '90%',
  },
  availabilityLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  availabilityLoadingText: {
    marginTop: 16,
    fontSize: 14,
    color: colors.textLight,
  },
  availabilityScrollView: {
    flex: 1,
  },
  availabilitySubtitle: {
    fontSize: 14,
    color: colors.textLight,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  availabilityDatesContainer: {
    padding: 16,
    gap: 12,
  },
  availabilityDateCard: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  availabilityDateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  availabilityDateButtonSelected: {
    backgroundColor: colors.primary + '10',
  },
  availabilityDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textTransform: 'capitalize',
  },
  availabilityDateTextSelected: {
    color: colors.primary,
  },
  availabilityTimesContainer: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  availabilityTimesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  availabilityTimesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  availabilityTimeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  availabilityTimeButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  availabilityTimeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  availabilityTimeTextSelected: {
    color: colors.textWhite,
  },
  availabilityEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  availabilityEmptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  availabilityEmptySubtext: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 8,
    textAlign: 'center',
  },
  availabilityFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  availabilityCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.backgroundLight,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  availabilityCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  availabilityConfirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  availabilityConfirmButtonDisabled: {
    backgroundColor: colors.gray300,
    opacity: 0.5,
  },
  availabilityConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textWhite,
  },
  teleconsultationDateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: colors.primary + '10',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  teleconsultationDateInfoText: {
    flex: 1,
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
});

export default AddAppointmentScreen;


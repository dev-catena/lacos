import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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
  Keyboard,
  Modal,
  FlatList,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
  ArrowBackIcon,
  AddIcon,
} from '../../components/CustomIcons';
import appointmentService from '../../services/appointmentService';
import doctorService from '../../services/doctorService';
import medicalSpecialtyService from '../../services/medicalSpecialtyService';
import groupService from '../../services/groupService';
import apiService from '../../services/apiService';
import GOOGLE_MAPS_CONFIG from '../../config/maps';
import { checkGoogleMapsConfig } from '../../utils/checkGoogleMapsConfig';
import { formatCrmDisplay } from '../../utils/crm';
import {
  filterTeleconsultDoctors,
  sortTeleconsultDoctors,
  formatNextSlotLabel,
  normalizeDoctorGender,
} from '../../utils/teleconsultDoctorFilters';
import {
  labelForDoctorQualification,
  DOCTOR_QUALIFICATION_LEVELS,
} from '../../constants/doctorQualificationLevels';
/** Unifica formatos da API (doctors vs users) para o modal de detalhes na teleconsulta */
function getDoctorDetailsForModal(d) {
  if (!d || typeof d !== 'object') return null;
  const name = d.name || d.user?.name || d.full_name || '';
  const photoUrl =
    d.photo_url ||
    d.photo ||
    d.profile_photo ||
    d.user?.photo_url ||
    d.user?.photo ||
    null;
  const crm = d.crm ?? d.user?.crm ?? null;
  const specialtyName =
    (d.medical_specialty && typeof d.medical_specialty === 'object'
      ? d.medical_specialty.name
      : null) ||
    (typeof d.medical_specialty === 'string' ? d.medical_specialty : null) ||
    (d.medicalSpecialty && typeof d.medicalSpecialty === 'object'
      ? d.medicalSpecialty.name
      : null) ||
    (typeof d.medicalSpecialty === 'string' ? d.medicalSpecialty : null) ||
    d.specialty ||
    null;
  const rating = d.average_rating ?? d.avg_rating ?? null;
  const totalReviews = d.total_reviews ?? d.reviews_count ?? 0;
  const qualRaw =
    d.professional_qualification_level ??
    d.user?.professional_qualification_level ??
    null;
  const displayQualification = labelForDoctorQualification(qualRaw);
  const courses = Array.isArray(d.courses)
    ? d.courses
    : Array.isArray(d.caregiver_courses)
      ? d.caregiver_courses
      : [];
  const formationText =
    (d.formation_details && String(d.formation_details).trim()) ||
    (d.formation_description && String(d.formation_description).trim()) ||
    (d.user?.formation_details && String(d.user.formation_details).trim()) ||
    (d.user?.formation_description && String(d.user.formation_description).trim()) ||
    null;
  const g = normalizeDoctorGender(d.gender ?? d.user?.gender ?? null);
  const displayGender =
    g === 'masculino' ? 'Masculino' : g === 'feminino' ? 'Feminino' : g === 'outro' ? 'Outro' : null;
  return {
    ...d,
    courses,
    displayName: name.trim() || 'Médico',
    displayPhotoUrl: photoUrl,
    displayCrm: crm,
    displaySpecialty: specialtyName,
    displayQualification: displayQualification || null,
    displayFormation: formationText,
    displayGender,
    displayRating: rating,
    displayTotalReviews: totalReviews,
  };
}

const REMINDER_PRESETS = {
  '1': [1440, 180, 60, 15],
  '2': [180, 60, 15],
  '3': [60, 15],
  '4': [15],
};

function mapReminderOptionToMinutes(option) {
  return REMINDER_PRESETS[option] || REMINDER_PRESETS['1'];
}

const AddAppointmentScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  let { groupId, groupName, appointmentId, appointment, isTeleconsultation } = route.params || {};
  
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
  const [addressListVisible, setAddressListVisible] = useState(false);
  const selectingAddressRef = useRef(false);
  const lastSelectedAddressRef = useRef('');
  const lastSelectedAddressAtRef = useRef(0);
  
  // Estados para especialidades médicas
  const [specialties, setSpecialties] = useState([]);
  const [specialtyModalVisible, setSpecialtyModalVisible] = useState(false);
  
  // Estados para médicos (teleconsulta)
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [doctorModalVisible, setDoctorModalVisible] = useState(false);
  const [doctorDetailsModalVisible, setDoctorDetailsModalVisible] = useState(false);
  const [selectedDoctorDetails, setSelectedDoctorDetails] = useState(null);

  /** Filtros do modal "Selecione o médico" (teleconsulta) */
  const [tcNameSearch, setTcNameSearch] = useState('');
  const [tcFilterSpecialtyId, setTcFilterSpecialtyId] = useState(null);
  const [tcFilterCity, setTcFilterCity] = useState('');
  const [tcFilterState, setTcFilterState] = useState('');
  const [tcOnlyWithAvailability, setTcOnlyWithAvailability] = useState(false);
  const [tcSortBy, setTcSortBy] = useState('next_slot');
  const [tcSpecialtyFilterModalVisible, setTcSpecialtyFilterModalVisible] = useState(false);
  /** @type {null | 'masculino' | 'feminino' | 'outro'} */
  const [tcFilterGender, setTcFilterGender] = useState(null);
  /** Valores `professional_qualification_level` (múltipla seleção; OR na lista) */
  const [tcFilterQualifications, setTcFilterQualifications] = useState([]);
  
  // Estados para médicos do grupo (quando tipo é "medical")
  const [groupDoctors, setGroupDoctors] = useState([]);
  const [loadingGroupDoctors, setLoadingGroupDoctors] = useState(false);
  const [selectedGroupDoctor, setSelectedGroupDoctor] = useState(null);
  
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
    isTeleconsultation: isTeleconsultation === true,
    recurrenceType: 'none', // none, daily, weekdays, custom
    recurrenceDays: [], // [0,1,2,3,4,5,6]
    recurrenceStart: new Date().toISOString(),
    recurrenceEnd: '',
    reminderOption: '3', // Opções pré-definidas
  });

  /** Inclui edição de teleconsulta vinda da agenda (ex.: aba Passadas) sem param isTeleconsultation na rota */
  const isTeleconsultationMode = useMemo(() => {
    return (
      isTeleconsultation === true ||
      !!(appointment?.is_teleconsultation || appointment?.isTeleconsultation) ||
      formData.isTeleconsultation === true
    );
  }, [isTeleconsultation, appointment, formData.isTeleconsultation]);

  // Carregar especialidades ao montar o componente
  useEffect(() => {
    loadSpecialties();
    
    // Se está editando, carregar dados do compromisso
    if (appointmentId || appointment) {
      loadAppointmentData();
    }
  }, [appointmentId, appointment]);

  // Recarregar especialidades quando o modal é aberto se a lista estiver vazia
  useEffect(() => {
    if (specialtyModalVisible && specialties.length === 0) {
      console.log('🔄 AddAppointmentScreen - Modal aberto com lista vazia, recarregando especialidades...');
      loadSpecialties();
    }
  }, [specialtyModalVisible]);

  useEffect(() => {
    if (tcSpecialtyFilterModalVisible && specialties.length === 0) {
      loadSpecialties();
    }
  }, [tcSpecialtyFilterModalVisible]);

  const loadSpecialties = async (retryCount = 0) => {
    const MAX_RETRIES = 2;
    try {
      console.log(`🔄 AddAppointmentScreen - Iniciando carregamento de especialidades... (tentativa ${retryCount + 1})`);
      const response = await medicalSpecialtyService.getSpecialties();
      console.log('📋 AddAppointmentScreen - Resposta recebida:', JSON.stringify(response, null, 2));
      console.log('📋 AddAppointmentScreen - Tipo da resposta:', typeof response);
      console.log('📋 AddAppointmentScreen - É array?', Array.isArray(response));
      console.log('📋 AddAppointmentScreen - Tem success?', response?.success);
      console.log('📋 AddAppointmentScreen - Tem data?', !!response?.data);
      console.log('📋 AddAppointmentScreen - Data é array?', Array.isArray(response?.data));
      
      let specialtiesData = [];
      
      // Tratar diferentes formatos de resposta
      if (Array.isArray(response)) {
        // Resposta é um array direto
        specialtiesData = response;
        console.log('✅ AddAppointmentScreen - Resposta é array direto, especialidades:', specialtiesData.length);
      } else if (response && response.success && response.data && Array.isArray(response.data)) {
        // Formato padrão: {success: true, data: [...]}
        specialtiesData = response.data;
        console.log('✅ AddAppointmentScreen - Dados extraídos de response.data:', specialtiesData.length);
      } else if (response && response.data && Array.isArray(response.data)) {
        // Formato alternativo: {data: [...]}
        specialtiesData = response.data;
        console.log('✅ AddAppointmentScreen - Dados extraídos de response.data (sem success):', specialtiesData.length);
      } else if (response && response.success === false) {
        // Erro na resposta
        console.warn('⚠️ AddAppointmentScreen - Resposta com success=false:', response);
        throw new Error(response.message || 'Erro ao buscar especialidades');
      } else {
        console.warn('⚠️ AddAppointmentScreen - Formato de resposta não reconhecido:', response);
        throw new Error('Formato de resposta inválido');
      }
      
      if (specialtiesData.length > 0) {
        // Remover duplicatas por nome (caso o backend ainda retorne)
        const uniqueSpecialties = specialtiesData.reduce((acc, current) => {
          if (!current || !current.id || !current.name) {
            console.warn('⚠️ AddAppointmentScreen - Item inválido ignorado:', current);
            return acc;
          }
          const existing = acc.find(item => item.id === current.id || item.name === current.name);
          if (!existing) {
            acc.push({ id: current.id, name: current.name });
          }
          return acc;
        }, []);
        
        // Ordenar por nome
        uniqueSpecialties.sort((a, b) => a.name.localeCompare(b.name));
        
        setSpecialties(uniqueSpecialties);
        console.log(`✅ AddAppointmentScreen - Especialidades carregadas: ${uniqueSpecialties.length} (após remover duplicatas)`);
        
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
            console.log(`✅ AddAppointmentScreen - Especialidade padrão definida: ${clinicaMedica.name} (ID: ${clinicaMedica.id})`);
          }
        }
      } else {
        console.warn('⚠️ AddAppointmentScreen - Nenhuma especialidade encontrada na resposta');
        // Tentar novamente se ainda houver tentativas
        if (retryCount < MAX_RETRIES) {
          console.log(`🔄 AddAppointmentScreen - Tentando novamente em 1 segundo... (${retryCount + 1}/${MAX_RETRIES})`);
          setTimeout(() => {
            loadSpecialties(retryCount + 1);
          }, 1000);
        } else {
          setSpecialties([]);
          Toast.show({
            type: 'error',
            text1: 'Erro ao carregar especialidades',
            text2: 'Nenhuma especialidade encontrada',
          });
        }
      }
    } catch (error) {
      console.error('❌ AddAppointmentScreen - Erro ao carregar especialidades:', error);
      console.error('❌ AddAppointmentScreen - Erro completo:', JSON.stringify(error, null, 2));
      
      // Tentar novamente se ainda houver tentativas
      if (retryCount < MAX_RETRIES) {
        console.log(`🔄 AddAppointmentScreen - Tentando novamente em 1 segundo após erro... (${retryCount + 1}/${MAX_RETRIES})`);
        setTimeout(() => {
          loadSpecialties(retryCount + 1);
        }, 1000);
      } else {
        setSpecialties([]);
        Toast.show({
          type: 'error',
          text1: 'Erro ao carregar especialidades',
          text2: error.message || 'Verifique sua conexão e tente novamente',
        });
      }
    }
  };

  const loadAppointmentData = async () => {
    try {
      setIsEditing(true);

      const idToLoad = appointment?.isRecurringInstance
        ? appointment.originalAppointmentId
        : (appointmentId || appointment?.id);

      let appointmentData = null;
      if (idToLoad) {
        const result = await appointmentService.getAppointment(idToLoad);
        if (result.success) {
          appointmentData = result.data;
        }
      }
      if (!appointmentData) {
        appointmentData = appointment;
      }

      if (appointmentData) {
        const appointmentDate = new Date(appointmentData.appointment_date || appointmentData.scheduled_at);
        setSelectedDate(appointmentDate);

        let recurrenceDays = [];
        if (appointmentData.recurrence_days) {
          recurrenceDays = typeof appointmentData.recurrence_days === 'string'
            ? JSON.parse(appointmentData.recurrence_days)
            : appointmentData.recurrence_days;
        }

        const loadedLocation = appointmentData.location || '';
        setFormData({
          title: appointmentData.title || '',
          type: appointmentData.type || 'medical',
          date: appointmentDate.toISOString(),
          duration: '60',
          address: loadedLocation,
          notes: appointmentData.notes || appointmentData.description || '',
          selectedDoctor: appointmentData.doctor || appointmentData.doctorUser || null,
          medicalSpecialtyId: appointmentData.medical_specialty_id || null,
          isTeleconsultation: appointmentData.is_teleconsultation || appointmentData.isTeleconsultation || false,
          recurrenceType: appointmentData.recurrence_type || 'none',
          recurrenceDays,
          recurrenceStart: appointmentData.recurrence_start || appointmentDate.toISOString(),
          recurrenceEnd: appointmentData.recurrence_end || '',
          reminderOption: '3',
        });
        if (loadedLocation.trim()) {
          setTimeout(() => {
            googlePlacesRef.current?.setAddressText?.(loadedLocation);
          }, 200);
        }
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

  const handlePlacesAddressChange = useCallback((text) => {
    if (selectingAddressRef.current) return;
    const recentlySelected = Date.now() - lastSelectedAddressAtRef.current < 1200;
    if (
      recentlySelected &&
      lastSelectedAddressRef.current &&
      text !== lastSelectedAddressRef.current &&
      String(text || '').length < lastSelectedAddressRef.current.length
    ) {
      return;
    }
    updateField('address', text);
    setAddressListVisible(true);
  }, []);

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

  // Carregar médicos da plataforma quando for modo teleconsulta (sem precisar de especialidade)
  useEffect(() => {
    if (isTeleconsultationMode) {
      // No modo teleconsulta, carregar todos os médicos da plataforma elegíveis
      loadPlatformDoctors();
    } else if (formData.isTeleconsultation && formData.medicalSpecialtyId && formData.type === 'medical') {
      loadDoctorsBySpecialty();
    } else {
      setDoctors([]);
    }
  }, [isTeleconsultationMode, formData.isTeleconsultation, formData.medicalSpecialtyId, formData.type]);

  // getDoctors(groupId) retorna médicos do grupo (tabela doctors) + da plataforma (users).
  // Para teleconsulta usamos apenas quem tem is_platform_doctor (cadastro na plataforma).
  const loadPlatformDoctors = async () => {
    if (!groupId) return;
    
    try {
      setLoadingDoctors(true);
      console.log('🔍 Carregando médicos para teleconsulta (grupo:', groupId, ')...');
      
      // Buscar via /doctors?group_id=X - verifica acesso ao grupo e retorna médicos da plataforma
      const response = await doctorService.getDoctors(groupId);
      
      let doctorsList = [];
      if (response?.success && Array.isArray(response.data)) {
        doctorsList = response.data;
      } else if (Array.isArray(response)) {
        doctorsList = response;
      }
      
      // Só médicos com cadastro na plataforma (users.profile = doctor) podem fazer teleconsulta.
      // O backend também devolve médicos só do grupo (tabela doctors); esses não têm is_platform_doctor.
      const platformDoctors = doctorsList.filter((doctor) => doctor.is_platform_doctor === true);

      const availableDoctors = platformDoctors.filter((doctor) => doctor.is_available !== false);

      // Ordenar médicos alfabeticamente por nome
      const sortedDoctors = availableDoctors.sort((a, b) => {
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        return nameA.localeCompare(nameB, 'pt-BR');
      });
      
      setDoctors(sortedDoctors);
      console.log('✅ Médicos para teleconsulta carregados:', sortedDoctors.length);
    } catch (error) {
      console.error('❌ Erro ao carregar médicos para teleconsulta:', error);
      setDoctors([]);
    } finally {
      setLoadingDoctors(false);
    }
  };

  const showTeleconsultDoctorFilters =
    isTeleconsultationMode || formData.isTeleconsultation;

  /**
   * Especialidades inferidas dos médicos do grupo (fallback se /medical-specialties ainda não carregou).
   * O seletor do filtro de teleconsulta usa a lista completa da API — não só as dos médicos do grupo.
   */
  const tcTeleconsultSpecialtyOptions = useMemo(() => {
    const groupDocs = doctors.filter((d) => d.is_group_doctor === true);
    const source = groupDocs.length > 0 ? groupDocs : doctors;
    const byId = new Map();
    for (const d of source) {
      const sid = d.medical_specialty_id ?? d.medical_specialty?.id;
      if (sid == null || sid === '' || Number.isNaN(Number(sid))) continue;
      const idNum = Number(sid);
      if (byId.has(idNum)) continue;
      const name =
        (d.medical_specialty && typeof d.medical_specialty === 'object' && d.medical_specialty.name) ||
        (typeof d.medical_specialty === 'string' ? d.medical_specialty : null) ||
        `Especialidade #${idNum}`;
      byId.set(idNum, { id: idNum, name });
    }
    return Array.from(byId.values()).sort((a, b) =>
      (a.name || '').localeCompare(b.name || '', 'pt-BR')
    );
  }, [doctors]);

  /** Lista simples para o seletor de teleconsulta: “Todas” + especialidades A–Z. */
  const tcSpecialtyPickerRows = useMemo(() => {
    const raw =
      specialties.length > 0 ? specialties.map((s) => ({ id: s.id, name: s.name })) : tcTeleconsultSpecialtyOptions;
    const sorted = [...raw].sort((a, b) =>
      String(a.name || '').localeCompare(String(b.name || ''), 'pt-BR', { sensitivity: 'base' })
    );
    return [{ id: '__all__', name: 'Todas as especialidades' }, ...sorted];
  }, [tcTeleconsultSpecialtyOptions, specialties]);

  const closeTeleconsultSpecialtyFilterModal = useCallback(() => {
    Keyboard.dismiss();
    setTcSpecialtyFilterModalVisible(false);
  }, []);

  const teleconsultFilteredDoctors = useMemo(() => {
    if (!showTeleconsultDoctorFilters) {
      return doctors;
    }
    const filtered = filterTeleconsultDoctors(
      doctors,
      {
        specialtyId: tcFilterSpecialtyId,
        cityQuery: tcFilterCity,
        stateQuery: tcFilterState,
        onlyWithAvailability: tcOnlyWithAvailability,
        maxDistanceKm: null,
        nameQuery: tcNameSearch,
        gender: tcFilterGender,
        qualificationLevels: tcFilterQualifications,
      },
      null
    );
    const sortKey = tcSortBy === 'distance' ? 'name' : tcSortBy;
    return sortTeleconsultDoctors(filtered, sortKey, null);
  }, [
    showTeleconsultDoctorFilters,
    doctors,
    tcFilterSpecialtyId,
    tcFilterCity,
    tcFilterState,
    tcOnlyWithAvailability,
    tcNameSearch,
    tcSortBy,
    tcFilterGender,
    tcFilterQualifications,
  ]);

  const resetTeleconsultDoctorFilters = useCallback(() => {
    setTcNameSearch('');
    setTcFilterSpecialtyId(null);
    setTcFilterCity('');
    setTcFilterState('');
    setTcOnlyWithAvailability(false);
    setTcSortBy('next_slot');
    setTcFilterGender(null);
    setTcFilterQualifications([]);
  }, []);

  const tcSpecialtyFilterLabel =
    tcFilterSpecialtyId == null
      ? 'Todas as especialidades'
      : specialties.find((s) => Number(s.id) === Number(tcFilterSpecialtyId))?.name ||
        tcTeleconsultSpecialtyOptions.find((s) => Number(s.id) === Number(tcFilterSpecialtyId))?.name ||
        'Especialidade';

  // Carregar médicos do grupo quando tipo for "medical"
  useEffect(() => {
    if (formData.type === 'medical' && groupId) {
      loadGroupDoctors();
    } else {
      setGroupDoctors([]);
      setSelectedGroupDoctor(null);
    }
  }, [formData.type, groupId]);

  // Recarregar médicos quando a tela receber foco (após voltar do AddDoctorScreen)
  useFocusEffect(
    useCallback(() => {
      if (formData.type === 'medical' && groupId) {
        loadGroupDoctors();
      }
    }, [formData.type, groupId])
  );

  const loadGroupDoctors = async () => {
    if (!groupId) return;
    
    try {
      setLoadingGroupDoctors(true);
      const response = await doctorService.getDoctors(groupId);
      
      if (response.success && response.data) {
        // Ordenar médicos alfabeticamente por nome
        const sortedDoctors = [...response.data].sort((a, b) => {
          const nameA = (a.name || '').toLowerCase();
          const nameB = (b.name || '').toLowerCase();
          return nameA.localeCompare(nameB, 'pt-BR');
        });
        setGroupDoctors(sortedDoctors);
        console.log('✅ Médicos do grupo carregados:', sortedDoctors.length);
      } else {
        setGroupDoctors([]);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar médicos do grupo:', error);
      setGroupDoctors([]);
    } finally {
      setLoadingGroupDoctors(false);
    }
  };

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
      
      // Ordenar médicos alfabeticamente por nome
      const sortedDoctors = doctorsFormatted.sort((a, b) => {
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        return nameA.localeCompare(nameB, 'pt-BR');
      });
      
      setDoctors(sortedDoctors);
      console.log('📋 Médicos encontrados:', sortedDoctors);
    } catch (error) {
      console.error('❌ Erro ao carregar médicos:', error);
      setDoctors([]);
    } finally {
      setLoadingDoctors(false);
    }
  };

  /**
   * Agenda do médico para TELECONSULTA (tela Agendar Teleconsulta → modal "Selecionar Data e Horário").
   * Backend: GET /doctors/{id}/availability?exclude_booked=1 — omite horários já comprometidos.
   */
  const loadDoctorAvailability = async (doctorId) => {
    try {
      setLoadingAvailability(true);
      console.log('📞 loadDoctorAvailability - Buscando agenda para médico ID:', doctorId);
      const response = await doctorService.getDoctorAvailability(doctorId, { excludeBooked: true });

      console.log('📥 loadDoctorAvailability - Resposta completa do backend:', JSON.stringify(response, null, 2));

      const payload = response?.data;
      const hasAgendaShape =
        payload &&
        typeof payload === 'object' &&
        (Array.isArray(payload.availableDays) ||
          (payload.daySchedules != null && typeof payload.daySchedules === 'object'));

      if (response && (response.success === true || hasAgendaShape) && hasAgendaShape) {
        console.log('✅ loadDoctorAvailability - Agenda recebida (horários já ocupados omitidos pelo backend):', {
          availableDaysCount: payload.availableDays?.length || 0,
          availableDays: payload.availableDays || [],
          daySchedulesKeys: payload.daySchedules ? Object.keys(payload.daySchedules) : [],
          daySchedules: payload.daySchedules || {},
        });
        setDoctorAvailability({
          availableDays: payload.availableDays || [],
          daySchedules: payload.daySchedules || {},
        });
      } else {
        console.error('❌ loadDoctorAvailability - Resposta sem agenda utilizável:', {
          response,
          hasSuccess: response?.success,
          hasData: !!response?.data,
        });
        setDoctorAvailability({ availableDays: [], daySchedules: {} });
      }
    } catch (error) {
      console.error('❌ Erro ao carregar agenda do médico:', error);
      console.error('❌ Detalhes do erro:', {
        message: error.message,
        stack: error.stack,
        response: error.response,
      });
      setDoctorAvailability({ availableDays: [], daySchedules: {} });
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
    // Validar título apenas se não for tipo "medical" (que usa seleção de médico)
    if (formData.type !== 'medical' && !formData.title.trim()) {
      Alert.alert('Atenção', 'Digite um título para o compromisso');
      return;
    }
    
    // Validar médico selecionado se for tipo "medical" ou modo teleconsulta
    if ((formData.type === 'medical' || isTeleconsultationMode) && !selectedGroupDoctor && !formData.selectedDoctor) {
      Alert.alert('Atenção', 'Selecione um médico para o compromisso');
      return;
    }
    
    // Preencher título automaticamente se for modo teleconsulta e tiver médico selecionado
    if (isTeleconsultationMode && formData.selectedDoctor && !formData.title.trim()) {
      updateField('title', formData.selectedDoctor.name);
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

    // Verificar se o agendamento está sendo feito com menos de 1 hora de antecedência
    const appointmentDateTime = new Date(formData.date);
    const now = new Date();
    const timeDifference = appointmentDateTime.getTime() - now.getTime();
    const oneHourInMs = 60 * 60 * 1000; // 1 hora em milissegundos
    const isLessThanOneHour = timeDifference > 0 && timeDifference < oneHourInMs;
    const isTeleconsultation = formData.isTeleconsultation;
    
    // Se for teleconsulta e menos de 1 hora, avisar sobre política de cancelamento
    if (isTeleconsultation && isLessThanOneHour) {
      Alert.alert(
        '⚠️ Agendamento com Menos de 1 Hora',
        'Você está agendando uma teleconsulta com menos de 1 hora de antecedência.\n\n' +
        'IMPORTANTE: Se você cancelar esta consulta, o valor pago NÃO será reembolsado devido ao cancelamento em cima da hora.\n\n' +
        'Deseja continuar com o agendamento?',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => {
              // Usuário cancelou, não fazer nada
            },
          },
          {
            text: 'Sim, continuar',
            onPress: () => {
              // Continuar com o agendamento
              proceedWithSave();
            },
          },
        ]
      );
      return;
    }

    // Se não for o caso acima, prosseguir normalmente
    proceedWithSave();
  };

  const proceedWithSave = async () => {
    setLoading(true);

    try {
      const sel = formData.selectedDoctor;
      const doctorId =
        sel?.user_id != null && sel.user_id !== ''
          ? Number(sel.user_id)
          : sel?.id != null
            ? Number(sel.id)
            : null;

      const isTeleconsult = isTeleconsultationMode || formData.isTeleconsultation;
      const effectiveTitle =
        formData.title.trim() ||
        sel?.name?.trim() ||
        (isTeleconsult ? 'Teleconsulta' : '');

      if (!effectiveTitle) {
        Alert.alert('Atenção', 'Digite um título para o compromisso');
        setLoading(false);
        return;
      }

      console.log('📤 Preparando dados do compromisso:', {
        selectedDoctor: formData.selectedDoctor,
        doctorId: doctorId,
        type: formData.type,
        isTeleconsultation: isTeleconsult,
        date: formData.date,
        title: effectiveTitle,
      });
      
      const appointmentData = {
        group_id: parseInt(groupId),
        title: effectiveTitle,
        type: formData.type,
        description: formData.notes.trim() || null,
        scheduled_at: formData.date,
        appointment_date: formData.date,
        doctor_id: doctorId,
        medical_specialty_id: formData.medicalSpecialtyId || null,
        is_teleconsultation: isTeleconsult,
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
        reminder_times: mapReminderOptionToMinutes(formData.reminderOption),
      };

      console.log('📤 Salvando compromisso:', appointmentData);
      console.log('📋 Tipo selecionado:', formData.type);
      console.log('👨‍⚕️ Doctor ID:', doctorId);

      let result;
      if (isEditing && appointmentId) {
        const editId = appointment?.isRecurringInstance
          ? appointment.originalAppointmentId
          : appointmentId;

        result = await appointmentService.updateAppointment(editId, {
          title: formData.title.trim(),
          type: formData.type,
          description: formData.notes.trim() || null,
          scheduledAt: formData.date,
          appointmentDate: formData.date,
          doctorId:
            formData.selectedDoctor?.user_id != null &&
            formData.selectedDoctor.user_id !== ''
              ? Number(formData.selectedDoctor.user_id)
              : formData.selectedDoctor?.id != null
                ? Number(formData.selectedDoctor.id)
                : null,
          medicalSpecialtyId: formData.medicalSpecialtyId || null,
          isTeleconsultation: formData.isTeleconsultation || false,
          location: formData.address.trim() || null,
          notes: formData.notes.trim() || null,
          recurrence_type: formData.recurrenceType !== 'none' ? formData.recurrenceType : 'none',
          recurrence_days: formData.recurrenceType === 'custom' && formData.recurrenceDays.length > 0
            ? JSON.stringify(formData.recurrenceDays)
            : null,
          recurrence_start: formData.recurrenceType !== 'none'
            ? (formData.recurrenceStart || formData.date)
            : null,
          recurrence_end: formData.recurrenceType !== 'none' && formData.recurrenceEnd
            ? formData.recurrenceEnd
            : null,
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

  /** Layout mais compacto na teleconsulta (cuidador/amigo): menos rolagem até o botão agendar */
  const compactTeleconsultLayout = isTeleconsultationMode;

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

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
        >
          <View
            style={[
              styles.content,
              compactTeleconsultLayout && styles.contentCompactTeleconsult,
            ]}
          >
            {/* Ícone */}
            <View
              style={[
                styles.iconContainer,
                compactTeleconsultLayout && styles.iconContainerCompactTeleconsult,
              ]}
            >
              <AppointmentIcon
                size={compactTeleconsultLayout ? 40 : 48}
                color={colors.primary}
              />
            </View>

            <Text
              style={[
                styles.title,
                compactTeleconsultLayout && styles.titleCompactTeleconsult,
              ]}
            >
              {isEditing 
                ? 'Editar Compromisso' 
                : isTeleconsultationMode 
                  ? 'Agendar Teleconsulta' 
                  : 'Agendar Compromisso'}
            </Text>
            <Text
              style={[
                styles.subtitle,
                compactTeleconsultLayout && styles.subtitleCompactTeleconsult,
              ]}
            >
              {isEditing 
                ? 'Edite as informações do compromisso'
                : isTeleconsultationMode
                  ? 'Agende uma teleconsulta com um médico da plataforma'
                  : 'Crie um compromisso ou consulta médica presencial para o acompanhado'}
            </Text>

            {/* Tipo - MOVIDO PARA O TOPO - Oculto no modo teleconsulta */}
            {!isTeleconsultationMode && (
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
            )}

            {/* Título - apenas para tipos que não são "medical" */}
            {formData.type !== 'medical' && (
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
            )}

            {/* Seleção de Médico - para tipo "medical" (médicos do grupo) */}
            {formData.type === 'medical' && !isTeleconsultationMode && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Médico *</Text>
                <Text style={styles.helperTextBelowLabel}>
                  O médico não precisa ser membro do grupo: basta escolher um profissional da lista (inclui médicos da plataforma vinculados ao grupo).
                </Text>
                {loadingGroupDoctors ? (
                  <View style={styles.loadingDoctorsContainer}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.loadingDoctorsText}>Carregando médicos...</Text>
                  </View>
                ) : groupDoctors.length > 0 ? (
                  <>
                    <View style={styles.doctorsListContainer}>
                      <FlatList
                        data={groupDoctors}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => (
                          <TouchableOpacity
                            style={[
                              styles.doctorListItem,
                              selectedGroupDoctor?.id === item.id && styles.doctorListItemSelected,
                            ]}
                            onPress={() => {
                              setSelectedGroupDoctor(item);
                              updateField('title', item.name);
                              updateField('selectedDoctor', item);
                            }}
                          >
                            <View style={styles.doctorListItemContent}>
                              <View style={styles.doctorListItemAvatar}>
                                <PersonIcon 
                                  size={24} 
                                  color={selectedGroupDoctor?.id === item.id ? colors.white : colors.primary} 
                                />
                              </View>
                              <View style={styles.doctorListItemInfo}>
                                <Text style={[
                                  styles.doctorListItemName,
                                  selectedGroupDoctor?.id === item.id && styles.doctorListItemNameSelected,
                                ]}>
                                  {item.name}
                                </Text>
                                {item.crm && (
                                  <Text style={styles.doctorListItemCrm}>
                                    CRM: {formatCrmDisplay(item.crm)}
                                  </Text>
                                )}
                                {item.medical_specialty?.name && (
                                  <Text style={styles.doctorListItemSpecialty}>
                                    {item.medical_specialty.name}
                                  </Text>
                                )}
                              </View>
                            </View>
                            {selectedGroupDoctor?.id === item.id && (
                              <CheckmarkCircleIcon size={24} color={colors.primary} />
                            )}
                          </TouchableOpacity>
                        )}
                        scrollEnabled={true}
                        nestedScrollEnabled={true}
                        showsVerticalScrollIndicator={true}
                      />
                    </View>
                    <TouchableOpacity
                      style={styles.addDoctorButton}
                      onPress={() => {
                        navigation.navigate('AddDoctor', {
                          groupId,
                          groupName,
                          returnTo: 'AddAppointment',
                        });
                      }}
                    >
                      <AddIcon size={20} color={colors.primary} />
                      <Text style={styles.addDoctorButtonText}>Adicionar Médico</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={styles.noDoctorsContainer}>
                    <AlertCircleOutlineIcon size={20} color={colors.warning} />
                    <Text style={styles.noDoctorsText}>
                      Nenhum médico cadastrado no grupo
                    </Text>
                    <TouchableOpacity
                      style={styles.addDoctorButton}
                      onPress={() => {
                        navigation.navigate('AddDoctor', {
                          groupId,
                          groupName,
                          returnTo: 'AddAppointment',
                        });
                      }}
                    >
                      <AddIcon size={20} color={colors.primary} />
                      <Text style={styles.addDoctorButtonText}>Adicionar Primeiro Médico</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* Seleção de Médico da Plataforma - para modo teleconsulta */}
            {isTeleconsultationMode && (
              <View
                style={[
                  styles.inputContainer,
                  compactTeleconsultLayout && styles.inputContainerCompactTeleconsult,
                ]}
              >
                <Text
                  style={[
                    styles.label,
                    compactTeleconsultLayout && styles.labelCompactTeleconsult,
                  ]}
                >
                  Médico *
                </Text>
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
                      Nenhum médico disponível para teleconsulta
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Especialidade Médica - apenas para compromissos médicos (não no modo teleconsulta) */}
            {formData.type === 'medical' && !isTeleconsultationMode && (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Especialidade Médica</Text>
                  <TouchableOpacity
                    style={styles.inputWrapper}
                    onPress={() => {
                      console.log('🔘 AddAppointmentScreen - Botão de especialidade pressionado');
                      console.log('📋 AddAppointmentScreen - Especialidades disponíveis:', specialties.length);
                      if (specialties.length === 0) {
                        console.log('⚠️ AddAppointmentScreen - Nenhuma especialidade carregada, recarregando...');
                        loadSpecialties();
                      }
                      setSpecialtyModalVisible(true);
                      console.log('✅ AddAppointmentScreen - Modal de especialidades aberto');
                    }}
                    activeOpacity={0.7}
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

                {/* Seleção de Médico da Plataforma - apenas para modo teleconsulta */}
                {isTeleconsultationMode && (
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
                <View style={styles.labelWithIcon}>
                  <LocationIcon size={18} color={colors.primary} />
                  <Text style={styles.label}>Local do Compromisso</Text>
                </View>
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
                    placeholder="Buscar endereço — se faltar rua em outra cidade, inclua o nome da cidade"
                    fetchDetails={true}
                    listViewDisplayed={addressListVisible}
                    keepResultsAfterBlur={false}
                    listViewProps={{
                      keyboardShouldPersistTaps: 'handled',
                      nestedScrollEnabled: true,
                    }}
                    onPress={(data, details = null) => {
                      try {
                        let addressToSave = '';
                        
                        // Priorizar formatted_address dos detalhes
                        if (details && details.formatted_address) {
                          addressToSave = details.formatted_address;
                        } else if (data && data.description) {
                          addressToSave = data.description;
                        } else if (data && data.structured_formatting) {
                          addressToSave = data.structured_formatting.main_text + 
                            (data.structured_formatting.secondary_text ? ', ' + data.structured_formatting.secondary_text : '');
                        }
                        
                        if (addressToSave) {
                          selectingAddressRef.current = true;
                          lastSelectedAddressRef.current = addressToSave;
                          lastSelectedAddressAtRef.current = Date.now();
                          setTimeout(() => {
                            selectingAddressRef.current = false;
                          }, 450);
                          updateField('address', addressToSave);
                          setAddressListVisible(false);
                          try {
                            googlePlacesRef.current?.setAddressText?.(addressToSave);
                            googlePlacesRef.current?.blur?.();
                          } catch (e) {
                            // noop
                          }
                          Toast.show({
                            type: 'success',
                            text1: 'Endereço selecionado',
                            text2: addressToSave.length > 50 ? addressToSave.substring(0, 50) + '...' : addressToSave,
                            position: 'bottom',
                            visibilityTime: 2000,
                          });
                        } else {
                          console.warn('Dados do endereço incompletos:', { data, details });
                          Toast.show({
                            type: 'warning',
                            text1: 'Endereço incompleto',
                            text2: 'Tente selecionar outro endereço',
                            position: 'bottom',
                          });
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
                      Toast.show({
                        type: 'error',
                        text1: 'Erro na busca',
                        text2: 'Verifique sua conexão e tente novamente',
                        position: 'bottom',
                      });
                    }}
                    query={{
                      key: GOOGLE_MAPS_CONFIG.API_KEY,
                      language: GOOGLE_MAPS_CONFIG.language || 'pt-BR',
                      components: 'country:br',
                      // Viés de região (ccTLD), alinha com Maps no Brasil
                      region: 'br',
                      // Sem `types` e sem o antigo `types: 'address'`: o Maps mistura sugestões;
                      // `address` limitava a ~5 resultados "precisos" e empurrava homônimos para fora.
                    }}
                    enablePoweredByContainer={false}
                    debounce={400}
                    minLength={2}
                    styles={{
                      container: {
                        flex: 0,
                        zIndex: 1,
                      },
                      textInputContainer: {
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: colors.backgroundLight,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: formData.address ? colors.primary : colors.border,
                        paddingHorizontal: 12,
                        paddingVertical: 4,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 2,
                      },
                      textInput: {
                        height: 48,
                        color: colors.text,
                        fontSize: 16,
                        backgroundColor: 'transparent',
                        flex: 1,
                      },
                      predefinedPlacesDescription: {
                        color: colors.primary,
                      },
                      listView: {
                        backgroundColor: colors.white,
                        borderRadius: 12,
                        marginTop: 8,
                        borderWidth: 1,
                        borderColor: colors.border,
                        maxHeight: Math.min(280, Math.round(Dimensions.get('window').height * 0.36)),
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.15,
                        shadowRadius: 8,
                        elevation: 5,
                      },
                      row: {
                        backgroundColor: colors.white,
                        paddingVertical: 14,
                        paddingHorizontal: 16,
                        borderBottomWidth: 0.5,
                        borderBottomColor: colors.border,
                      },
                      separator: {
                        height: 0,
                      },
                      description: {
                        color: colors.text,
                        fontSize: 14,
                        marginTop: 2,
                      },
                      poweredContainer: {
                        backgroundColor: colors.backgroundLight,
                        paddingVertical: 8,
                        borderTopWidth: 1,
                        borderTopColor: colors.border,
                      },
                    }}
                    textInputProps={{
                      placeholderTextColor: colors.placeholder,
                      onChangeText: handlePlacesAddressChange,
                      returnKeyType: 'search',
                      onFocus: () => setAddressListVisible(true),
                      onBlur: () => {
                        setTimeout(() => setAddressListVisible(false), 350);
                      },
                    }}
                    renderLeftButton={() => (
                      <View style={styles.autocompleteLeftButton}>
                        <LocationIcon size={20} color={colors.primary} />
                      </View>
                    )}
                    renderRightButton={() => formData.address ? (
                      <TouchableOpacity
                        style={styles.autocompleteClearButton}
                        onPress={() => {
                          updateField('address', '');
                          setAddressListVisible(false);
                          if (googlePlacesRef.current) {
                            googlePlacesRef.current.setAddressText('');
                          }
                        }}
                      >
                        <CloseIcon size={18} color={colors.gray400} />
                      </TouchableOpacity>
                    ) : null}
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
                <View style={styles.addressPreviewContainer}>
                  <View style={styles.addressPreview}>
                    <LocationIcon size={16} color={colors.success} />
                    <Text style={styles.addressPreviewText} numberOfLines={2}>
                      {formData.address}
                    </Text>
                  </View>
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
                </View>
              )}
            </View>
            )}

            {/* Lembretes */}
            <View
              style={[
                styles.inputContainer,
                compactTeleconsultLayout && styles.inputContainerCompactTeleconsult,
              ]}
            >
              <Text
                style={[
                  styles.label,
                  compactTeleconsultLayout && styles.labelCompactTeleconsult,
                ]}
              >
                Lembretes
              </Text>
              {reminderOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.radioOption,
                    compactTeleconsultLayout && styles.radioOptionCompactTeleconsult,
                  ]}
                  onPress={() => updateField('reminderOption', option.value)}
                >
                  <View style={[
                    styles.radio,
                    compactTeleconsultLayout && styles.radioCompactTeleconsult,
                    formData.reminderOption === option.value && styles.radioActive,
                  ]}>
                    {formData.reminderOption === option.value && (
                      <View
                        style={[
                          styles.radioDot,
                          compactTeleconsultLayout && styles.radioDotCompactTeleconsult,
                        ]}
                      />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.radioLabel,
                      compactTeleconsultLayout && styles.radioLabelCompactTeleconsult,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Observações */}
            <View
              style={[
                styles.inputContainer,
                compactTeleconsultLayout && styles.inputContainerCompactTeleconsult,
              ]}
            >
              <Text
                style={[
                  styles.label,
                  compactTeleconsultLayout && styles.labelCompactTeleconsult,
                ]}
              >
                Observações
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  styles.textAreaWrapper,
                  compactTeleconsultLayout && styles.textAreaWrapperCompactTeleconsult,
                ]}
              >
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Adicione observações..."
                  value={formData.notes}
                  onChangeText={(value) => updateField('notes', value)}
                  multiline
                  numberOfLines={compactTeleconsultLayout ? 2 : 3}
                />
              </View>
            </View>

            {/* Info Card */}
            <View
              style={[
                styles.infoCard,
                compactTeleconsultLayout && styles.infoCardCompactTeleconsult,
              ]}
            >
              <InformationCircleIcon
                size={compactTeleconsultLayout ? 20 : 24}
                color={colors.info}
              />
              <View style={styles.infoContent}>
                <Text
                  style={[
                    styles.infoText,
                    compactTeleconsultLayout && styles.infoTextCompactTeleconsult,
                  ]}
                >
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

            <View
              style={{
                height: compactTeleconsultLayout ? 12 : 40,
              }}
            />
          </View>
        </ScrollView>

        {/* Modal de Especialidades */}
        <Modal
          visible={specialtyModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => {
            console.log('🔘 AddAppointmentScreen - Modal fechado via onRequestClose');
            setSpecialtyModalVisible(false);
          }}
          onShow={() => {
            console.log('✅ AddAppointmentScreen - Modal de especialidades exibido');
            console.log('📋 AddAppointmentScreen - Especialidades no modal:', specialties.length);
          }}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.specialtiesModalSheet,
                { paddingBottom: Math.max(insets.bottom, 12) },
              ]}
            >
              <View style={styles.modalSheetHandle} />
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Selecione a Especialidade</Text>
                <TouchableOpacity
                  onPress={() => {
                    console.log('🔘 AddAppointmentScreen - Botão fechar modal pressionado');
                    setSpecialtyModalVisible(false);
                  }}
                  style={styles.modalCloseButton}
                  activeOpacity={0.7}
                >
                  <CloseIcon size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              {specialties.length === 0 ? (
                <View style={styles.specialtiesModalEmptyBody}>
                  <Text style={styles.modalEmptyText}>Carregando especialidades...</Text>
                  <TouchableOpacity
                    onPress={() => {
                      console.log('🔄 AddAppointmentScreen - Recarregando especialidades do modal');
                      loadSpecialties();
                    }}
                    style={styles.modalRetryButton}
                  >
                    <Text style={styles.modalRetryButtonText}>Tentar novamente</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <FlatList
                  data={specialties}
                  keyExtractor={(item) => item.id.toString()}
                  style={[styles.flatList, styles.specialtiesModalListFlex]}
                  contentContainerStyle={styles.flatListContent}
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled
                  scrollEnabled
                  removeClippedSubviews={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.specialtyItem,
                        formData.medicalSpecialtyId === item.id && styles.specialtyItemSelected
                      ]}
                      onPress={() => {
                        console.log('🔘 AddAppointmentScreen - Especialidade selecionada:', item.name, item.id);
                        updateField('medicalSpecialtyId', item.id);
                        setSpecialtyModalVisible(false);
                      }}
                      activeOpacity={0.7}
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
              )}
            </View>
          </View>
        </Modal>

        {/* Modal de Seleção de Médicos */}
        <Modal
          visible={doctorModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => {
            if (tcSpecialtyFilterModalVisible) {
              closeTeleconsultSpecialtyFilterModal();
            } else {
              setDoctorModalVisible(false);
            }
          }}
        >
          <View style={styles.modalOverlay}>
            <View
              style={
                showTeleconsultDoctorFilters
                  ? [
                      styles.doctorSelectSheet,
                      { paddingBottom: Math.max(insets.bottom, 10) },
                    ]
                  : styles.modalContent
              }
            >
              {showTeleconsultDoctorFilters ? <View style={styles.modalSheetHandle} /> : null}
              <View
                style={[
                  styles.modalHeader,
                  showTeleconsultDoctorFilters && styles.modalHeaderTeleconsult,
                ]}
              >
                <Text
                  style={[
                    styles.modalTitle,
                    showTeleconsultDoctorFilters && styles.modalTitleTeleconsult,
                  ]}
                >
                  Selecione o Médico
                </Text>
                <TouchableOpacity
                  onPress={() => setDoctorModalVisible(false)}
                  style={styles.modalCloseButton}
                >
                  <CloseIcon size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              {showTeleconsultDoctorFilters ? (
                <ScrollView
                  style={styles.tcFilterPanel}
                  nestedScrollEnabled
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={styles.tcFilterPanelTitle}>Filtros</Text>
                  <Text style={styles.tcFilterHint}>
                    Ajuste para refinar a lista. Toque em um médico para agendar.
                  </Text>
                  <TextInput
                    style={styles.tcFilterInput}
                    placeholder="Buscar por nome"
                    placeholderTextColor={colors.gray400}
                    value={tcNameSearch}
                    onChangeText={setTcNameSearch}
                    autoCorrect={false}
                  />
                  <View style={styles.tcFilterRow}>
                    <TouchableOpacity
                      style={styles.tcFilterChipWide}
                      onPress={() => {
                        Keyboard.dismiss();
                        setTcSpecialtyFilterModalVisible(true);
                      }}
                    >
                      <Text style={styles.tcFilterChipText} numberOfLines={1}>
                        {tcSpecialtyFilterLabel}
                      </Text>
                      <ChevronDownIcon size={18} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.tcFilterClearBtn}
                      onPress={resetTeleconsultDoctorFilters}
                    >
                      <Text style={styles.tcFilterClearText}>Limpar</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.tcFilterRow}>
                    <TextInput
                      style={[styles.tcFilterInput, styles.tcFilterInputFlex]}
                      placeholder="Cidade"
                      placeholderTextColor={colors.gray400}
                      value={tcFilterCity}
                      onChangeText={setTcFilterCity}
                      autoCorrect={false}
                    />
                    <TextInput
                      style={styles.tcFilterStateInput}
                      placeholder="UF"
                      placeholderTextColor={colors.gray400}
                      value={tcFilterState}
                      onChangeText={(t) => setTcFilterState(t.toUpperCase().slice(0, 2))}
                      autoCapitalize="characters"
                      maxLength={2}
                    />
                  </View>
                  <Text style={styles.tcFilterSectionLabel}>Sexo do profissional</Text>
                  <View style={styles.tcChipRow}>
                    {[
                      { id: null, label: 'Qualquer' },
                      { id: 'feminino', label: 'Feminino' },
                      { id: 'masculino', label: 'Masculino' },
                      { id: 'outro', label: 'Outro' },
                    ].map(({ id, label }) => {
                      const active = tcFilterGender === id;
                      return (
                        <TouchableOpacity
                          key={label}
                          style={[styles.tcSortChip, active && styles.tcSortChipActive]}
                          onPress={() => setTcFilterGender(id)}
                        >
                          <Text
                            style={[
                              styles.tcSortChipText,
                              active && styles.tcSortChipTextActive,
                            ]}
                          >
                            {label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <Text style={styles.tcFilterSectionLabel}>Nível de qualificação</Text>
                  <Text style={styles.tcFilterQualificationHint}>
                    Marque uma ou mais opções. Aparecem médicos que tenham pelo menos uma delas.
                  </Text>
                  <View style={styles.tcChipRow}>
                    <TouchableOpacity
                      key="tc-qual-any"
                      style={[
                        styles.tcSortChip,
                        tcFilterQualifications.length === 0 && styles.tcSortChipActive,
                      ]}
                      onPress={() => setTcFilterQualifications([])}
                    >
                      <Text
                        style={[
                          styles.tcSortChipText,
                          tcFilterQualifications.length === 0 && styles.tcSortChipTextActive,
                        ]}
                      >
                        Qualquer
                      </Text>
                    </TouchableOpacity>
                    {DOCTOR_QUALIFICATION_LEVELS.map((opt) => {
                      const active = tcFilterQualifications.includes(opt.value);
                      return (
                        <TouchableOpacity
                          key={opt.value}
                          style={[styles.tcSortChip, active && styles.tcSortChipActive]}
                          onPress={() => {
                            setTcFilterQualifications((prev) => {
                              if (prev.includes(opt.value)) {
                                return prev.filter((v) => v !== opt.value);
                              }
                              return [...prev, opt.value];
                            });
                          }}
                        >
                          <Text
                            style={[
                              styles.tcSortChipText,
                              active && styles.tcSortChipTextActive,
                            ]}
                          >
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <View style={styles.tcSwitchRow}>
                    <Text style={styles.tcSwitchLabel}>Só com horário disponível na agenda</Text>
                    <Switch
                      value={tcOnlyWithAvailability}
                      onValueChange={setTcOnlyWithAvailability}
                      trackColor={{ false: colors.gray300, true: colors.primary + '80' }}
                      thumbColor={tcOnlyWithAvailability ? colors.primary : colors.gray400}
                    />
                  </View>
                  <Text style={styles.tcFilterSectionLabel}>Ordenar por</Text>
                  <View style={styles.tcChipRow}>
                    {[
                      { id: 'next_slot', label: 'Horário mais próximo' },
                      { id: 'name', label: 'Nome' },
                    ].map(({ id, label }) => {
                      const active = tcSortBy === id;
                      return (
                        <TouchableOpacity
                          key={id}
                          style={[
                            styles.tcSortChip,
                            active && styles.tcSortChipActive,
                          ]}
                          onPress={() => setTcSortBy(id)}
                        >
                          <Text
                            style={[
                              styles.tcSortChipText,
                              active && styles.tcSortChipTextActive,
                            ]}
                          >
                            {label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              ) : null}
              <FlatList
                data={showTeleconsultDoctorFilters ? teleconsultFilteredDoctors : doctors}
                keyExtractor={(item, index) =>
                  `${item.id ?? 'd'}-${item.is_platform_doctor ? 'p' : 'g'}-${index}`
                }
                style={[
                  styles.flatList,
                  showTeleconsultDoctorFilters && styles.tcDoctorListFlex,
                ]}
                contentContainerStyle={[
                  styles.flatListContent,
                  showTeleconsultDoctorFilters && styles.flatListContentTeleconsult,
                ]}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  showTeleconsultDoctorFilters ? (
                    <View style={styles.tcEmptyList}>
                      <Text style={styles.tcEmptyListText}>
                        Nenhum médico com esses filtros. Tente outro nível de qualificação, especialidade ou sexo, ampliar
                        cidade/UF ou desmarcar &quot;só com horário&quot;.
                      </Text>
                    </View>
                  ) : null
                }
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
                          // Preencher título automaticamente com o nome do médico
                          if (!formData.title.trim() || isTeleconsultationMode) {
                            updateField('title', item.name);
                          }
                          setDoctorModalVisible(false);
                          // Se for teleconsulta, buscar agenda do médico e abrir modal de seleção
                          if (formData.isTeleconsultation || isTeleconsultationMode) {
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
                            {showTeleconsultDoctorFilters &&
                              (item.city || item.state) && (
                              <Text style={styles.doctorItemLocation} numberOfLines={1}>
                                {[item.city, item.state].filter(Boolean).join(' · ')}
                              </Text>
                            )}
                            {showTeleconsultDoctorFilters && item.next_slot_at ? (
                              <Text style={styles.doctorItemNextSlot} numberOfLines={1}>
                                Próximo horário: {formatNextSlotLabel(item.next_slot_at) || '—'}
                              </Text>
                            ) : showTeleconsultDoctorFilters &&
                              item.is_platform_doctor &&
                              !item.has_future_availability ? (
                              <Text style={styles.doctorItemNoSlot} numberOfLines={1}>
                                Sem horário cadastrado nas próximas datas
                              </Text>
                            ) : null}
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
                          setDoctorModalVisible(false);
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
            {tcSpecialtyFilterModalVisible ? (
              <View style={styles.tcSpecialtyNestedOverlay} pointerEvents="box-none">
                <TouchableOpacity
                  style={styles.tcSpecialtyNestedBackdrop}
                  activeOpacity={1}
                  onPress={closeTeleconsultSpecialtyFilterModal}
                  accessibilityRole="button"
                  accessibilityLabel="Fechar seleção de especialidade"
                />
                <View
                  style={[
                    styles.tcSpecialtySimpleSheet,
                    { paddingBottom: Math.max(insets.bottom, 12) },
                  ]}
                >
                  <View style={styles.modalSheetHandle} />
                  <View style={[styles.modalHeader, styles.modalHeaderTeleconsult]}>
                    <Text style={[styles.modalTitle, styles.modalTitleTeleconsult]}>
                      Filtrar por especialidade
                    </Text>
                    <TouchableOpacity
                      onPress={closeTeleconsultSpecialtyFilterModal}
                      style={styles.modalCloseButton}
                    >
                      <CloseIcon size={24} color={colors.text} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.tcSpecialtyScrollHint} numberOfLines={2}>
                    Lista em ordem alfabética. Role para ver todas.
                  </Text>
                  <ScrollView
                    style={styles.tcSpecialtyScroll}
                    contentContainerStyle={styles.tcSpecialtyScrollContent}
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled
                    showsVerticalScrollIndicator
                    bounces
                  >
                    {tcSpecialtyPickerRows.length <= 1 ? (
                      <View style={styles.modalEmptyContainer}>
                        <Text style={styles.modalEmptyText}>Carregando especialidades…</Text>
                      </View>
                    ) : (
                      tcSpecialtyPickerRows.map((item, index) => {
                        const selected =
                          item.id === '__all__'
                            ? tcFilterSpecialtyId == null
                            : Number(tcFilterSpecialtyId) === Number(item.id);
                        return (
                          <TouchableOpacity
                            key={`${item.id}-${index}`}
                            style={[styles.specialtyItem, selected && styles.specialtyItemSelected]}
                            onPress={() => {
                              if (item.id === '__all__') {
                                setTcFilterSpecialtyId(null);
                              } else {
                                setTcFilterSpecialtyId(item.id);
                              }
                              closeTeleconsultSpecialtyFilterModal();
                            }}
                            activeOpacity={0.65}
                          >
                            <Text
                              style={[
                                styles.specialtyItemText,
                                selected && styles.specialtyItemTextSelected,
                              ]}
                            >
                              {item.name}
                            </Text>
                            {selected ? <CheckmarkIcon size={22} color={colors.primary} /> : null}
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </ScrollView>
                </View>
              </View>
            ) : null}
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
            <View style={[styles.modalContent, styles.doctorDetailsModalSheet]}>
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
                style={[
                  styles.doctorDetailsScroll,
                  { maxHeight: Math.round(Dimensions.get('window').height * 0.62) },
                ]}
                contentContainerStyle={styles.doctorDetailsScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {selectedDoctorDetails && (() => {
                  const doc = getDoctorDetailsForModal(selectedDoctorDetails);
                  if (!doc) return null;
                  return (
                  <View style={styles.doctorDetailsContent}>
                    <View style={styles.doctorDetailsHeader}>
                      {doc.displayPhotoUrl ? (
                        <Image
                          source={{ uri: doc.displayPhotoUrl }}
                          style={styles.doctorDetailsPhoto}
                        />
                      ) : (
                        <View style={styles.doctorDetailsPhotoPlaceholder}>
                          <PersonIcon size={48} color={colors.gray400} />
                        </View>
                      )}
                      <Text style={styles.doctorDetailsName}>{doc.displayName}</Text>
                      {doc.displayCrm ? (
                        <Text style={styles.doctorDetailsCrm}>
                          CRM: {formatCrmDisplay(doc.displayCrm)}
                        </Text>
                      ) : null}
                      {doc.displayRating != null && doc.displayRating > 0 ? (
                        <View style={styles.doctorDetailsRating}>
                          {(() => {
                            const stars = [];
                            const fullStars = Math.floor(doc.displayRating);
                            const hasHalfStar = doc.displayRating % 1 >= 0.5;

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

                            const emptyStars = 5 - Math.ceil(doc.displayRating);
                            for (let i = 0; i < emptyStars; i++) {
                              stars.push(
                                <StarOutlineIcon key={`empty-${i}`} size={20} color={colors.gray400} />
                              );
                            }

                            return <View style={styles.starsContainer}>{stars}</View>;
                          })()}
                          <Text style={styles.doctorDetailsRatingText}>
                            {Number(doc.displayRating).toFixed(1)} ({doc.displayTotalReviews || 0} avaliações)
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {doc.displaySpecialty ? (
                      <View style={styles.doctorDetailsSection}>
                        <Text style={styles.doctorDetailsLabel}>Especialidade</Text>
                        <Text style={styles.doctorDetailsValue}>{doc.displaySpecialty}</Text>
                      </View>
                    ) : null}

                    <View style={styles.doctorDetailsSection}>
                      <Text style={styles.doctorDetailsLabel}>Nível de qualificação</Text>
                      <Text style={styles.doctorDetailsValue}>
                        {doc.displayQualification || 'Não informado'}
                      </Text>
                    </View>

                    {doc.displayGender ? (
                      <View style={styles.doctorDetailsSection}>
                        <Text style={styles.doctorDetailsLabel}>Sexo</Text>
                        <Text style={styles.doctorDetailsValue}>{doc.displayGender}</Text>
                      </View>
                    ) : null}

                    {doc.city || doc.state || doc.neighborhood ? (
                      <View style={styles.doctorDetailsSection}>
                        <Text style={styles.doctorDetailsLabel}>Localização</Text>
                        <Text style={styles.doctorDetailsValue}>
                          {[doc.city, doc.state, doc.neighborhood].filter(Boolean).join(', ')}
                        </Text>
                      </View>
                    ) : null}

                    {doc.phone ? (
                      <View style={styles.doctorDetailsSection}>
                        <Text style={styles.doctorDetailsLabel}>Telefone</Text>
                        <Text style={styles.doctorDetailsValue}>{doc.phone}</Text>
                      </View>
                    ) : null}

                    {doc.notes ? (
                      <View style={styles.doctorDetailsSection}>
                        <Text style={styles.doctorDetailsLabel}>Observações</Text>
                        <Text style={styles.doctorDetailsValue}>{doc.notes}</Text>
                      </View>
                    ) : null}

                    {doc.address ? (
                      <View style={styles.doctorDetailsSection}>
                        <Text style={styles.doctorDetailsLabel}>Endereço</Text>
                        <Text style={styles.doctorDetailsValue}>{doc.address}</Text>
                      </View>
                    ) : null}

                    {doc.displayFormation ? (
                      <View style={styles.doctorDetailsSection}>
                        <Text style={styles.doctorDetailsLabel}>Formação</Text>
                        <Text style={styles.doctorDetailsValue}>{doc.displayFormation}</Text>
                      </View>
                    ) : null}

                    <View style={styles.doctorDetailsSection}>
                      <Text style={styles.doctorDetailsLabel}>Cursos e certificações</Text>
                      {doc.courses && doc.courses.length > 0 ? (
                        doc.courses.map((course, index) => (
                          <View key={course.id || index} style={styles.courseItem}>
                            <SchoolIcon size={16} color={colors.primary} />
                            <Text style={styles.courseText}>
                              {course.name || course.course_name}
                              {course.institution ? ` — ${course.institution}` : ''}
                              {course.year != null && course.year !== '' ? ` (${course.year})` : ''}
                            </Text>
                          </View>
                        ))
                      ) : (
                        <Text style={[styles.doctorDetailsValue, styles.doctorDetailsMuted]}>
                          Nenhum curso ou certificação cadastrado.
                        </Text>
                      )}
                    </View>

                    {!doc.displaySpecialty &&
                    !doc.displayCrm &&
                    !doc.phone &&
                    !doc.notes &&
                    !doc.address &&
                    !doc.displayFormation &&
                    (!doc.courses || doc.courses.length === 0) &&
                    !doc.displayQualification ? (
                      <Text style={styles.doctorDetailsEmptyHint}>
                        Nenhum dado adicional cadastrado. Nome e CRM (quando houver) aparecem acima.
                      </Text>
                    ) : null}
                  </View>
                  );
                })()}
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
                      doctorAvailability.availableDays
                        .filter((dateKey) => {
                          // Filtrar datas passadas também no render (camada extra de proteção)
                          const dateParts = dateKey.split('-');
                          if (dateParts.length === 3) {
                            const dateObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
                            dateObj.setHours(0, 0, 0, 0);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            return dateObj >= today;
                          }
                          return true;
                        })
                        .map((dateKey) => {
                        // Criar data no timezone local para evitar deslocamento de um dia
                        // dateKey está no formato "YYYY-MM-DD"
                        const [year, month, day] = dateKey.split('-').map(Number);
                        const date = new Date(year, month - 1, day); // month é 0-indexed
                        const isSelected = selectedAvailabilityDate === dateKey;
                        let times = doctorAvailability.daySchedules?.[dateKey] || [];
                        
                        // Se for hoje, filtrar horários passados
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const dateObj = new Date(year, month - 1, day);
                        dateObj.setHours(0, 0, 0, 0);
                        const isToday = dateObj.getTime() === today.getTime();
                        
                        if (isToday) {
                          const now = new Date();
                          const currentHour = now.getHours();
                          const currentMinute = now.getMinutes();
                          
                          times = times.filter(time => {
                            if (!time || time.trim() === '') return false;
                            
                            // Normalizar horário
                            const normalizeTime = (t) => {
                              if (!t) return '';
                              const trimmed = t.trim();
                              if (/^\d{2}:\d{2}:\d{2}/.test(trimmed)) return trimmed.substring(0, 5);
                              if (/^\d{2}:\d{2}$/.test(trimmed)) return trimmed;
                              if (/^\d{1}:\d{2}$/.test(trimmed)) return `0${trimmed}`;
                              return trimmed;
                            };
                            
                            const normalizedTime = normalizeTime(time);
                            const [timeHour, timeMinute] = normalizedTime.split(':').map(Number);
                            
                            if (isNaN(timeHour) || isNaN(timeMinute)) return false;
                            
                            // Verificar se o horário já passou
                            if (timeHour < currentHour || (timeHour === currentHour && timeMinute <= currentMinute)) {
                              return false;
                            }
                            
                            return true;
                          });
                        }

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
  /** Teleconsulta (cuidador/amigo): menos espaço vertical até o botão agendar */
  contentCompactTeleconsult: {
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainerCompactTeleconsult: {
    marginBottom: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  titleCompactTeleconsult: {
    fontSize: 21,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  subtitleCompactTeleconsult: {
    fontSize: 13,
    marginBottom: 14,
    lineHeight: 18,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputContainerCompactTeleconsult: {
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  labelCompactTeleconsult: {
    marginBottom: 4,
    fontSize: 13,
  },
  helperTextBelowLabel: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: -4,
    marginBottom: 10,
    lineHeight: 18,
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
    flexGrow: 0,
    zIndex: 20,
    elevation: 20,
    minHeight: 52,
    marginBottom: 8,
  },
  /** Altura fixa no sheet + lista flex:1 + minHeight:0 = rolagem confiável (maxHeight no pai não basta). */
  specialtiesModalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    height: Math.round(Dimensions.get('window').height * 0.78),
    maxHeight: '88%',
    flexDirection: 'column',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  specialtiesModalListFlex: {
    flex: 1,
    minHeight: 0,
    width: '100%',
  },
  specialtiesModalEmptyBody: {
    flex: 1,
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
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
  textAreaWrapperCompactTeleconsult: {
    minHeight: 64,
    paddingVertical: 8,
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
  radioOptionCompactTeleconsult: {
    paddingVertical: 5,
    gap: 8,
    alignItems: 'flex-start',
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
  radioCompactTeleconsult: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginTop: 1,
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
  radioDotCompactTeleconsult: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  radioLabel: {
    fontSize: 15,
    color: colors.text,
  },
  radioLabelCompactTeleconsult: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
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
  labelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  autocompleteLeftButton: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  autocompleteClearButton: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    padding: 4,
  },
  addressPreviewContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.success + '10',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.success + '30',
  },
  addressPreview: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  addressPreviewText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.info + '20',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  infoCardCompactTeleconsult: {
    padding: 10,
    marginBottom: 12,
    gap: 8,
    borderRadius: 10,
  },
  infoContent: {
    flex: 1,
  },
  infoText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  infoTextCompactTeleconsult: {
    fontSize: 11,
    lineHeight: 15,
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
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
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
  /** Altura mínima evita ScrollView com flex colapsar a zero (modal de detalhes do médico) */
  doctorDetailsModalSheet: {
    minHeight: '48%',
    width: '100%',
  },
  /** Sheet fixo em coluna: evita flex:1 esticando o modal na tela inteira. */
  doctorSelectSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    height: Math.round(Dimensions.get('window').height * 0.86),
    maxHeight: '92%',
    flexDirection: 'column',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
  },
  modalSheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray300,
    marginTop: 10,
    marginBottom: 4,
  },
  modalHeaderTeleconsult: {
    paddingTop: 8,
    paddingBottom: 14,
    paddingHorizontal: 18,
  },
  modalTitleTeleconsult: {
    fontSize: 18,
    flex: 1,
    flexShrink: 1,
    marginRight: 8,
  },
  tcFilterPanel: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray200,
    backgroundColor: colors.gray50,
    flexGrow: 0,
    flexShrink: 1,
    maxHeight: Math.min(340, Math.round(Dimensions.get('window').height * 0.44)),
  },
  tcFilterPanelTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  tcFilterHint: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 12,
    lineHeight: 17,
  },
  tcFilterQualificationHint: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: -2,
    marginBottom: 8,
    lineHeight: 15,
  },
  tcFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tcFilterInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.backgroundLight,
    marginBottom: 8,
  },
  tcFilterInputFlex: {
    flex: 1,
    marginBottom: 0,
  },
  tcFilterStateInput: {
    width: 56,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.backgroundLight,
    textAlign: 'center',
  },
  tcFilterChipWide: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.primary + '12',
  },
  tcFilterChipText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginRight: 6,
  },
  tcFilterClearBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tcFilterClearText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
  },
  tcSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 12,
  },
  tcSwitchLabel: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
  },
  tcFilterSectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: 6,
    marginTop: 4,
  },
  tcChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  tcSortChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundLight,
  },
  tcSortChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '18',
  },
  tcSortChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  tcSortChipTextActive: {
    color: colors.primary,
  },
  flatListContentTeleconsult: {
    paddingBottom: 24,
  },
  tcEmptyList: {
    padding: 24,
    alignItems: 'center',
  },
  tcEmptyListText: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
  tcDoctorListFlex: {
    flex: 1,
    minHeight: 0,
    backgroundColor: '#FFFFFF',
  },
  doctorItemLocation: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  doctorItemNextSlot: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 2,
  },
  doctorItemNoSlot: {
    fontSize: 11,
    color: colors.gray400,
    marginTop: 2,
    fontStyle: 'italic',
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
  /** Overlay dentro do modal do médico: evita segundo Modal (que no Android quebra toques/abertura). */
  tcSpecialtyNestedOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 1000,
    elevation: 24,
  },
  tcSpecialtyNestedBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  tcSpecialtySimpleSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    zIndex: 2,
    height: Math.round(Dimensions.get('window').height * 0.78),
    maxHeight: '88%',
    flexDirection: 'column',
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  tcSpecialtyScrollHint: {
    fontSize: 12,
    color: colors.textLight,
    paddingHorizontal: 18,
    paddingBottom: 8,
    lineHeight: 16,
  },
  tcSpecialtyScroll: {
    flex: 1,
    minHeight: 120,
    backgroundColor: '#FFFFFF',
  },
  tcSpecialtyScrollContent: {
    paddingBottom: 8,
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
  modalEmptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalEmptyText: {
    fontSize: 16,
    color: colors.textLight,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalRetryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  modalRetryButtonText: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: '600',
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
  // Estilos para lista de médicos do grupo
  doctorListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  doctorListItemSelected: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
    borderWidth: 2,
  },
  doctorListItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  doctorListItemAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doctorListItemInfo: {
    flex: 1,
  },
  doctorListItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  doctorListItemNameSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  doctorListItemCrm: {
    fontSize: 13,
    color: colors.textLight,
    marginBottom: 2,
  },
  doctorListItemSpecialty: {
    fontSize: 12,
    color: colors.textLight,
  },
  addDoctorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    marginTop: 8,
  },
  addDoctorButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  // Container para lista de médicos com scroll
  doctorsListContainer: {
    maxHeight: 300,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundLight,
  },
  // Estilos para modal de adicionar médico
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalKeyboardView: {
    flex: 1,
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  modalBackButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeaderRight: {
    width: 40,
  },
  modalInputContainer: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  modalInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  modalSaveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  modalSaveButtonDisabled: {
    opacity: 0.6,
  },
  modalSaveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
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
    width: '100%',
  },
  doctorDetailsScrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  doctorDetailsContent: {
    padding: 20,
  },
  doctorDetailsEmptyHint: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
    marginTop: 8,
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
  doctorDetailsMuted: {
    color: colors.textLight,
    fontStyle: 'italic',
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


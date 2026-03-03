import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
  Platform,
  ActivityIndicator,
  Image,
  ImageBackground,
  Vibration,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  WhatsAppIcon,
  CallIcon,
  TimeOutlineIcon,
  ChevronForwardIcon,
  MicIcon,
  VideoCamIcon,
  CalendarIcon,
  MedicalIcon,
} from '../../components/CustomIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import colors from '../../constants/colors';
import { LacosIcon } from '../../components/LacosLogo';
import PanicButton from '../../components/PanicButton';
import MediaCarousel from '../../components/MediaCarousel';
import AlertCard from '../../components/AlertCard';
import VideoPlayerModal from '../../components/VideoPlayerModal';
import ImageViewerModal from '../../components/ImageViewerModal';
import { useAuth } from '../../contexts/AuthContext';
import groupService from '../../services/groupService';
import appointmentService from '../../services/appointmentService';
import medicationService from '../../services/medicationService';
import emergencyContactService from '../../services/emergencyContactService';
import mediaService from '../../services/mediaService';
import alertService from '../../services/alertService';
import websocketService from '../../services/websocketService';
import API_CONFIG from '../../config/api';

const PATIENT_SESSION_KEY = '@lacos_patient_session';
const GROUPS_STORAGE_KEY = '@lacos_groups';

const PatientHomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [patientSession, setPatientSession] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [groupId, setGroupId] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [media, setMedia] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageViewer, setShowImageViewer] = useState(false);
  
  // Calcular padding bottom para o ScrollView (altura do tab bar + inset do Android)
  const tabBarHeight = 60;
  const tabBarPaddingBottom = Platform.OS === 'android' 
    ? Math.max(insets.bottom, 8) 
    : 8;
  const scrollViewPaddingBottom = tabBarHeight + tabBarPaddingBottom + 20; // +20 para espaçamento extra

  useFocusEffect(
    React.useCallback(() => {
      loadPatientData();
      
      // Inicializar WebSocket quando a tela ganhar foco
      return () => {
        // Limpar listeners quando a tela perder foco
        if (groupId) {
          websocketService.stopListeningToGroup(groupId);
        }
      };
    }, [groupId])
  );

  // Efeito para vibrar quando houver alertas de medicamento
  useEffect(() => {
    const medicationAlerts = alerts.filter(alert => alert.type === 'medication');
    
    if (medicationAlerts.length > 0) {
      // Vibração três vezes: vibrar 400ms, pausa 200ms, vibrar 400ms, pausa 200ms, vibrar 400ms
      const vibrationPattern = [0, 400, 200, 400, 200, 400];
      
      // Verificar se Vibration está disponível
      if (Vibration && Vibration.vibrate) {
        Vibration.vibrate(vibrationPattern);
        console.log('📳 Vibração acionada para alerta de medicamento');
      } else {
        // Fallback para versões antigas do React Native
        try {
          Vibration.vibrate(400);
          setTimeout(() => Vibration.vibrate(400), 600);
          setTimeout(() => Vibration.vibrate(400), 1200);
        } catch (error) {
          console.warn('⚠️ Vibração não disponível:', error);
        }
      }
    }
  }, [alerts]);

  // Efeito para escutar eventos WebSocket quando groupId mudar
  useEffect(() => {
    if (!groupId) return;

    console.log('🔌 PatientHomeScreen - Inicializando WebSocket para grupo:', groupId);

    // Inicializar WebSocket
    const initWebSocket = async () => {
      try {
        await websocketService.initialize();
        console.log('✅ PatientHomeScreen - WebSocket inicializado');
        
        // Aguardar um pouco antes de escutar eventos para garantir conexão
        setTimeout(() => {
          console.log('🔌 PatientHomeScreen - Configurando listeners do WebSocket...');
          // Escutar eventos do grupo
          websocketService.listenToGroup(groupId, {
      onMediaDeleted: (data) => {
        console.log('📡 PatientHomeScreen - Mídia deletada via WebSocket:', data);
        console.log('📡 PatientHomeScreen - Dados recebidos:', JSON.stringify(data, null, 2));
        
        // Extrair ID da mídia (pode vir como media_id ou id)
        const deletedMediaId = data.media_id || data.id || data.media?.id;
        
        if (!deletedMediaId) {
          console.warn('⚠️ PatientHomeScreen - ID da mídia não encontrado nos dados:', data);
          // Se não tiver ID, recarregar lista completa após um pequeno delay
          setTimeout(() => {
            console.log('🔄 PatientHomeScreen - Recarregando mídias (fallback)...');
            loadGroupMedia(groupId);
          }, 500);
          return;
        }
        
        console.log('🗑️ PatientHomeScreen - Removendo mídia ID:', deletedMediaId);
        console.log('📋 PatientHomeScreen - Estado atual de mídias:', media.length, 'itens');
        
        // Remover mídia da lista
        setMedia(prev => {
          const beforeCount = prev.length;
          console.log('📋 PatientHomeScreen - IDs antes da remoção:', prev.map(m => ({ id: m.id, media_id: m.media_id })));
          
          const filtered = prev.filter(m => {
            // Comparar tanto com id quanto com media_id para garantir
            const mediaId = m.id || m.media_id;
            // Converter ambos para string para comparação mais robusta
            const shouldKeep = String(mediaId) !== String(deletedMediaId);
            if (!shouldKeep) {
              console.log('✅ PatientHomeScreen - Mídia encontrada e será removida:', mediaId);
            }
            return shouldKeep;
          });
          const afterCount = filtered.length;
          
          console.log('📋 PatientHomeScreen - IDs depois da remoção:', filtered.map(m => ({ id: m.id, media_id: m.media_id })));
          
          if (beforeCount === afterCount) {
            console.warn('⚠️ PatientHomeScreen - Mídia não encontrada na lista para remover:', deletedMediaId);
            console.log('📋 PatientHomeScreen - IDs na lista atual:', prev.map(m => ({ id: m.id, media_id: m.media_id })));
            // Se não encontrou, recarregar lista completa
            setTimeout(() => {
              console.log('🔄 PatientHomeScreen - Recarregando mídias (mídia não encontrada)...');
              loadGroupMedia(groupId);
            }, 500);
            return prev; // Retornar lista original se não encontrou
          } else {
            console.log(`✅ PatientHomeScreen - Mídia removida com sucesso: ${beforeCount} → ${afterCount} itens`);
            // Forçar re-render do MediaCarousel
            return filtered;
          }
        });
      },
      onMediaCreated: (data) => {
        console.log('📡 PatientHomeScreen - Nova mídia criada via WebSocket:', data);
        // Adicionar nova mídia à lista
        if (data.media && data.media.id) {
          setMedia(prev => {
            // Verificar se já existe para evitar duplicatas
            const exists = prev.some(m => m.id === data.media.id);
            if (exists) {
              console.log('📡 PatientHomeScreen - Mídia já existe na lista, atualizando...');
              return prev.map(m => m.id === data.media.id ? data.media : m);
            }
            // Adicionar no início da lista
            return [data.media, ...prev];
          });
        } else {
          // Se não tiver dados completos, recarregar
          console.log('📡 PatientHomeScreen - Recarregando mídias...');
          loadPatientData();
        }
      },
          });
        }, 1000);
      } catch (error) {
        console.error('❌ PatientHomeScreen - Erro ao inicializar WebSocket:', error);
      }
    };

    initWebSocket();

    // Cleanup quando groupId mudar ou componente desmontar
    return () => {
      if (groupId) {
        websocketService.stopListeningToGroup(groupId);
      }
    };
  }, [groupId]);

  const loadPatientData = async () => {
    setLoading(true);
    try {
      // 1. Buscar grupos do usuário
      const groupsResult = await groupService.getMyGroups();
      
      if (groupsResult.success && groupsResult.data && groupsResult.data.length > 0) {
        const patientGroup = groupsResult.data[0]; // Paciente deve ter apenas 1 grupo
        const currentGroupId = patientGroup.id;
        
        console.log('📋 PatientHomeScreen - Grupo encontrado:', patientGroup.name);
        setGroupId(currentGroupId);
        
        // 2. Carregar eventos (appointments + medications)
        await loadUpcomingEvents(currentGroupId);
        
        // 3. Carregar contatos de emergência da API
        await loadEmergencyContacts(currentGroupId);
        
        // 4. Carregar mídias do grupo
        await loadGroupMedia(currentGroupId);
        
        // 5. Carregar alertas ativos
        await loadActiveAlerts(currentGroupId);
        
        // 6. Manter sessão no AsyncStorage (temporário)
        const sessionJson = await AsyncStorage.getItem(PATIENT_SESSION_KEY);
        if (sessionJson) {
          const session = JSON.parse(sessionJson);
          setPatientSession(session);
        }
      } else {
        console.warn('⚠️ PatientHomeScreen - Nenhum grupo encontrado para o paciente');
        // Limpar dados do grupo anterior se existir
        setGroupId(null);
        setContacts([]);
        setEvents([]);
        setMedia([]);
        setAlerts([]);
        // Navegar para tela de entrar em grupo se não houver grupos
        // Usar reset para garantir que a tela de entrar em grupo seja a única na pilha
        navigation.reset({
          index: 0,
          routes: [{ name: 'PatientJoinGroup' }],
        });
      }
    } catch (error) {
      console.error('❌ PatientHomeScreen - Erro ao carregar dados:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível carregar os dados',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUpcomingEvents = async (currentGroupId) => {
    try {
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      console.log('📅 PatientHomeScreen - Carregando eventos do grupo:', currentGroupId);
      
      // Buscar appointments
      const appointmentsResult = await appointmentService.getAppointments(
        currentGroupId,
        today.toISOString().split('T')[0],
        nextWeek.toISOString().split('T')[0]
      );
      
      console.log('📅 PatientHomeScreen - Appointments result:', {
        success: appointmentsResult.success,
        dataLength: appointmentsResult.data ? (Array.isArray(appointmentsResult.data) ? appointmentsResult.data.length : 'not array') : 'null',
        error: appointmentsResult.error
      });
      
      // Filtrar teleconsultas não pagas - pacientes só devem ver teleconsultas pagas
      let filteredAppointments = [];
      if (appointmentsResult.success && appointmentsResult.data && Array.isArray(appointmentsResult.data)) {
        console.log('🔍 PatientHomeScreen - Filtrando appointments:', {
          total: appointmentsResult.data.length,
          appointments: appointmentsResult.data.map(apt => ({
            id: apt.id,
            is_teleconsultation: apt.is_teleconsultation,
            payment_status: apt.payment_status,
          })),
        });
        
        filteredAppointments = appointmentsResult.data.filter(apt => {
          // Se for teleconsulta, só mostrar se já foi paga
          const isTeleconsultation = apt.is_teleconsultation || apt.data?.is_teleconsultation || false;
          if (isTeleconsultation) {
            const paymentStatus = apt.payment_status || apt.data?.payment_status;
            console.log('🔍 PatientHomeScreen - Verificando teleconsulta:', {
              appointmentId: apt.id,
              is_teleconsultation: isTeleconsultation,
              payment_status: paymentStatus,
              shouldShow: !(paymentStatus === 'pending' || paymentStatus === null || paymentStatus === undefined),
            });
            
            if (paymentStatus === 'pending' || paymentStatus === null || paymentStatus === undefined) {
              console.log('🚫 PatientHomeScreen - Ocultando teleconsulta não paga:', {
                appointmentId: apt.id,
                payment_status: paymentStatus,
              });
              return false; // Não mostrar para paciente
            }
          }
          return true; // Mostrar todas as outras
        });
        
        console.log('📋 PatientHomeScreen - Appointments filtrados:', {
          total: appointmentsResult.data.length,
          filtrados: filteredAppointments.length,
          ocultados: appointmentsResult.data.length - filteredAppointments.length,
        });
      } else {
        filteredAppointments = appointmentsResult.data || [];
      }
      
      // Buscar medications
      const medicationsResult = await medicationService.getMedications(currentGroupId);
      
      console.log('💊 PatientHomeScreen - Medications result:', {
        success: medicationsResult.success,
        dataLength: medicationsResult.data ? (Array.isArray(medicationsResult.data) ? medicationsResult.data.length : 'not array') : 'null',
        error: medicationsResult.error
      });
      
      const upcomingEvents = [];
      
      // Processar appointments (usar filteredAppointments que já filtra teleconsultas não pagas)
      const appointmentsList = [];
      if (appointmentsResult.success && filteredAppointments) {
        const appointments = Array.isArray(filteredAppointments) ? filteredAppointments : [];
        appointments.forEach(appointment => {
          // FILTRO ADICIONAL: Verificar novamente se é teleconsulta não paga
          // (dupla verificação para garantir que não apareça para paciente)
          if (appointment.is_teleconsultation) {
            const paymentStatus = appointment.payment_status;
            if (paymentStatus === 'pending' || paymentStatus === null) {
              console.log('🚫 PatientHomeScreen - Ocultando teleconsulta não paga no processamento:', {
                appointmentId: appointment.id,
                payment_status: paymentStatus,
              });
              return; // Não processar esta consulta
            }
          }
          
          // Backend usa 'appointment_date' não 'scheduled_at'
          const appointmentDate = new Date(appointment.appointment_date || appointment.scheduled_at);
          const hours = appointmentDate.getHours().toString().padStart(2, '0');
          const minutes = appointmentDate.getMinutes().toString().padStart(2, '0');
          const dateLabel = isToday(appointmentDate) ? 'Hoje' : isTomorrow(appointmentDate) ? 'Amanhã' : formatDate(appointmentDate);
          
          const appointmentEvent = {
            id: `appointment-${appointment.id}`,
            type: 'appointment',
            title: appointment.title || 'Consulta',
            description: appointment.description || (appointment.type === 'medical' ? 'Médico' : appointment.type === 'common' ? 'Compromisso' : appointment.type === 'fisioterapia' ? 'Fisioterapia' : appointment.type === 'exames' ? 'Exames' : appointment.type) || '',
            time: `${hours}:${minutes}`,
            date: dateLabel,
            icon: appointment.is_teleconsultation ? 'videocam' : 'calendar',
            color: appointment.is_teleconsultation ? colors.primary : colors.warning,
            appointmentTime: appointmentDate.toISOString(),
            data: appointment,
            is_teleconsultation: appointment.is_teleconsultation || false,
          };
          
          appointmentsList.push(appointmentEvent);
          upcomingEvents.push(appointmentEvent);
        });
      }
      
      // Salvar appointments separadamente
      setAppointments(appointmentsList);
      
      // Processar medications (próximas doses)
      if (medicationsResult.success && medicationsResult.data) {
        const medications = Array.isArray(medicationsResult.data) ? medicationsResult.data : [];
        medications.forEach(medication => {
          // Calcular próximas doses baseado no schedule
          const nextDoses = calculateNextDoses(medication);
          nextDoses.forEach(dose => {
            upcomingEvents.push({
              id: `medication-${medication.id}-${dose.time}`,
              type: 'medication',
              title: 'Hora do Remédio',
              description: `${medication.name} ${medication.dosage || ''}`,
              time: dose.time,
              date: dose.date,
              icon: 'medical',
              color: colors.secondary,
              data: medication,
            });
          });
        });
      }
      
      // Ordenar por data/hora
      upcomingEvents.sort((a, b) => {
        const dateA = a.appointmentTime ? new Date(a.appointmentTime) : new Date(`${a.date} ${a.time}`);
        const dateB = b.appointmentTime ? new Date(b.appointmentTime) : new Date(`${b.date} ${b.time}`);
        return dateA - dateB;
      });
      
      console.log(`✅ PatientHomeScreen - ${upcomingEvents.length} evento(s) próximo(s) carregado(s)`);
      console.log('📋 PatientHomeScreen - Eventos:', upcomingEvents.map(e => ({ type: e.type, title: e.title, date: e.date, time: e.time })));
      setNotifications(upcomingEvents);
    } catch (error) {
      console.error('❌ PatientHomeScreen - Erro ao carregar eventos:', error);
      setNotifications([]);
    }
  };

  const loadEmergencyContacts = async (currentGroupId) => {
    try {
      console.log('📞 PatientHomeScreen - Carregando contatos de emergência do grupo:', currentGroupId);
      
      // Buscar contatos de emergência da API
      const contactsResult = await emergencyContactService.getEmergencyContacts(currentGroupId);
      
      // Buscar membros do grupo que são contatos de emergência
      const membersResult = await groupService.getGroupMembers(currentGroupId);
      
      const allContacts = [];
      const colorOptions = [colors.primary, colors.secondary, colors.info];
      
      // Adicionar contatos de emergência (tabela emergency_contacts)
      // NOVA LÓGICA: Carregar todos os contatos (rápidos e SOS) sem filtrar
      if (contactsResult.success && contactsResult.data) {
        const emergencyContacts = Array.isArray(contactsResult.data) ? contactsResult.data : [];
        console.log('🔍 PatientHomeScreen - Contatos da API:', emergencyContacts.length);
        console.log('🔍 PatientHomeScreen - Detalhes:', emergencyContacts.map(c => ({
          name: c.name,
          relationship: c.relationship,
          is_primary: c.is_primary
        })));
        
        // Adicionar todos os contatos (sem filtrar por SOS ou não)
        emergencyContacts.forEach((contact, index) => {
          allContacts.push({
            id: `emergency-${contact.id}`,
            name: contact.name,
            phone: contact.phone,
            relationship: contact.relationship || 'Contato',
            color: colorOptions[index % colorOptions.length],
            type: 'emergency',
            photo: contact.photo,
            photo_url: contact.photo_url,
            isSOS: contact.relationship === 'SOS' || contact.relationship === 'sos' || contact.is_primary === true,
          });
          console.log(`📸 Contato ${contact.name}: photo=${contact.photo}, photo_url=${contact.photo_url}, isSOS=${contact.relationship === 'SOS' || contact.is_primary === true}`);
        });
      }
      
      // Adicionar membros que são contatos de emergência (group_members com is_emergency_contact=true)
      if (membersResult.success && membersResult.data) {
        const members = Array.isArray(membersResult.data) ? membersResult.data : [];
        const emergencyMembers = members.filter(m => m.is_emergency_contact);
        
        emergencyMembers.forEach((member, index) => {
          allContacts.push({
            id: `member-${member.user_id || member.id}`,
            name: member.user?.name || member.name || 'Membro do Grupo',
            phone: member.user?.phone || member.phone || '',
            relationship: member.role === 'admin' ? 'Cuidador Principal' : 'Cuidador',
            color: colorOptions[(allContacts.length + index) % colorOptions.length],
            type: 'member',
          });
        });
      }
      
      // Limitar a 3 contatos (os 3 primeiros) - independente de serem SOS ou não
      const displayedContacts = allContacts.slice(0, 3);
      
      console.log(`✅ PatientHomeScreen - ${displayedContacts.length} contato(s) carregado(s)`);
      console.log('✅ PatientHomeScreen - Contatos exibidos:', displayedContacts.map(c => ({
        name: c.name,
        isSOS: c.isSOS
      })));
      setContacts(displayedContacts);
    } catch (error) {
      console.error('❌ PatientHomeScreen - Erro ao carregar contatos:', error);
      setContacts([]);
    }
  };

  const loadGroupMedia = async (currentGroupId) => {
    try {
      console.log('📥 PatientHomeScreen - Carregando mídias do grupo:', currentGroupId);
      const mediaResult = await mediaService.getGroupMedia(currentGroupId);
      
      console.log('📥 PatientHomeScreen - Media result:', {
        success: mediaResult.success,
        dataLength: mediaResult.data ? (Array.isArray(mediaResult.data) ? mediaResult.data.length : 'not array') : 'null',
        error: mediaResult.error
      });
      
      if (mediaResult.success && mediaResult.data) {
        const mediaArray = Array.isArray(mediaResult.data) ? mediaResult.data : [];
        console.log(`✅ PatientHomeScreen - ${mediaArray.length} mídia(s) carregada(s)`);
        if (mediaArray.length > 0) {
          console.log('📋 PatientHomeScreen - IDs das mídias:', mediaArray.map(m => ({ id: m.id, media_id: m.media_id, type: m.type })));
        }
        setMedia(mediaArray);
      } else {
        console.log('⚠️ PatientHomeScreen - Nenhuma mídia encontrada ou erro:', mediaResult.error);
        setMedia([]);
      }
    } catch (error) {
      console.error('❌ PatientHomeScreen - Erro ao carregar mídias:', error);
      setMedia([]);
    }
  };

  const loadActiveAlerts = async (currentGroupId) => {
    try {
      const alertsResult = await alertService.getActiveAlerts(currentGroupId);
      
      // Sempre definir os alertas, mesmo se houver erro (retorna array vazio)
      if (alertsResult.success && alertsResult.data) {
        setAlerts(Array.isArray(alertsResult.data) ? alertsResult.data : []);
        if (alertsResult.data.length > 0) {
          console.log(`✅ PatientHomeScreen - ${alertsResult.data.length} alerta(s) ativo(s)`);
        }
      } else {
        // Se houver erro, definir array vazio para não quebrar a UI
        setAlerts([]);
        if (alertsResult.error) {
          console.warn('⚠️ PatientHomeScreen - Erro ao carregar alertas (não crítico):', alertsResult.error);
        }
      }
    } catch (error) {
      console.error('❌ PatientHomeScreen - Erro ao carregar alertas:', error);
      // Sempre definir array vazio em caso de erro para não quebrar a UI
      setAlerts([]);
    }
  };

  const handleMarkAsTaken = async (alertId) => {
    try {
      const result = await alertService.markMedicationTaken(alertId);
      
      if (result.success) {
        // Remover alerta da lista
        setAlerts(prev => prev.filter(a => a.id !== alertId));
        Toast.show({
          type: 'success',
          text1: 'Medicamento marcado',
          text2: 'Registrado com sucesso!',
        });
      }
    } catch (error) {
      console.error('❌ Erro ao marcar medicamento:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível marcar o medicamento',
      });
    }
  };

  const handleDismissAlert = async (alertId) => {
    try {
      const result = await alertService.dismissAlert(alertId);
      
      if (result.success) {
        setAlerts(prev => prev.filter(a => a.id !== alertId));
      }
    } catch (error) {
      console.error('❌ Erro ao dispensar alerta:', error);
    }
  };

  const handleMediaPress = (mediaItem) => {
    console.log('📱 PatientHomeScreen - Mídia pressionada:', mediaItem);
    
    const isVideo = mediaItem.type === 'video' || mediaItem.media_type === 'video';
    let mediaUrl = mediaItem.url || mediaItem.media_url || mediaItem.file_url;
    
    // Construir URL completa se for relativa
    if (mediaUrl && !mediaUrl.startsWith('http://') && !mediaUrl.startsWith('https://')) {
      const baseUrl = API_CONFIG.BASE_URL.replace('/api', '');
      if (mediaUrl.startsWith('/storage/')) {
        mediaUrl = `${baseUrl}${mediaUrl}`;
      } else if (mediaUrl.startsWith('storage/')) {
        mediaUrl = `${baseUrl}/${mediaUrl}`;
      } else {
        mediaUrl = mediaUrl.startsWith('/') ? `${baseUrl}${mediaUrl}` : `${baseUrl}/${mediaUrl}`;
      }
    }
    
    if (isVideo && mediaUrl) {
      console.log('▶️ PatientHomeScreen - Abrindo player de vídeo:', mediaUrl);
      setSelectedVideo({
        uri: mediaUrl,
        title: mediaItem.description || 'Vídeo',
      });
      setShowVideoPlayer(true);
    } else if (!isVideo && mediaUrl) {
      // Para imagens, abrir modal de visualização em tela cheia
      console.log('🖼️ PatientHomeScreen - Abrindo visualizador de imagem:', mediaUrl);
      setSelectedImage({
        uri: mediaUrl,
        title: mediaItem.description || 'Imagem',
        description: mediaItem.description || null,
      });
      setShowImageViewer(true);
    }
  };

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const isTomorrow = (date) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return date.getDate() === tomorrow.getDate() &&
      date.getMonth() === tomorrow.getMonth() &&
      date.getFullYear() === tomorrow.getFullYear();
  };

  const formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}/${month}`;
  };

  const calculateNextDoses = (medication) => {
    // Backend usa 'times' (JSON) não 'schedule' (array)
    let timesArray = [];
    
    // Tentar extrair horários do campo 'times'
    if (medication.times) {
      if (Array.isArray(medication.times)) {
        timesArray = medication.times;
      } else if (typeof medication.times === 'object') {
        // Se for objeto, tentar extrair array de valores
        timesArray = Object.values(medication.times);
      } else if (typeof medication.times === 'string') {
        try {
          const parsed = JSON.parse(medication.times);
          timesArray = Array.isArray(parsed) ? parsed : Object.values(parsed);
        } catch (e) {
          console.warn('Erro ao parsear times:', e);
        }
      }
    }
    
    // Fallback: tentar 'schedule' se existir
    if (timesArray.length === 0 && medication.schedule) {
      timesArray = Array.isArray(medication.schedule) ? medication.schedule : [];
    }
    
    if (timesArray.length === 0) {
      return [];
    }
    
    const today = new Date();
    const nextDoses = [];
    
    // Pegar até 3 próximas doses
    timesArray.slice(0, 3).forEach(time => {
      // Garantir que time é string
      const timeStr = typeof time === 'string' ? time : String(time);
      const [hours, minutes] = timeStr.split(':');
      
      if (!hours || !minutes) return;
      
      const doseDate = new Date(today);
      doseDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      // Se o horário já passou hoje, pegar para amanhã
      if (doseDate < today) {
        doseDate.setDate(doseDate.getDate() + 1);
      }
      
      nextDoses.push({
        time: timeStr,
        date: isToday(doseDate) ? 'Hoje' : isTomorrow(doseDate) ? 'Amanhã' : formatDate(doseDate),
      });
    });
    
    return nextDoses;
  };


  const makePhoneCall = async (contact) => {
    // Validar se o contato tem número
    if (!contact || !contact.phone) {
      Toast.show({
        type: 'error',
        text1: 'Contato Inválido',
        text2: 'Este contato não tem número de telefone configurado',
        position: 'bottom',
      });
      return;
    }

    // Limpar o número (remover formatação)
    const cleanPhone = contact.phone.replace(/\D/g, '');

    if (cleanPhone.length < 10) {
      Toast.show({
        type: 'error',
        text1: 'Número Inválido',
        text2: 'O número de telefone está incompleto',
        position: 'bottom',
      });
      return;
    }

    // 🎯 ESTRATÉGIA INTELIGENTE POR PLATAFORMA
    if (Platform.OS === 'android') {
      // ✅ ANDROID: WhatsApp funciona melhor
      console.log('📱 Android detectado - Tentando WhatsApp...');
      tryWhatsAppCall(contact.name, cleanPhone);
    } else {
      // ✅ iOS: Chamada telefônica é mais confiável
      console.log('🍎 iOS detectado - Chamada telefônica direta...');
      performCall(contact.name, cleanPhone);
    }
  };

  const tryWhatsAppCall = async (contactName, cleanPhone) => {
    // Formatar número para WhatsApp
    let whatsappNumber = cleanPhone;
    if (whatsappNumber.startsWith('0')) {
      whatsappNumber = whatsappNumber.substring(1);
    }
    if (!whatsappNumber.startsWith('55')) {
      whatsappNumber = '55' + whatsappNumber;
    }

    console.log('💬 WhatsApp - Iniciando chamada:', whatsappNumber);

    try {
      // 🎯 ANDROID: Tentar deep link de chamada direta
      const whatsappCallUrl = `whatsapp://send?phone=${whatsappNumber}`;
      
      const canOpen = await Linking.canOpenURL(whatsappCallUrl);
      
      if (canOpen) {
        await Linking.openURL(whatsappCallUrl);
        console.log('✅ WhatsApp aberto para:', contactName);
        
        // Mostrar toast com instrução
        Toast.show({
          type: 'success',
          text1: '💬 WhatsApp Aberto',
          text2: `Toque no ícone de telefone 📞 para ligar`,
          position: 'top',
          visibilityTime: 5000,
        });
      } else {
        // WhatsApp não instalado - Fallback para telefone
        console.log('⚠️ WhatsApp não disponível, usando telefone...');
        performCall(contactName, cleanPhone);
      }
    } catch (error) {
      // Erro - Fallback para telefone
      console.error('⚠️ Erro ao abrir WhatsApp:', error);
      performCall(contactName, cleanPhone);
    }
  };

  const performCall = async (contactName, cleanPhone) => {
    try {
      console.log('[Call] Iniciando chamada para:', contactName);
      console.log('[Call] Número limpo:', cleanPhone);
      
      // Formatar corretamente para Brasil
      // Se já começa com 55, adicionar +
      // Se não, adicionar +55
      let formattedPhone = cleanPhone;
      if (cleanPhone.startsWith('55')) {
        formattedPhone = '+' + cleanPhone;
      } else if (!cleanPhone.startsWith('+')) {
        formattedPhone = '+55' + cleanPhone;
      }
      
      // Adicionar espaços para melhor formatação
      // +55 31 98310-4230
      if (formattedPhone.startsWith('+55') && formattedPhone.length === 13) {
        // Formato: +55 XX XXXXX-XXXX
        formattedPhone = `${formattedPhone.slice(0, 3)} ${formattedPhone.slice(3, 5)} ${formattedPhone.slice(5, 10)}-${formattedPhone.slice(10)}`;
      }
      
      const phoneUrl = `tel:${formattedPhone}`;
      console.log('[Call] Número formatado:', formattedPhone);
      console.log('[Call] URL da chamada:', phoneUrl);

      await Linking.openURL(phoneUrl);
      console.log('[Call] ✅ Discador aberto!');
    } catch (error) {
      console.error('[Call] ERRO:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível abrir o discador',
        position: 'bottom',
      });
    }
  };

  const handleNotificationPress = async (notification) => {
    if (notification.type === 'appointment') {
      const appointment = notification.data;
      
      // Verificar se é teleconsulta
      if (appointment?.is_teleconsultation) {
        const appointmentDate = new Date(appointment.appointment_date || appointment.scheduled_at || notification.appointmentTime);
        const now = new Date();
        const minutesUntilAppointment = (appointmentDate - now) / (1000 * 60);
        
        // Permitir entrada 15 minutos antes da consulta
        if (minutesUntilAppointment <= 15 && minutesUntilAppointment >= -60) {
          // Dentro do período permitido (15 min antes até 1 hora depois)
          navigation.navigate('PatientVideoCall', {
            appointment: appointment,
            doctorInfo: appointment.doctorUser || appointment.doctor || {
              name: appointment.doctor_name || 'Médico',
            },
          });
        } else if (minutesUntilAppointment > 15) {
          // Ainda não é hora (mais de 15 minutos antes)
          const minutes = Math.ceil(minutesUntilAppointment - 15);
          Alert.alert(
            'Aguarde',
            `Você poderá entrar na videochamada em ${minutes} minuto(s).\n\nA entrada é permitida 15 minutos antes do horário da consulta.`,
            [{ text: 'OK' }]
          );
        } else {
          // Consulta já passou (mais de 1 hora depois)
          Alert.alert(
            'Consulta Encerrada',
            'O horário para entrar nesta consulta já passou.',
            [{ text: 'OK' }]
          );
        }
      } else {
        // Não é teleconsulta, navegar para detalhes normalmente
        navigation.navigate('AppointmentDetails', {
          appointment: notification,
        });
      }
    } else if (notification.type === 'medication') {
      Alert.alert(
        notification.title,
        notification.description,
        [
          { text: 'Manter alerta' },
          { 
            text: 'Já tomei', 
            style: 'default',
            onPress: () => {
              // Remover medicamento da lista quando marcar como "Já tomei"
              setNotifications(prev => prev.filter(n => n.id !== notification.id));
              
              Toast.show({
                type: 'success',
                text1: '✅ Medicamento registrado',
                text2: 'Dose marcada como tomada',
                position: 'bottom',
              });
            }
          },
        ]
      );
    }
  };

  const handleStartVideoCall = async (appointment) => {
    try {
      const appointmentData = appointment.data || appointment;
      const appointmentDate = new Date(appointmentData.appointment_date || appointmentData.scheduled_at || appointment.appointmentTime);
      const now = new Date();
      const minutesUntilAppointment = (appointmentDate - now) / (1000 * 60);
      
      // Permitir entrada 15 minutos antes da consulta
      if (minutesUntilAppointment <= 15 && minutesUntilAppointment >= -60) {
        // Dentro do período permitido (15 min antes até 1 hora depois)
        navigation.navigate('PatientVideoCall', {
          appointment: appointmentData,
          doctorInfo: appointmentData.doctorUser || appointmentData.doctor || {
            name: appointmentData.doctor_name || 'Médico',
          },
        });
      } else if (minutesUntilAppointment > 15) {
        // Ainda não é hora (mais de 15 minutos antes)
        const minutes = Math.ceil(minutesUntilAppointment - 15);
        Alert.alert(
          'Aguarde',
          `Você poderá entrar na videochamada em ${minutes} minuto(s).\n\nA entrada é permitida 15 minutos antes do horário da consulta.`,
          [{ text: 'OK' }]
        );
      } else {
        // Consulta já passou (mais de 1 hora depois)
        Alert.alert(
          'Consulta Encerrada',
          'O horário para entrar nesta consulta já passou.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Erro ao iniciar videoconferência:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível iniciar a videoconferência',
      });
    }
  };

  const handleStartRecording = (appointment) => {
    try {
      const appointmentData = appointment.data || appointment;
      navigation.navigate('RecordingScreen', {
        appointment: appointmentData,
      });
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível iniciar a gravação',
      });
    }
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <View style={styles.headerLeft}>
          <LacosIcon size={36} />
          <View>
            <Text style={styles.greeting}>Olá,</Text>
            <Text style={styles.userName}>{user?.name || 'Paciente'}</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: scrollViewPaddingBottom }}
      >
        {/* Active Alerts */}
        {alerts.length > 0 && (
          <View style={styles.alertsSection}>
            {alerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onMarkAsTaken={alert.type === 'medication' ? () => handleMarkAsTaken(alert.id) : null}
                onDismiss={() => handleDismissAlert(alert.id)}
              />
            ))}
          </View>
        )}

        {/* Contact Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contatos</Text>
          
          <View style={styles.cardsGrid}>
            {/* Contact Cards (max 3) */}
            {contacts.slice(0, 3).map((contact, index) => {
              const hasPhoto = contact.photo || contact.photo_url;
              
              return (
                <TouchableOpacity
                  key={contact.id}
                  style={[styles.card, !hasPhoto && { backgroundColor: contact.color }]}
                  onPress={() => makePhoneCall(contact)}
                  activeOpacity={0.8}
                >
                  {hasPhoto ? (
                    <ImageBackground
                      source={{ uri: contact.photo_url || contact.photo }}
                      style={styles.cardImageBackground}
                      imageStyle={styles.cardImage}
                    >
                      <View style={styles.cardOverlay}>
                        {Platform.OS === 'android' ? (
                          <WhatsAppIcon size={36} color={colors.textWhite} />
                        ) : (
                          <CallIcon size={36} color={colors.textWhite} />
                        )}
                        <Text style={styles.cardTitle}>{contact.name}</Text>
                        <View style={styles.cardBadge}>
                          <Text style={styles.cardBadgeText}>
                            {Platform.OS === 'android' ? '💬 WhatsApp' : '📞 Ligar'}
                          </Text>
                        </View>
                      </View>
                    </ImageBackground>
                  ) : (
                    <>
                      {Platform.OS === 'android' ? (
                        <WhatsAppIcon size={36} color={colors.textWhite} />
                      ) : (
                        <CallIcon size={36} color={colors.textWhite} />
                      )}
                      <Text style={styles.cardTitle}>{contact.name}</Text>
                      <View style={styles.cardBadge}>
                        <Text style={styles.cardBadgeText}>
                          {Platform.OS === 'android' ? '💬 WhatsApp' : '📞 Ligar'}
                        </Text>
                      </View>
                    </>
                  )}
                </TouchableOpacity>
              );
            })}

            {/* Botão de Pânico como Quarto Card */}
            {groupId && (
              <View style={styles.panicCard}>
                <PanicButton 
                  groupId={groupId}
                  fullSize={true}
                  onPanicTriggered={(data) => {
                    console.log('Pânico acionado:', data);
                  }}
                />
              </View>
            )}
          </View>

        </View>

        {/* Media Carousel */}
        {media && media.length > 0 ? (
          <MediaCarousel 
            media={media}
            onMediaPress={handleMediaPress}
          />
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mídias</Text>
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Nenhuma mídia disponível</Text>
            </View>
          </View>
        )}

        {/* Agendas - Consultas e Teleconsultas */}
        {appointments && appointments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Agendas</Text>
            
            {appointments
              .filter(appointment => {
                // FILTRO FINAL: Garantir que teleconsultas não pagas não apareçam
                const isTeleconsultation = appointment.is_teleconsultation || appointment.data?.is_teleconsultation || appointment.data?.isTeleconsultation || false;
                if (isTeleconsultation) {
                  const paymentStatus = appointment.data?.payment_status || appointment.payment_status;
                  if (paymentStatus === 'pending' || paymentStatus === null || paymentStatus === undefined) {
                    console.log('🚫 PatientHomeScreen - Filtro final no render: Ocultando teleconsulta não paga:', {
                      appointmentId: appointment.id || appointment.data?.id,
                      payment_status: paymentStatus,
                    });
                    return false; // Não renderizar esta consulta
                  }
                }
                return true; // Mostrar todas as outras
              })
              .map((appointment) => {
              const appointmentDate = new Date(appointment.appointmentTime || appointment.data?.appointment_date || appointment.data?.scheduled_at);
              const now = new Date();
              const minutesUntilAppointment = (appointmentDate - now) / (1000 * 60);
              const canStartVideoCall = minutesUntilAppointment <= 15 && minutesUntilAppointment >= -60;
              
              // Verificar is_teleconsultation em múltiplos lugares
              const isTeleconsultation = appointment.is_teleconsultation || appointment.data?.is_teleconsultation || appointment.data?.isTeleconsultation || false;
              
              return (
                <View key={appointment.id} style={styles.appointmentCard}>
                  <View style={styles.appointmentHeader}>
                    <View style={[styles.appointmentIcon, { backgroundColor: appointment.color + '20' }]}>
                      {isTeleconsultation ? (
                        <VideoCamIcon size={24} color={appointment.color} />
                      ) : (
                        <CalendarIcon size={24} color={appointment.color} />
                      )}
                    </View>
                    <View style={styles.appointmentInfo}>
                      <Text style={styles.appointmentTitle}>{appointment.title}</Text>
                      <Text style={styles.appointmentDescription}>{appointment.description}</Text>
                      <View style={styles.appointmentTimeRow}>
                        <TimeOutlineIcon size={14} color={colors.textLight} />
                        <Text style={styles.appointmentTimeText}>
                          {appointment.date} - {appointment.time}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.appointmentActions}>
                    {isTeleconsultation ? (
                      <>
                        <TouchableOpacity
                          style={[
                            styles.actionButton,
                            styles.videoCallButton,
                            !canStartVideoCall && styles.actionButtonDisabled
                          ]}
                          onPress={() => handleStartVideoCall(appointment)}
                          disabled={!canStartVideoCall}
                          activeOpacity={0.7}
                        >
                          <VideoCamIcon size={20} color="#FFFFFF" />
                          <Text style={styles.actionButtonText}>
                            {canStartVideoCall ? 'Entrar na Videoconferência' : 'Aguarde o horário'}
                          </Text>
                        </TouchableOpacity>
                        {(appointment.data?.payment_status === 'paid_held' || appointment.payment_status === 'paid_held') && (
                          <TouchableOpacity
                            style={[styles.actionButton, styles.confirmButton]}
                            onPress={() => navigation.navigate('AppointmentDetailsFull', {
                              appointmentId: appointment.data?.id || appointment.id,
                              appointment: appointment.data || appointment,
                              groupId: groupId,
                            })}
                            activeOpacity={0.7}
                          >
                            <CalendarIcon size={20} color="#FFFFFF" />
                            <Text style={styles.actionButtonText}>Confirmar que foi realizada</Text>
                          </TouchableOpacity>
                        )}
                      </>
                    ) : (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.recordingButton]}
                        onPress={() => handleStartRecording(appointment)}
                        activeOpacity={0.7}
                      >
                        <MicIcon size={20} color="#FFFFFF" />
                        <Text style={styles.actionButtonText}>Gravar Áudio com Médico</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Próximos Eventos</Text>
          
          {notifications && notifications.length > 0 ? (
            notifications.map((notification) => {
            // Verificar se deve mostrar o microfone
            // REGRA: Só mostra microfone para consultas do tipo 'medical'
            let showMicrophone = false;
            if (notification.type === 'appointment' && 
                notification.appointmentType === 'medical' && 
                notification.appointmentTime) {
              const now = new Date();
              const appointmentTime = new Date(notification.appointmentTime);
              const fifteenMinutesBefore = new Date(appointmentTime.getTime() - 15 * 60 * 1000);
              const threeMinutesAfter = new Date(appointmentTime.getTime() + 3 * 60 * 1000);
              
              // Mostrar microfone se estiver entre 15 min antes e 3 min depois
              showMicrophone = now >= fifteenMinutesBefore && now <= threeMinutesAfter;
            }
            
            return (
              <TouchableOpacity
                key={notification.id}
                style={styles.notificationCard}
                onPress={() => handleNotificationPress(notification)}
                activeOpacity={0.7}
              >
                <View style={[styles.notificationIcon, { backgroundColor: notification.color + '20' }]}>
                  {notification.icon === 'videocam' ? (
                    <VideoCamIcon size={28} color={notification.color} />
                  ) : notification.icon === 'calendar' ? (
                    <CalendarIcon size={28} color={notification.color} />
                  ) : notification.icon === 'medical' ? (
                    <MedicalIcon size={28} color={notification.color} />
                  ) : (
                    <CalendarIcon size={28} color={notification.color} />
                  )}
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  <Text style={styles.notificationDescription}>{notification.description}</Text>
                  <View style={styles.notificationTime}>
                    <TimeOutlineIcon size={14} color={colors.textLight} />
                    <Text style={styles.notificationTimeText}>
                      {notification.date} - {notification.time}
                    </Text>
                  </View>
                </View>
                
                {showMicrophone ? (
                  <View style={styles.microphoneIndicator}>
                    <MicIcon size={24} color={colors.error} />
                  </View>
                ) : (
                  <ChevronForwardIcon size={20} color={colors.gray400} />
                )}
              </TouchableOpacity>
            );
            })
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Nenhum evento próximo</Text>
            </View>
          )}
        </View>

      </ScrollView>

      {/* Video Player Modal */}
      <VideoPlayerModal
        visible={showVideoPlayer}
        videoUri={selectedVideo?.uri}
        videoTitle={selectedVideo?.title}
        onClose={() => {
          setShowVideoPlayer(false);
          setSelectedVideo(null);
        }}
      />

      {/* Image Viewer Modal */}
      <ImageViewerModal
        visible={showImageViewer}
        imageUri={selectedImage?.uri}
        imageTitle={selectedImage?.title}
        imageDescription={selectedImage?.description}
        onClose={() => {
          setShowImageViewer(false);
          setSelectedImage(null);
        }}
      />
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  greeting: {
    fontSize: 14,
    color: colors.textLight,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertsSection: {
    marginTop: 16,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  card: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  cardImageBackground: {
    flex: 1,
    margin: -16, // Compensar padding do card
    justifyContent: 'space-between',
  },
  cardImage: {
    borderRadius: 16,
  },
  cardOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Overlay escuro semi-transparente
    padding: 16,
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textWhite,
    marginTop: 8,
  },
  cardBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  cardBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textWhite,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notificationIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  notificationDescription: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 6,
  },
  notificationTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  notificationTimeText: {
    fontSize: 12,
    color: colors.textLight,
  },
  microphoneIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.error + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  emptyContacts: {
    backgroundColor: colors.backgroundLight,
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyContactsText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyContactsSubtext: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
  },
  panicCard: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text,
  },
  appointmentCard: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  appointmentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  appointmentDescription: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 6,
  },
  appointmentTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  appointmentTimeText: {
    fontSize: 13,
    color: colors.textLight,
  },
  appointmentActions: {
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  videoCallButton: {
    backgroundColor: colors.primary,
  },
  recordingButton: {
    backgroundColor: colors.secondary,
  },
  confirmButton: {
    backgroundColor: colors.success,
    marginTop: 8,
  },
  actionButtonDisabled: {
    backgroundColor: colors.gray400,
    opacity: 0.6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyState: {
    backgroundColor: colors.backgroundLight,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
  },
});

export default PatientHomeScreen;


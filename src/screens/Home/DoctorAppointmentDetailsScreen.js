import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import colors from '../../constants/colors';
import moment from 'moment';
import 'moment/locale/pt-br';
import { getDocumentDisplayTitle, normalizeDocument } from '../../utils/documentTypeLabels';
import groupService from '../../services/groupService';
import documentService from '../../services/documentService';
import appointmentService from '../../services/appointmentService';
import {
  isTeleconsultPaidForVideoStart,
  isTeleconsultAppointment,
  isWithinTeleconsultVideoJoinWindow,
  isTeleconsultVideoJoinWindowExpired,
} from '../../utils/teleconsultationHonorarium';
import {
  ReceiptIcon,
  CalendarIcon,
  DocumentIcon,
  ArrowBackIcon,
  LocationIcon,
  PersonIcon,
  MedicalOutlineIcon,
  WarningIcon,
  PillsOutlineIcon,
  FolderIcon,
  ChevronForwardIcon,
  TimeIcon,
  VideoCamIcon,
  CloseCircleIcon,
} from '../../components/CustomIcons';

moment.locale('pt-br');

const DoctorAppointmentDetailsScreen = ({ route, navigation }) => {
  const { appointment: initialAppointment } = route.params || {};
  const [appointment, setAppointment] = useState(initialAppointment);
  const [canStart, setCanStart] = useState(false);
  const [patientInfo, setPatientInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);

  useEffect(() => {
    checkCanStart();
    loadPatientInfo();
  }, [appointment]);

  // Atualizar appointment quando route.params mudar
  useEffect(() => {
    if (route.params?.appointment) {
      setAppointment(route.params.appointment);
    }
  }, [route.params?.appointment]);

  useEffect(() => {
    if (appointment?.group_id) {
      loadDocuments();
    }
  }, [appointment?.group_id]);

  const checkCanStart = () => {
    if (!appointment) return;

    if (appointment.status === 'cancelled' || appointment.status === 'completed') {
      setCanStart(false);
      return;
    }

    if (isTeleconsultAppointment(appointment) && !isTeleconsultPaidForVideoStart(appointment)) {
      setCanStart(false);
      return;
    }

    const appointmentDate = new Date(appointment.appointment_date || appointment.scheduled_at);
    const now = new Date();
    const fifteenMinutesBefore = new Date(appointmentDate.getTime() - 15 * 60 * 1000);

    if (isTeleconsultAppointment(appointment)) {
      setCanStart(isWithinTeleconsultVideoJoinWindow(appointment, now.getTime()));
      return;
    }

    setCanStart(now >= fifteenMinutesBefore);
  };

  const loadPatientInfo = async () => {
    try {
      setLoading(true);
      
      // Buscar informações do paciente da API
      const groupId = appointment.group_id || appointment.groupId;
      console.log('🔍 DoctorAppointmentDetailsScreen - Buscando info do paciente:', { groupId, appointmentId: appointment?.id });
      
      if (groupId) {
        // Buscar membros do grupo para encontrar o paciente
        const membersResult = await groupService.getGroupMembers(groupId);
        
        if (membersResult.success && membersResult.data) {
          const members = membersResult.data;
          console.log('👥 DoctorAppointmentDetailsScreen - Membros encontrados:', members.length);
          console.log('👥 DoctorAppointmentDetailsScreen - Membros detalhes:', members.map(m => ({
            role: m.role,
            user_id: m.user_id,
            userName: m.user?.name,
            hasUser: !!m.user
          })));
          
          const patientRoles = ['patient', 'priority_contact', 'accompanied'];
          const patientMember = members.find((m) => {
            if (!patientRoles.includes(m.role)) return false;
            return !!(m.user?.name || m.name);
          });
          
          if (patientMember) {
            const patient = patientMember.user || patientMember;
            const patientName = patientMember.user?.name || patientMember.name;
            console.log('✅ DoctorAppointmentDetailsScreen - Paciente encontrado:', { id: patient.id, name: patientName });
            
            // Calcular idade
            let age = null;
            if (patient.birth_date) {
              const birthDate = new Date(patient.birth_date);
              const today = new Date();
              age = today.getFullYear() - birthDate.getFullYear();
              const monthDiff = today.getMonth() - birthDate.getMonth();
              if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
              }
            }
            
            // Processar doenças crônicas (string para array)
            let comorbidities = [];
            if (patient.chronic_diseases) {
              comorbidities = patient.chronic_diseases
                .split(',')
                .map(d => d.trim())
                .filter(d => d.length > 0);
            }
            
            // Processar alergias (string para array)
            let allergiesList = [];
            if (patient.allergies) {
              allergiesList = patient.allergies
                .split(',')
                .map(a => a.trim())
                .filter(a => a.length > 0);
            }
            
            // Traduzir gênero
            const genderMap = {
              'male': 'Masculino',
              'female': 'Feminino',
              'other': 'Outro'
            };
            
            const patientInfoData = {
              id: patient.id || patientMember.user_id,
              name: patientName || 'Paciente',
              age: age,
              gender: genderMap[patient.gender] || patient.gender || 'Não informado',
              comorbidities: comorbidities,
              allergies: allergiesList,
              bloodType: patient.blood_type || 'Não informado',
              medications: [], // TODO: Buscar medicações do paciente se necessário
              cpf: patient.cpf || '',
              birth_date: patient.birth_date || patientMember.birth_date || null,
            };
            
            setPatientInfo(patientInfoData);
            return;
          }
        }
      }
      
      // Fallback: usar dados básicos se não conseguir buscar
      // Tentar obter ID do paciente de outras fontes
      const fallbackPatientId = appointment?.patient_id || appointment?.user_id || appointment?.group?.user_id || null;
      console.log('⚠️ DoctorAppointmentDetailsScreen - Usando fallback. Patient ID encontrado:', fallbackPatientId, {
        patient_id: appointment?.patient_id,
        user_id: appointment?.user_id,
        group_user_id: appointment?.group?.user_id,
        patient_name: appointment?.patient_name,
        accompanied_name: appointment?.accompanied_name,
        group_name: appointment?.group?.name,
      });
      
      const groupLabel = appointment?.group?.name || appointment?.group_name || '';
      const rawFallback =
        appointment?.patient_name || appointment?.accompanied_name || 'Paciente';
      const fallbackName =
        groupLabel &&
        String(rawFallback).trim().toLowerCase() === String(groupLabel).trim().toLowerCase()
          ? 'Paciente'
          : rawFallback;
      console.log('⚠️ DoctorAppointmentDetailsScreen - Nome do fallback (sem usar grupo):', fallbackName);
      
      const fallbackInfo = {
        id: fallbackPatientId, // Tentar obter ID do appointment
        name: fallbackName, // NUNCA usar nome do grupo aqui
        age: null,
        gender: 'Não informado',
        comorbidities: [],
        allergies: [],
        bloodType: 'Não informado',
        medications: [],
        cpf: '',
        birth_date: null,
      };
      
      console.log('⚠️ DoctorAppointmentDetailsScreen - Fallback configurado:', fallbackInfo);
      setPatientInfo(fallbackInfo);
    } catch (error) {
      console.error('❌ DoctorAppointmentDetailsScreen - Erro ao carregar informações do paciente:', error);
      // Em caso de erro, usar dados básicos
      // Tentar obter ID do paciente de outras fontes
      const fallbackPatientId = appointment?.patient_id || appointment?.user_id || appointment?.group?.user_id || null;
      console.log('⚠️ DoctorAppointmentDetailsScreen - Erro, usando fallback. Patient ID:', fallbackPatientId);
      
      // IMPORTANTE: NÃO usar appointment.group?.name como nome do paciente no fallback
      // Priorizar appointment.patient_name ou appointment.accompanied_name
      const groupLabel = appointment?.group?.name || appointment?.group_name || '';
      const rawFallback =
        appointment?.patient_name || appointment?.accompanied_name || 'Paciente';
      const fallbackName =
        groupLabel &&
        String(rawFallback).trim().toLowerCase() === String(groupLabel).trim().toLowerCase()
          ? 'Paciente'
          : rawFallback;
      console.log('⚠️ DoctorAppointmentDetailsScreen - Nome do fallback por erro (sem usar grupo):', fallbackName);
      
      const fallbackInfo = {
        id: fallbackPatientId, // Tentar obter ID do appointment
        name: fallbackName, // NUNCA usar nome do grupo aqui
        age: null,
        gender: 'Não informado',
        comorbidities: [],
        allergies: [],
        bloodType: 'Não informado',
        medications: [],
        cpf: '',
        birth_date: null,
      };
      console.log('⚠️ DoctorAppointmentDetailsScreen - Fallback por erro configurado:', fallbackInfo);
      setPatientInfo(fallbackInfo);
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async () => {
    try {
      setLoadingDocuments(true);
      const groupId = appointment?.group_id || appointment?.groupId;
      
      if (!groupId) {
        console.log('⚠️ DoctorAppointmentDetailsScreen - groupId não disponível para buscar documentos');
        setDocuments([]);
        return;
      }

      console.log('📂 DoctorAppointmentDetailsScreen - Carregando documentos do grupo:', groupId);
      const docs = await documentService.getDocumentsByGroup(groupId);
      const docList = Array.isArray(docs) ? docs : docs?.data || [];
      
      const normalizedDocs = docList.map(normalizeDocument);

      // Limitar a 5 documentos mais recentes para o card
      const recentDocs = normalizedDocs
        .sort((a, b) => new Date(b.document_date || b.date) - new Date(a.document_date || a.date))
        .slice(0, 5);
      
      setDocuments(recentDocs);
      console.log('✅ DoctorAppointmentDetailsScreen - Documentos carregados:', recentDocs.length);
    } catch (error) {
      console.error('❌ DoctorAppointmentDetailsScreen - Erro ao carregar documentos:', error);
      setDocuments([]);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const formatBirthDate = (dateStr) => {
    if (!dateStr) return null;
    const parsed = moment(dateStr);
    return parsed.isValid() ? parsed.format('DD/MM/YYYY') : null;
  };

  const formatPatientSummary = (info) => {
    if (!info) return '';
    const parts = [];
    const birthLabel = formatBirthDate(info.birth_date);
    if (birthLabel) {
      parts.push(`Data de nascimento: ${birthLabel}`);
    }
    if (info.age != null && !Number.isNaN(info.age)) {
      parts.push(`${info.age} anos`);
    }
    if (info.gender && info.gender !== 'Não informado') {
      parts.push(info.gender);
    }
    return parts.join(' • ') || 'Dados pessoais não informados';
  };

  const getDocumentIcon = (type) => {
    const iconMap = {
      exam_lab: 'flask',
      exam_image: 'image',
      prescription: 'document-text',
      medical_leave: 'calendar',
      medical_certificate: 'calendar',
      report: 'document',
      other: 'document-attach',
    };
    return iconMap[type] || 'document';
  };

  const getDocumentIconComponent = (type) => {
    const iconMap = {
      prescription: ReceiptIcon,
      medical_leave: CalendarIcon,
      medical_certificate: CalendarIcon,
      report: DocumentIcon,
      other: DocumentIcon,
    };
    return iconMap[type] || DocumentIcon;
  };

  const getDocumentColor = (type) => {
    const colorMap = {
      exam_lab: colors.info,
      exam_image: colors.success,
      prescription: '#FFB6C1', // Rosa pastel para receitas
      medical_leave: '#B0E0E6', // Azul pastel para afastamentos
      medical_certificate: '#B0E0E6', // Azul pastel para afastamentos
      report: colors.warning,
      other: colors.gray600,
    };
    return colorMap[type] || colors.gray600;
  };

  const formatDocumentDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDate = (dateString) => {
    const date = moment(dateString);
    return date.format('DD/MM/YYYY [às] HH:mm');
  };

  const handleStartConsultation = () => {
    if (isTeleconsultAppointment(appointment) && !isTeleconsultPaidForVideoStart(appointment)) {
      Alert.alert(
        'Pagamento pendente',
        'A videochamada só pode ser iniciada depois que o paciente concluir o pagamento. Você pode acompanhar os detalhes desta tela até lá.'
      );
      return;
    }
    if (isTeleconsultAppointment(appointment) && isTeleconsultVideoJoinWindowExpired(appointment)) {
      Alert.alert(
        'Prazo encerrado',
        'O horário para iniciar a videochamada já passou (até 40 minutos após o horário agendado). Esta consulta consta como não realizada na lista.'
      );
      return;
    }
    if (!canStart) {
      if (isTeleconsultAppointment(appointment)) {
        Alert.alert(
          'Ainda não é possível iniciar',
          'A videochamada fica disponível a partir de 15 minutos antes do horário e até 40 minutos depois do início agendado.'
        );
      } else {
        Alert.alert(
          'Ainda não é possível iniciar',
          'Você só pode iniciar a consulta a partir de 15 minutos antes do horário agendado.'
        );
      }
      return;
    }

    navigation.navigate('DoctorVideoCall', {
      appointment: appointment,
      patientInfo: patientInfo,
    });
  };

  const handleCancelAppointment = () => {
    // Verificar se já está cancelada
    if (appointment.status === 'cancelled') {
      Alert.alert(
        'Consulta já cancelada',
        'Esta consulta já foi cancelada anteriormente.'
      );
      return;
    }

    // Verificar se já foi completada
    if (appointment.status === 'completed') {
      Alert.alert(
        'Não é possível cancelar',
        'Não é possível cancelar uma consulta que já foi completada.'
      );
      return;
    }

    const appointmentDate = new Date(appointment.appointment_date || appointment.scheduled_at);
    const now = new Date();
    
    // Validar que só pode cancelar até a hora da consulta
    if (now > appointmentDate) {
      Alert.alert(
        'Não é possível cancelar',
        'Não é possível cancelar uma consulta após o horário agendado.'
      );
      return;
    }

    Alert.alert(
      'Cancelar Consulta',
      'Tem certeza que deseja cancelar esta consulta? O cuidador e o paciente serão notificados.',
      [
        {
          text: 'Não',
          style: 'cancel',
        },
        {
          text: 'Sim, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await appointmentService.cancelAppointment(
                appointment.id,
                'doctor',
                null // Pode adicionar campo de motivo depois
              );

              if (result.success) {
                // Atualizar estado local da consulta com dados retornados do backend
                const updatedAppointment = {
                  ...appointment,
                  status: result.data?.status || 'cancelled',
                  cancelled_by: 'doctor',
                  payment_status: result.data?.payment_status || appointment.payment_status,
                };
                
                setAppointment(updatedAppointment);
                
                Alert.alert(
                  'Consulta Cancelada',
                  'A consulta foi cancelada com sucesso. O cuidador e o paciente foram notificados.',
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        // Atualizar a lista de consultas se houver callback
                        if (route.params?.onAppointmentUpdated) {
                          route.params.onAppointmentUpdated(updatedAppointment);
                        }
                        // Não navegar de volta automaticamente, deixar o usuário ver o status
                      },
                    },
                  ]
                );
              } else {
                Alert.alert('Erro', result.error || 'Não foi possível cancelar a consulta');
              }
            } catch (error) {
              console.error('Erro ao cancelar consulta:', error);
              Alert.alert('Erro', 'Não foi possível cancelar a consulta. Tente novamente.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando informações...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const appointmentDate = new Date(appointment.appointment_date || appointment.scheduled_at);
  const now = new Date();
  const fifteenMinutesBefore = new Date(appointmentDate.getTime() - 15 * 60 * 1000);
  const timeUntilStart = fifteenMinutesBefore - now;
  const minutesUntilStart = Math.ceil(timeUntilStart / (1000 * 60));
  const teleconsultAwaitingPayment =
    isTeleconsultAppointment(appointment) &&
    appointment.status !== 'cancelled' &&
    appointment.status !== 'cancelada' &&
    !isTeleconsultPaidForVideoStart(appointment);

  const teleconsultVideoWindowExpired =
    isTeleconsultAppointment(appointment) &&
    !teleconsultAwaitingPayment &&
    appointment.status !== 'cancelled' &&
    appointment.status !== 'cancelada' &&
    appointment.status !== 'completed' &&
    isTeleconsultVideoJoinWindowExpired(appointment, now.getTime());

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ArrowBackIcon size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes da Consulta</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Status Cancelado */}
        {appointment.status === 'cancelled' && (
          <View style={styles.cancelledCard}>
            <CloseCircleIcon size={24} color={colors.error} />
            <Text style={styles.cancelledTitle}>Consulta Cancelada</Text>
            <Text style={styles.cancelledText}>
              Esta consulta foi cancelada
              {appointment.cancelled_by === 'doctor' ? ' pelo médico' : ' pelo paciente'}
            </Text>
          </View>
        )}

        {/* Informações da Consulta */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Consulta</Text>
          <View style={[
            styles.infoCard,
            appointment.status === 'cancelled' && styles.infoCardCancelled
          ]}>
            <Text style={styles.infoTitle}>{appointment.title || 'Consulta'}</Text>
            {appointment.description && (
              <Text style={styles.infoDescription}>{appointment.description}</Text>
            )}
            <View style={styles.infoRow}>
              <CalendarIcon size={20} color={colors.primary} />
              <Text style={styles.infoText}>{formatDate(appointmentDate)}</Text>
            </View>
            {appointment.location && (
              <View style={styles.infoRow}>
                <LocationIcon size={20} color={colors.primary} />
                <Text style={styles.infoText}>{appointment.location}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Informações do Paciente */}
        {patientInfo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informações do Paciente</Text>
            <View style={styles.infoCard}>
              <View style={styles.patientHeader}>
                <View style={styles.patientAvatar}>
                  <PersonIcon size={32} color={colors.primary} />
                </View>
                <View style={styles.patientBasicInfo}>
                  <Text style={styles.patientName}>{patientInfo.name}</Text>
                  <Text style={styles.patientDetails}>
                    {formatPatientSummary(patientInfo)}
                  </Text>
                  {patientInfo.bloodType && (
                    <Text style={styles.patientDetails}>
                      Tipo sanguíneo: {patientInfo.bloodType}
                    </Text>
                  )}
                </View>
              </View>

              {/* Comorbidades */}
              {patientInfo.comorbidities && patientInfo.comorbidities.length > 0 && (
                <View style={styles.infoSection}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <MedicalOutlineIcon size={16} color={colors.warning} />
                    <Text style={[styles.infoLabel, { marginLeft: 6 }]}>Comorbidades</Text>
                  </View>
                  {patientInfo.comorbidities.map((comorbidity, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{comorbidity}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Alergias */}
              {patientInfo.allergies && patientInfo.allergies.length > 0 && (
                <View style={styles.infoSection}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <WarningIcon size={16} color={colors.error} />
                    <Text style={[styles.infoLabel, { marginLeft: 6 }]}>Alergias</Text>
                  </View>
                  {patientInfo.allergies.map((allergy, index) => (
                    <View key={index} style={[styles.tag, styles.allergyTag]}>
                      <Text style={[styles.tagText, styles.allergyText]}>{allergy}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Medicações Atuais */}
              {patientInfo.medications && patientInfo.medications.length > 0 && (
                <View style={styles.infoSection}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <PillsOutlineIcon size={16} color={colors.primary} />
                    <Text style={[styles.infoLabel, { marginLeft: 6 }]}>Medicações Atuais</Text>
                  </View>
                  {patientInfo.medications.map((medication, index) => (
                    <View key={index} style={styles.medicationItem}>
                      <Text style={styles.medicationText}>{medication}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Arquivos do Paciente */}
              <View style={styles.infoSection}>
                <View style={styles.filesHeader}>
                  <View style={styles.filesHeaderLeft}>
                    <FolderIcon size={16} color={colors.primary} />
                    <Text style={styles.infoLabel}>Arquivos do Paciente</Text>
                  </View>
                  {documents.length > 0 && (
                    <TouchableOpacity
                      onPress={() => {
                        const groupId = appointment?.group_id || appointment?.groupId;
                        if (groupId) {
                          navigation.navigate('Documents', {
                            groupId,
                            groupName: appointment?.group?.name || 'Grupo',
                          });
                        }
                      }}
                    >
                      <Text style={styles.seeAllText}>Ver todos</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {loadingDocuments ? (
                  <View style={styles.filesLoading}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.filesLoadingText}>Carregando arquivos...</Text>
                  </View>
                ) : documents.length === 0 ? (
                  <View style={styles.filesEmpty}>
                    <FolderIcon size={32} color={colors.gray300} />
                    <Text style={styles.filesEmptyText}>Nenhum arquivo disponível</Text>
                  </View>
                ) : (
                  <View style={styles.filesList}>
                    {documents.map((doc, index) => (
                      <TouchableOpacity
                        key={doc.id || index}
                        style={styles.fileItem}
                        onPress={() => {
                          const groupId = appointment?.group_id || appointment?.groupId;
                          navigation.navigate('DocumentDetails', {
                            document: doc,
                            groupId,
                          });
                        }}
                      >
                        <View style={[styles.fileIcon, { backgroundColor: getDocumentColor(doc.type) + '20' }]}>
                          {(() => {
                            const IconComponent = getDocumentIconComponent(doc.type);
                            return <IconComponent size={20} color={getDocumentColor(doc.type)} />;
                          })()}
                        </View>
                        <View style={styles.fileContent}>
                          <Text style={styles.fileTitle} numberOfLines={1}>
                            {getDocumentDisplayTitle(doc)}
                          </Text>
                          <Text style={styles.fileMeta}>
                            {formatDocumentDate(doc.document_date || doc.date)}
                          </Text>
                        </View>
                        <ChevronForwardIcon
                          size={20}
                          color={colors.gray400}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Pagamento pendente (teleconsulta): valida antes da janela de 15 min */}
        {teleconsultAwaitingPayment && (
          <View style={styles.warningCard}>
            <WarningIcon size={24} color={colors.warning} />
            <Text style={styles.warningText}>Aguardando pagamento do paciente</Text>
            <Text style={styles.warningSubtext}>
              Esta consulta aparece na sua lista com este aviso. A videochamada só fica disponível após o
              pagamento ser confirmado; até lá o botão para iniciar a chamada não é exibido.
            </Text>
          </View>
        )}

        {/* Janela da videochamada encerrada (teleconsulta paga, horário passou dos 40 min) */}
        {teleconsultVideoWindowExpired && (
          <View style={styles.warningCard}>
            <TimeIcon size={24} color={colors.warning} />
            <Text style={styles.warningText}>Prazo para iniciar a videochamada encerrado</Text>
            <Text style={styles.warningSubtext}>
              A entrada era permitida entre 15 minutos antes e 40 minutos após o horário agendado. Não é possível
              iniciar a chamada agora; esta consulta permanece em &quot;Não realizadas&quot; até você tratá-la na
              lista.
            </Text>
          </View>
        )}

        {/* Antes da janela (teleconsulta) ou antes dos 15 min (presencial) */}
        {!canStart &&
          appointment.status !== 'cancelled' &&
          !teleconsultAwaitingPayment &&
          !teleconsultVideoWindowExpired && (
          <View style={styles.warningCard}>
            <TimeIcon size={24} color={colors.warning} />
            <Text style={styles.warningText}>
              {isTeleconsultAppointment(appointment)
                ? `Você poderá iniciar a videochamada em ${Math.max(0, minutesUntilStart)} minuto(s)`
                : `Você poderá iniciar a consulta em ${Math.max(0, minutesUntilStart)} minuto(s)`}
            </Text>
            <Text style={styles.warningSubtext}>
              {isTeleconsultAppointment(appointment)
                ? 'Disponível de 15 min antes até 40 min após o horário agendado'
                : 'A partir de 15 minutos antes do horário agendado'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Botões de Ação */}
      {appointment.status !== 'cancelled' && (
        <View style={styles.footer}>
          {/* Botão de Cancelar (só aparece se ainda não passou a hora e não está cancelada) */}
          {(() => {
            const appointmentDate = new Date(appointment.appointment_date || appointment.scheduled_at);
            const now = new Date();
            const canCancel = now <= appointmentDate && appointment.status !== 'cancelled';
            
            if (canCancel) {
              return (
                <TouchableOpacity
                  style={styles.cancelButtonFooter}
                  onPress={handleCancelAppointment}
                >
                  <CloseCircleIcon size={20} color={colors.error} />
                  <Text style={styles.cancelButtonText}>Cancelar Consulta</Text>
                </TouchableOpacity>
              );
            }
            return null;
          })()}
          
          {/* Vídeo: pagamento ok, dentro da janela (tele); presencial segue regra dos 15 min */}
          {!teleconsultAwaitingPayment && !teleconsultVideoWindowExpired && (
            <TouchableOpacity
              style={[styles.startButton, !canStart && styles.startButtonDisabled]}
              onPress={handleStartConsultation}
              disabled={!canStart}
              activeOpacity={canStart ? 0.85 : 1}
              accessibilityState={{ disabled: !canStart }}
            >
              <VideoCamIcon
                size={24}
                color={canStart ? '#FFFFFF' : colors.textLight}
              />
              <Text
                style={[styles.startButtonText, !canStart && styles.startButtonTextDisabled]}
              >
                Iniciar consulta
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  placeholder: {
    width: 32,
  },
  cancelButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  infoDescription: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
  },
  patientHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  patientAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  patientBasicInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  patientName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  patientDetails: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 2,
  },
  infoSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  tag: {
    backgroundColor: colors.warning + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  allergyTag: {
    backgroundColor: colors.error + '20',
  },
  tagText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  allergyText: {
    color: colors.error,
  },
  medicationItem: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  medicationText: {
    fontSize: 14,
    color: colors.text,
  },
  warningCard: {
    backgroundColor: colors.warning + '15',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.warning + '40',
  },
  warningText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 8,
    textAlign: 'center',
  },
  warningSubtext: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    padding: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    gap: 12,
  },
  cancelButtonFooter: {
    backgroundColor: colors.error + '15',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.error + '40',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
  },
  startButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  startButtonDisabled: {
    backgroundColor: colors.border,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  startButtonTextDisabled: {
    color: colors.textLight,
  },
  filesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filesHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  filesLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  filesLoadingText: {
    fontSize: 14,
    color: colors.textLight,
  },
  filesEmpty: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  filesEmptyText: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 8,
  },
  filesList: {
    gap: 8,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    borderWidth: 0, // Remover bordas grossas
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileContent: {
    flex: 1,
  },
  fileTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  fileMeta: {
    fontSize: 12,
    color: colors.textLight,
  },
  cancelledCard: {
    backgroundColor: colors.error + '15',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.error + '40',
  },
  cancelledTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.error,
    marginTop: 8,
    marginBottom: 4,
  },
  cancelledText: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
  },
  infoCardCancelled: {
    opacity: 0.6,
    borderColor: colors.error + '40',
  },
});

export default DoctorAppointmentDetailsScreen;


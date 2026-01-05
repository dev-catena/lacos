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
import groupService from '../../services/groupService';
import documentService from '../../services/documentService';
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
} from '../../components/CustomIcons';

moment.locale('pt-br');

const DoctorAppointmentDetailsScreen = ({ route, navigation }) => {
  const { appointment } = route.params || {};
  const [canStart, setCanStart] = useState(false);
  const [patientInfo, setPatientInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);

  useEffect(() => {
    checkCanStart();
    loadPatientInfo();
  }, [appointment]);

  useEffect(() => {
    if (appointment?.group_id) {
      loadDocuments();
    }
  }, [appointment?.group_id]);

  const checkCanStart = () => {
    if (!appointment) return;
    
    const appointmentDate = new Date(appointment.appointment_date || appointment.scheduled_at);
    const now = new Date();
    const fifteenMinutesBefore = new Date(appointmentDate.getTime() - 15 * 60 * 1000);
    
    // Pode iniciar se estiver até 15 minutos antes da consulta
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
          
          // Buscar membro com role 'patient'
          const patientMember = members.find(m => {
            const hasPatientRole = m.role === 'patient';
            const hasUser = !!m.user;
            console.log(`🔍 Verificando membro: role="${m.role}", hasUser=${hasUser}, userName="${m.user?.name}"`);
            return hasPatientRole && hasUser;
          });
          
          if (patientMember && patientMember.user) {
            const patient = patientMember.user;
            console.log('✅ DoctorAppointmentDetailsScreen - Paciente encontrado:', { id: patient.id, name: patient.name });
            
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
              id: patient.id, // IMPORTANTE: Incluir o ID do paciente
              name: patient.name || 'Paciente',
              age: age,
              gender: genderMap[patient.gender] || patient.gender || 'Não informado',
              comorbidities: comorbidities,
              allergies: allergiesList,
              bloodType: patient.blood_type || 'Não informado',
              medications: [], // TODO: Buscar medicações do paciente se necessário
              cpf: patient.cpf || '',
              birth_date: patient.birth_date || null,
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
      
      // IMPORTANTE: NÃO usar appointment.group?.name como nome do paciente no fallback
      // Priorizar appointment.patient_name ou appointment.accompanied_name
      const fallbackName = appointment?.patient_name || appointment?.accompanied_name || 'Paciente';
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
      const fallbackName = appointment?.patient_name || appointment?.accompanied_name || 'Paciente';
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
      
      // Limitar a 5 documentos mais recentes para o card
      const recentDocs = docs
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
    if (!canStart) {
      Alert.alert(
        'Ainda não é possível iniciar',
        'Você só pode iniciar a consulta até 15 minutos antes do horário agendado.'
      );
      return;
    }

    navigation.navigate('DoctorVideoCall', {
      appointment: appointment,
      patientInfo: patientInfo,
    });
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
        {/* Informações da Consulta */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Consulta</Text>
          <View style={styles.infoCard}>
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
                    {patientInfo.age} anos • {patientInfo.gender}
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
                            {doc.title || 'Documento sem título'}
                          </Text>
                          <Text style={styles.fileMeta}>
                            {formatDocumentDate(doc.document_date || doc.date)}
                            {doc.doctor_name && ` • ${doc.doctor_name}`}
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

        {/* Status de Início */}
        {!canStart && (
          <View style={styles.warningCard}>
            <TimeIcon size={24} color={colors.warning} />
            <Text style={styles.warningText}>
              Você poderá iniciar a consulta em {minutesUntilStart} minuto(s)
            </Text>
            <Text style={styles.warningSubtext}>
              A consulta pode ser iniciada até 15 minutos antes do horário agendado
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Botão de Iniciar Consulta */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.startButton,
            !canStart && styles.startButtonDisabled
          ]}
          onPress={handleStartConsultation}
          disabled={!canStart}
        >
          <VideoCamIcon 
            size={24} 
            color={canStart ? '#FFFFFF' : colors.textLight} 
          />
          <Text style={[
            styles.startButtonText,
            !canStart && styles.startButtonTextDisabled
          ]}>
            Iniciar Consulta
          </Text>
        </TouchableOpacity>
      </View>
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
});

export default DoctorAppointmentDetailsScreen;


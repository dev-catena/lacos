import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Pressable,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import prescriptionService from '../../services/prescriptionService';
import cidService from '../../services/cidService';
import { parseCrm } from '../../utils/crm';

const MedicalCertificateFormScreen = ({ route, navigation }) => {
  const { appointment, patientInfo, doctorInfo, groupId } = route.params || {};
  
  // Log para debug
  useEffect(() => {
    const patientNameToUse = patientInfo?.name || appointment?.patient_name || appointment?.accompanied_name || 'Não informado';
    const patientIdToUse = patientInfo?.id || appointment?.patient_id || appointment?.user_id || null;
    
    console.log('🔍 MedicalCertificateFormScreen - Dados recebidos:', {
      patientInfo: patientInfo,
      patientInfoId: patientInfo?.id,
      patientInfoName: patientInfo?.name,
      appointmentPatientName: appointment?.patient_name,
      appointmentAccompaniedName: appointment?.accompanied_name,
      groupName: appointment?.group?.name,
      patientNameFinal: patientNameToUse,
      patientIdFinal: patientIdToUse,
      appointment: appointment,
    });
    
    // Alertar se o nome do grupo estiver sendo usado incorretamente
    if (appointment?.group?.name && patientNameToUse === appointment?.group?.name) {
      console.warn('⚠️ MedicalCertificateFormScreen - ATENÇÃO: Nome do grupo está sendo usado como nome do paciente!', {
        groupName: appointment.group.name,
        patientInfoName: patientInfo?.name,
      });
    }
    
    // Alertar se não houver ID do paciente
    if (!patientIdToUse) {
      console.warn('⚠️ MedicalCertificateFormScreen - ATENÇÃO: ID do paciente não encontrado!', {
        patientInfoId: patientInfo?.id,
        appointmentPatientId: appointment?.patient_id,
        appointmentUserId: appointment?.user_id,
      });
    }
  }, [patientInfo, appointment]);
  
  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [certificatePassword, setCertificatePassword] = useState('');
  const [pendingCertificateData, setPendingCertificateData] = useState(null);
  
  // Função para obter data de hoje formatada (definida antes do useState para usar na inicialização)
  const getTodayFormatted = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}/${month}/${year}`;
  };
  
  const [formData, setFormData] = useState({
    // Tipo de atestado
    type: 'medical_leave', // medical_leave, medical_certificate, health_statement
    // Período (para afastamento) - data de início começa com hoje
    startDate: getTodayFormatted(),
    endDate: '',
    days: '',
    // CID (Código Internacional de Doenças)
    cid: '',
    // Descrição/Motivo
    description: '',
    // Observações
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [cidSuggestions, setCidSuggestions] = useState([]);
  const [showCidSuggestions, setShowCidSuggestions] = useState(false);
  const [isCidFocused, setIsCidFocused] = useState(false);
  const cidSearchTimeoutRef = useRef(null);
  const isSelectingCidRef = useRef(false);

  const certificateTypes = [
    { value: 'medical_leave', label: 'Afastamento/Afastamento Médico', icon: 'calendar' },
    { value: 'medical_certificate', label: 'Atestado Médico', icon: 'document-text' },
    { value: 'health_statement', label: 'Declaração de Saúde', icon: 'checkmark-circle' },
  ];

  // Função para formatar data automaticamente (dd/mm/yyyy)
  const formatDateInput = (value) => {
    // Remove tudo que não é dígito
    const numbers = value.replace(/\D/g, '');
    
    // Limita a 8 dígitos (ddmmyyyy)
    const limited = numbers.slice(0, 8);
    
    // Se tem mais de 4 dígitos, adiciona a primeira barra
    if (limited.length > 4) {
      return `${limited.slice(0, 2)}/${limited.slice(2, 4)}/${limited.slice(4, 8)}`;
    }
    // Se tem mais de 2 dígitos, adiciona a primeira barra
    if (limited.length > 2) {
      return `${limited.slice(0, 2)}/${limited.slice(2, 4)}`;
    }
    
    return limited;
  };

  // Buscar sugestões de CID
  const handleCidChange = (value) => {
    // Se está selecionando um CID, não fazer nada
    if (isSelectingCidRef.current) {
      return;
    }
    
    // Atualizar o campo
    const processedValue = value.toUpperCase();
    setFormData(prev => ({ ...prev, cid: processedValue }));
    
    // Limpar erro do campo ao editar
    if (errors.cid) {
      setErrors(prev => ({ ...prev, cid: null }));
    }
    
    // Limpar timeout anterior
    if (cidSearchTimeoutRef.current) {
      clearTimeout(cidSearchTimeoutRef.current);
    }
    
    // Se o texto tiver menos de 1 caractere, não buscar
    if (processedValue.length < 1) {
      setCidSuggestions([]);
      setShowCidSuggestions(false);
      return;
    }
    
    // Debounce: aguardar 300ms antes de buscar
    cidSearchTimeoutRef.current = setTimeout(() => {
      const results = cidService.searchCID(processedValue, 10);
      setCidSuggestions(results);
      // Mostrar sugestões se houver resultados (independente do foco)
      if (results.length > 0) {
        setShowCidSuggestions(true);
      } else {
        setShowCidSuggestions(false);
      }
    }, 300);
  };

  // Selecionar CID da sugestão
  const handleSelectCID = (cid) => {
    // Marcar que estamos selecionando (antes de qualquer outra ação)
    isSelectingCidRef.current = true;
    
    // Limpar timeout de busca imediatamente
    if (cidSearchTimeoutRef.current) {
      clearTimeout(cidSearchTimeoutRef.current);
      cidSearchTimeoutRef.current = null;
    }
    
    // Atualizar diretamente o campo com o código CID selecionado (em maiúsculas)
    const selectedCode = cid.code.toUpperCase();
    setFormData(prev => ({ ...prev, cid: selectedCode }));
    
    // Limpar sugestões e esconder dropdown
    setCidSuggestions([]);
    setShowCidSuggestions(false);
    setIsCidFocused(false);
    
    // Limpar erro do campo se houver
    if (errors.cid) {
      setErrors(prev => ({ ...prev, cid: null }));
    }
    
    // Resetar a flag após um tempo
    setTimeout(() => {
      isSelectingCidRef.current = false;
    }, 300);
  };

  // Cleanup do timeout quando componente desmontar
  useEffect(() => {
    return () => {
      if (cidSearchTimeoutRef.current) {
        clearTimeout(cidSearchTimeoutRef.current);
      }
    };
  }, []);

  const updateField = (field, value) => {
    let processedValue = value;
    
    // Aplicar máscara de data para campos de data
    if (field === 'startDate' || field === 'endDate') {
      processedValue = formatDateInput(value);
    }
    
    // Converter CID para maiúsculas
    if (field === 'cid') {
      processedValue = value.toUpperCase();
    }
    
    setFormData(prev => ({ ...prev, [field]: processedValue }));
    // Limpar erro do campo ao editar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.type) {
      newErrors.type = 'Tipo de atestado é obrigatório';
    }

    if (formData.type === 'medical_leave') {
      if (!formData.startDate.trim()) {
        newErrors.startDate = 'Data de início é obrigatória para afastamento';
      }
      if (!formData.endDate.trim()) {
        newErrors.endDate = 'Data de término é obrigatória para afastamento';
      }
      if (!formData.days.trim()) {
        newErrors.days = 'Número de dias é obrigatório';
      }
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Descrição/Motivo é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Converter data de DD/MM/YYYY para YYYY-MM-DD
  const convertDateToISO = (dateString) => {
    if (!dateString || typeof dateString !== 'string' || !dateString.trim()) {
      return null;
    }
    
    const trimmed = dateString.trim();
    
    // Verificar se tem o formato básico DD/MM/YYYY (10 caracteres)
    if (trimmed.length !== 10) {
      return null;
    }
    
    // Formato esperado: DD/MM/YYYY
    const parts = trimmed.split('/');
    if (parts.length !== 3) {
      return null;
    }
    
    const day = parts[0].trim().padStart(2, '0');
    const month = parts[1].trim().padStart(2, '0');
    const year = parts[2].trim();
    
    // Validar formato básico
    if (day.length !== 2 || month.length !== 2 || year.length !== 4) {
      return null;
    }
    
    // Validar que são números
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    
    if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) {
      return null;
    }
    
    // Validar ranges básicos
    if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || yearNum < 1900 || yearNum > 2100) {
      return null;
    }
    
    // Retornar no formato YYYY-MM-DD
    return `${year}-${month}-${day}`;
  };

  // Função auxiliar para renderizar CRM de forma segura
  const renderCrmDisplay = () => {
    // Se não houver dados do médico, não renderizar nada
    if (!doctorInfo) {
      return null;
    }
    
    // Função auxiliar para validar se um valor é válido para renderização
    const isValidValue = (value) => {
      if (!value || typeof value !== 'string') {
        return false;
      }
      const trimmed = value.trim();
      return trimmed.length > 0 && 
             trimmed !== '.' && 
             trimmed !== 'undefined' && 
             trimmed !== 'null' &&
             !trimmed.match(/^\.+$/); // Não pode ser apenas pontos
    };
    
    let crmDisplay = null;
    
    try {
      if (doctorInfo.crm) {
        const parsedCrm = parseCrm(doctorInfo.crm);
        
        // Garantir que parsedCrm existe e tem valores válidos
        if (parsedCrm && parsedCrm.number && parsedCrm.uf) {
          const crmNumber = String(parsedCrm.number).trim();
          const crmUf = String(parsedCrm.uf).trim();
          
          // Validar que ambos sejam válidos
          if (isValidValue(crmNumber) && isValidValue(crmUf)) {
            crmDisplay = `${crmNumber}/${crmUf}`;
          }
        }
        
        // Se não conseguiu parsear, tentar usar o valor original (se for string válida)
        if (!crmDisplay && typeof doctorInfo.crm === 'string' && isValidValue(doctorInfo.crm)) {
          crmDisplay = doctorInfo.crm.trim();
        }
      } else if (doctorInfo.crm_uf) {
        // Fallback se já vier separado
        const crmNumber = (doctorInfo.crm && typeof doctorInfo.crm === 'string') 
          ? doctorInfo.crm.trim() 
          : '';
        const crmUf = (doctorInfo.crm_uf && typeof doctorInfo.crm_uf === 'string') 
          ? doctorInfo.crm_uf.trim() 
          : '';
        
        if (isValidValue(crmNumber) && isValidValue(crmUf)) {
          crmDisplay = `${crmNumber}/${crmUf}`;
        } else if (isValidValue(crmNumber)) {
          crmDisplay = crmNumber;
        } else if (isValidValue(crmUf)) {
          crmDisplay = crmUf;
        }
      }
    } catch (error) {
      console.error('Erro ao parsear CRM:', error);
      crmDisplay = null;
    }
    
    // Garantir que crmDisplay seja válido antes de renderizar
    if (crmDisplay && isValidValue(crmDisplay)) {
      const trimmed = crmDisplay.trim();
      return (
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>CRM / UF:</Text>
          <Text style={styles.infoValue}>{trimmed}</Text>
        </View>
      );
    }
    
    return null;
  };

  const handleGeneratePDF = async () => {
    if (!validateForm()) {
      Alert.alert('Atenção', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      setLoading(true);

      // Validar campos obrigatórios antes de enviar
      const validationErrors = [];
      
      // Obter patient_id - tentar várias fontes (sempre priorizar patientInfo.id)
      console.log('🔍 MedicalCertificateFormScreen - Buscando patient_id:', {
        patientInfoId: patientInfo?.id,
        appointmentPatientId: appointment?.patient_id,
        appointmentUserId: appointment?.user_id,
        groupUserId: appointment?.group?.user_id,
      });
      
      let patientId = null;
      // Priorizar sempre patientInfo.id (ID real do paciente)
      if (patientInfo?.id) {
        patientId = patientInfo.id;
        console.log('✅ MedicalCertificateFormScreen - Patient ID encontrado em patientInfo:', patientId);
      } else if (appointment?.patient_id) {
        patientId = appointment.patient_id;
        console.log('✅ MedicalCertificateFormScreen - Patient ID encontrado em appointment.patient_id:', patientId);
      } else if (appointment?.user_id) {
        patientId = appointment.user_id;
        console.log('✅ MedicalCertificateFormScreen - Patient ID encontrado em appointment.user_id:', patientId);
      }
      // IMPORTANTE: Não usar appointment.group.user_id como último recurso pois pode ser o ID do responsável
      
      if (!patientId) {
        console.error('❌ MedicalCertificateFormScreen - Patient ID não encontrado em nenhuma fonte');
        validationErrors.push('ID do paciente não encontrado. Por favor, verifique os dados da consulta.');
      } else {
        console.log('✅ MedicalCertificateFormScreen - Patient ID final:', patientId);
      }
      
      // Validar CRM/UF do médico - fazer parse do campo crm se necessário
      let doctorCrm = '';
      let doctorCrmUf = '';
      
      if (doctorInfo?.crm) {
        // O backend armazena CRM no formato "UF-NUMERO" (ex: "MG-12345")
        // Fazer parse para separar número e UF
        const parsedCrm = parseCrm(doctorInfo.crm);
        doctorCrm = parsedCrm.number || '';
        doctorCrmUf = parsedCrm.uf || '';
        
        console.log('🔍 MedicalCertificateFormScreen - CRM parseado:', {
          crmOriginal: doctorInfo.crm,
          crmNumber: doctorCrm,
          crmUf: doctorCrmUf,
        });
      } else if (doctorInfo?.crm_uf) {
        // Se já vier separado (fallback)
        doctorCrm = doctorInfo?.crm || '';
        doctorCrmUf = doctorInfo.crm_uf;
      }
      
      // Validar se tem CRM/UF
      if (!doctorCrmUf || doctorCrmUf.trim() === '') {
        validationErrors.push('CRM/UF do médico não está cadastrado. Por favor, complete seus dados profissionais.');
      }
      
      // Validar e converter datas se for afastamento
      let startDateISO = null;
      let endDateISO = null;
      
      if (formData.type === 'medical_leave') {
        // Validar e converter data de início
        if (!formData.startDate || !formData.startDate.trim()) {
          validationErrors.push('Data de início é obrigatória para afastamento');
        } else {
          startDateISO = convertDateToISO(formData.startDate);
          if (!startDateISO) {
            validationErrors.push('Data de início inválida. Use o formato DD/MM/YYYY');
          }
        }
        
        // Validar e converter data de término
        if (!formData.endDate || !formData.endDate.trim()) {
          validationErrors.push('Data de término é obrigatória para afastamento');
        } else {
          endDateISO = convertDateToISO(formData.endDate);
          if (!endDateISO) {
            validationErrors.push('Data de término inválida. Use o formato DD/MM/YYYY');
          }
        }
      }

      if (validationErrors.length > 0) {
        Alert.alert(
          'Dados inválidos',
          validationErrors.join('\n• ')
        );
        setLoading(false);
        return;
      }

      const certificateData = {
        appointment_id: appointment?.id,
        group_id: groupId,
        patient_id: patientId,
        doctor_id: doctorInfo?.id || appointment?.doctor_id,
        // Tipo e período
        type: formData.type,
        // Só enviar datas se for afastamento e se foram validadas
        start_date: formData.type === 'medical_leave' ? startDateISO : null,
        end_date: formData.type === 'medical_leave' ? endDateISO : null,
        days: formData.type === 'medical_leave' && formData.days ? parseInt(formData.days) : null,
        // Descrição
        description: formData.description.trim(),
        // Observações
        notes: formData.notes.trim(),
        // Dados do paciente (para o PDF) - priorizar sempre patientInfo.name (nome real do paciente)
        // IMPORTANTE: NUNCA usar appointment.group.name como nome do paciente
        patient_name: (() => {
          // Priorizar sempre patientInfo.name
          if (patientInfo?.name) {
            return patientInfo.name;
          }
          // Se não tiver patientInfo, tentar appointment.patient_name ou accompanied_name
          return appointment?.patient_name || appointment?.accompanied_name || '';
        })(),
        patient_cpf: patientInfo?.cpf || '',
        patient_birth_date: patientInfo?.birth_date || '',
        patient_gender: (() => {
          // Converter gênero de inglês para português
          const genderMap = {
            'male': 'Masculino',
            'female': 'Feminino',
            'other': 'Outro'
          };
          return genderMap[patientInfo?.gender] || patientInfo?.gender || 'Não informado';
        })(),
        patient_rg: patientInfo?.rg || patientInfo?.identity || '',
        // Dados do médico (para o PDF) - usar valores parseados do CRM
        doctor_name: doctorInfo?.name || '',
        doctor_crm: doctorCrm || '',
        doctor_crm_uf: doctorCrmUf || '',
        doctor_specialty: doctorInfo?.specialty || doctorInfo?.medicalSpecialty?.name || '',
        // CID
        cid: formData.cid.trim() || null,
      };

      // Salvar dados e abrir modal para pedir senha do certificado
      setPendingCertificateData(certificateData);
      setShowPasswordModal(true);
      setLoading(false);
      return;

      if (result.success) {
        // Redirecionar imediatamente para a tela de videochamada
        if (appointment) {
          console.log('✅ MedicalCertificateFormScreen - Atestado gerado com sucesso!');
          console.log('✅ MedicalCertificateFormScreen - Redirecionando para DoctorVideoCall:', {
            appointmentId: appointment?.id,
            appointment: appointment,
            patientInfo: patientInfo,
            hasAppointment: !!appointment,
            documentId: result.data?.document_id,
          });
          
          // Redirecionar primeiro, depois mostrar alert com opção de ver documento
          try {
            navigation.replace('DoctorVideoCall', {
              appointment: appointment,
              patientInfo: patientInfo,
            });
            
            // Mostrar alert após um pequeno delay para não bloquear a navegação
            setTimeout(() => {
              Alert.alert(
                '✅ Atestado Gerado com Sucesso!',
                'O atestado médico foi gerado e assinado digitalmente.\n\n📄 O PDF foi salvo na aba "Arquivos" → categoria "Laudo".\n\nDeseja visualizar o documento agora?',
                [
                  {
                    text: 'Ver Documento',
                    onPress: () => {
                      // Navegar para a tela de documentos
                      navigation.navigate('Documents', { 
                        groupId: groupId || appointment?.group_id,
                        groupName: appointment?.group?.name 
                      });
                    },
                  },
                  {
                    text: 'Continuar',
                    style: 'cancel',
                  },
                ]
              );
            }, 500);
          } catch (navError) {
            console.error('❌ MedicalCertificateFormScreen - Erro ao navegar:', navError);
            // Fallback: tentar navigate em vez de replace
            navigation.navigate('DoctorVideoCall', {
              appointment: appointment,
              patientInfo: patientInfo,
            });
          }
        } else {
          console.warn('⚠️ MedicalCertificateFormScreen - Appointment não encontrado, voltando para tela anterior');
          Alert.alert(
            '✅ Atestado Gerado com Sucesso!',
            'O atestado médico foi gerado e assinado digitalmente.\n\n📄 O PDF foi salvo na aba "Arquivos" → categoria "Laudo".\n\nDeseja visualizar o documento agora?',
            [
              {
                text: 'Ver Documento',
                onPress: () => {
                  // Navegar para a tela de documentos
                  if (groupId) {
                    navigation.navigate('Documents', { 
                      groupId: groupId,
                      groupName: appointment?.group?.name 
                    });
                  } else {
                    navigation.goBack();
                  }
                },
              },
              {
                text: 'OK',
                style: 'cancel',
                onPress: () => {
                  navigation.goBack();
                },
              },
            ]
          );
        }
      } else {
        // Se result.error já está formatado com as mensagens específicas
        throw new Error(result.error || 'Erro ao gerar atestado');
      }
    } catch (error) {
      console.error('Erro ao gerar atestado:', error);
      
      // Usar a mensagem de erro já formatada pelo service
      let errorMessage = error.message || 'Não foi possível gerar o atestado médico. Tente novamente.';
      
      // Se for erro 500 do servidor, mostrar mensagem mais específica
      if (error.response?.status === 500 || error.status === 500) {
        errorMessage = 'Erro interno do servidor ao gerar o atestado. Verifique se:\n\n' +
          '• O certificado digital do médico está configurado\n' +
          '• Os dados do paciente e médico estão completos\n' +
          '• O servidor está funcionando corretamente\n\n' +
          'Tente novamente ou entre em contato com o suporte.';
      }
      
      Alert.alert('Erro ao Gerar Atestado', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getCertificateTypeLabel = () => {
    const type = certificateTypes.find(t => t.value === formData.type);
    return type ? type.label : 'Atestado Médico';
  };

  // Função auxiliar para obter nome do paciente de forma segura
  const getPatientName = () => {
    if (patientInfo?.name) {
      return patientInfo.name;
    }
    return appointment?.patient_name || appointment?.accompanied_name || 'Não informado';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Atestado Médico Digital</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Informações do Paciente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados do Paciente</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Nome:</Text>
            <Text style={styles.infoValue}>
              {getPatientName()}
            </Text>
          </View>
          {patientInfo?.cpf && patientInfo.cpf.trim() && patientInfo.cpf.trim() !== '.' && (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>CPF:</Text>
              <Text style={styles.infoValue}>{patientInfo.cpf}</Text>
            </View>
          )}
          {patientInfo?.birth_date && (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Data de Nascimento:</Text>
              <Text style={styles.infoValue}>
                {(() => {
                  try {
                    const date = new Date(patientInfo.birth_date);
                    if (!isNaN(date.getTime())) {
                      return date.toLocaleDateString('pt-BR');
                    }
                  } catch (e) {
                    console.error('Erro ao formatar data de nascimento:', e);
                  }
                  return 'Data inválida';
                })()}
              </Text>
            </View>
          )}
        </View>

        {/* Informações do Médico */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados do Médico</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Nome:</Text>
            <Text style={styles.infoValue}>{doctorInfo?.name || 'Não informado'}</Text>
          </View>
          {renderCrmDisplay()}
          {doctorInfo?.specialty && doctorInfo.specialty.trim() && doctorInfo.specialty.trim() !== '.' && (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Especialidade:</Text>
              <Text style={styles.infoValue}>{doctorInfo.specialty}</Text>
            </View>
          )}
        </View>

        {/* Formulário do Atestado */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipo de Atestado</Text>
          
          {certificateTypes.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.typeCard,
                formData.type === type.value && styles.typeCardActive,
              ]}
              onPress={() => updateField('type', type.value)}
            >
              <Ionicons
                name={type.icon}
                size={24}
                color={formData.type === type.value ? colors.primary : colors.gray600}
              />
              <Text
                style={[
                  styles.typeCardText,
                  formData.type === type.value && styles.typeCardTextActive,
                ]}
              >
                {type.label}
              </Text>
              {formData.type === type.value && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Período (apenas para afastamento) */}
        {formData.type === 'medical_leave' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Período de Afastamento</Text>

            {/* Data de Início */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Data de Início <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.startDate && styles.inputError]}
                placeholder="DD/MM/AAAA"
                placeholderTextColor={colors.gray400}
                value={formData.startDate}
                onChangeText={(value) => updateField('startDate', value)}
                keyboardType="numeric"
                maxLength={10}
              />
              {errors.startDate && (
                <Text style={styles.errorText}>{errors.startDate}</Text>
              )}
            </View>

            {/* Data de Término */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Data de Término <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.endDate && styles.inputError]}
                placeholder="DD/MM/AAAA"
                placeholderTextColor={colors.gray400}
                value={formData.endDate}
                onChangeText={(value) => updateField('endDate', value)}
                keyboardType="numeric"
                maxLength={10}
              />
              {errors.endDate && (
                <Text style={styles.errorText}>{errors.endDate}</Text>
              )}
            </View>

            {/* Número de Dias */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Número de Dias <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.days && styles.inputError]}
                placeholder="Ex: 7, 15, 30"
                placeholderTextColor={colors.gray400}
                value={formData.days}
                onChangeText={(value) => updateField('days', value)}
                keyboardType="numeric"
              />
              {errors.days && (
                <Text style={styles.errorText}>{errors.days}</Text>
              )}
            </View>
          </View>
        )}

        {/* CID */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CID (Código Internacional de Doenças)</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Código CID</Text>
            <View style={styles.cidInputContainer}>
              <TextInput
                style={[styles.input, styles.cidInput]}
                placeholder="Ex: E10, J45, I10"
                placeholderTextColor={colors.gray400}
                value={formData.cid}
                onChangeText={handleCidChange}
                onFocus={() => {
                  setIsCidFocused(true);
                  // Mostrar sugestões se já existirem resultados
                  if (cidSuggestions.length > 0) {
                    setShowCidSuggestions(true);
                  } else if (formData.cid && formData.cid.length >= 1) {
                    // Se houver texto no campo, buscar sugestões imediatamente
                    const results = cidService.searchCID(formData.cid, 10);
                    setCidSuggestions(results);
                    if (results.length > 0) {
                      setShowCidSuggestions(true);
                    }
                  }
                }}
                onBlur={() => {
                  // Aguardar um pouco antes de fechar para dar tempo da seleção acontecer
                  setTimeout(() => {
                    if (!isSelectingCidRef.current) {
                      setIsCidFocused(false);
                      setShowCidSuggestions(false);
                    }
                  }, 250);
                }}
                autoCapitalize="characters"
                maxLength={10}
              />
              {showCidSuggestions && cidSuggestions.length > 0 && (
                <View style={styles.cidSuggestionsContainer}>
                  <View style={styles.cidSuggestionsBackdrop} />
                  <ScrollView 
                    style={styles.cidSuggestionsScroll}
                    contentContainerStyle={styles.cidSuggestionsScrollContent}
                    nestedScrollEnabled={true}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={true}
                  >
                    {cidSuggestions.map((item, index) => (
                      <Pressable
                        key={`cid-${index}-${item.code}`}
                        style={({ pressed }) => [
                          styles.cidSuggestionItem,
                          pressed && styles.cidSuggestionItemPressed,
                          index === cidSuggestions.length - 1 && styles.cidSuggestionItemLast
                        ]}
                        onTouchStart={() => {
                          // Usar onTouchStart para garantir que execute antes do onBlur
                          handleSelectCID(item);
                        }}
                        onPress={() => {
                          // Também manter onPress como fallback
                          handleSelectCID(item);
                        }}
                      >
                        <View style={styles.cidSuggestionIconContainer}>
                          <Ionicons name="medical" size={20} color={colors.primary} />
                        </View>
                        <View style={styles.cidSuggestionContent}>
                          <Text style={styles.cidSuggestionCode}>{item.code}</Text>
                          <Text style={styles.cidSuggestionDescription} numberOfLines={2}>
                            {item.description}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={colors.gray400} />
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
            <Text style={styles.helperText}>
              Digite o código CID (ex: E10) ou parte da descrição para buscar
            </Text>
          </View>
        </View>

        {/* Descrição/Motivo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descrição/Motivo</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Descrição <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.description && styles.inputError, styles.textArea]}
              placeholder={`Descreva o motivo do ${getCertificateTypeLabel().toLowerCase()}`}
              placeholderTextColor={colors.gray400}
              value={formData.description}
              onChangeText={(value) => updateField('description', value)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            {errors.description && (
              <Text style={styles.errorText}>{errors.description}</Text>
            )}
          </View>

          {/* Observações Adicionais */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Observações Adicionais</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Observações complementares (opcional)"
              placeholderTextColor={colors.gray400}
              value={formData.notes}
              onChangeText={(value) => updateField('notes', value)}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Botão de Gerar PDF */}
        <TouchableOpacity
          style={[styles.generateButton, loading && styles.generateButtonDisabled]}
          onPress={handleGeneratePDF}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.textDark} />
          ) : (
            <>
              <Ionicons name="document-text" size={20} color={colors.textDark} />
              <Text style={styles.generateButtonText}>
                Gerar Atestado Assinado Digitalmente
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.footerNote}>
          <Ionicons name="information-circle" size={16} color={colors.gray600} />
          <Text style={styles.footerNoteText}>
            O atestado será assinado digitalmente com certificado ICP-Brasil e salvo automaticamente na aba Arquivos.
          </Text>
        </View>
      </ScrollView>

      {/* Modal para senha do certificado */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowPasswordModal(false);
          setCertificatePassword('');
          setPendingCertificateData(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Senha do Certificado Digital</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowPasswordModal(false);
                  setCertificatePassword('');
                  setPendingCertificateData(null);
                }}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalDescription}>
              Digite a senha do seu certificado digital (.pfx) para assinar o atestado:
            </Text>
            <TextInput
              style={styles.passwordInput}
              placeholder="Senha do certificado"
              placeholderTextColor={colors.placeholder}
              value={certificatePassword}
              onChangeText={setCertificatePassword}
              secureTextEntry
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowPasswordModal(false);
                  setCertificatePassword('');
                  setPendingCertificateData(null);
                }}
              >
                <Text style={styles.modalButtonCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={async () => {
                  if (!certificatePassword || certificatePassword.trim() === '') {
                    Alert.alert('Erro', 'A senha do certificado é obrigatória');
                    return;
                  }

                  setLoading(true);
                  try {
                    // Adicionar senha aos dados do certificado
                    const certificateDataWithPassword = {
                      ...pendingCertificateData,
                      certificate_password: certificatePassword.trim(),
                    };

                    const result = await prescriptionService.generateSignedCertificate(certificateDataWithPassword);

                    if (result.success) {
                      setShowPasswordModal(false);
                      setCertificatePassword('');
                      setPendingCertificateData(null);
                      
                      // Redirecionar imediatamente para a tela de videochamada
                      if (appointment) {
                        console.log('✅ MedicalCertificateFormScreen - Atestado gerado com sucesso!');
                        navigation.replace('DoctorVideoCall', {
                          appointment: appointment,
                          patientInfo: patientInfo,
                        });
                        
                        // Mostrar alert após um pequeno delay
                        setTimeout(() => {
                          Alert.alert(
                            '✅ Atestado Gerado',
                            'O atestado foi assinado digitalmente e salvo com sucesso.',
                            [
                              {
                                text: 'Ver Documento',
                                onPress: () => {
                                  // Navegar para visualizar o documento
                                  // TODO: Implementar navegação para visualizar documento
                                },
                              },
                              { text: 'OK' },
                            ]
                          );
                        }, 500);
                      } else {
                        Alert.alert('✅ Sucesso', 'Atestado gerado e assinado com sucesso!');
                      }
                    } else {
                      Alert.alert('Erro', result.error || 'Erro ao gerar atestado');
                    }
                  } catch (error) {
                    console.error('Erro ao gerar atestado:', error);
                    Alert.alert('Erro', 'Não foi possível gerar o atestado');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading || !certificatePassword.trim()}
              >
                {loading ? (
                  <ActivityIndicator color={colors.textWhite} />
                ) : (
                  <Text style={styles.modalButtonConfirmText}>Assinar e Gerar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    backgroundColor: colors.white,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.gray600,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.gray200,
    gap: 12,
  },
  typeCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  typeCardText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray600,
  },
  typeCardTextActive: {
    color: colors.primary,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  required: {
    color: colors.error,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  inputError: {
    borderColor: colors.error,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 16,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e0e7ff',
    borderRadius: 12,
    padding: 18,
    marginTop: 20,
    gap: 10,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.info + '20',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    gap: 10,
  },
  footerNoteText: {
    flex: 1,
    fontSize: 12,
    color: colors.gray700,
    lineHeight: 18,
  },
  cidInputContainer: {
    position: 'relative',
  },
  cidInput: {
    textTransform: 'uppercase',
  },
  cidSuggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    marginTop: 6,
    maxHeight: 200,
    zIndex: 9999,
    elevation: 15,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    overflow: 'hidden',
    opacity: 1,
  },
  cidSuggestionsBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    zIndex: -1,
  },
  cidSuggestionsScroll: {
    backgroundColor: '#FFFFFF',
    opacity: 1,
    flex: 1,
  },
  cidSuggestionsScrollContent: {
    backgroundColor: '#FFFFFF',
  },
  cidSuggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    gap: 12,
    backgroundColor: '#FFFFFF',
    minHeight: 56,
    opacity: 1,
  },
  cidSuggestionItemLast: {
    borderBottomWidth: 0,
  },
  cidSuggestionItemPressed: {
    backgroundColor: '#e0e7ff',
  },
  cidSuggestionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cidSuggestionContent: {
    flex: 1,
  },
  cidSuggestionCode: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  cidSuggestionDescription: {
    fontSize: 13,
    color: colors.gray700,
    lineHeight: 18,
  },
  helperText: {
    fontSize: 12,
    color: colors.gray500,
    marginTop: 4,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalDescription: {
    fontSize: 14,
    color: colors.textLight,
    paddingHorizontal: 20,
    paddingTop: 16,
    marginBottom: 8,
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: colors.backgroundLight,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: colors.gray200,
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  modalButtonConfirm: {
    backgroundColor: colors.primary,
  },
  modalButtonConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textWhite,
  },
});

export default MedicalCertificateFormScreen;

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SafeIcon from '../../components/SafeIcon';
import Toast from 'react-native-toast-message';
import colors from '../../constants/colors';
import AdvancedFrequencyModal from './AdvancedFrequencyModal';
import { scheduleMedicationNotifications } from '../../services/notificationService';
import medicationService from '../../services/medicationService';
import medicationSearchService from '../../services/medicationSearchService';
import MedicationAutocomplete from '../../components/MedicationAutocomplete';
import documentService from '../../services/documentService';
import * as FileSystem from 'expo-file-system/legacy';

// Estrutura baseada na tabela: Via de Administração -> Forma Farmacêutica -> Unidade de Dose
const MEDICATION_STRUCTURE = {
  'Oral': {
    forms: [
      { name: 'Comprimido', unit: 'comprimido(s)' },
      { name: 'Cápsula', unit: 'cápsula(s)' },
      { name: 'Gotas', unit: 'gota(s)' },
      { name: 'Xarope', unit: 'mL' },
      { name: 'Solução', unit: 'mL' },
      { name: 'Suspensão', unit: 'mL' },
      { name: 'Pó', unit: 'g' },
      { name: 'Sachê', unit: 'sachê' },
    ]
  },
  'Inalatória': {
    forms: [
      { name: 'MDI - Bombinha', unit: 'jato(s)' },
      { name: 'DPI - Pó inalável', unit: 'inalação(ões)' },
    ]
  },
  'Nebulização': {
    forms: [
      { name: 'Solução - Ampola', unit: 'mL' },
      { name: 'Solução - Frasco', unit: 'mL' },
    ]
  },
  'Injetável': {
    forms: [
      { name: 'Ampola', unit: 'mL' },
      { name: 'Frasco-ampola', unit: 'mL' },
    ]
  },
  'Tópica': {
    forms: [
      { name: 'Pomada', unit: 'camada' },
      { name: 'Creme', unit: 'camada' },
      { name: 'Gel', unit: 'camada' },
    ]
  },
  'Nasal': {
    forms: [
      { name: 'Spray Nasal', unit: 'jato(s)' },
    ]
  },
  'Ocular': {
    forms: [
      { name: 'Colírio', unit: 'gota(s)' },
    ]
  },
  'Transdérmica': {
    forms: [
      { name: 'Adesivo', unit: 'adesivo' },
    ]
  },
  'Retal / Vaginal': {
    forms: [
      { name: 'Supositório', unit: 'supositório' },
      { name: 'Óvulo', unit: 'óvulo' },
    ]
  },
};

// Unidades de concentração (para o campo de concentração)
const CONCENTRATION_UNITS = ['mg', 'mL', 'g', 'UI', 'mcg', '%'];

const FREQUENCIES = [
  { label: '1x ao dia', value: '24', times: 1 },
  { label: '12 em 12 horas', value: '12', times: 2 },
  { label: '8 em 8 horas', value: '8', times: 3 },
  { label: '6 em 6 horas', value: '6', times: 4 },
  { label: '4 em 4 horas', value: '4', times: 6 },
  { label: '2 em 2 horas', value: '2', times: 12 },
  { label: 'Outros', value: 'advanced', times: null, icon: 'settings-outline' },
];

const AddMedicationScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  let { groupId, groupName, prescriptionId: initialPrescriptionId, doctorId, doctorName, prescriptionImage: initialPrescriptionImage, medicationId, medication } = route.params;
  
  // Usar useState para manter prescriptionImage persistente durante a sessão
  const [prescriptionImage, setPrescriptionImage] = useState(initialPrescriptionImage);
  const [prescriptionId, setPrescriptionId] = useState(initialPrescriptionId);
  
  // Atualizar prescriptionImage quando route.params mudar (mas manter se já existir)
  useEffect(() => {
    if (initialPrescriptionImage && !prescriptionImage) {
      setPrescriptionImage(initialPrescriptionImage);
    }
  }, [initialPrescriptionImage]);
  
  // Se não houver prescriptionId mas houver prescriptionImage, criar um ID único para esta sessão de receita
  // Isso permite agrupar medicamentos da mesma receita
  useEffect(() => {
    if (!prescriptionId && prescriptionImage) {
      const newPrescriptionId = `prescription_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setPrescriptionId(newPrescriptionId);
      console.log('📋 AddMedicationScreen - Criando nova sessão de receita:', newPrescriptionId);
    }
  }, [prescriptionImage, prescriptionId]);
  
  // TEMPORÁRIO: Se groupId é um timestamp, usar o grupo de teste
  if (groupId && groupId > 999999999999) {
    groupId = 1;
  }

  // Verificar se é edição
  const isEditing = !!medicationId;

  const [name, setName] = useState('');
  const [isFarmaciaPopular, setIsFarmaciaPopular] = useState(false);
  const [form, setForm] = useState('');
  const [dosage, setDosage] = useState('');
  const [unit, setUnit] = useState('mg');
  const [doseQuantity, setDoseQuantity] = useState('');
  const [doseQuantityUnit, setDoseQuantityUnit] = useState('');
  const [administrationRoute, setAdministrationRoute] = useState('Oral');
  const [frequency, setFrequency] = useState('24');
  const [firstDoseTime, setFirstDoseTime] = useState('08:00');
  const [instructions, setInstructions] = useState('');
  const [durationType, setDurationType] = useState('continuo'); // continuo ou temporario
  const [durationDays, setDurationDays] = useState('');
  const [advancedFrequency, setAdvancedFrequency] = useState(null);
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [loadingMedication, setLoadingMedication] = useState(false);

  const [saving, setSaving] = useState(false);
  const [prescriptionSaved, setPrescriptionSaved] = useState(false); // Flag para evitar salvar receita múltiplas vezes
  
  // Estados para autocomplete de medicamentos
  const [medicationSuggestions, setMedicationSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Log quando o componente monta
  useEffect(() => {
    console.log('🔄 AddMedicationScreen - Componente montado', {
      groupId,
      doctorId,
      doctorName,
      prescriptionImage: !!prescriptionImage,
      isEditing,
    });
  }, []);

  // Buscar sugestões de medicamentos
  const handleNameChange = async (text) => {
    console.log('🔍 AddMedicationScreen - handleNameChange chamado com:', text);
    // Atualizar o nome
    setName(text);
    
    // Verificar se é da Farmácia Popular quando o usuário digita
    if (text.length >= 2) {
      const isPopular = medicationSearchService.isFarmaciaPopular(text);
      setIsFarmaciaPopular(isPopular);
    } else {
      setIsFarmaciaPopular(false);
    }
    
    // Limpar timeout anterior
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Se o texto tiver menos de 2 caracteres, não buscar
    if (text.length < 2) {
      setMedicationSuggestions([]);
      return;
    }
    
    // Debounce: aguardar 300ms antes de buscar
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      
      try {
        const results = await medicationSearchService.searchMedications(text, 10);
        setMedicationSuggestions(results);
      } catch (error) {
        console.error('Erro ao buscar medicamentos:', error);
        setMedicationSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  // Selecionar medicamento da sugestão
  const handleSelectMedication = (medication) => {
    // Atualizar o nome do medicamento
    setName(medication.name);
    setMedicationSuggestions([]);
    
    // Verificar se é da Farmácia Popular (apenas para exibir badge informativo)
    const isPopular = medicationSearchService.isFarmaciaPopular(medication.name);
    setIsFarmaciaPopular(isPopular);
    
    // Feedback visual de seleção
    Toast.show({
      type: 'success',
      text1: 'Medicamento selecionado',
      text2: medication.name,
      visibilityTime: 1500,
    });
  };

  // Cleanup do timeout quando componente desmontar
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Carregar dados do medicamento se for edição
  useEffect(() => {
    if (isEditing) {
      loadMedicationForEdit();
    }
  }, [isEditing]);

  const loadMedicationForEdit = async () => {
    try {
      setLoadingMedication(true);
      
      // Se os dados do medicamento foram passados via route.params, usar eles
      if (medication) {
        populateFormWithMedication(medication);
        return;
      }

      // Caso contrário, buscar da API
      if (medicationId) {
        const result = await medicationService.getMedication(medicationId);
        if (result.success && result.data) {
          populateFormWithMedication(result.data);
        } else {
          Alert.alert('Erro', 'Não foi possível carregar os dados do medicamento');
          navigation.goBack();
        }
      }
    } catch (error) {
      console.error('Erro ao carregar medicamento para edição:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados do medicamento');
      navigation.goBack();
    } finally {
      setLoadingMedication(false);
    }
  };

  const populateFormWithMedication = (med) => {
    // Transformar dados da API para o formato esperado pela UI
    const frequency = typeof med.frequency === 'string' 
      ? JSON.parse(med.frequency) 
      : (med.frequency || {});
    
    const frequencyDetails = frequency.details || {};
    const frequencyType = frequency.type || 'simple';
    
    const duration = typeof med.duration === 'string'
      ? JSON.parse(med.duration)
      : (med.duration || { type: 'continuo', value: null });

    // Preencher formulário com dados do medicamento
    setName(med.name || '');
    setForm(med.pharmaceutical_form || med.form || '');
    setDosage(med.dosage || '');
    setUnit(med.unit || 'mg');
    setDoseQuantity(med.dose_quantity || '');
    setDoseQuantityUnit(med.dose_quantity_unit || '');
    setAdministrationRoute(med.administration_route || 'Oral');
    setFrequency(frequencyType === 'advanced' ? 'advanced' : (frequencyDetails.interval || '24'));
    setAdvancedFrequency(frequencyType === 'advanced' ? frequencyDetails : null);
    setInstructions(med.notes || '');
    setDurationType(duration.type || 'continuo');
    setDurationDays(duration.value ? duration.value.toString() : '');
    
    // Extrair primeiro horário do schedule
    const schedule = med.times || frequencyDetails.schedule || [];
    if (schedule.length > 0) {
      const firstTime = schedule[0];
      if (firstTime && firstTime.includes(':')) {
        setFirstDoseTime(firstTime.substring(0, 5)); // Formato HH:MM
      }
    }

    // Verificar se é da Farmácia Popular
    if (med.name) {
      const isPopular = medicationSearchService.isFarmaciaPopular(med.name);
      setIsFarmaciaPopular(isPopular);
    }
  };

  const handleAdvancedFrequencyConfirm = (config) => {
    setAdvancedFrequency(config);
    setFrequency('advanced');
  };

  const handleFrequencyChange = (value) => {
    if (value === 'advanced') {
      setShowAdvancedModal(true);
    } else {
      setFrequency(value);
      setAdvancedFrequency(null);
    }
  };

  const getFrequencyLabel = () => {
    if (frequency === 'advanced' && advancedFrequency) {
      switch (advancedFrequency.type) {
        case 'alternating':
          return 'Dias intercalados';
        case 'specific_days':
          return `Dias específicos (${advancedFrequency.weekdays.length} dias/semana)`;
        case 'cycles':
          return `Ciclos (${advancedFrequency.cycleDays} dias on, ${advancedFrequency.pauseDays} dias off)`;
        case 'every_n_days':
          return `A cada ${advancedFrequency.interval} dias`;
        case 'every_n_weeks':
          return `A cada ${advancedFrequency.interval} semanas`;
        case 'every_n_months':
          return `A cada ${advancedFrequency.interval} meses`;
        default:
          return 'Frequência personalizada';
      }
    }
    const freq = FREQUENCIES.find(f => f.value === frequency);
    return freq ? freq.label : 'Frequência personalizada';
  };

  // Salvar receita escaneada como documento
  const savePrescriptionAsDocument = async () => {
    if (!prescriptionImage || prescriptionSaved) {
      // Se já foi salva, não tentar salvar novamente
      return;
    }

    try {
      // Criar FormData para upload
      const formData = new FormData();
      
      // Extrair nome do arquivo da URI
      const uriParts = prescriptionImage.split('/');
      const fileName = uriParts[uriParts.length - 1] || `receita_${Date.now()}.jpg`;
      
      // Adicionar arquivo
      formData.append('file', {
        uri: prescriptionImage,
        type: 'image/jpeg',
        name: fileName,
      });
      
      // Adicionar dados do documento (formato esperado pelo backend)
      formData.append('group_id', groupId.toString());
      formData.append('type', 'prescription');
      formData.append('title', doctorName 
        ? `Receita - ${doctorName}` 
        : 'Receita Médica');
      formData.append('document_date', new Date().toISOString());
      // consultation_id pode ser null se não houver consulta vinculada
      formData.append('consultation_id', '');
      // Adicionar doctor_id se houver (pode ser de doctors ou users com profile='doctor')
      if (doctorId) {
        formData.append('doctor_id', doctorId.toString());
        console.log('📋 AddMedicationScreen - Salvando receita com doctor_id:', doctorId, 'doctorName:', doctorName);
      }
      formData.append('notes', doctorName 
        ? `Receita médica prescrita por ${doctorName} com medicamentos cadastrados`
        : 'Receita médica com medicamentos cadastrados');

      // Fazer upload do documento
      await documentService.uploadDocument(formData);
      
      // Marcar como salva para evitar tentar salvar novamente
      setPrescriptionSaved(true);
      
      Toast.show({
        type: 'success',
        text1: 'Receita salva',
        text2: 'A receita foi salva na seção de Arquivos',
        position: 'bottom',
      });
    } catch (error) {
      console.error('Erro ao salvar receita como documento:', error);
      // Não bloquear o fluxo se falhar ao salvar o documento
      Toast.show({
        type: 'info',
        text1: 'Receita não salva',
        text2: 'A receita não pôde ser salva, mas os medicamentos foram cadastrados',
        position: 'bottom',
      });
    }
  };

  const handleSave = async () => {
    // Validações
    console.log('🔍 AddMedicationScreen - handleSave chamado');
    console.log('🔍 AddMedicationScreen - name:', name, 'type:', typeof name, 'trimmed:', name?.trim());
    console.log('🔍 AddMedicationScreen - form:', form, 'dosage:', dosage, 'doseQuantity:', doseQuantity);
    
    if (!name || !name.trim()) {
      console.warn('⚠️ AddMedicationScreen - Nome do medicamento vazio');
      Alert.alert('Erro', 'Digite o nome do medicamento');
      return;
    }
    if (!form.trim()) {
      Alert.alert('Erro', 'Selecione a forma farmacêutica');
      return;
    }
    if (!dosage.trim()) {
      Alert.alert('Erro', 'Digite a concentração');
      return;
    }
    if (!doseQuantity.trim()) {
      Alert.alert('Erro', 'Digite a quantidade da dose');
      return;
    }

    try {
      setSaving(true);

      // Gerar horários baseado na frequência
      const schedule = generateSchedule(firstDoseTime, frequency);

      // Calcular end_date e start_date se for dias intercalados
      let calculatedEndDate = null;
      let calculatedStartDate = null;
      if (frequency === 'advanced' && advancedFrequency && advancedFrequency.type === 'alternating' && advancedFrequency.doseCount) {
        const startDate = new Date(advancedFrequency.startDate);
        calculatedStartDate = advancedFrequency.startDate; // Usar a data inicial do advancedFrequency
        const doseCount = parseInt(advancedFrequency.doseCount);
        if (doseCount > 0) {
          // Para dias intercalados: data final = data inicial + (quantidade de doses - 1) * 2 dias
          // Exemplo: se começar no dia 1 e tiver 5 doses:
          // Dose 1: dia 1, Dose 2: dia 3, Dose 3: dia 5, Dose 4: dia 7, Dose 5: dia 9
          // Fórmula: data final = data inicial + (quantidade de doses - 1) * 2 dias
          const daysToAdd = (doseCount - 1) * 2;
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + daysToAdd);
          calculatedEndDate = endDate.toISOString().split('T')[0];
        }
      }

      // Preparar dados para API
      const medicationData = {
        groupId: groupId,
        doctorId: doctorId || null, // Incluir doctorId se houver (receita médica)
        name: name.trim(),
        form: form.trim(),
        dosage: dosage.trim(),
        unit: unit,
        doseQuantity: doseQuantity.trim() || null,
        doseQuantityUnit: doseQuantityUnit,
        administrationRoute: administrationRoute,
        frequencyType: frequency === 'advanced' ? 'advanced' : 'simple',
        frequencyDetails: frequency === 'advanced' 
          ? JSON.stringify(advancedFrequency) 
          : JSON.stringify({ interval: frequency, schedule }),
        firstDoseAt: `${new Date().toISOString().split('T')[0]} ${firstDoseTime}:00`,
        durationType: durationType,
        durationValue: durationType === 'temporario' ? parseInt(durationDays) : null,
        notes: (() => {
          // Se houver prescriptionId, adicionar ao notes para agrupar medicamentos da mesma receita
          let notesValue = instructions.trim() || '';
          if (prescriptionId) {
            // Adicionar prescriptionId no início das notes com um prefixo especial
            // Formato: [PRESCRIPTION_ID:prescription_xxx] notas do usuário
            const prescriptionMarker = `[PRESCRIPTION_ID:${prescriptionId}]`;
            notesValue = notesValue ? `${prescriptionMarker} ${notesValue}` : prescriptionMarker;
            console.log('📋 AddMedicationScreen - Adicionando prescriptionId ao medicamento:', prescriptionId);
          }
          return notesValue || null;
        })(),
        isActive: true,
        startDate: calculatedStartDate, // Data inicial para dias intercalados
        endDate: calculatedEndDate, // Data final calculada para dias intercalados
      };

      // Se for edição, usar updateMedication, senão createMedication
      const result = isEditing 
        ? await medicationService.updateMedication(medicationId, medicationData)
        : await medicationService.createMedication(medicationData);

      if (result.success) {
        // Agendar notificações locais
        try {
          const medication = {
            id: result.data.id,
            name: name.trim(),
            frequency,
            schedule,
            advancedFrequency: frequency === 'advanced' ? advancedFrequency : null,
          };
          await scheduleMedicationNotifications(medication);
        } catch (notifError) {
          console.error('Erro ao agendar notificações:', notifError);
          // Não bloqueia o salvamento
        }

        // Se for edição, voltar para a tela de detalhes
        if (isEditing) {
          Toast.show({
            type: 'success',
            text1: 'Medicamento atualizado',
            text2: `${name} foi atualizado com sucesso`,
            position: 'bottom',
          });
          navigation.goBack();
          return;
        }

        // Debug: verificar se prescriptionImage existe
        console.log('📋 AddMedicationScreen - Após salvar medicamento:', {
          prescriptionImage: !!prescriptionImage,
          prescriptionImageValue: prescriptionImage,
          prescriptionId,
          doctorId,
          doctorName,
        });

        // Se estiver cadastrando uma receita (com prescriptionImage), oferecer opção de adicionar mais
        if (prescriptionImage) {
          console.log('📋 AddMedicationScreen - prescriptionImage existe, mostrando Alert para adicionar mais medicamentos');
          // Usar setTimeout para garantir que o Alert apareça após o Toast
          setTimeout(() => {
            Alert.alert(
              'Medicamento cadastrado!',
              'Deseja adicionar outro medicamento desta receita?',
              [
                {
                  text: 'Finalizar Receita',
                  style: 'default',
                  onPress: async () => {
                    // Salvar a receita como documento antes de finalizar
                    await savePrescriptionAsDocument();
                    Toast.show({
                      type: 'success',
                      text1: 'Receita finalizada',
                      text2: 'Todos os medicamentos foram cadastrados',
                      position: 'bottom',
                    });
                    // Voltar para a lista de medicamentos
                    navigation.navigate('Medications', { groupId, groupName });
                  },
                },
                {
                  text: 'Adicionar Outro',
                  style: 'default',
                  onPress: () => {
                    console.log('📋 AddMedicationScreen - Usuário escolheu "Adicionar Outro", mantendo prescriptionImage e prescriptionId');
                    // Limpar formulário mas manter dados da receita (incluindo prescriptionId e prescriptionImage)
                    setName('');
                    setForm('');
                    setDosage('');
                    setUnit('mg');
                    setDoseQuantity('');
                    setDoseQuantityUnit('');
                    setAdministrationRoute('Oral');
                    setFrequency('24');
                    setFirstDoseTime('08:00');
                    setInstructions('');
                    setDurationType('continuo');
                    setDurationDays('');
                    setAdvancedFrequency(null);
                    setIsFarmaciaPopular(false);
                    
                    // IMPORTANTE: prescriptionImage e prescriptionId são mantidos automaticamente
                    // porque são variáveis do componente que não são resetadas
                    // Manter na mesma tela para adicionar outro medicamento
                    Toast.show({
                      type: 'info',
                      text1: 'Adicione o próximo medicamento',
                      text2: 'Preencha os dados do próximo medicamento da receita',
                      position: 'bottom',
                    });
                  },
                },
              ],
              { cancelable: false }
            );
          }, 500); // Aguardar 500ms para o Toast aparecer primeiro
          
          // Mostrar Toast de sucesso
          Toast.show({
            type: 'success',
            text1: 'Medicamento cadastrado',
            text2: `${name} foi adicionado com sucesso`,
            position: 'bottom',
          });
        } else {
          // Se não for receita, mostrar Toast e voltar normalmente
          Toast.show({
            type: 'success',
            text1: 'Medicamento cadastrado',
            text2: `${name} foi adicionado com sucesso`,
            position: 'bottom',
          });
          // Aguardar um pouco antes de voltar para o Toast aparecer
          setTimeout(() => {
            navigation.goBack();
            navigation.goBack(); // Voltar para a tela de medicamentos
          }, 1000);
        }
      } else {
        Alert.alert('Erro', result.error || 'Não foi possível salvar o medicamento');
      }
    } catch (error) {
      console.error('Erro ao salvar medicamento:', error);
      Alert.alert('Erro', 'Não foi possível salvar o medicamento');
    } finally {
      setSaving(false);
    }
  };

  const generateSchedule = (firstTime, intervalHours) => {
    const schedule = [];
    const interval = parseInt(intervalHours);
    const timesPerDay = 24 / interval;

    let [hours, minutes] = firstTime.split(':').map(Number);

    for (let i = 0; i < timesPerDay; i++) {
      const time = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      schedule.push(time);
      hours = (hours + interval) % 24;
    }

    return schedule;
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <SafeIcon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.title}>
            {isEditing ? 'Editar Remédio' : (prescriptionImage ? 'Receita Médica' : 'Cadastrar Remédio')}
          </Text>
          <Text style={styles.subtitle}>
            {doctorName ? `${doctorName} - ${groupName}` : groupName}
          </Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          {/* Indicador de Receita */}
          {prescriptionImage && (
            <View style={styles.prescriptionIndicator}>
              <SafeIcon name="document-text" size={20} color={colors.secondary} />
              <Text style={styles.prescriptionIndicatorText}>
                Cadastrando medicamentos da receita
              </Text>
            </View>
          )}

          {/* Nome do Medicamento */}
          <View style={styles.field}>
            <Text style={styles.label}>Nome do medicamento *</Text>
            <MedicationAutocomplete
              value={name}
              onChangeText={handleNameChange}
              onSelect={handleSelectMedication}
              suggestions={medicationSuggestions}
              placeholder="Ex: Losartana"
              isLoading={isSearching}
              showPrice={false}
              isFarmaciaPopular={isFarmaciaPopular}
            />
          </View>

          {/* Via de Administração */}
          <View style={styles.field}>
            <Text style={styles.label}>Via de administração *</Text>
            <View style={styles.chipContainer}>
              {Object.keys(MEDICATION_STRUCTURE).map((route) => (
                <TouchableOpacity
                  key={route}
                  style={[styles.chip, administrationRoute === route && styles.chipActive]}
                  onPress={() => {
                    setAdministrationRoute(route);
                    // Limpar forma e unidade quando mudar a via
                    setForm('');
                    setDoseQuantityUnit('');
                  }}
                >
                  <Text style={[styles.chipText, administrationRoute === route && styles.chipTextActive]}>
                    {route}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Forma Farmacêutica */}
          <View style={styles.field}>
            <Text style={styles.label}>Forma farmacêutica *</Text>
            {administrationRoute ? (
              <View style={styles.chipContainer}>
                {MEDICATION_STRUCTURE[administrationRoute]?.forms.map((formItem) => (
                  <TouchableOpacity
                    key={formItem.name}
                    style={[styles.chip, form === formItem.name && styles.chipActive]}
                    onPress={() => {
                      setForm(formItem.name);
                      // Definir automaticamente a unidade da dose baseada na forma
                      setDoseQuantityUnit(formItem.unit);
                    }}
                  >
                    <Text style={[styles.chipText, form === formItem.name && styles.chipTextActive]}>
                      {formItem.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.hint}>Selecione primeiro a via de administração</Text>
            )}
          </View>

          {/* Concentração */}
          <View style={styles.row}>
            <View style={[styles.field, { flex: 2 }]}>
              <Text style={styles.label}>Concentração *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 50"
                value={dosage}
                onChangeText={setDosage}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Unidade *</Text>
              <View style={styles.chipContainer}>
                {CONCENTRATION_UNITS.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[styles.chip, styles.chipSmall, unit === item && styles.chipActive]}
                    onPress={() => setUnit(item)}
                  >
                    <Text style={[styles.chipText, unit === item && styles.chipTextActive]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Quantidade da Dose */}
          <View style={styles.row}>
            <View style={[styles.field, { flex: 2 }]}>
              <Text style={styles.label}>Quantidade da dose *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 1, 2, 0.5"
                value={doseQuantity}
                onChangeText={setDoseQuantity}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Unidade da dose</Text>
              {form && administrationRoute ? (
                <View style={styles.chipContainer}>
                  {(() => {
                    const selectedForm = MEDICATION_STRUCTURE[administrationRoute]?.forms.find(f => f.name === form);
                    if (selectedForm) {
                      return (
                        <TouchableOpacity
                          style={[styles.chip, styles.chipSmall, styles.chipActive]}
                          disabled={true}
                        >
                          <Text style={[styles.chipText, styles.chipTextActive]}>
                            {selectedForm.unit}
                          </Text>
                        </TouchableOpacity>
                      );
                    }
                    return null;
                  })()}
                </View>
              ) : (
                <Text style={styles.hint}>Selecione forma farmacêutica</Text>
              )}
            </View>
          </View>

          {/* Instruções */}
          <View style={styles.field}>
            <Text style={styles.label}>Instruções de uso</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Ex: Em jejum, após as refeições..."
              value={instructions}
              onChangeText={setInstructions}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Frequência */}
          <View style={styles.field}>
            <Text style={styles.label}>Frequência *</Text>
            <View style={styles.frequencyContainer}>
              {FREQUENCIES.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.frequencyButton,
                    frequency === item.value && styles.frequencyButtonActive,
                    item.value === 'advanced' && styles.frequencyButtonAdvanced
                  ]}
                  onPress={() => handleFrequencyChange(item.value)}
                >
                  {item.icon && (
                    <SafeIcon 
                      name={item.icon} 
                      size={20} 
                      color={frequency === item.value ? colors.primary : colors.textLight} 
                    />
                  )}
                  <Text style={[
                    styles.frequencyButtonText,
                    frequency === item.value && styles.frequencyButtonTextActive
                  ]}>
                    {item.label}
                  </Text>
                  {item.times !== null && (
                    <Text style={[
                      styles.frequencyButtonSubtext,
                      frequency === item.value && styles.frequencyButtonSubtextActive
                    ]}>
                      {item.times}x por dia
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
            {frequency === 'advanced' && advancedFrequency && (
              <View style={styles.advancedFrequencyInfo}>
                <SafeIcon name="checkmark-circle" size={20} color={colors.success} />
                <Text style={styles.advancedFrequencyText}>
                  {getFrequencyLabel()}
                </Text>
                <TouchableOpacity onPress={() => setShowAdvancedModal(true)}>
                  <SafeIcon name="create-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Horário da Primeira Dose */}
          <View style={styles.field}>
            <Text style={styles.label}>Horário da primeira dose</Text>
            <TextInput
              style={styles.input}
              placeholder="08:00"
              value={firstDoseTime}
              onChangeText={setFirstDoseTime}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
              editable={true}
            />
            <Text style={styles.hint}>
              Formato: HH:MM (ex: 08:00, 14:30)
            </Text>
          </View>

          {/* Duração */}
          <View style={styles.field}>
            <Text style={styles.label}>Duração do tratamento</Text>
            <View style={styles.durationOptions}>
              <TouchableOpacity
                style={[
                  styles.durationButton,
                  durationType === 'continuo' && styles.durationButtonActive
                ]}
                onPress={() => setDurationType('continuo')}
              >
                <SafeIcon 
                  name="infinite" 
                  size={24} 
                  color={durationType === 'continuo' ? colors.primary : colors.textLight} 
                />
                <Text style={[
                  styles.durationButtonText,
                  durationType === 'continuo' && styles.durationButtonTextActive
                ]}>
                  Uso contínuo
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.durationButton,
                  durationType === 'temporario' && styles.durationButtonActive
                ]}
                onPress={() => setDurationType('temporario')}
              >
                <SafeIcon 
                  name="calendar-outline" 
                  size={24} 
                  color={durationType === 'temporario' ? colors.primary : colors.textLight} 
                />
                <Text style={[
                  styles.durationButtonText,
                  durationType === 'temporario' && styles.durationButtonTextActive
                ]}>
                  Prazo definido
                </Text>
              </TouchableOpacity>
            </View>
            {durationType === 'temporario' && (
              <TextInput
                style={[styles.input, { marginTop: 12 }]}
                placeholder="Número de dias"
                value={durationDays}
                onChangeText={setDurationDays}
                keyboardType="numeric"
              />
            )}
          </View>

          {/* Preview */}
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>📋 Resumo do cadastro</Text>
            <Text style={styles.previewText}>
              <Text style={styles.previewLabel}>Medicamento: </Text>
              {name || '—'}
            </Text>
            <Text style={styles.previewText}>
              <Text style={styles.previewLabel}>Concentração: </Text>
              {dosage} {unit} - {form}
            </Text>
            {doseQuantity && (
              <Text style={styles.previewText}>
                <Text style={styles.previewLabel}>Quantidade da dose: </Text>
                {doseQuantity} {doseQuantityUnit}
              </Text>
            )}
            <Text style={styles.previewText}>
              <Text style={styles.previewLabel}>Frequência: </Text>
              A cada {frequency} horas
            </Text>
            <Text style={styles.previewText}>
              <Text style={styles.previewLabel}>Horários: </Text>
              {generateSchedule(firstDoseTime, frequency).join(', ')}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <SafeIcon name="checkmark-circle" size={24} color={colors.textWhite} />
            <Text style={styles.saveButtonText}>
              {saving ? 'Salvando...' : 'Salvar Medicamento'}
            </Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>

      {/* Modal de Frequência Avançada */}
      <AdvancedFrequencyModal
        visible={showAdvancedModal}
        onClose={() => setShowAdvancedModal(false)}
        onConfirm={handleAdvancedFrequencyConfirm}
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
    alignItems: 'center',
    justifyContent: 'space-between',
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
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  form: {
    padding: 20,
  },
  field: {
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
  },
  searchingIndicator: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  selectedIndicator: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  inputFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  suggestionsContainer: {
    marginTop: 8,
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    maxHeight: 200,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  suggestionText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 12,
    flex: 1,
  },
  noResultsContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: colors.info + '10',
    borderRadius: 8,
  },
  noResultsText: {
    fontSize: 12,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 6,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chipSmall: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 14,
    color: colors.text,
  },
  chipTextActive: {
    color: colors.textWhite,
    fontWeight: '600',
  },
  frequencyContainer: {
    gap: 12,
  },
  frequencyButton: {
    backgroundColor: colors.backgroundLight,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
  },
  frequencyButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  frequencyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  frequencyButtonTextActive: {
    color: colors.primary,
  },
  frequencyButtonSubtext: {
    fontSize: 12,
    color: colors.textLight,
  },
  frequencyButtonSubtextActive: {
    color: colors.primary,
  },
  frequencyButtonAdvanced: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  advancedFrequencyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.success + '10',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  advancedFrequencyText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  durationOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  durationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.backgroundLight,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
  },
  durationButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  durationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
  },
  durationButtonTextActive: {
    color: colors.primary,
  },
  previewCard: {
    backgroundColor: colors.info + '10',
    borderWidth: 1,
    borderColor: colors.info + '40',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  previewText: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 6,
  },
  previewLabel: {
    fontWeight: '600',
    color: colors.info,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.primary,
    padding: 18,
    borderRadius: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textWhite,
  },
  prescriptionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.secondary + '15',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.secondary + '30',
  },
  prescriptionIndicatorText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.secondary,
    flex: 1,
  },
});

export default AddMedicationScreen;


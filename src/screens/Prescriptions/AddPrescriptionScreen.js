import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
  Pressable,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import colors from '../../constants/colors';
import SafeIcon from '../../components/SafeIcon';
import prescriptionService from '../../services/prescriptionService';
import doctorService from '../../services/doctorService';
import documentService from '../../services/documentService';
import Toast from 'react-native-toast-message';
import moment from 'moment';
import 'moment/locale/pt-br';
import AdvancedFrequencyModal from '../Medications/AdvancedFrequencyModal';
import MedicationAutocomplete from '../../components/MedicationAutocomplete';
import medicationSearchService from '../../services/medicationSearchService';
import { formatCrmDisplay } from '../../utils/crm';

moment.locale('pt-br');

// Cor azul pastel para componentes
const PASTEL_BLUE = '#93C5FD';

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

const AddPrescriptionScreen = ({ route, navigation }) => {
  const { groupId, groupName, prescriptionId, prescription: initialPrescription, isEditing } = route.params || {};
  const insets = useSafeAreaInsets();
  
  // Log inicial dos parâmetros
  console.log('📋 AddPrescriptionScreen - Parâmetros recebidos:', {
    groupId,
    groupName,
    prescriptionId,
    isEditing,
    hasInitialPrescription: !!initialPrescription,
    allParams: route.params
  });
  
  // Log detalhado do array de medicamentos se existir
  if (initialPrescription && initialPrescription.medications) {
    console.log('💊 AddPrescriptionScreen - Array de medicamentos do parâmetro prescription:');
    console.log('💊 Total de medicamentos:', initialPrescription.medications.length);
    initialPrescription.medications.forEach((med, index) => {
      console.log(`💊 Medicamento ${index + 1}:`, JSON.stringify(med, null, 2));
    });
    console.log('💊 Array completo de medicamentos:', JSON.stringify(initialPrescription.medications, null, 2));
  } else {
    console.log('💊 AddPrescriptionScreen - Nenhum medicamento encontrado no parâmetro prescription');
    console.log('💊 initialPrescription:', JSON.stringify(initialPrescription, null, 2));
  }
  
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingPrescription, setLoadingPrescription] = useState(false);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [prescriptionDate, setPrescriptionDate] = useState(moment().format('DD/MM/YYYY'));
  const [notes, setNotes] = useState('');
  const [prescriptionImage, setPrescriptionImage] = useState(null);
  
  // Log quando prescriptionImage mudar
  useEffect(() => {
    console.log('🖼️ prescriptionImage mudou:', prescriptionImage);
  }, [prescriptionImage]);
  
  // Estados para medicamentos (formulário completo)
  const [medications, setMedications] = useState([
    { 
      id: 1, 
      name: '', 
      isFarmaciaPopular: false,
      form: '',
      dosage: '',
      unit: 'mg',
      doseQuantity: '',
      doseQuantityUnit: '',
      administrationRoute: 'Oral',
      frequency: '24',
      firstDoseTime: '08:00',
      advancedFrequency: null,
      instructions: '',
      durationType: 'continuo',
      durationDays: '',
    }
  ]);
  
  const [saving, setSaving] = useState(false);
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [currentMedicationIndex, setCurrentMedicationIndex] = useState(0);
  
  // Estados para autocomplete de medicamentos
  const [medicationSuggestions, setMedicationSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef(null);
  
  // Estado para controlar expansão da lista de frequência por medicamento
  const [expandedFrequencies, setExpandedFrequencies] = useState({});
  
  // Estado para controlar expansão dos medicamentos (colapsar/expandir)
  const [expandedMedications, setExpandedMedications] = useState({});

  // Carregar médicos
  useEffect(() => {
    console.log('🔄 Carregando médicos para grupo:', groupId);
    loadDoctors();
  }, [groupId]);

  // Carregar dados da receita quando médicos terminarem de carregar
  // Se tiver prescriptionId, considerar como edição (mesmo se isEditing não estiver definido)
  useEffect(() => {
    const shouldLoad = prescriptionId && !loadingDoctors;
    
    console.log('🔍 useEffect - Verificando se deve carregar receita:', {
      isEditing,
      prescriptionId,
      loadingDoctors,
      doctorsCount: doctors.length,
      shouldLoad,
      routeParams: route.params
    });
    
    if (shouldLoad) {
      console.log('✅ Condições atendidas, carregando receita em 300ms...');
      // Aguardar um pouco para garantir que o estado foi atualizado
      const timer = setTimeout(() => {
        console.log('⏰ Timer executado, chamando loadPrescriptionData...');
        loadPrescriptionData();
      }, 300);
      return () => {
        console.log('🧹 Limpando timer');
        clearTimeout(timer);
      };
    } else {
      console.log('❌ Condições NÃO atendidas:', {
        hasPrescriptionId: !!prescriptionId,
        loadingDoctors,
        reason: !prescriptionId ? 'sem prescriptionId' : 'médicos ainda carregando'
      });
    }
  }, [prescriptionId, loadingDoctors, doctors.length]);

  const loadDoctors = async () => {
    try {
      setLoadingDoctors(true);
      const result = await doctorService.getDoctors(groupId);
      if (result.success && result.data) {
        setDoctors(result.data);
        // Selecionar o primeiro médico (assistente) se houver e não estiver editando
        if (!isEditing) {
          const primaryDoctor = result.data.find(d => d.is_primary);
          if (primaryDoctor) {
            setSelectedDoctor(primaryDoctor);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar médicos:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro ao carregar médicos',
        text2: error.message || 'Tente novamente',
      });
    } finally {
      setLoadingDoctors(false);
    }
  };

  const loadPrescriptionData = async () => {
    if (!prescriptionId) {
      console.log('⚠️ Não há prescriptionId para carregar');
      return;
    }
    
    try {
      setLoadingPrescription(true);
      console.log('📥 Buscando receita da API, ID:', prescriptionId);
      
      // SEMPRE buscar da API quando tiver prescriptionId
      const result = await prescriptionService.getPrescription(prescriptionId);
      console.log('📥 Resposta completa da API:', JSON.stringify(result, null, 2));
      
      if (!result.success || !result.data) {
        console.error('❌ Erro ao carregar receita:', result);
        Toast.show({
          type: 'error',
          text1: 'Erro ao carregar receita',
          text2: result.error || 'Tente novamente',
        });
        navigation.goBack();
        return;
      }

      const prescriptionData = result.data;
      console.log('🟡 AddPrescriptionScreen - Dados recebidos do backend (resumo):', {
        id: prescriptionData.id,
        doctor_id: prescriptionData.doctor_id,
        doctor_name: prescriptionData.doctor_name,
        image_url: prescriptionData.image_url,
        medications_count: prescriptionData.medications?.length || 0
      });
      console.log('🟡 AddPrescriptionScreen - Dados COMPLETOS do backend:', JSON.stringify(prescriptionData, null, 2));
      
      if (prescriptionData.medications && prescriptionData.medications.length > 0) {
        console.log('🟡 AddPrescriptionScreen - Primeiro medicamento (antes do mapeamento):', JSON.stringify(prescriptionData.medications[0], null, 2));
        console.log('🟡 AddPrescriptionScreen - Chaves do primeiro medicamento:', Object.keys(prescriptionData.medications[0]));
      }

      if (prescriptionData) {
        console.log('📋 Dados da receita carregados:', {
          id: prescriptionData.id,
          doctor_id: prescriptionData.doctor_id,
          doctor_name: prescriptionData.doctor_name,
          has_medications: !!prescriptionData.medications,
          medications_count: prescriptionData.medications?.length || 0
        });
        
        // Preencher dados da receita
        if (prescriptionData.prescription_date) {
          const date = moment(prescriptionData.prescription_date);
          setPrescriptionDate(date.format('DD/MM/YYYY'));
        }
        setNotes(prescriptionData.notes || '');
        
        // Carregar imagem da receita se existir
        console.log('🖼️ Carregando imagem da receita:', {
          has_image_url: !!prescriptionData.image_url,
          image_url_value: prescriptionData.image_url,
          image_url_type: typeof prescriptionData.image_url,
          has_image: !!prescriptionData.image,
          prescription_id: prescriptionData.id,
          all_keys: Object.keys(prescriptionData)
        });
        
        // Carregar imagem da receita se existir
        console.log('🖼️ DEBUG IMAGEM - Dados completos:', {
          image_url: prescriptionData.image_url,
          image_url_type: typeof prescriptionData.image_url,
          image_url_length: prescriptionData.image_url?.length,
          has_image: !!prescriptionData.image,
          all_keys: Object.keys(prescriptionData)
        });
        
        // Primeiro, tentar usar image_url direto se existir nos dados da receita
        if (prescriptionData.image_url || prescriptionData.image) {
          const imageUrl = prescriptionData.image_url || prescriptionData.image;
          console.log('📸 Imagem encontrada nos dados da receita:', imageUrl);
          console.log('📸 Tipo da URL:', typeof imageUrl);
          console.log('📸 URL é string?', typeof imageUrl === 'string');
          console.log('📸 URL não está vazia?', imageUrl && imageUrl.trim() !== '');
          
          if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '') {
            if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
              console.log('✅ Definindo imagem com URL completa:', imageUrl);
              setPrescriptionImage(imageUrl);
              console.log('✅ Imagem definida com URL completa');
            } else {
              const apiBaseUrl = require('../../config/api').default.BASE_URL;
              // Remover /api do final se existir
              const baseUrl = apiBaseUrl.replace(/\/api\/?$/, '');
              // Garantir que imageUrl comece com / se não começar
              const cleanImageUrl = imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl;
              const fullUrl = `${baseUrl}${cleanImageUrl}`;
              console.log('✅ URL completa construída:', fullUrl);
              console.log('✅ API Base URL original:', apiBaseUrl);
              console.log('✅ API Base URL limpo:', baseUrl);
              console.log('✅ Image URL original:', imageUrl);
              console.log('✅ Image URL limpo:', cleanImageUrl);
              setPrescriptionImage(fullUrl);
              console.log('✅ Imagem definida com URL construída');
            }
          } else {
            console.log('⚠️ image_url está vazio, null ou não é string:', {
              value: imageUrl,
              type: typeof imageUrl,
              isString: typeof imageUrl === 'string',
              isEmpty: !imageUrl || (typeof imageUrl === 'string' && imageUrl.trim() === '')
            });
          }
        } else {
          console.log('⚠️ Nenhuma imagem encontrada nos dados da receita');
          console.log('⚠️ prescriptionData.image_url:', prescriptionData.image_url);
          console.log('⚠️ prescriptionData.image:', prescriptionData.image);
          // Não tentar buscar em documentos - a tabela pode não existir
          // A imagem deve estar salva diretamente no campo image_url da receita
        }
        
        // Selecionar médico - ESTRATÉGIA SIMPLIFICADA
        // Usar setDoctors com callback para garantir que temos a lista mais recente
        setDoctors(currentDoctors => {
          if (prescriptionData.doctor_name || prescriptionData.doctor_id) {
            // Tentar encontrar na lista atual de médicos
            let foundDoctor = null;
            if (prescriptionData.doctor_id && currentDoctors.length > 0) {
              foundDoctor = currentDoctors.find(d => 
                String(d.id) === String(prescriptionData.doctor_id) || 
                Number(d.id) === Number(prescriptionData.doctor_id)
              );
            }
            
            if (foundDoctor) {
              console.log('✅ Médico encontrado:', foundDoctor.name);
              setSelectedDoctor(foundDoctor);
              return currentDoctors; // Não modificar a lista
            } else if (prescriptionData.doctor_name) {
              // Criar médico temporário com os dados da receita
              const tempDoctor = {
                id: prescriptionData.doctor_id || `temp_${prescriptionId}`,
                name: prescriptionData.doctor_name,
                crm: prescriptionData.doctor_crm || null,
                medical_specialty: prescriptionData.doctor_specialty ? { name: prescriptionData.doctor_specialty } : null,
                is_primary: false,
              };
              console.log('✅ Criando médico temporário:', tempDoctor.name);
              setSelectedDoctor(tempDoctor);
              // Adicionar à lista se não existir
              const exists = currentDoctors.some(d => String(d.id) === String(tempDoctor.id));
              return exists ? currentDoctors : [...currentDoctors, tempDoctor];
            }
          }
          return currentDoctors;
        });

        // Preencher medicamentos
        if (prescriptionData.medications && prescriptionData.medications.length > 0) {
          const loadedMedications = prescriptionData.medications.map((med, index) => {
            // Parsear frequency
            let frequency = '24';
            let advancedFrequency = null;
            
            if (med.frequency) {
              try {
                const freqData = typeof med.frequency === 'string' ? JSON.parse(med.frequency) : med.frequency;
                if (freqData.type === 'advanced') {
                  frequency = 'advanced';
                  advancedFrequency = freqData.details;
                } else if (freqData.details && freqData.details.interval) {
                  frequency = freqData.details.interval;
                }
              } catch (e) {
                console.error('Erro ao parsear frequency:', e);
              }
            }

            // Extrair firstDoseTime do time ou first_dose_at
            let firstDoseTime = '08:00';
            if (med.time) {
              const timeParts = med.time.split(':');
              if (timeParts.length >= 2) {
                firstDoseTime = `${timeParts[0]}:${timeParts[1]}`;
              }
            } else if (med.first_dose_at) {
              const dateTime = moment(med.first_dose_at);
              firstDoseTime = dateTime.format('HH:mm');
            }

            // Extrair durationType e durationDays
            let durationType = 'continuo';
            let durationDays = '';
            if (med.end_date) {
              durationType = 'temporario';
              const startDate = med.start_date ? moment(med.start_date) : moment();
              const endDate = moment(med.end_date);
              durationDays = endDate.diff(startDate, 'days').toString();
            }

            // Mapear todos os campos do backend para o frontend
            const mappedMed = {
              id: index + 1,
              name: med.name || '',
              isFarmaciaPopular: false,
              form: med.pharmaceutical_form || '',
              dosage: med.dosage || '',
              unit: med.unit || 'mg',
              doseQuantity: med.dose_quantity || '',
              doseQuantityUnit: med.dose_quantity_unit || '',
              administrationRoute: med.administration_route || 'Oral',
              frequency: frequency,
              firstDoseTime: firstDoseTime,
              advancedFrequency: advancedFrequency,
              instructions: med.instructions || '',
              durationType: durationType,
              durationDays: durationDays,
            };
            console.log(`🟡 AddPrescriptionScreen - Medicamento ${index + 1} (depois do mapeamento):`, JSON.stringify(mappedMed, null, 2));
            return mappedMed;
          });
          
          console.log('🟡 AddPrescriptionScreen - Todos os medicamentos mapeados:', JSON.stringify(loadedMedications, null, 2));
          
          setMedications(loadedMedications);
          
          // Inicializar todos os medicamentos como colapsados ao editar
          const collapsedState = {};
          loadedMedications.forEach(med => {
            collapsedState[med.id] = false; // false = colapsado
          });
          setExpandedMedications(collapsedState);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados da receita:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro ao carregar receita',
        text2: error.message || 'Tente novamente',
      });
      navigation.goBack();
    } finally {
      setLoadingPrescription(false);
    }
  };

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

  const handleDateChange = (value) => {
    const formatted = formatDateInput(value);
    setPrescriptionDate(formatted);
  };

  const filterDoctors = (doctorsList, query) => {
    if (!query || query.trim() === '') {
      return doctorsList;
    }
    const lowerQuery = query.toLowerCase().trim();
    return doctorsList.filter(doctor => {
      const nameMatch = doctor.name?.toLowerCase().includes(lowerQuery);
      const crmMatch = doctor.crm?.toLowerCase().includes(lowerQuery);
      const specialtyMatch = doctor.medical_specialty?.name?.toLowerCase().includes(lowerQuery);
      return nameMatch || crmMatch || specialtyMatch;
    });
  };

  const handleSelectDoctor = (doctor) => {
        setSelectedDoctor(doctor);
    setShowDoctorModal(false);
    setSearchQuery('');
  };

  const handleScanPrescription = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão Necessária', 'Precisamos de permissão para usar a câmera.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        aspect: [3, 4],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPrescriptionImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erro ao escanear receita:', error);
      Alert.alert('Erro', 'Não foi possível escanear a receita');
    }
  };

  const handlePickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão Necessária', 'Precisamos de permissão para acessar suas fotos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        aspect: [3, 4],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPrescriptionImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem');
    }
  };

  const handleRemovePrescription = () => {
    Alert.alert(
      'Remover Receita',
      'Deseja remover a foto da receita?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => setPrescriptionImage(null),
        },
      ]
    );
  };

  const handleAddMedication = () => {
    const newMedication = {
      id: Date.now(),
      name: '',
      isFarmaciaPopular: false,
      form: '',
      dosage: '',
      unit: 'mg',
      doseQuantity: '',
      doseQuantityUnit: '',
      administrationRoute: 'Oral',
      frequency: '24',
      firstDoseTime: '08:00',
      advancedFrequency: null,
      instructions: '',
      durationType: 'continuo',
      durationDays: '',
    };
    setMedications([...medications, newMedication]);
    // Novo medicamento começa expandido para facilitar preenchimento
    setExpandedMedications(prev => ({
      ...prev,
      [newMedication.id]: true
    }));
  };

  const handleRemoveMedication = (id) => {
    if (medications.length === 1) {
      Alert.alert('Atenção', 'A receita deve ter pelo menos um medicamento');
      return;
    }
    setMedications(medications.filter(med => med.id !== id));
  };

  const handleUpdateMedication = (id, field, value) => {
    setMedications(prevMedications => 
      prevMedications.map(med => 
      med.id === id ? { ...med, [field]: value } : med
      )
    );
  };

  const handleNameChange = async (text, medicationId) => {
    // Atualizar o nome do medicamento imediatamente
    setMedications(prevMedications => 
      prevMedications.map(med => {
        if (med.id === medicationId) {
          const isPopular = text.length >= 2 ? medicationSearchService.isFarmaciaPopular(text) : false;
          return { ...med, name: text, isFarmaciaPopular: isPopular };
        }
        return med;
      })
    );
    
    // Limpar timeout anterior
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Se o texto tiver menos de 2 caracteres, limpar sugestões
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

  const handleSelectMedication = (medication, medicationId) => {
    setMedications(prevMedications => 
      prevMedications.map(med => {
        if (med.id === medicationId) {
          const isPopular = medicationSearchService.isFarmaciaPopular(medication.name);
          return { ...med, name: medication.name, isFarmaciaPopular: isPopular };
        }
        return med;
      })
    );
    setMedicationSuggestions([]);
  };

  const handleFrequencyChange = (value, medicationId) => {
    if (value === 'advanced') {
      setMedications(prevMedications => {
        const index = prevMedications.findIndex(m => m.id === medicationId);
        setCurrentMedicationIndex(index);
        return prevMedications;
      });
      setShowAdvancedModal(true);
    } else {
      setMedications(prevMedications => 
        prevMedications.map(med => 
          med.id === medicationId 
            ? { ...med, frequency: value, advancedFrequency: null }
            : med
        )
      );
    }
  };

  const handleAdvancedFrequencyConfirm = (config) => {
    setMedications(prevMedications => {
      const medication = prevMedications[currentMedicationIndex];
      if (medication) {
        return prevMedications.map((med, index) => 
          index === currentMedicationIndex
            ? { ...med, advancedFrequency: config, frequency: 'advanced' }
            : med
        );
      }
      return prevMedications;
    });
    setShowAdvancedModal(false);
  };

  const getFrequencyLabel = (medication) => {
    if (medication.frequency === 'advanced' && medication.advancedFrequency) {
      switch (medication.advancedFrequency.type) {
        case 'alternating':
          return 'Dias intercalados';
        case 'specific_days':
          return `Dias específicos (${medication.advancedFrequency.weekdays.length} dias/semana)`;
        case 'cycles':
          return `Ciclos (${medication.advancedFrequency.cycleDays} dias on, ${medication.advancedFrequency.pauseDays} dias off)`;
        case 'every_n_days':
          return `A cada ${medication.advancedFrequency.interval} dias`;
        case 'every_n_weeks':
          return `A cada ${medication.advancedFrequency.interval} semanas`;
        case 'every_n_months':
          return `A cada ${medication.advancedFrequency.interval} meses`;
        default:
          return 'Frequência personalizada';
      }
    }
    const freq = FREQUENCIES.find(f => f.value === medication.frequency);
    return freq ? freq.label : 'Frequência personalizada';
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

  const handleSave = async () => {
    // Verificar se o médico está selecionado (pode ser objeto temporário ou da lista)
    if (!selectedDoctor || !selectedDoctor.id) {
      Alert.alert('Erro', 'Selecione um médico');
      return;
    }

    const validMedications = medications.filter(med => med.name.trim());
    if (validMedications.length === 0) {
      Alert.alert('Erro', 'Adicione pelo menos um medicamento');
      return;
    }

    // Validação detalhada de cada medicamento
    for (let i = 0; i < validMedications.length; i++) {
      const med = validMedications[i];
      const medNumber = i + 1;
      
      if (!med.name || !med.name.trim()) {
        Alert.alert('Erro', `Medicamento ${medNumber}: Preencha o nome do medicamento`);
        return;
      }
      if (!med.administrationRoute) {
        Alert.alert('Erro', `Medicamento ${medNumber}: Selecione a via de administração`);
        return;
      }
      if (!med.form || !med.form.trim()) {
        Alert.alert('Erro', `Medicamento ${medNumber}: Selecione a forma farmacêutica`);
        return;
      }
      if (!med.dosage || !med.dosage.trim()) {
        Alert.alert('Erro', `Medicamento ${medNumber}: Digite a concentração`);
        return;
      }
      if (!med.unit) {
        Alert.alert('Erro', `Medicamento ${medNumber}: Selecione a unidade de concentração`);
        return;
      }
      if (!med.doseQuantity || !med.doseQuantity.trim()) {
        Alert.alert('Erro', `Medicamento ${medNumber}: Digite a quantidade da dose`);
        return;
      }
      if (!med.frequency) {
        Alert.alert('Erro', `Medicamento ${medNumber}: Selecione a frequência de administração`);
        return;
      }
      if (med.frequency === 'advanced' && !med.advancedFrequency) {
        Alert.alert('Erro', `Medicamento ${medNumber}: Configure a frequência avançada`);
        return;
      }
      if (!med.firstDoseTime || !med.firstDoseTime.trim()) {
        Alert.alert('Erro', `Medicamento ${medNumber}: Digite o horário da primeira dose`);
        return;
      }
      if (med.durationType === 'temporario' && (!med.durationDays || !med.durationDays.trim())) {
        Alert.alert('Erro', `Medicamento ${medNumber}: Digite o número de dias para duração temporária`);
        return;
      }
    }

    try {
      setSaving(true);
      
      // Converter data de dd/mm/yyyy para yyyy-mm-dd
      let formattedDate = prescriptionDate;
      if (prescriptionDate.includes('/')) {
        const [day, month, year] = prescriptionDate.split('/');
        if (day && month && year && year.length === 4) {
          formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        } else {
          Alert.alert('Erro', 'Data inválida. Use o formato dd/mm/aaaa');
          setSaving(false);
          return;
        }
      }
      
      // Processar imagem se existir
      let imageUrl = null;
      if (prescriptionImage) {
        console.log('📸 Processando imagem da receita:', {
          hasImage: !!prescriptionImage,
          imageUri: prescriptionImage,
          isLocal: prescriptionImage.startsWith('file://') || prescriptionImage.startsWith('content://'),
          isRemote: prescriptionImage.startsWith('http://') || prescriptionImage.startsWith('https://')
        });
        
        // Se for URL local (file:// ou content://), fazer upload primeiro
        if (prescriptionImage.startsWith('file://') || prescriptionImage.startsWith('content://')) {
          try {
            console.log('📸 Fazendo upload da imagem da receita...');
            const formData = new FormData();
            const filename = prescriptionImage.split('/').pop() || `receita_${Date.now()}.jpg`;
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';
            
            formData.append('file', {
              uri: prescriptionImage,
              type: type,
              name: filename,
            });
            formData.append('group_id', groupId.toString());
            formData.append('type', 'prescription');
            formData.append('title', `Receita - ${selectedDoctor.name || 'Médico'}`);
            formData.append('document_date', formattedDate);
            if (selectedDoctor.id) {
              formData.append('doctor_id', selectedDoctor.id.toString());
            }
            
            console.log('📸 Enviando FormData para upload...');
            const uploadResult = await documentService.uploadDocument(formData);
            console.log('📸 Upload result completo:', JSON.stringify(uploadResult, null, 2));
            console.log('📸 Upload result type:', typeof uploadResult);
            console.log('📸 Upload result.success:', uploadResult?.success);
            console.log('📸 Upload result.data:', uploadResult?.data);
            console.log('📸 Upload result.data.file_path:', uploadResult?.data?.file_path);
            
            // O backend retorna { success: true, data: { file_path: '...', ... } }
            if (uploadResult?.success && uploadResult?.data) {
              let filePath = uploadResult.data.file_path;
              
              if (filePath) {
                const apiBaseUrl = require('../../config/api').default.BASE_URL;
                console.log('📸 API Base URL:', apiBaseUrl);
                console.log('📸 File path do backend:', filePath);
                
                // Construir URL completa
                if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
                  imageUrl = filePath;
                  console.log('✅ URL já é completa:', imageUrl);
                } else {
                  // Remover /api do final se existir
                  const baseUrl = apiBaseUrl.replace(/\/api\/?$/, '');
                  // Se filePath já começa com /storage, usar diretamente, senão adicionar
                  // O backend retorna file_path como "documents/abc123.jpg" ou "storage/documents/abc123.jpg"
                  let cleanPath = filePath;
                  if (!filePath.startsWith('/storage/') && !filePath.startsWith('storage/')) {
                    cleanPath = `storage/${filePath}`;
                  } else if (filePath.startsWith('storage/')) {
                    cleanPath = `/${filePath}`;
                  }
                  imageUrl = `${baseUrl}${cleanPath}`;
                  console.log('✅ URL construída:', imageUrl);
                }
                console.log('✅ Imagem da receita enviada, URL final:', imageUrl);
              } else {
                console.warn('⚠️ Upload realizado mas file_path está vazio/null:', {
                  uploadResult,
                  data: uploadResult?.data,
                  file_path: uploadResult?.data?.file_path
                });
              }
            } else {
              console.error('❌ Upload falhou ou resposta inválida:', uploadResult);
            }
          } catch (uploadError) {
            console.error('❌ Erro ao fazer upload da imagem:', uploadError);
            console.error('❌ Erro completo:', JSON.stringify(uploadError, null, 2));
            // Continuar sem imagem se o upload falhar
          }
        } else if (prescriptionImage.startsWith('http://') || prescriptionImage.startsWith('https://')) {
          // Já é uma URL remota, usar diretamente
          imageUrl = prescriptionImage;
          console.log('📸 Usando URL de imagem existente:', imageUrl);
        } else {
          console.warn('⚠️ Imagem não é local nem remota, usando como está:', prescriptionImage);
          imageUrl = prescriptionImage;
        }
      } else {
        console.log('📸 Nenhuma imagem para processar');
      }
      
      console.log('📸 imageUrl final antes de salvar:', imageUrl);
      
      const prescriptionData = {
        groupId,
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        doctorSpecialty: selectedDoctor.medical_specialty?.name || selectedDoctor.specialty || null,
        doctorCrm: selectedDoctor.crm || null,
        prescriptionDate: formattedDate,
        notes: notes.trim() || null,
        imageUrl: imageUrl,
        medications: validMedications.map(med => {
          const schedule = generateSchedule(med.firstDoseTime, med.frequency);
          return {
          name: med.name.trim(),
            form: med.form.trim(),
            dosage: med.dosage.trim(),
            unit: med.unit,
            doseQuantity: med.doseQuantity.trim() || null,
            doseQuantityUnit: med.doseQuantityUnit,
            administrationRoute: med.administrationRoute,
            frequencyType: med.frequency === 'advanced' ? 'advanced' : 'simple',
            frequencyDetails: med.frequency === 'advanced' 
              ? JSON.stringify(med.advancedFrequency) 
              : JSON.stringify({ interval: med.frequency, schedule }),
            firstDoseAt: `${formattedDate} ${med.firstDoseTime}:00`,
            durationType: med.durationType,
            durationValue: med.durationType === 'temporario' ? parseInt(med.durationDays) : null,
          instructions: med.instructions.trim() || null,
          notes: null,
          };
        }),
      };

      const result = isEditing && prescriptionId
        ? await prescriptionService.updatePrescription(prescriptionId, prescriptionData)
        : await prescriptionService.createPrescription(prescriptionData);
      
      if (result.success) {
        Toast.show({
          type: 'success',
          text1: isEditing ? 'Receita atualizada' : 'Receita criada',
          text2: isEditing ? 'A receita foi atualizada com sucesso' : 'A receita foi cadastrada com sucesso',
          position: 'bottom',
        });
        navigation.navigate('Prescriptions', { groupId, groupName });
      } else {
        // Mostrar erro específico
        const errorMessage = result.error || 'Não foi possível criar a receita';
        console.error('Erro ao criar receita:', errorMessage);
        console.error('Detalhes do erro:', result.details);
        
        Alert.alert(
          'Erro ao criar receita',
          errorMessage,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Erro ao criar receita:', error);
      console.error('Erro completo:', JSON.stringify(error, null, 2));
      
      // Tentar extrair mensagem de erro mais específica
      let errorMessage = 'Não foi possível criar a receita';
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const errorMessages = [];
        Object.keys(errors).forEach(field => {
          const fieldErrors = Array.isArray(errors[field]) ? errors[field] : [errors[field]];
          fieldErrors.forEach(err => {
            const fieldName = field
              .replace('medications.', 'Medicamento ')
              .replace('.frequency', ' - Frequência')
              .replace('.name', ' - Nome')
              .replace('.dosage', ' - Dosagem');
            errorMessages.push(`${fieldName}: ${err}`);
          });
        });
        if (errorMessages.length > 0) {
          errorMessage = errorMessages.join('\n');
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert('Erro ao criar receita', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const filteredDoctors = filterDoctors(doctors, searchQuery);

  if (loadingPrescription) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PASTEL_BLUE} />
          <Text style={styles.loadingText}>Carregando receita...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <SafeIcon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.title}>{isEditing ? 'Editar Receita' : 'Nova Receita'}</Text>
          <Text style={styles.subtitle}>{groupName}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Seção de Foto da Receita - NO TOPO */}
        <View style={styles.prescriptionSection}>
          <Text style={styles.prescriptionTitle}>Foto da Receita</Text>
          <Text style={styles.prescriptionSubtitle}>
            Tire uma foto da receita médica ou selecione da galeria (opcional)
          </Text>
          
          {prescriptionImage ? (
            <View style={styles.prescriptionImageContainer}>
              <Image 
                source={{ uri: prescriptionImage }} 
                style={styles.prescriptionImage}
                resizeMode="contain"
                onLoad={() => console.log('✅ Imagem carregada com sucesso:', prescriptionImage)}
                onError={(error) => {
                  console.error('❌ Erro ao carregar imagem:', error.nativeEvent.error);
                  console.error('❌ URI da imagem:', prescriptionImage);
                }}
              />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={handleRemovePrescription}
              >
                <SafeIcon name="close-circle" size={24} color={colors.error} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.scanButtonsContainer}>
              <TouchableOpacity
                style={[styles.scanButton, styles.scanButtonPrimary]}
                onPress={handleScanPrescription}
              >
                <SafeIcon name="camera" size={24} color={PASTEL_BLUE} />
                <Text style={styles.scanButtonText}>Tirar Foto</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.scanButton, styles.scanButtonSecondary]}
                onPress={handlePickFromGallery}
              >
                <SafeIcon name="images" size={24} color={colors.secondary} />
                <Text style={[styles.scanButtonText, { color: colors.secondary }]}>
                  Galeria
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Data e Hora */}
        <View style={styles.dateTimeContainer}>
          <Text style={styles.dateTimeLabel}>Data e Hora</Text>
          <Text style={styles.dateTimeValue}>
            {moment().format('DD/MM/YYYY [às] HH:mm')}
          </Text>
        </View>

        {/* Seleção de Médico */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Médico *</Text>
          <TouchableOpacity
            style={styles.doctorSelector}
            onPress={() => setShowDoctorModal(true)}
            disabled={loadingDoctors}
          >
            {loadingDoctors ? (
              <ActivityIndicator size="small" color={PASTEL_BLUE} />
            ) : selectedDoctor ? (
              <View style={styles.selectedDoctor}>
                <View style={styles.doctorInfo}>
                  <Text style={styles.doctorName}>{selectedDoctor.name}</Text>
                  {selectedDoctor.medical_specialty?.name && (
                    <Text style={styles.doctorSpecialty}>
                      {selectedDoctor.medical_specialty.name}
                    </Text>
                  )}
                  {selectedDoctor.crm && (
                    <Text style={styles.doctorCrm}>CRM: {selectedDoctor.crm}</Text>
                  )}
                </View>
                {selectedDoctor.is_primary && (
                  <View style={styles.primaryBadge}>
                    <SafeIcon name="star" size={16} color="#FFFFFF" />
                    <Text style={styles.primaryBadgeText}>Assistente</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.selectDoctorPlaceholder}>
                <SafeIcon name="person-add" size={24} color={colors.gray400} />
                <Text style={styles.selectDoctorText}>Selecione um médico</Text>
              </View>
            )}
            <SafeIcon name="chevron-forward" size={24} color={colors.gray400} />
          </TouchableOpacity>
        </View>

        {/* Data da Receita */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data da Receita *</Text>
          <TextInput
            style={styles.input}
            value={prescriptionDate}
            onChangeText={handleDateChange}
            placeholder="dd/mm/aaaa"
            placeholderTextColor={colors.gray400}
            keyboardType="numeric"
            maxLength={10}
          />
        </View>

        {/* Observações */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Observações</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Observações gerais da receita (opcional)"
            placeholderTextColor={colors.gray400}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Medicamentos */}
        <View style={styles.section}>
          <View style={styles.medicationsHeader}>
            <Text style={styles.sectionTitle}>Medicamentos *</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddMedication}
            >
              <SafeIcon name="add" size={20} color={PASTEL_BLUE} />
              <Text style={styles.addButtonText}>Adicionar</Text>
            </TouchableOpacity>
          </View>

          {medications.map((medication, index) => {
            const isExpanded = expandedMedications[medication.id] !== false;
            const medicationName = medication.name || 'Sem nome';
            
            return (
              <View key={medication.id} style={styles.medicationCard}>
                {/* Header clicável para expandir/colapsar */}
                <TouchableOpacity
                  style={styles.medicationHeader}
                  onPress={() => {
                    setExpandedMedications(prev => ({
                      ...prev,
                      [medication.id]: !isExpanded
                    }));
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.medicationNumber}>
                    <Text style={styles.medicationNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.medicationCardTitle}>
                    Medicamento {index + 1} {medicationName !== 'Sem nome' ? medicationName : ''}
                  </Text>
                  <View style={styles.medicationHeaderActions}>
                    {medications.length > 1 && (
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleRemoveMedication(medication.id);
                        }}
                      >
                        <SafeIcon name="close-circle" size={24} color={colors.error} />
                      </TouchableOpacity>
                    )}
                    <SafeIcon 
                      name={isExpanded ? "chevron-up" : "chevron-down"} 
                      size={24} 
                      color={colors.gray400} 
                    />
                  </View>
                </TouchableOpacity>

                {/* Campos do medicamento - só mostrar se expandido */}
                {isExpanded && (
                  <View style={styles.medicationFields}>
                {/* Nome do Medicamento */}
                <View style={styles.field}>
                  <Text style={styles.label}>Nome do medicamento *</Text>
                  <MedicationAutocomplete
                    value={medication.name}
                    onChangeText={(text) => handleNameChange(text, medication.id)}
                    onSelect={(med) => handleSelectMedication(med, medication.id)}
                    suggestions={medicationSuggestions}
                    placeholder="Ex: Losartana"
                    isLoading={isSearching}
                    showPrice={false}
                    isFarmaciaPopular={medication.isFarmaciaPopular}
                  />
                </View>

                {/* Via de Administração */}
                <View style={styles.field}>
                  <Text style={styles.label}>Via de administração *</Text>
                  <View style={styles.chipContainer}>
                    {Object.keys(MEDICATION_STRUCTURE).map((route) => (
                      <TouchableOpacity
                        key={route}
                        style={[styles.chip, medication.administrationRoute === route && styles.chipActive]}
                        onPress={() => {
                          setMedications(prevMedications => 
                            prevMedications.map(med => 
                              med.id === medication.id 
                                ? { ...med, administrationRoute: route, form: '', doseQuantityUnit: '' }
                                : med
                            )
                          );
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.chipText, medication.administrationRoute === route && styles.chipTextActive]}>
                          {route}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Forma Farmacêutica */}
                <View style={styles.field}>
                  <Text style={styles.label}>Forma farmacêutica *</Text>
                  {medication.administrationRoute ? (
                    <View style={styles.chipContainer}>
                      {MEDICATION_STRUCTURE[medication.administrationRoute]?.forms.map((formItem) => (
                        <TouchableOpacity
                          key={formItem.name}
                          style={[styles.chip, medication.form === formItem.name && styles.chipActive]}
                          onPress={() => {
                            setMedications(prevMedications => 
                              prevMedications.map(med => 
                                med.id === medication.id 
                                  ? { ...med, form: formItem.name, doseQuantityUnit: formItem.unit }
                                  : med
                              )
                            );
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.chipText, medication.form === formItem.name && styles.chipTextActive]}>
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
                    value={medication.dosage}
                    onChangeText={(value) => handleUpdateMedication(medication.id, 'dosage', value)}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={[styles.field, { flex: 1 }]}>
                    <Text style={styles.label}>Unidade *</Text>
                    <View style={styles.chipContainer}>
                      {CONCENTRATION_UNITS.map((item) => (
                        <TouchableOpacity
                          key={item}
                          style={[styles.chip, styles.chipSmall, medication.unit === item && styles.chipActive]}
                          onPress={() => handleUpdateMedication(medication.id, 'unit', item)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.chipText, medication.unit === item && styles.chipTextActive]}>
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
                      value={medication.doseQuantity}
                      onChangeText={(value) => handleUpdateMedication(medication.id, 'doseQuantity', value)}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={[styles.field, { flex: 1 }]}>
                    <Text style={styles.label}>Unidade da dose</Text>
                    {medication.form && medication.administrationRoute ? (
                      <View style={styles.chipContainer}>
                        {(() => {
                          const selectedForm = MEDICATION_STRUCTURE[medication.administrationRoute]?.forms.find(f => f.name === medication.form);
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
                    value={medication.instructions}
                    onChangeText={(value) => handleUpdateMedication(medication.id, 'instructions', value)}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                {/* Frequência */}
                <View style={styles.field}>
                  <Text style={styles.label}>Frequência *</Text>
                  
                  {!expandedFrequencies[medication.id] ? (
                    // Estado colapsado - mostrar apenas o botão selecionado ou um botão para expandir
                    <TouchableOpacity
                      style={[
                        styles.frequencyButton,
                        medication.frequency && styles.frequencyButtonActive,
                        styles.frequencyButtonCollapsed
                      ]}
                      onPress={() => {
                        setExpandedFrequencies(prev => ({
                          ...prev,
                          [medication.id]: true
                        }));
                      }}
                    >
                      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        {medication.frequency ? (
                          (() => {
                            const selectedFreq = FREQUENCIES.find(f => f.value === medication.frequency);
                            return selectedFreq ? (
                              <>
                                {selectedFreq.icon && (
                                  <SafeIcon 
                                    name={selectedFreq.icon} 
                                    size={20} 
                                    color={PASTEL_BLUE} 
                                  />
                                )}
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.frequencyButtonTextActive}>
                                    {selectedFreq.label}
                                  </Text>
                                  {selectedFreq.times !== null && (
                                    <Text style={styles.frequencyButtonSubtextActive}>
                                      {selectedFreq.times}x por dia
                                    </Text>
                                  )}
              </View>
                              </>
                            ) : (
                              <Text style={styles.frequencyButtonText}>Selecione a frequência</Text>
                            );
                          })()
                        ) : (
                          <Text style={styles.frequencyButtonText}>Selecione a frequência</Text>
                        )}
            </View>
                      <SafeIcon name="chevron-down" size={20} color={medication.frequency ? PASTEL_BLUE : colors.textLight} />
                    </TouchableOpacity>
                  ) : (
                    // Estado expandido - mostrar todas as opções
                    <View style={styles.frequencyContainer}>
                      {FREQUENCIES.map((item) => (
                        <TouchableOpacity
                          key={item.value}
                          style={[
                            styles.frequencyButton,
                            medication.frequency === item.value && styles.frequencyButtonActive,
                            item.value === 'advanced' && styles.frequencyButtonAdvanced
                          ]}
                          onPress={() => {
                            handleFrequencyChange(item.value, medication.id);
                            // Colapsar após seleção
                            setExpandedFrequencies(prev => ({
                              ...prev,
                              [medication.id]: false
                            }));
                          }}
                        >
                          {item.icon && (
                            <SafeIcon 
                              name={item.icon} 
                              size={20} 
                              color={medication.frequency === item.value ? PASTEL_BLUE : colors.textLight} 
                            />
                          )}
                          <Text style={[
                            styles.frequencyButtonText,
                            medication.frequency === item.value && styles.frequencyButtonTextActive
                          ]}>
                            {item.label}
                          </Text>
                          {item.times !== null && (
                            <Text style={[
                              styles.frequencyButtonSubtext,
                              medication.frequency === item.value && styles.frequencyButtonSubtextActive
                            ]}>
                              {item.times}x por dia
                            </Text>
                          )}
                        </TouchableOpacity>
                      ))}
                      {/* Botão para colapsar */}
                      <TouchableOpacity
                        style={[styles.frequencyButton, { borderStyle: 'dashed' }]}
                        onPress={() => {
                          setExpandedFrequencies(prev => ({
                            ...prev,
                            [medication.id]: false
                          }));
                        }}
                      >
                        <SafeIcon name="chevron-up" size={20} color={colors.textLight} />
                        <Text style={styles.frequencyButtonText}>Fechar</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  
                  {medication.frequency === 'advanced' && medication.advancedFrequency && (
                    <View style={styles.advancedFrequencyInfo}>
                      <SafeIcon name="checkmark-circle" size={20} color={colors.success} />
                      <Text style={styles.advancedFrequencyText}>
                        {getFrequencyLabel(medication)}
                      </Text>
                      <TouchableOpacity onPress={() => {
                        setCurrentMedicationIndex(index);
                        setShowAdvancedModal(true);
                      }}>
                        <SafeIcon name="create-outline" size={20} color={PASTEL_BLUE} />
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
                    value={medication.firstDoseTime}
                    onChangeText={(value) => handleUpdateMedication(medication.id, 'firstDoseTime', value)}
                    keyboardType="numbers-and-punctuation"
                    maxLength={5}
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
                        medication.durationType === 'continuo' && styles.durationButtonActive
                      ]}
                      onPress={() => handleUpdateMedication(medication.id, 'durationType', 'continuo')}
                    >
                      <SafeIcon 
                        name="infinite" 
                        size={24} 
                        color={medication.durationType === 'continuo' ? PASTEL_BLUE : colors.textLight} 
                      />
                      <Text style={[
                        styles.durationButtonText,
                        medication.durationType === 'continuo' && styles.durationButtonTextActive
                      ]}>
                        Uso contínuo
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.durationButton,
                        medication.durationType === 'temporario' && styles.durationButtonActive
                      ]}
                      onPress={() => handleUpdateMedication(medication.id, 'durationType', 'temporario')}
                    >
                      <SafeIcon 
                        name="calendar-outline" 
                        size={24} 
                        color={medication.durationType === 'temporario' ? PASTEL_BLUE : colors.textLight} 
                      />
                      <Text style={[
                        styles.durationButtonText,
                        medication.durationType === 'temporario' && styles.durationButtonTextActive
                      ]}>
                        Prazo definido
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {medication.durationType === 'temporario' && (
                    <TextInput
                      style={[styles.input, { marginTop: 12 }]}
                      placeholder="Número de dias"
                      value={medication.durationDays}
                      onChangeText={(value) => handleUpdateMedication(medication.id, 'durationDays', value)}
                      keyboardType="numeric"
                    />
                  )}
                </View>

                {/* Preview */}
                <View style={styles.previewCard}>
                  <Text style={styles.previewTitle}>📋 Resumo do medicamento {index + 1}</Text>
                  <Text style={styles.previewText}>
                    <Text style={styles.previewLabel}>Medicamento: </Text>
                    {medication.name || '—'}
                  </Text>
                  {medication.dosage && medication.unit && medication.form && (
                    <Text style={styles.previewText}>
                      <Text style={styles.previewLabel}>Concentração: </Text>
                      {medication.dosage} {medication.unit} - {medication.form}
                    </Text>
                  )}
                  {medication.doseQuantity && (
                    <Text style={styles.previewText}>
                      <Text style={styles.previewLabel}>Quantidade da dose: </Text>
                      {medication.doseQuantity} {medication.doseQuantityUnit}
                    </Text>
                  )}
                  <Text style={styles.previewText}>
                    <Text style={styles.previewLabel}>Frequência: </Text>
                    {medication.frequency === 'advanced' 
                      ? getFrequencyLabel(medication)
                      : `A cada ${medication.frequency} horas`}
                  </Text>
                  {medication.frequency !== 'advanced' && (
                    <Text style={styles.previewText}>
                      <Text style={styles.previewLabel}>Horários: </Text>
                      {generateSchedule(medication.firstDoseTime, medication.frequency).join(', ')}
                    </Text>
                  )}
                </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Botão Salvar */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <>
              <SafeIcon name="checkmark-circle" size={24} color={colors.white} />
              <Text style={styles.saveButtonText}>Gravar Receita</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Modal de Seleção de Médico */}
      <Modal
        visible={showDoctorModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDoctorModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowDoctorModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecionar Médico</Text>
              <TouchableOpacity
                onPress={() => setShowDoctorModal(false)}
                style={styles.modalCloseButton}
              >
                <SafeIcon name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Campo de Busca */}
            <View style={styles.searchContainer}>
              <SafeIcon name="search" size={20} color={colors.textLight} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar por nome, CRM ou especialidade..."
                placeholderTextColor={colors.textLight}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  style={styles.clearButton}
                >
                  <SafeIcon name="close-circle" size={20} color={colors.textLight} />
                </TouchableOpacity>
              )}
            </View>

            {/* Lista de Médicos */}
            <ScrollView style={styles.modalScrollView}>
              {filteredDoctors.length > 0 ? (
                filteredDoctors.map((doctor) => (
                  <TouchableOpacity
                    key={doctor.id}
                    style={[styles.doctorCard, doctor.is_primary && styles.doctorCardPrimary]}
                    onPress={() => handleSelectDoctor(doctor)}
                  >
                    <View style={styles.doctorIcon}>
                      <SafeIcon name="medical" size={32} color={doctor.is_primary ? PASTEL_BLUE : colors.secondary} />
                    </View>
                    <View style={styles.doctorInfo}>
                      <View style={styles.doctorNameRow}>
                        <Text style={[styles.doctorName, doctor.is_primary && styles.doctorNamePrimary]}>
                          {doctor.name}
                        </Text>
                        {doctor.is_primary && (
                          <View style={styles.primaryBadge}>
                            <SafeIcon name="star" size={14} color="#FFFFFF" />
                            <Text style={styles.primaryBadgeText}>Assistente</Text>
                          </View>
                        )}
                      </View>
                      {doctor.medical_specialty?.name && (
                        <Text style={styles.doctorSpecialty}>{doctor.medical_specialty.name}</Text>
                      )}
                      {doctor.crm && (
                        <Text style={styles.doctorCrm}>CRM: {formatCrmDisplay(doctor.crm)}</Text>
                      )}
                    </View>
                    <SafeIcon name="chevron-forward" size={24} color={colors.gray400} />
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <SafeIcon name="medical-outline" size={64} color={colors.gray300} />
                  <Text style={styles.emptyText}>Nenhum médico encontrado</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

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
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
    color: colors.gray400,
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textLight,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  prescriptionSection: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  prescriptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  prescriptionSubtitle: {
    fontSize: 14,
    color: colors.gray400,
    marginBottom: 16,
  },
  scanButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  scanButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  scanButtonPrimary: {
    backgroundColor: PASTEL_BLUE + '20',
    borderColor: PASTEL_BLUE,
  },
  scanButtonSecondary: {
    backgroundColor: colors.secondary + '10',
    borderColor: colors.secondary,
  },
  scanButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: PASTEL_BLUE,
  },
  prescriptionImageContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  prescriptionImage: {
    width: '100%',
    height: 300,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.background,
    borderRadius: 20,
    padding: 4,
  },
  dateTimeContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  dateTimeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray600,
    marginBottom: 8,
  },
  dateTimeValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  doctorSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  selectedDoctor: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  doctorSpecialty: {
    fontSize: 14,
    color: colors.gray600,
    marginBottom: 2,
  },
  doctorCrm: {
    fontSize: 12,
    color: colors.gray400,
  },
  primaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#93C5FD', // Azul pastel
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  primaryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF', // Fonte branca para destacar
    marginLeft: 4,
  },
  selectDoctorPlaceholder: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectDoctorText: {
    fontSize: 16,
    color: colors.gray400,
    marginLeft: 8,
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
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  medicationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PASTEL_BLUE + '20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: PASTEL_BLUE,
    marginLeft: 6,
  },
  medicationCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  medicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  medicationHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  medicationNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: PASTEL_BLUE + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  medicationNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: PASTEL_BLUE,
  },
  medicationCardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  removeButton: {
    padding: 4,
  },
  medicationFields: {
    gap: 16,
  },
  field: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    color: colors.gray400,
    marginTop: 6,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    zIndex: 1,
  },
  chip: {
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipSmall: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipActive: {
    backgroundColor: PASTEL_BLUE,
    borderColor: PASTEL_BLUE,
  },
  chipText: {
    fontSize: 14,
    color: colors.text,
  },
  chipTextActive: {
    color: colors.white,
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
  frequencyButtonCollapsed: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  frequencyButtonActive: {
    borderColor: PASTEL_BLUE,
    backgroundColor: PASTEL_BLUE + '20',
  },
  frequencyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  frequencyButtonTextActive: {
    color: PASTEL_BLUE,
  },
  frequencyButtonSubtext: {
    fontSize: 12,
    color: colors.textLight,
  },
  frequencyButtonSubtextActive: {
    color: PASTEL_BLUE,
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
    borderColor: PASTEL_BLUE,
    backgroundColor: PASTEL_BLUE + '20',
  },
  durationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
  },
  durationButtonTextActive: {
    color: PASTEL_BLUE,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PASTEL_BLUE,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  // Modal styles
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
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
    minHeight: 200,
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    margin: 20,
    marginBottom: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    paddingVertical: 0,
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  modalScrollView: {
    maxHeight: 400,
    paddingHorizontal: 20,
  },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  doctorCardPrimary: {
    backgroundColor: PASTEL_BLUE + '15',
    borderColor: PASTEL_BLUE + '40',
    borderWidth: 1.5,
  },
  doctorIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.secondary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  doctorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  doctorNamePrimary: {
    color: PASTEL_BLUE,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 12,
  },
  previewCard: {
    backgroundColor: colors.info + '10',
    borderWidth: 1,
    borderColor: colors.info + '40',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
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
});

export default AddPrescriptionScreen;

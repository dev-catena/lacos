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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import Toast from 'react-native-toast-message';
import colors from '../../constants/colors';
import { AppointmentIcon, LocationIcon } from '../../components/CustomIcons';
import appointmentService from '../../services/appointmentService';
import doctorService from '../../services/doctorService';
import medicalSpecialtyService from '../../services/medicalSpecialtyService';
import GOOGLE_MAPS_CONFIG from '../../config/maps';
import { checkGoogleMapsConfig } from '../../utils/checkGoogleMapsConfig';

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
        setSpecialties(response.data);
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

  const handleDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      updateField('date', date.toISOString());
    }
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
      const appointmentData = {
        group_id: parseInt(groupId), // Converter para número
        title: formData.title.trim(),
        type: formData.type, // ADICIONADO: tipo do compromisso
        description: formData.notes.trim() || null,
        scheduled_at: formData.date,
        appointment_date: formData.date, // Backend espera este campo também
        doctor_id: formData.selectedDoctor?.id || null,
        medical_specialty_id: formData.medicalSpecialtyId || null, // Especialidade médica
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
          location: formData.address.trim() || null,
          notes: formData.notes.trim() || null,
        });
      } else {
        // Criar novo compromisso
        result = await appointmentService.createAppointment(appointmentData);
      }

      if (result.success) {
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
            <Ionicons name="close" size={24} color={colors.text} />
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
                <Ionicons name="text-outline" size={20} color={colors.gray400} />
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
                  <Ionicons
                    name="medical-outline"
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
                  <Ionicons
                    name="calendar-outline"
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
                  <Ionicons
                    name="fitness-outline"
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
                  <Ionicons
                    name="flask-outline"
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
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Especialidade Médica</Text>
                <TouchableOpacity
                  style={styles.inputWrapper}
                  onPress={() => setSpecialtyModalVisible(true)}
                >
                  <Ionicons name="medical-outline" size={20} color={colors.gray400} />
                  <Text style={[
                    styles.input,
                    !formData.medicalSpecialtyId && styles.placeholder
                  ]}>
                    {formData.medicalSpecialtyId
                      ? specialties.find(s => s.id === formData.medicalSpecialtyId)?.name
                      : 'Selecione a especialidade...'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={colors.gray400} />
                </TouchableOpacity>
              </View>
            )}

            {/* Data e Hora */}
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
                  <Ionicons name="calendar-outline" size={20} color={colors.gray400} />
                  <Text style={styles.dateText}>
                    {new Date(formData.date).toLocaleDateString('pt-BR')}
                  </Text>
                  {formData.recurrenceType === 'none' && (
                    <Ionicons name="create-outline" size={20} color={colors.primary} />
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
                  <Ionicons name="time-outline" size={20} color={colors.gray400} />
                  <Text style={styles.dateText}>
                    {new Date(formData.date).toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Text>
                  {formData.recurrenceType === 'none' && (
                    <Ionicons name="create-outline" size={20} color={colors.primary} />
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

            {/* Recorrência */}
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
                    <Ionicons name="calendar-outline" size={20} color={colors.gray400} />
                    <Text style={styles.dateText}>
                      {formData.recurrenceEnd 
                        ? new Date(formData.recurrenceEnd).toLocaleDateString('pt-BR')
                        : 'Selecione a data final'}
                    </Text>
                    <Ionicons name="create-outline" size={20} color={colors.primary} />
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

            {/* Endereço com Autocomplete */}
            <View style={styles.inputContainer}>
              <View style={styles.labelWithHelp}>
                <Text style={styles.label}>Endereço (opcional)</Text>
                {GOOGLE_MAPS_CONFIG.API_KEY === 'SUA_API_KEY_AQUI' && (
                  <TouchableOpacity 
                    onPress={checkGoogleMapsConfig}
                    style={styles.helpButton}
                  >
                    <Ionicons name="information-circle" size={20} color={colors.warning} />
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
                    <Ionicons name="navigate-outline" size={16} color={colors.info} />
                    <Text style={styles.mapButtonText}>Google Maps</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.mapButton}
                    onPress={openWaze}
                  >
                    <Ionicons name="navigate-outline" size={16} color={colors.info} />
                    <Text style={styles.mapButtonText}>Waze</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

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
              <Ionicons name="information-circle" size={24} color={colors.info} />
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
                  <Ionicons name="checkmark-circle" size={20} color={colors.textWhite} />
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
                  <Ionicons name="close" size={24} color={colors.text} />
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
                      <Ionicons name="checkmark" size={24} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
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
});

export default AddAppointmentScreen;


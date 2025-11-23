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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import Toast from 'react-native-toast-message';
import colors from '../../constants/colors';
import { AppointmentIcon, LocationIcon } from '../../components/CustomIcons';
import appointmentService from '../../services/appointmentService';
import medicalSpecialtyService from '../../services/medicalSpecialtyService';
import GOOGLE_MAPS_CONFIG from '../../config/maps';
import { checkGoogleMapsConfig } from '../../utils/checkGoogleMapsConfig';

const AddAppointmentScreen = ({ route, navigation }) => {
  let { groupId, groupName } = route.params || {};
  
  // TEMPORÁRIO: Se groupId é um timestamp (> 999999999999), usar o grupo de teste
  if (groupId && groupId > 999999999999) {
    console.warn('⚠️ GroupId é um timestamp! Usando grupo de teste (ID=1)');
    groupId = 1;
  }
  
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const googlePlacesRef = useRef(null);
  
  // Estados para especialidades médicas
  const [specialties, setSpecialties] = useState([]);
  
  // Dados do compromisso
  const [formData, setFormData] = useState({
    title: '',
    type: 'common', // common, medical, fisioterapia, exames
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
  }, []);

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

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      updateField('date', date.toISOString());
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
      };

      console.log('📤 Salvando compromisso:', appointmentData);
      console.log('📋 Tipo selecionado:', formData.type);

      const result = await appointmentService.createAppointment(appointmentData);

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: '✅ Compromisso agendado!',
          text2: `${formData.title} foi cadastrado com sucesso`,
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
    <SafeAreaView style={styles.container}>
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

            <Text style={styles.title}>Agendar Compromisso</Text>
            <Text style={styles.subtitle}>
              Crie um compromisso ou consulta médica para o acompanhado
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
              
              {/* Linha 1: Comum e Médico */}
              <View style={styles.typeContainer}>
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
                <View style={styles.pickerContainer}>
                  <Ionicons name="medical-outline" size={20} color={colors.gray400} style={styles.pickerIcon} />
                  <Picker
                    selectedValue={formData.medicalSpecialtyId}
                    onValueChange={(itemValue) => updateField('medicalSpecialtyId', itemValue)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Selecione a especialidade..." value={null} />
                    {specialties.map((specialty) => (
                      <Picker.Item 
                        key={specialty.id} 
                        label={specialty.name} 
                        value={specialty.id} 
                      />
                    ))}
                  </Picker>
                </View>
              </View>
            )}

            {/* Data e Hora */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Data e Hora *</Text>
              
              <View style={styles.dateTimeRow}>
                {/* Data */}
                <TouchableOpacity 
                  style={[styles.inputWrapper, { flex: 1 }]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color={colors.gray400} />
                  <Text style={styles.dateText}>
                    {new Date(formData.date).toLocaleDateString('pt-BR')}
                  </Text>
                  <Ionicons name="create-outline" size={20} color={colors.primary} />
                </TouchableOpacity>

                {/* Hora */}
                <TouchableOpacity 
                  style={[styles.inputWrapper, { flex: 1 }]}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Ionicons name="time-outline" size={20} color={colors.gray400} />
                  <Text style={styles.dateText}>
                    {new Date(formData.date).toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Text>
                  <Ionicons name="create-outline" size={20} color={colors.primary} />
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
                  <Text style={styles.saveButtonText}>Agendar Compromisso</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </View>
        </ScrollView>
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
  // Estilos para Picker de Especialidade
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    paddingLeft: 12,
  },
  pickerIcon: {
    marginRight: 8,
  },
  picker: {
    flex: 1,
    height: 50,
  },
});

export default AddAppointmentScreen;


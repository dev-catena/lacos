import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import Toast from 'react-native-toast-message';
import colors from '../../constants/colors';
import doctorService from '../../services/doctorService';
import medicalSpecialtyService from '../../services/medicalSpecialtyService';
import GOOGLE_MAPS_CONFIG from '../../config/maps';
import { checkGoogleMapsConfig } from '../../utils/checkGoogleMapsConfig';

const AddDoctorScreen = ({ route, navigation }) => {
  const { groupId, groupName, doctor, isEditing = false } = route.params;
  const googlePlacesRef = useRef(null);

  const [formData, setFormData] = useState({
    name: doctor?.name || '',
    medicalSpecialtyId: doctor?.medical_specialty_id || null,
    crm: doctor?.crm || '',
    phone: doctor?.phone || '',
    email: doctor?.email || '',
    address: doctor?.address || '',
    notes: doctor?.notes || '',
    isPrimary: doctor?.is_primary || false,
  });

  const [specialties, setSpecialties] = useState([]);
  const [hasGoogleMapsConfig, setHasGoogleMapsConfig] = useState(false);

  useEffect(() => {
    loadSpecialties();
    setHasGoogleMapsConfig(checkGoogleMapsConfig());
  }, []);

  const loadSpecialties = async () => {
    try {
      const response = await medicalSpecialtyService.getSpecialties();
      console.log('Resposta de especialidades:', response);
      if (response.success && response.data) {
        console.log('Especialidades carregadas:', response.data.length);
        setSpecialties(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar especialidades:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro ao carregar especialidades',
        text2: 'Verifique sua conexão',
      });
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    // Validações
    if (!formData.name.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Nome obrigatório',
        text2: 'Informe o nome do médico',
      });
      return;
    }

    try {
      const doctorData = {
        group_id: groupId,
        name: formData.name.trim(),
        medical_specialty_id: formData.medicalSpecialtyId,
        crm: formData.crm.trim() || null,
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        address: formData.address.trim() || null,
        notes: formData.notes.trim() || null,
        is_primary: formData.isPrimary,
      };

      let response;
      if (isEditing) {
        response = await doctorService.updateDoctor(doctor.id, doctorData);
      } else {
        response = await doctorService.createDoctor(doctorData);
      }

      if (response.success) {
        Toast.show({
          type: 'success',
          text1: isEditing ? 'Médico atualizado' : 'Médico cadastrado',
          text2: 'Dados salvos com sucesso',
        });
        navigation.goBack();
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erro ao salvar',
        text2: error.message || 'Tente novamente',
      });
    }
  };

  const openMap = (app) => {
    if (!formData.address) {
      Toast.show({
        type: 'error',
        text1: 'Endereço não informado',
      });
      return;
    }

    const address = encodeURIComponent(formData.address);
    let url;

    if (app === 'google') {
      url = `https://www.google.com/maps/search/?api=1&query=${address}`;
    } else if (app === 'waze') {
      url = `https://waze.com/ul?q=${address}`;
    }

    Linking.openURL(url).catch(() => {
      Toast.show({
        type: 'error',
        text1: 'Erro ao abrir mapa',
        text2: `${app === 'google' ? 'Google Maps' : 'Waze'} não disponível`,
      });
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Editar Médico' : 'Cadastrar Médico'}
          </Text>
          <Text style={styles.headerSubtitle}>{groupName}</Text>
        </View>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Salvar</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Nome */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nome Completo *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color={colors.gray400} />
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => updateField('name', text)}
                placeholder="Dr. João Silva"
                placeholderTextColor={colors.gray400}
              />
            </View>
          </View>

          {/* Especialidade */}
          <View style={[styles.inputContainer, { zIndex: 10 }]}>
            <Text style={styles.label}>
              Especialidade Médica {specialties.length > 0 && `(${specialties.length} disponíveis)`}
            </Text>
            <View style={styles.pickerContainer}>
              <Ionicons name="medical-outline" size={20} color={colors.gray400} style={styles.pickerIcon} />
              <Picker
                selectedValue={formData.medicalSpecialtyId}
                onValueChange={(itemValue) => {
                  console.log('Especialidade selecionada:', itemValue);
                  updateField('medicalSpecialtyId', itemValue);
                }}
                style={styles.picker}
                enabled={specialties.length > 0}
                mode="dropdown"
                dropdownIconColor={colors.gray400}
              >
                <Picker.Item label="Selecione a especialidade..." value={null} color={colors.gray400} />
                {specialties.map((specialty) => (
                  <Picker.Item 
                    key={specialty.id} 
                    label={specialty.name} 
                    value={specialty.id} 
                  />
                ))}
              </Picker>
            </View>
            {specialties.length === 0 && (
              <Text style={styles.hint}>
                Carregando especialidades...
              </Text>
            )}
          </View>

          {/* CRM */}
          <View style={[styles.inputContainer, { zIndex: 1 }]}>
            <Text style={styles.label}>CRM</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="card-outline" size={20} color={colors.gray400} />
              <TextInput
                style={styles.input}
                value={formData.crm}
                onChangeText={(text) => updateField('crm', text)}
                placeholder="Ex: 123456-SP"
                placeholderTextColor={colors.gray400}
              />
            </View>
            {!formData.crm && (
              <Text style={styles.hint}>
                Opcional - Informe apenas se disponível
              </Text>
            )}
          </View>

          {/* Telefone */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Telefone</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={20} color={colors.gray400} />
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(text) => updateField('phone', text)}
                placeholder="(11) 98765-4321"
                placeholderTextColor={colors.gray400}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>E-mail</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color={colors.gray400} />
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(text) => updateField('email', text)}
                placeholder="contato@clinica.com.br"
                placeholderTextColor={colors.gray400}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Endereço com Google Places */}
          <View style={styles.inputContainer}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Endereço</Text>
              {formData.address && (
                <View style={styles.mapButtons}>
                  <TouchableOpacity
                    style={styles.mapButton}
                    onPress={() => openMap('google')}
                  >
                    <Ionicons name="map-outline" size={16} color={colors.primary} />
                    <Text style={styles.mapButtonText}>Maps</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.mapButton}
                    onPress={() => openMap('waze')}
                  >
                    <Ionicons name="navigate-outline" size={16} color={colors.primary} />
                    <Text style={styles.mapButtonText}>Waze</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {hasGoogleMapsConfig ? (
              <GooglePlacesAutocomplete
                ref={googlePlacesRef}
                placeholder="Digite o endereço..."
                fetchDetails={true}
                onPress={(data, details = null) => {
                  const fullAddress = details?.formatted_address || data.description;
                  updateField('address', fullAddress);
                  Toast.show({
                    type: 'success',
                    text1: 'Endereço selecionado',
                  });
                }}
                onFail={(error) => {
                  console.error('Erro no autocomplete:', error);
                }}
                query={{
                  key: GOOGLE_MAPS_CONFIG.API_KEY,
                  language: GOOGLE_MAPS_CONFIG.language,
                  components: `country:${GOOGLE_MAPS_CONFIG.region}`,
                }}
                textInputProps={{
                  value: formData.address,
                  onChangeText: (text) => updateField('address', text),
                  placeholderTextColor: colors.gray400,
                  style: styles.googlePlacesInput,
                }}
                styles={{
                  container: styles.googlePlacesContainer,
                  listView: styles.googlePlacesList,
                }}
                enablePoweredByContainer={false}
                debounce={400}
              />
            ) : (
              <View style={styles.inputWrapper}>
                <Ionicons name="location-outline" size={20} color={colors.gray400} />
                <TextInput
                  style={styles.input}
                  value={formData.address}
                  onChangeText={(text) => updateField('address', text)}
                  placeholder="Rua, número, bairro, cidade"
                  placeholderTextColor={colors.gray400}
                  multiline
                />
              </View>
            )}
          </View>

          {/* Observações */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Observações</Text>
            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.notes}
                onChangeText={(text) => updateField('notes', text)}
                placeholder="Informações adicionais sobre o médico..."
                placeholderTextColor={colors.gray400}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Médico Principal */}
          <View style={styles.switchContainer}>
            <View style={styles.switchLabel}>
              <Ionicons name="star" size={20} color={colors.primary} />
              <Text style={styles.switchText}>
                Este é o médico assistente principal do paciente
              </Text>
            </View>
            <Switch
              value={formData.isPrimary}
              onValueChange={(value) => updateField('isPrimary', value)}
              trackColor={{ false: colors.gray300, true: colors.primary + '50' }}
              thumbColor={formData.isPrimary ? colors.primary : colors.gray400}
            />
          </View>

          <View style={{ height: 40 }} />
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
    fontSize: 14,
    color: colors.gray400,
    marginTop: 2,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  hint: {
    fontSize: 12,
    color: colors.gray400,
    marginTop: 4,
    fontStyle: 'italic',
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    paddingLeft: 12,
    paddingRight: 4,
    paddingVertical: 2,
    minHeight: 56,
    marginBottom: 8,
  },
  pickerIcon: {
    marginRight: 8,
  },
  picker: {
    flex: 1,
    height: 56,
    color: colors.text,
    marginRight: -12,
  },
  textAreaWrapper: {
    alignItems: 'flex-start',
    minHeight: 100,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  mapButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.primary + '15',
  },
  mapButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.primary,
  },
  googlePlacesContainer: {
    flex: 0,
  },
  googlePlacesInput: {
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  googlePlacesList: {
    borderRadius: 12,
    marginTop: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  switchLabel: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginRight: 12,
  },
  switchText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
});

export default AddDoctorScreen;


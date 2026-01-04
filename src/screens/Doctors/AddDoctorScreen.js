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
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import SafeIcon from '../../components/SafeIcon';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import Toast from 'react-native-toast-message';
import colors from '../../constants/colors';
import doctorService from '../../services/doctorService';
import medicalSpecialtyService from '../../services/medicalSpecialtyService';
import GOOGLE_MAPS_CONFIG from '../../config/maps';
import { checkGoogleMapsConfig } from '../../utils/checkGoogleMapsConfig';
import { BR_UFS } from '../../constants/brUfs';
import { parseCrm, formatCrmValue } from '../../utils/crm';

const AddDoctorScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { groupId, groupName, doctor, isEditing = false } = route.params;
  const googlePlacesRef = useRef(null);
  const parsedCrm = parseCrm(doctor?.crm || '');

  // Função para formatar telefone: +55(00)00000-0000 (definida antes do useState)
  const formatPhone = (text) => {
    // Se o texto não começar com +55, garantir que comece
    let cleanText = text;
    if (!text || !text.startsWith('+55')) {
      // Se não começar com +55, adicionar
      const digits = text ? text.replace(/\D/g, '') : '';
      cleanText = '+55' + digits;
    }
    
    // Remove o +55 temporariamente para processar apenas os dígitos
    const digitsOnly = cleanText.replace(/\+55/g, '').replace(/\D/g, '');
    
    // Limita a 11 dígitos (DDD + número)
    const limitedDigits = digitsOnly.slice(0, 11);
    
    // Sempre começa com +55
    let formatted = '+55';
    
    if (limitedDigits.length > 0) {
      formatted += `(${limitedDigits.slice(0, 2)}`;
    }
    
    if (limitedDigits.length > 2) {
      formatted += `)${limitedDigits.slice(2, 7)}`;
    }
    
    if (limitedDigits.length > 7) {
      formatted += `-${limitedDigits.slice(7, 11)}`;
    }
    
    return formatted;
  };

  // Função auxiliar para formatar telefone existente ao carregar
  const formatExistingPhone = (phone) => {
    if (!phone) return '+55';
    // Se já começa com +55, formatar
    if (phone.startsWith('+55')) {
      return formatPhone(phone);
    }
    // Se não começa com +55, adicionar e formatar
    return formatPhone('+55' + phone.replace(/\D/g, ''));
  };

  const [formData, setFormData] = useState({
    name: doctor?.name || '',
    medicalSpecialtyId: doctor?.medical_specialty_id || null,
    crmUf: parsedCrm.uf || '',
    crmNumber: parsedCrm.number || '',
    phone: formatExistingPhone(doctor?.phone),
    email: doctor?.email || '',
    address: doctor?.address || '',
    notes: doctor?.notes || '',
    isPrimary: doctor?.is_primary || false,
  });

  const [specialties, setSpecialties] = useState([]);
  const [hasGoogleMapsConfig, setHasGoogleMapsConfig] = useState(false);
  const [specialtyModalVisible, setSpecialtyModalVisible] = useState(false);
  const [ufModalVisible, setUfModalVisible] = useState(false);
  const [addressListVisible, setAddressListVisible] = useState(false);
  // "lock" curto para evitar que o autocomplete limpe/reabra lista logo após selecionar um item
  const selectingAddressRef = useRef(false);
  const lastSelectedAddressRef = useRef('');
  const lastSelectedAddressAtRef = useRef(0);

  useEffect(() => {
    loadSpecialties();
    setHasGoogleMapsConfig(checkGoogleMapsConfig());
  }, []);

  const loadSpecialties = async () => {
    try {
      const response = await medicalSpecialtyService.getSpecialties();
      console.log('Resposta de especialidades:', response);
      if (response.success && response.data) {
        // Remover duplicatas por nome (caso o backend ainda retorne)
        const uniqueSpecialties = response.data.reduce((acc, current) => {
          const existing = acc.find(item => item.name === current.name);
          if (!existing) {
            acc.push(current);
          }
          return acc;
        }, []);
        
        // Ordenar por nome
        uniqueSpecialties.sort((a, b) => a.name.localeCompare(b.name));
        
        console.log(`Especialidades carregadas: ${uniqueSpecialties.length} (após remover duplicatas)`);
        setSpecialties(uniqueSpecialties);
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

  const handleAddressChange = (text) => {
    // Durante a seleção, o componente pode disparar onChangeText extra (às vezes '')
    // que apaga o valor selecionado. Ignoramos qualquer mudança nesse intervalo.
    if (selectingAddressRef.current) return;

    // Logo após selecionar, alguns devices disparam um onChangeText com o texto antigo/curto.
    // Mantém o valor selecionado.
    const recentlySelected = Date.now() - lastSelectedAddressAtRef.current < 1200;
    if (
      recentlySelected &&
      lastSelectedAddressRef.current &&
      text !== lastSelectedAddressRef.current &&
      (String(text || '').length < lastSelectedAddressRef.current.length)
    ) {
      return;
    }

    updateField('address', text);
    setAddressListVisible(true);
  };

  // Função para extrair apenas os dígitos do telefone (sem +55)
  const extractPhoneDigits = (formattedPhone) => {
    // Remove +55 e todos os caracteres não numéricos
    return formattedPhone.replace(/\+55/g, '').replace(/\D/g, '');
  };

  // Handler para mudança do campo telefone
  const handlePhoneChange = (text) => {
    // Se o texto estiver vazio ou não começar com +55, garantir +55
    if (!text || text.length === 0) {
      updateField('phone', '+55');
      return;
    }
    
    // Se o usuário tentar apagar o +55, restaurar
    if (!text.startsWith('+55')) {
      // Se não começar com +55, adicionar +55 e formatar
      const digits = text.replace(/\D/g, '');
      const formatted = formatPhone('+55' + digits);
      updateField('phone', formatted);
      return;
    }
    
    // Formatar o telefone mantendo o +55
    const formatted = formatPhone(text);
    updateField('phone', formatted);
  };

  const checkDuplicateDoctor = async (name, crm) => {
    try {
      const response = await doctorService.getDoctors(groupId);
      if (response && response.success && response.data) {
        const existingDoctors = response.data;
        
        // Verificar se já existe médico com mesmo nome ou CRM
        const duplicate = existingDoctors.find(doc => {
          const nameMatch = doc.name?.toLowerCase().trim() === name.toLowerCase().trim();
          const crmMatch = crm && doc.crm && doc.crm.trim() === crm.trim();
          return nameMatch || crmMatch;
        });
        
        return duplicate || null;
      }
      return null;
    } catch (error) {
      console.error('Erro ao verificar médico duplicado:', error);
      return null;
    }
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
      // Se não estiver editando, verificar se já existe médico com mesmo nome ou CRM
      if (!isEditing) {
        const crmValue = formatCrmValue(formData.crmUf, formData.crmNumber);
        const duplicate = await checkDuplicateDoctor(
          formData.name.trim(),
          crmValue.trim()
        );
        
        if (duplicate) {
          Alert.alert(
            'Médico já cadastrado',
            `Já existe um médico cadastrado com ${duplicate.name === formData.name.trim() ? 'este nome' : 'este CRM'}:\n\n${duplicate.name}${duplicate.crm ? `\nCRM: ${duplicate.crm}` : ''}${duplicate.medical_specialty?.name ? `\n${duplicate.medical_specialty.name}` : ''}\n\nDeseja usar o médico existente ou continuar cadastrando um novo?`,
            [
              {
                text: 'Usar existente',
                onPress: () => {
                  // Voltar e selecionar o médico existente
                  navigation.goBack();
                  // Passar o médico existente via callback (se necessário)
                  // Por enquanto, apenas volta e o usuário pode selecionar
                },
              },
              {
                text: 'Continuar cadastrando',
                style: 'default',
                onPress: async () => {
                  // Continuar com o cadastro
                  await proceedWithSave();
                },
              },
            ]
          );
          return;
        }
      }

      await proceedWithSave();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erro ao salvar',
        text2: error.message || 'Tente novamente',
      });
    }
  };

  const proceedWithSave = async () => {
    try {
      // Validar CRM: se informado, deve ter UF e número com 6 dígitos
      if (formData.crmNumber || formData.crmUf) {
        if (!formData.crmUf) {
          Toast.show({
            type: 'error',
            text1: 'CRM incompleto',
            text2: 'Selecione o UF do CRM',
          });
          return;
        }
        
        if (!formData.crmNumber || formData.crmNumber.length === 0) {
          Toast.show({
            type: 'error',
            text1: 'CRM incompleto',
            text2: 'Informe o número do CRM (6 dígitos)',
          });
          return;
        }
        
        // Validar que o número tem exatamente 6 dígitos
        const cleanNumber = formData.crmNumber.replace(/\D/g, '');
        if (cleanNumber.length !== 6) {
          Toast.show({
            type: 'error',
            text1: 'CRM inválido',
            text2: 'O número do CRM deve ter exatamente 6 dígitos',
          });
          return;
        }
      }
      
      const crmValue = formatCrmValue(formData.crmUf, formData.crmNumber);

      // Preparar telefone: remover formatação e manter apenas +55 + dígitos
      let phoneValue = null;
      if (formData.phone && formData.phone.trim()) {
        // Garantir que começa com +55 e extrair apenas os dígitos após +55
        const digits = extractPhoneDigits(formData.phone);
        if (digits.length > 0) {
          phoneValue = `+55${digits}`;
        }
      }

      const doctorData = {
        group_id: groupId,
        name: formData.name.trim(),
        medical_specialty_id: formData.medicalSpecialtyId,
        crm: crmValue.trim() || null,
        phone: phoneValue,
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
      throw error;
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
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <SafeIcon name="arrow-back" size={24} color={colors.text} />
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
        <FlatList
          data={[]}
          renderItem={() => null}
          keyExtractor={() => 'doctor-form'}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          nestedScrollEnabled
          removeClippedSubviews={false}
          ListHeaderComponent={
            <>
              {/* Nome */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Nome Completo *</Text>
                <View style={styles.inputWrapper}>
                  <SafeIcon name="person" size={20} color={colors.gray400} />
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
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Especialidade Médica {specialties.length > 0 && `(${specialties.length} disponíveis)`}
            </Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setSpecialtyModalVisible(true)}
              disabled={specialties.length === 0}
            >
              <SafeIcon name="medical-outline" size={20} color={colors.gray400} />
              <Text style={[
                styles.selectButtonText,
                !formData.medicalSpecialtyId && styles.selectButtonPlaceholder
              ]}>
                {formData.medicalSpecialtyId
                  ? specialties.find(s => s.id === formData.medicalSpecialtyId)?.name
                  : 'Selecione a especialidade...'}
              </Text>
              <SafeIcon name="chevron-down" size={20} color={colors.gray400} />
            </TouchableOpacity>
            {specialties.length === 0 && (
              <Text style={styles.hint}>
                Carregando especialidades...
              </Text>
            )}
          </View>

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
                    <SafeIcon name="close" size={24} color={colors.text} />
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
                        <SafeIcon name="checkmark" size={24} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  )}
                  ItemSeparatorComponent={() => <View style={styles.separator} />}
                />
              </View>
            </View>
          </Modal>

          {/* CRM */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>CRM</Text>
            <View style={styles.crmRow}>
              <TouchableOpacity
                style={styles.ufSelector}
                activeOpacity={0.7}
                onPress={() => setUfModalVisible(true)}
              >
                <Text style={[
                  styles.ufSelectorText,
                  !formData.crmUf && styles.ufSelectorPlaceholder
                ]}>
                  {formData.crmUf || 'UF'}
                </Text>
                <SafeIcon name="chevron-down" size={18} color={colors.textLight} />
              </TouchableOpacity>

              <View style={[styles.inputWrapper, styles.crmNumberWrapper]}>
                <SafeIcon name="card-outline" size={20} color={colors.gray400} />
                <TextInput
                  style={styles.input}
                  value={formData.crmNumber}
                  onChangeText={(text) => {
                    // Apenas números, máximo 6 dígitos
                    const numbers = text.replace(/\D/g, '').slice(0, 6);
                    updateField('crmNumber', numbers);
                  }}
                  placeholder="000000"
                  placeholderTextColor={colors.gray400}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>
            </View>

            {!formData.crmUf && !formData.crmNumber && (
              <Text style={styles.hint}>
                Opcional - se informar CRM, selecione o UF
              </Text>
            )}
          </View>

          {/* Modal de UF */}
          <Modal
            visible={ufModalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setUfModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Selecione o UF</Text>
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={() => setUfModalVisible(false)}
                  >
                    <SafeIcon name="close" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={BR_UFS}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.specialtyItem,
                        formData.crmUf === item && styles.specialtyItemSelected
                      ]}
                      onPress={() => {
                        updateField('crmUf', item);
                        setUfModalVisible(false);
                      }}
                    >
                      <Text style={[
                        styles.specialtyItemText,
                        formData.crmUf === item && styles.specialtyItemTextSelected
                      ]}>
                        {item}
                      </Text>
                      {formData.crmUf === item && (
                        <SafeIcon name="checkmark" size={24} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  )}
                  ItemSeparatorComponent={() => <View style={styles.separator} />}
                />
              </View>
            </View>
          </Modal>

          {/* Telefone */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Telefone</Text>
            <View style={styles.inputWrapper}>
              <SafeIcon name="call" size={20} color={colors.gray400} />
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={handlePhoneChange}
                placeholder="+55(00)00000-0000"
                placeholderTextColor={colors.gray400}
                keyboardType="phone-pad"
                // Não usar maxLength - a função formatPhone já limita a 11 dígitos
              />
            </View>
            <Text style={styles.hint}>
              Formato: +55(DDD)XXXXX-XXXX (11 dígitos)
            </Text>
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>E-mail</Text>
            <View style={styles.inputWrapper}>
              <SafeIcon name="mail-outline" size={20} color={colors.gray400} />
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
                    <SafeIcon name="map-outline" size={16} color={colors.primary} />
                    <Text style={styles.mapButtonText}>Maps</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.mapButton}
                    onPress={() => openMap('waze')}
                  >
                    <SafeIcon name="location-outline" size={16} color={colors.primary} />
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
                numberOfLines={3}
                onPress={(data, details = null) => {
                  const main = data?.structured_formatting?.main_text || '';
                  const secondary = data?.structured_formatting?.secondary_text || '';
                  const composed = main ? `${main}${secondary ? ` - ${secondary}` : ''}` : '';
                  const fullAddress = details?.formatted_address || data?.description || composed;
                  selectingAddressRef.current = true;
                  lastSelectedAddressRef.current = fullAddress;
                  lastSelectedAddressAtRef.current = Date.now();
                  setTimeout(() => {
                    selectingAddressRef.current = false;
                  }, 400);

                  updateField('address', fullAddress);
                  // recolher lista e manter somente o endereço selecionado
                  setAddressListVisible(false);
                  // garantir que o texto do input fique atualizado no componente
                  try {
                    googlePlacesRef.current?.setAddressText?.(fullAddress);
                    googlePlacesRef.current?.blur?.();
                  } catch (e) {
                    // noop
                  }
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
                listViewDisplayed={addressListVisible}
                keepResultsAfterBlur={false}
                listViewProps={{
                  keyboardShouldPersistTaps: 'handled',
                  nestedScrollEnabled: true,
                }}
                renderRow={(rowData) => {
                  const label = rowData?.description || '';
                  const main = rowData?.structured_formatting?.main_text || label;
                  const secondary = rowData?.structured_formatting?.secondary_text || '';
                  return (
                    <View style={styles.placesRow}>
                      <Text style={styles.placesMainText}>{main}</Text>
                      {!!secondary && <Text style={styles.placesSecondaryText}>{secondary}</Text>}
                    </View>
                  );
                }}
                textInputProps={{
                  value: formData.address,
                  onChangeText: handleAddressChange,
                  placeholderTextColor: colors.gray400,
                  style: styles.googlePlacesInput,
                  onFocus: () => setAddressListVisible(true),
                  onBlur: () => {
                    // dar tempo do onPress da sugestão executar antes de recolher
                    setTimeout(() => setAddressListVisible(false), 350);
                  },
                }}
                styles={{
                  container: styles.googlePlacesContainer,
                  textInputContainer: styles.googlePlacesTextInputContainer,
                  textInput: styles.googlePlacesInput,
                  listView: styles.googlePlacesList,
                  row: styles.googlePlacesRow,
                  description: styles.googlePlacesDescription,
                }}
                enablePoweredByContainer={false}
                debounce={400}
              />
            ) : (
              <View style={styles.inputWrapper}>
                <SafeIcon name="location-outline" size={20} color={colors.gray400} />
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
              <SafeIcon name="star" size={20} color={colors.primary} />
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
            </>
          }
        />
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
    marginBottom: 20,
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
  crmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ufSelector: {
    width: 92,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  ufSelectorText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  ufSelectorPlaceholder: {
    color: colors.gray400,
    fontWeight: '500',
  },
  crmNumberWrapper: {
    flex: 1,
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
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  selectButtonText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  selectButtonPlaceholder: {
    color: colors.gray400,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    backgroundColor: '#FFFFFF',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
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
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    backgroundColor: '#E0E0E0',
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
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
  },
  googlePlacesTextInputContainer: {
    width: '100%',
    paddingHorizontal: 0,
    alignSelf: 'stretch',
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
    width: '100%',
    alignSelf: 'stretch',
  },
  googlePlacesList: {
    borderRadius: 12,
    marginTop: 8,
    backgroundColor: colors.white,
    maxHeight: 240,
    zIndex: 10,
    elevation: 10,
    width: '100%',
    alignSelf: 'stretch',
  },
  googlePlacesRow: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: 'flex-start',
    flexDirection: 'column',
  },
  googlePlacesDescription: {
    flexWrap: 'wrap',
    flexShrink: 1,
    width: '100%',
    color: colors.text,
    lineHeight: 18,
  },
  placesRow: {
    width: '100%',
    paddingVertical: 2,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  placesMainText: {
    width: '100%',
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  placesSecondaryText: {
    width: '100%',
    marginTop: 2,
    color: colors.gray400,
    fontSize: 13,
    lineHeight: 17,
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


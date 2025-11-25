import React, { useState, useEffect } from 'react';
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
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import colors from '../../constants/colors';
import medicalSpecialtyService from '../../services/medicalSpecialtyService';
import consultationService from '../../services/consultationService';

const AddConsultationScreen = ({ route, navigation }) => {
  let { groupId, groupName } = route.params || {};
  
  // TEMPORÁRIO: Se groupId é um timestamp, usar o grupo de teste
  if (groupId && groupId > 999999999999) {
    groupId = 1;
  }

  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Estados para especialidades
  const [specialties, setSpecialties] = useState([]);
  const [specialtyModalVisible, setSpecialtyModalVisible] = useState(false);

  const [formData, setFormData] = useState({
    type: 'urgency', // urgency, medical, fisioterapia, exames
    title: '',
    doctorName: '',
    medicalSpecialtyId: null,
    location: '',
    date: new Date().toISOString(),
    summary: '',
    diagnosis: '',
    treatment: '',
    notes: '',
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

  const typeOptions = [
    { value: 'urgency', label: 'Urgência', icon: 'alert-circle', color: colors.error },
    { value: 'medical', label: 'Médica', icon: 'medical', color: colors.secondary },
    { value: 'fisioterapia', label: 'Fisioterapia', icon: 'fitness', color: colors.success },
    { value: 'exames', label: 'Exames', icon: 'flask', color: colors.info },
  ];

  const handleSave = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Atenção', 'Digite um título para a consulta');
      return;
    }

    if (!formData.type) {
      Alert.alert('Atenção', 'Selecione o tipo de consulta');
      return;
    }

    if (!groupId) {
      Alert.alert('Erro', 'ID do grupo não foi fornecido');
      return;
    }

    console.log('📋 Dados do formulário antes de salvar:', formData);
    console.log('🏥 Group ID:', groupId);

    setLoading(true);

    try {
      const consultationData = {
        group_id: groupId,
        type: formData.type,
        title: formData.title,
        consultation_date: formData.date,
        is_urgent: formData.type === 'urgency',
      };

      // Adicionar campos opcionais apenas se tiverem valor
      if (formData.medicalSpecialtyId) {
        consultationData.medical_specialty_id = formData.medicalSpecialtyId;
      }
      if (formData.doctorName && formData.doctorName.trim()) {
        consultationData.doctor_name = formData.doctorName;
      }
      if (formData.location && formData.location.trim()) {
        consultationData.location = formData.location;
      }
      if (formData.summary && formData.summary.trim()) {
        consultationData.summary = formData.summary;
      }
      if (formData.diagnosis && formData.diagnosis.trim()) {
        consultationData.diagnosis = formData.diagnosis;
      }
      if (formData.treatment && formData.treatment.trim()) {
        consultationData.treatment = formData.treatment;
      }
      if (formData.notes && formData.notes.trim()) {
        consultationData.notes = formData.notes;
      }

      console.log('📤 Enviando consulta:', consultationData);

      const result = await consultationService.createConsultation(consultationData);

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: '✅ Consulta registrada!',
          text2: 'Os detalhes foram salvos com sucesso',
          position: 'bottom',
        });

        navigation.goBack();
      } else {
        console.error('❌ Erro da API:', result.error);
        if (result.errors) {
          console.error('❌ Detalhes dos erros:', JSON.stringify(result.errors, null, 2));
        }
        
        let errorMessage = result.error || 'Não foi possível salvar a consulta';
        
        // Exibir erros detalhados se disponíveis
        if (result.errors) {
          const errorDetails = Object.entries(result.errors)
            .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
            .join('\n');
          errorMessage = `${errorMessage}\n\nDetalhes:\n${errorDetails}`;
        }
        
        Alert.alert('Erro ao salvar', errorMessage);
      }
    } catch (error) {
      console.error('❌ Erro ao salvar consulta (catch):', error);
      Alert.alert('Erro', 'Não foi possível salvar a consulta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Registrar Consulta</Text>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
          contentContainerStyle={styles.content}
        >
          {/* Tipo */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Tipo de Consulta *</Text>
            <View style={styles.typeContainer}>
              {typeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.typeButton,
                    formData.type === option.value && styles.typeButtonActive,
                    { borderColor: option.color },
                  ]}
                  onPress={() => updateField('type', option.value)}
                >
                  <Ionicons
                    name={option.icon}
                    size={24}
                    color={formData.type === option.value ? option.color : colors.gray400}
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      formData.type === option.value && { color: option.color },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Especialidade Médica - apenas para consultas médicas */}
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

          {/* Título */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Título *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="text-outline" size={20} color={colors.gray400} />
              <TextInput
                style={styles.input}
                placeholder="Ex: Consulta de Urgência - Hospital"
                value={formData.title}
                onChangeText={(value) => updateField('title', value)}
              />
            </View>
          </View>

          {/* Data e Hora */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Data e Hora da Consulta *</Text>
            <View style={styles.dateTimeRow}>
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

              <TouchableOpacity
                style={[styles.inputWrapper, { flex: 1 }]}
                onPress={() => setShowTimePicker(true)}
              >
                <Ionicons name="time-outline" size={20} color={colors.gray400} />
                <Text style={styles.dateText}>
                  {new Date(formData.date).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
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
                maximumDate={new Date()}
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

          {/* Médico/Profissional */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Médico/Profissional</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color={colors.gray400} />
              <TextInput
                style={styles.input}
                placeholder="Nome do médico ou profissional"
                value={formData.doctorName}
                onChangeText={(value) => updateField('doctorName', value)}
              />
            </View>
          </View>

          {/* Local */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Local</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="location-outline" size={20} color={colors.gray400} />
              <TextInput
                style={styles.input}
                placeholder="Hospital, clínica ou consultório"
                value={formData.location}
                onChangeText={(value) => updateField('location', value)}
              />
            </View>
          </View>

          {/* Resumo */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Resumo da Consulta</Text>
            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Descreva brevemente o motivo da consulta"
                value={formData.summary}
                onChangeText={(value) => updateField('summary', value)}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Diagnóstico */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Diagnóstico/Avaliação</Text>
            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Diagnóstico ou avaliação feita pelo profissional"
                value={formData.diagnosis}
                onChangeText={(value) => updateField('diagnosis', value)}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Tratamento */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Tratamento Prescrito</Text>
            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Medicamentos, procedimentos ou orientações"
                value={formData.treatment}
                onChangeText={(value) => updateField('treatment', value)}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Observações */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Observações Gerais</Text>
            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Outras informações relevantes"
                value={formData.notes}
                onChangeText={(value) => updateField('notes', value)}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Info */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color={colors.info} />
            <View style={styles.infoContent}>
              <Text style={styles.infoText}>
                Após salvar, você poderá anexar laudos, exames e áudios na tela de detalhes da consulta.
              </Text>
            </View>
          </View>

          <View style={{ height: 40 }} />
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textWhite,
  },
  scrollView: {
    flex: 1,
  },
  content: {
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
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    minWidth: '47%',
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
    backgroundColor: colors.textWhite,
  },
  typeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
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
    paddingVertical: 12,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  textAreaWrapper: {
    alignItems: 'flex-start',
    minHeight: 100,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.info + '10',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.info + '30',
    marginTop: 8,
  },
  infoContent: {
    flex: 1,
  },
  infoText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
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

export default AddConsultationScreen;


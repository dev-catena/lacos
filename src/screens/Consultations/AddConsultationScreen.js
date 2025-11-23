import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import colors from '../../constants/colors';

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

  const [formData, setFormData] = useState({
    type: 'urgency', // urgency, medical, fisioterapia, exames
    title: '',
    doctorName: '',
    location: '',
    date: new Date().toISOString(),
    summary: '',
    diagnosis: '',
    treatment: '',
    notes: '',
  });

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
    if (date) {
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

    if (!groupId) {
      Alert.alert('Erro', 'ID do grupo não foi fornecido');
      return;
    }

    setLoading(true);

    try {
      // TODO: Integrar com API
      // const result = await consultationService.createConsultation({
      //   groupId,
      //   ...formData,
      // });

      Toast.show({
        type: 'success',
        text1: '✅ Consulta registrada!',
        text2: 'Os detalhes foram salvos com sucesso',
        position: 'bottom',
      });

      navigation.goBack();
    } catch (error) {
      console.error('Erro ao salvar consulta:', error);
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
});

export default AddConsultationScreen;


import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
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

const AddOccurrenceScreen = ({ route, navigation }) => {
  const { groupId, groupName, accompaniedName } = route.params || {};
  
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);

  // Tipos de ocorrência predefinidos
  const occurrenceTypes = [
    { id: 'queda', label: 'Queda' },
    { id: 'desnutricao', label: 'Desnutrição' },
    { id: 'escabiose', label: 'Escabiose' },
    { id: 'desidratacao', label: 'Desidratação' },
    { id: 'lesao_pressao', label: 'Lesão por pressão' },
    { id: 'doenca_diarreica', label: 'Doença diarreica aguda' },
    { id: 'outro', label: 'Outro' },
  ];

  const [formData, setFormData] = useState({
    type: '',
    typeLabel: '',
    customType: '',
    date: new Date().toISOString(),
    description: '',
    responsible: '',
    notes: '',
  });

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTypeSelect = (type) => {
    updateField('type', type.id);
    updateField('typeLabel', type.label);
    if (type.id !== 'outro') {
      updateField('customType', '');
    }
    setShowTypeModal(false);
  };

  const handleDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      const currentDate = new Date(formData.date);
      currentDate.setFullYear(date.getFullYear());
      currentDate.setMonth(date.getMonth());
      currentDate.setDate(date.getDate());
      updateField('date', currentDate.toISOString());
    }
  };

  const handleTimeChange = (event, time) => {
    setShowTimePicker(false);
    if (time) {
      const currentDate = new Date(formData.date);
      currentDate.setHours(time.getHours());
      currentDate.setMinutes(time.getMinutes());
      updateField('date', currentDate.toISOString());
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const validateForm = () => {
    if (!formData.type) {
      Toast.show({
        type: 'error',
        text1: 'Tipo obrigatório',
        text2: 'Selecione o tipo de ocorrência',
      });
      return false;
    }

    if (formData.type === 'outro' && !formData.customType.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Tipo personalizado obrigatório',
        text2: 'Descreva o tipo de ocorrência',
      });
      return false;
    }

    if (!formData.description.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Descrição obrigatória',
        text2: 'Descreva detalhadamente o que ocorreu',
      });
      return false;
    }

    if (!formData.responsible.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Responsável obrigatório',
        text2: 'Informe o nome de quem está registrando',
      });
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const occurrenceService = require('../../services/occurrenceService').default;
      
      await occurrenceService.createOccurrence({
        group_id: groupId,
        type: formData.type === 'outro' ? formData.customType : formData.typeLabel,
        type_code: formData.type,
        occurred_at: formData.date,
        description: formData.description,
        responsible: formData.responsible,
        notes: formData.notes,
      });

      Toast.show({
        type: 'success',
        text1: 'Ocorrência registrada',
        text2: 'Registro adicionado ao histórico',
      });

      // Aguardar um pouco para mostrar o toast antes de voltar
      setTimeout(() => {
        navigation.goBack();
      }, 1000);
    } catch (error) {
      console.error('Erro ao registrar ocorrência:', error);
      const errorMessage = error.response?.data?.message || 'Não foi possível registrar a ocorrência';
      Toast.show({
        type: 'error',
        text1: 'Erro ao salvar',
        text2: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.title}>Registrar Ocorrência</Text>
          <Text style={styles.subtitle}>{accompaniedName || groupName}</Text>
        </View>
        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          style={styles.saveButton}
        >
          <Text style={[styles.saveButtonText, loading && styles.saveButtonTextDisabled]}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Tipo de Ocorrência */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Tipo de Ocorrência *</Text>
          <TouchableOpacity
            style={styles.inputWrapper}
            onPress={() => setShowTypeModal(true)}
          >
            <Ionicons name="alert-circle-outline" size={20} color={colors.gray400} />
            <Text style={[
              styles.input,
              !formData.typeLabel && styles.placeholder
            ]}>
              {formData.typeLabel || 'Selecione o tipo...'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.gray400} />
          </TouchableOpacity>
        </View>

        {/* Campo customizado se "Outro" */}
        {formData.type === 'outro' && (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Especifique o Tipo *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="create-outline" size={20} color={colors.gray400} />
              <TextInput
                style={styles.input}
                placeholder="Ex: Intoxicação alimentar"
                value={formData.customType}
                onChangeText={(value) => updateField('customType', value)}
                placeholderTextColor={colors.gray400}
              />
            </View>
          </View>
        )}

        {/* Data e Hora */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Data e Hora da Ocorrência *</Text>
          <View style={styles.dateTimeRow}>
            <TouchableOpacity
              style={[styles.inputWrapper, { flex: 1 }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color={colors.gray400} />
              <Text style={styles.dateText}>{formatDate(formData.date)}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.inputWrapper, { flex: 1 }]}
              onPress={() => setShowTimePicker(true)}
            >
              <Ionicons name="time-outline" size={20} color={colors.gray400} />
              <Text style={styles.dateText}>{formatTime(formData.date)}</Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={new Date(formData.date)}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={new Date(formData.date)}
              mode="time"
              display="default"
              onChange={handleTimeChange}
            />
          )}
        </View>

        {/* Descrição */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Descrição Detalhada *</Text>
          <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
            <Ionicons name="document-text-outline" size={20} color={colors.gray400} style={{ alignSelf: 'flex-start', marginTop: 12 }} />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Descreva detalhadamente o que ocorreu..."
              value={formData.description}
              onChangeText={(value) => updateField('description', value)}
              placeholderTextColor={colors.gray400}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        {/* Responsável */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Responsável pelo Registro *</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={20} color={colors.gray400} />
            <TextInput
              style={styles.input}
              placeholder="Nome completo"
              value={formData.responsible}
              onChangeText={(value) => updateField('responsible', value)}
              placeholderTextColor={colors.gray400}
            />
          </View>
        </View>

        {/* Observações */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Observações Adicionais</Text>
          <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
            <Ionicons name="chatbox-outline" size={20} color={colors.gray400} style={{ alignSelf: 'flex-start', marginTop: 12 }} />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Informações complementares (opcional)..."
              value={formData.notes}
              onChangeText={(value) => updateField('notes', value)}
              placeholderTextColor={colors.gray400}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={colors.info} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Uso institucional</Text>
            <Text style={styles.infoText}>
              Este registro será utilizado para relatórios e pode ser solicitado por órgãos fiscalizadores.
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal de Tipos */}
      <Modal
        visible={showTypeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tipo de Ocorrência</Text>
              <TouchableOpacity
                onPress={() => setShowTypeModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={occurrenceTypes}
              keyExtractor={(item) => item.id}
              style={styles.flatList}
              contentContainerStyle={styles.flatListContent}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.typeItem,
                    formData.type === item.id && styles.typeItemSelected
                  ]}
                  onPress={() => handleTypeSelect(item)}
                >
                  <Text style={[
                    styles.typeItemText,
                    formData.type === item.id && styles.typeItemTextSelected
                  ]}>
                    {item.label}
                  </Text>
                  {formData.type === item.id && (
                    <Ionicons name="checkmark" size={24} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
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
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray600,
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
  saveButtonTextDisabled: {
    color: colors.gray400,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.gray200,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  placeholder: {
    color: colors.gray400,
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
    minHeight: 120,
  },
  textArea: {
    minHeight: 100,
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
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.info,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: colors.gray600,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
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
  typeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  typeItemSelected: {
    backgroundColor: '#E3F2FD',
  },
  typeItemText: {
    fontSize: 16,
    color: colors.text,
  },
  typeItemTextSelected: {
    fontWeight: '600',
    color: colors.primary,
  },
  separator: {
    height: 1,
    backgroundColor: colors.gray100,
  },
});

export default AddOccurrenceScreen;


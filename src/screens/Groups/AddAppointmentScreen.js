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
  Switch,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import { AppointmentIcon, LocationIcon } from '../../components/CustomIcons';

const AddAppointmentScreen = ({ route, navigation }) => {
  const { groupId, groupName } = route.params || {};
  
  const [loading, setLoading] = useState(false);
  
  // Dados do compromisso
  const [formData, setFormData] = useState({
    title: '',
    type: 'common', // common ou medical
    date: new Date().toISOString(),
    duration: '60',
    address: '',
    notes: '',
    selectedDoctor: null,
    recurrenceType: 'none', // none, daily, weekdays, custom
    recurrenceDays: [], // [0,1,2,3,4,5,6]
    recurrenceStart: new Date().toISOString(),
    recurrenceEnd: '',
    reminderOption: '3', // Opções pré-definidas
  });

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Atenção', 'Digite um título para o compromisso');
      return;
    }

    setLoading(true);

    try {
      // TODO: Implementar chamada à API
      Alert.alert(
        '✅ Sucesso',
        `Compromisso agendado!\n\n` +
        `Título: ${formData.title}\n` +
        `Tipo: ${formData.type === 'medical' ? 'Consulta Médica' : 'Comum'}\n` +
        `Recorrência: ${formData.recurrenceType}\n\n` +
        `Integração com API em desenvolvimento.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Erro', 'Erro ao agendar compromisso');
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
            </View>

            {/* Data e Hora */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Data e Hora *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="calendar-outline" size={20} color={colors.gray400} />
                <Text style={styles.dateText}>
                  {new Date(formData.date).toLocaleString('pt-BR')}
                </Text>
                <TouchableOpacity>
                  <Ionicons name="create-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.hint}>Toque para editar</Text>
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

            {/* Endereço */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Endereço (opcional)</Text>
              <View style={styles.inputWrapper}>
                <LocationIcon size={20} color={colors.gray400} />
                <TextInput
                  style={styles.input}
                  placeholder="Local do compromisso"
                  value={formData.address}
                  onChangeText={(value) => updateField('address', value)}
                  multiline
                />
              </View>
              <View style={styles.mapButtons}>
                <TouchableOpacity style={styles.mapButton}>
                  <Ionicons name="navigate-outline" size={16} color={colors.info} />
                  <Text style={styles.mapButtonText}>Google Maps</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.mapButton}>
                  <Ionicons name="navigate-outline" size={16} color={colors.info} />
                  <Text style={styles.mapButtonText}>Waze</Text>
                </TouchableOpacity>
              </View>
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
});

export default AddAppointmentScreen;


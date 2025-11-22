import React, { useState, useEffect } from 'react';
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
import colors from '../../constants/colors';
import { VitalSignsIcon } from '../../components/CustomIcons';

const AddVitalSignsScreen = ({ route, navigation }) => {
  const { groupId, groupName, accompaniedPersonId } = route.params || {};
  
  const [loading, setLoading] = useState(false);
  const [recordedAt, setRecordedAt] = useState(new Date().toISOString());
  const [notes, setNotes] = useState('');

  // Valores dos sinais vitais
  const [vitalSigns, setVitalSigns] = useState({
    blood_pressure_systolic: '',
    blood_pressure_diastolic: '',
    heart_rate: '',
    oxygen_saturation: '',
    blood_glucose: '',
    temperature: '',
    respiratory_rate: '',
  });

  // Sinais habilitados (vindo das configurações do grupo)
  const [enabledSigns, setEnabledSigns] = useState({
    blood_pressure: true,
    heart_rate: true,
    oxygen_saturation: true,
    blood_glucose: true,
    temperature: false,
    respiratory_rate: false,
  });

  useEffect(() => {
    // TODO: Carregar configurações do grupo para saber quais sinais estão habilitados
    loadGroupSettings();
  }, [groupId]);

  const loadGroupSettings = async () => {
    // TODO: Implementar chamada à API
    // const response = await fetch(`${API_CONFIG.BASE_URL}/groups/${groupId}/settings`);
    // const data = await response.json();
    // setEnabledSigns({ ... });
  };

  const updateVitalSign = (key, value) => {
    setVitalSigns(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const validateInputs = () => {
    // Verificar se pelo menos um sinal foi preenchido
    const hasAnyValue = Object.entries(vitalSigns).some(([key, value]) => {
      if (key.includes('pressure')) {
        return vitalSigns.blood_pressure_systolic || vitalSigns.blood_pressure_diastolic;
      }
      return value.trim() !== '';
    });

    if (!hasAnyValue) {
      Alert.alert('Atenção', 'Preencha pelo menos um sinal vital');
      return false;
    }

    // Validar pressão arterial (ambos campos devem estar preenchidos ou ambos vazios)
    if (enabledSigns.blood_pressure) {
      const hasSystolic = vitalSigns.blood_pressure_systolic.trim() !== '';
      const hasDiastolic = vitalSigns.blood_pressure_diastolic.trim() !== '';
      
      if (hasSystolic !== hasDiastolic) {
        Alert.alert('Atenção', 'Preencha ambos os valores da pressão arterial (ex: 120/80)');
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateInputs()) {
      return;
    }

    setLoading(true);

    try {
      // Preparar array de sinais vitais para enviar
      const vitalSignsToSend = [];

      // Pressão arterial
      if (enabledSigns.blood_pressure && vitalSigns.blood_pressure_systolic && vitalSigns.blood_pressure_diastolic) {
        vitalSignsToSend.push({
          type: 'blood_pressure',
          value: `${vitalSigns.blood_pressure_systolic}/${vitalSigns.blood_pressure_diastolic}`,
          unit: 'mmHg',
        });
      }

      // Frequência cardíaca
      if (enabledSigns.heart_rate && vitalSigns.heart_rate) {
        vitalSignsToSend.push({
          type: 'heart_rate',
          value: vitalSigns.heart_rate,
          unit: 'bpm',
        });
      }

      // Saturação de oxigênio
      if (enabledSigns.oxygen_saturation && vitalSigns.oxygen_saturation) {
        vitalSignsToSend.push({
          type: 'oxygen_saturation',
          value: vitalSigns.oxygen_saturation,
          unit: '%',
        });
      }

      // Glicemia
      if (enabledSigns.blood_glucose && vitalSigns.blood_glucose) {
        vitalSignsToSend.push({
          type: 'blood_glucose',
          value: vitalSigns.blood_glucose,
          unit: 'mg/dL',
        });
      }

      // Temperatura
      if (enabledSigns.temperature && vitalSigns.temperature) {
        vitalSignsToSend.push({
          type: 'temperature',
          value: vitalSigns.temperature,
          unit: '°C',
        });
      }

      // Frequência respiratória
      if (enabledSigns.respiratory_rate && vitalSigns.respiratory_rate) {
        vitalSignsToSend.push({
          type: 'respiratory_rate',
          value: vitalSigns.respiratory_rate,
          unit: 'ipm',
        });
      }

      // TODO: Implementar chamada à API
      const alertsFound = Math.random() > 0.7; // Mock

      Alert.alert(
        alertsFound ? '⚠️ Atenção!' : '✅ Sucesso',
        alertsFound 
          ? `Sinais vitais registrados!\n\n${vitalSignsToSend.length} medições salvas.\n\n⚠️ Alguns valores estão fora da faixa normal.\n\nIntegração com API em desenvolvimento.`
          : `Sinais vitais registrados!\n\n${vitalSignsToSend.length} medições salvas.\n\nTodos os valores estão normais.\n\nIntegração com API em desenvolvimento.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );

    } catch (error) {
      Alert.alert('Erro', 'Erro ao registrar sinais vitais');
    } finally {
      setLoading(false);
    }
  };

  const vitalSignsConfig = [
    {
      key: 'blood_pressure',
      enabled: enabledSigns.blood_pressure,
      label: 'Pressão Arterial',
      icon: 'pulse',
      color: colors.error,
      fields: [
        {
          key: 'blood_pressure_systolic',
          placeholder: '120',
          label: 'Sistólica',
          width: '48%',
        },
        {
          key: 'blood_pressure_diastolic',
          placeholder: '80',
          label: 'Diastólica',
          width: '48%',
        },
      ],
      unit: 'mmHg',
      hint: 'Ex: 120/80 mmHg',
    },
    {
      key: 'heart_rate',
      enabled: enabledSigns.heart_rate,
      label: 'Frequência Cardíaca',
      icon: 'heart',
      color: colors.secondary,
      fields: [
        {
          key: 'heart_rate',
          placeholder: '75',
          width: '100%',
        },
      ],
      unit: 'bpm',
      hint: 'Ex: 75 bpm',
    },
    {
      key: 'oxygen_saturation',
      enabled: enabledSigns.oxygen_saturation,
      label: 'Saturação de Oxigênio',
      icon: 'water',
      color: colors.info,
      fields: [
        {
          key: 'oxygen_saturation',
          placeholder: '96',
          width: '100%',
        },
      ],
      unit: '%',
      hint: 'Ex: 96%',
    },
    {
      key: 'blood_glucose',
      enabled: enabledSigns.blood_glucose,
      label: 'Glicemia',
      icon: 'fitness',
      color: colors.warning,
      fields: [
        {
          key: 'blood_glucose',
          placeholder: '90',
          width: '100%',
        },
      ],
      unit: 'mg/dL',
      hint: 'Ex: 90 mg/dL',
    },
    {
      key: 'temperature',
      enabled: enabledSigns.temperature,
      label: 'Temperatura Corporal',
      icon: 'thermometer',
      color: colors.success,
      fields: [
        {
          key: 'temperature',
          placeholder: '36.5',
          width: '100%',
        },
      ],
      unit: '°C',
      hint: 'Ex: 36.5°C',
    },
    {
      key: 'respiratory_rate',
      enabled: enabledSigns.respiratory_rate,
      label: 'Frequência Respiratória',
      icon: 'leaf',
      color: colors.primary,
      fields: [
        {
          key: 'respiratory_rate',
          placeholder: '16',
          width: '100%',
        },
      ],
      unit: 'ipm',
      hint: 'Ex: 16 ipm (incursões por minuto)',
    },
  ];

  const formatDateTime = (date) => {
    const d = new Date(date);
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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
            <Text style={styles.headerTitle}>Adicionar Sinais Vitais</Text>
            <Text style={styles.headerSubtitle}>{groupName || 'Grupo'}</Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
          <View style={styles.content}>
            {/* Ícone Principal */}
            <View style={styles.iconContainer}>
              <VitalSignsIcon size={48} color={colors.primary} />
            </View>

            <Text style={styles.title}>Registrar Medições</Text>
            <Text style={styles.subtitle}>
              Preencha os sinais vitais medidos. Apenas os campos habilitados nas configurações
              do grupo estão disponíveis.
            </Text>

            {/* Data e Hora */}
            <View style={styles.dateTimeContainer}>
              <Ionicons name="time-outline" size={20} color={colors.textLight} />
              <Text style={styles.dateTimeLabel}>Data e hora da medição:</Text>
              <Text style={styles.dateTimeValue}>{formatDateTime(recordedAt)}</Text>
            </View>

            {/* Sinais Vitais */}
            {vitalSignsConfig.map((item) => {
              if (!item.enabled) return null;

              return (
                <View key={item.key} style={styles.vitalSignCard}>
                  <View style={styles.vitalSignHeader}>
                    <View style={[styles.vitalSignIcon, { backgroundColor: item.color + '20' }]}>
                      <Ionicons name={item.icon} size={24} color={item.color} />
                    </View>
                    <View style={styles.vitalSignInfo}>
                      <Text style={styles.vitalSignLabel}>{item.label}</Text>
                      <Text style={styles.vitalSignHint}>{item.hint}</Text>
                    </View>
                  </View>

                  <View style={styles.fieldsContainer}>
                    {item.fields.map((field) => (
                      <View key={field.key} style={[styles.inputGroup, { width: field.width }]}>
                        {field.label && (
                          <Text style={styles.fieldLabel}>{field.label}</Text>
                        )}
                        <View style={[styles.inputWrapper, { borderColor: item.color + '40' }]}>
                          <TextInput
                            style={styles.input}
                            placeholder={field.placeholder}
                            placeholderTextColor={colors.gray400}
                            value={vitalSigns[field.key]}
                            onChangeText={(value) => updateVitalSign(field.key, value)}
                            keyboardType="numeric"
                          />
                          {!field.label && (
                            <Text style={styles.unitText}>{item.unit}</Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}

            {/* Observações */}
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Observações (opcional)</Text>
              <View style={styles.notesWrapper}>
                <TextInput
                  style={styles.notesInput}
                  placeholder="Adicione observações sobre as medições..."
                  placeholderTextColor={colors.gray400}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                  maxLength={500}
                />
              </View>
              <Text style={styles.charCount}>{notes.length}/500</Text>
            </View>

            {/* Info Card */}
            <View style={styles.infoCard}>
              <Ionicons name="information-circle" size={24} color={colors.info} />
              <View style={styles.infoContent}>
                <Text style={styles.infoText}>
                  Os valores serão avaliados automaticamente. Se algum estiver fora da faixa normal,
                  você será notificado e um alerta será registrado na timeline.
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
                  <Text style={styles.saveButtonText}>Salvar Medições</Text>
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
    marginBottom: 24,
    lineHeight: 22,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  dateTimeLabel: {
    fontSize: 14,
    color: colors.textLight,
  },
  dateTimeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    textAlign: 'right',
  },
  vitalSignCard: {
    backgroundColor: colors.backgroundLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  vitalSignHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  vitalSignIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  vitalSignInfo: {
    flex: 1,
  },
  vitalSignLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  vitalSignHint: {
    fontSize: 13,
    color: colors.textLight,
  },
  fieldsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  inputGroup: {
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 13,
    color: colors.textLight,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 2,
    paddingHorizontal: 12,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  unitText: {
    fontSize: 14,
    color: colors.textLight,
    marginLeft: 8,
  },
  notesContainer: {
    marginBottom: 16,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  notesWrapper: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  notesInput: {
    fontSize: 15,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'right',
    marginTop: 4,
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

export default AddVitalSignsScreen;


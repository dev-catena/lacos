import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import colors from '../../constants/colors';
import AdvancedFrequencyModal from './AdvancedFrequencyModal';
import { scheduleMedicationNotifications } from '../../services/notificationService';
import medicationService from '../../services/medicationService';

// Dados de autocomplete
const COMMON_MEDICATIONS = [
  'Losartana', 'Sinvastatina', 'Omeprazol', 'Metformina', 'Enalapril',
  'Atenolol', 'Hidroclorotiazida', 'Captopril', 'Levotiroxina', 'Amoxicilina'
];

const PHARMACEUTICAL_FORMS = [
  'Comprimido', 'Cápsula', 'Solução oral', 'Gotas', 'Xarope',
  'Injetável', 'Pomada', 'Creme', 'Supositório', 'Adesivo'
];

const UNITS = ['mg', 'mL', 'g', 'UI', 'mcg', '%'];

const ROUTES = ['Oral', 'Sublingual', 'Nasal', 'Tópica', 'Intravenosa', 'Intramuscular'];

const FREQUENCIES = [
  { label: '1x ao dia', value: '24', times: 1 },
  { label: '12 em 12 horas', value: '12', times: 2 },
  { label: '8 em 8 horas', value: '8', times: 3 },
  { label: '6 em 6 horas', value: '6', times: 4 },
  { label: 'Outros', value: 'advanced', times: null, icon: 'settings-outline' },
];

const AddMedicationScreen = ({ route, navigation }) => {
  let { groupId, groupName, prescriptionId } = route.params;
  
  // TEMPORÁRIO: Se groupId é um timestamp, usar o grupo de teste
  if (groupId && groupId > 999999999999) {
    groupId = 1;
  }

  const [name, setName] = useState('');
  const [form, setForm] = useState('');
  const [dosage, setDosage] = useState('');
  const [unit, setUnit] = useState('mg');
  const [administrationRoute, setAdministrationRoute] = useState('Oral');
  const [frequency, setFrequency] = useState('24');
  const [firstDoseTime, setFirstDoseTime] = useState('08:00');
  const [instructions, setInstructions] = useState('');
  const [durationType, setDurationType] = useState('continuo'); // continuo ou temporario
  const [durationDays, setDurationDays] = useState('');
  const [advancedFrequency, setAdvancedFrequency] = useState(null);
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);

  const [saving, setSaving] = useState(false);

  const handleAdvancedFrequencyConfirm = (config) => {
    setAdvancedFrequency(config);
    setFrequency('advanced');
  };

  const handleFrequencyChange = (value) => {
    if (value === 'advanced') {
      setShowAdvancedModal(true);
    } else {
      setFrequency(value);
      setAdvancedFrequency(null);
    }
  };

  const getFrequencyLabel = () => {
    if (frequency === 'advanced' && advancedFrequency) {
      switch (advancedFrequency.type) {
        case 'alternating':
          return 'Dias intercalados';
        case 'specific_days':
          return `Dias específicos (${advancedFrequency.weekdays.length} dias/semana)`;
        case 'cycles':
          return `Ciclos (${advancedFrequency.cycleDays} dias on, ${advancedFrequency.pauseDays} dias off)`;
        case 'every_n_days':
          return `A cada ${advancedFrequency.interval} dias`;
        case 'every_n_weeks':
          return `A cada ${advancedFrequency.interval} semanas`;
        case 'every_n_months':
          return `A cada ${advancedFrequency.interval} meses`;
        default:
          return 'Frequência personalizada';
      }
    }
    const freq = FREQUENCIES.find(f => f.value === frequency);
    return freq ? freq.label : 'Frequência personalizada';
  };

  const handleSave = async () => {
    // Validações
    if (!name.trim()) {
      Alert.alert('Erro', 'Digite o nome do medicamento');
      return;
    }
    if (!form.trim()) {
      Alert.alert('Erro', 'Selecione a forma farmacêutica');
      return;
    }
    if (!dosage.trim()) {
      Alert.alert('Erro', 'Digite a dosagem');
      return;
    }

    try {
      setSaving(true);

      // Gerar horários baseado na frequência
      const schedule = generateSchedule(firstDoseTime, frequency);

      // Preparar dados para API
      const medicationData = {
        groupId: groupId,
        name: name.trim(),
        form: form.trim(),
        dosage: dosage.trim(),
        unit: unit,
        administrationRoute: administrationRoute,
        frequencyType: frequency === 'advanced' ? 'advanced' : 'simple',
        frequencyDetails: frequency === 'advanced' 
          ? JSON.stringify(advancedFrequency) 
          : JSON.stringify({ interval: frequency, schedule }),
        firstDoseAt: `${new Date().toISOString().split('T')[0]} ${firstDoseTime}:00`,
        durationType: durationType,
        durationValue: durationType === 'temporario' ? parseInt(durationDays) : null,
        notes: instructions.trim() || null,
        isActive: true,
      };

      const result = await medicationService.createMedication(medicationData);

      if (result.success) {
        // Agendar notificações locais
        try {
          const medication = {
            id: result.data.id,
            name: name.trim(),
            frequency,
            schedule,
            advancedFrequency: frequency === 'advanced' ? advancedFrequency : null,
          };
          await scheduleMedicationNotifications(medication);
        } catch (notifError) {
          console.error('Erro ao agendar notificações:', notifError);
          // Não bloqueia o salvamento
        }

        Toast.show({
          type: 'success',
          text1: 'Medicamento cadastrado',
          text2: `${name} foi adicionado com sucesso`,
          position: 'bottom',
        });

        navigation.goBack();
        navigation.goBack(); // Voltar para a tela de medicamentos
      } else {
        Alert.alert('Erro', result.error || 'Não foi possível salvar o medicamento');
      }
    } catch (error) {
      console.error('Erro ao salvar medicamento:', error);
      Alert.alert('Erro', 'Não foi possível salvar o medicamento');
    } finally {
      setSaving(false);
    }
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

  return (
    <SafeAreaView style={styles.container}>
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
          <Text style={styles.title}>Cadastrar Remédio</Text>
          <Text style={styles.subtitle}>{groupName}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          {/* Nome do Medicamento */}
          <View style={styles.field}>
            <Text style={styles.label}>Nome do medicamento *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Losartana"
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Forma Farmacêutica */}
          <View style={styles.field}>
            <Text style={styles.label}>Forma farmacêutica *</Text>
            <View style={styles.chipContainer}>
              {PHARMACEUTICAL_FORMS.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.chip, form === item && styles.chipActive]}
                  onPress={() => setForm(item)}
                >
                  <Text style={[styles.chipText, form === item && styles.chipTextActive]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Dosagem */}
          <View style={styles.row}>
            <View style={[styles.field, { flex: 2 }]}>
              <Text style={styles.label}>Dosagem *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 50"
                value={dosage}
                onChangeText={setDosage}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Unidade *</Text>
              <View style={styles.chipContainer}>
                {UNITS.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[styles.chip, styles.chipSmall, unit === item && styles.chipActive]}
                    onPress={() => setUnit(item)}
                  >
                    <Text style={[styles.chipText, unit === item && styles.chipTextActive]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Via de Administração */}
          <View style={styles.field}>
            <Text style={styles.label}>Via de administração</Text>
            <View style={styles.chipContainer}>
              {ROUTES.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.chip, administrationRoute === item && styles.chipActive]}
                  onPress={() => setAdministrationRoute(item)}
                >
                  <Text style={[styles.chipText, administrationRoute === item && styles.chipTextActive]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Instruções */}
          <View style={styles.field}>
            <Text style={styles.label}>Instruções de uso</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Ex: Em jejum, após as refeições..."
              value={instructions}
              onChangeText={setInstructions}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Frequência */}
          <View style={styles.field}>
            <Text style={styles.label}>Frequência *</Text>
            <View style={styles.frequencyContainer}>
              {FREQUENCIES.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.frequencyButton,
                    frequency === item.value && styles.frequencyButtonActive,
                    item.value === 'advanced' && styles.frequencyButtonAdvanced
                  ]}
                  onPress={() => handleFrequencyChange(item.value)}
                >
                  {item.icon && (
                    <Ionicons 
                      name={item.icon} 
                      size={20} 
                      color={frequency === item.value ? colors.primary : colors.textLight} 
                    />
                  )}
                  <Text style={[
                    styles.frequencyButtonText,
                    frequency === item.value && styles.frequencyButtonTextActive
                  ]}>
                    {item.label}
                  </Text>
                  {item.times !== null && (
                    <Text style={[
                      styles.frequencyButtonSubtext,
                      frequency === item.value && styles.frequencyButtonSubtextActive
                    ]}>
                      {item.times}x por dia
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
            {frequency === 'advanced' && advancedFrequency && (
              <View style={styles.advancedFrequencyInfo}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={styles.advancedFrequencyText}>
                  {getFrequencyLabel()}
                </Text>
                <TouchableOpacity onPress={() => setShowAdvancedModal(true)}>
                  <Ionicons name="create-outline" size={20} color={colors.primary} />
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
              value={firstDoseTime}
              onChangeText={setFirstDoseTime}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
              editable={true}
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
                  durationType === 'continuo' && styles.durationButtonActive
                ]}
                onPress={() => setDurationType('continuo')}
              >
                <Ionicons 
                  name="infinite" 
                  size={24} 
                  color={durationType === 'continuo' ? colors.primary : colors.textLight} 
                />
                <Text style={[
                  styles.durationButtonText,
                  durationType === 'continuo' && styles.durationButtonTextActive
                ]}>
                  Uso contínuo
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.durationButton,
                  durationType === 'temporario' && styles.durationButtonActive
                ]}
                onPress={() => setDurationType('temporario')}
              >
                <Ionicons 
                  name="calendar" 
                  size={24} 
                  color={durationType === 'temporario' ? colors.primary : colors.textLight} 
                />
                <Text style={[
                  styles.durationButtonText,
                  durationType === 'temporario' && styles.durationButtonTextActive
                ]}>
                  Prazo definido
                </Text>
              </TouchableOpacity>
            </View>
            {durationType === 'temporario' && (
              <TextInput
                style={[styles.input, { marginTop: 12 }]}
                placeholder="Número de dias"
                value={durationDays}
                onChangeText={setDurationDays}
                keyboardType="numeric"
              />
            )}
          </View>

          {/* Preview */}
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>📋 Resumo do cadastro</Text>
            <Text style={styles.previewText}>
              <Text style={styles.previewLabel}>Medicamento: </Text>
              {name || '—'}
            </Text>
            <Text style={styles.previewText}>
              <Text style={styles.previewLabel}>Dosagem: </Text>
              {dosage} {unit} - {form}
            </Text>
            <Text style={styles.previewText}>
              <Text style={styles.previewLabel}>Frequência: </Text>
              A cada {frequency} horas
            </Text>
            <Text style={styles.previewText}>
              <Text style={styles.previewLabel}>Horários: </Text>
              {generateSchedule(firstDoseTime, frequency).join(', ')}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Ionicons name="checkmark-circle" size={24} color={colors.textWhite} />
            <Text style={styles.saveButtonText}>
              {saving ? 'Salvando...' : 'Salvar Medicamento'}
            </Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>

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
    color: colors.textLight,
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  form: {
    padding: 20,
  },
  field: {
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 6,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chipSmall: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 14,
    color: colors.text,
  },
  chipTextActive: {
    color: colors.textWhite,
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
  frequencyButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  frequencyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  frequencyButtonTextActive: {
    color: colors.primary,
  },
  frequencyButtonSubtext: {
    fontSize: 12,
    color: colors.textLight,
  },
  frequencyButtonSubtextActive: {
    color: colors.primary,
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
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  durationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
  },
  durationButtonTextActive: {
    color: colors.primary,
  },
  previewCard: {
    backgroundColor: colors.info + '10',
    borderWidth: 1,
    borderColor: colors.info + '40',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
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
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.primary,
    padding: 18,
    borderRadius: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textWhite,
  },
});

export default AddMedicationScreen;


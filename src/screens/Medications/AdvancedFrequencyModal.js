import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';

const FREQUENCY_TYPES = [
  { key: 'alternating', label: 'Dias Intercalados', icon: 'swap-horizontal', description: 'Ex: Dia sim, dia não' },
  { key: 'specific_days', label: 'Dias Específicos', icon: 'calendar', description: 'Ex: Segunda e quarta' },
  { key: 'cycles', label: 'Ciclos', icon: 'repeat', description: 'Ex: 5 dias toma, 2 dias pausa' },
  { key: 'every_n_days', label: 'A cada N dias', icon: 'time', description: 'Ex: A cada 3 dias' },
  { key: 'every_n_weeks', label: 'A cada N semanas', icon: 'calendar-outline', description: 'Ex: A cada 2 semanas' },
  { key: 'every_n_months', label: 'A cada N meses', icon: 'calendar-outline', description: 'Ex: A cada 1 mês' },
];

const WEEKDAYS = [
  { key: 0, label: 'Dom', fullLabel: 'Domingo' },
  { key: 1, label: 'Seg', fullLabel: 'Segunda' },
  { key: 2, label: 'Ter', fullLabel: 'Terça' },
  { key: 3, label: 'Qua', fullLabel: 'Quarta' },
  { key: 4, label: 'Qui', fullLabel: 'Quinta' },
  { key: 5, label: 'Sex', fullLabel: 'Sexta' },
  { key: 6, label: 'Sáb', fullLabel: 'Sábado' },
];

const AdvancedFrequencyModal = ({ visible, onClose, onConfirm }) => {
  const [selectedType, setSelectedType] = useState(null);
  
  // Para dias intercalados
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Para dias específicos
  const [selectedWeekdays, setSelectedWeekdays] = useState([]);
  
  // Para ciclos
  const [cycleDays, setCycleDays] = useState('');
  const [pauseDays, setPauseDays] = useState('');
  
  // Para a cada N dias/semanas/meses
  const [intervalValue, setIntervalValue] = useState('');
  const [intervalStartDate, setIntervalStartDate] = useState(new Date().toISOString().split('T')[0]);

  const handleWeekdayToggle = (day) => {
    if (selectedWeekdays.includes(day)) {
      setSelectedWeekdays(selectedWeekdays.filter(d => d !== day));
    } else {
      setSelectedWeekdays([...selectedWeekdays, day].sort());
    }
  };

  const handleConfirm = () => {
    let config = {
      type: selectedType,
    };

    switch (selectedType) {
      case 'alternating':
        config.startDate = startDate;
        break;
      
      case 'specific_days':
        config.weekdays = selectedWeekdays;
        break;
      
      case 'cycles':
        config.cycleDays = parseInt(cycleDays);
        config.pauseDays = parseInt(pauseDays);
        config.startDate = startDate;
        break;
      
      case 'every_n_days':
        config.interval = parseInt(intervalValue);
        config.startDate = intervalStartDate;
        break;
      
      case 'every_n_weeks':
        config.interval = parseInt(intervalValue);
        config.startDate = intervalStartDate;
        config.weekday = new Date(intervalStartDate).getDay();
        break;
      
      case 'every_n_months':
        config.interval = parseInt(intervalValue);
        config.startDate = intervalStartDate;
        config.dayOfMonth = new Date(intervalStartDate).getDate();
        break;
    }

    onConfirm(config);
    onClose();
  };

  const isValid = () => {
    switch (selectedType) {
      case 'alternating':
        return startDate !== '';
      case 'specific_days':
        return selectedWeekdays.length > 0;
      case 'cycles':
        return cycleDays !== '' && pauseDays !== '';
      case 'every_n_days':
      case 'every_n_weeks':
      case 'every_n_months':
        return intervalValue !== '' && intervalStartDate !== '';
      default:
        return false;
    }
  };

  const renderConfiguration = () => {
    switch (selectedType) {
      case 'alternating':
        return (
          <View style={styles.configSection}>
            <Text style={styles.configTitle}>📅 Data de Início</Text>
            <Text style={styles.configDescription}>
              A medicação será tomada em dias alternados a partir desta data
            </Text>
            <TextInput
              style={styles.input}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="YYYY-MM-DD"
            />
            <View style={styles.preview}>
              <Text style={styles.previewText}>
                Padrão: Dia sim, dia não, iniciando em {new Date(startDate).toLocaleDateString('pt-BR')}
              </Text>
            </View>
          </View>
        );

      case 'specific_days':
        return (
          <View style={styles.configSection}>
            <Text style={styles.configTitle}>📆 Selecione os Dias da Semana</Text>
            <Text style={styles.configDescription}>
              A medicação será tomada apenas nos dias selecionados
            </Text>
            <View style={styles.weekdaysContainer}>
              {WEEKDAYS.map((day) => (
                <TouchableOpacity
                  key={day.key}
                  style={[
                    styles.weekdayButton,
                    selectedWeekdays.includes(day.key) && styles.weekdayButtonActive
                  ]}
                  onPress={() => handleWeekdayToggle(day.key)}
                >
                  <Text style={[
                    styles.weekdayText,
                    selectedWeekdays.includes(day.key) && styles.weekdayTextActive
                  ]}>
                    {day.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {selectedWeekdays.length > 0 && (
              <View style={styles.preview}>
                <Text style={styles.previewText}>
                  Medicação será tomada: {selectedWeekdays.map(d => WEEKDAYS[d].fullLabel).join(', ')}
                </Text>
              </View>
            )}
          </View>
        );

      case 'cycles':
        return (
          <View style={styles.configSection}>
            <Text style={styles.configTitle}>🔄 Configurar Ciclo</Text>
            <Text style={styles.configDescription}>
              Defina quantos dias toma e quantos dias pausa
            </Text>
            
            <View style={styles.row}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Dias tomando</Text>
                <TextInput
                  style={styles.input}
                  value={cycleDays}
                  onChangeText={setCycleDays}
                  placeholder="Ex: 5"
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Dias de pausa</Text>
                <TextInput
                  style={styles.input}
                  value={pauseDays}
                  onChangeText={setPauseDays}
                  placeholder="Ex: 2"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Data de início</Text>
              <TextInput
                style={styles.input}
                value={startDate}
                onChangeText={setStartDate}
                placeholder="YYYY-MM-DD"
              />
            </View>

            {cycleDays && pauseDays && (
              <View style={styles.preview}>
                <Text style={styles.previewText}>
                  Padrão: {cycleDays} dias tomando, {pauseDays} dias de pausa
                </Text>
              </View>
            )}
          </View>
        );

      case 'every_n_days':
        return (
          <View style={styles.configSection}>
            <Text style={styles.configTitle}>⏱️ A Cada N Dias</Text>
            <Text style={styles.configDescription}>
              A medicação será tomada com intervalos de dias entre cada dose
            </Text>
            
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Intervalo (dias)</Text>
              <TextInput
                style={styles.input}
                value={intervalValue}
                onChangeText={setIntervalValue}
                placeholder="Ex: 3"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Primeira dose em</Text>
              <TextInput
                style={styles.input}
                value={intervalStartDate}
                onChangeText={setIntervalStartDate}
                placeholder="YYYY-MM-DD"
              />
            </View>

            {intervalValue && (
              <View style={styles.preview}>
                <Text style={styles.previewText}>
                  Medicação a cada {intervalValue} dias
                </Text>
              </View>
            )}
          </View>
        );

      case 'every_n_weeks':
        return (
          <View style={styles.configSection}>
            <Text style={styles.configTitle}>📅 A Cada N Semanas</Text>
            <Text style={styles.configDescription}>
              A medicação será tomada no mesmo dia da semana, a cada N semanas
            </Text>
            
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Intervalo (semanas)</Text>
              <TextInput
                style={styles.input}
                value={intervalValue}
                onChangeText={setIntervalValue}
                placeholder="Ex: 2"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Primeira dose em</Text>
              <TextInput
                style={styles.input}
                value={intervalStartDate}
                onChangeText={setIntervalStartDate}
                placeholder="YYYY-MM-DD"
              />
            </View>

            {intervalValue && intervalStartDate && (
              <View style={styles.preview}>
                <Text style={styles.previewText}>
                  A cada {intervalValue} semanas, sempre {WEEKDAYS[new Date(intervalStartDate).getDay()].fullLabel}
                </Text>
              </View>
            )}
          </View>
        );

      case 'every_n_months':
        return (
          <View style={styles.configSection}>
            <Text style={styles.configTitle}>📆 A Cada N Meses</Text>
            <Text style={styles.configDescription}>
              A medicação será tomada no mesmo dia do mês, a cada N meses
            </Text>
            
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Intervalo (meses)</Text>
              <TextInput
                style={styles.input}
                value={intervalValue}
                onChangeText={setIntervalValue}
                placeholder="Ex: 1"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Primeira dose em</Text>
              <TextInput
                style={styles.input}
                value={intervalStartDate}
                onChangeText={setIntervalStartDate}
                placeholder="YYYY-MM-DD"
              />
            </View>

            {intervalValue && intervalStartDate && (
              <View style={styles.preview}>
                <Text style={styles.previewText}>
                  A cada {intervalValue} mês(es), sempre no dia {new Date(intervalStartDate).getDate()}
                </Text>
              </View>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Frequência Avançada</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {!selectedType ? (
            <View style={styles.content}>
              <Text style={styles.subtitle}>Selecione o tipo de frequência:</Text>
              
              {FREQUENCY_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.key}
                  style={styles.typeCard}
                  onPress={() => setSelectedType(type.key)}
                >
                  <View style={styles.typeIcon}>
                    <Ionicons name={type.icon} size={28} color={colors.primary} />
                  </View>
                  <View style={styles.typeInfo}>
                    <Text style={styles.typeLabel}>{type.label}</Text>
                    <Text style={styles.typeDescription}>{type.description}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color={colors.gray400} />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.content}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setSelectedType(null)}
              >
                <Ionicons name="arrow-back" size={20} color={colors.primary} />
                <Text style={styles.backButtonText}>Voltar</Text>
              </TouchableOpacity>

              {renderConfiguration()}

              <TouchableOpacity
                style={[styles.confirmButton, !isValid() && styles.confirmButtonDisabled]}
                onPress={handleConfirm}
                disabled={!isValid()}
              >
                <Ionicons name="checkmark-circle" size={24} color={colors.textWhite} />
                <Text style={styles.confirmButtonText}>Confirmar Frequência</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
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
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  typeInfo: {
    flex: 1,
  },
  typeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  typeDescription: {
    fontSize: 14,
    color: colors.textLight,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  configSection: {
    marginBottom: 24,
  },
  configTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  configDescription: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 16,
    lineHeight: 20,
  },
  field: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
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
  weekdaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  weekdayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundLight,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekdayButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  weekdayTextActive: {
    color: colors.textWhite,
  },
  preview: {
    backgroundColor: colors.info + '10',
    borderWidth: 1,
    borderColor: colors.info + '40',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  previewText: {
    fontSize: 14,
    color: colors.text,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.primary,
    padding: 18,
    borderRadius: 12,
    marginTop: 24,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textWhite,
  },
});

export default AdvancedFrequencyModal;


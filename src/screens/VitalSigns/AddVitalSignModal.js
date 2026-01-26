import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import colors from '../../constants/colors';
import SafeIcon from '../../components/SafeIcon';
import vitalSignService from '../../services/vitalSignService';
import moment from 'moment';

const AddVitalSignModal = ({ visible, onClose, onSuccess, groupId, groupName }) => {
  const [saving, setSaving] = useState(false);
  const [vitalSigns, setVitalSigns] = useState({
    systolic: '',
    diastolic: '',
    heart_rate: '',
    oxygen_saturation: '',
    blood_glucose: '',
    temperature: '',
    respiratory_rate: '',
  });

  const indicatorsConfig = [
    {
      key: 'blood_pressure',
      label: 'Pressão Arterial',
      icon: 'pulse',
      color: colors.error,
      unit: 'mmHg',
      fields: [
        { key: 'systolic', label: 'Sistólica', placeholder: 'Ex: 120' },
        { key: 'diastolic', label: 'Diastólica', placeholder: 'Ex: 80' },
      ],
    },
    {
      key: 'heart_rate',
      label: 'Frequência Cardíaca',
      icon: 'heart',
      color: colors.secondary,
      unit: 'bpm',
      fields: [{ key: 'heart_rate', label: 'Frequência', placeholder: 'Ex: 72' }],
    },
    {
      key: 'oxygen_saturation',
      label: 'Saturação de Oxigênio',
      icon: 'water',
      color: colors.info,
      unit: '%',
      fields: [{ key: 'oxygen_saturation', label: 'Saturação', placeholder: 'Ex: 98' }],
    },
    {
      key: 'blood_glucose',
      label: 'Glicemia',
      icon: 'fitness',
      color: colors.warning,
      unit: 'mg/dL',
      fields: [{ key: 'blood_glucose', label: 'Glicemia', placeholder: 'Ex: 100' }],
    },
    {
      key: 'temperature',
      label: 'Temperatura',
      icon: 'thermometer',
      color: colors.success,
      unit: '°C',
      fields: [{ key: 'temperature', label: 'Temperatura', placeholder: 'Ex: 36.5' }],
    },
    {
      key: 'respiratory_rate',
      label: 'Frequência Respiratória',
      icon: 'leaf',
      color: colors.primary,
      unit: 'ipm',
      fields: [{ key: 'respiratory_rate', label: 'Frequência', placeholder: 'Ex: 16' }],
    },
  ];

  const handleSave = async () => {
    try {
      setSaving(true);

      // Salvar cada indicador que tiver valor
      const promises = [];

      indicatorsConfig.forEach(indicator => {
        if (indicator.key === 'blood_pressure') {
          if (vitalSigns.systolic && vitalSigns.diastolic) {
            promises.push(
              vitalSignService.createVitalSign({
                groupId,
                type: 'blood_pressure',
                value: {
                  systolic: parseFloat(vitalSigns.systolic),
                  diastolic: parseFloat(vitalSigns.diastolic),
                },
                unit: indicator.unit,
                measuredAt: new Date().toISOString(),
              })
            );
          }
        } else {
          const fieldKey = indicator.fields[0].key;
          const value = vitalSigns[fieldKey];
          if (value && value.trim()) {
            promises.push(
              vitalSignService.createVitalSign({
                groupId,
                type: indicator.key,
                value: parseFloat(value),
                unit: indicator.unit,
                measuredAt: new Date().toISOString(),
              })
            );
          }
        }
      });

      if (promises.length === 0) {
        Alert.alert('Atenção', 'Preencha pelo menos um indicador');
        setSaving(false);
        return;
      }

      await Promise.all(promises);
      
      Alert.alert('Sucesso', 'Medidas registradas com sucesso');
      onSuccess();
      
      // Limpar formulário
      setVitalSigns({
        systolic: '',
        diastolic: '',
        heart_rate: '',
        oxygen_saturation: '',
        blood_glucose: '',
        temperature: '',
        respiratory_rate: '',
      });
    } catch (error) {
      console.error('Erro ao salvar sinais vitais:', error);
      Alert.alert('Erro', 'Não foi possível registrar as medidas');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Adicionar Medida</Text>
              <TouchableOpacity
                onPress={onClose}
                style={styles.modalCloseButton}
              >
                <SafeIcon name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              {indicatorsConfig.map((indicator) => (
                <View key={indicator.key} style={styles.indicatorSection}>
                  <View style={styles.indicatorHeader}>
                    <View style={[styles.indicatorIcon, { backgroundColor: indicator.color + '20' }]}>
                      <SafeIcon name={indicator.icon} size={20} color={indicator.color} />
                    </View>
                    <Text style={styles.indicatorLabel}>{indicator.label}</Text>
                  </View>

                  <View style={styles.fieldsContainer}>
                    {indicator.fields.map((field) => (
                      <View key={field.key} style={styles.field}>
                        <Text style={styles.fieldLabel}>{field.label}</Text>
                        <TextInput
                          style={styles.input}
                          placeholder={field.placeholder}
                          value={vitalSigns[field.key]}
                          onChangeText={(text) => {
                            setVitalSigns(prev => ({
                              ...prev,
                              [field.key]: text,
                            }));
                          }}
                          keyboardType="numeric"
                        />
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? 'Salvando...' : 'Salvar Medidas'}
                </Text>
              </TouchableOpacity>
            </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  modalContent: {
    flex: 1,
    backgroundColor: colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  scrollView: {
    maxHeight: 500,
    paddingHorizontal: 20,
  },
  indicatorSection: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  indicatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  indicatorIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  indicatorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  fieldsContainer: {
    gap: 12,
  },
  field: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  input: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});

export default AddVitalSignModal;


import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import prescriptionService from '../../services/prescriptionService';
import { parseCrm } from '../../utils/crm';
import MedicationAutocomplete from '../../components/MedicationAutocomplete';
import medicationSearchService from '../../services/medicationSearchService';

const RecipeFormScreen = ({ route, navigation }) => {
  const { appointment, patientInfo, doctorInfo, groupId } = route.params || {};
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Dados do Medicamento
    medication: '',
    concentration: '',
    pharmaceuticalForm: '',
    dosage: '',
    treatmentDuration: '',
    // Observações
    notes: '',
  });

  const [errors, setErrors] = useState({});
  
  // Estados para autocomplete de medicamentos
  const [medicationSuggestions, setMedicationSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef(null);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpar erro do campo ao editar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Buscar sugestões de medicamentos
  const handleMedicationNameChange = async (text) => {
    // Atualizar o nome do medicamento
    updateField('medication', text);
    
    // Limpar timeout anterior
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Se o texto tiver menos de 2 caracteres, não buscar
    if (text.length < 2) {
      setMedicationSuggestions([]);
      return;
    }
    
    // Debounce: aguardar 300ms antes de buscar
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSearching(true);
        const results = await medicationSearchService.searchMedications(text, 10);
        setMedicationSuggestions(results);
      } catch (error) {
        console.error('Erro ao buscar medicamentos:', error);
        setMedicationSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  // Quando um medicamento é selecionado do autocomplete
  const handleSelectMedication = (medication) => {
    updateField('medication', medication.name);
    setMedicationSuggestions([]);
  };

  // Cleanup do timeout quando componente desmontar
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.medication.trim()) {
      newErrors.medication = 'Nome do medicamento é obrigatório';
    }

    if (!formData.concentration.trim()) {
      newErrors.concentration = 'Concentração é obrigatória';
    }

    if (!formData.pharmaceuticalForm.trim()) {
      newErrors.pharmaceuticalForm = 'Forma farmacêutica é obrigatória';
    }

    if (!formData.dosage.trim()) {
      newErrors.dosage = 'Posologia é obrigatória';
    }

    if (!formData.treatmentDuration.trim()) {
      newErrors.treatmentDuration = 'Duração do tratamento é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGeneratePDF = async () => {
    if (!validateForm()) {
      Alert.alert('Atenção', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      setLoading(true);

      // Parsear CRM do médico se necessário
      let doctorCrm = '';
      let doctorCrmUf = '';
      
      if (doctorInfo?.crm) {
        // O backend armazena CRM no formato "UF-NUMERO" (ex: "MG-12345")
        // Fazer parse para separar número e UF
        const parsedCrm = parseCrm(doctorInfo.crm);
        doctorCrm = parsedCrm.number || '';
        doctorCrmUf = parsedCrm.uf || '';
      } else if (doctorInfo?.crm_uf) {
        // Se já vier separado (fallback)
        doctorCrm = doctorInfo?.crm || '';
        doctorCrmUf = doctorInfo.crm_uf;
      }

      const prescriptionData = {
        appointment_id: appointment?.id,
        group_id: groupId,
        patient_id: patientInfo?.id,
        doctor_id: doctorInfo?.id,
        // Dados do Medicamento
        medication: formData.medication.trim(),
        concentration: formData.concentration.trim(),
        pharmaceutical_form: formData.pharmaceuticalForm.trim(),
        dosage: formData.dosage.trim(),
        treatment_duration: formData.treatmentDuration.trim(),
        // Observações
        notes: formData.notes.trim(),
        // Dados do paciente (para o PDF)
        patient_name: patientInfo?.name || '',
        patient_cpf: patientInfo?.cpf || '',
        patient_birth_date: patientInfo?.birth_date || '',
        // Dados do médico (para o PDF) - usar valores parseados do CRM
        doctor_name: doctorInfo?.name || '',
        doctor_crm: doctorCrm || '',
        doctor_crm_uf: doctorCrmUf || '',
        doctor_specialty: doctorInfo?.specialty || doctorInfo?.medicalSpecialty?.name || '',
      };

      const result = await prescriptionService.generateSignedRecipe(prescriptionData);

      if (result.success) {
        Alert.alert(
          'Sucesso',
          'Receita médica gerada e assinada digitalmente com sucesso! O arquivo foi salvo na aba Arquivos.',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.goBack();
                // Opcional: navegar para a tela de documentos
                if (navigation.navigate) {
                  setTimeout(() => {
                    navigation.navigate('Documents', { groupId, groupName: appointment?.group?.name });
                  }, 500);
                }
              },
            },
          ]
        );
      } else {
        throw new Error(result.error || 'Erro ao gerar receita');
      }
    } catch (error) {
      console.error('Erro ao gerar receita:', error);
      Alert.alert(
        'Erro',
        error.message || 'Não foi possível gerar a receita médica. Tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Receita Médica Digital</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Informações do Paciente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados do Paciente</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Nome:</Text>
            <Text style={styles.infoValue}>{patientInfo?.name || 'Não informado'}</Text>
          </View>
          {patientInfo?.cpf && (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>CPF:</Text>
              <Text style={styles.infoValue}>{patientInfo.cpf}</Text>
            </View>
          )}
          {patientInfo?.birth_date && (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Data de Nascimento:</Text>
              <Text style={styles.infoValue}>
                {new Date(patientInfo.birth_date).toLocaleDateString('pt-BR')}
              </Text>
            </View>
          )}
        </View>

        {/* Informações do Médico */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados do Médico</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Nome:</Text>
            <Text style={styles.infoValue}>{doctorInfo?.name || 'Não informado'}</Text>
          </View>
          {(() => {
            // Parsear CRM para exibição correta
            let crmDisplay = '';
            if (doctorInfo?.crm) {
              const parsedCrm = parseCrm(doctorInfo.crm);
              if (parsedCrm.number && parsedCrm.uf) {
                crmDisplay = `${parsedCrm.number}/${parsedCrm.uf}`;
              } else if (doctorInfo.crm) {
                crmDisplay = doctorInfo.crm;
              }
            } else if (doctorInfo?.crm_uf) {
              // Fallback se já vier separado
              crmDisplay = `${doctorInfo.crm || ''}${doctorInfo.crm_uf ? `/${doctorInfo.crm_uf}` : ''}`.trim();
            }
            
            return crmDisplay ? (
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>CRM / UF:</Text>
                <Text style={styles.infoValue}>{crmDisplay}</Text>
              </View>
            ) : null;
          })()}
          {doctorInfo?.specialty && (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Especialidade:</Text>
              <Text style={styles.infoValue}>{doctorInfo.specialty}</Text>
            </View>
          )}
        </View>

        {/* Formulário da Receita */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prescrição</Text>

          {/* Medicamento */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Medicamento <Text style={styles.required}>*</Text>
            </Text>
            <MedicationAutocomplete
              value={formData.medication}
              onChangeText={handleMedicationNameChange}
              onSelect={handleSelectMedication}
              suggestions={medicationSuggestions}
              placeholder="Ex: Losartana"
              isLoading={isSearching}
              showPrice={false}
            />
            {errors.medication && (
              <Text style={styles.errorText}>{errors.medication}</Text>
            )}
          </View>

          {/* Concentração */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Concentração <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.concentration && styles.inputError]}
              placeholder="Ex: 500mg, 10mg/ml"
              placeholderTextColor={colors.gray400}
              value={formData.concentration}
              onChangeText={(value) => updateField('concentration', value)}
            />
            {errors.concentration && (
              <Text style={styles.errorText}>{errors.concentration}</Text>
            )}
          </View>

          {/* Forma Farmacêutica */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Forma Farmacêutica <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.pharmaceuticalForm && styles.inputError]}
              placeholder="Ex: Comprimido, Cápsula, Solução"
              placeholderTextColor={colors.gray400}
              value={formData.pharmaceuticalForm}
              onChangeText={(value) => updateField('pharmaceuticalForm', value)}
            />
            {errors.pharmaceuticalForm && (
              <Text style={styles.errorText}>{errors.pharmaceuticalForm}</Text>
            )}
          </View>

          {/* Posologia */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Posologia <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.dosage && styles.inputError, styles.textArea]}
              placeholder="Ex: 1 comprimido a cada 8 horas"
              placeholderTextColor={colors.gray400}
              value={formData.dosage}
              onChangeText={(value) => updateField('dosage', value)}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            {errors.dosage && (
              <Text style={styles.errorText}>{errors.dosage}</Text>
            )}
          </View>

          {/* Duração do Tratamento */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Duração do Tratamento <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.treatmentDuration && styles.inputError]}
              placeholder="Ex: 7 dias, 2 semanas, 1 mês"
              placeholderTextColor={colors.gray400}
              value={formData.treatmentDuration}
              onChangeText={(value) => updateField('treatmentDuration', value)}
            />
            {errors.treatmentDuration && (
              <Text style={styles.errorText}>{errors.treatmentDuration}</Text>
            )}
          </View>

          {/* Orientações Complementares */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Orientações Complementares</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Instruções adicionais sobre o tratamento (opcional)"
              placeholderTextColor={colors.gray400}
              value={formData.notes}
              onChangeText={(value) => updateField('notes', value)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Botão de Gerar PDF */}
        <TouchableOpacity
          style={[styles.generateButton, loading && styles.generateButtonDisabled]}
          onPress={handleGeneratePDF}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Ionicons name="document-text" size={20} color={colors.white} />
              <Text style={styles.generateButtonText}>
                Gerar Receita Assinada Digitalmente
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.footerNote}>
          <Ionicons name="information-circle" size={16} color={colors.gray600} />
          <Text style={styles.footerNoteText}>
            A receita será assinada digitalmente com certificado ICP-Brasil e salva automaticamente na aba Arquivos.
          </Text>
        </View>
      </ScrollView>
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
    backgroundColor: colors.white,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.gray600,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  required: {
    color: colors.error,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  inputError: {
    borderColor: colors.error,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 16,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 18,
    marginTop: 20,
    gap: 10,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.info + '20',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    gap: 10,
  },
  footerNoteText: {
    flex: 1,
    fontSize: 12,
    color: colors.gray700,
    lineHeight: 18,
  },
});

export default RecipeFormScreen;


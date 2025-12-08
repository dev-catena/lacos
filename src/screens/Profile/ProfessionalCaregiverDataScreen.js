import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';
import colors from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import userService from '../../services/userService';

const ProfessionalCaregiverDataScreen = ({ navigation }) => {
  const { user, updateUser } = useAuth();
  
  // Converter gênero de inglês para português ao carregar
  const genderMapFromEnglish = {
    'male': 'Masculino',
    'female': 'Feminino',
  };

  const [formData, setFormData] = useState({
    gender: user?.gender ? (genderMapFromEnglish[user.gender] || user.gender) : '',
    city: user?.city || '',
    neighborhood: user?.neighborhood || '',
    formation_details: user?.formation_details || '',
    formation_description: user?.formation_description || '', // Detalhes da formação
    hourly_rate: user?.hourly_rate ? user.hourly_rate.toString() : '',
    availability: user?.availability || '',
    is_available: user?.is_available !== undefined ? user.is_available : true,
    latitude: user?.latitude || null,
    longitude: user?.longitude || null,
  });

  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [courses, setCourses] = useState(user?.caregiver_courses || []);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseForm, setCourseForm] = useState({
    name: '',
    institution: '',
    year: new Date().getFullYear().toString(),
    description: '',
  });

  // Carregar cursos quando a tela é focada ou quando o usuário é atualizado
  useEffect(() => {
    if (user?.caregiver_courses) {
      setCourses(user.caregiver_courses);
    } else if (user?.caregiverCourses) {
      setCourses(user.caregiverCourses);
    } else {
      setCourses([]);
    }
  }, [user]);

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getCurrentLocation = async () => {
    try {
      setLoadingLocation(true);
      
      // Solicitar permissão
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permissão Necessária',
          'Precisamos da sua localização para melhorar a busca de cuidadores.'
        );
        return;
      }

      // Obter localização
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;

      // Tentar obter endereço
      try {
        const [address] = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });

        if (address) {
          updateFormData('city', address.city || formData.city);
          updateFormData('neighborhood', address.district || address.subregion || formData.neighborhood);
          
          Toast.show({
            type: 'success',
            text1: 'Localização obtida',
            text2: 'Cidade e bairro preenchidos automaticamente',
          });
        }
      } catch (error) {
        console.log('Erro ao obter endereço:', error);
      }

      // Salvar coordenadas no estado
      updateFormData('latitude', latitude);
      updateFormData('longitude', longitude);

    } catch (error) {
      console.error('Erro ao obter localização:', error);
      Alert.alert('Erro', 'Não foi possível obter sua localização');
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleSave = async () => {
    // Validações
    if (!formData.gender || !formData.city || !formData.neighborhood || 
        !formData.formation_details || !formData.hourly_rate || !formData.availability) {
      Alert.alert('Atenção', 'Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (isNaN(parseFloat(formData.hourly_rate)) || parseFloat(formData.hourly_rate) <= 0) {
      Alert.alert('Atenção', 'Valor por hora deve ser um número válido maior que zero');
      return;
    }

    setLoading(true);

    try {
      // Converter gênero de português para inglês (backend espera valores em inglês)
      const genderMap = {
        'Masculino': 'male',
        'Feminino': 'female',
      };
      const genderInEnglish = genderMap[formData.gender] || formData.gender;

      // Preparar dados para envio
      const dataToUpdate = {
        gender: genderInEnglish,
        city: formData.city.trim(),
        neighborhood: formData.neighborhood.trim(),
        formation_details: formData.formation_details.trim(),
        hourly_rate: parseFloat(formData.hourly_rate),
        availability: formData.availability.trim(),
        is_available: formData.is_available,
      };
      
      // Se houver descrição da formação, adicionar ao campo availability ou criar campo separado
      // Por enquanto, vamos concatenar com availability se necessário
      // TODO: Criar coluna formation_description no banco se necessário

      // Adicionar coordenadas se foram obtidas
      if (formData.latitude && formData.longitude) {
        dataToUpdate.latitude = formData.latitude;
        dataToUpdate.longitude = formData.longitude;
      }

      // Adicionar cursos (será enviado como array)
      // Remover campos temporários como 'id' antes de enviar
      dataToUpdate.courses = courses.map(course => ({
        name: course.name,
        institution: course.institution,
        year: course.year ? parseInt(course.year) : new Date().getFullYear(),
        description: course.description || null,
        certificate_url: course.certificate_url || null,
      }));

      // Enviar para API
      const response = await userService.updateUserData(user.id, dataToUpdate);
      
      if (response.success && response.data) {
        // Atualizar contexto
        if (updateUser) {
          updateUser(response.data);
        }
        
        // Atualizar cursos no estado local se vierem na resposta
        if (response.data.caregiver_courses) {
          setCourses(response.data.caregiver_courses);
        } else if (response.data.caregiverCourses) {
          setCourses(response.data.caregiverCourses);
        }
        
        Toast.show({
          type: 'success',
          text1: '✅ Dados atualizados',
          text2: 'Suas informações profissionais foram salvas com sucesso',
          position: 'bottom',
        });

        setTimeout(() => {
          navigation.goBack();
        }, 1000);
      } else {
        throw new Error(response.error || 'Erro ao atualizar dados');
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar dados:', error);
      Alert.alert('Erro', error.message || 'Não foi possível atualizar os dados');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Dados Profissionais</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações Básicas</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Sexo *</Text>
            <View style={styles.genderSelector}>
              {['Masculino', 'Feminino'].map((gender) => (
                <TouchableOpacity
                  key={gender}
                  style={[
                    styles.genderOption,
                    formData.gender === gender && styles.genderOptionActive,
                  ]}
                  onPress={() => updateFormData('gender', gender)}
                >
                  <Text
                    style={[
                      styles.genderOptionText,
                      formData.gender === gender && styles.genderOptionTextActive,
                    ]}
                  >
                    {gender}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Cidade *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Belo Horizonte"
                placeholderTextColor={colors.placeholder}
                value={formData.city}
                onChangeText={(value) => updateFormData('city', value)}
              />
            </View>

            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Bairro *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Centro"
                placeholderTextColor={colors.placeholder}
                value={formData.neighborhood}
                onChangeText={(value) => updateFormData('neighborhood', value)}
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.locationButton}
            onPress={getCurrentLocation}
            disabled={loadingLocation}
          >
            {loadingLocation ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Ionicons name="location" size={20} color={colors.white} />
                <Text style={styles.locationButtonText}>Usar minha localização</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações Profissionais</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Formação *</Text>
            <View style={styles.formationSelector}>
              {['Cuidador', 'Auxiliar de enfermagem'].map((formation) => (
                <TouchableOpacity
                  key={formation}
                  style={[
                    styles.formationOption,
                    formData.formation_details === formation && styles.formationOptionActive,
                  ]}
                  onPress={() => updateFormData('formation_details', formation)}
                >
                  <Text
                    style={[
                      styles.formationOptionText,
                      formData.formation_details === formation && styles.formationOptionTextActive,
                    ]}
                  >
                    {formation}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Detalhes da Formação</Text>
            <Text style={styles.labelSubtitle}>
              Descreva sua formação, especializações e experiência profissional
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Ex: Auxiliar de Enfermagem formado pela Escola Técnica de Saúde, com especialização em cuidados geriátricos e 5 anos de experiência..."
              placeholderTextColor={colors.placeholder}
              value={formData.formation_description}
              onChangeText={(value) => updateFormData('formation_description', value)}
              multiline
              numberOfLines={5}
            />
          </View>

          {/* Cursos e Certificações */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Cursos e Certificações</Text>
            <Text style={styles.labelSubtitle}>
              Adicione seus cursos, certificações e especializações
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                setEditingCourse(null);
                setCourseForm({ name: '', institution: '', year: new Date().getFullYear().toString(), description: '' });
                setShowCourseForm(true);
              }}
            >
              <Ionicons name="add" size={20} color={colors.white} />
              <Text style={styles.addButtonText}>Adicionar Curso</Text>
            </TouchableOpacity>

            {courses.length > 0 && (
              <View style={styles.coursesList}>
                {courses.map((course, index) => (
                  <View key={index} style={styles.courseItem}>
                    <View style={styles.courseItemContent}>
                      <Text style={styles.courseItemName}>{course.name}</Text>
                      <Text style={styles.courseItemDetails}>
                        {course.institution} • {course.year}
                      </Text>
                      {course.description && (
                        <Text style={styles.courseItemDescription}>{course.description}</Text>
                      )}
                    </View>
                    <View style={styles.courseItemActions}>
                      <TouchableOpacity
                        onPress={() => {
                          setEditingCourse(index);
                          setCourseForm(course);
                          setShowCourseForm(true);
                        }}
                      >
                        <Ionicons name="create-outline" size={20} color="#B8A9E8" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          const newCourses = courses.filter((_, i) => i !== index);
                          setCourses(newCourses);
                        }}
                      >
                        <Ionicons name="trash-outline" size={20} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {showCourseForm && (
              <View style={styles.courseForm}>
                <Text style={styles.courseFormTitle}>
                  {editingCourse !== null ? 'Editar Curso' : 'Novo Curso'}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nome do curso *"
                  placeholderTextColor={colors.placeholder}
                  value={courseForm.name}
                  onChangeText={(value) => setCourseForm({ ...courseForm, name: value })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Instituição *"
                  placeholderTextColor={colors.placeholder}
                  value={courseForm.institution}
                  onChangeText={(value) => setCourseForm({ ...courseForm, institution: value })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Ano"
                  placeholderTextColor={colors.placeholder}
                  value={courseForm.year}
                  onChangeText={(value) => setCourseForm({ ...courseForm, year: value.replace(/[^0-9]/g, '') })}
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Descrição (opcional)"
                  placeholderTextColor={colors.placeholder}
                  value={courseForm.description}
                  onChangeText={(value) => setCourseForm({ ...courseForm, description: value })}
                  multiline
                  numberOfLines={3}
                />
                <View style={styles.courseFormActions}>
                  <TouchableOpacity
                    style={[styles.courseFormButton, styles.courseFormButtonCancel]}
                    onPress={() => {
                      setShowCourseForm(false);
                      setEditingCourse(null);
                    }}
                  >
                    <Text style={styles.courseFormButtonTextCancel}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.courseFormButton, styles.courseFormButtonSave]}
                    onPress={() => {
                      if (!courseForm.name || !courseForm.institution) {
                        Alert.alert('Atenção', 'Nome e Instituição são obrigatórios');
                        return;
                      }
                      if (editingCourse !== null) {
                        const newCourses = [...courses];
                        newCourses[editingCourse] = courseForm;
                        setCourses(newCourses);
                      } else {
                        setCourses([...courses, { ...courseForm, id: Date.now() }]);
                      }
                      setShowCourseForm(false);
                      setEditingCourse(null);
                      setCourseForm({ name: '', institution: '', year: new Date().getFullYear().toString(), description: '' });
                    }}
                  >
                    <Text style={styles.courseFormButtonTextSave}>Salvar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Valor por hora (R$) *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 50.00"
              placeholderTextColor={colors.placeholder}
              value={formData.hourly_rate}
              onChangeText={(value) => {
                const cleaned = value.replace(/[^0-9.]/g, '');
                updateFormData('hourly_rate', cleaned);
              }}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Disponibilidade *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Ex: 24 horas ou Segunda a Sexta, 8h às 18h"
              placeholderTextColor={colors.placeholder}
              value={formData.availability}
              onChangeText={(value) => updateFormData('availability', value)}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.switchRow}>
              <View style={styles.switchLabelContainer}>
                <Text style={styles.label}>Disponível para novos atendimentos</Text>
                <Text style={styles.switchSubtitle}>
                  Quando desativado, você não aparecerá nas buscas
                </Text>
              </View>
              <Switch
                value={formData.is_available}
                onValueChange={(value) => updateFormData('is_available', value)}
                trackColor={{ false: colors.gray300, true: '#B8A9E8' }}
                thumbColor={formData.is_available ? '#B8A9E8' : colors.gray400}
                ios_backgroundColor={colors.gray300}
              />
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.saveButtonText}>Salvar Alterações</Text>
          )}
        </TouchableOpacity>
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
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
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
  labelSubtitle: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#B8A9E8',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 12,
    width: '100%',
  },
  addButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  coursesList: {
    marginTop: 12,
    gap: 8,
  },
  courseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  courseItemContent: {
    flex: 1,
    marginRight: 12,
  },
  courseItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  courseItemDetails: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 2,
  },
  courseItemDescription: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
    fontStyle: 'italic',
  },
  courseItemActions: {
    flexDirection: 'row',
    gap: 12,
  },
  courseForm: {
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  courseFormTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  courseFormActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  courseFormButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  courseFormButtonCancel: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  courseFormButtonSave: {
    backgroundColor: '#B8A9E8',
  },
  courseFormButtonTextCancel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  courseFormButtonTextSave: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  genderSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.backgroundLight,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  genderOptionActive: {
    borderColor: '#B8A9E8',
    backgroundColor: '#B8A9E8',
  },
  genderOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  genderOptionTextActive: {
    color: colors.white,
  },
  formationSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  formationOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.backgroundLight,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  formationOptionActive: {
    borderColor: '#B8E8D4',
    backgroundColor: '#B8E8D4',
  },
  formationOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  formationOptionTextActive: {
    color: colors.white,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#B8A9E8',
    borderWidth: 1,
    borderColor: '#B8A9E8',
  },
  locationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: 12,
  },
  switchSubtitle: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: '#B8A9E8',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfessionalCaregiverDataScreen;


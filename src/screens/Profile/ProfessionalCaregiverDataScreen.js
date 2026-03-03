import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
  Modal,
  FlatList,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';
import colors from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import userService from '../../services/userService';
import medicalSpecialtyService from '../../services/medicalSpecialtyService';
import { BR_UFS } from '../../constants/brUfs';
import { parseCrm, formatCrmValue } from '../../utils/crm';
import SafeIcon from '../../components/SafeIcon';

// Máscara de reais: formata valor para exibição (R$ 1.234,56)
const formatReaisDisplay = (value) => {
  if (value === '' || value === null || value === undefined) return '';
  const num = parseFloat(String(value).replace(',', '.'));
  if (isNaN(num)) return '';
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Extrai apenas números e uma vírgula/ponto para o valor numérico
const parseReaisInput = (text) => {
  const cleaned = text.replace(/[^\d,.]/g, '').replace(',', '.');
  const parts = cleaned.split('.');
  if (parts.length > 2) return parts[0] + '.' + parts.slice(1).join('');
  if (parts.length === 2 && parts[1].length > 2) return parts[0] + '.' + parts[1].slice(0, 2);
  return cleaned;
};

const ProfessionalCaregiverDataScreen = ({ navigation }) => {
  const { user, updateUser } = useAuth();

  const isDoctor = user?.profile === 'doctor';
  const parsedCrm = parseCrm(user?.crm || '');
  
  const [formData, setFormData] = useState({
    city: user?.city || '',
    neighborhood: user?.neighborhood || '',
    formation_details: user?.formation_details || '',
    formation_description: user?.formation_description || '', // Detalhes da formação
    hourly_rate: user?.hourly_rate ? user.hourly_rate.toString() : '',
    availability: user?.availability || '',
    is_available: user?.is_available !== undefined ? user.is_available : true,
    latitude: user?.latitude || null,
    longitude: user?.longitude || null,
    // Campos específicos de médico
    crmUf: parsedCrm.uf || '',
    crmNumber: parsedCrm.number || '',
    medical_specialty_id: user?.medical_specialty_id || null,
    consultation_price: user?.consultation_price ? user.consultation_price.toString() : '',
  });

  // Estados para especialidades médicas
  const [specialties, setSpecialties] = useState([]);
  const [specialtyModalVisible, setSpecialtyModalVisible] = useState(false);
  const [loadingSpecialties, setLoadingSpecialties] = useState(false);
  const [ufModalVisible, setUfModalVisible] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [courses, setCourses] = useState(user?.caregiver_courses || []);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [deleteCourseIndex, setDeleteCourseIndex] = useState(null);
  const deleteCourseIndexRef = useRef(null);
  const [courseForm, setCourseForm] = useState({
    name: '',
    institution: '',
    year: new Date().getFullYear().toString(),
    description: '',
  });

  // Ref para evitar sobrescrever formation_description enquanto o usuário digita
  const userIsEditingFormationRef = useRef(false);

  // Atualizar formData quando o user mudar - usar user?.id para NÃO disparar quando
  // updateUser atualiza detalhes (evita sobrescrever o que o usuário está digitando)
  useEffect(() => {
    if (user) {
      const parsedCrm = parseCrm(user?.crm || '');
      setFormData(prev => ({
        ...prev,
        city: user?.city || prev.city,
        neighborhood: user?.neighborhood || prev.neighborhood,
        formation_details: user?.formation_details ?? prev.formation_details,
        // Preservar formation_description se o usuário está digitando
        formation_description: userIsEditingFormationRef.current
          ? prev.formation_description
          : (user?.formation_description ?? prev.formation_description),
        hourly_rate: user?.hourly_rate ? user.hourly_rate.toString() : prev.hourly_rate,
        availability: user?.availability ?? prev.availability,
        is_available: user?.is_available !== undefined ? user.is_available : prev.is_available,
        latitude: user?.latitude ?? prev.latitude,
        longitude: user?.longitude ?? prev.longitude,
        crmUf: parsedCrm.uf || prev.crmUf,
        crmNumber: parsedCrm.number || prev.crmNumber,
        medical_specialty_id: user?.medical_specialty_id ?? prev.medical_specialty_id,
        consultation_price: user?.consultation_price ? user.consultation_price.toString() : prev.consultation_price,
      }));
    }
  }, [user?.id]); // user?.id - não dispara quando só os detalhes mudam

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


  // Recarregar dados do usuário quando a tela recebe foco (para exibir formation_description e outros campos atualizados)
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      userIsEditingFormationRef.current = false; // Reset ao ganhar foco - permite carregar dados iniciais
      const reloadUserData = async () => {
        try {
          const response = await userService.getUser();
          if (!cancelled && response.success && response.data) {
            const data = response.data;
            if (updateUser) updateUser(data);
            const parsedCrm = parseCrm(data?.crm || '');
            setFormData(prev => ({
              ...prev,
              city: data?.city ?? prev.city,
              neighborhood: data?.neighborhood ?? prev.neighborhood,
              formation_details: data?.formation_details ?? prev.formation_details,
              // Preservar o que o usuário digitou se estava editando quando a API retornou
              formation_description: userIsEditingFormationRef.current
                ? prev.formation_description
                : (data?.formation_description ?? data?.formationDescription ?? prev.formation_description),
              hourly_rate: data?.hourly_rate != null ? String(data.hourly_rate) : prev.hourly_rate,
              availability: data?.availability ?? prev.availability,
              is_available: data?.is_available !== undefined ? data.is_available : prev.is_available,
              latitude: data?.latitude ?? prev.latitude,
              longitude: data?.longitude ?? prev.longitude,
              crmUf: parsedCrm.uf || prev.crmUf,
              crmNumber: parsedCrm.number || prev.crmNumber,
              medical_specialty_id: data?.medical_specialty_id ?? prev.medical_specialty_id,
              consultation_price: data?.consultation_price != null ? String(data.consultation_price) : prev.consultation_price,
            }));
            if (data?.caregiver_courses || data?.caregiverCourses) {
              setCourses(data.caregiver_courses || data.caregiverCourses);
            }
          }
        } catch (error) {
          if (!cancelled) console.error('Erro ao recarregar dados do usuário:', error);
        }
      };
      reloadUserData();
      return () => { cancelled = true; };
    }, [updateUser])
  );

  // Carregar especialidades se for médico
  useEffect(() => {
    if (isDoctor) {
      loadSpecialties();
    }
  }, [isDoctor]);


  const loadSpecialties = async () => {
    try {
      setLoadingSpecialties(true);
      const response = await medicalSpecialtyService.getSpecialties();
      if (response.success && response.data) {
        // Remover duplicatas por nome
        const uniqueSpecialties = response.data.reduce((acc, current) => {
          const existing = acc.find(item => item.name === current.name);
          if (!existing) {
            acc.push(current);
          }
          return acc;
        }, []);
        
        // Ordenar por nome
        uniqueSpecialties.sort((a, b) => a.name.localeCompare(b.name));
        
        setSpecialties(uniqueSpecialties);
        console.log(`✅ Especialidades carregadas: ${uniqueSpecialties.length}`);
      }
    } catch (error) {
      console.error('Erro ao carregar especialidades:', error);
    } finally {
      setLoadingSpecialties(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleConfirmDeleteCourse = useCallback(() => {
    const idx = deleteCourseIndexRef.current;
    setDeleteCourseIndex(null);
    deleteCourseIndexRef.current = null;
    if (idx !== null && idx !== undefined) {
      setCourses((prev) => prev.filter((_, i) => i !== idx));
      Toast.show({
        type: 'info',
        text1: 'Curso removido',
        text2: 'Clique em Salvar para confirmar',
        position: 'bottom',
      });
    }
  }, []);

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
    // Validações básicas (sexo está em Dados Pessoais, não aqui)
    if (!formData.city || !formData.neighborhood) {
      Alert.alert('Atenção', 'Por favor, preencha Cidade e Bairro');
      return;
    }

    // Validações específicas por perfil
    if (isDoctor) {
      // Validações para médico
      if (!formData.crmUf || !formData.crmNumber || !formData.medical_specialty_id) {
        Alert.alert('Atenção', 'Por favor, preencha CRM (UF e número) e Especialidade');
        return;
      }
      // Validação do valor da consulta (opcional, mas se preenchido deve ser válido)
      if (formData.consultation_price && formData.consultation_price.trim()) {
        const priceValue = parseFloat(formData.consultation_price);
        if (isNaN(priceValue) || priceValue < 0) {
          Alert.alert('Atenção', 'O valor da consulta deve ser um número válido maior ou igual a zero');
          return;
        }
      }
    } else {
      // Validações para cuidador profissional
      if (!formData.formation_details || !formData.hourly_rate || !formData.availability) {
        Alert.alert('Atenção', 'Por favor, preencha todos os campos obrigatórios');
        return;
      }

      if (isNaN(parseFloat(formData.hourly_rate)) || parseFloat(formData.hourly_rate) <= 0) {
        Alert.alert('Atenção', 'Valor por hora deve ser um número válido maior que zero');
        return;
      }
    }

    if (!user?.id) {
      Alert.alert('Erro', 'Sessão inválida. Faça login novamente.');
      return;
    }

    setLoading(true);

    try {
      // Converter gênero para português (banco espera 'masculino', 'feminino', 'outro')
      // Preparar dados para envio (sexo/gênero está em Dados Pessoais)
      const dataToUpdate = {
        city: formData.city.trim(),
        neighborhood: formData.neighborhood.trim(),
        is_available: formData.is_available,
      };

      // Adicionar campos específicos por perfil
      if (isDoctor) {
        // Campos para médico
        dataToUpdate.crm = formatCrmValue(formData.crmUf, formData.crmNumber);
        dataToUpdate.medical_specialty_id = formData.medical_specialty_id;
        // Sempre enviar consultation_price, mesmo que seja 0 ou vazio
        if (formData.consultation_price && formData.consultation_price.trim()) {
          const priceValue = parseFloat(formData.consultation_price);
          if (!isNaN(priceValue) && priceValue >= 0) {
            dataToUpdate.consultation_price = priceValue;
          }
        } else {
          // Se estiver vazio, enviar null para limpar o valor
          dataToUpdate.consultation_price = null;
        }
      } else {
        // Campos para cuidador profissional
        dataToUpdate.formation_details = formData.formation_details.trim();
        dataToUpdate.formation_description = formData.formation_description?.trim() || null;
        dataToUpdate.hourly_rate = parseFloat(formData.hourly_rate);
        dataToUpdate.availability = formData.availability.trim();
      }

      // Adicionar coordenadas se foram obtidas
      if (formData.latitude && formData.longitude) {
        dataToUpdate.latitude = formData.latitude;
        dataToUpdate.longitude = formData.longitude;
      }

      // Preparar cursos para envio (endpoint dedicado)
      const coursesArray = Array.isArray(courses) ? courses : [];
      const coursesToSend = coursesArray.map((course) => {
        const courseObj = typeof course === 'object' && course !== null ? course : {};
        const yearVal = courseObj.year;
        const parsedYear = yearVal && !isNaN(parseInt(String(yearVal), 10))
          ? parseInt(String(yearVal), 10)
          : new Date().getFullYear();
        return {
          name: (courseObj.name || '').trim(),
          institution: (courseObj.institution || '').trim(),
          year: parsedYear,
          description: (courseObj.description || '').trim() || null,
          certificate_url: courseObj.certificate_url || null,
        };
      });

      // 1. Salvar cursos PRIMEIRO (endpoint dedicado) - garante persistência
      const coursesResponse = await userService.updateCaregiverCourses(user.id, coursesToSend);
      if (!coursesResponse.success) {
        throw new Error(coursesResponse.error || 'Erro ao salvar cursos');
      }

      // 2. Salvar dados principais
      const response = await userService.updateUserData(user.id, dataToUpdate);

      if (response.success && response.data) {
        const updatedCourses = coursesResponse.data || [];
        const userWithCourses = { ...response.data, caregiver_courses: updatedCourses, caregiverCourses: updatedCourses };

        // Atualizar contexto e persistir no AsyncStorage antes de navegar
        if (updateUser) {
          await updateUser(userWithCourses);
        }

        setCourses(updatedCourses);

        if (isDoctor) {
          // Atualizar formData imediatamente com o valor retornado
          if (response.data.consultation_price !== undefined && response.data.consultation_price !== null) {
            setFormData(prev => ({
              ...prev,
              consultation_price: response.data.consultation_price.toString(),
            }));
          }
        } else {
          // Cuidador profissional: atualizar formData com formation_description retornado
          const formationDesc = response.data.formation_description ?? response.data.formationDescription ?? '';
          setFormData(prev => ({
            ...prev,
            formation_description: formationDesc,
          }));
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
        console.error('❌ ProfessionalCaregiverDataScreen - Erro na resposta:', response);
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
          <SafeIcon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Dados Profissionais</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Localização</Text>

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
                <SafeIcon name="location" size={20} color={colors.white} />
                <Text style={styles.locationButtonText}>Usar minha localização</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações Profissionais</Text>
          
          {/* Campos específicos para Cuidador Profissional */}
          {!isDoctor && (
            <>
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
                  onChangeText={(value) => {
                    userIsEditingFormationRef.current = true;
                    updateFormData('formation_description', value);
                  }}
                  multiline
                  numberOfLines={5}
                />
              </View>
            </>
          )}

          {/* Campos específicos para Médico */}
          {isDoctor && (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>CRM *</Text>
                <View style={styles.crmRow}>
                  <TouchableOpacity
                    style={styles.ufSelector}
                    activeOpacity={0.7}
                    onPress={() => setUfModalVisible(true)}
                  >
                    <Text style={[
                      styles.ufSelectorText,
                      !formData.crmUf && styles.ufSelectorPlaceholder
                    ]}>
                      {formData.crmUf || 'UF'}
                    </Text>
                    <SafeIcon name="chevron-down" size={18} color={colors.textLight} />
                  </TouchableOpacity>

                  <TextInput
                    style={[styles.input, styles.crmNumberInput]}
                    placeholder="Número do CRM"
                    placeholderTextColor={colors.placeholder}
                    value={formData.crmNumber}
                    onChangeText={(value) => updateFormData('crmNumber', value.replace(/\D/g, '').slice(0, 12))}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              {/* Modal UF */}
              <Modal
                visible={ufModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setUfModalVisible(false)}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>Selecione o UF</Text>
                      <TouchableOpacity
                        style={styles.modalCloseButton}
                        onPress={() => setUfModalVisible(false)}
                      >
                        <SafeIcon name="close" size={24} color={colors.text} />
                      </TouchableOpacity>
                    </View>
                    <FlatList
                      data={BR_UFS}
                      keyExtractor={(item) => item}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={[
                            styles.specialtyItem,
                            formData.crmUf === item && styles.specialtyItemSelected
                          ]}
                          onPress={() => {
                            updateFormData('crmUf', item);
                            setUfModalVisible(false);
                          }}
                        >
                          <Text style={[
                            styles.specialtyItemText,
                            formData.crmUf === item && styles.specialtyItemTextSelected
                          ]}>
                            {item}
                          </Text>
                          {formData.crmUf === item && (
                            <SafeIcon name="checkmark" size={24} color={colors.primary} />
                          )}
                        </TouchableOpacity>
                      )}
                      ItemSeparatorComponent={() => <View style={styles.separator} />}
                    />
                  </View>
                </View>
              </Modal>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Especialidade *</Text>
                <TouchableOpacity
                  style={styles.inputWrapper}
                  onPress={() => setSpecialtyModalVisible(true)}
                >
                  <SafeIcon name="medical-outline" size={20} color={colors.gray400} />
                  <Text style={[
                    { flex: 1, fontSize: 16, color: formData.medical_specialty_id ? colors.text : colors.gray400 }
                  ]}>
                    {formData.medical_specialty_id
                      ? specialties.find(s => s.id === formData.medical_specialty_id)?.name
                      : 'Selecione a especialidade...'}
                  </Text>
                  <SafeIcon name="chevron-down" size={20} color={colors.gray400} />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Valor da Consulta (R$) *</Text>
                <Text style={styles.labelSubtitle}>
                  Este valor será usado como base para calcular o valor a pagar (valor + 20% de taxa)
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 150.00"
                  placeholderTextColor={colors.placeholder}
                  value={formData.consultation_price}
                  onChangeText={(value) => {
                    // Permitir apenas números e ponto decimal
                    const cleaned = value.replace(/[^0-9.]/g, '');
                    // Garantir apenas um ponto decimal
                    const parts = cleaned.split('.');
                    let formatted = parts[0];
                    if (parts.length > 1) {
                      formatted += '.' + parts.slice(1).join('').substring(0, 2);
                    }
                    updateFormData('consultation_price', formatted);
                  }}
                  keyboardType="decimal-pad"
                />
              </View>

            </>
          )}

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
              <SafeIcon name="add" size={20} color={colors.white} />
              <Text style={styles.addButtonText}>Adicionar Curso</Text>
            </TouchableOpacity>

            {courses.length > 0 && (
              <View style={styles.coursesList}>
                {courses.map((course, index) => (
                  <View key={course.id ?? `${course.name}-${course.institution}-${index}`} style={styles.courseItem}>
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
                      <Pressable
                        style={({ pressed }) => [
                          styles.courseActionButton,
                          pressed && styles.courseActionButtonPressed,
                        ]}
                        onPress={() => {
                          setEditingCourse(index);
                          setCourseForm({
                            name: course.name || '',
                            institution: course.institution || '',
                            year: course.year ? String(course.year) : new Date().getFullYear().toString(),
                            description: course.description || '',
                          });
                          setShowCourseForm(true);
                        }}
                      >
                        <SafeIcon name="create-outline" size={20} color="#B8A9E8" />
                      </Pressable>
                      <TouchableOpacity
                        style={styles.courseActionButton}
                        activeOpacity={0.6}
                        onPress={() => {
                          deleteCourseIndexRef.current = index;
                          setDeleteCourseIndex(index);
                        }}
                        onLongPress={() => {
                          setCourses((prev) => prev.filter((_, i) => i !== index));
                          Toast.show({
                            type: 'info',
                            text1: 'Curso removido',
                            text2: 'Clique em Salvar para confirmar',
                            position: 'bottom',
                          });
                        }}
                      >
                        <SafeIcon name="trash-outline" size={22} color={colors.error} />
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

          {/* Valor por hora - apenas para cuidador profissional */}
          {!isDoctor && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Valor por hora *</Text>
              <View style={styles.currencyInputWrapper}>
                <Text style={styles.currencyPrefix}>R$</Text>
                <TextInput
                  style={[styles.input, styles.currencyInput]}
                  placeholder="0,00"
                  placeholderTextColor={colors.placeholder}
                  value={formatReaisDisplay(formData.hourly_rate)}
                  onChangeText={(value) => {
                    const parsed = parseReaisInput(value);
                    updateFormData('hourly_rate', parsed);
                  }}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          )}

          {/* Disponibilidade - apenas para cuidador profissional */}
          {!isDoctor && (
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
          )}

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

      {/* Modal de confirmação de exclusão de curso */}
      <Modal
        visible={deleteCourseIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteCourseIndex(null)}
      >
        <View style={styles.deleteModalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setDeleteCourseIndex(null)}
          />
          <View style={styles.deleteModalContent}>
            <Text style={styles.deleteModalTitle}>Excluir curso</Text>
            <Text style={styles.deleteModalMessage}>
              {deleteCourseIndex !== null && courses[deleteCourseIndex]
                ? `Deseja excluir "${courses[deleteCourseIndex].name}"?`
                : 'Deseja excluir este curso?'}
            </Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={[styles.deleteModalBtn, styles.deleteModalBtnCancel]}
                onPress={() => setDeleteCourseIndex(null)}
              >
                <Text style={styles.deleteModalBtnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteModalBtn, styles.deleteModalBtnConfirm]}
                activeOpacity={0.8}
                onPress={handleConfirmDeleteCourse}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              >
                <Text style={styles.deleteModalBtnConfirmText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Especialidades (apenas para médico) */}
      {isDoctor && (
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
                  <SafeIcon name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              {loadingSpecialties ? (
                <View style={styles.modalLoadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.modalLoadingText}>Carregando especialidades...</Text>
                </View>
              ) : (
                <FlatList
                  data={specialties}
                  keyExtractor={(item) => item.id.toString()}
                  style={styles.flatList}
                  contentContainerStyle={styles.flatListContent}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.specialtyItem,
                        formData.medical_specialty_id === item.id && styles.specialtyItemSelected
                      ]}
                      onPress={() => {
                        updateFormData('medical_specialty_id', item.id);
                        setSpecialtyModalVisible(false);
                      }}
                    >
                      <Text style={[
                        styles.specialtyItemText,
                        formData.medical_specialty_id === item.id && styles.specialtyItemTextSelected
                      ]}>
                        {item.name}
                      </Text>
                      {formData.medical_specialty_id === item.id && (
                        <SafeIcon name="checkmark" size={24} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  )}
                  ItemSeparatorComponent={() => <View style={styles.separator} />}
                />
              )}
            </View>
          </View>
        </Modal>
      )}


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
  currencyInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingLeft: 16,
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginRight: 8,
  },
  currencyInput: {
    flex: 1,
    borderWidth: 0,
    paddingLeft: 0,
  },
  crmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ufSelector: {
    width: 92,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  ufSelectorText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  ufSelectorPlaceholder: {
    color: colors.textLight,
    fontWeight: '500',
  },
  crmNumberInput: {
    flex: 1,
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
    alignItems: 'center',
  },
  courseActionButton: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  courseActionButtonPressed: {
    opacity: 0.6,
  },
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  deleteModalContent: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    zIndex: 1,
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  deleteModalMessage: {
    fontSize: 16,
    color: colors.textLight,
    marginBottom: 20,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteModalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteModalBtnCancel: {
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  deleteModalBtnConfirm: {
    backgroundColor: colors.error,
  },
  deleteModalBtnCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  deleteModalBtnConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
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
  // Estilos para combo de especialidade (médico)
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
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
  modalLoadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textLight,
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
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: colors.gray200,
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  modalButtonConfirm: {
    backgroundColor: colors.primary,
  },
  modalButtonConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  modalDescription: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 8,
  },
});

export default ProfessionalCaregiverDataScreen;


import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { LacosLogoFull } from '../../components/LacosLogo';
import medicalSpecialtyService from '../../services/medicalSpecialtyService';

const RegisterScreen = ({ navigation }) => {
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    profile: 'caregiver', // Padrão: Cuidador
    // Campos específicos de cuidador profissional
    gender: '',
    city: '',
    neighborhood: '',
    formation_details: '',
    hourly_rate: '',
    availability: '',
    // Campos específicos de médico
    crm: '',
    medical_specialty_id: null,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [specialties, setSpecialties] = useState([]);
  const [specialtyModalVisible, setSpecialtyModalVisible] = useState(false);
  const [loadingSpecialties, setLoadingSpecialties] = useState(false);
  const [selectedSpecialtyName, setSelectedSpecialtyName] = useState('');

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Carregar especialidades quando o perfil for médico
  useEffect(() => {
    if (formData.profile === 'doctor') {
      loadSpecialties();
    }
  }, [formData.profile]);

  const loadSpecialties = async () => {
    try {
      setLoadingSpecialties(true);
      const response = await medicalSpecialtyService.getSpecialties();
      console.log('📋 Resposta completa das especialidades:', JSON.stringify(response, null, 2));
      
      // O backend retorna {success: true, data: [...]}
      // O apiService retorna o JSON parseado diretamente
      let specialtiesData = [];
      
      if (response && response.success && response.data && Array.isArray(response.data)) {
        // Se vier com success e data como array
        specialtiesData = response.data;
        console.log('✅ Especialidades extraídas de response.success.data');
      } else if (response && Array.isArray(response)) {
        // Se vier como array direto
        specialtiesData = response;
        console.log('✅ Especialidades extraídas como array direto');
      } else if (response && response.data && Array.isArray(response.data)) {
        // Se vier com data como array (sem success)
        specialtiesData = response.data;
        console.log('✅ Especialidades extraídas de response.data');
      } else {
        console.log('⚠️ Formato de resposta não reconhecido:', typeof response, Object.keys(response || {}));
      }
      
      console.log('📋 Especialidades processadas:', specialtiesData.length);
      if (specialtiesData.length > 0) {
        console.log('📋 Primeira especialidade:', JSON.stringify(specialtiesData[0], null, 2));
      } else {
        console.log('❌ Nenhuma especialidade foi carregada!');
      }
      setSpecialties(specialtiesData);
    } catch (error) {
      console.error('❌ Erro ao carregar especialidades:', error);
      setSpecialties([]);
    } finally {
      setLoadingSpecialties(false);
    }
  };

  // Atualizar nome da especialidade quando medical_specialty_id ou specialties mudarem
  useEffect(() => {
    if (!formData.medical_specialty_id) {
      setSelectedSpecialtyName('');
      return;
    }
    
    console.log('🔍 Buscando especialidade ID:', formData.medical_specialty_id, 'Tipo:', typeof formData.medical_specialty_id);
    console.log('📋 Total de especialidades carregadas:', specialties.length);
    
    if (specialties.length > 0) {
      console.log('📋 Primeiras 3 especialidades:', specialties.slice(0, 3).map(s => ({ id: s.id, idType: typeof s.id, name: s.name })));
    }
    
    // Comparar com conversão de tipo para garantir match (pode ser string ou número)
    const specialty = specialties.find(s => {
      return String(s.id) === String(formData.medical_specialty_id) || s.id === formData.medical_specialty_id;
    });
    
    if (specialty) {
      console.log('✅ Especialidade encontrada:', specialty.name);
      setSelectedSpecialtyName(specialty.name);
    } else {
      console.log('❌ Especialidade não encontrada para ID:', formData.medical_specialty_id);
      if (specialties.length > 0) {
        console.log('📋 IDs disponíveis:', specialties.map(s => s.id).slice(0, 10));
      }
      setSelectedSpecialtyName('');
    }
  }, [formData.medical_specialty_id, specialties]);

  const handleRegister = async () => {
    // Validações básicas
    if (!formData.name || !formData.lastName || !formData.email || !formData.password) {
      Alert.alert('Atenção', 'Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Atenção', 'As senhas não coincidem');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Atenção', 'A senha deve ter pelo menos 6 caracteres');
      return;
    }

    // Validações específicas para cuidador profissional
    if (formData.profile === 'professional_caregiver') {
      if (!formData.gender || !formData.city || !formData.neighborhood || 
          !formData.formation_details || !formData.hourly_rate || !formData.availability) {
        Alert.alert('Atenção', 'Por favor, preencha todos os campos obrigatórios do perfil profissional');
        return;
      }
    }

    // Validações específicas para médico
    if (formData.profile === 'doctor') {
      if (!formData.gender || !formData.city || !formData.neighborhood || 
          !formData.crm || !formData.medical_specialty_id) {
        Alert.alert('Atenção', 'Por favor, preencha todos os campos obrigatórios do perfil médico');
        return;
      }
    }

    setLoading(true);
    const result = await signUp(formData);
    setLoading(false);

    if (!result.success) {
      Alert.alert('Erro', result.error || 'Não foi possível criar a conta');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.logoContainer}>
              <LacosLogoFull width={150} height={47} />
            </View>
            <Text style={styles.title}>Criar Conta</Text>
            <Text style={styles.subtitle}>
              Junte-se a nós e cuide de quem você ama
            </Text>
          </View>

          {/* Formulário */}
          <View style={styles.form}>
            <View style={styles.row}>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>Nome *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Seu nome"
                  placeholderTextColor={colors.placeholder}
                  value={formData.name}
                  onChangeText={(value) => updateFormData('name', value)}
                />
              </View>

              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>Sobrenome *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Seu sobrenome"
                  placeholderTextColor={colors.placeholder}
                  value={formData.lastName}
                  onChangeText={(value) => updateFormData('lastName', value)}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>E-mail *</Text>
              <TextInput
                style={styles.input}
                placeholder="seu@email.com"
                placeholderTextColor={colors.placeholder}
                value={formData.email}
                onChangeText={(value) => updateFormData('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Celular (opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="(00) 00000-0000"
                placeholderTextColor={colors.placeholder}
                value={formData.phone}
                onChangeText={(value) => updateFormData('phone', value)}
                keyboardType="phone-pad"
              />
            </View>

            {/* Seletor de Perfil */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Qual é o seu perfil? *</Text>
              <View style={styles.profileSelector}>
                {/* Primeira linha */}
                <View style={styles.profileRow}>
                  <TouchableOpacity
                    style={[
                      styles.profileOption,
                      formData.profile === 'caregiver' && styles.profileOptionActive
                    ]}
                    onPress={() => updateFormData('profile', 'caregiver')}
                  >
                    <View style={[
                      styles.profileIconContainer,
                      formData.profile === 'caregiver' && styles.profileIconContainerActive
                    ]}>
                      <Ionicons
                        name="heart"
                        size={28}
                        color={formData.profile === 'caregiver' ? colors.white : colors.primary}
                      />
                    </View>
                    <Text style={[
                      styles.profileOptionTitle,
                      formData.profile === 'caregiver' && styles.profileOptionTitleActive
                    ]}>
                      Amigo/cuidador
                    </Text>
                    <Text style={[
                      styles.profileOptionDescription,
                      formData.profile === 'caregiver' && styles.profileOptionDescriptionActive
                    ]}>
                      Vou cuidar de alguém
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.profileOption,
                      formData.profile === 'accompanied' && styles.profileOptionActive
                    ]}
                    onPress={() => updateFormData('profile', 'accompanied')}
                  >
                    <View style={[
                      styles.profileIconContainer,
                      formData.profile === 'accompanied' && styles.profileIconContainerActive
                    ]}>
                      <Ionicons
                        name="person"
                        size={28}
                        color={formData.profile === 'accompanied' ? colors.white : colors.secondary}
                      />
                    </View>
                    <Text style={[
                      styles.profileOptionTitle,
                      formData.profile === 'accompanied' && styles.profileOptionTitleActive
                    ]}>
                      Sou Paciente
                    </Text>
                    <Text style={[
                      styles.profileOptionDescription,
                      formData.profile === 'accompanied' && styles.profileOptionDescriptionActive
                    ]}>
                      Vou ser acompanhado
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Segunda linha */}
                <View style={styles.profileRow}>
                  <TouchableOpacity
                    style={[
                      styles.profileOption,
                      formData.profile === 'professional_caregiver' && [
                        styles.profileOptionActive,
                        { borderColor: colors.success, backgroundColor: colors.success + '10' }
                      ]
                    ]}
                    onPress={() => updateFormData('profile', 'professional_caregiver')}
                  >
                    <View style={[
                      styles.profileIconContainer,
                      formData.profile === 'professional_caregiver' && [
                        styles.profileIconContainerActive,
                        { backgroundColor: colors.success }
                      ]
                    ]}>
                      <Ionicons
                        name="medical"
                        size={28}
                        color={formData.profile === 'professional_caregiver' ? colors.white : colors.success}
                      />
                    </View>
                    <Text style={[
                      styles.profileOptionTitle,
                      formData.profile === 'professional_caregiver' && [
                        styles.profileOptionTitleActive,
                        { color: colors.success }
                      ]
                    ]}>
                      Cuidador profissional
                    </Text>
                    <Text style={[
                      styles.profileOptionDescription,
                      formData.profile === 'professional_caregiver' && [
                        styles.profileOptionDescriptionActive,
                        { color: colors.success }
                      ]
                    ]}>
                      Profissional de saúde
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.profileOption,
                      formData.profile === 'doctor' && [
                        styles.profileOptionActive,
                        { borderColor: '#4A90E2', backgroundColor: '#4A90E2' + '10' }
                      ]
                    ]}
                    onPress={() => updateFormData('profile', 'doctor')}
                  >
                    <View style={[
                      styles.profileIconContainer,
                      formData.profile === 'doctor' && [
                        styles.profileIconContainerActive,
                        { backgroundColor: '#4A90E2' }
                      ]
                    ]}>
                      <Ionicons
                        name="medical-outline"
                        size={28}
                        color={formData.profile === 'doctor' ? colors.white : '#4A90E2'}
                      />
                    </View>
                    <Text style={[
                      styles.profileOptionTitle,
                      formData.profile === 'doctor' && [
                        styles.profileOptionTitleActive,
                        { color: '#4A90E2' }
                      ]
                    ]}>
                      Médico
                    </Text>
                    <Text style={[
                      styles.profileOptionDescription,
                      formData.profile === 'doctor' && [
                        styles.profileOptionDescriptionActive,
                        { color: '#4A90E2' }
                      ]
                    ]}>
                      Profissional médico
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Campos específicos para Cuidador Profissional e Médico */}
            {(formData.profile === 'professional_caregiver' || formData.profile === 'doctor') && (
              <>
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

                {/* Campos específicos para Cuidador Profissional */}
                {formData.profile === 'professional_caregiver' && (
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
                  </>
                )}

                {/* Campos específicos para Médico */}
                {formData.profile === 'doctor' && (
                  <>
                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>CRM *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Ex: CRM 123456"
                        placeholderTextColor={colors.placeholder}
                        value={formData.crm}
                        onChangeText={(value) => updateFormData('crm', value)}
                        autoCapitalize="characters"
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Especialidade *</Text>
                      <TouchableOpacity
                        style={styles.specialtySelector}
                        activeOpacity={0.7}
                        onPress={() => {
                          console.log('🔘 TouchableOpacity pressionado - Abrindo modal de especialidades');
                          console.log('📋 Especialidades carregadas:', specialties.length);
                          setSpecialtyModalVisible(true);
                        }}
                      >
                        <Text style={[
                          styles.specialtySelectorText,
                          !formData.medical_specialty_id && styles.specialtySelectorPlaceholder
                        ]}>
                          {selectedSpecialtyName || 'Selecione a especialidade'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color={colors.textLight} />
                      </TouchableOpacity>
                    </View>
                  </>
                )}

                {/* Campo Disponibilidade - apenas para cuidador profissional */}
                {formData.profile === 'professional_caregiver' && (
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
              </>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Senha *</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor={colors.placeholder}
                  value={formData.password}
                  onChangeText={(value) => updateFormData('password', value)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={colors.gray400}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirmar Senha *</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Digite a senha novamente"
                  placeholderTextColor={colors.placeholder}
                  value={formData.confirmPassword}
                  onChangeText={(value) => updateFormData('confirmPassword', value)}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={colors.gray400}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.registerButton, loading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.registerButtonText}>
                {loading ? 'Criando conta...' : 'Criar Conta'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.termsText}>
              Ao criar uma conta, você concorda com nossos{' '}
              <Text style={styles.termsLink}>Termos de Uso</Text> e{' '}
              <Text style={styles.termsLink}>Política de Privacidade</Text>
            </Text>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Já tem uma conta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Entrar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Modal de Especialidades */}
        <Modal
          visible={specialtyModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => {
            console.log('🔘 Modal onRequestClose chamado');
            setSpecialtyModalVisible(false);
          }}
          onShow={() => {
            console.log('✅ Modal de especialidades foi exibido');
          }}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => {
              console.log('🔘 Overlay pressionado - Fechando modal');
              setSpecialtyModalVisible(false);
            }}
          >
            <TouchableOpacity
              style={styles.modalContent}
              activeOpacity={1}
              onPress={(e) => {
                // Prevenir que o toque no conteúdo feche o modal
                e.stopPropagation();
              }}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Selecione a Especialidade</Text>
                <TouchableOpacity
                  onPress={() => setSpecialtyModalVisible(false)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              {loadingSpecialties ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Carregando especialidades...</Text>
                </View>
              ) : (
                <View style={styles.flatListContainer}>
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
                          console.log('✅ Especialidade selecionada:', item.id, item.name);
                          updateFormData('medical_specialty_id', item.id);
                          console.log('📝 medical_specialty_id atualizado para:', item.id);
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
                          <Ionicons name="checkmark" size={24} color={colors.primary} />
                        )}
                      </TouchableOpacity>
                    )}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    nestedScrollEnabled={true}
                  />
                </View>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
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
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    marginTop: 20,
    marginBottom: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textLight,
  },
  form: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  inputContainer: {
    marginBottom: 20,
  },
  halfWidth: {
    flex: 1,
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  eyeButton: {
    padding: 12,
  },
  profileSelector: {
    flexDirection: 'column',
    gap: 12,
  },
  profileRow: {
    flexDirection: 'row',
    gap: 12,
  },
  profileOption: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  profileOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  profileIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  profileIconContainerActive: {
    backgroundColor: colors.primary,
  },
  profileOptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  profileOptionTitleActive: {
    color: colors.primary,
  },
  profileOptionDescription: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: 'center',
  },
  profileOptionDescriptionActive: {
    color: colors.primary,
  },
  registerButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: '600',
  },
  termsText: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
  termsLink: {
    color: colors.primary,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 14,
    color: colors.textLight,
  },
  footerLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
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
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  genderOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  genderOptionTextActive: {
    color: colors.primary,
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
    borderColor: colors.success,
    backgroundColor: colors.success + '10',
  },
  formationOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  formationOptionTextActive: {
    color: colors.success,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  specialtySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    minHeight: 50,
  },
  specialtySelectorText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  specialtySelectorPlaceholder: {
    color: colors.placeholder,
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
    height: '50%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  flatListContainer: {
    flex: 1,
  },
  flatList: {
    flex: 1,
  },
  flatListContent: {
    padding: 16,
  },
  specialtyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
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
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textLight,
  },
});

export default RegisterScreen;


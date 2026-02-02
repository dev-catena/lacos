import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import colors from '../../constants/colors';
import doctorService from '../../services/doctorService';
import { formatCrmDisplay } from '../../utils/crm';
import SafeIcon from '../../components/SafeIcon';

const SelectDoctorScreen = ({ route, navigation }) => {
  const { groupId, groupName } = route.params;
  const insets = useSafeAreaInsets();
  const [doctors, setDoctors] = useState([]);
  const [allDoctors, setAllDoctors] = useState([]); // Lista completa para filtro
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [prescriptionImage, setPrescriptionImage] = useState(null);
  
  // Calcular posição do FAB considerando safe area
  const fabBottom = Platform.OS === 'android' 
    ? Math.max(insets.bottom, 20) 
    : 20;

  // Recarregar médicos quando a tela ganhar foco (após cadastrar novo médico)
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 SelectDoctorScreen - useFocusEffect acionado, recarregando médicos...');
      loadDoctors();
    }, [groupId])
  );

  // Também carregar quando o componente montar
  useEffect(() => {
    console.log('🔄 SelectDoctorScreen - useEffect acionado, carregando médicos...');
    loadDoctors();
  }, [groupId]);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      console.log('🔍 SelectDoctorScreen - Carregando médicos para grupo:', groupId);
      
      if (!groupId) {
        console.warn('⚠️ SelectDoctorScreen - groupId não fornecido');
        setAllDoctors([]);
        setDoctors([]);
        setLoading(false);
        return;
      }
      
      // O backend já retorna médicos do grupo E médicos da plataforma em uma única resposta
      const response = await doctorService.getDoctors(groupId);
      
      console.log('📥 SelectDoctorScreen - Resposta completa:', JSON.stringify(response, null, 2));
      
      // Tratar diferentes formatos de resposta
      let doctorsList = [];
      
      if (Array.isArray(response)) {
        doctorsList = response;
        console.log('✅ SelectDoctorScreen - Resposta é array direto, médicos:', doctorsList.length);
      } else if (response && response.success && response.data) {
        if (Array.isArray(response.data)) {
          doctorsList = response.data;
          console.log('✅ SelectDoctorScreen - Dados recebidos do formato padrão:', doctorsList.length);
        } else {
          console.warn('⚠️ SelectDoctorScreen - response.data não é array:', typeof response.data);
        }
      } else if (response && response.data && Array.isArray(response.data)) {
        doctorsList = response.data;
        console.log('✅ SelectDoctorScreen - Dados recebidos do formato alternativo:', doctorsList.length);
      }
      
      // Ordenar: médico assistente primeiro (is_primary=true), depois por nome
      const allDoctors = doctorsList.sort((a, b) => {
        // Ordenar: médicos principais (is_primary=true) primeiro
        if (a.is_primary && !b.is_primary) return -1;
        if (!a.is_primary && b.is_primary) return 1;
        // Depois ordenar por nome
        return a.name.localeCompare(b.name);
      });
      
      console.log('✅ SelectDoctorScreen - Total de médicos processados:', allDoctors.length);
      console.log('✅ SelectDoctorScreen - Médicos ordenados:', allDoctors.map(d => ({
        id: d.id,
        name: d.name,
        is_primary: d.is_primary,
        is_group_doctor: d.is_group_doctor,
        is_platform_doctor: d.is_platform_doctor
      })));
      
      setAllDoctors(allDoctors);
      filterDoctors(allDoctors, searchQuery);
      console.log(`✅ SelectDoctorScreen - ${allDoctors.length} médico(s) carregado(s) e exibidos`);
    } catch (error) {
      console.error('❌ SelectDoctorScreen - Erro ao carregar médicos:', error);
      console.error('❌ SelectDoctorScreen - Stack trace:', error.stack);
      console.error('❌ SelectDoctorScreen - Error message:', error.message);
      setAllDoctors([]);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const filterDoctors = (doctorsList, query) => {
    if (!query || query.trim() === '') {
      setDoctors(doctorsList);
      return;
    }

    const lowerQuery = query.toLowerCase().trim();
    const filtered = doctorsList.filter(doctor => {
      const nameMatch = doctor.name?.toLowerCase().includes(lowerQuery);
      const crmMatch = doctor.crm?.toLowerCase().includes(lowerQuery);
      const specialtyMatch = doctor.medical_specialty?.name?.toLowerCase().includes(lowerQuery);
      
      return nameMatch || crmMatch || specialtyMatch;
    });

    setDoctors(filtered);
  };

  const handleSearchChange = (text) => {
    setSearchQuery(text);
    filterDoctors(allDoctors, text);
  };

  const handleScanPrescription = async () => {
    try {
      // Solicitar permissão da câmera
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permissão Necessária',
          'Precisamos de permissão para usar a câmera para escanear a receita.'
        );
        return;
      }

      // Abrir câmera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        aspect: [3, 4], // Proporção adequada para receitas
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPrescriptionImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erro ao escanear receita:', error);
      Alert.alert('Erro', 'Não foi possível escanear a receita');
    }
  };

  const handlePickFromGallery = async () => {
    try {
      // Solicitar permissão da galeria
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permissão Necessária',
          'Precisamos de permissão para acessar suas fotos.'
        );
        return;
      }

      // Abrir galeria
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        aspect: [3, 4],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPrescriptionImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem');
    }
  };

  const handleRemovePrescription = () => {
    Alert.alert(
      'Remover Receita',
      'Deseja remover a foto da receita?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => setPrescriptionImage(null),
        },
      ]
    );
  };

  const handleSelectDoctor = (doctor) => {
    const { returnTo } = route.params || {};
    
    // Se houver returnTo, retornar o médico selecionado para a tela anterior
    if (returnTo === 'AddPrescription') {
      navigation.navigate(returnTo, {
        groupId,
        groupName,
        selectedDoctor: doctor,
      });
    } else if (prescriptionImage) {
      // Navegar direto para cadastro de medicamento com o médico selecionado e a imagem da receita
      navigation.navigate('AddMedication', { 
        groupId, 
        groupName, 
        prescriptionId: null,
        doctorId: doctor.id,
        doctorName: doctor.name,
        prescriptionImage: prescriptionImage, // Passar a imagem da receita
      });
    } else {
      // Comportamento padrão: navegar para AddMedication
      navigation.navigate('AddMedication', { 
        groupId, 
        groupName, 
        doctorId: doctor.id,
        doctorName: doctor.name,
      });
    }
  };

  const handleAddNewDoctor = () => {
    // Navegar para tela de cadastro de médico
    navigation.navigate('AddDoctor', { 
      groupId, 
      groupName,
      // Não é edição, é novo cadastro
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <SafeIcon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.title}>Selecionar Médico</Text>
          <Text style={styles.subtitle}>{groupName}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Seção de Escanear Receita */}
          <View style={styles.prescriptionSection}>
            <Text style={styles.prescriptionTitle}>Escanear Receita</Text>
            <Text style={styles.prescriptionSubtitle}>
              Tire uma foto da receita médica ou selecione da galeria
            </Text>
            
            {prescriptionImage ? (
              <View style={styles.prescriptionImageContainer}>
                <Image 
                  source={{ uri: prescriptionImage }} 
                  style={styles.prescriptionImage}
                  resizeMode="contain"
                />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={handleRemovePrescription}
                >
                  <SafeIcon name="close-circle" size={24} color={colors.error} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.scanButtonsContainer}>
                <TouchableOpacity
                  style={[styles.scanButton, styles.scanButtonPrimary]}
                  onPress={handleScanPrescription}
                >
                  <SafeIcon name="camera" size={24} color={colors.primary} />
                  <Text style={styles.scanButtonText}>Tirar Foto</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.scanButton, styles.scanButtonSecondary]}
                  onPress={handlePickFromGallery}
                >
                  <SafeIcon name="images" size={24} color={colors.secondary} />
                  <Text style={[styles.scanButtonText, { color: colors.secondary }]}>
                    Galeria
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <Text style={styles.question}>Qual médico prescreveu o medicamento?</Text>

          {/* Campo de Busca */}
          <View style={styles.searchContainer}>
            <SafeIcon name="search" size={20} color={colors.textLight} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nome, CRM ou especialidade..."
              placeholderTextColor={colors.textLight}
              value={searchQuery}
              onChangeText={handleSearchChange}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => handleSearchChange('')}
                style={styles.clearButton}
              >
                <SafeIcon name="close-circle" size={20} color={colors.textLight} />
              </TouchableOpacity>
            )}
          </View>

          {/* Lista de Médicos */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Carregando médicos...</Text>
            </View>
          ) : doctors.length > 0 ? (
            <>
              {searchQuery && (
                <Text style={styles.searchResults}>
                  {doctors.length} médico(s) encontrado(s)
                </Text>
              )}
              {doctors.map((doctor) => (
                <TouchableOpacity
                  key={doctor.id}
                  style={[styles.doctorCard, doctor.is_primary && styles.doctorCardPrimary]}
                  onPress={() => handleSelectDoctor(doctor)}
                >
                  <View style={styles.doctorIcon}>
                    <SafeIcon name="medical" size={32} color={doctor.is_primary ? colors.primary : colors.secondary} />
                  </View>
                  <View style={styles.doctorInfo}>
                    <View style={styles.doctorNameRow}>
                      <Text style={[styles.doctorName, doctor.is_primary && styles.doctorNamePrimary]}>
                        {doctor.name}
                      </Text>
                      {doctor.is_primary && (
                        <View style={styles.primaryBadge}>
                          <SafeIcon name="star" size={14} color={colors.primary} />
                          <Text style={styles.primaryBadgeText}>Assistente</Text>
                        </View>
                      )}
                    </View>
                    {doctor.medical_specialty?.name && (
                      <Text style={styles.doctorSpecialty}>{doctor.medical_specialty.name}</Text>
                    )}
                    {doctor.crm && (
                      <Text style={styles.doctorCrm}>CRM: {formatCrmDisplay(doctor.crm)}</Text>
                    )}
                  </View>
                  <SafeIcon name="chevron-forward" size={24} color={colors.gray400} />
                </TouchableOpacity>
              ))}

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>ou</Text>
                <View style={styles.dividerLine} />
              </View>
            </>
          ) : (
            <View style={styles.emptyState}>
              <SafeIcon name="medical-outline" size={64} color={colors.gray300} />
              <Text style={styles.emptyText}>Nenhum médico cadastrado</Text>
            </View>
          )}

          {/* Info */}
          <View style={styles.infoCard}>
            <SafeIcon name="information-circle" size={20} color={colors.info} />
            <Text style={styles.infoText}>
              Vincular a receita médica ajuda a manter o histórico organizado e facilita consultas futuras
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Botão Flutuante - Cadastrar Novo Médico */}
      <TouchableOpacity
        style={[styles.fab, { bottom: fabBottom }]}
        onPress={handleAddNewDoctor}
        activeOpacity={0.8}
      >
        <SafeIcon name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
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
  content: {
    padding: 20,
  },
  question: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  doctorCardPrimary: {
    backgroundColor: colors.primary + '08',
    borderColor: colors.primary + '30',
    borderWidth: 1.5,
  },
  doctorIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.secondary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  doctorNamePrimary: {
    color: colors.primary,
    fontWeight: '700',
  },
  primaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  primaryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  doctorSpecialty: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 2,
  },
  doctorCrm: {
    fontSize: 12,
    color: colors.textLight,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 12,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: 14,
    color: colors.textLight,
    marginHorizontal: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.info + '10',
    padding: 12,
    borderRadius: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: colors.text,
    lineHeight: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 20,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    paddingVertical: 0,
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  searchResults: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  prescriptionSection: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  prescriptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  prescriptionSubtitle: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 16,
  },
  scanButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  scanButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  scanButtonPrimary: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary,
  },
  scanButtonSecondary: {
    backgroundColor: colors.secondary + '10',
    borderColor: colors.secondary,
  },
  scanButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  prescriptionImageContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  prescriptionImage: {
    width: '100%',
    height: 300,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.background,
    borderRadius: 20,
    padding: 4,
  },
});

export default SelectDoctorScreen;


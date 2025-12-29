import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import colors from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import Toast from 'react-native-toast-message';
import apiService from '../../services/apiService';
import {
  ArrowBackIcon,
  StarIcon,
  LocationIcon,
  PersonIcon,
  MedicalIcon,
  TimeIcon,
  FilterIcon,
  SearchIcon,
  CloseIcon,
  CheckIcon,
  PeopleIcon,
  MoneyIcon,
} from '../../components/CustomIcons';

const CaregiversListScreen = ({ navigation }) => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [caregivers, setCaregivers] = useState([]);
  const [filteredCaregivers, setFilteredCaregivers] = useState([]);
  
  // Filtros
  const [minRating, setMinRating] = useState(0);
  const [maxDistance, setMaxDistance] = useState(null); // em km
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFormations, setSelectedFormations] = useState([]); // ['Cuidador', 'Auxiliar de enfermagem']
  const [selectedGender, setSelectedGender] = useState(null); // 'Masculino' ou 'Feminino' ou null
  const [maxHourlyRate, setMaxHourlyRate] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      loadCaregivers();
    }, [])
  );

  const loadCaregivers = async () => {
    try {
      setLoading(true);
      
      // Preparar parâmetros da requisição
      const params = {};
      
      // Adicionar filtro de avaliação mínima
      if (minRating > 0) {
        params.min_rating = minRating;
      }
      
      // Adicionar filtro de distância (se disponível)
      if (maxDistance && user?.latitude && user?.longitude) {
        params.max_distance = maxDistance;
        params.latitude = user.latitude;
        params.longitude = user.longitude;
      }
      
      // Adicionar busca por texto
      if (searchText.trim()) {
        params.search = searchText.trim();
      }
      
      // Adicionar filtro de formação
      if (selectedFormations.length > 0) {
        params.formation_types = selectedFormations;
      }
      
      // Adicionar filtro de sexo
      if (selectedGender) {
        // Converter para inglês (backend espera male/female)
        const genderMap = {
          'Masculino': 'male',
          'Feminino': 'female',
        };
        params.gender = genderMap[selectedGender] || selectedGender;
      }
      
      // Adicionar filtro de valor máximo
      if (maxHourlyRate && !isNaN(parseFloat(maxHourlyRate))) {
        params.max_hourly_rate = parseFloat(maxHourlyRate);
      }
      
      // Construir query string
      const queryString = Object.keys(params)
        .map(key => {
          if (Array.isArray(params[key])) {
            return params[key].map(val => `${key}[]=${encodeURIComponent(val)}`).join('&');
          }
          return `${key}=${encodeURIComponent(params[key])}`;
        })
        .join('&');
      
      const endpoint = queryString ? `/caregivers?${queryString}` : '/caregivers';
      
      // Fazer requisição à API
      console.log('🔍 Buscando cuidadores com parâmetros:', params);
      const response = await apiService.get(endpoint);
      console.log('📥 Resposta da API:', response);
      
      // A API pode retornar de diferentes formas
      let caregiversData = [];
      
      if (response && Array.isArray(response)) {
        // Se retornar array diretamente
        caregiversData = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        // Se retornar { data: [...] }
        caregiversData = response.data;
      } else if (response && response.success && response.data && Array.isArray(response.data)) {
        // Se retornar { success: true, data: [...] }
        caregiversData = response.data;
      }
      
      // Transformar dados da API para o formato esperado pela UI
      const caregivers = caregiversData.map(caregiver => ({
        id: caregiver.id,
        name: caregiver.name || '',
        city: caregiver.city || '',
        neighborhood: caregiver.neighborhood || '',
        gender: caregiver.gender === 'male' ? 'Masculino' : caregiver.gender === 'female' ? 'Feminino' : (caregiver.gender || ''),
        rating: parseFloat(caregiver.rating) || 0,
        formation: caregiver.formation || caregiver.formation_details || 'Não informado',
        hourlyRate: parseFloat(caregiver.hourly_rate || caregiver.hourlyRate) || 0,
        availability: caregiver.availability || 'Não informado',
        latitude: caregiver.latitude,
        longitude: caregiver.longitude,
        photo_url: caregiver.photo_url || null,
        photo: caregiver.photo || null,
      }));
      
      console.log('✅ Cuidadores carregados:', caregivers.length);
      setCaregivers(caregivers);
      setFilteredCaregivers(caregivers);
    } catch (error) {
      console.error('Erro ao carregar cuidadores:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: error.message || 'Não foi possível carregar a lista de cuidadores',
      });
      // Em caso de erro, usar array vazio
      setCaregivers([]);
      setFilteredCaregivers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCaregivers();
  };

  const applyFilters = () => {
    let filtered = [...caregivers];

    // Filtro por avaliação (estrelas)
    if (minRating > 0) {
      filtered = filtered.filter(c => c.rating >= minRating);
    }

    // Filtro por proximidade geográfica
    if (maxDistance && user?.latitude && user?.longitude) {
      filtered = filtered.filter(c => {
        const distance = calculateDistance(
          user.latitude,
          user.longitude,
          c.latitude,
          c.longitude
        );
        return distance <= maxDistance;
      });
    }

    // Filtro por texto (nome, cidade, bairro)
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(search) ||
        c.city.toLowerCase().includes(search) ||
        c.neighborhood.toLowerCase().includes(search)
      );
    }

    // Filtro por formação (checkbox)
    if (selectedFormations.length > 0) {
      filtered = filtered.filter(c =>
        selectedFormations.includes(c.formation)
      );
    }

    // Filtro por sexo
    if (selectedGender) {
      filtered = filtered.filter(c => c.gender === selectedGender);
    }

    // Filtro por valor máximo por hora
    if (maxHourlyRate && !isNaN(parseFloat(maxHourlyRate))) {
      const maxRate = parseFloat(maxHourlyRate);
      filtered = filtered.filter(c => c.hourlyRate <= maxRate);
    }

    setFilteredCaregivers(filtered);
  };

  // Recarregar da API quando os filtros mudarem
  useEffect(() => {
    if (!loading) {
      loadCaregivers();
    }
  }, [minRating, maxDistance, selectedFormations, selectedGender, maxHourlyRate]);

  // Debounce para busca por texto
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!loading) {
        loadCaregivers();
      }
    }, 500); // Debounce de 500ms
    
    return () => clearTimeout(timeoutId);
  }, [searchText]);

  // Função para calcular distância entre duas coordenadas (Haversine)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <StarIcon key={i} size={16} color={colors.warning} filled={true} />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <StarIcon key="half" size={16} color={colors.warning} filled={false} />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <StarIcon key={`empty-${i}`} size={16} color={colors.gray400} filled={false} />
      );
    }

    return stars;
  };

  const renderCaregiverCard = (caregiver) => (
    <TouchableOpacity
      key={caregiver.id}
      style={styles.caregiverCard}
      onPress={() => navigation.navigate('CaregiverDetails', { caregiver })}
      activeOpacity={0.7}
    >
      <View style={styles.caregiverHeader}>
        <View style={styles.caregiverAvatar}>
          {caregiver.photo_url || caregiver.photo ? (
            <Image
              source={{ uri: caregiver.photo_url || caregiver.photo }}
              style={styles.caregiverAvatarImage}
            />
          ) : (
            <PersonIcon
              size={32}
              color={colors.primary}
            />
          )}
        </View>
        <View style={styles.caregiverInfo}>
          <Text style={styles.caregiverName}>{caregiver.name}</Text>
          <View style={styles.locationRow}>
            <LocationIcon size={14} color={colors.textLight} />
            <Text style={styles.locationText}>
              {caregiver.neighborhood}, {caregiver.city}
            </Text>
          </View>
          <View style={styles.ratingRow}>
            <View style={styles.starsContainer}>
              {renderStars(caregiver.rating)}
            </View>
            <Text style={styles.ratingText}>{caregiver.rating.toFixed(1)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.caregiverDetails}>
        {caregiver.formation && (
          <View style={styles.detailRow}>
            <MedicalIcon size={16} color={colors.textLight} />
            <Text style={styles.detailText}>{caregiver.formation}</Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <MoneyIcon size={16} color={colors.textLight} />
          <Text style={styles.detailText}>R$ {Number(caregiver.hourlyRate || caregiver.hourly_rate || 0).toFixed(2)}/hora</Text>
        </View>
        {caregiver.gender && (
          <View style={styles.detailRow}>
            <PersonIcon size={16} color={colors.textLight} />
            <Text style={styles.detailText}>{caregiver.gender}</Text>
          </View>
        )}
        {caregiver.availability && (
          <View style={styles.detailRow}>
            <TimeIcon size={16} color={colors.textLight} />
            <Text style={styles.detailText} numberOfLines={1}>{caregiver.availability}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando cuidadores...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? insets.top + 16 : 16 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ArrowBackIcon size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Buscar Cuidadores</Text>
          <Text style={styles.headerSubtitle}>
            {filteredCaregivers.length} cuidador(es) encontrado(s)
          </Text>
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
          activeOpacity={0.7}
        >
          <FilterIcon
            size={24}
            color={colors.primary}
            filled={showFilters}
          />
        </TouchableOpacity>
      </View>

      {/* Barra de busca */}
      <View style={styles.searchContainer}>
        <SearchIcon size={20} color={colors.textLight} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nome, cidade ou bairro..."
          placeholderTextColor={colors.placeholder}
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <CloseIcon size={20} color={colors.textLight} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filtros */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <Text style={styles.filtersTitle}>Filtros</Text>
          
          {/* Filtro por avaliação */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Avaliação mínima</Text>
            <View style={styles.ratingFilter}>
              {[1, 2, 3, 4, 5].map((rating) => (
                <TouchableOpacity
                  key={rating}
                  style={[
                    styles.ratingButton,
                    minRating === rating && styles.ratingButtonActive,
                  ]}
                  onPress={() => setMinRating(minRating === rating ? 0 : rating)}
                >
                  <StarIcon
                    size={20}
                    color={minRating >= rating ? colors.warning : colors.gray400}
                    filled={minRating >= rating}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Filtro por distância */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Proximidade (km)</Text>
            <View style={styles.distanceFilter}>
              {[5, 10, 20, 50].map((distance) => (
                <TouchableOpacity
                  key={distance}
                  style={[
                    styles.distanceButton,
                    maxDistance === distance && styles.distanceButtonActive,
                  ]}
                  onPress={() => setMaxDistance(maxDistance === distance ? null : distance)}
                >
                  <Text
                    style={[
                      styles.distanceButtonText,
                      maxDistance === distance && styles.distanceButtonTextActive,
                    ]}
                  >
                    {distance} km
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Filtro por formação */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Formação</Text>
            <View style={styles.checkboxContainer}>
              {['Cuidador', 'Auxiliar de enfermagem'].map((formation) => (
                <TouchableOpacity
                  key={formation}
                  style={styles.checkboxRow}
                  onPress={() => {
                    if (selectedFormations.includes(formation)) {
                      setSelectedFormations(selectedFormations.filter(f => f !== formation));
                    } else {
                      setSelectedFormations([...selectedFormations, formation]);
                    }
                  }}
                >
                  <View style={[
                    styles.checkbox,
                    selectedFormations.includes(formation) && styles.checkboxChecked
                  ]}>
                    {selectedFormations.includes(formation) && (
                      <CheckIcon size={16} color={colors.white} />
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>{formation}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Filtro por sexo */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Sexo</Text>
            <View style={styles.genderFilter}>
              {['Masculino', 'Feminino'].map((gender) => (
                <TouchableOpacity
                  key={gender}
                  style={[
                    styles.genderButton,
                    selectedGender === gender && styles.genderButtonActive,
                  ]}
                  onPress={() => setSelectedGender(selectedGender === gender ? null : gender)}
                >
                  <Text
                    style={[
                      styles.genderButtonText,
                      selectedGender === gender && styles.genderButtonTextActive,
                    ]}
                  >
                    {gender}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Filtro por valor máximo */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Valor máximo por hora</Text>
            <View style={styles.priceInputContainer}>
              <Text style={styles.pricePrefix}>R$</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="Ex: 50.00"
                placeholderTextColor={colors.placeholder}
                value={maxHourlyRate}
                onChangeText={(text) => {
                  // Permitir apenas números e ponto
                  const cleaned = text.replace(/[^0-9.]/g, '');
                  setMaxHourlyRate(cleaned);
                }}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        </View>
      )}

      {/* Lista de cuidadores */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredCaregivers.length > 0 ? (
          filteredCaregivers.map(renderCaregiverCard)
        ) : (
          <View style={styles.emptyState}>
            <PeopleIcon size={64} color={colors.gray300} />
            <Text style={styles.emptyStateTitle}>Nenhum cuidador encontrado</Text>
            <Text style={styles.emptyStateText}>
              Tente ajustar os filtros ou a busca
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textLight,
    marginTop: 2,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  filtersContainer: {
    backgroundColor: colors.backgroundLight,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  ratingFilter: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  ratingButtonActive: {
    backgroundColor: colors.warning + '20',
  },
  distanceFilter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  distanceButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  distanceButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  distanceButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  distanceButtonTextActive: {
    color: colors.white,
  },
  checkboxContainer: {
    gap: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxLabel: {
    fontSize: 14,
    color: colors.text,
  },
  genderFilter: {
    flexDirection: 'row',
    gap: 8,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  genderButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  genderButtonTextActive: {
    color: colors.white,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  pricePrefix: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  caregiverCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 0,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  caregiverHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  caregiverAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  caregiverAvatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  caregiverInfo: {
    flex: 1,
  },
  caregiverName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  locationText: {
    fontSize: 13,
    color: colors.textLight,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 4,
  },
  caregiverDetails: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: colors.text,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray600,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.gray500,
    textAlign: 'center',
  },
});

export default CaregiversListScreen;


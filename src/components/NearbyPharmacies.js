import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';
import colors from '../constants/colors';
import pharmacyPriceService from '../services/pharmacyPriceService';
import pharmacySearchService from '../services/pharmacySearchService';

const NearbyPharmacies = ({ style, medicationName, groupId }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pharmacies, setPharmacies] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [priceInputs, setPriceInputs] = useState({}); // { pharmacyId: { price: '', notes: '', loading: false } }
  const [lastPrices, setLastPrices] = useState({}); // { pharmacyId: { price, informedBy, daysAgo } }

  // Calcular distância entre duas coordenadas (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Raio da Terra em metros
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distância em metros
  };

  // Formatar distância para exibição
  const formatDistance = (distanceInMeters) => {
    if (distanceInMeters < 1000) {
      return `${Math.round(distanceInMeters)} m`;
    }
    return `${(distanceInMeters / 1000).toFixed(1)} km`;
  };

  // Buscar farmácias próximas
  const findNearbyPharmacies = async () => {
    let topPharmacies = []; // Declarar no início da função para estar disponível em todo o escopo
    
    try {
      setLoading(true);
      setModalVisible(true);

      // Solicitar permissão de localização
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permissão Negada',
          'Precisamos da sua localização para encontrar farmácias próximas.',
          [{ text: 'OK' }]
        );
        setLoading(false);
        setModalVisible(false);
        return;
      }

      // Obter localização atual
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      setUserLocation({ latitude, longitude });

      // Buscar farmácias reais usando Google Places API
      
      try {
        const nearbyPharmacies = await pharmacySearchService.searchNearby(
          latitude,
          longitude,
          5000 // 5km de raio
        );

        // Calcular distância e ordenar
        const pharmaciesWithDistance = nearbyPharmacies.map((pharmacy) => ({
          ...pharmacy,
          distance: pharmacySearchService.calculateDistance(
            latitude,
            longitude,
            pharmacy.latitude,
            pharmacy.longitude
          ),
        }));

        // Ordenar por distância
        const sortedPharmacies = pharmaciesWithDistance.sort(
          (a, b) => a.distance - b.distance
        );

        // Pegar as 3 mais próximas
        topPharmacies = sortedPharmacies.slice(0, 3);
        setPharmacies(topPharmacies);
      } catch (error) {
        console.error('Erro ao buscar farmácias reais:', error);
        
        // Fallback: usar farmácias simuladas se a API falhar
        console.warn('⚠️ Usando farmácias simuladas como fallback');
        const simulatedPharmacies = generateSimulatedPharmacies(latitude, longitude);
        const sortedPharmacies = simulatedPharmacies.sort(
          (a, b) => a.distance - b.distance
        );
        topPharmacies = sortedPharmacies.slice(0, 3);
        setPharmacies(topPharmacies);
        
        // Mostrar aviso ao usuário
        Toast.show({
          type: 'info',
          text1: 'Aviso',
          text2: 'Usando dados simulados. Verifique a configuração da API do Google Maps.',
          visibilityTime: 3000,
        });
      }

      // Se houver nome do medicamento, buscar últimos preços informados
      if (medicationName && topPharmacies && topPharmacies.length > 0) {
        try {
          await loadLastPrices(topPharmacies, medicationName);
        } catch (priceError) {
          // Ignorar erros ao buscar preços (não crítico)
          console.warn('Erro ao buscar preços (não crítico):', priceError);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar farmácias:', error);
      Alert.alert(
        'Erro',
        'Não foi possível buscar farmácias próximas. Tente novamente.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  // Buscar últimos preços informados para cada farmácia
  const loadLastPrices = async (pharmaciesList, medName) => {
    if (!medName) return;

    const prices = {};
    for (const pharmacy of pharmaciesList) {
      try {
        const result = await pharmacyPriceService.getLastPrice(medName, pharmacy.name);
        // 404 não é erro - apenas significa que não há preço informado ainda
        if (result.success && result.data && result.data.price !== undefined) {
          prices[pharmacy.id] = {
            price: result.data.price,
            informedBy: result.data.informed_by,
            daysAgo: result.data.days_ago,
            informedAt: result.data.informed_at,
          };
        }
      } catch (error) {
        // Ignorar erros 404 (sem preço informado ainda)
        if (error.status !== 404) {
          console.error(`Erro ao buscar preço para ${pharmacy.name}:`, error);
        }
      }
    }
    setLastPrices(prices);
  };

  // Salvar preço informado pelo usuário
  const savePrice = async (pharmacy) => {
    if (!medicationName) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Nome do medicamento não informado',
      });
      return;
    }

    const input = priceInputs[pharmacy.id];
    if (!input || !input.price || parseFloat(input.price) <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Preço inválido',
        text2: 'Informe um preço válido',
      });
      return;
    }

    // Atualizar estado de loading
    setPriceInputs((prev) => ({
      ...prev,
      [pharmacy.id]: { ...prev[pharmacy.id], loading: true },
    }));

    try {
      const result = await pharmacyPriceService.savePrice({
        medicationName,
        pharmacyName: pharmacy.name,
        pharmacyAddress: pharmacy.address,
        price: parseFloat(input.price),
        notes: input.notes || null,
        groupId,
      });

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Preço informado!',
          text2: 'Obrigado por contribuir. Da próxima vez indicaremos este preço.',
          visibilityTime: 3000,
        });

        // Limpar input
        setPriceInputs((prev) => ({
          ...prev,
          [pharmacy.id]: { price: '', notes: '', loading: false },
        }));

        // Recarregar último preço
        await loadLastPrices([pharmacy], medicationName);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Erro',
          text2: result.error || 'Não foi possível salvar o preço',
        });
      }
    } catch (error) {
      console.error('Erro ao salvar preço:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível salvar o preço',
      });
    } finally {
      setPriceInputs((prev) => ({
        ...prev,
        [pharmacy.id]: { ...prev[pharmacy.id], loading: false },
      }));
    }
  };

  // Gerar farmácias simuladas (substituir por API real)
  const generateSimulatedPharmacies = (userLat, userLon) => {
    const pharmacyNames = [
      'Farmácia Popular Central',
      'Drogaria Saúde',
      'Farmácia Bem Estar',
      'Drogaria Vida',
      'Farmácia Popular Norte',
      'Drogaria Esperança',
      'Farmácia Popular Sul',
      'Drogaria Confiança',
    ];

    return pharmacyNames.map((name, index) => {
      // Gerar coordenadas próximas (dentro de ~5km)
      const offsetLat = (Math.random() - 0.5) * 0.05; // ~5.5km
      const offsetLon = (Math.random() - 0.5) * 0.05;
      const lat = userLat + offsetLat;
      const lon = userLon + offsetLon;

      const distance = calculateDistance(userLat, userLon, lat, lon);

      return {
        id: index + 1,
        name,
        address: `Rua ${Math.floor(Math.random() * 1000)}, Centro`,
        latitude: lat,
        longitude: lon,
        distance,
        phone: `(31) ${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
        isOpen: Math.random() > 0.3, // 70% de chance de estar aberta
      };
    });
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.button, style]}
        onPress={findNearbyPharmacies}
        activeOpacity={0.7}
      >
        <Ionicons name="location" size={20} color={colors.primary} />
        <Text style={styles.buttonText}>Farmácia mais próxima</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Farmácias Próximas</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Buscando farmácias...</Text>
              </View>
            ) : pharmacies.length > 0 ? (
              <ScrollView style={styles.pharmaciesList}>
                {pharmacies.map((pharmacy) => {
                  const lastPrice = lastPrices[pharmacy.id];
                  const priceInput = priceInputs[pharmacy.id] || { price: '', notes: '', loading: false };

                  return (
                    <View key={pharmacy.id} style={styles.pharmacyCard}>
                      <View style={styles.pharmacyHeader}>
                        <View style={styles.pharmacyIconContainer}>
                          <Ionicons
                            name="medical"
                            size={24}
                            color={colors.primary}
                          />
                        </View>
                        <View style={styles.pharmacyInfo}>
                          <Text style={styles.pharmacyName}>{pharmacy.name}</Text>
                          <View style={styles.statusContainer}>
                            {pharmacy.isOpen !== null && (
                              <>
                                <View
                                  style={[
                                    styles.statusDot,
                                    {
                                      backgroundColor: pharmacy.isOpen
                                        ? '#10b981'
                                        : '#ef4444',
                                    },
                                  ]}
                                />
                                <Text style={styles.statusText}>
                                  {pharmacy.isOpen ? 'Aberto' : 'Fechado'}
                                </Text>
                              </>
                            )}
                            {pharmacy.rating && (
                              <View style={styles.ratingContainer}>
                                <Ionicons name="star" size={12} color="#fbbf24" />
                                <Text style={styles.ratingText}>
                                  {pharmacy.rating.toFixed(1)}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <View style={styles.distanceContainer}>
                          <Ionicons
                            name="location"
                            size={16}
                            color={colors.primary}
                          />
                          <Text style={styles.distanceText}>
                            {formatDistance(pharmacy.distance)}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.pharmacyDetails}>
                        <View style={styles.detailRow}>
                          <Ionicons
                            name="location-outline"
                            size={16}
                            color={colors.textLight}
                          />
                          <Text style={styles.detailText}>{pharmacy.address}</Text>
                        </View>
                      {pharmacy.phone && (
                        <View style={styles.detailRow}>
                          <Ionicons
                            name="call-outline"
                            size={16}
                            color={colors.textLight}
                          />
                          <Text style={styles.detailText}>{pharmacy.phone}</Text>
                        </View>
                      )}
                      </View>

                      {/* Último preço informado */}
                      {lastPrice && lastPrice.price !== undefined && lastPrice.price !== null && (
                        <View style={styles.lastPriceContainer}>
                          <View style={styles.lastPriceHeader}>
                            <Ionicons name="cash-outline" size={16} color={colors.primary} />
                            <Text style={styles.lastPriceLabel}>Último preço informado:</Text>
                          </View>
                          <Text style={styles.lastPriceValue}>
                            R$ {Number(lastPrice.price).toFixed(2).replace('.', ',')}
                          </Text>
                          <Text style={styles.lastPriceInfo}>
                            Informado por {lastPrice.informedBy || 'Usuário'} {lastPrice.daysAgo === 0 
                              ? 'hoje' 
                              : lastPrice.daysAgo === 1 
                              ? 'ontem' 
                              : `há ${lastPrice.daysAgo} dias`}
                          </Text>
                        </View>
                      )}

                      {/* Formulário para informar preço */}
                      {medicationName && (
                        <View style={styles.priceInputContainer}>
                          <Text style={styles.priceInputTitle}>
                            Se você achou um bom preço, informe aqui que da próxima vez indicaremos
                          </Text>
                          <View style={styles.priceInputRow}>
                            <Text style={styles.priceInputLabel}>R$</Text>
                            <TextInput
                              style={styles.priceInput}
                              placeholder="0,00"
                              placeholderTextColor={colors.textLight}
                              value={priceInput.price}
                              onChangeText={(text) => {
                                // Permitir apenas números e vírgula/ponto
                                const cleaned = text.replace(/[^0-9,.]/g, '');
                                setPriceInputs((prev) => ({
                                  ...prev,
                                  [pharmacy.id]: { ...prev[pharmacy.id], price: cleaned },
                                }));
                              }}
                              keyboardType="numeric"
                            />
                          </View>
                          <TextInput
                            style={styles.notesInput}
                            placeholder="Observações (opcional)"
                            placeholderTextColor={colors.textLight}
                            value={priceInput.notes}
                            onChangeText={(text) => {
                              setPriceInputs((prev) => ({
                                ...prev,
                                [pharmacy.id]: { ...prev[pharmacy.id], notes: text },
                              }));
                            }}
                            multiline
                            numberOfLines={2}
                          />
                          <TouchableOpacity
                            style={[
                              styles.savePriceButton,
                              priceInput.loading && styles.savePriceButtonDisabled,
                            ]}
                            onPress={() => savePrice(pharmacy)}
                            disabled={priceInput.loading || !priceInput.price}
                            activeOpacity={0.7}
                          >
                            {priceInput.loading ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <>
                                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                                <Text style={styles.savePriceButtonText}>Informar Preço</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="location-outline"
                  size={48}
                  color={colors.textLight}
                />
                <Text style={styles.emptyText}>
                  Nenhuma farmácia encontrada próxima a você.
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary + '15',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
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
    fontWeight: '600',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: colors.textLight,
  },
  pharmaciesList: {
    padding: 20,
  },
  pharmacyCard: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pharmacyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  pharmacyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pharmacyInfo: {
    flex: 1,
  },
  pharmacyName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: colors.textLight,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
    backgroundColor: '#fbbf2415',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fbbf24',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary + '10',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  pharmacyDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: colors.textLight,
    flex: 1,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
  },
  lastPriceContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.primary + '10',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  lastPriceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  lastPriceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  lastPriceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginVertical: 4,
  },
  lastPriceInfo: {
    fontSize: 11,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  priceInputContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  priceInputTitle: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  priceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
  },
  notesInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  savePriceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  savePriceButtonDisabled: {
    opacity: 0.6,
  },
  savePriceButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default NearbyPharmacies;


import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SafeIcon from './SafeIcon';
import colors from '../constants/colors';
import popularPharmacyService from '../services/popularPharmacyService';

const PopularPharmacies = ({ medicationName, groupId }) => {
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadNearbyPharmacies();
  }, []);

  const loadNearbyPharmacies = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar farmácias próximas (raio de 10km, máximo 5 resultados)
      const result = await popularPharmacyService.getNearbyPharmacies(10, 5);

      if (result.success && result.data.length > 0) {
        setPharmacies(result.data);
      } else {
        // Se não encontrou por localização, tentar buscar por cidade (fallback)
        // Isso requer que o usuário tenha permitido localização anteriormente
        // ou que possamos obter a cidade de outra forma
        setError(result.error || 'Nenhuma farmácia encontrada próxima a você');
      }
    } catch (err) {
      console.error('Erro ao carregar farmácias populares:', err);
      setError('Erro ao buscar farmácias próximas. Verifique sua conexão e permissões de localização.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenMaps = async (pharmacy) => {
    try {
      await popularPharmacyService.openInMaps(pharmacy);
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível abrir o mapa');
    }
  };

  const handleCall = async (pharmacy) => {
    try {
      await popularPharmacyService.callPharmacy(pharmacy.phone);
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível fazer a ligação');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <SafeIcon name="location-outline" size={20} color={colors.primary} />
          <Text style={styles.title}>xxFarmácias Populares Próximas</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Buscando farmácias próximas...</Text>
        </View>
      </View>
    );
  }

  if (error || pharmacies.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <SafeIcon name="location-outline" size={20} color={colors.primary} />
          <Text style={styles.title}>xxFarmácias Populares Próximas</Text>
        </View>
        <View style={styles.emptyContainer}>
          <SafeIcon name="location-outline" size={32} color={colors.gray300} />
          <Text style={styles.emptyText}>
            {error || 'Nenhuma farmácia popular encontrada próxima'}
          </Text>
          <Text style={styles.emptySubtext}>
            {error && error.includes('Permissão') 
              ? 'É necessário permitir o acesso à localização para encontrar farmácias próximas.'
              : 'Tente novamente ou verifique se há farmácias populares na sua região.'}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadNearbyPharmacies}
          >
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SafeIcon name="location-outline" size={20} color={colors.primary} />
        <View style={styles.headerText}>
          <Text style={styles.title}>xxFarmácias Populares Próximas</Text>
          <Text style={styles.subtitle}>
            {pharmacies.length} {pharmacies.length === 1 ? 'farmácia encontrada' : 'farmácias encontradas'} em até 10 km
          </Text>
        </View>
      </View>

      {pharmacies.map((pharmacy, index) => (
        <TouchableWithoutFeedback key={pharmacy.id || index}>
          <View 
            style={{
              backgroundColor: colors.white,
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              borderWidth: 0.5,
              borderColor: colors.gray200 || '#E2E8F0',
              ...Platform.select({
                android: {
                  elevation: 0,
                  shadowColor: 'transparent',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0,
                  shadowRadius: 0,
                },
                ios: {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.06,
                  shadowRadius: 2,
                },
              }),
            }}
            collapsable={false}
            needsOffscreenAlphaCompositing={false}
          >
            <View style={styles.pharmacyHeader}>
            <View style={styles.pharmacyInfo}>
              <Text style={styles.pharmacyName}>{pharmacy.name}</Text>
              {pharmacy.distance !== undefined && (
                <Text style={styles.pharmacyDistance}>
                  📍 {pharmacy.distance < 1 
                    ? `${Math.round(pharmacy.distance * 1000)} m de distância`
                    : `${pharmacy.distance} km de distância`}
                </Text>
              )}
            </View>
            <View style={styles.badge}>
              <SafeIcon name="checkmark-circle" size={16} color={colors.success} />
              <Text style={styles.badgeText}>Popular</Text>
            </View>
          </View>

          <View style={styles.pharmacyDetails}>
            {pharmacy.address && (
              <View style={styles.detailRow}>
                <SafeIcon name="location-outline" size={14} color={colors.gray500} />
                <Text style={styles.detailText} numberOfLines={2}>
                  {pharmacy.address}
                  {pharmacy.neighborhood && `, ${pharmacy.neighborhood}`}
                  {pharmacy.city && ` - ${pharmacy.city}/${pharmacy.state}`}
                </Text>
              </View>
            )}

            {pharmacy.phone && (
              <View style={styles.detailRow}>
                <SafeIcon name="call" size={14} color={colors.gray500} />
                <Text style={styles.detailText}>{pharmacy.phone}</Text>
              </View>
            )}
          </View>

          <View style={styles.pharmacyActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleOpenMaps(pharmacy)}
            >
              <SafeIcon name="map-outline" size={18} color={colors.primary} />
              <Text style={styles.actionButtonText}>Ver no mapa</Text>
            </TouchableOpacity>

            {pharmacy.phone && (
              <TouchableOpacity
                style={[styles.actionButton, styles.callButton]}
                onPress={() => handleCall(pharmacy)}
              >
                <SafeIcon name="call" size={18} color={colors.success} />
                <Text style={[styles.actionButtonText, styles.callButtonText]}>
                  Ligar
                </Text>
              </TouchableOpacity>
            )}
          </View>
          </View>
        </TouchableWithoutFeedback>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerText: {
    flex: 1,
    marginLeft: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: colors.gray500,
    marginTop: 2,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 8,
    color: colors.gray500,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 8,
    color: colors.gray500,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 4,
  },
  emptySubtext: {
    marginTop: 4,
    color: colors.gray400,
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.primary + '20',
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  // pharmacyCard removido - usando estilos inline para evitar bordas
  pharmacyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  pharmacyInfo: {
    flex: 1,
    marginRight: 8,
  },
  pharmacyName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  pharmacyDistance: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '600',
    marginLeft: 4,
  },
  pharmacyDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  detailText: {
    flex: 1,
    fontSize: 13,
    color: colors.gray600,
    marginLeft: 6,
    lineHeight: 18,
  },
  pharmacyActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.primary + '10',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  actionButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  callButton: {
    backgroundColor: colors.success + '10',
    borderColor: colors.success + '30',
  },
  callButtonText: {
    color: colors.success,
  },
});

export default PopularPharmacies;


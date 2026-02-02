import apiService from './apiService';
import * as Location from 'expo-location';
import { Linking } from 'react-native';

/**
 * Serviço para buscar farmácias populares
 */
class PopularPharmacyService {
  /**
   * Buscar farmácias populares próximas usando localização do usuário
   * @param {number} radius - Raio em km (padrão: 10km)
   * @param {number} limit - Limite de resultados (padrão: 10)
   * @returns {Promise<Object>} Objeto com lista de farmácias e distâncias
   */
  async getNearbyPharmacies(radius = 10, limit = 10) {
    try {
      // Solicitar permissão de localização
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        return {
          success: false,
          error: 'Permissão de localização negada',
          data: [],
        };
      }

      // Obter localização atual
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Buscar farmácias próximas via API
      const response = await apiService.get(
        `/popular-pharmacies/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radius}&limit=${limit}`
      );

      if (response && response.success) {
        return {
          success: true,
          data: response.data || [],
          count: response.count || 0,
        };
      }

      return {
        success: false,
        error: 'Nenhuma farmácia encontrada',
        data: [],
      };
    } catch (error) {
      console.error('Erro ao buscar farmácias próximas:', error);
      return {
        success: false,
        error: error.message || 'Erro ao buscar farmácias próximas',
        data: [],
      };
    }
  }

  /**
   * Buscar farmácias populares próximas usando coordenadas fornecidas
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @param {number} radius - Raio em km (padrão: 10km)
   * @param {number} limit - Limite de resultados (padrão: 10)
   * @returns {Promise<Object>} Objeto com lista de farmácias e distâncias
   */
  async getNearbyPharmaciesByCoordinates(latitude, longitude, radius = 10, limit = 10) {
    try {
      if (!latitude || !longitude) {
        return {
          success: false,
          error: 'Coordenadas inválidas',
          data: [],
        };
      }

      const response = await apiService.get(
        `/popular-pharmacies/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radius}&limit=${limit}`
      );

      if (response && response.success) {
        return {
          success: true,
          data: response.data || [],
          count: response.count || 0,
        };
      }

      return {
        success: false,
        error: 'Nenhuma farmácia encontrada',
        data: [],
      };
    } catch (error) {
      console.error('Erro ao buscar farmácias próximas:', error);
      return {
        success: false,
        error: error.message || 'Erro ao buscar farmácias próximas',
        data: [],
      };
    }
  }

  /**
   * Buscar farmácias por cidade e estado
   * @param {string} city - Nome da cidade
   * @param {string} state - Estado (UF)
   * @param {number} limit - Limite de resultados (padrão: 20)
   * @returns {Promise<Object>} Objeto com lista de farmácias
   */
  async getPharmaciesByLocation(city, state = null, limit = 20) {
    try {
      if (!city) {
        return {
          success: false,
          error: 'Cidade é obrigatória',
          data: [],
        };
      }

      let url = `/popular-pharmacies/by-location?city=${encodeURIComponent(city)}&limit=${limit}`;
      if (state) {
        url += `&state=${encodeURIComponent(state)}`;
      }

      const response = await apiService.get(url);

      if (response && response.success) {
        return {
          success: true,
          data: response.data || [],
          count: response.count || 0,
        };
      }

      return {
        success: false,
        error: 'Nenhuma farmácia encontrada',
        data: [],
      };
    } catch (error) {
      console.error('Erro ao buscar farmácias por localização:', error);
      return {
        success: false,
        error: error.message || 'Erro ao buscar farmácias',
        data: [],
      };
    }
  }

  /**
   * Abrir endereço no aplicativo de mapas
   * @param {Object} pharmacy - Objeto da farmácia com address, latitude, longitude
   */
  async openInMaps(pharmacy) {
    try {
      let url = '';

      if (pharmacy.latitude && pharmacy.longitude) {
        // Usar coordenadas se disponíveis - formato compatível com iOS e Android
        // iOS: usa maps:// ou http://maps.apple.com
        // Android: usa geo: ou https://www.google.com/maps
        const lat = pharmacy.latitude;
        const lon = pharmacy.longitude;
        
        // Tentar primeiro com URL universal do Google Maps
        url = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
        
        // Verificar se pode abrir
        const canOpen = await Linking.canOpenURL(url);
        if (!canOpen) {
          // Fallback para formato geo: (Android)
          url = `geo:${lat},${lon}?q=${lat},${lon}`;
        }
      } else if (pharmacy.address) {
        // Usar endereço como fallback
        const fullAddress = `${pharmacy.address}, ${pharmacy.city || ''}, ${pharmacy.state || ''}`;
        url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
      } else {
        throw new Error('Endereço ou coordenadas não disponíveis');
      }

      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        // Último fallback: tentar com formato mais simples
        if (pharmacy.latitude && pharmacy.longitude) {
          const fallbackUrl = `geo:${pharmacy.latitude},${pharmacy.longitude}`;
          const fallbackSupported = await Linking.canOpenURL(fallbackUrl);
          if (fallbackSupported) {
            await Linking.openURL(fallbackUrl);
            return;
          }
        }
        throw new Error('Não foi possível abrir o aplicativo de mapas');
      }
    } catch (error) {
      console.error('Erro ao abrir no mapa:', error);
      throw error;
    }
  }

  /**
   * Ligar para a farmácia
   * @param {string} phone - Número de telefone
   */
  async callPharmacy(phone) {
    try {
      if (!phone) {
        throw new Error('Telefone não disponível');
      }

      // Remover caracteres não numéricos
      const cleanPhone = phone.replace(/\D/g, '');
      const url = `tel:${cleanPhone}`;

      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        throw new Error('Não foi possível fazer a ligação');
      }
    } catch (error) {
      console.error('Erro ao ligar:', error);
      throw error;
    }
  }
}

export default new PopularPharmacyService();


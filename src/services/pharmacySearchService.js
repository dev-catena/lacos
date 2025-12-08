import GOOGLE_MAPS_CONFIG from '../config/maps';

/**
 * Serviço para buscar farmácias reais usando Google Places API
 */
class PharmacySearchService {
  /**
   * Buscar farmácias próximas usando Google Places Nearby Search
   * @param {number} latitude - Latitude do usuário
   * @param {number} longitude - Longitude do usuário
   * @param {number} radius - Raio de busca em metros (padrão: 5000 = 5km)
   * @returns {Promise<Array>} Array de farmácias encontradas
   */
  async searchNearby(latitude, longitude, radius = 5000) {
    try {
      if (!GOOGLE_MAPS_CONFIG.API_KEY || GOOGLE_MAPS_CONFIG.API_KEY === 'SUA_API_KEY_AQUI') {
        throw new Error('Google Maps API Key não configurada');
      }

      // URL da Google Places Nearby Search API
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=pharmacy&language=pt-BR&key=${GOOGLE_MAPS_CONFIG.API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        // Transformar resultados da Google em formato do nosso app
        return data.results.map((place, index) => ({
          id: place.place_id || `pharmacy_${index}`,
          name: place.name,
          address: place.vicinity || place.formatted_address || 'Endereço não disponível',
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          rating: place.rating || null,
          userRatingsTotal: place.user_ratings_total || 0,
          isOpen: place.opening_hours?.open_now ?? null, // null se não disponível
          phone: null, // Será buscado separadamente se necessário
          distance: null, // Será calculado no componente
        }));
      } else if (data.status === 'ZERO_RESULTS') {
        return [];
      } else {
        // Tratar outros status (OVER_QUERY_LIMIT, REQUEST_DENIED, etc.)
        console.warn('⚠️ Google Places API status:', data.status, data.error_message);
        throw new Error(data.error_message || `Erro na busca: ${data.status}`);
      }
    } catch (error) {
      console.error('Erro ao buscar farmácias:', error);
      throw error;
    }
  }

  /**
   * Buscar detalhes de uma farmácia específica (incluindo telefone)
   * @param {string} placeId - ID do lugar na Google Places
   * @returns {Promise<Object>} Detalhes da farmácia
   */
  async getDetails(placeId) {
    try {
      if (!GOOGLE_MAPS_CONFIG.API_KEY || GOOGLE_MAPS_CONFIG.API_KEY === 'SUA_API_KEY_AQUI') {
        throw new Error('Google Maps API Key não configurada');
      }

      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,opening_hours,rating,user_ratings_total&language=pt-BR&key=${GOOGLE_MAPS_CONFIG.API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.result) {
        return {
          phone: data.result.formatted_phone_number || null,
          address: data.result.formatted_address || null,
          openingHours: data.result.opening_hours || null,
          rating: data.result.rating || null,
          userRatingsTotal: data.result.user_ratings_total || 0,
        };
      } else {
        throw new Error(data.error_message || `Erro ao buscar detalhes: ${data.status}`);
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes da farmácia:', error);
      throw error;
    }
  }

  /**
   * Calcular distância entre duas coordenadas (Haversine formula)
   * @param {number} lat1 - Latitude do ponto 1
   * @param {number} lon1 - Longitude do ponto 1
   * @param {number} lat2 - Latitude do ponto 2
   * @param {number} lon2 - Longitude do ponto 2
   * @returns {number} Distância em metros
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
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
  }
}

export default new PharmacySearchService();








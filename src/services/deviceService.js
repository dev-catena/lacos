import apiService from './apiService';

/**
 * Serviço para gerenciar dispositivos (smartwatch e sensores)
 */
class DeviceService {
  /**
   * Listar dispositivos de um grupo
   */
  async getGroupDevices(groupId) {
    try {
      const response = await apiService.get(`/groups/${groupId}/devices`);
      return {
        success: true,
        data: Array.isArray(response) ? response : (response.data || []),
      };
    } catch (error) {
      console.error('Erro ao buscar dispositivos do grupo:', error);
      return {
        success: false,
        error: error.message || 'Erro ao buscar dispositivos',
        data: [],
      };
    }
  }

  /**
   * Criar dispositivo para um grupo
   */
  async createDevice(groupId, deviceData) {
    try {
      const response = await apiService.post(`/groups/${groupId}/devices`, deviceData);
      return {
        success: true,
        data: response.device || response,
      };
    } catch (error) {
      console.error('Erro ao criar dispositivo:', error);
      return {
        success: false,
        error: error.message || 'Erro ao criar dispositivo',
        details: error.response?.data || null,
      };
    }
  }

  /**
   * Excluir dispositivo
   */
  async deleteDevice(groupId, deviceId) {
    try {
      await apiService.delete(`/groups/${groupId}/devices/${deviceId}`);
      return {
        success: true,
      };
    } catch (error) {
      console.error('Erro ao excluir dispositivo:', error);
      return {
        success: false,
        error: error.message || 'Erro ao excluir dispositivo',
      };
    }
  }
}

export default new DeviceService();


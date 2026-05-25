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
   * Dados de saúde do smartwatch (Thalamus via backend).
   */
  async getGroupSmartwatchHealth(groupId) {
    try {
      const response = await apiService.get(`/groups/${groupId}/smartwatch-health`);
      return { success: true, data: response };
    } catch (error) {
      console.error('Erro ao buscar saúde do relógio:', error);
      return {
        success: false,
        error: error.message || 'Erro ao buscar dados do relógio',
        data: null,
      };
    }
  }

  /**
   * Pontos de localização do smartwatch (Thalamus via backend).
   * @param {string} groupId
   * @param {number} [limit=11] posição atual + até 10 anteriores
   */
  async getGroupSmartwatchLocations(groupId, limit = 11) {
    try {
      const q = Number.isFinite(limit) ? `?limit=${Math.min(50, Math.max(1, Math.floor(limit)))}` : '?limit=11';
      const response = await apiService.get(`/groups/${groupId}/smartwatch-locations${q}`);
      return { success: true, data: response };
    } catch (error) {
      console.error('Erro ao buscar localização do relógio:', error);
      return {
        success: false,
        error: error.message || 'Erro ao buscar localização',
        data: null,
      };
    }
  }

  /**
   * Lista de áudios do relógio (Thalamus via backend).
   */
  async getGroupSmartwatchAudios(groupId, limit = 20) {
    try {
      const q = Number.isFinite(limit) && limit > 0 ? `?limit=${Math.min(100, Math.floor(limit))}` : '?limit=20';
      const response = await apiService.get(`/groups/${groupId}/smartwatch-audios${q}`);
      return { success: true, data: response };
    } catch (error) {
      console.error('Erro ao buscar áudios do relógio:', error);
      return {
        success: false,
        error: error.message || 'Erro ao buscar áudios',
        data: null,
      };
    }
  }

  /**
   * Solicita leitura imediata de sinais vitais no relógio (Thalamus sendCommand via backend).
   */
  async requestSmartwatchHealthReading(groupId) {
    try {
      const response = await apiService.post(`/groups/${groupId}/smartwatch-health/measure-now`, {});
      if (response && response.success === false) {
        return {
          success: false,
          error: response.message || 'Falha ao solicitar leitura',
          data: response,
        };
      }
      return { success: true, data: response };
    } catch (error) {
      console.error('Erro ao solicitar leitura no relógio:', error);
      return {
        success: false,
        error: error.message || 'Erro ao solicitar leitura no relógio',
        data: null,
      };
    }
  }

  /**
   * Envia áudio gravado para o relógio (Thalamus via backend, multipart campo "file").
   * @param {string} groupId
   * @param {{ uri: string, name: string, type: string }} file - Parte de arquivo React Native (FormData)
   */
  async sendGroupSmartwatchAudio(groupId, file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiService.request(`/groups/${groupId}/smartwatch-audios/send`, {
        method: 'POST',
        body: formData,
        requiresAuth: true,
        timeout: 120000,
      });
      if (response && response.success === false) {
        return {
          success: false,
          error: response.message || 'Falha ao enviar áudio',
          data: null,
        };
      }
      return { success: true, data: response };
    } catch (error) {
      console.error('Erro ao enviar áudio ao relógio:', error);
      return {
        success: false,
        error: error.message || 'Erro ao enviar áudio',
        data: null,
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


import apiService from './apiService';
import API_CONFIG from '../config/api';

class CameraService {
  async listGroupCameras(groupId) {
    try {
      const response = await apiService.get(`/groups/${groupId}/cameras`);
      if (response && response.success === false) {
        return {
          success: false,
          error: response.message || 'Erro ao listar câmeras',
          cameras: response.cameras || [],
        };
      }
      return { success: true, cameras: response.cameras || [] };
    } catch (error) {
      const msg =
        error.response?.message ||
        error.message ||
        'Erro ao listar câmeras';
      return { success: false, error: msg, cameras: [] };
    }
  }

  async listAvailableCameras(groupId) {
    try {
      const response = await apiService.get(`/groups/${groupId}/cameras/available`);
      return { success: true, cameras: response.cameras || [] };
    } catch (error) {
      return { success: false, error: error.message || 'Erro ao listar câmeras disponíveis' };
    }
  }

  async linkCamera(groupId, { rtmp_camera_id, name }) {
    try {
      const response = await apiService.post(`/groups/${groupId}/cameras`, {
        rtmp_camera_id,
        name,
      });
      return { success: true, camera: response.camera };
    } catch (error) {
      return { success: false, error: error.message || 'Erro ao vincular câmera' };
    }
  }

  async unlinkCamera(groupId, cameraId) {
    try {
      await apiService.delete(`/groups/${groupId}/cameras/${cameraId}`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message || 'Erro ao remover câmera' };
    }
  }

  async getStream(groupId, cameraId) {
    try {
      const response = await apiService.get(`/groups/${groupId}/cameras/${cameraId}/stream`);
      return {
        success: true,
        playUrl: response.play_url,
        expiresAt: response.expires_at,
        connected: response.connected,
        camera: response.camera,
      };
    } catch (error) {
      return { success: false, error: error.message || 'Erro ao obter stream' };
    }
  }

  getSnapshotUri(groupId, cameraId) {
    const base = API_CONFIG.BASE_URL.replace(/\/+$/, '');
    return `${base}/groups/${groupId}/cameras/${cameraId}/snapshot`;
  }
}

export default new CameraService();

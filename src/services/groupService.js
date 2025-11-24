import apiService from './apiService';

/**
 * Serviço para gerenciar grupos
 */
class GroupService {
  /**
   * Criar novo grupo
   */
  async createGroup(groupData) {
    try {
      const data = {
        name: groupData.groupName,
        description: groupData.description || null,
        code: groupData.accessCode,
        accompanied_name: groupData.accompaniedName,
        accompanied_age: groupData.accompaniedAge ? parseInt(groupData.accompaniedAge) : null,
        accompanied_gender: groupData.accompaniedGender || null,
        health_info: groupData.healthInfo ? JSON.stringify(groupData.healthInfo) : null,
      };

      const response = await apiService.post('/groups', data);
      return { success: true, data: response };
    } catch (error) {
      console.error('Erro ao criar grupo:', error);
      
      let errorMessage = 'Erro ao criar grupo';
      if (error.errors) {
        errorMessage = Object.values(error.errors).flat().join(', ');
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  }

  /**
   * Listar grupos do usuário
   */
  async getMyGroups() {
    try {
      const response = await apiService.get('/groups');
      return { success: true, data: response };
    } catch (error) {
      console.error('Erro ao buscar grupos:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao buscar grupos' 
      };
    }
  }

  /**
   * Obter detalhes de um grupo específico
   */
  async getGroup(groupId) {
    try {
      const endpoint = apiService.replaceParams('/groups/:id', { id: groupId });
      const response = await apiService.get(endpoint);
      return { success: true, data: response };
    } catch (error) {
      console.error('Erro ao buscar grupo:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao buscar grupo' 
      };
    }
  }

  /**
   * Atualizar grupo
   */
  async updateGroup(groupId, groupData) {
    try {
      const endpoint = apiService.replaceParams('/groups/:id', { id: groupId });
      const data = {
        name: groupData.groupName,
        description: groupData.description,
        accompanied_name: groupData.accompaniedName,
        accompanied_age: groupData.accompaniedAge ? parseInt(groupData.accompaniedAge) : null,
        accompanied_gender: groupData.accompaniedGender,
        health_info: groupData.healthInfo ? JSON.stringify(groupData.healthInfo) : null,
      };

      const response = await apiService.put(endpoint, data);
      return { success: true, data: response };
    } catch (error) {
      console.error('Erro ao atualizar grupo:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao atualizar grupo' 
      };
    }
  }

  /**
   * Deletar grupo
   */
  async deleteGroup(groupId) {
    try {
      const endpoint = apiService.replaceParams('/groups/:id', { id: groupId });
      await apiService.delete(endpoint);
      return { success: true };
    } catch (error) {
      console.error('Erro ao deletar grupo:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao deletar grupo' 
      };
    }
  }

  /**
   * Entrar em grupo usando código
   */
  async joinGroup(accessCode) {
    try {
      const response = await apiService.post('/groups/join', { code: accessCode });
      return { success: true, data: response };
    } catch (error) {
      console.error('Erro ao entrar no grupo:', error);
      
      let errorMessage = 'Erro ao entrar no grupo';
      if (error.errors) {
        errorMessage = Object.values(error.errors).flat().join(', ');
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  }

  /**
   * Upload de foto do grupo
   */
  async uploadGroupPhoto(groupId, imageUri) {
    try {
      // Criar FormData
      const formData = new FormData();
      
      // Extrair nome e tipo do arquivo
      const filename = imageUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      formData.append('photo', {
        uri: imageUri,
        name: filename,
        type,
      });

      const response = await apiService.post(`/groups/${groupId}/photo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return { success: true, data: response };
    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao fazer upload da foto' 
      };
    }
  }
}

export default new GroupService();

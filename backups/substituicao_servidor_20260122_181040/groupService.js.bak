import { Platform } from 'react-native';
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
      // Se já for FormData (com foto), envia direto
      if (groupData instanceof FormData) {
        const response = await apiService.post('/groups', groupData);
        return { success: true, data: response };
      }
      
      // Se for objeto simples, monta o payload
      const data = {
        name: groupData.groupName || groupData.name,
        description: groupData.description || null,
        code: groupData.accessCode || groupData.code,
        accompanied_name: groupData.accompaniedName || groupData.accompanied_name,
        accompanied_age: groupData.accompaniedAge ? parseInt(groupData.accompaniedAge) : null,
        accompanied_gender: groupData.accompaniedGender || groupData.accompanied_gender || null,
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
      
      // Se já for FormData (com foto), envia direto
      if (groupData instanceof FormData) {
        console.log('📤 GroupService.updateGroup - Enviando FormData com foto');
        console.log('📤 GroupService.updateGroup - Endpoint:', endpoint);
        console.log('📤 GroupService.updateGroup - FormData contém foto');
        
        try {
          // Não passar headers manualmente - o apiService já gerencia isso
          const response = await apiService.put(endpoint, groupData);
          console.log('✅ GroupService.updateGroup - Resposta recebida:', {
            hasData: !!response,
            keys: response ? Object.keys(response) : [],
            hasPhotoUrl: !!(response?.photo_url || response?.photo || response?.url),
          });
          return { success: true, data: response };
        } catch (apiError) {
          console.error('❌ GroupService.updateGroup - Erro na API:', apiError);
          console.error('❌ GroupService.updateGroup - Status:', apiError.status);
          console.error('❌ GroupService.updateGroup - Mensagem:', apiError.message);
          throw apiError;
        }
      }
      
      // Aceita tanto o formato antigo (groupName, accompaniedName) quanto o novo (name, accompanied_name)
      const data = {};
      
      // Nome do grupo
      if (groupData.groupName) data.name = groupData.groupName;
      if (groupData.name) data.name = groupData.name;
      
      // Descrição
      if (groupData.description !== undefined) data.description = groupData.description;
      
      // Dados do paciente - formato antigo (camelCase)
      if (groupData.accompaniedName) data.accompanied_name = groupData.accompaniedName;
      if (groupData.accompaniedAge) data.accompanied_age = parseInt(groupData.accompaniedAge);
      if (groupData.accompaniedGender) data.accompanied_gender = groupData.accompaniedGender;
      if (groupData.accompaniedBirthDate) data.accompanied_birth_date = groupData.accompaniedBirthDate;
      if (groupData.accompaniedBloodType) data.accompanied_blood_type = groupData.accompaniedBloodType;
      if (groupData.accompaniedPhone) data.accompanied_phone = groupData.accompaniedPhone;
      if (groupData.accompaniedEmail) data.accompanied_email = groupData.accompaniedEmail;
      
      // Dados do paciente - formato novo (snake_case direto da API)
      if (groupData.accompanied_name) data.accompanied_name = groupData.accompanied_name;
      if (groupData.accompanied_age) data.accompanied_age = groupData.accompanied_age;
      if (groupData.accompanied_gender) data.accompanied_gender = groupData.accompanied_gender;
      if (groupData.accompanied_birth_date) data.accompanied_birth_date = groupData.accompanied_birth_date;
      if (groupData.accompanied_blood_type) data.accompanied_blood_type = groupData.accompanied_blood_type;
      if (groupData.accompanied_phone) data.accompanied_phone = groupData.accompanied_phone;
      if (groupData.accompanied_email) data.accompanied_email = groupData.accompanied_email;
      
      // Health info
      if (groupData.healthInfo) data.health_info = JSON.stringify(groupData.healthInfo);
      if (groupData.health_info) data.health_info = typeof groupData.health_info === 'string' 
        ? groupData.health_info 
        : JSON.stringify(groupData.health_info);

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
   * Entrar em grupo usando código (alias para joinGroup)
   */
  async joinWithCode(code) {
    return this.joinGroup(code);
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
      
      // React Native precisa de um objeto com propriedades específicas
      const file = {
        uri: Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''),
        name: filename || `photo_${Date.now()}.jpg`,
        type: type,
      };
      
      formData.append('photo', file);

      console.log('📤 Enviando foto:', { groupId, filename, type });

      // Não passar headers manualmente - o apiService já gerencia isso
      const response = await apiService.post(`/groups/${groupId}/photo`, formData);

      console.log('✅ Foto enviada com sucesso:', response);
      return { success: true, data: response };
    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao fazer upload da foto' 
      };
    }
  }

  /**
   * Buscar membros de um grupo
   */
  async getGroupMembers(groupId) {
    try {
      const response = await apiService.get(`/groups/${groupId}/members`);
      return { success: true, data: response };
    } catch (error) {
      console.error('Erro ao buscar membros do grupo:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao buscar membros' 
      };
    }
  }
}

export default new GroupService();

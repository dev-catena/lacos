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
      console.log('📦 GroupService.getMyGroups - Resposta da API:', {
        type: typeof response,
        isArray: Array.isArray(response),
        length: Array.isArray(response) ? response.length : 'N/A',
        response: response
      });
      
      // Garantir que sempre retornamos um array
      let groupsArray = [];
      
      if (Array.isArray(response)) {
        groupsArray = response;
      } else if (response && typeof response === 'object') {
        // Se response é um objeto, pode ter uma propriedade data ou ser o próprio array
        if (Array.isArray(response.data)) {
          groupsArray = response.data;
        } else if (Array.isArray(response.groups)) {
          groupsArray = response.groups;
        } else {
          // Se não encontrou array, tentar converter para array
          groupsArray = [];
        }
      }
      
      console.log('📦 GroupService.getMyGroups - Grupos processados:', {
        count: groupsArray.length,
        firstGroup: groupsArray[0] || null
      });
      
      return { 
        success: true, 
        data: groupsArray 
      };
    } catch (error) {
      console.error('❌ GroupService.getMyGroups - Erro ao buscar grupos:', error);
      console.error('❌ GroupService.getMyGroups - Detalhes do erro:', {
        message: error.message,
        status: error.status,
        response: error.response
      });
      return { 
        success: false, 
        error: error.message || 'Erro ao buscar grupos',
        data: [] // Retornar array vazio em caso de erro
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
        
        // Log detalhado do FormData
        console.log('📤 GroupService.updateGroup - Verificando FormData...');
        for (let pair of groupData.entries()) {
          console.log(`📤 GroupService.updateGroup - FormData[${pair[0]}]:`, 
            pair[1] instanceof File || (typeof pair[1] === 'object' && pair[1].uri) 
              ? `[FILE: ${pair[1].name || 'sem nome'}]` 
              : pair[1]
          );
        }
        
        try {
          // Não passar headers manualmente - o apiService já gerencia isso
          console.log('📤 GroupService.updateGroup - Chamando apiService.put...');
          const response = await apiService.put(endpoint, groupData);
          console.log('✅ GroupService.updateGroup - Resposta recebida:', {
            hasData: !!response,
            keys: response ? Object.keys(response) : [],
            hasPhotoUrl: !!(response?.photo_url || response?.photo || response?.url),
            fullResponse: response,
          });
          return { success: true, data: response };
        } catch (apiError) {
          console.error('❌ GroupService.updateGroup - Erro na API:', apiError);
          console.error('❌ GroupService.updateGroup - Status:', apiError.status);
          console.error('❌ GroupService.updateGroup - Mensagem:', apiError.message);
          console.error('❌ GroupService.updateGroup - Error completo:', JSON.stringify(apiError, null, 2));
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
      
      // Sinais vitais e permissões (se vierem no groupData)
      if (groupData.monitor_blood_pressure !== undefined) data.monitor_blood_pressure = groupData.monitor_blood_pressure;
      if (groupData.monitor_heart_rate !== undefined) data.monitor_heart_rate = groupData.monitor_heart_rate;
      if (groupData.monitor_oxygen_saturation !== undefined) data.monitor_oxygen_saturation = groupData.monitor_oxygen_saturation;
      if (groupData.monitor_blood_glucose !== undefined) data.monitor_blood_glucose = groupData.monitor_blood_glucose;
      if (groupData.monitor_temperature !== undefined) data.monitor_temperature = groupData.monitor_temperature;
      if (groupData.monitor_respiratory_rate !== undefined) data.monitor_respiratory_rate = groupData.monitor_respiratory_rate;
      
      // Permissões
      if (groupData.accompanied_notify_medication !== undefined) data.accompanied_notify_medication = groupData.accompanied_notify_medication;
      if (groupData.accompanied_notify_appointment !== undefined) data.accompanied_notify_appointment = groupData.accompanied_notify_appointment;
      if (groupData.accompanied_access_history !== undefined) data.accompanied_access_history = groupData.accompanied_access_history;
      if (groupData.accompanied_access_medication !== undefined) data.accompanied_access_medication = groupData.accompanied_access_medication;
      if (groupData.accompanied_access_schedule !== undefined) data.accompanied_access_schedule = groupData.accompanied_access_schedule;
      if (groupData.accompanied_access_chat !== undefined) data.accompanied_access_chat = groupData.accompanied_access_chat;

      console.log('📤 GroupService.updateGroup - Enviando dados JSON:', data);
      console.log('📤 GroupService.updateGroup - Endpoint:', endpoint);
      const response = await apiService.put(endpoint, data);
      console.log('✅ GroupService.updateGroup - Resposta recebida (JSON):', {
        hasData: !!response,
        keys: response ? Object.keys(response) : [],
        fullResponse: response,
      });
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
      
      // A API retorna { success: true, message: "...", data: { group: {...}, your_role: "..." } }
      // Precisamos retornar no formato esperado pelo frontend
      if (response && response.success && response.data) {
        return {
          success: true,
          data: response.data, // Já contém { group: {...}, your_role: "..." }
          message: response.message
        };
      }
      
      // Se a resposta não tiver a estrutura esperada, retornar como está
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
   * Upload de foto do grupo - MÉTODO SIMPLES
   */
  async uploadGroupPhotoSimple(groupId, imageUri) {
    try {
      const formData = new FormData();
      
      const filename = imageUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      const file = {
        uri: imageUri,
        name: filename || `photo_${Date.now()}.jpg`,
        type: type,
      };
      
      formData.append('photo', file);

      console.log('📤 GroupService.uploadGroupPhotoSimple - Enviando para /groups/' + groupId + '/photo');
      const response = await apiService.post(`/groups/${groupId}/photo`, formData);

      console.log('✅ GroupService.uploadGroupPhotoSimple - Resposta:', response);
      return { success: true, data: response };
    } catch (error) {
      console.error('❌ GroupService.uploadGroupPhotoSimple - Erro:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao fazer upload da foto' 
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
      
      // O backend retorna { success: true, data: [...] }
      // Precisamos extrair o array de membros corretamente
      let membersArray = [];
      
      if (response && typeof response === 'object') {
        // Se response tem a propriedade data e é um array
        if (response.data && Array.isArray(response.data)) {
          membersArray = response.data;
        }
        // Se response é diretamente um array
        else if (Array.isArray(response)) {
          membersArray = response;
        }
        // Se response.success existe e response.data é um array
        else if (response.success && response.data && Array.isArray(response.data)) {
          membersArray = response.data;
        }
      }
      
      return { success: true, data: membersArray };
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

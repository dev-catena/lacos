import apiService from './apiService';

/**
 * Serviço para gerenciar contatos de emergência
 */
class EmergencyContactService {
  /**
   * Criar novo contato de emergência
   */
  async createEmergencyContact(contactData) {
    try {
      const response = await apiService.post('/emergency-contacts', contactData);
      return { success: true, data: response };
    } catch (error) {
      console.error('Erro ao criar contato de emergência:', error);
      
      let errorMessage = 'Erro ao criar contato';
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
   * Listar contatos de emergência
   */
  async getEmergencyContacts(groupId = null) {
    try {
      let endpoint = '/emergency-contacts';
      if (groupId) {
        endpoint += `?group_id=${groupId}`;
      }
      
      const response = await apiService.get(endpoint);
      
      // Se o backend retornar 403, significa que o usuário não tem acesso ao grupo
      if (response?.status === 403 || (response?.data?.message && response.data.message.includes('não tem acesso'))) {
        console.warn('⚠️ Usuário não tem acesso ao grupo, retornando array vazio');
        return {
          success: true,
          data: []
        };
      }
      
      return { success: true, data: response };
    } catch (error) {
      console.error('Erro ao buscar contatos de emergência:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao buscar contatos' 
      };
    }
  }

  /**
   * Buscar contato específico
   */
  async getEmergencyContact(contactId) {
    try {
      const response = await apiService.get(`/emergency-contacts/${contactId}`);
      return { success: true, data: response };
    } catch (error) {
      console.error('Erro ao buscar contato:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao buscar contato' 
      };
    }
  }

  /**
   * Atualizar contato
   */
  async updateEmergencyContact(contactId, contactData) {
    try {
      // Se for FormData (upload de foto), usar POST com _method para contornar limitação do Laravel
      if (contactData instanceof FormData) {
        // Adicionar _method para simular PUT (method spoofing)
        contactData.append('_method', 'PUT');
        // Usar POST ao invés de PUT
        const response = await apiService.post(`/emergency-contacts/${contactId}`, contactData);
        return { success: true, data: response };
      } else {
        // Se for JSON normal, usar PUT normalmente
        const response = await apiService.put(`/emergency-contacts/${contactId}`, contactData);
        return { success: true, data: response };
      }
    } catch (error) {
      console.error('Erro ao atualizar contato:', error);
      
      let errorMessage = 'Erro ao atualizar contato';
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
   * Deletar contato
   */
  async deleteEmergencyContact(contactId) {
    try {
      await apiService.delete(`/emergency-contacts/${contactId}`);
      return { success: true };
    } catch (error) {
      console.error('Erro ao deletar contato:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao deletar contato' 
      };
    }
  }

  /**
   * Buscar membros do grupo que são contatos de emergência
   */
  async getGroupMembersAsEmergencyContacts(groupId) {
    try {
      // Buscar membros do grupo
      const response = await apiService.get(`/groups/${groupId}/members`);
      
      if (response && Array.isArray(response)) {
        // Filtrar apenas os que são contatos de emergência
        const emergencyMembers = response.filter(member => member.is_emergency_contact);
        return { success: true, data: emergencyMembers };
      }
      
      return { success: true, data: [] };
    } catch (error) {
      console.error('Erro ao buscar membros como contatos de emergência:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao buscar membros' 
      };
    }
  }
}

export default new EmergencyContactService();

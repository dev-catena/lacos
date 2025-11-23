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
      const data = {
        group_id: contactData.groupId,
        name: contactData.name,
        phone: contactData.phone,
        relationship: contactData.relationship,
      };

      const response = await apiService.post('/emergency-contacts', data);
      return { success: true, data: response };
    } catch (error) {
      console.error('Erro ao criar contato de emergência:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao criar contato de emergência' 
      };
    }
  }

  /**
   * Listar contatos de emergência de um grupo
   */
  async getEmergencyContacts(groupId = null) {
    try {
      let endpoint = '/emergency-contacts';
      if (groupId) {
        endpoint += `?group_id=${groupId}`;
      }

      const response = await apiService.get(endpoint);
      return { success: true, data: response };
    } catch (error) {
      console.error('Erro ao buscar contatos de emergência:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao buscar contatos de emergência' 
      };
    }
  }

  /**
   * Obter detalhes de um contato de emergência específico
   */
  async getEmergencyContact(contactId) {
    try {
      const endpoint = apiService.replaceParams('/emergency-contacts/:id', { id: contactId });
      const response = await apiService.get(endpoint);
      return { success: true, data: response };
    } catch (error) {
      console.error('Erro ao buscar contato de emergência:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao buscar contato de emergência' 
      };
    }
  }

  /**
   * Atualizar contato de emergência
   */
  async updateEmergencyContact(contactId, contactData) {
    try {
      const endpoint = apiService.replaceParams('/emergency-contacts/:id', { id: contactId });
      const data = {
        name: contactData.name,
        phone: contactData.phone,
        relationship: contactData.relationship,
      };

      const response = await apiService.put(endpoint, data);
      return { success: true, data: response };
    } catch (error) {
      console.error('Erro ao atualizar contato de emergência:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao atualizar contato de emergência' 
      };
    }
  }

  /**
   * Deletar contato de emergência
   */
  async deleteEmergencyContact(contactId) {
    try {
      const endpoint = apiService.replaceParams('/emergency-contacts/:id', { id: contactId });
      await apiService.delete(endpoint);
      return { success: true };
    } catch (error) {
      console.error('Erro ao deletar contato de emergência:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao deletar contato de emergência' 
      };
    }
  }
}

export default new EmergencyContactService();


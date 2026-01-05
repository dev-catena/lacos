import apiService from './apiService';

class ChatService {
  /**
   * Obter conversa com outro usuário
   */
  async getConversation(otherUserId) {
    try {
      console.log('💬 ChatService - Buscando conversa com usuário:', otherUserId);
      
      const response = await apiService.request(`/messages/conversation/${otherUserId}`, {
        method: 'GET',
      });

      if (response.success && response.data) {
        console.log('✅ ChatService - Conversa carregada:', response.data.length, 'mensagens');
        return {
          success: true,
          data: response.data,
          groupId: response.group_id,
        };
      }

      return {
        success: false,
        error: response.message || 'Erro ao carregar conversa',
      };
    } catch (error) {
      console.error('❌ ChatService - Erro ao carregar conversa:', error);
      return {
        success: false,
        error: error.message || 'Erro ao carregar conversa',
      };
    }
  }

  /**
   * Enviar mensagem de texto
   */
  async sendTextMessage(receiverId, message) {
    try {
      console.log('💬 ChatService - Enviando mensagem para:', receiverId);
      
      const response = await apiService.request('/messages', {
        method: 'POST',
        body: {
          receiver_id: receiverId,
          message: message,
          type: 'text',
        },
      });

      if (response.success && response.data) {
        console.log('✅ ChatService - Mensagem enviada com sucesso');
        return {
          success: true,
          data: response.data,
        };
      }

      return {
        success: false,
        error: response.message || 'Erro ao enviar mensagem',
      };
    } catch (error) {
      console.error('❌ ChatService - Erro ao enviar mensagem:', error);
      return {
        success: false,
        error: error.message || 'Erro ao enviar mensagem',
      };
    }
  }

  /**
   * Enviar mensagem com imagem
   */
  async sendImageMessage(receiverId, imageUri) {
    try {
      console.log('💬 ChatService - Enviando imagem para:', receiverId);
      
      // Criar FormData para enviar a imagem
      const formData = new FormData();
      formData.append('receiver_id', receiverId.toString());
      formData.append('type', 'image');
      
      // Adicionar a imagem
      const filename = imageUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;
      
      formData.append('image', {
        uri: imageUri,
        name: filename,
        type: type,
      });
      
      const response = await apiService.request('/messages', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.success && response.data) {
        console.log('✅ ChatService - Imagem enviada com sucesso');
        return {
          success: true,
          data: response.data,
        };
      }

      return {
        success: false,
        error: response.message || 'Erro ao enviar imagem',
      };
    } catch (error) {
      console.error('❌ ChatService - Erro ao enviar imagem:', error);
      return {
        success: false,
        error: error.message || 'Erro ao enviar imagem',
      };
    }
  }

  /**
   * Marcar mensagens como lidas
   */
  async markAsRead(senderId) {
    try {
      await apiService.request(`/messages/${senderId}/read`, {
        method: 'POST',
      });
      
      return { success: true };
    } catch (error) {
      console.error('❌ ChatService - Erro ao marcar como lida:', error);
      return { success: false };
    }
  }

  /**
   * Obter mensagens do grupo
   */
  async getGroupMessages(groupId) {
    try {
      console.log('💬 ChatService - Buscando mensagens do grupo:', groupId);
      
      const response = await apiService.request(`/messages/group/${groupId}`, {
        method: 'GET',
      });

      if (response.success && response.data) {
        console.log('✅ ChatService - Mensagens do grupo carregadas:', response.data.length, 'mensagens');
        return {
          success: true,
          data: response.data,
        };
      }

      return {
        success: false,
        error: response.message || 'Erro ao carregar mensagens do grupo',
      };
    } catch (error) {
      console.error('❌ ChatService - Erro ao carregar mensagens do grupo:', error);
      return {
        success: false,
        error: error.message || 'Erro ao carregar mensagens do grupo',
      };
    }
  }

  /**
   * Enviar mensagem de texto para o grupo
   */
  async sendGroupMessage(groupId, message) {
    try {
      console.log('💬 ChatService - Enviando mensagem para o grupo:', groupId);
      
      const response = await apiService.request('/messages/group', {
        method: 'POST',
        body: {
          group_id: groupId,
          message: message,
          type: 'text',
        },
      });

      if (response.success && response.data) {
        console.log('✅ ChatService - Mensagem do grupo enviada com sucesso');
        return {
          success: true,
          data: response.data,
        };
      }

      return {
        success: false,
        error: response.message || 'Erro ao enviar mensagem',
      };
    } catch (error) {
      console.error('❌ ChatService - Erro ao enviar mensagem do grupo:', error);
      return {
        success: false,
        error: error.message || 'Erro ao enviar mensagem',
      };
    }
  }

  /**
   * Enviar mensagem com imagem para o grupo
   */
  async sendGroupImageMessage(groupId, imageUri) {
    try {
      console.log('💬 ChatService - Enviando imagem para o grupo:', groupId);
      
      // Criar FormData para enviar a imagem
      const formData = new FormData();
      formData.append('group_id', groupId.toString());
      formData.append('type', 'image');
      
      // Adicionar a imagem
      const filename = imageUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;
      
      formData.append('image', {
        uri: imageUri,
        name: filename,
        type: type,
      });
      
      const response = await apiService.request('/messages/group', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.success && response.data) {
        console.log('✅ ChatService - Imagem do grupo enviada com sucesso');
        return {
          success: true,
          data: response.data,
        };
      }

      return {
        success: false,
        error: response.message || 'Erro ao enviar imagem',
      };
    } catch (error) {
      console.error('❌ ChatService - Erro ao enviar imagem do grupo:', error);
      return {
        success: false,
        error: error.message || 'Erro ao enviar imagem',
      };
    }
  }
}

export default new ChatService();


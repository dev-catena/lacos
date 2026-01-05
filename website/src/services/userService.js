// Serviço para operações do usuário
import { API_BASE_URL } from '../config/api';
import authService from './authService';

class UserService {
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(authService.getToken() && { 'Authorization': `Bearer ${authService.getToken()}` }),
    };
  }

  async changePassword(currentPassword, newPassword) {
    try {
      console.log('🔐 UserService - Alterando senha do usuário');
      
      const response = await fetch(`${API_BASE_URL}/change-password`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          new_password_confirmation: newPassword, // Laravel precisa de confirmação
        }),
        mode: 'cors',
        credentials: 'omit',
      });

      let data;
      const text = await response.text();
      
      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error('Erro ao parsear resposta:', parseError);
        data = { message: 'Erro ao processar resposta do servidor' };
      }

      console.log('📥 UserService - Resposta completa:', JSON.stringify(data, null, 2));
      console.log('📥 UserService - Status:', response.status);
      console.log('📥 UserService - Texto bruto:', text);

      if (!response.ok) {
        console.error('❌ UserService - Erro na resposta:', response.status);
        console.error('❌ UserService - Dados do erro:', data);
        
        // Tratar erros de validação (422)
        if (response.status === 422 && data.errors && typeof data.errors === 'object') {
          const errorMessages = Object.entries(data.errors)
            .map(([field, messages]) => {
              const messagesArray = Array.isArray(messages) ? messages : [messages];
              // Traduzir mensagens comuns
              const translated = messagesArray.map(msg => {
                if (typeof msg === 'string') {
                  if (msg.includes('current password') || msg.includes('senha atual')) {
                    return 'Senha atual incorreta.';
                  }
                  if (msg.includes('required')) {
                    return 'Este campo é obrigatório.';
                  }
                }
                return msg;
              });
              return translated.join(', ');
            })
            .join('\n');
          throw new Error(errorMessages || data.message || 'Erro ao alterar senha');
        }
        
        // Tratar erro 500
        if (response.status === 500) {
          throw new Error('Erro interno do servidor. O endpoint de trocar senha pode não estar configurado. Entre em contato com o suporte.');
        }
        
        // Tratar erro 401 (não autenticado)
        if (response.status === 401) {
          throw new Error('Sessão expirada. Por favor, faça login novamente.');
        }
        
        throw new Error(data.message || data.error || `Erro ${response.status}: Erro ao alterar senha`);
      }

      return {
        success: true,
        message: data.message || 'Senha alterada com sucesso',
      };
    } catch (error) {
      console.error('❌ UserService - Erro ao alterar senha:', error);
      
      return {
        success: false,
        error: error.message || 'Erro ao alterar senha. Verifique sua senha atual.',
      };
    }
  }
}

export default new UserService();


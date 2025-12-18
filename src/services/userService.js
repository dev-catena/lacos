import apiService from './apiService';

class UserService {
  /**
   * Atualizar perfil do usuário
   */
  async updateProfile(userId, formData) {
    try {
      console.log('📸 UserService - Atualizando perfil do usuário ID:', userId);
      
      // Laravel/Backend geralmente requer method spoofing para PUT com FormData
      // Adicionar _method para simular PUT
      formData.append('_method', 'PUT');
      
      // Usar POST ao invés de PUT quando enviar FormData
      const response = await apiService.request(`/users/${userId}`, {
        method: 'POST',
        body: formData,
      });

      console.log('📸 Response:', response);

      // Verificar se a resposta tem os dados do usuário
      if (response && response.id) {
        // API retorna diretamente o objeto do usuário
        console.log('✅ UserService - Perfil atualizado com sucesso');
        return {
          success: true,
          data: response,
        };
      } else if (response && response.user) {
        // Ou pode retornar {user: ...}
        console.log('✅ UserService - Perfil atualizado com sucesso');
        return {
          success: true,
          data: response.user,
        };
      } else if (response && response.success) {
        // Ou pode retornar {success: true, ...}
        console.log('✅ UserService - Perfil atualizado com sucesso');
        return response;
      }

      return {
        success: false,
        error: 'Resposta inválida da API',
      };
    } catch (error) {
      console.error('❌ UserService - Erro ao atualizar perfil:', error);
      return {
        success: false,
        error: error.message || 'Erro ao atualizar perfil',
      };
    }
  }

  /**
   * Atualizar dados do usuário (sem foto)
   */
  async updateUserData(userId, userData) {
    try {
      console.log('💾 UserService - Atualizando dados do usuário ID:', userId);
      console.log('📝 Dados:', userData);
      
      const response = await apiService.request(`/users/${userId}`, {
        method: 'PUT',
        body: userData,
      });

      console.log('📥 Response:', response);

      // Verificar se a resposta tem os dados do usuário
      if (response && response.id) {
        // API retorna diretamente o objeto do usuário
        console.log('✅ UserService - Dados atualizados com sucesso');
        return {
          success: true,
          data: response,
        };
      } else if (response && response.user) {
        // Ou pode retornar {user: ...}
        console.log('✅ UserService - Dados atualizados com sucesso');
        return {
          success: true,
          data: response.user,
        };
      } else if (response && response.success) {
        // Ou pode retornar {success: true, ...}
        console.log('✅ UserService - Dados atualizados com sucesso');
        return response;
      }

      return {
        success: false,
        error: 'Resposta inválida da API',
      };
    } catch (error) {
      console.error('❌ UserService - Erro ao atualizar dados:', error);
      return {
        success: false,
        error: error.message || 'Erro ao atualizar dados',
      };
    }
  }

  /**
   * Obter dados do perfil do usuário
   */
  async getProfile() {
    try {
      console.log('👤 UserService - Buscando perfil do usuário');
      
      const response = await apiService.request('/users/profile', {
        method: 'GET',
      });

      if (response.success) {
        console.log('✅ UserService - Perfil obtido com sucesso');
      }

      return response;
    } catch (error) {
      console.error('❌ UserService - Erro ao buscar perfil:', error);
      return {
        success: false,
        error: error.message || 'Erro ao buscar perfil',
      };
    }
  }

  /**
   * Obter dados de um usuário específico por ID
   */
  async getUser(userId) {
    try {
      console.log('👤 UserService - Buscando usuário ID:', userId);
      
      const response = await apiService.request(`/users/${userId}`, {
        method: 'GET',
      });

      // A API pode retornar diretamente o objeto ou dentro de uma estrutura
      if (response && response.id) {
        return {
          success: true,
          data: response,
        };
      } else if (response && response.user) {
        return {
          success: true,
          data: response.user,
        };
      } else if (response && response.success) {
        return response;
      }

      return {
        success: false,
        error: 'Resposta inválida da API',
      };
    } catch (error) {
      console.error('❌ UserService - Erro ao buscar usuário:', error);
      return {
        success: false,
        error: error.message || 'Erro ao buscar usuário',
      };
    }
  }

  /**
   * Ativar autenticação de dois fatores
   */
  async enable2FA(method, phone = null) {
    try {
      // No app, suportamos apenas WhatsApp para 2FA
      const selectedMethod = 'whatsapp';
      console.log('🔐 UserService - Ativando 2FA:', selectedMethod);
      
      const body = { method: selectedMethod };
      if (phone) {
        body.phone = phone;
      }
      
      const response = await apiService.post('/2fa/enable', body);

      if (response && response.success) {
        console.log('✅ UserService - 2FA ativado com sucesso');
        return {
          success: true,
          message: response.message || 'Autenticação de dois fatores ativada',
        };
      }

      return {
        success: false,
        error: response.error || response.message || 'Erro ao ativar 2FA',
      };
    } catch (error) {
      console.error('❌ UserService - Erro ao ativar 2FA:', error);
      
      let errorMessage = 'Erro ao ativar autenticação de dois fatores';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.errors && typeof error.errors === 'object') {
        const firstError = Object.values(error.errors)[0];
        if (Array.isArray(firstError) && firstError.length > 0) {
          errorMessage = firstError[0];
        } else if (typeof firstError === 'string') {
          errorMessage = firstError;
        }
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Desativar autenticação de dois fatores
   */
  async disable2FA() {
    try {
      console.log('🔐 UserService - Desativando 2FA');
      
      const response = await apiService.post('/2fa/disable');

      if (response && response.success) {
        console.log('✅ UserService - 2FA desativado com sucesso');
        return {
          success: true,
          message: response.message || 'Autenticação de dois fatores desativada',
        };
      }

      return {
        success: false,
        error: response.error || response.message || 'Erro ao desativar 2FA',
      };
    } catch (error) {
      console.error('❌ UserService - Erro ao desativar 2FA:', error);
      
      return {
        success: false,
        error: error.message || 'Erro ao desativar autenticação de dois fatores',
      };
    }
  }

  /**
   * Enviar código de verificação 2FA
   */
  async send2FACode() {
    try {
      console.log('📱 UserService - Solicitando código 2FA');
      
      const response = await apiService.post('/2fa/send-code');

      if (response && response.success) {
        console.log('✅ UserService - Código 2FA enviado');
        return {
          success: true,
          message: response.message || 'Código enviado',
        };
      }

      return {
        success: false,
        error: response.error || response.message || 'Erro ao enviar código',
      };
    } catch (error) {
      console.error('❌ UserService - Erro ao enviar código 2FA:', error);
      
      return {
        success: false,
        error: error.message || 'Erro ao enviar código de verificação',
      };
    }
  }

  /**
   * Verificar código 2FA
   */
  async verify2FACode(code) {
    try {
      console.log('🔐 UserService - Verificando código 2FA');
      
      const response = await apiService.post('/2fa/verify-code', { code });

      if (response && response.success) {
        console.log('✅ UserService - Código 2FA verificado');
        return {
          success: true,
          message: response.message || 'Código verificado com sucesso',
        };
      }

      return {
        success: false,
        error: response.error || response.message || 'Código inválido',
      };
    } catch (error) {
      console.error('❌ UserService - Erro ao verificar código 2FA:', error);
      
      return {
        success: false,
        error: error.message || 'Erro ao verificar código',
      };
    }
  }

  /**
   * Alterar senha do usuário
   */
  async changePassword(currentPassword, newPassword) {
    try {
      console.log('🔐 UserService - Alterando senha do usuário');
      
      const response = await apiService.post('/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });

      console.log('📥 Response:', response);

      // Verificar se a resposta indica sucesso
      if (response && (response.success || response.message)) {
        console.log('✅ UserService - Senha alterada com sucesso');
        return {
          success: true,
          message: response.message || 'Senha alterada com sucesso',
        };
      }

      return {
        success: false,
        error: response.error || response.message || 'Erro ao alterar senha',
      };
    } catch (error) {
      console.error('❌ UserService - Erro ao alterar senha:', error);
      
      // Extrair mensagem de erro mais específica
      let errorMessage = 'Erro ao alterar senha';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.errors && typeof error.errors === 'object') {
        // Se for um objeto de erros do Laravel
        const firstError = Object.values(error.errors)[0];
        if (Array.isArray(firstError) && firstError.length > 0) {
          errorMessage = firstError[0];
        } else if (typeof firstError === 'string') {
          errorMessage = firstError;
        }
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}

export default new UserService();


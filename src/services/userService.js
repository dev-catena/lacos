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
}

export default new UserService();


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
        timeout: 60000, // 60s - atualização de perfil pode demorar em conexões lentas
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
   * Atualizar cursos e certificações (endpoint dedicado)
   * PUT /api/users/{id}/caregiver-courses
   */
  async updateCaregiverCourses(userId, courses) {
    try {
      const response = await apiService.request(`/users/${userId}/caregiver-courses`, {
        method: 'PUT',
        body: { courses },
        timeout: 30000,
      });
      if (response && response.success) {
        return {
          success: true,
          data: response.caregiver_courses || response.caregiverCourses || [],
        };
      }
      return { success: false, error: 'Resposta inválida' };
    } catch (error) {
      console.error('❌ UserService - Erro ao atualizar cursos:', error);
      return { success: false, error: error.message || 'Erro ao atualizar cursos' };
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
  async getUser(userId = null) {
    try {
      // Usar /user (sem ID) que retorna o usuário autenticado
      // Isso é mais seguro e não requer permissões especiais
      // O parâmetro userId é ignorado, mas mantido para compatibilidade
      console.log('👤 UserService - Buscando usuário autenticado via /user');
      
      const response = await apiService.request('/user', {
        method: 'GET',
      });

      console.log('📥 UserService - Resposta completa do /user:', JSON.stringify(response, null, 2));
      console.log('📥 UserService - Campos do certificado na resposta:', {
        has_certificate: response?.has_certificate,
        certificate_path: response?.certificate_path,
        certificate_type: response?.certificate_type,
        certificate_uploaded_at: response?.certificate_uploaded_at,
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
   * Fazer upload de arquivo .pfx com senha para assinatura digital
   */
  async uploadCertificateFile(userId, formData) {
    try {
      console.log('📤 UserService - Fazendo upload do arquivo .pfx com senha');
      console.log('📤 UserService - User ID:', userId);
      console.log('📤 UserService - Endpoint: /users/' + userId + '/certificate');
      
      // NÃO definir Content-Type manualmente para FormData
      // O React Native define automaticamente com o boundary correto
      const response = await apiService.request(`/users/${userId}/certificate`, {
        method: 'POST',
        body: formData,
        // Não passar headers - o apiService já remove Content-Type para FormData
      });

      console.log('📥 UserService - Resposta completa do upload:', JSON.stringify(response, null, 2));

      if (response && response.success) {
        console.log('✅ UserService - Upload bem-sucedido!', response.data);
        return {
          success: true,
          data: response.data || response,
        };
      } else if (response && response.id) {
        // API retorna diretamente o objeto do usuário
        console.log('✅ UserService - Upload bem-sucedido (resposta direta)!');
        return {
          success: true,
          data: response,
        };
      }

      console.warn('⚠️ UserService - Resposta sem sucesso:', response);
      return {
        success: false,
        error: response?.message || response?.error || 'Erro ao fazer upload do certificado',
      };
    } catch (error) {
      console.error('❌ UserService - Erro completo ao fazer upload do certificado:', error);
      console.error('❌ UserService - Erro response:', error.response);
      console.error('❌ UserService - Erro data:', error.response?.data);
      console.error('❌ UserService - Erro status:', error.response?.status);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Erro ao fazer upload do certificado';
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Fazer upload do certificado digital ICP-Brasil A1
   */
  async uploadCertificate(certificateData) {
    try {
      console.log('🔐 UserService - Fazendo upload do certificado digital');
      
      const formData = new FormData();
      
      // Adicionar arquivo do certificado
      if (certificateData.certificateFile) {
        const fileName = certificateData.certificateFile.name || '';
        const isApx = fileName.toLowerCase().endsWith('.apx');
        const defaultName = isApx ? 'certificado.apx' : 'certificado.pfx';
        const defaultType = isApx ? 'application/apx' : 'application/x-pkcs12';
        
        formData.append('certificate_file', {
          uri: certificateData.certificateFile.uri,
          type: certificateData.certificateFile.mimeType || defaultType,
          name: certificateData.certificateFile.name || defaultName,
        });
      }
      
      // Adicionar tipo de certificado
      if (certificateData.certificateType) {
        formData.append('certificate_type', certificateData.certificateType);
      }
      
      // Adicionar usuário (opcional para .apx)
      if (certificateData.username) {
        formData.append('certificate_username', certificateData.username);
      }
      
      // Adicionar senha
      formData.append('certificate_password', certificateData.password);
      
      console.log('📤 UserService - Enviando certificado para o servidor...', {
        fileName: certificateData.certificateFile?.name,
        fileSize: certificateData.certificateFile?.size,
        certificateType: certificateData.certificateType,
        hasPassword: !!certificateData.password,
      });

      console.log('📤 UserService - Enviando requisição POST para /certificate/upload...');
      
      let response;
      try {
        response = await apiService.post('/certificate/upload', formData);
        console.log('📥 UserService - Resposta recebida do servidor:', {
          success: response?.success,
          message: response?.message,
          data: response?.data,
          error: response?.error,
          status: response?.status,
          fullResponse: response,
        });
      } catch (apiError) {
        console.error('❌ UserService - Erro na requisição API:', {
          message: apiError.message,
          status: apiError.status,
          errors: apiError.errors,
          response: apiError.response,
          rawError: apiError,
        });
        
        // Se o erro tem status, retornar como resposta de erro
        if (apiError.status) {
          return {
            success: false,
            error: apiError.message || 'Erro ao configurar certificado',
            status: apiError.status,
            errors: apiError.errors,
          };
        }
        
        // Se não tem status, lançar novamente para ser capturado pelo catch externo
        throw apiError;
      }

      if (response && response.success) {
        console.log('✅ UserService - Certificado configurado com sucesso');
        console.log('📋 Dados retornados:', response.data);
        return {
          success: true,
          message: response.message || 'Certificado configurado com sucesso',
          data: response.data || {
            has_certificate: true,
            certificate_type: certificateData.certificateType || 'pfx',
          },
        };
      }

      console.error('❌ UserService - Upload falhou:', {
        error: response?.error,
        message: response?.message,
        response: response,
      });

      return {
        success: false,
        error: response?.error || response?.message || 'Erro ao configurar certificado',
      };
    } catch (error) {
      console.error('❌ UserService - Erro ao fazer upload do certificado (catch externo):', error);
      console.error('❌ Detalhes do erro:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        fullError: JSON.stringify(error, null, 2),
      });
      
      return {
        success: false,
        error: error.message || 'Erro ao configurar certificado digital',
      };
    }
  }

  /**
   * Remover certificado digital
   */
  async removeCertificate() {
    try {
      console.log('🔐 UserService - Removendo certificado digital');
      
      const response = await apiService.delete('/certificate/remove');

      if (response && response.success) {
        console.log('✅ UserService - Certificado removido com sucesso');
        return {
          success: true,
          message: response.message || 'Certificado removido com sucesso',
        };
      }

      return {
        success: false,
        error: response.error || response.message || 'Erro ao remover certificado',
      };
    } catch (error) {
      console.error('❌ UserService - Erro ao remover certificado:', error);
      
      return {
        success: false,
        error: error.message || 'Erro ao remover certificado digital',
      };
    }
  }

  /**
   * Alterar senha do usuário
   */
  async changePassword(currentPassword, newPassword, confirmPassword = null) {
    try {
      console.log('🔐 UserService - Alterando senha do usuário');
      
      // O Laravel requer new_password_confirmation quando usa a regra 'confirmed'
      const requestData = {
        current_password: currentPassword,
        new_password: newPassword,
      };
      
      // Se confirmPassword foi fornecido, adicionar ao request
      if (confirmPassword !== null) {
        requestData.new_password_confirmation = confirmPassword;
      } else {
        // Se não foi fornecido, usar newPassword como confirmação (fallback)
        requestData.new_password_confirmation = newPassword;
      }
      
      const response = await apiService.post('/change-password', requestData);

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
      
      // Verificar se é um erro de validação do Laravel
      if (error.errors && typeof error.errors === 'object') {
        // Se for um objeto de erros do Laravel
        const firstError = Object.values(error.errors)[0];
        if (Array.isArray(firstError) && firstError.length > 0) {
          errorMessage = firstError[0];
        } else if (typeof firstError === 'string') {
          errorMessage = firstError;
        }
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error._rawErrorData) {
        // Tentar extrair mensagem do erro raw
        const rawError = error._rawErrorData;
        if (rawError.message) {
          errorMessage = rawError.message;
        } else if (rawError.errors && typeof rawError.errors === 'object') {
          const firstError = Object.values(rawError.errors)[0];
          if (Array.isArray(firstError) && firstError.length > 0) {
            errorMessage = firstError[0];
          }
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


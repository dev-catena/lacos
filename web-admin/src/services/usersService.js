// Serviço para gerenciar usuários via API
import { API_BASE_URL } from '../config/api';

// Função auxiliar para limpar texto antes do JSON
const cleanJsonResponse = async (response) => {
  try {
    const text = await response.text();
    
    if (!text || text.trim() === '') {
      console.warn('⚠️ Resposta vazia');
      return {};
    }
    
    // Log do texto original para debug (apenas primeiros 300 chars)
    if (text.length > 0 && (text.indexOf('use AppHttp') !== -1 || text.indexOf('use App') !== -1)) {
      console.warn('⚠️ Texto suspeito detectado na resposta:', text.substring(0, 300));
    }
    
    // Limpar texto: remover qualquer conteúdo antes do primeiro { ou [
    // Isso corrige o problema de "use AppHttpControllers..." aparecendo antes do JSON
    const firstBrace = text.indexOf('{');
    const firstBracket = text.indexOf('[');
    
    let cleanedText = text;
    
    if (firstBrace !== -1 || firstBracket !== -1) {
      const startIndex = firstBrace !== -1 && firstBracket !== -1
        ? Math.min(firstBrace, firstBracket)
        : firstBrace !== -1 ? firstBrace : firstBracket;
      
      if (startIndex > 0) {
        console.warn(`⚠️ Texto antes do JSON detectado (${startIndex} caracteres), removendo...`);
        console.warn(`⚠️ Texto removido: "${text.substring(0, Math.min(startIndex, 200))}"`);
        cleanedText = text.substring(startIndex);
      }
    } else {
      // Se não encontrou { ou [, tentar encontrar qualquer JSON válido
      // Procurar por padrões comuns de início de JSON
      const jsonPatterns = [
        /^\s*\{/,
        /^\s*\[/,
        /use\s+App[^;]*;\s*(\{|\[)/,
      ];
      
      for (const pattern of jsonPatterns) {
        const match = text.match(pattern);
        if (match) {
          const startIndex = text.indexOf(match[0]);
          if (startIndex >= 0) {
            // Encontrar o primeiro { ou [ após o padrão
            const afterPattern = text.substring(startIndex + match[0].length);
            const braceIndex = afterPattern.indexOf('{');
            const bracketIndex = afterPattern.indexOf('[');
            
            if (braceIndex !== -1 || bracketIndex !== -1) {
              const finalIndex = startIndex + match[0].length + (braceIndex !== -1 && bracketIndex !== -1
                ? Math.min(braceIndex, bracketIndex)
                : braceIndex !== -1 ? braceIndex : bracketIndex);
              
              console.warn(`⚠️ JSON encontrado após padrão, removendo ${finalIndex} caracteres`);
              cleanedText = text.substring(finalIndex);
              break;
            }
          }
        }
      }
    }
    
    // Tentar fazer parse do JSON limpo
    try {
      const parsed = JSON.parse(cleanedText);
      return parsed;
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse do JSON:', parseError);
      console.error('❌ Texto original (primeiros 500 chars):', text.substring(0, 500));
      console.error('❌ Texto limpo (primeiros 500 chars):', cleanedText.substring(0, 500));
      
      // Tentar uma última vez: procurar por qualquer JSON válido no texto
      const jsonMatch = cleanedText.match(/(\{.*\}|\[.*\])/s);
      if (jsonMatch) {
        try {
          console.warn('⚠️ Tentando extrair JSON do texto...');
          return JSON.parse(jsonMatch[0]);
        } catch (e) {
          // Ignorar e continuar com o erro original
        }
      }
      
      throw new Error(`Erro ao processar resposta do servidor: ${parseError.message}. Texto: "${text.substring(0, 200)}"`);
    }
  } catch (error) {
    console.error('❌ Erro em cleanJsonResponse:', error);
    throw error;
  }
};

class UsersService {
  constructor() {
    this.token = localStorage.getItem('@lacos:token');
    this.onAccountBlocked = null; // Callback para quando conta é bloqueada
  }

  setAccountBlockedCallback(callback) {
    this.onAccountBlocked = callback;
  }

  getHeaders() {
    const token = localStorage.getItem('@lacos:token');
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  async getAllUsers() {
    try {
      const headers = this.getHeaders();
      const token = localStorage.getItem('@lacos:token');
      
      if (!token) {
        throw new Error('Token de autenticação não encontrado. Faça login novamente.');
      }

      const url = `${API_BASE_URL}/admin/users`;
      console.log('🌐 Tentando buscar usuários em:', url);
      console.log('🔑 Token presente:', !!token);

      const response = await fetch(url, {
        method: 'GET',
        headers: headers,
        mode: 'cors', // Garantir modo CORS
      });

      if (response.status === 401) {
        throw new Error('Não autenticado. Faça login novamente.');
      }

      // IMPORTANTE: Ler o body apenas uma vez (response.text() só pode ser chamado uma vez)
      // Ler o texto uma vez e fazer parse depois
      let responseData = null;
      let hasReadBody = false;

      const getResponseData = async () => {
        if (!hasReadBody) {
          // Clonar a resposta para poder ler o texto sem consumir o body original
          const clonedResponse = response.clone();
          responseData = await cleanJsonResponse(clonedResponse).catch((err) => {
            console.error('❌ Erro ao processar resposta:', err);
            return {};
          });
          hasReadBody = true;
        }
        return responseData;
      };

      if (response.status === 403) {
        const errorData = await getResponseData();
        // Verificar se é erro de conta bloqueada
        if (errorData.error === 'account_blocked') {
          // Chamar callback se estiver definido
          if (this.onAccountBlocked) {
            this.onAccountBlocked();
          }
          throw new Error('Sua conta foi bloqueada. Você foi desconectado.');
        }
        throw new Error('Acesso negado. Você precisa ter permissão de root.');
      }

      if (!response.ok) {
        const errorData = await getResponseData();
        throw new Error(errorData.message || errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      const data = await getResponseData();
      // Se a resposta for paginada, retornar apenas os dados
      // Se for array diretamente, retornar o array
      if (Array.isArray(data)) {
        return data;
      }
      return data.data || data;
    } catch (error) {
      console.error('❌ Erro ao buscar usuários:', error);
      console.error('❌ Detalhes do erro:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Tratar erro "Failed to fetch" especificamente
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        const errorMessage = `Não foi possível conectar ao servidor. Verifique se o backend está rodando em ${API_BASE_URL}`;
        console.error('❌ Erro de conexão:', errorMessage);
        throw new Error(errorMessage);
      }
      
      throw error;
    }
  }

  async blockUser(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/block`, {
        method: 'POST',
        headers: this.getHeaders(),
      });

      if (response.status === 403) {
        const errorData = await cleanJsonResponse(response).catch(() => ({}));
        // Verificar se é erro de conta bloqueada
        if (errorData.error === 'account_blocked') {
          // Chamar callback se estiver definido
          if (this.onAccountBlocked) {
            this.onAccountBlocked();
          }
          throw new Error('Sua conta foi bloqueada. Você foi desconectado.');
        }
      }

      if (!response.ok) {
        const error = await cleanJsonResponse(response);
        throw new Error(error.message || 'Erro ao bloquear usuário');
      }

      return await cleanJsonResponse(response);
    } catch (error) {
      console.error('Erro ao bloquear usuário:', error);
      throw error;
    }
  }

  async unblockUser(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/unblock`, {
        method: 'POST',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await cleanJsonResponse(response);
        throw new Error(error.message || 'Erro ao desbloquear usuário');
      }

      return await cleanJsonResponse(response);
    } catch (error) {
      console.error('Erro ao desbloquear usuário:', error);
      throw error;
    }
  }

  async getUserPlan(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/plan`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar plano do usuário');
      }

      return await cleanJsonResponse(response);
    } catch (error) {
      console.error('Erro ao buscar plano do usuário:', error);
      return null;
    }
  }

  async deleteUser(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (response.status === 403) {
        const errorData = await cleanJsonResponse(response).catch(() => ({}));
        if (errorData.error === 'account_blocked') {
          if (this.onAccountBlocked) {
            this.onAccountBlocked();
          }
          throw new Error('Sua conta foi bloqueada. Você foi desconectado.');
        }
        throw new Error(errorData.message || 'Acesso negado');
      }

      if (!response.ok) {
        const error = await cleanJsonResponse(response);
        throw new Error(error.message || error.error || 'Erro ao excluir usuário');
      }

      return await cleanJsonResponse(response);
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      throw error;
    }
  }
}

export default new UsersService();


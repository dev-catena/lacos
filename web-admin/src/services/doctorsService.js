// Serviço para gerenciar médicos via API
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

class DoctorsService {
  constructor() {
    this.token = localStorage.getItem('@lacos:token');
  }

  getHeaders() {
    const token = localStorage.getItem('@lacos:token');
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  async getPendingDoctors() {
    try {
      const headers = this.getHeaders();
      const token = localStorage.getItem('@lacos:token');
      
      if (!token) {
        throw new Error('Token de autenticação não encontrado. Faça login novamente.');
      }

      const response = await fetch(`${API_BASE_URL}/admin/doctors/pending`, {
        method: 'GET',
        headers: headers,
      });

      if (response.status === 401) {
        throw new Error('Não autenticado. Faça login novamente.');
      }

      // Clonar resposta para poder ler múltiplas vezes se necessário
      const responseClone = response.clone();
      let responseData = null;
      let hasReadBody = false;

      const getResponseData = async () => {
        if (!hasReadBody) {
          responseData = await cleanJsonResponse(responseClone).catch((err) => {
            console.error('❌ Erro ao processar resposta:', err);
            return {};
          });
          hasReadBody = true;
        }
        return responseData;
      };

      if (response.status === 403) {
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
      console.error('Erro ao buscar médicos pendentes:', error);
      throw error;
    }
  }

  async getAllDoctors() {
    try {
      const headers = this.getHeaders();
      const token = localStorage.getItem('@lacos:token');
      
      if (!token) {
        throw new Error('Token de autenticação não encontrado. Faça login novamente.');
      }

      const response = await fetch(`${API_BASE_URL}/admin/doctors`, {
        method: 'GET',
        headers: headers,
      });

      if (response.status === 401) {
        throw new Error('Não autenticado. Faça login novamente.');
      }

      // Clonar resposta para poder ler múltiplas vezes se necessário
      const responseClone = response.clone();
      let responseData = null;
      let hasReadBody = false;

      const getResponseData = async () => {
        if (!hasReadBody) {
          responseData = await cleanJsonResponse(responseClone).catch((err) => {
            console.error('❌ Erro ao processar resposta:', err);
            return {};
          });
          hasReadBody = true;
        }
        return responseData;
      };

      if (response.status === 403) {
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
      console.error('Erro ao buscar médicos:', error);
      throw error;
    }
  }

  async approveDoctor(doctorId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/doctors/${doctorId}/approve`, {
        method: 'POST',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await cleanJsonResponse(response);
        throw new Error(error.message || 'Erro ao aprovar médico');
      }

      return await cleanJsonResponse(response);
    } catch (error) {
      console.error('Erro ao aprovar médico:', error);
      throw error;
    }
  }

  async rejectDoctor(doctorId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/doctors/${doctorId}/reject`, {
        method: 'POST',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await cleanJsonResponse(response);
        throw new Error(error.message || 'Erro ao rejeitar médico');
      }

      return await cleanJsonResponse(response);
    } catch (error) {
      console.error('Erro ao rejeitar médico:', error);
      throw error;
    }
  }

  async blockDoctor(doctorId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/doctors/${doctorId}/block`, {
        method: 'POST',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await cleanJsonResponse(response);
        throw new Error(error.message || 'Erro ao bloquear médico');
      }

      return await cleanJsonResponse(response);
    } catch (error) {
      console.error('Erro ao bloquear médico:', error);
      throw error;
    }
  }

  async updateDoctor(doctorId, doctorData) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/doctors/${doctorId}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(doctorData),
      });

      if (response.status === 401) {
        throw new Error('Não autenticado. Faça login novamente.');
      }

      // Clonar resposta para poder ler múltiplas vezes se necessário
      const responseClone = response.clone();
      let responseData = null;
      let hasReadBody = false;

      const getResponseData = async () => {
        if (!hasReadBody) {
          responseData = await cleanJsonResponse(responseClone).catch((err) => {
            console.error('❌ Erro ao processar resposta:', err);
            return {};
          });
          hasReadBody = true;
        }
        return responseData;
      };

      if (response.status === 403) {
        throw new Error('Acesso negado. Você precisa ter permissão de root.');
      }

      if (!response.ok) {
        const errorData = await getResponseData();
        throw new Error(errorData.message || errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      const data = await getResponseData();
      return data;
    } catch (error) {
      console.error('❌ Erro ao atualizar médico:', error);
      throw error;
    }
  }

  async getDoctorDetails(doctorId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/doctors/${doctorId}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (response.status === 401) {
        throw new Error('Não autenticado. Faça login novamente.');
      }

      if (response.status === 403) {
        throw new Error('Acesso negado. Você precisa ter permissão de root.');
      }

      if (!response.ok) {
        const error = await cleanJsonResponse(response);
        throw new Error(error.message || error.error || `Erro ${response.status}: ${response.statusText}`);
      }

      return await cleanJsonResponse(response);
    } catch (error) {
      console.error('Erro ao buscar detalhes do médico:', error);
      throw error;
    }
  }

  async deleteDoctor(doctorId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/doctors/${doctorId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await cleanJsonResponse(response);
        throw new Error(error.message || error.error || 'Erro ao excluir médico');
      }

      return await cleanJsonResponse(response);
    } catch (error) {
      console.error('Erro ao excluir médico:', error);
      throw error;
    }
  }
}

export default new DoctorsService();


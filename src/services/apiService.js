import API_CONFIG from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

class ApiService {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  /**
   * Get authorization token
   */
  async getToken() {
    try {
      const token = await AsyncStorage.getItem('@lacos:token');
      return token;
    } catch (error) {
      console.error('Erro ao obter token:', error);
      return null;
    }
  }

  /**
   * Make HTTP request
   */
  async request(endpoint, options = {}) {
    const {
      method = 'GET',
      body = null,
      headers = {},
      requiresAuth = true,
      timeout = null, // Timeout customizado (em ms). Se null, usa o padrão
    } = options;

    try {
      // Preparar headers
      const requestHeaders = {
        ...API_CONFIG.DEFAULT_HEADERS,
        ...headers,
      };

      // Adicionar token se necessário
      if (requiresAuth) {
        const token = await this.getToken();
        if (token) {
          requestHeaders['Authorization'] = `Bearer ${token}`;
        }
        
        // LOG: Identificar usuário
        try {
          const userDataStr = await AsyncStorage.getItem('@lacos:user');
          if (userDataStr) {
            const userData = JSON.parse(userDataStr);
            console.log(`📱 REQUEST [${method}] ${endpoint} - Usuário: ${userData.name} | Telefone: ${userData.phone || 'N/A'}`);
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/51b97caa-ec63-41d9-9fe3-852605fb57dc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apiService.js:54',message:'Request with auth',data:{method:method,endpoint:endpoint,hasToken:!!token,userId:userData?.id,userRole:userData?.role},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'N'})}).catch(()=>{});
            // #endregion
          }
        } catch (e) {
          // Ignore se não conseguir pegar dados do usuário
        }
      }

      // Preparar configuração da requisição
      const config = {
        method,
        headers: requestHeaders,
      };

      // Adicionar body se necessário
      if (body && method !== 'GET') {
        // Se for FormData, enviar diretamente (não fazer stringify)
        if (body instanceof FormData) {
          config.body = body;
          // Remover Content-Type para deixar o browser/RN definir com boundary
          delete config.headers['Content-Type'];
        } else {
          // Para JSON normal, fazer stringify
          config.body = JSON.stringify(body);
        }
      }

      // Fazer requisição com timeout
      // Usar timeout customizado se fornecido, senão usar o padrão
      const requestTimeout = timeout || this.timeout;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), requestTimeout);

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check for errors first
      if (!response.ok) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/51b97caa-ec63-41d9-9fe3-852605fb57dc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apiService.js:94',message:'HTTP error detected',data:{status:response.status,statusText:response.statusText,endpoint:endpoint,contentType:response.headers.get('content-type')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
        // #endregion
        let errorData = {};
        const contentType = response.headers.get('content-type');
        
        // 404 em /pharmacy-prices/last não é erro crítico (apenas significa que não há preço informado)
        const isPharmacyPrice404 = response.status === 404 && endpoint.includes('pharmacy-prices/last');
        
        // Tentar fazer parse do JSON de erro se houver conteúdo
        if (contentType && contentType.includes('application/json')) {
          try {
            const responseText = await response.text();
            // #region agent log
            const responseTextLog = {
              location: 'apiService.js:105',
              message: 'Error response text',
              data: {
                responseText: responseText.substring(0,1000),
                textLength: responseText.length,
                endpoint: endpoint,
                status: response.status
              },
              timestamp: Date.now(),
              sessionId: 'debug-session',
              runId: 'run1',
              hypothesisId: 'I'
            };
            console.log('🔍 DEBUG RESPONSE TEXT:', JSON.stringify(responseTextLog, null, 2));
            fetch('http://127.0.0.1:7242/ingest/51b97caa-ec63-41d9-9fe3-852605fb57dc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(responseTextLog)}).catch(()=>{});
            // #endregion
            errorData = JSON.parse(responseText);
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/51b97caa-ec63-41d9-9fe3-852605fb57dc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apiService.js:108',message:'Error data parsed',data:{errorData:errorData,errorKeys:Object.keys(errorData)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
            // #endregion
          } catch (e) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/51b97caa-ec63-41d9-9fe3-852605fb57dc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apiService.js:111',message:'Error parsing JSON',data:{parseError:e?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'K'})}).catch(()=>{});
            // #endregion
            // Se falhar, usar mensagem genérica
            errorData = { message: `Erro HTTP ${response.status}` };
          }
        } else {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/51b97caa-ec63-41d9-9fe3-852605fb57dc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apiService.js:116',message:'Non-JSON error response',data:{contentType:contentType},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'L'})}).catch(()=>{});
          // #endregion
        }
        
        // Para erros 500 em endpoints não críticos (como alertas), não logar como erro crítico
        // 404 em /pharmacy-prices/last também não é erro crítico (apenas significa que não há preço informado)
        const isNonCriticalEndpoint = endpoint.includes('/alerts/active');
        const errorMessage = errorData.message || `Erro na requisição: ${response.status}`;
        
        // Criar objeto de erro sem logar ainda
        const errorObj = {
          status: response.status,
          message: errorMessage,
          errors: errorData.errors || {},
        };
        
        // #region agent log
        const errorObjLog = {
          location: 'apiService.js:128',
          message: 'Error object created',
          data: {
            errorObj: errorObj,
            isNonCritical: isNonCriticalEndpoint,
            isPharmacy404: isPharmacyPrice404,
            errorData: errorData,
            endpoint: endpoint,
            status: response.status
          },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'M'
        };
        console.log('🔍 DEBUG ERROR OBJ:', JSON.stringify(errorObjLog, null, 2));
        fetch('http://127.0.0.1:7242/ingest/51b97caa-ec63-41d9-9fe3-852605fb57dc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(errorObjLog)}).catch(()=>{});
        // #endregion
        
        // Não logar 404 de preços de farmácia como erro (é esperado quando não há preço informado)
        // Não logar 500 em endpoints não críticos
        const shouldLogError = !isPharmacyPrice404 && (!isNonCriticalEndpoint || response.status !== 500);
        if (shouldLogError) {
          console.error(`❌ API Error:`, errorMessage);
          // Log detalhado para debug
          if (response.status === 500) {
            console.error('🔍 DEBUG 500 Error Details:', {
              endpoint: endpoint,
              status: response.status,
              errorData: errorData,
              errorObj: errorObj,
              fullErrorData: JSON.stringify(errorData, null, 2)
            });
          }
        }
        // Para endpoints não críticos com erro 500, não logar nada aqui
        // O serviço específico vai tratar e logar como warning se necessário
        
        throw errorObj;
      }

      // Parse response JSON - verificar se há conteúdo
      const contentType = response.headers.get('content-type');
      
      // Se não houver content-type ou não for JSON, retornar resposta vazia
      if (!contentType || !contentType.includes('application/json')) {
        return {};
      }

      // Verificar se há conteúdo no body
      const text = await response.text();
      if (!text || text.trim() === '') {
        return {};
      }

      // Tentar fazer parse do JSON
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error('Erro ao fazer parse do JSON:', text);
        throw {
          status: 500,
          message: 'Resposta inválida do servidor',
        };
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        throw {
          status: 408,
          message: 'Tempo de requisição esgotado',
        };
      }

      // Verificar se é endpoint não crítico antes de logar
      const isNonCriticalEndpoint = endpoint.includes('/alerts/active');
      const isPharmacyPrice404 = error.status === 404 && endpoint.includes('pharmacy-prices/last');
      const isNonCriticalError = isNonCriticalEndpoint && (error.status === 500 || error.status >= 500);
      
      // Não logar 404 de preços de farmácia (é esperado quando não há preço informado)
      // Não logar erros não críticos
      if (!isPharmacyPrice404 && !isNonCriticalError) {
        console.error('API Error:', error);
      }
      // Para erros não críticos, não logar nada - o serviço específico vai tratar
      
      throw error;
    }
  }

  /**
   * GET request
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  async post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }

  /**
   * PUT request
   */
  async put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  }

  /**
   * DELETE request
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * Helper to replace URL parameters
   * Example: replaceParams('/groups/:id', { id: 123 }) => '/groups/123'
   */
  replaceParams(endpoint, params) {
    let result = endpoint;
    Object.keys(params).forEach(key => {
      result = result.replace(`:${key}`, params[key]);
    });
    return result;
  }
}

export default new ApiService();


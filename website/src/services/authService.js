// Serviço de autenticação para o site público
import { API_BASE_URL } from '../config/api';

class AuthService {
  constructor() {
    this.token = localStorage.getItem('@lacos:token');
    this.user = this.getStoredUser();
  }

  getStoredUser() {
    const userStr = localStorage.getItem('@lacos:user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
    };
  }

  async login(email, password) {
    try {
      console.log('🔐 AuthService - Tentando login para:', email);
      
      // O backend espera 'login' (pode ser email ou CPF), não 'email'
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ login: email, password }),
        mode: 'cors',
        credentials: 'omit',
      });

      let data;
      const text = await response.text();
      
      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error('❌ Erro ao parsear resposta do login:', parseError);
        console.error('❌ Texto da resposta:', text);
        data = { message: 'Erro ao processar resposta do servidor' };
      }

      // Logs detalhados para debug
      console.log('═══════════════════════════════════════');
      console.log('🔐 AuthService - Status HTTP:', response.status);
      console.log('🔐 AuthService - Resposta completa:', data);
      console.log('🔐 AuthService - Texto bruto:', text);
      console.log('═══════════════════════════════════════');

      if (!response.ok) {
        // Para erro 422 (Unprocessable Entity), tentar extrair detalhes
        if (response.status === 422) {
          console.error('❌ Erro 422 - Dados inválidos no login');
          console.error('❌ Resposta completa:', data);
          
          // Verificar múltiplos formatos de erro possíveis
          let errors = null;
          
          if (data.errors && typeof data.errors === 'object') {
            errors = data.errors;
            console.log('✅ Erros encontrados em data.errors');
          } else if (data.erros && typeof data.erros === 'object') {
            errors = data.erros;
            console.log('✅ Erros encontrados em data.erros');
          } else if (data.error && typeof data.error === 'object') {
            errors = data.error;
            console.log('✅ Erros encontrados em data.error');
          }
          
          // Se encontrou erros estruturados, formatar mensagens
          if (errors && typeof errors === 'object' && Object.keys(errors).length > 0) {
            console.log('📋 Erros detalhados:', errors);
            const errorMessages = Object.entries(errors)
              .map(([field, messages]) => {
                const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                const messagesArray = Array.isArray(messages) ? messages : [messages];
                // Traduzir mensagens comuns do Laravel para português
                const translatedMessages = messagesArray.map(msg => {
                  if (typeof msg === 'string') {
                    if (msg.includes('required')) {
                      return 'Este campo é obrigatório.';
                    }
                    if (msg.includes('invalid') || msg.includes('credentials')) {
                      return 'Email ou senha incorretos. Verifique suas credenciais.';
                    }
                    if (msg.includes('format')) {
                      return 'Formato inválido.';
                    }
                  }
                  return msg;
                });
                return `${fieldName}: ${translatedMessages.join(', ')}`;
              })
              .join('\n');
            throw new Error(errorMessages);
          }
          
          // Se não houver estrutura de erros, usar mensagem traduzida
          if (data.message) {
            // Traduzir mensagens comuns
            let translatedMessage = data.message;
            if (data.message.includes('invalid') || data.message.includes('credentials')) {
              translatedMessage = 'Email ou senha incorretos. Verifique suas credenciais.';
            }
            throw new Error(translatedMessage);
          }
          
          // Último recurso
          throw new Error('Email ou senha incorretos. Verifique suas credenciais.');
        }
        
        // Para erro 401 (Unauthorized)
        if (response.status === 401) {
          throw new Error('Email ou senha incorretos. Verifique suas credenciais.');
        }
        
        // Para erro 403 (Forbidden)
        if (response.status === 403) {
          if (data.message && data.message.includes('bloqueada')) {
            throw new Error('Acesso negado. Sua conta foi bloqueada.');
          }
          throw new Error('Acesso negado.');
        }
        
        // Para outros erros HTTP
        let errorMessage = data.message || data.error || `Erro ${response.status}: Erro desconhecido`;
        
        // Traduzir mensagens de erro comuns
        if (response.status === 500) {
          errorMessage = 'Erro interno do servidor. Por favor, tente novamente em alguns instantes.';
        } else if (response.status === 503) {
          errorMessage = 'Serviço temporariamente indisponível. Tente novamente em alguns instantes.';
        }
        
        console.error(`❌ Erro HTTP ${response.status}:`, errorMessage);
        throw new Error(errorMessage);
      }

      if (data.token) {
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem('@lacos:token', data.token);
        localStorage.setItem('@lacos:user', JSON.stringify(data.user));
        console.log('✅ Login realizado com sucesso para:', data.user?.email);
      }

      return { user: data.user, token: data.token };
    } catch (error) {
      console.error('❌ Erro ao fazer login:', error);
      throw error;
    }
  }

  async register(userData) {
    try {
      console.log('📝 AuthService - Dados sendo enviados:', { ...userData, password: '***', password_confirmation: '***' });
      
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(userData),
        mode: 'cors',
        credentials: 'omit',
      });
      
      console.log('📝 AuthService - Status da resposta:', response.status);

      let data;
      const text = await response.text();
      
      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error('❌ Erro ao parsear resposta:', parseError);
        console.error('❌ Texto da resposta:', text);
        // Se não conseguir parsear, criar objeto com o texto
        data = { 
          message: 'Erro ao processar resposta do servidor',
          rawResponse: text 
        };
      }

      // Logs detalhados para debug - SEMPRE executar
      console.log('═══════════════════════════════════════');
      console.log('📝 AuthService - Status HTTP:', response.status);
      console.log('📝 AuthService - Resposta completa:', data);
      console.log('📝 AuthService - Texto bruto:', text);
      console.log('📝 AuthService - Tipo de data:', typeof data);
      console.log('📝 AuthService - Keys de data:', Object.keys(data || {}));
      console.log('═══════════════════════════════════════');

      if (!response.ok) {
        // Para erro 422 (Unprocessable Entity), sempre tentar extrair detalhes
        if (response.status === 422) {
          console.error('❌ Erro 422 - Dados inválidos');
          console.error('❌ Resposta completa:', data);
          
          // Verificar múltiplos formatos de erro possíveis
          let errors = null;
          
          // Formato padrão Laravel: { errors: { campo: ['mensagem'] } }
          if (data.errors && typeof data.errors === 'object') {
            errors = data.errors;
            console.log('✅ Erros encontrados em data.errors');
          }
          // Formato alternativo: { erros: { campo: ['mensagem'] } }
          else if (data.erros && typeof data.erros === 'object') {
            errors = data.erros;
            console.log('✅ Erros encontrados em data.erros');
          }
          // Formato: { error: { campo: ['mensagem'] } }
          else if (data.error && typeof data.error === 'object') {
            errors = data.error;
            console.log('✅ Erros encontrados em data.error');
          }
          
          // Se encontrou erros estruturados, formatar mensagens
          if (errors && typeof errors === 'object' && Object.keys(errors).length > 0) {
            console.log('📋 Erros detalhados:', errors);
            const errorMessages = Object.entries(errors)
              .map(([field, messages]) => {
                const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                const messagesArray = Array.isArray(messages) ? messages : [messages];
                // Traduzir mensagens comuns do Laravel para português
                const translatedMessages = messagesArray.map(msg => {
                  if (typeof msg === 'string') {
                    // Traduções comuns
                    if (msg.includes('already been taken')) {
                      return 'Este email já está cadastrado. Use outro email ou faça login.';
                    }
                    if (msg.includes('required')) {
                      return 'Este campo é obrigatório.';
                    }
                    if (msg.includes('must be at least')) {
                      return msg.replace('must be at least', 'deve ter pelo menos');
                    }
                    if (msg.includes('must match')) {
                      return msg.replace('must match', 'deve corresponder');
                    }
                    if (msg.includes('invalid')) {
                      return 'Valor inválido.';
                    }
                    if (msg.includes('format')) {
                      return 'Formato inválido.';
                    }
                  }
                  return msg;
                });
                return `${fieldName}: ${translatedMessages.join(', ')}`;
              })
              .join('\n');
            throw new Error(errorMessages);
          }
          
          // Se não houver estrutura de erros, tentar usar mensagem genérica ou mostrar tudo
          if (data.message) {
            throw new Error(data.message);
          }
          
          // Último recurso: mostrar resposta completa para debug
          const errorMsg = `Erro de validação (422). Resposta do servidor: ${JSON.stringify(data)}`;
          console.error('❌ Erro 422 sem estrutura conhecida:', errorMsg);
          throw new Error(errorMsg);
        }
        
        // Para outros erros HTTP
        let errorMessage = data.message || data.error || `Erro ${response.status}: Erro desconhecido`;
        
        // Traduzir mensagens de erro comuns
        if (response.status === 500) {
          errorMessage = 'Erro interno do servidor. Por favor, tente novamente em alguns instantes. Se o problema persistir, entre em contato com o suporte.';
        } else if (response.status === 503) {
          errorMessage = 'Serviço temporariamente indisponível. Tente novamente em alguns instantes.';
        } else if (response.status === 401) {
          errorMessage = 'Não autorizado. Verifique suas credenciais.';
        } else if (response.status === 403) {
          errorMessage = 'Acesso negado.';
        }
        
        console.error(`❌ Erro HTTP ${response.status}:`, errorMessage);
        throw new Error(errorMessage);
      }

      if (data.token) {
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem('@lacos:token', data.token);
        localStorage.setItem('@lacos:user', JSON.stringify(data.user));
      }

      return { user: data.user, token: data.token };
    } catch (error) {
      console.error('Erro ao fazer cadastro:', error);
      throw error;
    }
  }

  async forgotPassword(email) {
    try {
      const response = await fetch(`${API_BASE_URL}/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email }),
        mode: 'cors',
        credentials: 'omit',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || `Erro ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Erro ao solicitar recuperação de senha:', error);
      throw error;
    }
  }

  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('@lacos:token');
    localStorage.removeItem('@lacos:user');
  }

  isAuthenticated() {
    return !!this.token && !!this.user;
  }

  getUser() {
    return this.user;
  }

  getToken() {
    return this.token;
  }
}

export default new AuthService();


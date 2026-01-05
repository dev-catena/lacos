// Serviço de autenticação para gestão root
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
      console.log('🔐 Tentando login em:', `${API_BASE_URL}/admin/login`);
      console.log('🔐 Origem atual:', window.location.origin);
      console.log('🔐 Protocolo:', window.location.protocol);
      
      const response = await fetch(`${API_BASE_URL}/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        mode: 'cors', // Explicitamente habilitar CORS
        credentials: 'omit', // Não enviar cookies
      }).catch((fetchError) => {
        console.error('❌ Erro na requisição fetch:', fetchError);
        console.error('❌ Tipo do erro:', fetchError.name);
        console.error('❌ Mensagem:', fetchError.message);
        console.error('❌ Stack:', fetchError.stack);
        
        // Se for erro de rede/CORS, fornecer mensagem mais clara
        if (fetchError.message.includes('Failed to fetch') || 
            fetchError.message.includes('NetworkError') ||
            fetchError.message.includes('Network request failed') ||
            fetchError.name === 'TypeError') {
          throw new Error('Não foi possível conectar ao servidor. Verifique:\n' +
            '• Sua conexão com a internet\n' +
            '• Se o servidor está acessível\n' +
            '• Se há bloqueio de firewall ou proxy\n' +
            '• Se o certificado SSL está válido');
        }
        throw fetchError;
      });

      // Tentar parsear JSON, mas tratar erros de parse
      let data;
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        // Se não conseguir parsear JSON, criar objeto de erro baseado no status
        data = {
          message: response.status === 403 
            ? 'Acesso negado. Sua conta foi bloqueada.'
            : 'Erro ao processar resposta do servidor',
          error: response.status === 403 ? 'account_blocked' : 'parse_error'
        };
      }

      if (!response.ok) {
        // Tratar especificamente erro de conta bloqueada
        if (response.status === 403 && (data.error === 'account_blocked' || data.message?.includes('bloqueada'))) {
          throw new Error('Acesso negado. Sua conta foi bloqueada.');
        }
        // Outros erros
        throw new Error(data.message || data.error || `Erro ${response.status}: ${response.statusText}`);
      }

      // Salvar token e usuário
      if (data.token) {
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem('@lacos:token', data.token);
        localStorage.setItem('@lacos:user', JSON.stringify(data.user));
      }

      return { user: data.user, token: data.token };
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    }
  }

  async checkAuth() {
    if (!this.token) {
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/user`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        // Só fazer logout em casos específicos de autenticação inválida
        if (response.status === 401) {
          // Token inválido ou expirado
          console.warn('Token inválido ou expirado, fazendo logout');
          this.logout();
          return false;
        }
        
        // Se for erro 403 com account_blocked, o usuário foi bloqueado
        if (response.status === 403) {
          const errorData = await response.json().catch(() => ({}));
          if (errorData.error === 'account_blocked') {
            console.warn('Usuário bloqueado, fazendo logout automático');
            this.logout();
            return false;
          }
        }
        
        // Para outros erros (500, 503, etc), não fazer logout
        // Apenas retornar false e manter a sessão
        console.warn('Erro ao verificar autenticação (status:', response.status, '), mantendo sessão');
        return false;
      }

      const user = await response.json();
      
      // Verificar se o usuário está bloqueado (verificação adicional)
      if (user && user.is_blocked) {
        console.warn('Usuário bloqueado detectado, fazendo logout automático');
        this.logout();
        return false;
      }
      
      this.user = user;
      localStorage.setItem('@lacos:user', JSON.stringify(user));
      return true;
    } catch (error) {
      // Erros de rede (timeout, conexão perdida, etc) não devem fazer logout
      // Apenas retornar false e manter a sessão
      console.warn('Erro de rede ao verificar autenticação, mantendo sessão:', error.message);
      return false;
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


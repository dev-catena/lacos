import React, { useState } from 'react';
import { API_BASE_URL } from '../config/api';
import './LoginScreen.css';

const LoginScreen = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'omit',
        body: JSON.stringify({ email, password }),
      });

      // Tentar parsear JSON, mas tratar erros de parse
      let data = {};
      const text = await response.text();
      
      if (text) {
        try {
          data = JSON.parse(text);
        } catch (parseError) {
          console.error('Erro ao parsear JSON:', parseError);
          console.error('Resposta do servidor:', text.substring(0, 200));
          
          // Se não conseguir parsear JSON, verificar se é HTML ou outro formato
          if (text.includes('<!DOCTYPE') || text.includes('<html')) {
            // Resposta HTML - provavelmente erro do servidor
            data = {
              message: response.status === 403 
                ? 'Acesso negado. Sua conta foi bloqueada.'
                : 'Erro no servidor. Tente novamente mais tarde.',
              error: response.status === 403 ? 'account_blocked' : 'server_error'
            };
          } else {
            // Outro formato de texto
            data = {
              message: text.substring(0, 100) || (response.status === 403 
                ? 'Acesso negado. Sua conta foi bloqueada.'
                : 'Erro ao processar resposta do servidor'),
              error: response.status === 403 ? 'account_blocked' : 'parse_error'
            };
          }
        }
      }

      if (!response.ok) {
        console.error('Erro na resposta:', {
          status: response.status,
          statusText: response.statusText,
          data: data
        });
        
        // Tratar especificamente erro de conta bloqueada
        if (response.status === 403) {
          const blockedMessage = data.message || data.error || 'Acesso negado. Sua conta foi bloqueada.';
          throw new Error(blockedMessage.includes('bloqueada') || data.error === 'account_blocked' 
            ? 'Acesso negado. Sua conta foi bloqueada.'
            : blockedMessage);
        }
        
        // Outros erros
        const errorMessage = data.message || data.error || `Erro ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      // Salvar token
      if (data.token) {
        localStorage.setItem('@lacos:token', data.token);
        localStorage.setItem('@lacos:user', JSON.stringify(data.user));
      }

      // Chamar callback de login
      onLogin(data.user);
    } catch (err) {
      // Exibir mensagem de erro específica
      let errorMessage = err.message || 'Erro ao fazer login. Verifique suas credenciais.';
      
      // Melhorar mensagem de erro de rede
      if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError') || err.message.includes('conectar ao servidor'))) {
        errorMessage = 'Não foi possível conectar ao servidor. Verifique:\n' +
          '• Sua conexão com a internet\n' +
          '• Se o servidor está acessível\n' +
          '• Se há bloqueio de firewall ou proxy';
      }
      
      setError(errorMessage);
      console.error('Erro no login:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Laços</h1>
          <p>Gestão Root - Acesso Administrativo</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                required
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-small"></span>
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        <div className="login-footer">
          <p className="footer-text">
            Apenas usuários com permissão de root podem acessar este sistema.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;


import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import authService from '../services/authService';
import userService from '../services/userService';
import './AuthPage.css';

const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Verificar se está logado
  React.useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
    setSuccess(false);
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords({
      ...showPasswords,
      [field]: !showPasswords[field],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validações
    if (!formData.currentPassword) {
      setError('Por favor, informe sua senha atual.');
      return;
    }

    if (!formData.newPassword) {
      setError('Por favor, informe a nova senha.');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      setError('A nova senha deve ser diferente da senha atual.');
      return;
    }

    setLoading(true);

    try {
      const result = await userService.changePassword(
        formData.currentPassword,
        formData.newPassword
      );

      if (result.success) {
        setSuccess(true);
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        
        // Redirecionar após 2 segundos
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setError(result.error || 'Erro ao alterar senha. Verifique sua senha atual.');
      }
    } catch (err) {
      setError(err.message || 'Erro ao alterar senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="App">
        <Header />
        <main className="auth-main">
          <div className="container">
            <div className="auth-container">
              <div className="auth-card">
                <div className="auth-success">
                  <div className="success-icon">✓</div>
                  <h1 className="auth-title">Senha Alterada!</h1>
                  <p className="auth-subtitle">
                    Sua senha foi alterada com sucesso. Você será redirecionado em instantes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="App">
      <Header />
      <main className="auth-main">
        <div className="container">
          <div className="auth-container">
            <div className="auth-card">
              <h1 className="auth-title">Trocar Senha</h1>
              <p className="auth-subtitle">
                Altere sua senha para manter sua conta segura
              </p>

              {error && (
                <div className="auth-error">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="auth-form">
                {/* Campo oculto para acessibilidade - requerido pelo navegador */}
                <input
                  type="text"
                  name="username"
                  autoComplete="username"
                  style={{ 
                    position: 'absolute', 
                    left: '-9999px', 
                    width: '1px', 
                    height: '1px',
                    opacity: 0,
                    pointerEvents: 'none'
                  }}
                  tabIndex={-1}
                  aria-hidden="true"
                  readOnly
                  value={authService.getUser()?.email || ''}
                />
                <div className="form-group">
                  <label htmlFor="currentPassword" className="form-label">
                    Senha Atual
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      id="currentPassword"
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Digite sua senha atual"
                      required
                      autoComplete="current-password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => togglePasswordVisibility('current')}
                      aria-label={showPasswords.current ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showPasswords.current ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="newPassword" className="form-label">
                    Nova Senha
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      id="newPassword"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Mínimo 6 caracteres"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => togglePasswordVisibility('new')}
                      aria-label={showPasswords.new ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showPasswords.new ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword" className="form-label">
                    Confirmar Nova Senha
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Digite a nova senha novamente"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => togglePasswordVisibility('confirm')}
                      aria-label={showPasswords.confirm ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showPasswords.confirm ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-block"
                  disabled={loading}
                >
                  {loading ? 'Alterando...' : 'Alterar Senha'}
                </button>
              </form>

              <div className="auth-footer">
                <p>
                  <a href="/" className="form-link">
                    ← Voltar para o início
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ChangePasswordPage;


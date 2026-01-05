import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import authService from '../services/authService';
import './AuthPage.css';

const SignUpPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tipoFornecedor = searchParams.get('tipo') === 'fornecedor';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    phone: '',
    profile: tipoFornecedor ? 'caregiver' : 'caregiver', // Pode ser ajustado conforme necessário
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

  useEffect(() => {
    if (tipoFornecedor) {
      setFormData(prev => ({ ...prev, profile: 'caregiver' }));
    }
  }, [tipoFornecedor]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.password_confirmation) {
      setError('As senhas não coincidem.');
      return;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      // Processar telefone: remover formatação e manter apenas +55 + dígitos
      let phoneValue = null;
      if (formData.phone && formData.phone.trim()) {
        // Garantir que começa com +55 e extrair apenas os dígitos após +55
        const digits = formData.phone.replace(/\+55/g, '').replace(/\D/g, '');
        if (digits.length > 0) {
          phoneValue = `+55${digits}`;
        }
      }

      // Preparar dados para API (formato esperado pelo backend)
      const registerData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        password_confirmation: formData.password_confirmation,
        phone: phoneValue,
        profile: formData.profile || 'caregiver',
      };

      // Remover campos vazios/null
      Object.keys(registerData).forEach(key => {
        if (registerData[key] === null || registerData[key] === '') {
          delete registerData[key];
        }
      });

      await authService.register(registerData);
      // Redirecionar para home ou área logada
      navigate('/');
      // Pequeno delay para garantir que o token foi salvo
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (err) {
      // Exibir mensagem de erro mais detalhada
      const errorMessage = err.message || 'Erro ao fazer cadastro. Tente novamente.';
      setError(errorMessage);
      console.error('Erro no cadastro:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <Header />
      <main className="auth-main">
        <div className="container">
          <div className="auth-container">
            <div className="auth-card">
              <h1 className="auth-title">
                {tipoFornecedor ? 'Cadastro de Fornecedor' : 'Criar Conta'}
              </h1>
              <p className="auth-subtitle">
                {tipoFornecedor
                  ? 'Preencha os dados abaixo para solicitar seu cadastro como fornecedor'
                  : 'Crie sua conta e comece a cuidar de quem você ama'}
              </p>

              {error && (
                <div className="auth-error">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                  <label htmlFor="name" className="form-label">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Seu nome completo"
                    required
                    autoComplete="name"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    E-mail
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="seu@email.com"
                    required
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone" className="form-label">
                    Telefone (opcional)
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="(00) 00000-0000"
                    autoComplete="tel"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password" className="form-label">
                    Senha
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
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
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="password_confirmation" className="form-label">
                    Confirmar Senha
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPasswordConfirmation ? 'text' : 'password'}
                      id="password_confirmation"
                      name="password_confirmation"
                      value={formData.password_confirmation}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Digite a senha novamente"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                      aria-label={showPasswordConfirmation ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showPasswordConfirmation ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-block"
                  disabled={loading}
                >
                  {loading ? 'Cadastrando...' : 'Criar Conta'}
                </button>
              </form>

              <div className="auth-footer">
                <p>
                  Já tem uma conta?{' '}
                  <Link to="/login" className="form-link">
                    Entrar
                  </Link>
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

export default SignUpPage;


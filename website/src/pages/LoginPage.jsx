import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import authService from '../services/authService';
import supplierService from '../services/supplierService';
import './AuthPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
    setLoading(true);

    try {
      await authService.login(formData.email, formData.password);
      
      // Verificar se o usuário é fornecedor aprovado
      let targetPath = redirect || '/';
      
      try {
        const supplierData = await supplierService.getMySupplier();
        if (supplierData.success && supplierData.supplier && supplierData.supplier.status === 'approved') {
          // Se for fornecedor aprovado, redirecionar para o dashboard
          targetPath = '/fornecedor/dashboard';
        }
      } catch (supplierError) {
        // Se não encontrar fornecedor ou der erro, usar o caminho padrão
        console.log('Usuário não é fornecedor ou erro ao verificar:', supplierError);
      }
      
      navigate(targetPath);
      // Pequeno delay para garantir que o token foi salvo
      setTimeout(() => {
        window.location.reload(); // Recarregar para atualizar estado de autenticação
      }, 100);
    } catch (err) {
      setError(err.message || 'Erro ao fazer login. Verifique suas credenciais.');
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
              <h1 className="auth-title">Entrar</h1>
              <p className="auth-subtitle">
                Acesse sua conta para continuar cuidando de quem você ama
              </p>

              {error && (
                <div className="auth-error">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="auth-form">
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
                      placeholder="Sua senha"
                      required
                      autoComplete="current-password"
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

                <div className="form-options">
                  <Link to="/esqueci-senha" className="form-link">
                    Esqueci minha senha
                  </Link>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-block"
                  disabled={loading}
                >
                  {loading ? 'Entrando...' : 'Entrar'}
                </button>
              </form>

              <div className="auth-footer">
                <p>
                  Não tem uma conta?{' '}
                  <Link to="/cadastro" className="form-link">
                    Cadastre-se aqui
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

export default LoginPage;


import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import authService from '../services/authService';
import './AuthPage.css';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      await authService.forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Erro ao solicitar recuperação de senha. Tente novamente.');
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
                  <h1 className="auth-title">E-mail Enviado!</h1>
                  <p className="auth-subtitle">
                    Enviamos um link de recuperação de senha para <strong>{email}</strong>.
                    Verifique sua caixa de entrada e siga as instruções.
                  </p>
                  <Link to="/login" className="btn btn-primary btn-block">
                    Voltar para Login
                  </Link>
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
              <h1 className="auth-title">Esqueci minha Senha</h1>
              <p className="auth-subtitle">
                Digite seu e-mail e enviaremos um link para redefinir sua senha
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input"
                    placeholder="seu@email.com"
                    required
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-block"
                  disabled={loading}
                >
                  {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
                </button>
              </form>

              <div className="auth-footer">
                <p>
                  Lembrou sua senha?{' '}
                  <Link to="/login" className="form-link">
                    Voltar para Login
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

export default ForgotPasswordPage;



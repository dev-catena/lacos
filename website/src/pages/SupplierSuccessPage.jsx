import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './SupplierSuccessPage.css';

const SupplierSuccessPage = () => {
  return (
    <div className="App">
      <Header />
      <main className="supplier-success-main">
        <div className="container">
          <div className="success-container">
            <div className="success-card">
              <div className="success-icon-large">✓</div>
              <h1 className="success-title">Cadastro Enviado com Sucesso!</h1>
              <p className="success-message">
                Seu cadastro como fornecedor foi recebido e está em análise.
              </p>

              <div className="success-info">
                <h3>O que acontece agora?</h3>
                <div className="info-steps">
                  <div className="info-step">
                    <div className="info-step-number">1</div>
                    <div className="info-step-content">
                      <h4>Análise do Cadastro</h4>
                      <p>Nossa equipe analisará suas informações e documentos em até 3 dias úteis.</p>
                    </div>
                  </div>
                  <div className="info-step">
                    <div className="info-step-number">2</div>
                    <div className="info-step-content">
                      <h4>E-mail de Confirmação</h4>
                      <p>Você receberá um e-mail com o resultado da análise e próximos passos.</p>
                    </div>
                  </div>
                  <div className="info-step">
                    <div className="info-step-number">3</div>
                    <div className="info-step-content">
                      <h4>Integração com Gateway</h4>
                      <p>Após aprovação, você receberá instruções para configurar o gateway de pagamento (Stripe).</p>
                    </div>
                  </div>
                  <div className="info-step">
                    <div className="info-step-number">4</div>
                    <div className="info-step-content">
                      <h4>Começar a Vender</h4>
                      <p>Após a configuração, você poderá cadastrar produtos e começar a receber pedidos!</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="success-actions">
                <Link to="/" className="btn btn-primary">
                  Voltar para o Início
                </Link>
                <Link to="/login" className="btn btn-outline">
                  Fazer Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SupplierSuccessPage;


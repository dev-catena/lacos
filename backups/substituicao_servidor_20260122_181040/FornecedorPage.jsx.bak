import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import authService from '../services/authService';
import './FornecedorPage.css';

const FornecedorPage = () => {
  const navigate = useNavigate();
  const user = authService.getUser();
  const isAuthenticated = authService.isAuthenticated();

  const handleCadastroFornecedor = () => {
    if (!isAuthenticated) {
      // Se não estiver logado, mostrar mensagem e redirecionar para cadastro
      if (window.confirm('Para se cadastrar como fornecedor, você precisa ter uma conta. Deseja criar uma conta agora?')) {
        navigate('/cadastro?tipo=fornecedor');
      } else {
        navigate('/login');
      }
    } else {
      // Se estiver logado, redirecionar para cadastro de fornecedor
      navigate('/fornecedor/cadastro');
    }
  };

  return (
    <div className="App">
      <Header />
      <main>
        <section className="fornecedor-hero">
          <div className="container">
            <div className="fornecedor-hero-content">
              <h1 className="fornecedor-title">Quero ser Fornecedor</h1>
              <p className="fornecedor-subtitle">
                Faça parte do ecossistema LaçosApp e conecte-se com famílias que precisam de produtos 
                e serviços para a melhor idade.
              </p>
            </div>
          </div>
        </section>

        <section className="section fornecedor-section">
          <div className="container">
            <div className="fornecedor-content">
              <div className="fornecedor-intro">
                <h2 className="section-title">Seja um Fornecedor LaçosApp</h2>
                <p className="fornecedor-description">
                  O LaçosApp conecta fornecedores de produtos e serviços com famílias que cuidam de idosos. 
                  Se você oferece materiais, suplementos, equipamentos ou serviços voltados ao público da 
                  melhor idade, você pode fazer parte da nossa rede de fornecedores.
                </p>
              </div>

              <div className="fornecedor-benefits">
                <h3 className="benefits-title">O que você pode oferecer:</h3>
                <div className="benefits-grid">
                  <div className="benefit-card">
                    <div className="benefit-icon">💊</div>
                    <h4 className="benefit-card-title">Medicamentos e Suplementos</h4>
                    <p className="benefit-card-text">
                      Ofereça medicamentos, vitaminas e suplementos diretamente para as famílias que precisam.
                    </p>
                  </div>
                  <div className="benefit-card">
                    <div className="benefit-icon">🛒</div>
                    <h4 className="benefit-card-title">Materiais e Equipamentos</h4>
                    <p className="benefit-card-text">
                      Venda equipamentos médicos, produtos de higiene, acessórios e materiais necessários 
                      para o cuidado com idosos.
                    </p>
                  </div>
                  <div className="benefit-card">
                    <div className="benefit-icon">🏥</div>
                    <h4 className="benefit-card-title">Serviços Especializados</h4>
                    <p className="benefit-card-text">
                      Ofereça serviços como fisioterapia, enfermagem domiciliar, nutrição e outros serviços 
                      voltados à melhor idade.
                    </p>
                  </div>
                  <div className="benefit-card">
                    <div className="benefit-icon">📦</div>
                    <h4 className="benefit-card-title">Produtos para o Lar</h4>
                    <p className="benefit-card-text">
                      Venda produtos que facilitam o dia a dia, como dispositivos de segurança, 
                      adaptações para banheiro, entre outros.
                    </p>
                  </div>
                </div>
              </div>

              <div className="fornecedor-process">
                <h3 className="process-title">Como funciona o processo:</h3>
                <div className="process-steps">
                  <div className="process-step">
                    <div className="process-step-number">1</div>
                    <div className="process-step-content">
                      <h4 className="process-step-title">Solicite seu cadastro</h4>
                      <p className="process-step-text">
                        Preencha o formulário de cadastro com informações sobre sua empresa ou você como 
                        fornecedor, incluindo os produtos ou serviços que oferece.
                      </p>
                    </div>
                  </div>
                  <div className="process-step">
                    <div className="process-step-number">2</div>
                    <div className="process-step-content">
                      <h4 className="process-step-title">Aguarde a aprovação</h4>
                      <p className="process-step-text">
                        Nossa equipe analisará seu cadastro e entrará em contato para validar as informações 
                        e aprovar seu perfil como fornecedor.
                      </p>
                    </div>
                  </div>
                  <div className="process-step">
                    <div className="process-step-number">3</div>
                    <div className="process-step-content">
                      <h4 className="process-step-title">Comece a vender</h4>
                      <p className="process-step-text">
                        Após a aprovação, você poderá cadastrar seus produtos e serviços na plataforma e 
                        começar a receber pedidos de famílias que precisam do que você oferece.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="fornecedor-advantages">
                <h3 className="advantages-title">Benefícios de ser fornecedor LaçosApp:</h3>
                <ul className="advantages-list">
                  <li className="advantage-item">
                    <span className="advantage-check">✓</span>
                    <span>Acesso a um público específico e engajado que precisa dos seus produtos e serviços</span>
                  </li>
                  <li className="advantage-item">
                    <span className="advantage-check">✓</span>
                    <span>Plataforma segura e confiável para transações</span>
                  </li>
                  <li className="advantage-item">
                    <span className="advantage-check">✓</span>
                    <span>Ferramentas para gerenciar seus produtos, pedidos e clientes</span>
                  </li>
                  <li className="advantage-item">
                    <span className="advantage-check">✓</span>
                    <span>Suporte da equipe LaçosApp para ajudar no seu crescimento</span>
                  </li>
                  <li className="advantage-item">
                    <span className="advantage-check">✓</span>
                    <span>Oportunidade de fazer parte de um ecossistema focado em cuidado e bem-estar</span>
                  </li>
                </ul>
              </div>

              <div className="fornecedor-cta">
                <h3 className="cta-title">Pronto para começar?</h3>
                <p className="cta-text">
                  Faça parte da rede de fornecedores LaçosApp e ajude famílias a cuidarem melhor de quem amam.
                </p>
                <div className="cta-buttons">
                  {isAuthenticated ? (
                    <button onClick={handleCadastroFornecedor} className="btn btn-primary">
                      Cadastrar como Fornecedor
                    </button>
                  ) : (
                    <>
                      <button onClick={handleCadastroFornecedor} className="btn btn-primary">
                        Criar Conta e Cadastrar como Fornecedor
                      </button>
                      <Link to="/login" className="btn btn-outline">
                        Já tenho conta
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default FornecedorPage;



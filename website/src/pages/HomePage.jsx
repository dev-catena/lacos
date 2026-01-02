import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './HomePage.css';

const HomePage = () => {
  return (
    <div className="App">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="hero">
          <div className="container">
            <div className="hero-content">
              <h1 className="hero-title">
                Cuidado familiar na melhor idade,<br />
                <span className="hero-highlight">sem tirar o idoso de casa</span>
              </h1>
              <p className="hero-subtitle">
                Propicie ao seu querido na melhor idade um cuidado familiar, mantendo o sentimento de estar em casa, 
                oferecendo todos os cuidados com um app que te mantém próximo, em alerta e conectado à equipe de saúde 
                que o assiste, sem retirá-lo do lar.
              </p>
              <div className="hero-buttons">
                <Link to="/cadastro" className="btn btn-primary">
                  Quero cuidar de alguém
                </Link>
                <Link to="/fornecedor" className="btn btn-secondary">
                  Quero ser fornecedor
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Como Funciona */}
        <section id="como-funciona" className="section section-how-it-works">
          <div className="container">
            <h2 className="section-title">Como o LaçosApp Funciona</h2>
            <p className="section-subtitle">
              Em poucos passos, você estará cuidando de quem ama com tecnologia e carinho
            </p>
            <div className="steps-grid">
              <div className="step-card">
                <div className="step-number">1</div>
                <h3 className="step-title">Cadastre seu querido</h3>
                <p className="step-description">
                  Crie o perfil da pessoa que você ama, com informações importantes sobre saúde, 
                  medicamentos e histórico médico.
                </p>
              </div>
              <div className="step-card">
                <div className="step-number">2</div>
                <h3 className="step-title">Convide familiares e amigos</h3>
                <p className="step-description">
                  Una seus parentes e amigos para, juntos, cuidarmos de quem amamos, compartilhando 
                  tarefas e acompanhando de perto o dia a dia.
                </p>
              </div>
              <div className="step-card">
                <div className="step-number">3</div>
                <h3 className="step-title">Conecte à equipe de saúde</h3>
                <p className="step-description">
                  Integre médicos, enfermeiros e profissionais de saúde para um cuidado completo e 
                  coordenado, com compartilhamento seguro do prontuário.
                </p>
              </div>
              <div className="step-card">
                <div className="step-number">4</div>
                <h3 className="step-title">Acompanhe em tempo real</h3>
                <p className="step-description">
                  Receba alertas sobre sinais vitais, avisos de risco de quedas e visualize o 
                  estado de saúde em tempo real, sempre que precisar.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Funcionalidades */}
        <section id="funcionalidades" className="section section-features">
          <div className="container">
            <h2 className="section-title">Funcionalidades em Destaque</h2>
            <p className="section-subtitle">
              Tudo que você precisa para cuidar com segurança e proximidade
            </p>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">📋</div>
                <h3 className="feature-title">Compartilhamento do Prontuário</h3>
                <p className="feature-description">
                  Compartilhe o prontuário médico de forma segura com a equipe de saúde, 
                  mantendo todos informados sobre o histórico e condições de saúde.
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🎥</div>
                <h3 className="feature-title">Gravação e Compartilhamento de Consultas</h3>
                <p className="feature-description">
                  Grave consultas médicas e compartilhe com a família, garantindo que todos 
                  estejam cientes das orientações e tratamentos.
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">💻</div>
                <h3 className="feature-title">Teleconsultas</h3>
                <p className="feature-description">
                  Realize consultas médicas à distância, mantendo o cuidado contínuo sem 
                  precisar sair de casa.
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">💊</div>
                <h3 className="feature-title">Medicamentos e Farmácia Popular</h3>
                <p className="feature-description">
                  Saiba se seus medicamentos estão disponíveis na Farmácia Popular e encontre 
                  as farmácias próximas que os oferecem.
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🔔</div>
                <h3 className="feature-title">Avisos de Medicamentos e Consultas</h3>
                <p className="feature-description">
                  Receba lembretes automáticos sobre horários de medicamentos e consultas, 
                  garantindo que nada seja esquecido.
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">👥</div>
                <h3 className="feature-title">Compartilhamento de Tarefas</h3>
                <p className="feature-description">
                  Organize e compartilhe tarefas de cuidado entre familiares e cuidadores, 
                  mantendo todos coordenados.
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🏥</div>
                <h3 className="feature-title">Integração com Equipe de Saúde</h3>
                <p className="feature-description">
                  Conecte-se com médicos, enfermeiros e profissionais de saúde para um 
                  cuidado coordenado e eficiente.
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">👨‍⚕️</div>
                <h3 className="feature-title">Contratação de Cuidadores</h3>
                <p className="feature-description">
                  Contrate cuidadores profissionais diretamente pelo app, com perfis verificados 
                  e avaliações de outros usuários.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefícios */}
        <section className="section section-benefits">
          <div className="container">
            <h2 className="section-title">Benefícios para Você e Quem Você Ama</h2>
            <div className="benefits-grid">
              <div className="benefit-item">
                <h3 className="benefit-title">Segurança e Tranquilidade</h3>
                <p className="benefit-description">
                  Tenha paz de espírito sabendo que está acompanhando de perto a saúde e o bem-estar 
                  da pessoa querida, com alertas em tempo real.
                </p>
              </div>
              <div className="benefit-item">
                <h3 className="benefit-title">Cuidado no Lar</h3>
                <p className="benefit-description">
                  Mantenha o idoso no próprio lar, com conforto, dignidade e a sensação de estar em casa, 
                  cercado por quem ama.
                </p>
              </div>
              <div className="benefit-item">
                <h3 className="benefit-title">Aproximação Familiar</h3>
                <p className="benefit-description">
                  Una família, amigos e rede de cuidados em um só lugar, fortalecendo os laços e 
                  compartilhando responsabilidades.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="section section-cta">
          <div className="container">
            <div className="cta-content">
              <h2 className="cta-title">Pronto para começar a cuidar?</h2>
              <p className="cta-subtitle">
                Junte-se a milhares de famílias que já confiam no LaçosApp para cuidar de quem amam.
              </p>
              <div className="cta-buttons">
                <Link to="/cadastro" className="btn btn-primary">
                  Começar Agora
                </Link>
                <Link to="/fornecedor" className="btn btn-secondary">
                  Quero ser Fornecedor
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;



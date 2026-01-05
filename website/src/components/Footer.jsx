import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3 className="footer-title">LaçosApp</h3>
            <p className="footer-description">
              Cuidado familiar na melhor idade, sem tirar o idoso de casa.
            </p>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">Links Rápidos</h4>
            <ul className="footer-links">
              <li><Link to="/">Início</Link></li>
              <li><Link to="/#como-funciona">Como Funciona</Link></li>
              <li><Link to="/#funcionalidades">Funcionalidades</Link></li>
              <li><Link to="/fornecedor">Quero ser Fornecedor</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">Conta</h4>
            <ul className="footer-links">
              <li><Link to="/login">Entrar</Link></li>
              <li><Link to="/cadastro">Cadastrar</Link></li>
              <li><Link to="/esqueci-senha">Esqueci a Senha</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">Contato</h4>
            <ul className="footer-links">
              <li><a href="mailto:contato@lacosapp.com">contato@lacosapp.com</a></li>
              <li><a href="https://lacosapp.com" target="_blank" rel="noopener noreferrer">lacosapp.com</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} LaçosApp. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;



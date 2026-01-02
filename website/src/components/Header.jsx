import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import authService from '../services/authService';
import UserMenu from './UserMenu';
import './Header.css';

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    // Verificar se há usuário logado
    const currentUser = authService.getUser();
    setUser(currentUser);
  }, [location]);

  const handleLogout = () => {
    setUser(null);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo">
            <img src="/lacos.svg" alt="LaçosApp" className="logo-img" onError={(e) => { e.target.style.display = 'none'; }} />
            <span className="logo-text">LaçosApp</span>
          </Link>

          <nav className={`nav ${menuOpen ? 'nav-open' : ''}`}>
            <Link 
              to="/" 
              className={`nav-link ${isActive('/') ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              Início
            </Link>
            <Link 
              to="/#como-funciona" 
              className="nav-link"
              onClick={() => setMenuOpen(false)}
            >
              Como Funciona
            </Link>
            <Link 
              to="/#funcionalidades" 
              className="nav-link"
              onClick={() => setMenuOpen(false)}
            >
              Funcionalidades
            </Link>
            <Link 
              to="/fornecedor" 
              className={`nav-link ${isActive('/fornecedor') ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              Quero ser Fornecedor
            </Link>
            {user ? (
              <UserMenu user={user} onLogout={handleLogout} />
            ) : (
              <Link 
                to="/login" 
                className="nav-link btn-nav"
                onClick={() => setMenuOpen(false)}
              >
                Entrar
              </Link>
            )}
          </nav>

          <button 
            className="menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;


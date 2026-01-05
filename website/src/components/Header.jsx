import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import authService from '../services/authService';
import UserMenu from './UserMenu';
import { useSupplier } from '../hooks/useSupplier';
import './Header.css';

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const { isApproved, supplier } = useSupplier();

  useEffect(() => {
    // Verificar se há usuário logado
    const currentUser = authService.getUser();
    setUser(currentUser);
  }, [location]);

  const handleLogout = () => {
    setUser(null);
  };

  const isActive = (path) => location.pathname === path;
  
  // Verificar se é fornecedor logado (aprovado ou pendente)
  const isSupplierLoggedIn = user && supplier;

  return (
    <header className="header">
      <div className="container">
        <div className={`header-content ${isSupplierLoggedIn ? 'supplier-logged' : ''}`}>
          <div className="header-left">
            <Link to="/" className="logo">
              <img src="/lacos.svg" alt="LaçosApp" className="logo-img" onError={(e) => { e.target.style.display = 'none'; }} />
              <span className="logo-text">LaçosApp</span>
            </Link>

            {isSupplierLoggedIn && (
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
              </nav>
            )}
          </div>

          {!isSupplierLoggedIn && (
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
            {!isApproved && (
              <Link 
                to="/fornecedor" 
                className={`nav-link ${isActive('/fornecedor') ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                Quero ser Fornecedor
              </Link>
            )}
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
          )}

          {isSupplierLoggedIn && (
            <div className="header-right">
              <UserMenu user={user} onLogout={handleLogout} />
            </div>
          )}

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


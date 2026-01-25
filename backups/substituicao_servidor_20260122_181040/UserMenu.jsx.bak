import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { useSupplier } from '../hooks/useSupplier';
import './UserMenu.css';

const UserMenu = ({ user, onLogout }) => {
  const { supplier, isApproved } = useSupplier();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    authService.logout();
    if (onLogout) onLogout();
    navigate('/');
    window.location.reload();
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  return (
    <div className="user-menu" ref={menuRef}>
      <button 
        className="user-menu-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Menu do usuário"
      >
        <div className="user-avatar">
          {user?.photo ? (
            <img src={user.photo} alt={user.name} />
          ) : (
            <span className="user-initials">{getInitials(user?.name)}</span>
          )}
        </div>
        <span className="user-name">{user?.name?.split(' ')[0] || 'Usuário'}</span>
        <span className="user-menu-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="user-menu-dropdown">
          <div className="user-menu-header">
            <div className="user-menu-welcome">
              <p className="welcome-text">Bem-vindo(a)!</p>
              <p className="user-email">{user?.email}</p>
            </div>
          </div>
          <div className="user-menu-divider"></div>
          <Link 
            to="/perfil/trocar-senha" 
            className="user-menu-item"
            onClick={() => setIsOpen(false)}
          >
            <span className="menu-icon">🔒</span>
            <span>Trocar Senha</span>
          </Link>
          {supplier && (
            <Link 
              to="/fornecedor/dashboard" 
              className="user-menu-item"
              onClick={() => setIsOpen(false)}
            >
              <span className="menu-icon">🏪</span>
              <span>Painel do Fornecedor</span>
            </Link>
          )}
          {!supplier && (
            <Link 
              to="/fornecedor/cadastro" 
              className="user-menu-item"
              onClick={() => setIsOpen(false)}
            >
              <span className="menu-icon">➕</span>
              <span>Cadastrar como Fornecedor</span>
            </Link>
          )}
          <div className="user-menu-divider"></div>
          <button 
            className="user-menu-item user-menu-logout"
            onClick={handleLogout}
          >
            <span className="menu-icon">🚪</span>
            <span>Sair</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;


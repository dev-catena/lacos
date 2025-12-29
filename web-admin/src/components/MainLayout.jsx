import React from 'react';
import './MainLayout.css';

const MainLayout = ({ activeSection, onSectionChange, children, user, onLogout }) => {
  const sections = [
    { id: 'users', label: '👥 Usuários', icon: '👥' },
    { id: 'doctors', label: '👨‍⚕️ Médicos', icon: '👨‍⚕️' },
    { id: 'plans', label: '📋 Planos', icon: '📋' },
  ];

  return (
    <div className="main-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>Laços</h1>
          <p className="subtitle">Gestão Root</p>
        </div>
        <nav className="sidebar-nav">
          {sections.map((section) => (
            <button
              key={section.id}
              className={`nav-item ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => onSectionChange(section.id)}
            >
              <span className="nav-icon">{section.icon}</span>
              <span className="nav-label">{section.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-name">{user?.name || 'Root'}</span>
            <span className="user-email">{user?.email || ''}</span>
          </div>
          <button className="logout-button" onClick={onLogout}>
            🚪 Sair
          </button>
        </div>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;


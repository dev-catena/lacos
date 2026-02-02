import React from 'react';
import SafeIcon from './SafeIcon';
import './MainLayout.css';

const MainLayout = ({ activeSection, onSectionChange, children, user, onLogout }) => {
  const sections = [
    { id: 'users', label: 'Usuários', icon: 'people' },
    { id: 'doctors', label: 'Médicos', icon: 'medical' },
    { id: 'caregivers', label: 'Cuidadores', icon: 'people' },
    { id: 'plans', label: 'Planos', icon: 'receipt' },
    { id: 'suppliers', label: 'Fornecedores', icon: 'store' },
    { id: 'recording', label: 'Gravação', icon: 'mic' },
    { id: 'devices', label: 'Smartwatch', icon: 'watch' },
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
              <span className="nav-icon">
                <SafeIcon name={section.icon} size={24} color="rgba(255, 255, 255, 0.85)" />
              </span>
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
            <SafeIcon name="logout" size={18} color="rgba(255, 255, 255, 0.85)" style={{ marginRight: '8px' }} />
            Sair
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


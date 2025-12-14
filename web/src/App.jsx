import React, { useState, useEffect } from 'react';
import MainLayout from './components/MainLayout';
import LoginScreen from './components/LoginScreen';
import UsersManagement from './components/UsersManagement';
import DoctorsManagement from './components/DoctorsManagement';
import PlansManagement from './components/PlansManagement';
import authService from './services/authService';
import usersService from './services/usersService';
import './App.css';
import './components/GlobalButtonStyles.css';

function App() {
  const [activeSection, setActiveSection] = useState('plans');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkAuth();
    
    // Configurar callback para quando conta for bloqueada
    usersService.setAccountBlockedCallback(() => {
      handleLogout();
    });
    
    // Verificar autenticação periodicamente (a cada 30 segundos)
    // Isso garante que se o usuário for bloqueado, será desconectado
    const interval = setInterval(() => {
      checkAuth();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, []);

  const checkAuth = async () => {
    try {
      const authenticated = await authService.checkAuth();
      setIsAuthenticated(authenticated);
      setUser(authService.getUser());
    } catch (error) {
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'users':
        return <UsersManagement currentUser={user} onLogout={handleLogout} />;
      case 'doctors':
        return <DoctorsManagement />;
      case 'plans':
        return <PlansManagement />;
      default:
        return <PlansManagement />;
    }
  };

  if (loading) {
    return (
      <div className="App">
        <div className="loading-screen">
          <div className="spinner"></div>
          <p>Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="App">
        <LoginScreen onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <div className="App">
      <MainLayout 
        activeSection={activeSection} 
        onSectionChange={setActiveSection}
        user={user}
        onLogout={handleLogout}
      >
        {renderContent()}
      </MainLayout>
    </div>
  );
}

export default App;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import authService from '../services/authService';
import supplierService from '../services/supplierService';
import ProductsManagement from '../components/ProductsManagement';
import OrdersManagement from '../components/OrdersManagement';
import MessagesManagement from '../components/MessagesManagement';
import './SupplierDashboard.css';

const SupplierDashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('products');
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Verificar autenticação
    if (!authService.isAuthenticated()) {
      navigate('/login?redirect=/fornecedor/dashboard');
      return;
    }

    // Carregar dados do fornecedor
    loadSupplier();
  }, [navigate]);

  const loadSupplier = async () => {
    try {
      setLoading(true);
      const response = await supplierService.getMySupplier();
      
      console.log('📥 Resposta do getMySupplier:', response);
      
      // O backend pode retornar supplier diretamente ou dentro de success
      const supplierData = response.supplier || response;
      
      if (supplierData && supplierData.id) {
        setSupplier(supplierData);
        
        // Verificar se está aprovado
        if (supplierData.status !== 'approved') {
          setError('Seu cadastro ainda está pendente de aprovação. Aguarde a análise da equipe.');
        }
      } else {
        setError('Você ainda não possui cadastro de fornecedor. Faça seu cadastro primeiro.');
      }
    } catch (err) {
      console.error('Erro ao carregar fornecedor:', err);
      
      // Se for erro 404, significa que não tem cadastro
      if (err.message && err.message.includes('404')) {
        setError('Você ainda não possui cadastro de fornecedor. Faça seu cadastro primeiro.');
      } else {
        setError(err.message || 'Erro ao carregar dados do fornecedor');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="App">
        <Header />
        <main className="supplier-dashboard-main">
          <div className="container">
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Carregando...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error && !supplier) {
    return (
      <div className="App">
        <Header />
        <main className="supplier-dashboard-main">
          <div className="container">
            <div className="error-container">
              <div className="error-icon">⚠️</div>
              <h2>{error.includes('não possui cadastro') ? 'Cadastro Não Encontrado' : 'Cadastro Pendente'}</h2>
              <p>{error}</p>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button onClick={() => navigate('/fornecedor/cadastro')} className="btn btn-primary">
                  Fazer Cadastro
                </button>
                <button onClick={() => navigate('/fornecedor')} className="btn btn-outline">
                  Voltar
                </button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Mostrar aviso se estiver pendente, mas ainda permitir acesso limitado
  const isPending = supplier && supplier.status !== 'approved';

  return (
    <div className="App">
      <Header />
      <main className="supplier-dashboard-main">
        <div className="container">
          <div className="supplier-dashboard">
            <aside className="supplier-sidebar">
              <div className="supplier-info">
                <h2>Painel do Fornecedor</h2>
                <div className="supplier-company">
                  <strong>{supplier?.company_name}</strong>
                  <span className={`status-badge status-${supplier?.status}`}>
                    {supplier?.status === 'approved' ? 'Aprovado' : 
                     supplier?.status === 'pending' ? 'Pendente' : 
                     supplier?.status === 'rejected' ? 'Rejeitado' : 'Suspenso'}
                  </span>
                </div>
              </div>

              <nav className="supplier-nav">
                <button
                  className={`nav-item ${activeSection === 'products' ? 'active' : ''}`}
                  onClick={() => setActiveSection('products')}
                >
                  📦 Produtos
                </button>
                <button
                  className={`nav-item ${activeSection === 'orders' ? 'active' : ''}`}
                  onClick={() => setActiveSection('orders')}
                >
                  🛒 Compras/Pedidos
                </button>
                <button
                  className={`nav-item ${activeSection === 'messages' ? 'active' : ''}`}
                  onClick={() => setActiveSection('messages')}
                >
                  💬 Mensagens
                </button>
                <button
                  className={`nav-item ${activeSection === 'settings' ? 'active' : ''}`}
                  onClick={() => setActiveSection('settings')}
                >
                  ⚙️ Configurações
                </button>
              </nav>
            </aside>

            <div className="supplier-content">
              {isPending && (
                <div style={{
                  background: '#fff3cd',
                  border: '1px solid #ffc107',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1.5rem',
                  color: '#856404'
                }}>
                  <strong>⏳ Cadastro Pendente de Aprovação</strong>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
                    Seu cadastro ainda está em análise. Algumas funcionalidades podem estar limitadas até a aprovação.
                  </p>
                </div>
              )}

              {activeSection === 'products' && (
                <div className="section-content">
                  <ProductsManagement />
                </div>
              )}

              {activeSection === 'orders' && (
                <div className="section-content">
                  <OrdersManagement />
                </div>
              )}

              {activeSection === 'messages' && (
                <div className="section-content">
                  <MessagesManagement />
                </div>
              )}

              {activeSection === 'settings' && (
                <div className="section-content">
                  <h1>Configurações</h1>
                  <p>Gerencie as configurações da sua conta de fornecedor</p>
                  {/* Componente de configurações será criado */}
                  <div className="placeholder-content">
                    <p>Funcionalidade de configurações em desenvolvimento...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SupplierDashboard;


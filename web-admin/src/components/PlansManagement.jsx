import React, { useState, useEffect } from 'react';
import SafeIcon from './SafeIcon';
import PlanCard from './PlanCard';
import plansService from '../services/plansService';
import './PlansManagement.css';

const PlansManagement = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingPlan, setEditingPlan] = useState(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await plansService.getAllPlans();
      setPlans(data);
    } catch (err) {
      setError('Erro ao carregar planos. Usando dados padrão.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlan = async (planData) => {
    try {
      setError(null);
      let updatedPlan;

      if (planData.id) {
        // Atualizar plano existente
        updatedPlan = await plansService.updatePlan(planData.id, planData);
      } else {
        // Criar novo plano
        updatedPlan = await plansService.createPlan(planData);
      }

      // Atualizar lista de planos
      setPlans((prevPlans) => {
        if (planData.id) {
          return prevPlans.map((p) => (p.id === planData.id ? updatedPlan : p));
        } else {
          return [...prevPlans, updatedPlan];
        }
      });

      setEditingPlan(null);
    } catch (err) {
      setError(err.message || 'Erro ao salvar plano');
      console.error(err);
    }
  };

  const handleCancelEdit = () => {
    setEditingPlan(null);
    setError(null);
  };

  const handleEditPlan = (plan) => {
    setEditingPlan(plan);
  };

  if (loading) {
    return (
      <div className="plans-management">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Carregando planos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="plans-management">
      <header className="section-header">
        <div>
          <h1>Gestão de Planos</h1>
          <p className="subtitle">
            Configure os planos disponíveis e defina quais funcionalidades cada plano terá acesso.
            Os planos são contratados por usuários com perfil Cuidador/Amigo.
          </p>
        </div>
        <button className="refresh-button" onClick={loadPlans}>
          <SafeIcon name="refresh" size={18} color="#6366f1" style={{ marginRight: '8px' }} />
          Atualizar
        </button>
      </header>

      {error && (
        <div className="error-banner">
          <SafeIcon name="warning" size={20} color="#f59e0b" style={{ marginRight: '8px' }} />
          <span>{error}</span>
        </div>
      )}

      <main className="plans-content">
        <div className="plans-grid">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isEditing={editingPlan?.id === plan.id}
              onEdit={handleEditPlan}
              onSave={handleSavePlan}
              onCancel={handleCancelEdit}
            />
          ))}
        </div>

        <div className="info-box">
          <h3>Informações Importantes</h3>
          <ul>
            <li>
              <strong>Plano Básico:</strong> É o plano padrão atribuído a todos os novos usuários.
            </li>
            <li>
              <strong>Funcionalidades:</strong> Marque as funcionalidades que deseja disponibilizar em cada plano.
            </li>
            <li>
              <strong>Smartwatch, Sensor de Quedas e Câmeras:</strong> Estas funcionalidades podem ser selecionadas, mas ainda não possuem cards implementados na aplicação mobile.
            </li>
            <li>
              <strong>Usuários Cuidador/Amigo:</strong> Apenas usuários com este perfil podem contratar planos.
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default PlansManagement;


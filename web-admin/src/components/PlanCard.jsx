import React, { useState, useEffect } from 'react';
import plansService from '../services/plansService';
import './PlanCard.css';

const PlanCard = ({ plan, isEditing, onEdit, onSave, onCancel }) => {
  const [localPlan, setLocalPlan] = useState(plan);
  const [features, setFeatures] = useState([]);

  useEffect(() => {
    setLocalPlan(plan);
    setFeatures(plansService.getAllFeatures());
  }, [plan]);

  const handleFeatureToggle = (featureKey) => {
    setLocalPlan((prev) => ({
      ...prev,
      features: {
        ...prev.features,
        [featureKey]: !prev.features[featureKey],
      },
    }));
  };

  const handleSave = () => {
    onSave(localPlan);
  };

  const handleCancel = () => {
    setLocalPlan(plan);
    onCancel();
  };

  const getPlanColor = (planName) => {
    const colors = {
      básico: '#3b82f6',
      intermediário: '#10b981',
      avançado: '#f59e0b',
      pleno: '#8b5cf6',
    };
    return colors[planName.toLowerCase()] || '#6366f1';
  };

  const planColor = getPlanColor(localPlan.name);

  return (
    <div className={`plan-card ${isEditing ? 'editing' : ''} ${localPlan.isDefault ? 'default-plan' : ''}`}>
      <div className="plan-card-header" style={{ borderTopColor: planColor }}>
        <div className="plan-title-section">
          <h2>{localPlan.name}</h2>
          {localPlan.isDefault && (
            <span className="default-badge">Padrão</span>
          )}
        </div>
        {!isEditing && (
          <button
            className="edit-button"
            onClick={() => onEdit(localPlan)}
            aria-label="Editar plano"
          >
            ✏️ Editar
          </button>
        )}
      </div>

      <div className="plan-card-body">
        {isEditing ? (
          <div className="editing-mode">
            <div className="features-list">
              <h3>Funcionalidades Disponíveis</h3>
              <p className="features-description">
                Selecione as funcionalidades que estarão disponíveis neste plano:
              </p>
              <div className="features-grid">
                {features.map((feature) => (
                  <label key={feature.key} className="feature-checkbox">
                    <input
                      type="checkbox"
                      checked={localPlan.features[feature.key] || false}
                      onChange={() => handleFeatureToggle(feature.key)}
                    />
                    <div className="feature-info">
                      <span className="feature-name">{feature.label}</span>
                      <span className="feature-description">{feature.description}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="action-buttons">
              <button className="cancel-button" onClick={handleCancel}>
                Cancelar
              </button>
              <button className="save-button" onClick={handleSave} style={{ backgroundColor: planColor }}>
                Salvar Alterações
              </button>
            </div>
          </div>
        ) : (
          <div className="view-mode">
            <div className="features-summary">
              <h3>Funcionalidades Ativas</h3>
              <div className="active-features">
                {features
                  .filter((f) => localPlan.features[f.key])
                  .map((feature) => (
                    <span key={feature.key} className="active-feature-badge">
                      {feature.label}
                    </span>
                  ))}
                {features.filter((f) => localPlan.features[f.key]).length === 0 && (
                  <span className="no-features">Nenhuma funcionalidade ativa</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlanCard;


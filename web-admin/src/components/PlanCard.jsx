import React, { useState, useEffect } from 'react';
import SafeIcon from './SafeIcon';
import plansService from '../services/plansService';
import './PlanCard.css';

function normalizeFeatures(raw) {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }
  if (typeof raw === 'object') return { ...raw };
  return {};
}

const PlanCard = ({ plan, isEditing, onEdit, onSave, onCancel }) => {
  const [localPlan, setLocalPlan] = useState(plan);
  const [features, setFeatures] = useState(() => plansService.getAllFeatures());

  useEffect(() => {
    setLocalPlan({
      ...plan,
      features: normalizeFeatures(plan?.features),
    });
    setFeatures(plansService.getAllFeatures());
  }, [plan]);

  const handleFeatureToggle = (featureKey) => {
    setLocalPlan((prev) => {
      const current = normalizeFeatures(prev.features);
      return {
        ...prev,
        features: {
          ...current,
          [featureKey]: !current[featureKey],
        },
      };
    });
  };

  const handleSave = () => {
    const current = normalizeFeatures(localPlan.features);
    const merged = {};
    features.forEach((f) => {
      merged[f.key] = !!current[f.key];
    });
    onSave({ ...localPlan, features: merged });
  };

  const handleCancel = () => {
    setLocalPlan({
      ...plan,
      features: normalizeFeatures(plan?.features),
    });
    onCancel();
  };

  const getPlanColor = (planName) => {
    const colors = {
      básico: '#3b82f6',
      intermediário: '#10b981',
      avançado: '#f59e0b',
      pleno: '#8b5cf6',
      kids: '#8b5cf6',
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
            <SafeIcon name="edit" size={18} color="white" style={{ marginRight: '6px' }} />
            Editar
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
                      checked={!!normalizeFeatures(localPlan.features)[feature.key]}
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
                  .filter((f) => !!normalizeFeatures(localPlan.features)[f.key])
                  .map((feature) => (
                    <span key={feature.key} className="active-feature-badge">
                      {feature.label}
                    </span>
                  ))}
                {features.filter((f) => !!normalizeFeatures(localPlan.features)[f.key]).length === 0 && (
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


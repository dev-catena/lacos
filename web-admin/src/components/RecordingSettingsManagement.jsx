import React, { useState, useEffect } from 'react';
import systemSettingsService from '../services/systemSettingsService';
import './RecordingSettingsManagement.css';

const RecordingSettingsManagement = () => {
  const [settings, setSettings] = useState({
    recording_start_before_minutes: 15,
    recording_stop_after_end_minutes: 15,
    recording_max_duration_after_end_minutes: 30,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const result = await systemSettingsService.getRecordingSettings();
      
      if (result.success && result.data) {
        setSettings(result.data);
      } else {
        setMessage({ type: 'error', text: result.error || 'Erro ao carregar configurações' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao carregar configurações' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    const numValue = parseInt(value) || 0;
    if (numValue < 0) return; // Não permitir valores negativos
    
    setSettings(prev => ({
      ...prev,
      [key]: numValue,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });

      const result = await systemSettingsService.updateRecordingSettings(settings);

      if (result.success) {
        setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
        // Recarregar para garantir sincronização
        await loadSettings();
      } else {
        setMessage({ type: 'error', text: result.error || 'Erro ao salvar configurações' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao salvar configurações' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="recording-settings">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="recording-settings">
      <div className="recording-settings-header">
        <h1>Configurações de Gravação de Áudio</h1>
        <p className="subtitle">
          Configure os parâmetros de tempo para gravação de áudio durante consultas médicas
        </p>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="settings-container">
        <div className="setting-card">
          <div className="setting-header">
            <h3>Minutos Antes da Consulta</h3>
            <span className="setting-key">recording_start_before_minutes</span>
          </div>
          <p className="setting-description">
            Quantos minutos antes do horário da consulta o paciente pode iniciar a gravação.
          </p>
          <div className="setting-input-group">
            <input
              type="number"
              min="0"
              value={settings.recording_start_before_minutes}
              onChange={(e) => handleChange('recording_start_before_minutes', e.target.value)}
              className="setting-input"
            />
            <span className="setting-unit">minutos</span>
          </div>
        </div>

        <div className="setting-card">
          <div className="setting-header">
            <h3>Limite para Iniciar Gravação</h3>
            <span className="setting-key">recording_stop_after_end_minutes</span>
          </div>
          <p className="setting-description">
            Quantos minutos após o fim previsto da consulta o sistema para de permitir iniciar novas gravações.
          </p>
          <div className="setting-input-group">
            <input
              type="number"
              min="0"
              value={settings.recording_stop_after_end_minutes}
              onChange={(e) => handleChange('recording_stop_after_end_minutes', e.target.value)}
              className="setting-input"
            />
            <span className="setting-unit">minutos</span>
          </div>
        </div>

        <div className="setting-card">
          <div className="setting-header">
            <h3>Duração Máxima Após Fim</h3>
            <span className="setting-key">recording_max_duration_after_end_minutes</span>
          </div>
          <p className="setting-description">
            Se a gravação foi iniciada antes do limite, ela pode continuar até quantos minutos após o fim previsto da consulta.
          </p>
          <div className="setting-input-group">
            <input
              type="number"
              min="0"
              value={settings.recording_max_duration_after_end_minutes}
              onChange={(e) => handleChange('recording_max_duration_after_end_minutes', e.target.value)}
              className="setting-input"
            />
            <span className="setting-unit">minutos</span>
          </div>
        </div>
      </div>

      <div className="settings-actions">
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="save-button"
        >
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </button>
        <button 
          onClick={loadSettings} 
          disabled={saving}
          className="reload-button"
        >
          Recarregar
        </button>
      </div>

      <div className="info-box">
        <h4>ℹ️ Como Funciona</h4>
        <ul>
          <li>
            <strong>Minutos Antes:</strong> O botão de gravação aparece X minutos antes do horário da consulta.
          </li>
          <li>
            <strong>Limite para Iniciar:</strong> Após Y minutos do fim da consulta, não é mais possível iniciar uma nova gravação.
          </li>
          <li>
            <strong>Duração Máxima:</strong> Se a gravação foi iniciada antes do limite, ela pode continuar até Z minutos após o fim, mesmo que o usuário não finalize manualmente.
          </li>
          <li>
            <strong>Retomar Gravação:</strong> Após finalizar uma gravação, o usuário pode retomá-la até o limite de duração máxima.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default RecordingSettingsManagement;


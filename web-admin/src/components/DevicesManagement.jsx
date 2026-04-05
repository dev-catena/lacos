import React, { useState, useEffect } from 'react';
import SafeIcon from './SafeIcon';
import devicesService from '../services/devicesService';
import './DevicesManagement.css';

const DevicesManagement = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    nickname: '',
    type: 'smartwatch',
    identifier: '',
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await devicesService.getAllDevices();
      setDevices(Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMessage = err.message || 'Erro ao carregar dispositivos.';
      setError(errorMessage);
      console.error('Erro detalhado:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDevice = () => {
    setFormData({
      nickname: '',
      type: 'smartwatch',
      identifier: '',
    });
    setFormErrors({});
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setFormData({
      nickname: '',
      type: 'smartwatch',
      identifier: '',
    });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.nickname.trim()) {
      errors.nickname = 'Apelido é obrigatório';
    }
    
    if (!formData.type) {
      errors.type = 'Tipo é obrigatório';
    }
    
    if (!formData.identifier.trim()) {
      errors.identifier = 'Identificador é obrigatório';
    } else if (!/^\d+$/.test(formData.identifier.trim())) {
      errors.identifier = 'Identificador deve ser um número';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setError(null);
      await devicesService.createDevice({
        nickname: formData.nickname.trim(),
        type: formData.type,
        identifier: formData.identifier.trim(),
      });
      
      handleCloseModal();
      await loadDevices();
    } catch (err) {
      setError(err.message || 'Erro ao criar dispositivo');
      console.error('Erro ao criar dispositivo:', err);
    }
  };

  const handleDeleteDevice = async (deviceId) => {
    const device = devices.find(d => d.id === deviceId);
    const deviceName = device?.nickname || 'este dispositivo';
    
    if (!window.confirm(`Tem certeza que deseja excluir ${deviceName}?`)) {
      return;
    }

    try {
      setError(null);
      await devicesService.deleteDevice(deviceId);
      await loadDevices();
    } catch (err) {
      setError(err.message || 'Erro ao excluir dispositivo');
      console.error('Erro ao excluir dispositivo:', err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getTypeLabel = (type) => {
    const labels = {
      smartwatch: 'Smartwatch',
      sensor: 'Sensor',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="devices-management">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Carregando dispositivos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="devices-management">
      <header className="section-header">
        <div>
          <h1>Gestão de Dispositivos</h1>
          <p className="subtitle">
            Gerencie os dispositivos registrados (smartwatch e sensores). O identificador vincula leituras automáticas ao dispositivo.
          </p>
        </div>
        <button className="refresh-button" onClick={loadDevices}>
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

      <div className="devices-content">
        <div className="devices-header">
          <h2>Dispositivos Registrados</h2>
          <button className="add-device-button" onClick={handleAddDevice}>
            <SafeIcon name="add" size={18} color="white" style={{ marginRight: '8px' }} />
            Incluir Dispositivo
          </button>
        </div>

        {devices.length === 0 ? (
          <div className="empty-state">
            <SafeIcon name="watch" size={64} color="#d1d5db" />
            <p>Nenhum dispositivo registrado</p>
            <button className="add-device-button" onClick={handleAddDevice}>
              <SafeIcon name="add" size={18} color="white" style={{ marginRight: '8px' }} />
              Incluir Primeiro Dispositivo
            </button>
          </div>
        ) : (
          <div className="devices-table-container">
            <table className="devices-table">
              <thead>
                <tr>
                  <th>Email do Admin</th>
                  <th>Grupo</th>
                  <th>Nome</th>
                  <th>Tipo</th>
                  <th>Identificador</th>
                  <th>Data de Inclusão</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((device) => (
                  <tr key={device.id}>
                    <td>
                      {device.user_email || 'N/A'}
                    </td>
                    <td>
                      {device.group_name || 'N/A'}
                    </td>
                    <td>
                      <strong>{device.nickname}</strong>
                    </td>
                    <td>
                      <span className={`type-badge type-${device.type}`}>
                        {getTypeLabel(device.type)}
                      </span>
                    </td>
                    <td>
                      <code className="identifier-code">{device.identifier}</code>
                    </td>
                    <td>{formatDate(device.created_at)}</td>
                    <td>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteDevice(device.id)}
                        title="Excluir dispositivo"
                      >
                        <SafeIcon name="trash" size={18} color="white" style={{ marginRight: '6px' }} />
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Adicionar Dispositivo */}
      {showAddModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Incluir Dispositivo</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                <SafeIcon name="close" size={24} color="#6b7280" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="device-form">
              <div className="form-group">
                <label htmlFor="nickname">
                  Apelido <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="nickname"
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                  placeholder="Ex: Smartwatch João"
                  className={formErrors.nickname ? 'error' : ''}
                />
                {formErrors.nickname && (
                  <span className="error-message">{formErrors.nickname}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="type">
                  Tipo <span className="required">*</span>
                </label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className={formErrors.type ? 'error' : ''}
                >
                  <option value="smartwatch">Smartwatch</option>
                  <option value="sensor">Sensor</option>
                </select>
                {formErrors.type && (
                  <span className="error-message">{formErrors.type}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="identifier">
                  Identificador <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="identifier"
                  value={formData.identifier}
                  onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                  placeholder="Número único do dispositivo"
                  className={formErrors.identifier ? 'error' : ''}
                />
                <small className="form-hint">
                  Número que será usado para vincular leituras automáticas de sinais vitais a este dispositivo.
                </small>
                {formErrors.identifier && (
                  <span className="error-message">{formErrors.identifier}</span>
                )}
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-button" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="submit-button">
                  <SafeIcon name="checkmark" size={18} color="white" style={{ marginRight: '8px' }} />
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DevicesManagement;


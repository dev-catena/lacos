import React, { useState, useEffect, useMemo, useRef } from 'react';
import SafeIcon from './SafeIcon';
import devicesService from '../services/devicesService';
import './DevicesManagement.css';

const DevicesManagement = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [assignmentGroups, setAssignmentGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsError, setGroupsError] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [thalamusDevices, setThalamusDevices] = useState([]);
  const [thalamusLoading, setThalamusLoading] = useState(false);
  const [thalamusError, setThalamusError] = useState(null);
  const [thalamusSelectIndex, setThalamusSelectIndex] = useState('');
  /** null = inclusão; número = edição */
  const [editingDeviceId, setEditingDeviceId] = useState(null);
  const [formData, setFormData] = useState({
    nickname: '',
    type: 'smartwatch',
    identifier: '',
    status: '',
    parser_model: '',
  });
  const [formErrors, setFormErrors] = useState({});

  const selectedGroup = useMemo(() => {
    if (!selectedGroupId) return null;
    return assignmentGroups.find((g) => String(g.id) === String(selectedGroupId)) || null;
  }, [assignmentGroups, selectedGroupId]);

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

  const loadAssignmentGroups = async () => {
    try {
      setGroupsLoading(true);
      setGroupsError(null);
      const list = await devicesService.getDeviceAssignmentGroups();
      setAssignmentGroups(Array.isArray(list) ? list : []);
    } catch (err) {
      setGroupsError(err.message || 'Não foi possível carregar os grupos.');
      setAssignmentGroups([]);
    } finally {
      setGroupsLoading(false);
    }
  };

  const loadThalamusDevices = async () => {
    try {
      setThalamusLoading(true);
      setThalamusError(null);
      const list = await devicesService.getThalamusAuthorizedDevices();
      const normalized = Array.isArray(list) ? list : [];
      setThalamusDevices(normalized);
      return normalized;
    } catch (err) {
      setThalamusError(err.message || 'Não foi possível carregar os relógios da API Thalamus.');
      setThalamusDevices([]);
      return [];
    } finally {
      setThalamusLoading(false);
    }
  };

  /** Evita repreencher o select Thalamus após o usuário limpar na edição. */
  const thalamusEditPrefilledRef = useRef(false);

  useEffect(() => {
    if (!editingDeviceId || !thalamusDevices.length || thalamusEditPrefilledRef.current) {
      return;
    }
    const device = devices.find((d) => d.id === editingDeviceId);
    if (!device || device.type !== 'smartwatch') {
      return;
    }
    const imei = String(device.identifier || '');
    if (!imei) {
      return;
    }
    const idx = thalamusDevices.findIndex(
      (d) => String(d.imei || d.identifier || '') === imei
    );
    if (idx >= 0) {
      setThalamusSelectIndex(String(idx));
      thalamusEditPrefilledRef.current = true;
    }
  }, [editingDeviceId, thalamusDevices, devices]);

  const handleAddDevice = () => {
    thalamusEditPrefilledRef.current = false;
    setEditingDeviceId(null);
    setFormData({
      nickname: '',
      type: 'smartwatch',
      identifier: '',
      status: '',
      parser_model: '',
    });
    setSelectedGroupId('');
    setThalamusSelectIndex('');
    setFormErrors({});
    setGroupsError(null);
    setThalamusError(null);
    setShowAddModal(true);
    loadAssignmentGroups();
    loadThalamusDevices();
  };

  const handleCloseModal = () => {
    thalamusEditPrefilledRef.current = false;
    setShowAddModal(false);
    setEditingDeviceId(null);
    setFormData({
      nickname: '',
      type: 'smartwatch',
      identifier: '',
      status: '',
      parser_model: '',
    });
    setSelectedGroupId('');
    setThalamusSelectIndex('');
    setGroupsError(null);
    setThalamusError(null);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};

    if (!selectedGroupId) {
      errors.group_id = 'Selecione o grupo de cuidado';
    }

    if (!formData.nickname.trim()) {
      errors.nickname = 'Nome do dispositivo é obrigatório';
    }

    if (!formData.type) {
      errors.type = 'Tipo é obrigatório';
    }

    if (formData.type === 'smartwatch' && thalamusSelectIndex === '' && editingDeviceId == null) {
      errors.thalamus = 'Selecione o relógio autorizado na API Thalamus';
    }

    if (!formData.identifier.trim()) {
      errors.identifier = 'Identificador (IMEI) é obrigatório';
    } else if (formData.identifier.trim().length > 128) {
      errors.identifier = 'Identificador deve ter no máximo 128 caracteres';
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
      const payload = {
        group_id: parseInt(selectedGroupId, 10),
        nickname: formData.nickname.trim(),
        type: formData.type,
        identifier: formData.identifier.trim(),
      };
      if (formData.status.trim()) {
        payload.status = formData.status.trim();
      }
      if (formData.parser_model.trim()) {
        payload.parser_model = formData.parser_model.trim();
      }

      if (formData.type === 'smartwatch' && thalamusSelectIndex !== '') {
        const d = thalamusDevices[parseInt(thalamusSelectIndex, 10)];
        const tid = d && (d.thalamus_id != null ? d.thalamus_id : d.id);
        if (tid != null) {
          payload.thalamus_device_id = tid;
        }
      }

      if (editingDeviceId != null) {
        await devicesService.updateDevice(editingDeviceId, payload);
      } else {
        await devicesService.createDevice(payload);
      }

      handleCloseModal();
      await loadDevices();
    } catch (err) {
      const msg = err.message || 'Erro ao criar dispositivo';
      setError(msg);
      console.error('Erro ao criar dispositivo:', err);
    }
  };

  const handleRowClickEdit = (device) => {
    thalamusEditPrefilledRef.current = false;
    setEditingDeviceId(device.id);
    setFormData({
      nickname: device.nickname || '',
      type: device.type || 'smartwatch',
      identifier: device.identifier || '',
      status: device.status != null && device.status !== '' ? String(device.status) : '',
      parser_model:
        device.parser_model != null && device.parser_model !== ''
          ? String(device.parser_model)
          : '',
    });
    setSelectedGroupId(device.group_id != null ? String(device.group_id) : '');
    setThalamusSelectIndex('');
    setFormErrors({});
    setGroupsError(null);
    setThalamusError(null);
    setError(null);
    setShowAddModal(true);
    loadAssignmentGroups();
    loadThalamusDevices();
  };

  const handleDeleteDevice = async (deviceId) => {
    const device = devices.find((d) => d.id === deviceId);
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
            Cada linha é a associação entre um dispositivo (smartwatch da API Thalamus ou sensor) e um grupo do Laços,
            com e-mail do administrador do grupo e dados do paciente acompanhado. <strong>Linhas de Smartwatch:</strong>{' '}
            clique na linha para editar. Ao incluir, escolha o grupo, confira admin/paciente e selecione o relógio na
            Thalamus; o backend pode registrar também o vínculo na API Thalamus se estiver configurado no servidor.
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
                  <th>E-mail admin (grupo)</th>
                  <th>Paciente (grupo)</th>
                  <th>Grupo</th>
                  <th>Nome (dispositivo)</th>
                  <th>Tipo</th>
                  <th>Identificador</th>
                  <th>Status</th>
                  <th>Modelo</th>
                  <th>Data de Inclusão</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((device) => (
                  <tr
                    key={device.id}
                    className={`devices-table__row ${device.type === 'smartwatch' ? 'devices-table__row--clickable' : ''}`}
                    onClick={
                      device.type === 'smartwatch' ? () => handleRowClickEdit(device) : undefined
                    }
                    role={device.type === 'smartwatch' ? 'button' : undefined}
                    tabIndex={device.type === 'smartwatch' ? 0 : undefined}
                    onKeyDown={
                      device.type === 'smartwatch'
                        ? (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleRowClickEdit(device);
                            }
                          }
                        : undefined
                    }
                  >
                    <td>{device.admin_email || '—'}</td>
                    <td>{device.patient_name || '—'}</td>
                    <td>{device.group_name || '—'}</td>
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
                    <td>{device.status ?? '—'}</td>
                    <td>{device.parser_model ?? '—'}</td>
                    <td>{formatDate(device.created_at)}</td>
                    <td>
                      <button
                        type="button"
                        className="delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDevice(device.id);
                        }}
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

      {showAddModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content modal-content-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingDeviceId != null ? 'Editar dispositivo' : 'Vincular dispositivo ao grupo'}</h2>
              <button type="button" className="modal-close" onClick={handleCloseModal}>
                <SafeIcon name="close" size={24} color="#6b7280" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="device-form">
              <div className="form-group">
                <label htmlFor="group-select">
                  Grupo <span className="required">*</span>
                </label>
                {groupsLoading && <p className="form-hint">Carregando grupos…</p>}
                {groupsError && (
                  <p className="error-message" role="alert">
                    {groupsError}
                  </p>
                )}
                <select
                  id="group-select"
                  value={selectedGroupId}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSelectedGroupId(v);
                    setThalamusSelectIndex('');
                  }}
                  className={formErrors.group_id ? 'error' : ''}
                  disabled={groupsLoading || assignmentGroups.length === 0}
                >
                  <option value="">
                    {assignmentGroups.length === 0 && !groupsLoading
                      ? 'Nenhum grupo disponível'
                      : 'Selecione o grupo'}
                  </option>
                  {assignmentGroups.map((g) => (
                    <option key={g.id} value={String(g.id)}>
                      {g.name} (ID {g.id})
                    </option>
                  ))}
                </select>
                {formErrors.group_id && (
                  <span className="error-message">{formErrors.group_id}</span>
                )}
              </div>

              {selectedGroup && (
                <div className="device-assignment-info">
                  <p>
                    <strong>Administrador do grupo:</strong>{' '}
                    {selectedGroup.admin_name || '—'}{' '}
                    {selectedGroup.admin_email ? `· ${selectedGroup.admin_email}` : ''}
                  </p>
                  <p>
                    <strong>Paciente acompanhado:</strong> {selectedGroup.patient_name || '—'}
                  </p>
                  {selectedGroup.thalamus_group_external_id && (
                    <p className="form-hint">
                      ID do grupo na Thalamus: {selectedGroup.thalamus_group_external_id}
                    </p>
                  )}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="type">
                  Tipo <span className="required">*</span>
                </label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => {
                    const type = e.target.value;
                    setFormData({
                      ...formData,
                      type,
                      ...(type !== 'smartwatch' ? { status: '', parser_model: '' } : {}),
                    });
                    if (type !== 'smartwatch') {
                      setThalamusSelectIndex('');
                    }
                  }}
                  className={formErrors.type ? 'error' : ''}
                >
                  <option value="smartwatch">Smartwatch (API Thalamus)</option>
                  <option value="sensor">Sensor</option>
                </select>
                {formErrors.type && (
                  <span className="error-message">{formErrors.type}</span>
                )}
              </div>

              {formData.type === 'smartwatch' && (
                <div className="form-group">
                  <label htmlFor="thalamus-device">
                    Relógio autorizado (API Thalamus) <span className="required">*</span>
                  </label>
                  {thalamusLoading && (
                    <p className="form-hint">Carregando relógios autorizados…</p>
                  )}
                  {thalamusError && (
                    <p className="error-message" role="alert">
                      {thalamusError}
                    </p>
                  )}
                  <select
                    id="thalamus-device"
                    value={thalamusSelectIndex}
                    onChange={(e) => {
                      const idx = e.target.value;
                      setThalamusSelectIndex(idx);
                      if (idx === '') {
                        return;
                      }
                      const d = thalamusDevices[parseInt(idx, 10)];
                      if (!d) {
                        return;
                      }
                      setFormData((prev) => ({
                        ...prev,
                        nickname: d.nickname || d.description || '',
                        identifier: d.identifier || d.imei || '',
                        status: d.status != null ? String(d.status) : '',
                        parser_model:
                          d.parser_model != null
                            ? String(d.parser_model)
                            : d.modelo != null
                              ? String(d.modelo)
                              : '',
                      }));
                    }}
                    disabled={
                      thalamusLoading ||
                      thalamusDevices.length === 0 ||
                      !selectedGroupId
                    }
                    className={formErrors.thalamus ? 'error' : ''}
                  >
                    <option value="">
                      {!selectedGroupId
                        ? 'Primeiro selecione um grupo'
                        : thalamusDevices.length === 0 && !thalamusLoading
                          ? 'Nenhum relógio na API'
                          : 'Selecione o relógio'}
                    </option>
                    {thalamusDevices.map((d, i) => {
                      const label =
                        d.description ||
                        d.nickname ||
                        d.imei ||
                        d.identifier ||
                        `Dispositivo ${i + 1}`;
                      return (
                        <option key={`${d.imei || d.identifier || i}-${i}`} value={String(i)}>
                          {label}
                          {d.imei || d.identifier ? ` (${d.imei || d.identifier})` : ''}
                        </option>
                      );
                    })}
                  </select>
                  {formErrors.thalamus && (
                    <span className="error-message">{formErrors.thalamus}</span>
                  )}
                  <small className="form-hint">
                    Dados da lista oficial Thalamus. O salvamento envia o ID do dispositivo para associar ao grupo na
                    API quando o servidor estiver configurado (variáveis THALAMUS_SW_ASSOCIATE_*).
                    {editingDeviceId != null &&
                      ' Na edição, trocar o relógio aqui é opcional; deixe como está se só for alterar nome ou grupo.'}
                  </small>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="nickname">
                  Nome do dispositivo <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="nickname"
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                  placeholder="Descrição / apelido (ex.: vindo da Thalamus)"
                  className={formErrors.nickname ? 'error' : ''}
                />
                {formErrors.nickname && (
                  <span className="error-message">{formErrors.nickname}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="identifier">
                  Identificador (IMEI) <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="identifier"
                  value={formData.identifier}
                  onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                  placeholder="IMEI do smartwatch ou código do sensor"
                  className={formErrors.identifier ? 'error' : ''}
                />
                <small className="form-hint">
                  Para smartwatch, preenchido automaticamente ao escolher o item da Thalamus.
                </small>
                {formErrors.identifier && (
                  <span className="error-message">{formErrors.identifier}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="status">Status</label>
                <input
                  type="text"
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  placeholder="Ex.: ACTIVE (Thalamus)"
                />
              </div>

              <div className="form-group">
                <label htmlFor="parser_model">Modelo</label>
                <input
                  type="text"
                  id="parser_model"
                  value={formData.parser_model}
                  onChange={(e) => setFormData({ ...formData, parser_model: e.target.value })}
                  placeholder="parserModel da API"
                />
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-button" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="submit-button">
                  <SafeIcon name="checkmark" size={18} color="white" style={{ marginRight: '8px' }} />
                  {editingDeviceId != null ? 'Salvar alterações' : 'Salvar vínculo'}
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

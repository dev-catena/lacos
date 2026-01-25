import React, { useState, useEffect } from 'react';
import SafeIcon from './SafeIcon';
import doctorsService from '../services/doctorsService';
import './DoctorsManagement.css';

const DoctorsManagement = () => {
  const [doctors, setDoctors] = useState([]);
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // pending, approved
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    cpf: '',
    crm: '',
    medical_specialty_id: '',
  });
  const [specialties, setSpecialties] = useState([]);
  const [loadingSpecialties, setLoadingSpecialties] = useState(false);

  const formatCrmDisplay = (crm) => {
    if (!crm) return 'N/A';
    const s = String(crm).trim().toUpperCase();
    // tentar normalizar para "123456/UF"
    let m = s.match(/\b([A-Z]{2})\b\s*[-\/ ]\s*(\d{1,12})\b/);
    if (m) return `${m[2]}/${m[1]}`;
    m = s.match(/\b(\d{1,12})\b\s*[-\/ ]\s*\b([A-Z]{2})\b/);
    if (m) return `${m[1]}/${m[2]}`;
    return crm;
  };

  const formatCpfDisplay = (cpf) => {
    if (!cpf) return 'N/A';
    // Remove tudo que não é número
    const numbers = String(cpf).replace(/\D/g, '');
    // Se tiver 11 dígitos, formata como CPF: 000.000.000-00
    if (numbers.length === 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    // Caso contrário, retorna como está
    return cpf;
  };

  useEffect(() => {
    loadAllDoctors();
    loadSpecialties();
  }, []);

  const loadSpecialties = async () => {
    try {
      setLoadingSpecialties(true);
      const { API_BASE_URL } = require('../config/api');
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/medical-specialties`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (response.ok) {
        const text = await response.text();
        // Limpar texto antes do JSON se necessário
        const firstBrace = text.indexOf('[');
        const firstCurly = text.indexOf('{');
        const startIndex = firstBrace !== -1 && firstCurly !== -1
          ? Math.min(firstBrace, firstCurly)
          : firstBrace !== -1 ? firstBrace : firstCurly;
        
        const cleanedText = startIndex > 0 ? text.substring(startIndex) : text;
        const data = JSON.parse(cleanedText);
        
        // A resposta pode vir como { data: [...] } ou como array direto
        const specialtiesList = Array.isArray(data) ? data : (data.data || []);
        setSpecialties(specialtiesList.sort((a, b) => a.name.localeCompare(b.name)));
      }
    } catch (err) {
      console.error('Erro ao carregar especialidades:', err);
    } finally {
      setLoadingSpecialties(false);
    }
  };

  // Carregar dados quando mudar de aba
  useEffect(() => {
    if (!loading) {
      loadDoctorsForTab();
    }
  }, [activeTab]);

  // Carregar todos os dados na montagem para ter os contadores corretos
  const loadAllDoctors = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Carregar pendentes e todos os médicos em paralelo
      const [pendingData, allDoctorsData] = await Promise.all([
        doctorsService.getPendingDoctors().catch(() => []),
        doctorsService.getAllDoctors().catch(() => [])
      ]);

      setPendingDoctors(Array.isArray(pendingData) ? pendingData : (pendingData.data || pendingData.items || []));
      setDoctors(Array.isArray(allDoctorsData) ? allDoctorsData : (allDoctorsData.data || allDoctorsData.items || []));
    } catch (err) {
      const errorMessage = err.message || 'Erro ao carregar médicos. Verifique se você tem permissão de root.';
      setError(errorMessage);
      console.error('Erro detalhado:', err);
    } finally {
      setLoading(false);
    }
  };

  // Carregar apenas os dados da aba ativa (para atualização rápida)
  const loadDoctorsForTab = async () => {
    try {
      setError(null);
      
      if (activeTab === 'pending') {
        const data = await doctorsService.getPendingDoctors();
        setPendingDoctors(Array.isArray(data) ? data : (data.data || data.items || []));
      } else {
        const data = await doctorsService.getAllDoctors();
        setDoctors(Array.isArray(data) ? data : (data.data || data.items || []));
      }
    } catch (err) {
      const errorMessage = err.message || 'Erro ao carregar médicos. Verifique se você tem permissão de root.';
      setError(errorMessage);
      console.error('Erro detalhado:', err);
    }
  };

  // Função para recarregar todos os dados (usada após ações)
  const loadDoctors = async () => {
    await loadAllDoctors();
  };

  const handleApprove = async (doctorId) => {
    if (!window.confirm('Tem certeza que deseja aprovar este médico? Ele poderá fazer login e aparecerá nas listas.')) {
      return;
    }

    try {
      setError(null);
      await doctorsService.approveDoctor(doctorId);
      await loadDoctors();
    } catch (err) {
      setError(err.message || 'Erro ao aprovar médico');
    }
  };

  const handleReject = async (doctorId) => {
    if (!window.confirm('Tem certeza que deseja rejeitar este médico? Ele não poderá fazer login.')) {
      return;
    }

    try {
      setError(null);
      await doctorsService.rejectDoctor(doctorId);
      await loadDoctors();
    } catch (err) {
      setError(err.message || 'Erro ao rejeitar médico');
    }
  };

  const handleBlock = async (doctorId) => {
    if (!window.confirm('Tem certeza que deseja bloquear este médico? Ele não poderá mais fazer login.')) {
      return;
    }

    try {
      setError(null);
      await doctorsService.blockDoctor(doctorId);
      // Recarregar médicos e atualizar estado
      await loadDoctors();
      // Se estiver na aba de aprovados, mudar para bloqueados para mostrar o médico bloqueado
      if (activeTab === 'approved') {
        setActiveTab('blocked');
      }
    } catch (err) {
      setError(err.message || 'Erro ao bloquear médico');
    }
  };

  const handleEdit = (doctor) => {
    console.log('🔍 DoctorsManagement - Editando médico:', doctor);
    setEditingDoctor(doctor);
    
    // Extrair CPF e especialidade corretamente (pode vir de diferentes lugares)
    const cpf = doctor.cpf || doctor.user?.cpf || '';
    const specialtyId = doctor.specialty?.id || doctor.medical_specialty_id || doctor.user?.medical_specialty_id || '';
    
    console.log('🔍 DoctorsManagement - CPF extraído:', cpf);
    console.log('🔍 DoctorsManagement - Especialidade ID extraído:', specialtyId);
    console.log('🔍 DoctorsManagement - Especialidade objeto:', doctor.specialty);
    
    setEditFormData({
      name: doctor.name || '',
      email: doctor.email || '',
      cpf: cpf,
      crm: doctor.crm || '',
      medical_specialty_id: specialtyId,
    });
    setEditModalVisible(true);
  };

  const handleUpdate = async () => {
    if (!editingDoctor) return;

    try {
      setError(null);
      await doctorsService.updateDoctor(editingDoctor.id, editFormData);
      setEditModalVisible(false);
      setEditingDoctor(null);
      await loadDoctors();
      alert('Médico atualizado com sucesso!');
    } catch (err) {
      setError(err.message || 'Erro ao atualizar médico');
    }
  };

  const handleDelete = async (doctorId) => {
    const doctor = doctors.find(d => d.id === doctorId) || pendingDoctors.find(d => d.id === doctorId);
    const doctorName = doctor?.name || 'este médico';
    
    if (!window.confirm(`ATENÇÃO: Tem certeza que deseja EXCLUIR permanentemente ${doctorName}?\n\nEsta ação não pode ser desfeita. Todos os dados do médico serão removidos.`)) {
      return;
    }

    // Confirmação dupla para exclusão
    if (!window.confirm(`Confirma a exclusão permanente de ${doctorName}?`)) {
      return;
    }

    try {
      setError(null);
      await doctorsService.deleteDoctor(doctorId);
      alert('Médico excluído com sucesso!');
      await loadDoctors();
    } catch (err) {
      setError(err.message || 'Erro ao excluir médico');
    }
  };

  if (loading) {
    return (
      <div className="doctors-management">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Carregando médicos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="doctors-management">
      <header className="section-header">
        <div>
          <h1>Gestão de Médicos</h1>
          <p className="subtitle">
            Avalie e gerencie os médicos candidatos. Aprove ou rejeite médicos para que possam atuar na plataforma.
          </p>
        </div>
        <button className="refresh-button" onClick={loadDoctors}>
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

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <SafeIcon name="clock" size={18} color="#6b7280" style={{ marginRight: '6px' }} />
          Pendentes ({pendingDoctors.length})
        </button>
        <button
          className={`tab ${activeTab === 'approved' ? 'active' : ''}`}
          onClick={() => setActiveTab('approved')}
        >
          <SafeIcon name="checkmark" size={18} color="#10b981" style={{ marginRight: '6px' }} />
          Aprovados ({doctors.filter(d => {
            // Médico aprovado: tem approved_at e não está bloqueado (pode ainda não ter ativado via link)
            // Verificar is_blocked de forma segura
            const isBlocked = d.is_blocked === true || d.is_blocked === 1 || d.is_blocked === '1';
            return d.approved_at && !isBlocked;
          }).length})
        </button>
        <button
          className={`tab ${activeTab === 'blocked' ? 'active' : ''}`}
          onClick={() => setActiveTab('blocked')}
        >
          <SafeIcon name="block" size={18} color="#ef4444" style={{ marginRight: '6px' }} />
          Bloqueados ({doctors.filter(d => {
            // Verificar is_blocked de forma segura
            return d.is_blocked === true || d.is_blocked === 1 || d.is_blocked === '1';
          }).length})
        </button>
      </div>

      <div className="doctors-container">
        {activeTab === 'pending' && (
          <div className="doctors-list">
            {pendingDoctors.length === 0 ? (
              <div className="empty-state">
                <p>Nenhum médico pendente de aprovação</p>
              </div>
            ) : (
              pendingDoctors.map((doctor) => (
                <div key={doctor.id} className="doctor-card pending">
                  <div className="doctor-header">
                    <div>
                      <h3>{doctor.name || 'Sem nome'}</h3>
                      <p className="doctor-email">{doctor.email}</p>
                    </div>
                    <span className="status-badge pending">
                      <SafeIcon name="clock" size={16} color="#f59e0b" style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                      Pendente
                    </span>
                  </div>
                  
                  <div className="doctor-details">
                    <div className="detail-item">
                      <strong>CPF:</strong> {formatCpfDisplay(doctor.cpf)}
                    </div>
                    <div className="detail-item">
                      <strong>CRM:</strong> {formatCrmDisplay(doctor.crm)}
                    </div>
                    <div className="detail-item">
                      <strong>Especialidade:</strong> {doctor.specialty?.name || 'N/A'}
                    </div>
                    <div className="detail-item">
                      <strong>Data de Cadastro:</strong> {new Date(doctor.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>

                  <div className="doctor-actions">
                    <button
                      className="action-btn approve-btn"
                      onClick={() => handleApprove(doctor.id)}
                    >
                      <SafeIcon name="checkmark" size={18} color="white" style={{ marginRight: '6px' }} />
                      Aprovar
                    </button>
                    <button
                      className="action-btn reject-btn"
                      onClick={() => handleReject(doctor.id)}
                    >
                      <SafeIcon name="close" size={18} color="white" style={{ marginRight: '6px' }} />
                      Rejeitar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'approved' && (
          <div className="doctors-list">
            {doctors.filter(d => {
              // Médico aprovado: tem approved_at e não está bloqueado (pode ainda não ter ativado via link)
              // Verificar is_blocked de forma segura (pode ser undefined se a coluna não existir)
              const isBlocked = d.is_blocked === true || d.is_blocked === 1 || d.is_blocked === '1';
              return d.approved_at && !isBlocked;
            }).length === 0 ? (
              <div className="empty-state">
                <p>Nenhum médico aprovado</p>
              </div>
            ) : (
              doctors
                .filter(d => {
                  // Médico aprovado: tem approved_at e não está bloqueado (pode ainda não ter ativado via link)
                  // Verificar is_blocked de forma segura (pode ser undefined se a coluna não existir)
                  const isBlocked = d.is_blocked === true || d.is_blocked === 1 || d.is_blocked === '1';
                  return d.approved_at && !isBlocked;
                })
                .map((doctor) => (
                  <div key={doctor.id} className="doctor-card approved">
                    <div className="doctor-header">
                      <div>
                        <h3>{doctor.name || 'Sem nome'}</h3>
                        <p className="doctor-email">{doctor.email}</p>
                      </div>
                      <span className="status-badge approved">
                        {doctor.is_activated ? (
                          <>
                            <SafeIcon name="checkmark" size={16} color="#10b981" style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                            Aprovado<br />e Ativado
                          </>
                        ) : (
                          <>
                            <SafeIcon name="clock" size={16} color="#f59e0b" style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                            Aprovado<br />(Aguardando Ativação)
                          </>
                        )}
                      </span>
                    </div>
                    
                    <div className="doctor-details">
                      <div className="detail-item">
                        <strong>CPF:</strong> {formatCpfDisplay(doctor.cpf)}
                      </div>
                      <div className="detail-item">
                        <strong>CRM:</strong> {formatCrmDisplay(doctor.crm)}
                      </div>
                      <div className="detail-item">
                        <strong>Especialidade:</strong> {doctor.specialty?.name || 'N/A'}
                      </div>
                      <div className="detail-item">
                        <strong>Data de Aprovação:</strong> {doctor.approved_at ? new Date(doctor.approved_at).toLocaleDateString('pt-BR') : 'N/A'}
                      </div>
                      {doctor.is_activated === false && (
                        <div className="detail-item" style={{ color: '#f59e0b', fontWeight: 'bold', marginTop: '10px' }}>
                          <SafeIcon name="warning" size={18} color="#f59e0b" style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                          Médico ainda não ativou a conta via link do email
                        </div>
                      )}
                    </div>

                    <div className="doctor-actions">
                      <button
                        className="action-btn edit-btn"
                        onClick={() => handleEdit(doctor)}
                        style={{ backgroundColor: '#3b82f6', color: 'white' }}
                      >
                        <SafeIcon name="edit" size={18} color="white" style={{ marginRight: '6px' }} />
                        Editar
                      </button>
                      <button
                        className="action-btn block-btn"
                        onClick={() => handleBlock(doctor.id)}
                      >
                        <SafeIcon name="block" size={18} color="white" style={{ marginRight: '6px' }} />
                        Bloquear
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {activeTab === 'blocked' && (
          <div className="doctors-list">
            {doctors.filter(d => {
              // Verificar is_blocked de forma segura
              return d.is_blocked === true || d.is_blocked === 1 || d.is_blocked === '1';
            }).length === 0 ? (
              <div className="empty-state">
                <p>Nenhum médico bloqueado</p>
              </div>
            ) : (
              doctors
                .filter(d => {
                  // Verificar is_blocked de forma segura
                  return d.is_blocked === true || d.is_blocked === 1 || d.is_blocked === '1';
                })
                .map((doctor) => (
                  <div key={doctor.id} className="doctor-card blocked">
                    <div className="doctor-header">
                      <div>
                        <h3>{doctor.name || 'Sem nome'}</h3>
                        <p className="doctor-email">{doctor.email}</p>
                      </div>
                      <span className="status-badge blocked">
                        <SafeIcon name="block" size={16} color="#ef4444" style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                        Bloqueado
                      </span>
                    </div>
                    
                    <div className="doctor-details">
                      <div className="detail-item">
                        <strong>CPF:</strong> {formatCpfDisplay(doctor.cpf)}
                      </div>
                      <div className="detail-item">
                        <strong>CRM:</strong> {formatCrmDisplay(doctor.crm)}
                      </div>
                      <div className="detail-item">
                        <strong>Especialidade:</strong> {doctor.specialty?.name || 'N/A'}
                      </div>
                    </div>

                    <div className="doctor-actions">
                      <button
                        className="action-btn approve-btn"
                        onClick={() => handleApprove(doctor.id)}
                      >
                        <SafeIcon name="unlock" size={18} color="white" style={{ marginRight: '6px' }} />
                        Desbloquear
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleDelete(doctor.id)}
                        title="Excluir médico permanentemente"
                      >
                        <SafeIcon name="trash" size={18} color="white" style={{ marginRight: '6px' }} />
                        Excluir
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}
      </div>

      {/* Modal de Edição */}
      {editModalVisible && (
        <div className="modal-overlay" onClick={() => setEditModalVisible(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Editar Médico</h2>
              <button className="modal-close" onClick={() => setEditModalVisible(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Nome:</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>CPF:</label>
                <input
                  type="text"
                  value={editFormData.cpf}
                  onChange={(e) => setEditFormData({ ...editFormData, cpf: e.target.value })}
                  className="form-input"
                  placeholder="000.000.000-00"
                />
              </div>

              <div className="form-group">
                <label>CRM:</label>
                <input
                  type="text"
                  value={editFormData.crm}
                  onChange={(e) => setEditFormData({ ...editFormData, crm: e.target.value })}
                  className="form-input"
                  placeholder="123456/UF"
                />
              </div>

              <div className="form-group">
                <label>Especialidade:</label>
                <select
                  value={editFormData.medical_specialty_id}
                  onChange={(e) => setEditFormData({ ...editFormData, medical_specialty_id: e.target.value })}
                  className="form-input"
                >
                  <option value="">Selecione uma especialidade</option>
                  {specialties.map((spec) => (
                    <option key={spec.id} value={spec.id}>
                      {spec.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setEditModalVisible(false)}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={handleUpdate}>
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorsManagement;


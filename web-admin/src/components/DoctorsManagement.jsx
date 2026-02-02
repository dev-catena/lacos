import React, { useState, useEffect } from 'react';
import SafeIcon from './SafeIcon';
import doctorsService from '../services/doctorsService';
import { API_BASE_URL } from '../config/api';
import './DoctorsManagement.css';

const DoctorsManagement = () => {
  const [doctors, setDoctors] = useState([]);
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Carregar aba salva do localStorage ou usar 'pending' como padrão
  const getInitialTab = () => {
    const savedTab = localStorage.getItem('@lacos:doctorsActiveTab');
    return savedTab || 'pending';
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab()); // pending, approved, blocked
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
  const [technicalSheetVisible, setTechnicalSheetVisible] = useState(false);
  const [technicalSheetData, setTechnicalSheetData] = useState(null);
  const [loadingTechnicalSheet, setLoadingTechnicalSheet] = useState(false);
  const [patientsModalVisible, setPatientsModalVisible] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);

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
      // Usar a mesma chave de token que outros serviços
      const token = localStorage.getItem('@lacos:token') || localStorage.getItem('token');
      console.log('🔍 Carregando especialidades...', { token: !!token, apiUrl: API_BASE_URL });
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
        console.log('✅ Especialidades carregadas:', specialtiesList.length);
        setSpecialties(specialtiesList.sort((a, b) => a.name.localeCompare(b.name)));
      } else {
        console.error('❌ Erro ao carregar especialidades:', response.status, response.statusText);
      }
    } catch (err) {
      console.error('Erro ao carregar especialidades:', err);
    } finally {
      setLoadingSpecialties(false);
    }
  };

  // Salvar aba ativa no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem('@lacos:doctorsActiveTab', activeTab);
  }, [activeTab]);

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
    const specialtyId = doctor.specialty?.id || doctor.medical_specialty_id || doctor.user?.medical_specialty_id || null;
    
    // Converter para string para garantir compatibilidade com o select
    const specialtyIdString = specialtyId ? String(specialtyId) : '';
    
    console.log('🔍 DoctorsManagement - CPF extraído:', cpf);
    console.log('🔍 DoctorsManagement - Especialidade ID extraído:', specialtyId);
    console.log('🔍 DoctorsManagement - Especialidade ID (string):', specialtyIdString);
    console.log('🔍 DoctorsManagement - Especialidade objeto:', doctor.specialty);
    console.log('🔍 DoctorsManagement - Dados completos do médico:', JSON.stringify(doctor, null, 2));
    
    setEditFormData({
      name: doctor.name || '',
      email: doctor.email || '',
      cpf: cpf,
      crm: doctor.crm || '',
      medical_specialty_id: specialtyIdString,
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

  const handleViewTechnicalSheet = async (doctorId) => {
    try {
      setLoadingTechnicalSheet(true);
      setError(null);
      const data = await doctorsService.getDoctorDetails(doctorId);
      setTechnicalSheetData(data);
      setTechnicalSheetVisible(true);
    } catch (err) {
      setError(err.message || 'Erro ao carregar ficha técnica');
    } finally {
      setLoadingTechnicalSheet(false);
    }
  };

  const handleViewPatients = async (doctor) => {
    try {
      setSelectedDoctor(doctor);
      setLoadingPatients(true);
      setError(null);
      const result = await doctorsService.getDoctorPatients(doctor.id);
      setPatients(result.patients || []);
      setPatientsModalVisible(true);
    } catch (err) {
      setError(err.message || 'Erro ao carregar pacientes');
      alert(err.message || 'Erro ao carregar pacientes do médico');
    } finally {
      setLoadingPatients(false);
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
          <div className="doctors-table-wrapper">
            {pendingDoctors.length === 0 ? (
              <div className="empty-state">
                <SafeIcon name="people" size={64} color="#d1d5db" />
                <p>Nenhum médico pendente de aprovação</p>
              </div>
            ) : (
              <div className="doctors-table-container">
                <table className="doctors-table">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Login (Email)</th>
                      <th>CPF</th>
                      <th>CRM</th>
                      <th>Especialidade</th>
                      <th>Data de Solicitação</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingDoctors.map((doctor) => (
                      <tr key={doctor.id}>
                        <td><strong>{doctor.name || 'Sem nome'}</strong></td>
                        <td>{doctor.email || 'N/A'}</td>
                        <td>{formatCpfDisplay(doctor.cpf)}</td>
                        <td>{formatCrmDisplay(doctor.crm)}</td>
                        <td>{doctor.specialty?.name || 'N/A'}</td>
                        <td>{doctor.created_at ? new Date(doctor.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A'}</td>
                        <td>
                          <span className="status-badge pending">
                            <SafeIcon name="clock" size={14} color="#f59e0b" style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                            Pendente
                          </span>
                        </td>
                        <td>
                          <div className="table-actions">
                            <button
                              className="action-btn approve-btn"
                              onClick={() => handleApprove(doctor.id)}
                              title="Aprovar"
                            >
                              <SafeIcon name="checkmark" size={16} color="white" style={{ marginRight: '4px' }} />
                              Aprovar
                            </button>
                            <button
                              className="action-btn reject-btn"
                              onClick={() => handleReject(doctor.id)}
                              title="Rejeitar"
                            >
                              <SafeIcon name="close" size={16} color="white" style={{ marginRight: '4px' }} />
                              Rejeitar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'approved' && (
          <div className="doctors-table-wrapper">
            {doctors.filter(d => {
              const isBlocked = d.is_blocked === true || d.is_blocked === 1 || d.is_blocked === '1';
              return d.approved_at && !isBlocked;
            }).length === 0 ? (
              <div className="empty-state">
                <SafeIcon name="people" size={64} color="#d1d5db" />
                <p>Nenhum médico aprovado</p>
              </div>
            ) : (
              <div className="doctors-table-container">
                <table className="doctors-table">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Login (Email)</th>
                      <th>CPF</th>
                      <th>CRM</th>
                      <th>Especialidade</th>
                      <th>Data de Aprovação</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctors
                      .filter(d => {
                        const isBlocked = d.is_blocked === true || d.is_blocked === 1 || d.is_blocked === '1';
                        return d.approved_at && !isBlocked;
                      })
                      .map((doctor) => (
                        <tr key={doctor.id}>
                          <td><strong>{doctor.name || 'Sem nome'}</strong></td>
                          <td>{doctor.email || 'N/A'}</td>
                          <td>{formatCpfDisplay(doctor.cpf)}</td>
                          <td>{formatCrmDisplay(doctor.crm)}</td>
                          <td>{doctor.specialty?.name || 'N/A'}</td>
                          <td>{doctor.approved_at ? new Date(doctor.approved_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A'}</td>
                          <td>
                            <span className={`status-badge ${doctor.is_activated ? 'approved' : 'approved-pending'}`}>
                              {doctor.is_activated ? (
                                <>
                                  <SafeIcon name="checkmark" size={14} color="#10b981" style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                                  Ativado
                                </>
                              ) : (
                                <>
                                  <SafeIcon name="clock" size={14} color="#f59e0b" style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                                  Aguardando
                                </>
                              )}
                            </span>
                          </td>
                          <td>
                            <div className="table-actions">
                              <button
                                className="action-btn"
                                onClick={() => handleViewPatients(doctor)}
                                style={{ backgroundColor: '#10b981', color: 'white', marginRight: '4px' }}
                                title="Ver pacientes"
                              >
                                <SafeIcon name="people" size={14} color="white" style={{ marginRight: '4px' }} />
                                Pacientes
                              </button>
                              <button
                                className="action-btn"
                                onClick={() => handleViewTechnicalSheet(doctor.id)}
                                style={{ backgroundColor: '#6366f1', color: 'white', marginRight: '4px' }}
                                title="Ficha técnica"
                              >
                                <SafeIcon name="document-text" size={14} color="white" style={{ marginRight: '4px' }} />
                                Ficha
                              </button>
                              <button
                                className="action-btn edit-btn"
                                onClick={() => handleEdit(doctor)}
                                style={{ backgroundColor: '#3b82f6', color: 'white', marginRight: '4px' }}
                                title="Editar"
                              >
                                <SafeIcon name="edit" size={14} color="white" style={{ marginRight: '4px' }} />
                                Editar
                              </button>
                              <button
                                className="action-btn block-btn"
                                onClick={() => handleBlock(doctor.id)}
                                title="Bloquear"
                              >
                                <SafeIcon name="block" size={14} color="white" style={{ marginRight: '4px' }} />
                                Bloquear
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'blocked' && (
          <div className="doctors-table-wrapper">
            {doctors.filter(d => {
              return d.is_blocked === true || d.is_blocked === 1 || d.is_blocked === '1';
            }).length === 0 ? (
              <div className="empty-state">
                <SafeIcon name="people" size={64} color="#d1d5db" />
                <p>Nenhum médico bloqueado</p>
              </div>
            ) : (
              <div className="doctors-table-container">
                <table className="doctors-table">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Login (Email)</th>
                      <th>CPF</th>
                      <th>CRM</th>
                      <th>Especialidade</th>
                      <th>Data de Criação</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctors
                      .filter(d => {
                        return d.is_blocked === true || d.is_blocked === 1 || d.is_blocked === '1';
                      })
                      .map((doctor) => (
                        <tr key={doctor.id}>
                          <td><strong>{doctor.name || 'Sem nome'}</strong></td>
                          <td>{doctor.email || 'N/A'}</td>
                          <td>{formatCpfDisplay(doctor.cpf)}</td>
                          <td>{formatCrmDisplay(doctor.crm)}</td>
                          <td>{doctor.specialty?.name || 'N/A'}</td>
                          <td>{doctor.created_at ? new Date(doctor.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A'}</td>
                          <td>
                            <span className="status-badge blocked">
                              <SafeIcon name="block" size={14} color="#ef4444" style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                              Bloqueado
                            </span>
                          </td>
                          <td>
                            <div className="table-actions">
                              <button
                                className="action-btn"
                                onClick={() => handleViewTechnicalSheet(doctor.id)}
                                style={{ backgroundColor: '#6366f1', color: 'white', marginRight: '4px' }}
                                title="Ficha técnica"
                              >
                                <SafeIcon name="document-text" size={14} color="white" style={{ marginRight: '4px' }} />
                                Ficha
                              </button>
                              <button
                                className="action-btn edit-btn"
                                onClick={() => handleEdit(doctor)}
                                style={{ backgroundColor: '#3b82f6', color: 'white', marginRight: '4px' }}
                                title="Editar"
                              >
                                <SafeIcon name="edit" size={14} color="white" style={{ marginRight: '4px' }} />
                                Editar
                              </button>
                              <button
                                className="action-btn delete-btn"
                                onClick={() => handleDelete(doctor.id)}
                                style={{ backgroundColor: '#ef4444', color: 'white' }}
                                title="Excluir"
                              >
                                <SafeIcon name="trash" size={14} color="white" style={{ marginRight: '4px' }} />
                                Excluir
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
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
                  value={String(editFormData.medical_specialty_id || '')}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    console.log('🔍 Alterando especialidade para:', newValue);
                    console.log('🔍 Valor atual antes da mudança:', editFormData.medical_specialty_id);
                    console.log('🔍 Especialidades disponíveis:', specialties.map(s => ({ id: s.id, name: s.name })));
                    setEditFormData({ ...editFormData, medical_specialty_id: newValue });
                  }}
                  className="form-input"
                  disabled={loadingSpecialties}
                >
                  <option value="">Selecione uma especialidade</option>
                  {specialties.map((spec) => {
                    const specId = String(spec.id);
                    const currentValue = String(editFormData.medical_specialty_id || '');
                    const isSelected = specId === currentValue;
                    if (isSelected) {
                      console.log('✅ Especialidade selecionada:', { id: specId, name: spec.name, currentValue });
                    }
                    return (
                      <option key={spec.id} value={specId}>
                        {spec.name}
                      </option>
                    );
                  })}
                </select>
                {loadingSpecialties && (
                  <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                    Carregando especialidades...
                  </p>
                )}
                {!loadingSpecialties && specialties.length === 0 && (
                  <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
                    Nenhuma especialidade disponível
                  </p>
                )}
                <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                  Valor atual: {editFormData.medical_specialty_id || '(vazio)'} | Total de especialidades: {specialties.length}
                </p>
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

      {/* Modal de Ficha Técnica */}
      {technicalSheetVisible && (
        <div className="modal-overlay" onClick={() => setTechnicalSheetVisible(false)}>
          <div className="modal-content" style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Ficha Técnica do Médico</h2>
              <button className="modal-close" onClick={() => setTechnicalSheetVisible(false)}>×</button>
            </div>
            
            <div className="modal-body">
              {loadingTechnicalSheet ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div className="spinner" style={{ margin: '0 auto' }}></div>
                  <p style={{ marginTop: '16px', color: '#6b7280' }}>Carregando dados...</p>
                </div>
              ) : technicalSheetData ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Dados Pessoais */}
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>
                      <SafeIcon name="person" size={20} color="#6366f1" style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                      Dados Pessoais
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                      <div className="detail-item">
                        <strong>Nome:</strong> {technicalSheetData.name || 'N/A'}
                      </div>
                      {technicalSheetData.last_name && (
                        <div className="detail-item">
                          <strong>Sobrenome:</strong> {technicalSheetData.last_name}
                        </div>
                      )}
                      <div className="detail-item">
                        <strong>Email:</strong> {technicalSheetData.email || 'N/A'}
                      </div>
                      <div className="detail-item">
                        <strong>Telefone:</strong> {technicalSheetData.phone || 'N/A'}
                      </div>
                      <div className="detail-item">
                        <strong>CPF:</strong> {formatCpfDisplay(technicalSheetData.cpf)}
                      </div>
                      <div className="detail-item">
                        <strong>Data de Nascimento:</strong> {technicalSheetData.birth_date ? new Date(technicalSheetData.birth_date).toLocaleDateString('pt-BR') : 'N/A'}
                      </div>
                      <div className="detail-item">
                        <strong>Sexo:</strong> {technicalSheetData.gender || 'N/A'}
                      </div>
                      {technicalSheetData.address && (
                        <>
                          <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                            <strong>Endereço:</strong> {technicalSheetData.address}
                            {technicalSheetData.address_number && `, ${technicalSheetData.address_number}`}
                            {technicalSheetData.address_complement && ` - ${technicalSheetData.address_complement}`}
                          </div>
                          <div className="detail-item">
                            <strong>Bairro:</strong> {technicalSheetData.neighborhood || 'N/A'}
                          </div>
                          <div className="detail-item">
                            <strong>Cidade:</strong> {technicalSheetData.city || 'N/A'}
                          </div>
                          <div className="detail-item">
                            <strong>Estado:</strong> {technicalSheetData.state || 'N/A'}
                          </div>
                          <div className="detail-item">
                            <strong>CEP:</strong> {technicalSheetData.zip_code || 'N/A'}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Dados Profissionais */}
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>
                      <SafeIcon name="medical" size={20} color="#10b981" style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                      Dados Profissionais
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                      <div className="detail-item">
                        <strong>CRM:</strong> {formatCrmDisplay(technicalSheetData.crm)}
                      </div>
                      <div className="detail-item">
                        <strong>Especialidade:</strong> {technicalSheetData.medical_specialty?.name || 'N/A'}
                      </div>
                      {technicalSheetData.formation_details && (
                        <div className="detail-item">
                          <strong>Formação:</strong> {technicalSheetData.formation_details}
                        </div>
                      )}
                      {technicalSheetData.formation_description && (
                        <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                          <strong>Detalhes da Formação:</strong>
                          <p style={{ marginTop: '8px', color: '#6b7280', lineHeight: '1.6' }}>
                            {technicalSheetData.formation_description}
                          </p>
                        </div>
                      )}
                      {technicalSheetData.hourly_rate && (
                        <div className="detail-item">
                          <strong>Valor/Hora:</strong> R$ {parseFloat(technicalSheetData.hourly_rate).toFixed(2).replace('.', ',')}
                        </div>
                      )}
                      {technicalSheetData.consultation_price && (
                        <div className="detail-item">
                          <strong>Valor da Consulta:</strong> R$ {parseFloat(technicalSheetData.consultation_price).toFixed(2).replace('.', ',')}
                        </div>
                      )}
                      <div className="detail-item">
                        <strong>Disponibilidade:</strong> {technicalSheetData.availability || 'N/A'}
                      </div>
                      <div className="detail-item">
                        <strong>Disponível:</strong> {technicalSheetData.is_available ? 'Sim' : 'Não'}
                      </div>
                      {technicalSheetData.latitude && technicalSheetData.longitude && (
                        <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                          <strong>Localização:</strong> {technicalSheetData.latitude}, {technicalSheetData.longitude}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>
                      <SafeIcon name="information-circle" size={20} color="#f59e0b" style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                      Status
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                      <div className="detail-item">
                        <strong>Status:</strong> {technicalSheetData.is_blocked ? 'Bloqueado' : (technicalSheetData.is_activated ? 'Ativado' : 'Aguardando Ativação')}
                      </div>
                      <div className="detail-item">
                        <strong>Data de Aprovação:</strong> {technicalSheetData.approved_at ? new Date(technicalSheetData.approved_at).toLocaleDateString('pt-BR') : 'N/A'}
                      </div>
                      <div className="detail-item">
                        <strong>Data de Solicitação de Criação de Conta:</strong> {technicalSheetData.created_at ? new Date(technicalSheetData.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A'}
                      </div>
                      <div className="detail-item">
                        <strong>Última Atualização:</strong> {technicalSheetData.updated_at ? new Date(technicalSheetData.updated_at).toLocaleDateString('pt-BR') : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#ef4444' }}>
                  <p>Erro ao carregar dados do médico</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-primary" onClick={() => setTechnicalSheetVisible(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Pacientes */}
      {patientsModalVisible && (
        <div className="modal-overlay" onClick={() => setPatientsModalVisible(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Pacientes de {selectedDoctor?.name}</h2>
              <button className="modal-close" onClick={() => setPatientsModalVisible(false)}>
                <SafeIcon name="close" size={24} color="#6b7280" />
              </button>
            </div>
            <div className="modal-body">
              {loadingPatients ? (
                <div className="loading-container">
                  <div className="spinner"></div>
                  <p>Carregando pacientes...</p>
                </div>
              ) : patients.length === 0 ? (
                <div className="empty-state">
                  <SafeIcon name="people" size={48} color="#d1d5db" />
                  <p>Este médico ainda não possui pacientes cadastrados.</p>
                </div>
              ) : (
                <div className="patients-table-container">
                  <table className="patients-table">
                    <thead>
                      <tr>
                        <th>Nome</th>
                        <th>Email</th>
                        <th>Telefone</th>
                        <th>Idade</th>
                        <th>Gênero</th>
                        <th>Última Consulta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patients.map((patient, index) => (
                        <tr key={patient.id || index}>
                          <td><strong>{patient.name}</strong></td>
                          <td>{patient.email || 'N/A'}</td>
                          <td>{patient.phone || 'N/A'}</td>
                          <td>{patient.age ? `${patient.age} anos` : 'N/A'}</td>
                          <td>{patient.gender || 'N/A'}</td>
                          <td>{patient.last_appointment_date ? formatDate(patient.last_appointment_date) : 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="modal-button" onClick={() => setPatientsModalVisible(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorsManagement;


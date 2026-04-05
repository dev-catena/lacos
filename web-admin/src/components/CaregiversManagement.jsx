import React, { useState, useEffect } from 'react';
import SafeIcon from './SafeIcon';
import caregiversService from '../services/caregiversService';
import './CaregiversManagement.css';

const CaregiversManagement = () => {
  const [caregivers, setCaregivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCaregiver, setSelectedCaregiver] = useState(null);
  const [patients, setPatients] = useState([]);
  const [showPatientsModal, setShowPatientsModal] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);

  useEffect(() => {
    loadCaregivers();
  }, []);

  const loadCaregivers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await caregiversService.getAllCaregivers();
      setCaregivers(data);
    } catch (err) {
      const errorMessage = err.message || 'Erro ao carregar cuidadores profissionais. Verifique se você tem permissão de root.';
      setError(errorMessage);
      console.error('Erro detalhado:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPatients = async (caregiver) => {
    try {
      setSelectedCaregiver(caregiver);
      setLoadingPatients(true);
      setError(null);
      const result = await caregiversService.getCaregiverPatients(caregiver.id);
      setPatients(result.patients || []);
      setShowPatientsModal(true);
    } catch (err) {
      setError(err.message || 'Erro ao carregar pacientes');
      alert(err.message || 'Erro ao carregar pacientes do cuidador');
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

  const getFormationLabel = (formation) => {
    if (!formation) return 'Não informado';
    if (formation === 'Cuidador') return 'Cuidador';
    if (formation === 'Auxiliar de enfermagem') return 'Auxiliar de Enfermagem';
    return formation;
  };

  return (
    <div className="caregivers-management">
      <header className="section-header">
        <div>
          <h1>Cuidadores Profissionais</h1>
          <p className="subtitle">
            Gerencie os cuidadores profissionais cadastrados no aplicativo.
          </p>
        </div>
        <button className="refresh-button" onClick={loadCaregivers}>
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

      <div className="caregivers-content">
        <div className="caregivers-header">
          <h2>Cuidadores Cadastrados</h2>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Carregando cuidadores profissionais...</p>
          </div>
        ) : caregivers.length === 0 ? (
          <div className="empty-state">
            <SafeIcon name="people" size={64} color="#d1d5db" />
            <p>Nenhum cuidador profissional cadastrado</p>
          </div>
        ) : (
          <div className="caregivers-table-container">
            <table className="caregivers-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Login (Email)</th>
                  <th>Data de Criação</th>
                  <th>Tipo</th>
                  <th>Cidade</th>
                  <th>Disponível</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {caregivers.map((caregiver) => (
                  <tr key={caregiver.id}>
                    <td>
                      <strong>{caregiver.name}</strong>
                    </td>
                    <td>{caregiver.email || 'N/A'}</td>
                    <td>{formatDate(caregiver.created_at)}</td>
                    <td>
                      <span className={`formation-badge formation-${caregiver.formation_details?.toLowerCase().replace(/\s+/g, '-') || 'nao-informado'}`}>
                        {getFormationLabel(caregiver.formation_details)}
                      </span>
                    </td>
                    <td>{caregiver.city || 'N/A'}</td>
                    <td>
                      <span className={`availability-badge ${caregiver.is_available ? 'available' : 'unavailable'}`}>
                        {caregiver.is_available ? 'Sim' : 'Não'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="view-patients-btn"
                        onClick={() => handleViewPatients(caregiver)}
                        title="Ver pacientes"
                      >
                        <SafeIcon name="people" size={18} color="white" style={{ marginRight: '6px' }} />
                        Ver Pacientes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Pacientes */}
      {showPatientsModal && (
        <div className="modal-overlay" onClick={() => setShowPatientsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Pacientes de {selectedCaregiver?.name}</h2>
              <button className="modal-close" onClick={() => setShowPatientsModal(false)}>
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
                  <p>Este cuidador ainda não possui pacientes cadastrados.</p>
                </div>
              ) : (
                <div className="patients-table-container">
                  <table className="patients-table">
                    <thead>
                      <tr>
                        <th>Nome do Cliente</th>
                        <th>Email</th>
                        <th>Telefone</th>
                        <th>Grupo</th>
                        <th>Paciente</th>
                        <th>Cidade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patients.map((patient, index) => (
                        <tr key={patient.id || index}>
                          <td><strong>{patient.name}</strong></td>
                          <td>{patient.email || 'N/A'}</td>
                          <td>{patient.phone || 'N/A'}</td>
                          <td>{patient.group_name || 'N/A'}</td>
                          <td>
                            {patient.patient ? (
                              <span>
                                {patient.patient.name}
                                {patient.patient.age ? ` (${patient.patient.age} anos)` : ''}
                              </span>
                            ) : (
                              'N/A'
                            )}
                          </td>
                          <td>{patient.city || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="modal-button" onClick={() => setShowPatientsModal(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaregiversManagement;


import React, { useState, useEffect } from 'react';
import SafeIcon from './SafeIcon';
import suppliersService from '../services/suppliersService';
import './SuppliersManagement.css';

const SuppliersManagement = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected, suspended
  const [searchText, setSearchText] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);

  useEffect(() => {
    loadSuppliers();
  }, [filter]);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await suppliersService.getAllSuppliers({
        status: filter,
        search: searchText || undefined,
      });
      setSuppliers(data);
    } catch (err) {
      const errorMessage = err.message || 'Erro ao carregar fornecedores. Verifique se você tem permissão de root.';
      setError(errorMessage);
      console.error('Erro detalhado:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadSuppliers();
  };

  const handleApprove = async (supplierId) => {
    if (!window.confirm('Tem certeza que deseja aprovar este fornecedor?')) {
      return;
    }

    try {
      setError(null);
      await suppliersService.approveSupplier(supplierId);
      alert('Fornecedor aprovado com sucesso!');
      loadSuppliers();
    } catch (err) {
      setError(err.message || 'Erro ao aprovar fornecedor');
    }
  };

  const handleReject = (supplier) => {
    setSelectedSupplier(supplier);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!rejectReason.trim()) {
      alert('Por favor, informe o motivo da reprovação.');
      return;
    }

    try {
      setRejectLoading(true);
      setError(null);
      await suppliersService.rejectSupplier(selectedSupplier.id, rejectReason);
      alert('Fornecedor reprovado com sucesso!');
      setShowRejectModal(false);
      setSelectedSupplier(null);
      setRejectReason('');
      loadSuppliers();
    } catch (err) {
      setError(err.message || 'Erro ao reprovar fornecedor');
    } finally {
      setRejectLoading(false);
    }
  };

  const handleDelete = async (supplierId, companyName) => {
    if (!window.confirm(`Tem certeza que deseja excluir o fornecedor "${companyName}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      setError(null);
      await suppliersService.deleteSupplier(supplierId);
      alert('Fornecedor excluído com sucesso!');
      loadSuppliers();
    } catch (err) {
      setError(err.message || 'Erro ao excluir fornecedor');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Pendente', class: 'status-pending' },
      approved: { label: 'Aprovado', class: 'status-approved' },
      rejected: { label: 'Reprovado', class: 'status-rejected' },
      suspended: { label: 'Suspenso', class: 'status-suspended' },
    };

    const config = statusConfig[status] || { label: status, class: 'status-unknown' };
    return <span className={`status-badge ${config.class}`}>{config.label}</span>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDocument = (type, value) => {
    if (!value) return '-';
    if (type === 'pessoa_juridica') {
      return value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    } else {
      return value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    if (!searchText) return true;
    const search = searchText.toLowerCase();
    return (
      supplier.company_name?.toLowerCase().includes(search) ||
      supplier.cnpj?.includes(search) ||
      supplier.cpf?.includes(search) ||
      supplier.user?.email?.toLowerCase().includes(search) ||
      supplier.user?.name?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="suppliers-management">
      <div className="suppliers-header">
        <h1>
          <SafeIcon name="store" size={28} color="#10b981" style={{ marginRight: '10px', verticalAlign: 'middle' }} />
          Gestão de Fornecedores
        </h1>
        <p>Gerencie os cadastros de fornecedores do LaçosApp</p>
      </div>

      <div className="suppliers-filters">
        <div className="filter-group">
          <label>Status:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">Todos</option>
            <option value="pending">Pendentes</option>
            <option value="approved">Aprovados</option>
            <option value="rejected">Reprovados</option>
            <option value="suspended">Suspensos</option>
          </select>
        </div>

        <div className="search-group">
          <input
            type="text"
            placeholder="Buscar por nome, CNPJ, CPF ou email..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch}>
            <SafeIcon name="search" size={18} color="white" style={{ marginRight: '6px' }} />
            Buscar
          </button>
        </div>

        <button onClick={loadSuppliers} className="btn-refresh">
          <SafeIcon name="refresh" size={18} color="#6366f1" style={{ marginRight: '8px' }} />
          Atualizar
        </button>
      </div>

      {error && (
        <div className="error-message">
          <SafeIcon name="warning" size={20} color="#f59e0b" style={{ marginRight: '8px' }} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Carregando fornecedores...</p>
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <div className="empty-state">
          <p>Nenhum fornecedor encontrado.</p>
        </div>
      ) : (
        <div className="suppliers-table-container">
          <table className="suppliers-table">
            <thead>
              <tr>
                <th>Empresa/Nome</th>
                <th>Tipo</th>
                <th>Documento</th>
                <th>Usuário</th>
                <th>Categorias</th>
                <th>Status</th>
                <th>Data Cadastro</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.map((supplier) => (
                <tr key={supplier.id}>
                  <td>
                    <div className="company-info">
                      <strong>{supplier.company_name}</strong>
                      {supplier.business_description && (
                        <small>{supplier.business_description.substring(0, 50)}...</small>
                      )}
                    </div>
                  </td>
                  <td>
                    {supplier.company_type === 'pessoa_juridica' ? 'PJ' : 'PF'}
                  </td>
                  <td>
                    {formatDocument(
                      supplier.company_type,
                      supplier.company_type === 'pessoa_juridica' ? supplier.cnpj : supplier.cpf
                    )}
                  </td>
                  <td>
                    <div className="user-info">
                      <div>{supplier.user?.name || '-'}</div>
                      <small>{supplier.user?.email || '-'}</small>
                    </div>
                  </td>
                  <td>
                    <div className="categories-list">
                      {supplier.categories && supplier.categories.length > 0 ? (
                        supplier.categories.slice(0, 2).map((cat, idx) => (
                          <span key={idx} className="category-tag">
                            {cat.category}
                          </span>
                        ))
                      ) : (
                        <span className="no-categories">-</span>
                      )}
                      {supplier.categories && supplier.categories.length > 2 && (
                        <span className="more-categories">
                          +{supplier.categories.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>{getStatusBadge(supplier.status)}</td>
                  <td>{formatDate(supplier.created_at)}</td>
                  <td>
                    <div className="action-buttons">
                      {supplier.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(supplier.id)}
                            className="btn-approve"
                            title="Aprovar"
                          >
                            ✓ Aprovar
                          </button>
                          <button
                            onClick={() => handleReject(supplier)}
                            className="btn-reject"
                            title="Reprovar"
                          >
                            ✗ Reprovar
                          </button>
                        </>
                      )}
                      {supplier.status === 'approved' && (
                        <button
                          onClick={() => handleReject(supplier)}
                          className="btn-reject"
                          title="Suspender"
                        >
                          <SafeIcon name="warning" size={18} color="white" style={{ marginRight: '6px' }} />
                          Suspender
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(supplier.id, supplier.company_name)}
                        className="btn-delete"
                        title="Excluir"
                      >
                        <SafeIcon name="trash" size={18} color="white" style={{ marginRight: '6px' }} />
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

      {/* Modal de Reprovação */}
      {showRejectModal && selectedSupplier && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Reprovar Fornecedor</h2>
            <p>
              <strong>{selectedSupplier.company_name}</strong>
            </p>
            <div className="modal-body">
              <label htmlFor="reject-reason">Motivo da Reprovação *</label>
              <textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Informe o motivo da reprovação..."
                rows="5"
                required
              />
            </div>
            <div className="modal-actions">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedSupplier(null);
                  setRejectReason('');
                }}
                className="btn-cancel"
                disabled={rejectLoading}
              >
                Cancelar
              </button>
              <button
                onClick={confirmReject}
                className="btn-confirm-reject"
                disabled={rejectLoading || !rejectReason.trim()}
              >
                {rejectLoading ? 'Reprovando...' : 'Confirmar Reprovação'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuppliersManagement;


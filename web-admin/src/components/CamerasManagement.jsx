import React, { useCallback, useEffect, useMemo, useState } from 'react';
import SafeIcon from './SafeIcon';
import camerasService from '../services/camerasService';
import './CamerasManagement.css';

const CamerasManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [filter, setFilter] = useState('all');

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await camerasService.getUsersCamerasOverview();
      setUsers(list);
    } catch (err) {
      setError(err.message || 'Erro ao carregar usuários e câmeras.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return users.filter((user) => {
      if (filter === 'linked' && !user.linked_to_agent) return false;
      if (filter === 'unlinked' && user.linked_to_agent) return false;
      if (filter === 'active' && !user.is_active) return false;

      if (!query) return true;
      return (
        String(user.name || '').toLowerCase().includes(query) ||
        String(user.email || '').toLowerCase().includes(query)
      );
    });
  }, [users, searchText, filter]);

  const stats = useMemo(() => {
    const linked = users.filter((user) => user.linked_to_agent).length;
    const active = users.filter((user) => user.is_active).length;
    const totalActiveCameras = users.reduce((sum, user) => sum + (user.cameras_active || 0), 0);
    return { linked, active, totalActiveCameras };
  }, [users]);

  return (
    <div className="cameras-management">
      <div className="cameras-content">
        <header className="cameras-header">
          <div>
            <h2>Câmeras</h2>
            <p className="cameras-subtitle">
              Cada usuário vincula um agente de streaming (via QR no app). As câmeras ativas
              são as publicadas naquele servidor de streaming.
            </p>
          </div>
          <button type="button" className="cameras-refresh-btn" onClick={loadUsers}>
            <SafeIcon name="refresh" size={18} color="#fff" style={{ marginRight: '8px' }} />
            Atualizar
          </button>
        </header>

        <div className="cameras-stats-row">
          <div className="cameras-stat-card">
            <span className="cameras-stat-label">Usuários com agente</span>
            <strong>{stats.linked}</strong>
          </div>
          <div className="cameras-stat-card">
            <span className="cameras-stat-label">Agentes com câmera ativa</span>
            <strong>{stats.active}</strong>
          </div>
          <div className="cameras-stat-card">
            <span className="cameras-stat-label">Câmeras ativas (total)</span>
            <strong>{stats.totalActiveCameras}</strong>
          </div>
        </div>

        <div className="cameras-toolbar">
          <input
            type="search"
            className="cameras-search"
            placeholder="Buscar por nome ou e-mail..."
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
          <div className="cameras-filters">
            <button
              type="button"
              className={`cameras-filter-btn${filter === 'all' ? ' active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Todos
            </button>
            <button
              type="button"
              className={`cameras-filter-btn${filter === 'linked' ? ' active' : ''}`}
              onClick={() => setFilter('linked')}
            >
              Com agente
            </button>
            <button
              type="button"
              className={`cameras-filter-btn${filter === 'unlinked' ? ' active' : ''}`}
              onClick={() => setFilter('unlinked')}
            >
              Sem agente
            </button>
            <button
              type="button"
              className={`cameras-filter-btn${filter === 'active' ? ' active' : ''}`}
              onClick={() => setFilter('active')}
            >
              Ativos
            </button>
          </div>
        </div>

        {loading ? (
          <div className="cameras-state">
            <div className="cameras-spinner" />
            <p>Carregando usuários...</p>
          </div>
        ) : error ? (
          <div className="cameras-state cameras-state-error">
            <SafeIcon name="warning" size={40} color="#b45309" />
            <p>{error}</p>
            <button type="button" className="cameras-retry-btn" onClick={loadUsers}>
              Tentar novamente
            </button>
          </div>
        ) : (
          <div className="cameras-table-wrap">
            <table className="cameras-users-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Usuário</th>
                  <th>E-mail</th>
                  <th>Agente vinculado</th>
                  <th>Qtd. agentes</th>
                  <th>Câmeras ativas no agente</th>
                  <th>Servidores do agente</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="cameras-table-empty">
                      Nenhum usuário encontrado para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <span
                          className={`cameras-signal${user.is_active ? ' active' : ''}`}
                          title={user.is_active ? 'Agente com câmera ativa' : 'Sem câmera ativa no agente'}
                        />
                      </td>
                      <td>
                        <div className="cameras-user-name">{user.name || '—'}</div>
                        <div className="cameras-user-profile">{user.profile || '—'}</div>
                      </td>
                      <td>{user.email || '—'}</td>
                      <td>
                        <span
                          className={`cameras-badge${user.linked_to_agent ? ' linked' : ' unlinked'}`}
                        >
                          {user.linked_to_agent ? 'Com agente' : 'Sem agente'}
                        </span>
                      </td>
                      <td>{user.agents_count || 0}</td>
                      <td>
                        <strong className={user.cameras_active > 0 ? 'cameras-active-count' : ''}>
                          {user.cameras_active || 0}
                        </strong>
                        <span className="cameras-total-count">
                          {' '}
                          / {user.cameras_total || 0}
                        </span>
                      </td>
                      <td>
                        {user.linked_to_agent ? (
                          <div className="cameras-agent-details">
                            {(user.agents || []).map((agent) => (
                              <div key={`${user.id}-${agent.stream_api}`} className="cameras-agent-line">
                                <span className="cameras-agent-url">{agent.stream_api}</span>
                                <span className="cameras-agent-meta">
                                  {agent.cameras_active}/{agent.cameras_total} ativas
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="cameras-muted">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CamerasManagement;

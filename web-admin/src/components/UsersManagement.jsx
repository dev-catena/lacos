import React, { useState, useEffect, useMemo, useCallback } from 'react';
import SafeIcon from './SafeIcon';
import usersService from '../services/usersService';
import authService from '../services/authService';
import './UsersManagement.css';

const UsersManagement = ({ currentUser, onLogout }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Carregar filtro salvo do localStorage ou usar 'all' como padrão
  const getInitialFilter = () => {
    const savedFilter = localStorage.getItem('@lacos:usersFilter');
    return savedFilter || 'all';
  };
  
  const [filter, setFilter] = useState(getInitialFilter()); // all, active, blocked
  const [searchText, setSearchText] = useState('');
  const [sortColumn, setSortColumn] = useState('name'); // Coluna para ordenar
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' ou 'desc'

  // Modal trocar senha
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [userForPassword, setUserForPassword] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [accompaniedModalUser, setAccompaniedModalUser] = useState(null);
  const [accompaniedModalData, setAccompaniedModalData] = useState(null);
  const [accompaniedModalLoading, setAccompaniedModalLoading] = useState(false);
  const [accompaniedModalError, setAccompaniedModalError] = useState('');

  /** Modal: detalhe de um grupo (membros) ao clicar no chip na linha do usuário */
  const [groupDetailState, setGroupDetailState] = useState(null);
  const [groupDetailPayload, setGroupDetailPayload] = useState(null);
  const [groupDetailLoading, setGroupDetailLoading] = useState(false);
  const [groupDetailError, setGroupDetailError] = useState('');

  // Salvar filtro no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem('@lacos:usersFilter', filter);
  }, [filter]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await usersService.getAllUsers();
      // Se for array, usar diretamente; se for objeto com data, extrair
      setUsers(Array.isArray(data) ? data : (data.data || data.items || []));
    } catch (err) {
      const errorMessage = err.message || 'Erro ao carregar usuários. Verifique se você tem permissão de root.';
      setError(errorMessage);
      console.error('Erro detalhado:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId) => {
    if (!window.confirm('Tem certeza que deseja bloquear este usuário? Ele não conseguirá mais fazer login.')) {
      return;
    }

    try {
      setError(null);
      await usersService.blockUser(userId);
      
      // Verificar se o usuário bloqueado é o usuário atual
      if (currentUser && currentUser.id === userId) {
        // Usuário bloqueou a si mesmo, fazer logout
        alert('Você bloqueou sua própria conta. Você será desconectado agora.');
        if (onLogout) {
          onLogout();
        } else {
          authService.logout();
          window.location.reload();
        }
        return;
      }
      
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Erro ao bloquear usuário');
    }
  };

  const handleUnblockUser = async (userId) => {
    if (!window.confirm('Tem certeza que deseja desbloquear este usuário?')) {
      return;
    }

    try {
      setError(null);
      await usersService.unblockUser(userId);
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Erro ao desbloquear usuário');
    }
  };

  const openPasswordModal = (user) => {
    setUserForPassword(user);
    setNewPassword('');
    setNewPasswordConfirm('');
    setPasswordError('');
    setShowPasswordModal(true);
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setUserForPassword(null);
    setNewPassword('');
    setNewPasswordConfirm('');
    setPasswordError('');
  };

  const handleChangePassword = async () => {
    if (!userForPassword) return;
    if (newPassword.length < 6) {
      setPasswordError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setPasswordError('As senhas não conferem.');
      return;
    }

    try {
      setPasswordLoading(true);
      setPasswordError('');
      await usersService.changePassword(userForPassword.id, newPassword, newPasswordConfirm);
      alert('Senha alterada com sucesso!');
      closePasswordModal();
    } catch (err) {
      setPasswordError(err.message || 'Erro ao alterar senha');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    const user = users.find(u => u.id === userId);
    const userName = user?.name || 'este usuário';
    
    if (!window.confirm(`ATENÇÃO: Tem certeza que deseja EXCLUIR permanentemente ${userName}?\n\nEsta ação não pode ser desfeita. Todos os dados do usuário serão removidos.`)) {
      return;
    }

    // Confirmação dupla para exclusão
    if (!window.confirm(`Confirma a exclusão permanente de ${userName}?\n\nDigite "EXCLUIR" para confirmar (não implementado - apenas confirme novamente).`)) {
      return;
    }

    try {
      setError(null);
      
      // Verificar se é o usuário atual
      if (currentUser && currentUser.id === userId) {
        alert('Você não pode excluir sua própria conta. Use a opção de deletar conta no seu perfil.');
        return;
      }

      await usersService.deleteUser(userId);
      alert('Usuário excluído com sucesso!');
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Erro ao excluir usuário');
    }
  };

  const getProfileLabel = useCallback((profile) => {
    // Se profile for null, undefined ou string vazia, retornar "Não definido"
    if (!profile || profile === null || profile === undefined || profile.trim() === '') {
      return 'Não definido';
    }
    
    const profiles = {
      'doctor': 'Médico',
      'caregiver': 'Cuidador/Amigo',
      'professional_caregiver': 'Cuidador Profissional',
      'patient': 'Paciente',
      'accompanied': 'Acompanhado',
    };
    
    // Se o perfil estiver no mapeamento, retornar a tradução
    if (profiles[profile]) {
      return profiles[profile];
    }
    
    // Se não estiver mapeado mas tiver valor, retornar o valor original
    return profile;
  }, []);

  const isAccompaniedProfile = useCallback((user) => {
    const p = String(user?.profile || '').toLowerCase();
    return p === 'accompanied' || p === 'patient';
  }, []);

  const openAccompaniedModal = async (user) => {
    if (!isAccompaniedProfile(user)) return;
    setAccompaniedModalUser(user);
    setAccompaniedModalData(null);
    setAccompaniedModalError('');
    setAccompaniedModalLoading(true);
    try {
      const data = await usersService.getAccompaniedCareContext(user.id);
      setAccompaniedModalData(data);
    } catch (err) {
      setAccompaniedModalError(err.message || 'Erro ao carregar grupos e membros.');
    } finally {
      setAccompaniedModalLoading(false);
    }
  };

  const closeAccompaniedModal = () => {
    setAccompaniedModalUser(null);
    setAccompaniedModalData(null);
    setAccompaniedModalError('');
    setAccompaniedModalLoading(false);
  };

  const openGroupDetailModal = async (user, groupChip) => {
    setGroupDetailState({ user, groupChip });
    setGroupDetailPayload(null);
    setGroupDetailError('');
    setGroupDetailLoading(true);
    try {
      const data = await usersService.getGroupAdminDetail(groupChip.id);
      setGroupDetailPayload(data.group || null);
    } catch (err) {
      setGroupDetailError(err.message || 'Erro ao carregar grupo.');
      setGroupDetailPayload(null);
    } finally {
      setGroupDetailLoading(false);
    }
  };

  const closeGroupDetailModal = () => {
    setGroupDetailState(null);
    setGroupDetailPayload(null);
    setGroupDetailError('');
    setGroupDetailLoading(false);
  };

  // Função para ordenar
  const handleSort = (column) => {
    if (sortColumn === column) {
      // Se já está ordenando por esta coluna, inverte a direção
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Nova coluna, começa com ascendente
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Função para obter ícone de ordenação
  const getSortIcon = (column) => {
    if (sortColumn !== column) {
      return '⇅'; // Ícone neutro
    }
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  // Filtrar e ordenar usuários
  const filteredAndSortedUsers = useMemo(() => {
    let result = users.filter((user) => {
      // Filtro por status
      if (filter === 'blocked' && !user.is_blocked) return false;
      if (filter === 'active' && user.is_blocked) return false;
      
      // Filtro por busca: nome do usuário ou nome/código dos grupos dele
      if (searchText.trim()) {
        const searchLower = searchText.toLowerCase().trim();
        const userName = (user.name || '').toLowerCase();
        const nameMatches = userName.includes(searchLower);
        const groups = user.groups || [];
        const groupMatches = groups.some((g) => {
          const gName = (g.name || '').toLowerCase();
          const gCode = (g.code || '').toLowerCase();
          return gName.includes(searchLower) || gCode.includes(searchLower);
        });
        if (!nameMatches && !groupMatches) return false;
      }
      
      return true;
    });

    // Ordenar
    result.sort((a, b) => {
      let aValue, bValue;

      switch (sortColumn) {
        case 'id':
          aValue = a.id || 0;
          bValue = b.id || 0;
          break;
        case 'name':
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
          break;
        case 'email':
          aValue = (a.email || '').toLowerCase();
          bValue = (b.email || '').toLowerCase();
          break;
        case 'profile':
          aValue = getProfileLabel(a.profile);
          bValue = getProfileLabel(b.profile);
          break;
        case 'plan':
          aValue = (a.plan?.name || 'N/A').toLowerCase();
          bValue = (b.plan?.name || 'N/A').toLowerCase();
          break;
        case 'status':
          aValue = a.is_blocked ? 1 : 0;
          bValue = b.is_blocked ? 1 : 0;
          break;
        case 'created_at':
          aValue = a.created_at ? new Date(a.created_at).getTime() : 0;
          bValue = b.created_at ? new Date(b.created_at).getTime() : 0;
          break;
        default:
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [users, filter, searchText, sortColumn, sortDirection, getProfileLabel]);

  if (loading) {
    return (
      <div className="users-management">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Carregando usuários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="users-management">
      <header className="section-header">
        <div>
          <h1>Gestão de Usuários</h1>
          <p className="subtitle">
            Gerencie os usuários da plataforma. Usuários bloqueados verão &quot;Acesso negado&quot; ao tentar fazer login.
            Em cada linha, use os <strong>grupos</strong> ao lado do nome para ver todos os membros do grupo. Para perfil{' '}
            <strong>Acompanhado</strong> ou <strong>Paciente</strong>, você também pode clicar no perfil para ver o contexto de cuidado.
          </p>
        </div>
        <button className="refresh-button" onClick={loadUsers}>
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

      {/* Busca + dica sobre grupos na linha */}
      <div className="search-toolbar">
        <div className="search-container search-container--toolbar">
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por nome, grupo ou código..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          {searchText && (
            <button
              className="clear-search-btn"
              onClick={() => setSearchText('')}
              title="Limpar busca"
            >
              ✕
            </button>
          )}
        </div>
        <p className="search-toolbar__hint">
          A busca inclui o <strong>nome do usuário</strong> e os <strong>nomes (e códigos) dos grupos</strong> em que ele participa.
          Clique num grupo para ver admin e todos os membros ativos.
        </p>
      </div>

      <div className="filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Todos ({users.length})
        </button>
        <button
          className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
          onClick={() => setFilter('active')}
        >
          Ativos ({users.filter(u => !u.is_blocked).length})
        </button>
        <button
          className={`filter-btn ${filter === 'blocked' ? 'active' : ''}`}
          onClick={() => setFilter('blocked')}
        >
          Bloqueados ({users.filter(u => u.is_blocked).length})
        </button>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>
                <button
                  className="sortable-header"
                  onClick={() => handleSort('id')}
                  title="Ordenar por ID"
                >
                  ID {getSortIcon('id')}
                </button>
              </th>
              <th>
                <button
                  className="sortable-header"
                  onClick={() => handleSort('name')}
                  title="Ordenar por Nome"
                >
                  Nome {getSortIcon('name')}
                </button>
              </th>
              <th>Grupos</th>
              <th>
                <button
                  className="sortable-header"
                  onClick={() => handleSort('email')}
                  title="Ordenar por Email"
                >
                  Email {getSortIcon('email')}
                </button>
              </th>
              <th>
                <button
                  className="sortable-header"
                  onClick={() => handleSort('profile')}
                  title="Ordenar por Perfil"
                >
                  Perfil {getSortIcon('profile')}
                </button>
              </th>
              <th>
                <button
                  className="sortable-header"
                  onClick={() => handleSort('plan')}
                  title="Ordenar por Plano"
                >
                  Plano {getSortIcon('plan')}
                </button>
              </th>
              <th>
                <button
                  className="sortable-header"
                  onClick={() => handleSort('status')}
                  title="Ordenar por Status"
                >
                  Status {getSortIcon('status')}
                </button>
              </th>
              <th>
                <button
                  className="sortable-header"
                  onClick={() => handleSort('created_at')}
                  title="Ordenar por Data de Solicitação de Criação de Conta"
                >
                  Data de Solicitação {getSortIcon('created_at')}
                </button>
              </th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedUsers.length === 0 ? (
              <tr>
                <td colSpan="9" className="empty-state">
                  {searchText ? `Nenhum usuário encontrado para "${searchText}" (nome ou grupo)` : 'Nenhum usuário encontrado'}
                </td>
              </tr>
            ) : (
              filteredAndSortedUsers.map((user) => (
                <tr key={user.id} className={user.is_blocked ? 'blocked' : ''}>
                  <td>{user.id}</td>
                  <td>
                    <div className="user-info">
                      <strong>{user.name || 'Sem nome'}</strong>
                    </div>
                  </td>
                  <td className="user-groups-cell">
                    {user.groups && user.groups.length > 0 ? (
                      <div className="user-group-chips" role="list">
                        {user.groups.map((g) => (
                          <button
                            key={g.id}
                            type="button"
                            className="group-chip"
                            title={`Ver membros de ${g.name}`}
                            onClick={() => openGroupDetailModal(user, g)}
                          >
                            {g.name || `Grupo #${g.id}`}
                            {g.code ? <span className="group-chip__code">{g.code}</span> : null}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className="user-groups-empty">—</span>
                    )}
                  </td>
                  <td>{user.email}</td>
                  <td>
                    {isAccompaniedProfile(user) ? (
                      <button
                        type="button"
                        className="profile-badge profile-badge--clickable"
                        onClick={() => openAccompaniedModal(user)}
                        title="Ver grupo de cuidado e membros"
                      >
                        {getProfileLabel(user.profile)}
                      </button>
                    ) : (
                      <span className="profile-badge">
                        {getProfileLabel(user.profile)}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="plan-badge">
                      {user.plan?.name || 'N/A'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${user.is_blocked ? 'blocked' : 'active'}`}>
                      {user.is_blocked ? (
                        <>
                          <SafeIcon name="block" size={16} color="#ef4444" style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                          Bloqueado
                        </>
                      ) : (
                        <>
                          <SafeIcon name="checkmark" size={16} color="#10b981" style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                          Ativo
                        </>
                      )}
                    </span>
                  </td>
                  <td>
                    {user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A'}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="action-btn password-btn-change"
                        onClick={() => openPasswordModal(user)}
                        title="Trocar senha do usuário"
                      >
                        🔑 Trocar senha
                      </button>
                      {user.is_blocked ? (
                        <button
                          className="action-btn unblock-btn"
                          onClick={() => handleUnblockUser(user.id)}
                          title="Desbloquear usuário"
                        >
                          Desbloquear
                        </button>
                      ) : (
                        <button
                          className="action-btn block-btn"
                          onClick={() => handleBlockUser(user.id)}
                          title="Bloquear usuário"
                        >
                          Bloquear
                        </button>
                      )}
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleDeleteUser(user.id)}
                        title="Excluir usuário permanentemente"
                      >
                        <SafeIcon name="trash" size={18} color="white" style={{ marginRight: '6px' }} />
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {accompaniedModalUser && (
        <div className="accompanied-modal-overlay" onClick={closeAccompaniedModal}>
          <div className="accompanied-modal" onClick={(e) => e.stopPropagation()}>
            <div className="accompanied-modal__header">
              <h3>Grupo e membros</h3>
              <button type="button" className="accompanied-modal__close" onClick={closeAccompaniedModal} aria-label="Fechar">
                ×
              </button>
            </div>
            <p className="accompanied-modal__user">
              <strong>{accompaniedModalUser.name}</strong>
              {' · '}
              {accompaniedModalUser.email}
            </p>
            {accompaniedModalLoading && <p className="accompanied-modal__loading">Carregando…</p>}
            {accompaniedModalError && (
              <div className="accompanied-modal__error" role="alert">
                {accompaniedModalError}
              </div>
            )}
            {!accompaniedModalLoading && accompaniedModalData?.groups && (
              <div className="accompanied-modal__body">
                {accompaniedModalData.groups.length === 0 ? (
                  <p className="accompanied-modal__empty">
                    Nenhum vínculo ativo em grupo encontrado para este usuário.
                  </p>
                ) : (
                  accompaniedModalData.groups.map((g) => (
                    <section key={g.id} className="accompanied-modal__group">
                      <h4>{g.name}</h4>
                      <ul className="accompanied-modal__meta">
                        {g.code && (
                          <li>
                            <span>Código do grupo:</span> {g.code}
                          </li>
                        )}
                        {g.accompanied_name && (
                          <li>
                            <span>Nome do acompanhado (cadastro grupo):</span> {g.accompanied_name}
                          </li>
                        )}
                        {(g.admin_name || g.admin_email) && (
                          <li>
                            <span>Administrador do grupo:</span>{' '}
                            {[g.admin_name, g.admin_email].filter(Boolean).join(' · ')}
                          </li>
                        )}
                      </ul>
                      <p className="accompanied-modal__members-title">Membros ativos</p>
                      <div className="accompanied-modal__table-wrap">
                        <table className="accompanied-modal__table">
                          <thead>
                            <tr>
                              <th>Nome</th>
                              <th>E-mail</th>
                              <th>Papel no grupo</th>
                            </tr>
                          </thead>
                          <tbody>
                            {g.members && g.members.length > 0 ? (
                              g.members.map((m) => (
                                <tr key={m.member_id}>
                                  <td>{m.name || '—'}</td>
                                  <td>{m.email || '—'}</td>
                                  <td>{m.role_label || m.role || '—'}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={3}>Nenhum membro listado.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {groupDetailState && (
        <div className="accompanied-modal-overlay" onClick={closeGroupDetailModal}>
          <div className="accompanied-modal" onClick={(e) => e.stopPropagation()}>
            <div className="accompanied-modal__header">
              <h3>Membros do grupo</h3>
              <button type="button" className="accompanied-modal__close" onClick={closeGroupDetailModal} aria-label="Fechar">
                ×
              </button>
            </div>
            <p className="accompanied-modal__user">
              <strong>{groupDetailState.groupChip?.name || 'Grupo'}</strong>
              {' · '}
              Linha: <strong>{groupDetailState.user?.name}</strong> ({groupDetailState.user?.email})
            </p>
            {groupDetailLoading && <p className="accompanied-modal__loading">Carregando…</p>}
            {groupDetailError && (
              <div className="accompanied-modal__error" role="alert">
                {groupDetailError}
              </div>
            )}
            {!groupDetailLoading && groupDetailPayload && (
              <div className="accompanied-modal__body">
                <section className="accompanied-modal__group">
                  <ul className="accompanied-modal__meta">
                    {groupDetailPayload.code ? (
                      <li>
                        <span>Código do grupo:</span> {groupDetailPayload.code}
                      </li>
                    ) : null}
                    {groupDetailPayload.accompanied_name ? (
                      <li>
                        <span>Nome do acompanhado (cadastro):</span> {groupDetailPayload.accompanied_name}
                      </li>
                    ) : null}
                    {(groupDetailPayload.admin_name || groupDetailPayload.admin_email) ? (
                      <li>
                        <span>Administrador do grupo:</span>{' '}
                        {[groupDetailPayload.admin_name, groupDetailPayload.admin_email].filter(Boolean).join(' · ')}
                      </li>
                    ) : null}
                  </ul>
                  <p className="accompanied-modal__members-title">Membros ativos</p>
                  <div className="accompanied-modal__table-wrap">
                    <table className="accompanied-modal__table">
                      <thead>
                        <tr>
                          <th>Nome</th>
                          <th>E-mail</th>
                          <th>Perfil</th>
                          <th>Papel no grupo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupDetailPayload.members && groupDetailPayload.members.length > 0 ? (
                          groupDetailPayload.members.map((m) => (
                            <tr key={m.member_id}>
                              <td>{m.name || '—'}</td>
                              <td>{m.email || '—'}</td>
                              <td>{m.profile || '—'}</td>
                              <td>{m.role_label || m.role || '—'}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4}>Nenhum membro listado.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Trocar Senha */}
      {showPasswordModal && userForPassword && (
        <div className="password-modal-overlay" onClick={closePasswordModal}>
          <div className="password-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Trocar senha de {userForPassword.name}</h3>
            <p style={{ margin: '0 0 1rem 0', color: '#6b7280', fontSize: '0.9375rem' }}>
              Defina uma nova senha para {userForPassword.email}
            </p>
            <div className="form-group">
              <label htmlFor="new-password">Nova senha (mín. 6 caracteres)</label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setPasswordError(''); }}
                placeholder="Digite a nova senha"
                autoComplete="new-password"
              />
            </div>
            <div className="form-group">
              <label htmlFor="new-password-confirm">Confirmar nova senha</label>
              <input
                id="new-password-confirm"
                type="password"
                value={newPasswordConfirm}
                onChange={(e) => { setNewPasswordConfirm(e.target.value); setPasswordError(''); }}
                placeholder="Repita a nova senha"
                autoComplete="new-password"
              />
            </div>
            {passwordError && (
              <div style={{ color: '#dc2626', fontSize: '0.875rem', marginBottom: '1rem' }}>
                {passwordError}
              </div>
            )}
            <div className="password-modal-actions">
              <button className="password-btn password-btn-cancel" onClick={closePasswordModal}>
                Cancelar
              </button>
              <button
                className="password-btn password-btn-submit"
                onClick={handleChangePassword}
                disabled={passwordLoading || !newPassword || !newPasswordConfirm}
              >
                {passwordLoading ? 'Salvando...' : 'Salvar nova senha'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManagement;


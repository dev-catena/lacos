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
    const profiles = {
      'doctor': 'Médico',
      'caregiver': 'Cuidador/Amigo',
      'professional_caregiver': 'Cuidador Profissional',
      'patient': 'Paciente',
    };
    return profiles[profile] || profile || 'N/A';
  }, []);

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
      
      // Filtro por busca no nome
      if (searchText.trim()) {
        const searchLower = searchText.toLowerCase().trim();
        const userName = (user.name || '').toLowerCase();
        if (!userName.includes(searchLower)) return false;
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
            Gerencie os usuários da plataforma. Usuários bloqueados verão "Acesso negado" ao tentar fazer login.
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

      {/* Campo de busca por nome */}
      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Buscar por nome..."
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
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedUsers.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-state">
                  {searchText ? `Nenhum usuário encontrado com "${searchText}"` : 'Nenhum usuário encontrado'}
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
                  <td>{user.email}</td>
                  <td>
                    <span className="profile-badge">
                      {getProfileLabel(user.profile)}
                    </span>
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
                    <div className="action-buttons">
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
    </div>
  );
};

export default UsersManagement;


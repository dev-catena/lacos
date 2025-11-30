import apiService from './apiService';

class ActivityService {
  /**
   * Buscar atividades recentes de todos os grupos do usuário
   */
  async getRecentActivities(limit = 10) {
    try {
      console.log(`📊 Buscando últimas ${limit} atividades...`);
      const response = await apiService.get(`/activities/recent?limit=${limit}`);
      console.log(`✅ ${response.length} atividades encontradas`);
      return { success: true, data: response };
    } catch (error) {
      console.error('❌ Erro ao buscar atividades:', error);
      return {
        success: false,
        error: error.message || 'Erro ao buscar atividades'
      };
    }
  }

  /**
   * Buscar atividades de um grupo específico
   */
  async getGroupActivities(groupId, limit = 20) {
    try {
      console.log(`📋 Buscando atividades do grupo ${groupId}...`);
      const response = await apiService.get(`/groups/${groupId}/activities?limit=${limit}`);
      console.log(`✅ ${response.length} atividades encontradas`);
      return { success: true, data: response };
    } catch (error) {
      console.error('❌ Erro ao buscar atividades do grupo:', error);
      return {
        success: false,
        error: error.message || 'Erro ao buscar atividades'
      };
    }
  }

  /**
   * Helper: Traduzir tipo de atividade
   */
  getActivityTypeLabel(actionType) {
    const labels = {
      member_joined: 'Novo Membro',
      member_promoted: 'Promoção',
      member_removed: 'Remoção',
      patient_changed: 'Paciente Alterado',
      group_created: 'Grupo Criado',
      group_updated: 'Grupo Atualizado',
      medication_created: 'Medicamento Cadastrado',
      medication_updated: 'Medicamento Atualizado',
      medication_discontinued: 'Medicamento Descontinuado',
      document_created: 'Documento Adicionado',
      consultation_created: 'Consulta Agendada',
      occurrence_created: 'Ocorrência Registrada',
    };
    return labels[actionType] || actionType;
  }

  /**
   * Helper: Ícone para tipo de atividade
   */
  getActivityIcon(actionType) {
    const icons = {
      member_joined: 'person-add',
      member_promoted: 'arrow-up-circle',
      member_removed: 'person-remove',
      patient_changed: 'swap-horizontal',
      group_created: 'add-circle',
      group_updated: 'create',
      medication_created: 'medical',
      medication_updated: 'create-outline',
      medication_discontinued: 'close-circle',
      document_created: 'document-text',
      consultation_created: 'calendar',
      occurrence_created: 'warning',
    };
    return icons[actionType] || 'notifications';
  }

  /**
   * Helper: Cor para tipo de atividade
   */
  getActivityColor(actionType) {
    const colors = {
      member_joined: '#4CAF50', // Verde
      member_promoted: '#2196F3', // Azul
      member_removed: '#F44336', // Vermelho
      patient_changed: '#FF9800', // Laranja
      group_created: '#9C27B0', // Roxo
      group_updated: '#607D8B', // Cinza azulado
      medication_created: '#4CAF50', // Verde
      medication_updated: '#2196F3', // Azul
      medication_discontinued: '#F44336', // Vermelho
      document_created: '#FF9800', // Laranja
      consultation_created: '#9C27B0', // Roxo
      occurrence_created: '#F44336', // Vermelho
    };
    return colors[actionType] || '#757575';
  }
}

export default new ActivityService();


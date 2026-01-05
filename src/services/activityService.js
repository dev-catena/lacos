import apiService from './apiService';

class ActivityService {
  /**
   * Buscar atividades recentes de todos os grupos do usuário
   */
  async getRecentActivities(limit = 10) {
    try {
      console.log(`📊 Buscando últimas ${limit} atividades...`);
      // Usar timeout maior para atividades (30 segundos)
      const response = await apiService.get(`/activities/recent?limit=${limit}`, {
        timeout: 30000, // 30 segundos
      });
      
      // Verificar se a resposta é um array ou objeto com data
      let activities = [];
      if (Array.isArray(response)) {
        activities = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        activities = response.data;
      } else if (response && response.success && response.data && Array.isArray(response.data)) {
        activities = response.data;
      }
      
      console.log(`✅ ${activities.length} atividades encontradas`);
      return { success: true, data: activities };
    } catch (error) {
      // Se for timeout (408), retornar array vazio em vez de erro
      if (error.status === 408) {
        console.warn('⚠️ Timeout ao buscar atividades, retornando array vazio');
        return { success: true, data: [] };
      }
      console.error('❌ Erro ao buscar atividades:', error);
      return {
        success: false,
        error: error.message || 'Erro ao buscar atividades',
        data: [] // Retornar array vazio em caso de erro
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
      medication_completed: 'Medicamento Concluído',
      document_created: 'Documento Adicionado',
      consultation_created: 'Consulta Agendada',
      appointment_created: 'Compromisso Agendado',
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
      medication_completed: 'checkmark-done-circle',
      document_created: 'document-text',
      consultation_created: 'calendar',
      appointment_created: 'calendar-outline',
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
      medication_completed: '#4CAF50', // Verde (concluído)
      document_created: '#FF9800', // Laranja
      consultation_created: '#9C27B0', // Roxo
      appointment_created: '#2196F3', // Azul
      occurrence_created: '#F44336', // Vermelho
    };
    return colors[actionType] || '#757575';
  }
}

export default new ActivityService();


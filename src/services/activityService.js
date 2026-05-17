import apiService from './apiService';

class ActivityService {
  /**
   * Ajustes de texto legado na UI quando a API ainda devolve frases antigas (ex.: produção sem deploy).
   */
  normalizeActivityDescription(description) {
    if (description == null || typeof description !== 'string') {
      return description;
    }
    // Sem \b: em motores JS antigos, limites de palavra com acentos podem falhar.
    return description
      .replace(/agendou\s+um\s+consulta\s+médica/giu, 'agendou uma consulta médica')
      .replace(/agendou\s+um\s+sessão/giu, 'agendou uma sessão');
  }

  /**
   * Para cartões "consulta médica" na Home: 1ª linha só o ato, 2ª linha Dra./Dr. — clínica/especialidade.
   */
  splitMedicalAppointmentHomeLines(description, actionType, metadata) {
    if (!description || typeof description !== 'string') {
      return { mode: 'single', text: description };
    }
    if (actionType !== 'appointment_created') {
      return { mode: 'single', text: description };
    }
    const metaType = metadata && metadata.appointment_type;
    const looksMedical =
      metaType === 'medical' ||
      /\bagendou\s+(?:um|uma)\s+consulta\s+médica\s*:/iu.test(description);
    if (!looksMedical) {
      return { mode: 'single', text: description };
    }
    const m = description.match(
      /^(.+?)\s+agendou\s+(?:um|uma)\s+consulta\s+médica:\s*(.+?)\s+para\s+\d{2}\/\d{2}\/\d{4}\s*$/iu
    );
    if (!m) {
      return { mode: 'single', text: description };
    }
    const actor = m[1].trim();
    let doctorLine = m[2].trim();
    const DEFAULT_CLINIC = 'Clínica Médica';
    const hasClinicOrSpecialty = /\s[—–-]\s/.test(doctorLine);
    if (!hasClinicOrSpecialty) {
      doctorLine = `${doctorLine} — ${DEFAULT_CLINIC}`;
    }
    return {
      mode: 'split',
      headline: `${actor} agendou uma consulta`,
      doctorLine,
    };
  }

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
      group_photo_updated: 'Foto do Grupo Atualizada',
      medication_created: 'Medicamento Cadastrado',
      medication_updated: 'Medicamento Atualizado',
      medication_discontinued: 'Medicamento Descontinuado',
      medication_completed: 'Medicamento Concluído',
      prescription_created: 'Receita Médica Criada',
      document_created: 'Documento Adicionado',
      consultation_created: 'Consulta Agendada',
      appointment_created: 'Compromisso Agendado',
      appointment_cancelled: 'Consulta Cancelada',
      occurrence_created: 'Ocorrência Registrada',
      vital_sign_recorded: 'Sinal Vital Registrado',
      smartwatch_registered: 'Smartwatch Registrado',
      caregiver_hired: 'Cuidador Contratado',
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
      group_photo_updated: 'image',
      medication_created: 'medical',
      medication_updated: 'create-outline',
      medication_discontinued: 'close-circle',
      medication_completed: 'checkmark-done-circle',
      prescription_created: 'document-text',
      document_created: 'document-text',
      consultation_created: 'calendar',
      appointment_created: 'calendar-outline',
      appointment_cancelled: 'close-circle',
      occurrence_created: 'warning',
      vital_sign_recorded: 'pulse',
      smartwatch_registered: 'watch',
      caregiver_hired: 'person-add',
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
      group_photo_updated: '#9C27B0', // Roxo
      medication_created: '#4CAF50', // Verde
      medication_updated: '#2196F3', // Azul
      medication_discontinued: '#F44336', // Vermelho
      medication_completed: '#4CAF50', // Verde (concluído)
      prescription_created: '#FF9800', // Laranja
      document_created: '#FF9800', // Laranja
      consultation_created: '#9C27B0', // Roxo
      appointment_created: '#2196F3', // Azul
      appointment_cancelled: '#F44336', // Vermelho
      occurrence_created: '#F44336', // Vermelho
      vital_sign_recorded: '#E91E63', // Rosa
      smartwatch_registered: '#00BCD4', // Ciano
      caregiver_hired: '#4CAF50', // Verde
    };
    return colors[actionType] || '#757575';
  }

  /**
   * Deletar uma atividade/notificação
   */
  async deleteActivity(activityId) {
    try {
      console.log(`🗑️ Deletando atividade ${activityId}...`);
      const response = await apiService.delete(`/activities/${activityId}`);
      console.log(`✅ Atividade ${activityId} deletada com sucesso`);
      return { success: true, data: response };
    } catch (error) {
      console.error(`❌ Erro ao deletar atividade ${activityId}:`, error);
      return {
        success: false,
        error: error.message || 'Erro ao deletar atividade',
      };
    }
  }
}

export default new ActivityService();


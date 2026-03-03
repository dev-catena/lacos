import apiService from './apiService';

class GroupMemberService {
  /**
   * Listar membros de um grupo
   */
  async getGroupMembers(groupId) {
    try {
      console.log(`📋 Buscando membros do grupo ${groupId}...`);
      const response = await apiService.get(`/groups/${groupId}/members`);
      
      let membersArray = [];
      try {
        if (response && typeof response === 'object') {
          const responseData = response?.data;
          if (responseData && Array.isArray(responseData)) {
            membersArray = responseData;
          } else if (Array.isArray(response)) {
            membersArray = response;
          } else if (response?.success && responseData && Array.isArray(responseData)) {
            membersArray = responseData;
          }
        }
      } catch (parseErr) {
        console.warn('⚠️ groupMemberService - Resposta inesperada, usando array vazio:', parseErr?.message);
      }
      
      console.log(`✅ ${membersArray.length} membros encontrados`);
      return { success: true, data: membersArray };
    } catch (error) {
      console.error('❌ Erro ao buscar membros:', error);
      return {
        success: false,
        error: error.message || 'Erro ao buscar membros do grupo'
      };
    }
  }

  /**
   * Promover membro para admin
   */
  async promoteMemberToAdmin(groupId, memberId) {
    try {
      console.log(`⬆️ Promovendo membro ${memberId} para admin no grupo ${groupId}...`);
      const response = await apiService.put(`/groups/${groupId}/members/${memberId}/role`, {
        role: 'admin',
      });
      console.log('✅ Membro promovido para admin');
      return { success: true, data: response };
    } catch (error) {
      console.error('❌ Erro ao promover membro:', error);
      return {
        success: false,
        error: error.message || 'Erro ao promover membro'
      };
    }
  }

  /**
   * Rebaixar admin para cuidador
   */
  async demoteAdminToCaregiver(groupId, memberId) {
    try {
      console.log(`⬇️ Rebaixando admin ${memberId} para cuidador no grupo ${groupId}...`);
      const response = await apiService.put(`/groups/${groupId}/members/${memberId}/role`, {
        role: 'caregiver',
      });
      console.log('✅ Admin rebaixado para cuidador');
      return { success: true, data: response };
    } catch (error) {
      console.error('❌ Erro ao rebaixar admin:', error);
      return {
        success: false,
        error: error.message || 'Erro ao rebaixar admin'
      };
    }
  }

  /**
   * Trocar paciente do grupo
   */
  async changePatient(groupId, currentPatientId, newPatientId) {
    try {
      console.log(`🔄 Trocando paciente no grupo ${groupId}: ${currentPatientId} → ${newPatientId}...`);
      
      // Primeiro, remover role de patient do atual
      if (currentPatientId) {
        await apiService.put(`/groups/${groupId}/members/${currentPatientId}/role`, {
          role: 'caregiver',
        });
      }

      // Depois, adicionar role de patient ao novo
      const response = await apiService.put(`/groups/${groupId}/members/${newPatientId}/role`, {
        role: 'patient',
      });

      console.log('✅ Paciente alterado com sucesso');
      return { success: true, data: response };
    } catch (error) {
      console.error('❌ Erro ao trocar paciente:', error);
      return {
        success: false,
        error: error.message || 'Erro ao trocar paciente'
      };
    }
  }

  /**
   * Remover membro do grupo
   */
  async removeMember(groupId, memberId) {
    try {
      console.log(`🗑️ Removendo membro ${memberId} do grupo ${groupId}...`);
      await apiService.delete(`/groups/${groupId}/members/${memberId}`);
      console.log('✅ Membro removido com sucesso');
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao remover membro:', error);
      return {
        success: false,
        error: error.message || 'Erro ao remover membro'
      };
    }
  }
}

export default new GroupMemberService();


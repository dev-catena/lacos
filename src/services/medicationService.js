import apiService from './apiService';

/**
 * Serviço para gerenciar medicamentos
 */
class MedicationService {
  /**
   * Criar novo medicamento
   */
  async createMedication(medicationData) {
    try {
      const data = {
        group_id: medicationData.groupId,
        doctor_id: medicationData.doctorId || null, // Incluir doctor_id se houver
        name: medicationData.name,
        pharmaceutical_form: medicationData.form, // Backend espera 'pharmaceutical_form'
        dosage: medicationData.dosage,
        unit: medicationData.unit,
        administration_route: medicationData.administrationRoute,
        frequency_type: medicationData.frequencyType,
        frequency_details: medicationData.frequencyDetails,
        first_dose_at: medicationData.firstDoseAt,
        duration_type: medicationData.durationType,
        duration_value: medicationData.durationValue,
        notes: medicationData.notes,
        is_active: medicationData.isActive !== false, // Default true
      };

      const response = await apiService.post('/medications', data);
      return { success: true, data: response };
    } catch (error) {
      console.error('Erro ao criar medicamento:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao criar medicamento' 
      };
    }
  }

  /**
   * Listar medicamentos de um grupo
   */
  async getMedications(groupId = null) {
    try {
      let endpoint = '/medications';
      if (groupId) {
        endpoint += `?group_id=${groupId}`;
      }

      const response = await apiService.get(endpoint);
      return { success: true, data: response };
    } catch (error) {
      console.error('Erro ao buscar medicamentos:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao buscar medicamentos' 
      };
    }
  }

  /**
   * Obter detalhes de um medicamento específico
   */
  async getMedication(medicationId) {
    try {
      const endpoint = apiService.replaceParams('/medications/:id', { id: medicationId });
      const response = await apiService.get(endpoint);
      return { success: true, data: response };
    } catch (error) {
      console.error('Erro ao buscar medicamento:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao buscar medicamento' 
      };
    }
  }

  /**
   * Atualizar medicamento
   */
  async updateMedication(medicationId, medicationData) {
    try {
      const endpoint = apiService.replaceParams('/medications/:id', { id: medicationId });
      const data = {
        name: medicationData.name,
        pharmaceutical_form: medicationData.form, // Backend espera 'pharmaceutical_form'
        dosage: medicationData.dosage,
        unit: medicationData.unit,
        administration_route: medicationData.administrationRoute,
        frequency_type: medicationData.frequencyType,
        frequency_details: medicationData.frequencyDetails,
        first_dose_at: medicationData.firstDoseAt,
        duration_type: medicationData.durationType,
        duration_value: medicationData.durationValue,
        notes: medicationData.notes,
        is_active: medicationData.isActive,
      };

      const response = await apiService.put(endpoint, data);
      return { success: true, data: response };
    } catch (error) {
      console.error('Erro ao atualizar medicamento:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao atualizar medicamento' 
      };
    }
  }

  /**
   * Deletar medicamento
   */
  async deleteMedication(medicationId) {
    try {
      const endpoint = apiService.replaceParams('/medications/:id', { id: medicationId });
      await apiService.delete(endpoint);
      return { success: true };
    } catch (error) {
      console.error('Erro ao deletar medicamento:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao deletar medicamento' 
      };
    }
  }

  /**
   * Marcar dose como tomada
   */
  async recordDose(doseData) {
    try {
      const data = {
        medication_id: doseData.medicationId,
        taken_at: doseData.takenAt,
        real_taken_at: doseData.realTakenAt || doseData.takenAt,
        status: doseData.status || 'taken',
        justification: doseData.justification,
      };

      const response = await apiService.post('/dose-history', data);
      return { success: true, data: response };
    } catch (error) {
      console.error('Erro ao registrar dose:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao registrar dose' 
      };
    }
  }

  /**
   * Obter histórico de doses de um medicamento
   */
  async getDoseHistory(medicationId, startDate = null, endDate = null) {
    try {
      let endpoint = `/dose-history?medication_id=${medicationId}`;
      
      if (startDate) {
        endpoint += `&start_date=${startDate}`;
      }
      if (endDate) {
        endpoint += `&end_date=${endDate}`;
      }

      const response = await apiService.get(endpoint);
      return { success: true, data: response };
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao buscar histórico' 
      };
    }
  }

  /**
   * Atualizar status de uma dose
   */
  async updateDose(doseId, doseData) {
    try {
      const endpoint = apiService.replaceParams('/dose-history/:id', { id: doseId });
      const data = {
        status: doseData.status,
        real_taken_at: doseData.realTakenAt,
        justification: doseData.justification,
      };

      const response = await apiService.put(endpoint, data);
      return { success: true, data: response };
    } catch (error) {
      console.error('Erro ao atualizar dose:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao atualizar dose' 
      };
    }
  }
}

export default new MedicationService();


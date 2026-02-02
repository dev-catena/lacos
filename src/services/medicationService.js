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
        dose_quantity: medicationData.doseQuantity || null,
        dose_quantity_unit: medicationData.doseQuantityUnit || null,
        administration_route: medicationData.administrationRoute,
        frequency_type: medicationData.frequencyType,
        frequency_details: medicationData.frequencyDetails,
        first_dose_at: medicationData.firstDoseAt,
        duration_type: medicationData.durationType,
        duration_value: medicationData.durationValue,
        notes: medicationData.notes,
        is_active: medicationData.isActive !== false, // Default true
      };

      // Adicionar start_date e end_date se fornecidos (calculados para dias intercalados)
      if (medicationData.startDate) {
        data.start_date = medicationData.startDate;
      }
      if (medicationData.endDate) {
        data.end_date = medicationData.endDate;
      }

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
      
      // Converter frequencyDetails para JSON string se for objeto
      let frequencyDetails = medicationData.frequencyDetails;
      if (frequencyDetails && typeof frequencyDetails === 'object') {
        frequencyDetails = JSON.stringify(frequencyDetails);
      }
      
      // Preparar dados, garantindo que campos opcionais sejam tratados corretamente
      const data = {};
      
      // Campos obrigatórios ou que sempre devem ser enviados
      if (medicationData.name !== undefined) {
        data.name = medicationData.name || '';
      }
      
      // Campos opcionais - só adicionar se tiverem valor ou se forem explicitamente null
      if (medicationData.form !== undefined) {
        data.pharmaceutical_form = medicationData.form || null;
      }
      if (medicationData.dosage !== undefined) {
        data.dosage = medicationData.dosage || null;
      }
      if (medicationData.unit !== undefined) {
        data.unit = medicationData.unit || null;
      }
      if (medicationData.administrationRoute !== undefined) {
        data.administration_route = medicationData.administrationRoute || null;
      }
      if (medicationData.frequencyType !== undefined) {
        data.frequency_type = medicationData.frequencyType || 'simple';
      }
      if (frequencyDetails !== undefined) {
        data.frequency_details = frequencyDetails;
      }
      if (medicationData.durationType !== undefined) {
        data.duration_type = medicationData.durationType || 'continuo';
      }
      if (medicationData.notes !== undefined) {
        data.notes = medicationData.notes || null;
      }
      if (medicationData.isActive !== undefined) {
        // Garantir que is_active seja sempre boolean
        data.is_active = Boolean(medicationData.isActive);
      }

      // Adicionar campos opcionais apenas se tiverem valor
      if (medicationData.firstDoseAt) {
        data.first_dose_at = medicationData.firstDoseAt;
      }
      
      if (medicationData.durationValue !== undefined && medicationData.durationValue !== null) {
        data.duration_value = medicationData.durationValue;
      }
      
      // Adicionar end_date se fornecido
      if (medicationData.endDate) {
        data.end_date = medicationData.endDate;
      }

      console.log('📤 medicationService.updateMedication - Dados enviados:', JSON.stringify(data, null, 2));

      const response = await apiService.put(endpoint, data);
      console.log('✅ medicationService.updateMedication - Resposta:', response);
      
      return { success: true, data: response };
    } catch (error) {
      console.error('❌ medicationService.updateMedication - Erro:', error);
      console.error('❌ medicationService.updateMedication - Erro completo:', JSON.stringify(error.response?.data || error, null, 2));
      return { 
        success: false, 
        error: error.message || 'Erro ao atualizar medicamento',
        details: error.response?.data || null
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


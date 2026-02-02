import apiService from './apiService';
import moment from 'moment';

/**
 * Serviço para gerenciar receitas
 */
class PrescriptionService {
  /**
   * Listar receitas de um grupo
   */
  async getPrescriptions(groupId) {
    try {
      const endpoint = `/prescriptions?group_id=${groupId}`;
      const response = await apiService.get(endpoint);
      // apiService.get retorna diretamente o JSON parseado do backend
      // O backend retorna { success: true, data: [...] }
      // Então response já é { success: true, data: [...] }
      return response;
    } catch (error) {
      console.error('Erro ao buscar receitas:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao buscar receitas' 
      };
    }
  }

  /**
   * Obter detalhes de uma receita específica
   */
  async getPrescription(prescriptionId) {
    try {
      console.log('🔵 prescriptionService.getPrescription - Iniciando busca, ID:', prescriptionId);
      const endpoint = apiService.replaceParams('/prescriptions/:id', { id: prescriptionId });
      console.log('🔵 prescriptionService.getPrescription - Endpoint:', endpoint);
      
      const response = await apiService.get(endpoint);
      
      console.log('🟢 prescriptionService.getPrescription - Resposta RAW do backend:', JSON.stringify(response, null, 2));
      console.log('🟢 prescriptionService.getPrescription - Tipo da resposta:', typeof response);
      console.log('🟢 prescriptionService.getPrescription - response.success:', response?.success);
      console.log('🟢 prescriptionService.getPrescription - response.data existe?', !!response?.data);
      
      if (response?.data) {
        console.log('🟢 prescriptionService.getPrescription - Dados da receita:', {
          id: response.data.id,
          doctor_id: response.data.doctor_id,
          doctor_name: response.data.doctor_name,
          image_url: response.data.image_url,
          medications_count: response.data.medications?.length || 0,
          medications_keys: response.data.medications?.[0] ? Object.keys(response.data.medications[0]) : []
        });
        
        if (response.data.medications && response.data.medications.length > 0) {
          console.log('🟢 prescriptionService.getPrescription - Primeiro medicamento completo:', JSON.stringify(response.data.medications[0], null, 2));
        }
      }
      
      // apiService.get retorna diretamente o JSON parseado do backend
      // O backend retorna { success: true, data: {...} }
      // Então response já é { success: true, data: {...} }
      return response;
    } catch (error) {
      console.error('🔴 prescriptionService.getPrescription - Erro ao buscar receita:', error);
      console.error('🔴 prescriptionService.getPrescription - Erro completo:', JSON.stringify(error, null, 2));
      return { 
        success: false, 
        error: error.message || 'Erro ao buscar receita' 
      };
    }
  }

  /**
   * Criar nova receita com medicamentos
   */
  async createPrescription(prescriptionData) {
    try {
      // Construir objeto frequency baseado em frequencyType e frequencyDetails
      // O backend espera frequency como array/objeto com estrutura: { type: 'simple'|'advanced', details: {...} }
      const buildFrequency = (med) => {
        let frequencyDetails = null;
        
        // Parsear frequencyDetails se for string
        if (med.frequencyDetails) {
          try {
            frequencyDetails = typeof med.frequencyDetails === 'string' 
              ? JSON.parse(med.frequencyDetails) 
              : med.frequencyDetails;
          } catch (e) {
            console.error('Erro ao parsear frequencyDetails:', e);
            frequencyDetails = med.frequencyDetails;
          }
        }
        
        // Construir objeto frequency no formato esperado pelo backend
        if (med.frequencyType === 'advanced' && frequencyDetails) {
          return {
            type: 'advanced',
            details: frequencyDetails
          };
        } else if (med.frequencyType === 'simple' && frequencyDetails) {
          return {
            type: 'simple',
            details: frequencyDetails
          };
        } else if (med.frequency) {
          // Se já tiver frequency, usar diretamente (pode ser string ou objeto)
          try {
            return typeof med.frequency === 'string' 
              ? JSON.parse(med.frequency) 
              : med.frequency;
          } catch (e) {
            // Se não conseguir parsear, criar estrutura padrão
            return {
              type: 'simple',
              details: { interval: med.frequency, schedule: [] }
            };
          }
        } else {
          // Fallback: estrutura padrão
          return {
            type: 'simple',
            details: { interval: '24', schedule: [] }
          };
        }
      };

      console.log('🔵 prescriptionService.createPrescription - Dados recebidos:', {
        hasImageUrl: !!prescriptionData.imageUrl,
        imageUrl: prescriptionData.imageUrl,
        imageUrlType: typeof prescriptionData.imageUrl,
      });
      
      const data = {
        group_id: prescriptionData.groupId,
        doctor_id: prescriptionData.doctorId || null,
        doctor_name: prescriptionData.doctorName || null,
        doctor_specialty: prescriptionData.doctorSpecialty || null,
        doctor_crm: prescriptionData.doctorCrm || null,
        prescription_date: prescriptionData.prescriptionDate,
        notes: prescriptionData.notes || null,
        image_url: prescriptionData.imageUrl || null,
        medications: prescriptionData.medications.map(med => ({
          name: med.name,
          pharmaceutical_form: med.form || null,
          dosage: med.dosage || null,
          unit: med.unit || null,
          administration_route: med.administrationRoute || null,
          dose_quantity: med.doseQuantity || null,
          dose_quantity_unit: med.doseQuantityUnit || null,
          frequency: buildFrequency(med),
          time: med.firstDoseAt || med.time || null,
          start_date: med.firstDoseAt ? med.firstDoseAt.split(' ')[0] : null,
          end_date: med.durationType === 'temporario' && med.durationValue 
            ? moment(med.firstDoseAt || new Date()).add(med.durationValue, 'days').format('YYYY-MM-DD')
            : null,
          instructions: med.instructions || null,
          notes: med.notes || null,
        })),
      };

      console.log('🔵 prescriptionService.createPrescription - Dados que serão enviados:', {
        hasImageUrl: !!data.image_url,
        imageUrl: data.image_url,
        imageUrlType: typeof data.image_url,
      });

      const response = await apiService.post('/prescriptions', data);
      return { success: true, data: response };
    } catch (error) {
      console.error('Erro ao criar receita:', error);
      
      // Extrair mensagens de erro específicas
      let errorMessage = 'Erro ao criar receita';
      const errorDetails = error.response?.data;
      
      if (errorDetails?.errors) {
        const errors = errorDetails.errors;
        const errorMessages = [];
        
        // Processar erros de validação
        Object.keys(errors).forEach(field => {
          const fieldErrors = Array.isArray(errors[field]) ? errors[field] : [errors[field]];
          fieldErrors.forEach(err => {
            // Traduzir nomes de campos para português
            const fieldName = field
              .replace('medications.', 'Medicamento ')
              .replace('.frequency', ' - Frequência')
              .replace('.name', ' - Nome')
              .replace('.dosage', ' - Dosagem')
              .replace('.form', ' - Forma farmacêutica')
              .replace('.administrationRoute', ' - Via de administração')
              .replace('group_id', 'Grupo')
              .replace('doctor_id', 'Médico')
              .replace('prescription_date', 'Data da receita');
            
            errorMessages.push(`${fieldName}: ${err}`);
          });
        });
        
        if (errorMessages.length > 0) {
          errorMessage = errorMessages.join('\n');
        } else if (errorDetails.message) {
          errorMessage = errorDetails.message;
        }
      } else if (errorDetails?.message) {
        errorMessage = errorDetails.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { 
        success: false, 
        error: errorMessage,
        details: errorDetails || null
      };
    }
  }

  /**
   * Atualizar receita existente
   */
  async updatePrescription(prescriptionId, prescriptionData) {
    try {
      // Construir objeto frequency baseado em frequencyType e frequencyDetails
      const buildFrequency = (med) => {
        let frequencyDetails = null;
        
        // Parsear frequencyDetails se for string
        if (med.frequencyDetails) {
          try {
            frequencyDetails = typeof med.frequencyDetails === 'string' 
              ? JSON.parse(med.frequencyDetails) 
              : med.frequencyDetails;
          } catch (e) {
            console.error('Erro ao parsear frequencyDetails:', e);
            frequencyDetails = med.frequencyDetails;
          }
        }
        
        // Construir objeto frequency no formato esperado pelo backend
        if (med.frequencyType === 'advanced' && frequencyDetails) {
          return {
            type: 'advanced',
            details: frequencyDetails
          };
        } else if (med.frequencyType === 'simple' && frequencyDetails) {
          return {
            type: 'simple',
            details: frequencyDetails
          };
        } else if (med.frequency) {
          // Se já tiver frequency, usar diretamente (pode ser string ou objeto)
          try {
            return typeof med.frequency === 'string' 
              ? JSON.parse(med.frequency) 
              : med.frequency;
          } catch (e) {
            // Se não conseguir parsear, criar estrutura padrão
            return {
              type: 'simple',
              details: { interval: med.frequency, schedule: [] }
            };
          }
        } else {
          // Fallback: estrutura padrão
          return {
            type: 'simple',
            details: { interval: '24', schedule: [] }
          };
        }
      };

      const data = {
        doctor_id: prescriptionData.doctorId || null,
        doctor_name: prescriptionData.doctorName || null,
        doctor_specialty: prescriptionData.doctorSpecialty || null,
        doctor_crm: prescriptionData.doctorCrm || null,
        prescription_date: prescriptionData.prescriptionDate,
        notes: prescriptionData.notes || null,
        image_url: prescriptionData.imageUrl || null,
        medications: prescriptionData.medications.map(med => ({
          name: med.name,
          pharmaceutical_form: med.form || null,
          dosage: med.dosage || null,
          unit: med.unit || null,
          administration_route: med.administrationRoute || null,
          dose_quantity: med.doseQuantity || null,
          dose_quantity_unit: med.doseQuantityUnit || null,
          frequency: buildFrequency(med),
          time: med.firstDoseAt || med.time || null,
          start_date: med.firstDoseAt ? med.firstDoseAt.split(' ')[0] : null,
          end_date: med.durationType === 'temporario' && med.durationValue 
            ? moment(med.firstDoseAt || new Date()).add(med.durationValue, 'days').format('YYYY-MM-DD')
            : null,
          instructions: med.instructions || null,
          notes: med.notes || null,
        })),
      };

      const endpoint = apiService.replaceParams('/prescriptions/:id', { id: prescriptionId });
      const response = await apiService.put(endpoint, data);
      return { success: true, data: response };
    } catch (error) {
      console.error('Erro ao atualizar receita:', error);
      
      // Extrair mensagens de erro específicas
      let errorMessage = 'Erro ao atualizar receita';
      const errorDetails = error.response?.data;
      
      if (errorDetails?.errors) {
        const errors = errorDetails.errors;
        const errorMessages = [];
        
        // Processar erros de validação
        Object.keys(errors).forEach(field => {
          const fieldErrors = Array.isArray(errors[field]) ? errors[field] : [errors[field]];
          fieldErrors.forEach(err => {
            // Traduzir nomes de campos para português
            const fieldName = field
              .replace('medications.', 'Medicamento ')
              .replace('.frequency', ' - Frequência')
              .replace('.name', ' - Nome')
              .replace('.dosage', ' - Dosagem')
              .replace('.form', ' - Forma farmacêutica')
              .replace('.administrationRoute', ' - Via de administração')
              .replace('group_id', 'Grupo')
              .replace('doctor_id', 'Médico')
              .replace('prescription_date', 'Data da receita');
            
            errorMessages.push(`${fieldName}: ${err}`);
          });
        });
        
        if (errorMessages.length > 0) {
          errorMessage = errorMessages.join('\n');
        } else if (errorDetails.message) {
          errorMessage = errorDetails.message;
        }
      } else if (errorDetails?.message) {
        errorMessage = errorDetails.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { 
        success: false, 
        error: errorMessage,
        details: errorDetails || null
      };
    }
  }
}

export default new PrescriptionService();

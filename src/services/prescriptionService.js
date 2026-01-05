import apiService from './apiService';

const prescriptionService = {
  /**
   * Gerar receita médica assinada digitalmente
   */
  async generateSignedRecipe(prescriptionData) {
    try {
      console.log('📝 prescriptionService - Gerando receita assinada:', prescriptionData);
      // Timeout aumentado para 120 segundos (2 minutos) - geração de PDF com assinatura pode demorar
      const response = await apiService.post('/prescriptions/generate-signed-recipe', prescriptionData, {
        timeout: 120000, // 2 minutos
      });
      console.log('✅ prescriptionService - Receita gerada:', response);
      return { success: true, data: response };
    } catch (error) {
      console.error('❌ prescriptionService - Erro ao gerar receita:', error.response?.data || error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro ao gerar receita médica',
      };
    }
  },

  /**
   * Gerar atestado médico assinado digitalmente
   */
  async generateSignedCertificate(certificateData) {
    try {
      console.log('📝 prescriptionService - Gerando atestado assinado:', certificateData);
      // Timeout aumentado para 120 segundos (2 minutos) - geração de PDF com assinatura pode demorar
      const response = await apiService.post('/prescriptions/generate-signed-certificate', certificateData, {
        timeout: 120000, // 2 minutos
      });
      console.log('✅ prescriptionService - Atestado gerado:', response);
      return { success: true, data: response };
    } catch (error) {
      console.error('❌ prescriptionService - Erro ao gerar atestado:', error.response?.data || error);
      
      // Formatar mensagens de erro específicas
      let errorMessage = 'Erro ao gerar atestado médico';
      
      if (error.response?.data?.errors) {
        // Se houver erros de validação específicos
        const apiErrors = error.response.data.errors;
        const errorList = Object.keys(apiErrors).map(field => {
          const messages = Array.isArray(apiErrors[field]) ? apiErrors[field] : [apiErrors[field]];
          // Traduzir nomes de campos para português
          const fieldNames = {
            'doctor_crm_uf': 'CRM/UF do médico',
            'end_date': 'Data de término',
            'start_date': 'Data de início',
            'patient_id': 'ID do paciente',
            'patient_name': 'Nome do paciente',
            'doctor_name': 'Nome do médico',
            'doctor_crm': 'CRM do médico',
            'description': 'Descrição',
            'type': 'Tipo de atestado',
          };
          const fieldName = fieldNames[field] || field.replace(/_/g, ' ');
          return `${fieldName}: ${messages.join(', ')}`;
        });
        errorMessage = errorList.join('\n• ');
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        error: errorMessage,
        errors: error.response?.data?.errors || null,
      };
    }
  },

  /**
   * Validar documento assinado (receita ou atestado)
   */
  async validateSignedDocument(documentHash) {
    try {
      console.log('🔍 prescriptionService - Validando documento:', documentHash);
      const response = await apiService.get(`/prescriptions/validate/${documentHash}`);
      console.log('✅ prescriptionService - Documento validado:', response);
      return { success: true, data: response };
    } catch (error) {
      console.error('❌ prescriptionService - Erro ao validar documento:', error.response?.data || error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro ao validar documento',
      };
    }
  },
};

export default prescriptionService;


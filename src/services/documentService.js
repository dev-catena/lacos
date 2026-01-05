import apiService from './apiService';

const documentService = {
  // Upload de documento
  async uploadDocument(formData) {
    try {
      // Não passar headers manualmente - o apiService detecta FormData e gerencia automaticamente
      const response = await apiService.post('/documents', formData);
      return response;
    } catch (error) {
      console.error('Erro ao fazer upload do documento:', error.response?.data || error);
      throw error;
    }
  },

  // Listar documentos de um grupo
  async getDocumentsByGroup(groupId) {
    try {
      console.log('📡 documentService - Buscando documentos do grupo:', groupId);
      const response = await apiService.get(`/documents?group_id=${groupId}`);
      console.log('📡 documentService - Resposta raw:', response);
      
      // O backend pode retornar {success: true, data: [...]} ou apenas [...]
      const documents = response.data || response;
      console.log('📡 documentService - Documentos extraídos:', documents.length);
      
      return documents;
    } catch (error) {
      console.error('❌ documentService - Erro ao buscar documentos:', error.response?.data || error);
      throw error;
    }
  },

  // Listar documentos de um paciente (para médicos)
  async getDocumentsByPatient(patientId) {
    try {
      console.log('📡 documentService - Buscando documentos do paciente:', patientId);
      const response = await apiService.get(`/documents?patient_id=${patientId}`);
      console.log('📡 documentService - Resposta raw:', response);
      
      // O backend pode retornar {success: true, data: [...]} ou apenas [...]
      const documents = response.data || response;
      console.log('📡 documentService - Documentos do paciente extraídos:', documents.length);
      
      return documents;
    } catch (error) {
      console.error('❌ documentService - Erro ao buscar documentos do paciente:', error.response?.data || error);
      throw error;
    }
  },

  // Buscar detalhes de um documento
  async getDocumentById(documentId) {
    try {
      const response = await apiService.get(`/documents/${documentId}`);
      return response;
    } catch (error) {
      console.error('Erro ao buscar documento:', error.response?.data || error);
      throw error;
    }
  },

  // Atualizar documento
  async updateDocument(documentId, data) {
    try {
      const response = await apiService.put(`/documents/${documentId}`, data);
      return response;
    } catch (error) {
      console.error('Erro ao atualizar documento:', error.response?.data || error);
      throw error;
    }
  },

  // Deletar documento
  async deleteDocument(documentId) {
    try {
      const response = await apiService.delete(`/documents/${documentId}`);
      return response;
    } catch (error) {
      console.error('Erro ao deletar documento:', error.response?.data || error);
      throw error;
    }
  },

  // Download de documento
  async downloadDocument(documentId) {
    try {
      const response = await apiService.get(`/documents/${documentId}/download`, {
        responseType: 'blob',
      });
      return response;
    } catch (error) {
      console.error('Erro ao baixar documento:', error.response?.data || error);
      throw error;
    }
  },
};

export default documentService;


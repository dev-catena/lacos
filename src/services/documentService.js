import apiService from './apiService';

const documentService = {
  // Upload de documento
  async uploadDocument(formData) {
    try {
      const response = await apiService.post('/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response;
    } catch (error) {
      console.error('Erro ao fazer upload do documento:', error.response?.data || error);
      throw error;
    }
  },

  // Listar documentos de um grupo
  async getDocumentsByGroup(groupId) {
    try {
      const response = await apiService.get(`/documents?group_id=${groupId}`);
      return response;
    } catch (error) {
      console.error('Erro ao buscar documentos:', error.response?.data || error);
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


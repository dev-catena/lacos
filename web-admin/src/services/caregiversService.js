// Serviço para gerenciar cuidadores profissionais via API
import { API_BASE_URL } from '../config/api';

const getHeaders = () => {
  const token = localStorage.getItem('@lacos:token');
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

const caregiversService = {
  /**
   * Listar todos os cuidadores profissionais
   */
  async getAllCaregivers() {
    try {
      const token = localStorage.getItem('@lacos:token');
      
      if (!token) {
        throw new Error('Token de autenticação não encontrado. Faça login novamente.');
      }

      const url = `${API_BASE_URL}/admin/caregivers`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders(),
      });

      if (response.status === 401) {
        throw new Error('Não autenticado. Faça login novamente.');
      }

      if (response.status === 403) {
        throw new Error('Acesso negado. Você precisa ter permissão de root.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Erro ${response.status}: Erro ao carregar cuidadores profissionais`);
      }

      // A resposta pode vir como { success: true, caregivers: [...] } ou diretamente como array
      if (data.caregivers) {
        return Array.isArray(data.caregivers) ? data.caregivers : [];
      }
      
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Erro ao listar cuidadores profissionais:', error);
      throw error;
    }
  },

  /**
   * Listar pacientes de um cuidador profissional
   */
  async getCaregiverPatients(caregiverId) {
    try {
      const token = localStorage.getItem('@lacos:token');
      
      if (!token) {
        throw new Error('Token de autenticação não encontrado. Faça login novamente.');
      }

      const url = `${API_BASE_URL}/admin/caregivers/${caregiverId}/patients`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders(),
      });

      if (response.status === 401) {
        throw new Error('Não autenticado. Faça login novamente.');
      }

      if (response.status === 403) {
        throw new Error('Acesso negado. Você precisa ter permissão de root.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Erro ${response.status}: Erro ao carregar pacientes`);
      }

      return {
        caregiver: data.caregiver || null,
        patients: data.patients || []
      };
    } catch (error) {
      console.error('Erro ao listar pacientes do cuidador:', error);
      throw error;
    }
  },
};

export default caregiversService;


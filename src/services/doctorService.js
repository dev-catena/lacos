import apiService from './apiService';

const doctorService = {
  /**
   * Busca todos os médicos de um grupo
   */
  async getDoctors(groupId) {
    try {
      const response = await apiService.get(`/doctors?group_id=${groupId}`);
      return response;
    } catch (error) {
      console.error('Erro ao buscar médicos:', error);
      throw error;
    }
  },

  /**
   * Busca um médico específico
   */
  async getDoctor(doctorId) {
    try {
      const response = await apiService.get(`/doctors/${doctorId}`);
      return response;
    } catch (error) {
      console.error('Erro ao buscar médico:', error);
      throw error;
    }
  },

  /**
   * Cria um novo médico
   */
  async createDoctor(doctorData) {
    try {
      const response = await apiService.post('/doctors', doctorData);
      return response;
    } catch (error) {
      console.error('Erro ao criar médico:', error);
      throw error;
    }
  },

  /**
   * Atualiza um médico existente
   */
  async updateDoctor(doctorId, doctorData) {
    try {
      const response = await apiService.put(`/doctors/${doctorId}`, doctorData);
      return response;
    } catch (error) {
      console.error('Erro ao atualizar médico:', error);
      throw error;
    }
  },

  /**
   * Remove um médico
   */
  async deleteDoctor(doctorId) {
    try {
      const response = await apiService.delete(`/doctors/${doctorId}`);
      return response;
    } catch (error) {
      console.error('Erro ao deletar médico:', error);
      throw error;
    }
  },

  /**
   * Busca a agenda disponível de um médico
   */
  async getDoctorAvailability(doctorId) {
    try {
      const response = await apiService.get(`/doctors/${doctorId}/availability`);
      return response;
    } catch (error) {
      console.error('Erro ao buscar agenda do médico:', error);
      throw error;
    }
  },

  /**
   * Salva a agenda disponível de um médico
   */
  async saveAvailability(doctorId, availabilityData) {
    try {
      console.log('📤 doctorService.saveAvailability - Enviando:', {
        doctorId,
        endpoint: `/doctors/${doctorId}/availability`,
        data: availabilityData,
      });
      
      const response = await apiService.post(`/doctors/${doctorId}/availability`, availabilityData);
      
      console.log('📥 doctorService.saveAvailability - Resposta:', response);
      
      return response;
    } catch (error) {
      console.error('❌ doctorService.saveAvailability - Erro completo:', {
        message: error.message,
        response: error.response,
        data: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  },

  /**
   * Busca médicos da plataforma (usuários com profile='doctor')
   */
  async getPlatformDoctors() {
    try {
      const params = {
        profile: 'doctor',
      };
      
      const queryString = Object.keys(params)
        .map(key => `${key}=${encodeURIComponent(params[key])}`)
        .join('&');
      
      const response = await apiService.get(`/caregivers?${queryString}`);
      
      // Normalizar resposta
      let doctorsList = [];
      if (Array.isArray(response)) {
        doctorsList = response;
      } else if (response && response.success && response.data) {
        doctorsList = response.data;
      } else if (response && response.data && Array.isArray(response.data)) {
        doctorsList = response.data;
      }
      
      // Filtrar apenas médicos (profile='doctor') e mapear para formato consistente
      return doctorsList
        .filter(doctor => doctor.profile === 'doctor')
        .map(doctor => ({
          id: doctor.id,
          name: doctor.name,
          email: doctor.email,
          crm: doctor.crm,
          phone: doctor.phone,
          address: doctor.address || doctor.city || null,
          medical_specialty: doctor.medical_specialty ? {
            id: doctor.medical_specialty.id || doctor.medical_specialty_id,
            name: doctor.medical_specialty.name || doctor.medical_specialty,
          } : null,
          medical_specialty_id: doctor.medical_specialty_id,
          photo: doctor.photo || doctor.photo_url,
          photo_url: doctor.photo_url || doctor.photo,
          is_platform_doctor: true, // Marcar como médico da plataforma
          is_primary: false, // Médicos da plataforma não são marcados como principais por padrão
        }));
    } catch (error) {
      console.error('Erro ao buscar médicos da plataforma:', error);
      return []; // Retornar array vazio em caso de erro
    }
  },
};

export default doctorService;

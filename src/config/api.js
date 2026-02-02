// Configurações da API
import { BACKEND_BASE_URL } from './env';

const API_CONFIG = {
  // URL base da API - Backend Laravel no servidor
  // Configurado via variável de ambiente (src/config/env.js)
  // Para Android: usar IP da máquina em vez de localhost
  // Para iOS Simulator: pode usar localhost
  // Para dispositivo físico: usar IP da máquina
  BASE_URL: BACKEND_BASE_URL,
  
  // Timeout para requisições (em ms)
  TIMEOUT: 30000,
  
  // Headers padrão
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  
  // Endpoints
  ENDPOINTS: {
    // Autenticação
    AUTH: {
      LOGIN: '/login',
      REGISTER: '/register',
      LOGOUT: '/logout',
      ME: '/me',
      UPDATE_PROFILE: '/profile',
      CHANGE_PASSWORD: '/change-password',
    },
    
    // Grupos
    GROUPS: {
      LIST: '/groups',
      CREATE: '/groups',
      DETAIL: '/groups/:id',
      UPDATE: '/groups/:id',
      DELETE: '/groups/:id',
      MEMBERS: '/groups/:id/members',
      JOIN_WITH_CODE: '/groups/join',
      UPDATE_MEMBER_ROLE: '/groups/:groupId/members/:memberId/role',
      REMOVE_MEMBER: '/groups/:groupId/members/:memberId',
    },
    
    // Medicamentos
    MEDICATIONS: {
      LIST: '/medications',
      CREATE: '/medications',
      DETAIL: '/medications/:id',
      UPDATE: '/medications/:id',
      DELETE: '/medications/:id',
      DISCONTINUE: '/medications/:id/discontinue',
    },
    
    // Histórico de Doses
    DOSE_HISTORY: {
      LIST: '/dose-history',
      MARK_TAKEN: '/dose-history/:id/mark-taken',
      MARK_SKIPPED: '/dose-history/:id/mark-skipped',
      ADHERENCE_REPORT: '/dose-history/adherence-report',
    },
    
    // Médicos
    DOCTORS: {
      LIST: '/doctors',
      CREATE: '/doctors',
      DETAIL: '/doctors/:id',
      UPDATE: '/doctors/:id',
      DELETE: '/doctors/:id',
    },
    
    // Contatos de Emergência
    EMERGENCY_CONTACTS: {
      LIST: '/emergency-contacts',
      CREATE: '/emergency-contacts',
      DETAIL: '/emergency-contacts/:id',
      UPDATE: '/emergency-contacts/:id',
      DELETE: '/emergency-contacts/:id',
    },
    
    // Compromissos
    APPOINTMENTS: {
      LIST: '/appointments',
      CREATE: '/appointments',
      DETAIL: '/appointments/:id',
      UPDATE: '/appointments/:id',
      DELETE: '/appointments/:id',
    },
    
    // Sinais Vitais
    VITAL_SIGNS: {
      LIST: '/vital-signs',
      CREATE: '/vital-signs',
      DETAIL: '/vital-signs/:id',
      UPDATE: '/vital-signs/:id',
      DELETE: '/vital-signs/:id',
    },
  },
};

export default API_CONFIG;


// Serviço para gerenciar planos via API
import { API_BASE_URL } from '../config/api';

class PlansService {
  constructor() {
    this.token = localStorage.getItem('@lacos:token');
  }

  getHeaders() {
    const token = localStorage.getItem('@lacos:token');
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  async getAllPlans() {
    try {
      const response = await fetch(`${API_BASE_URL}/plans`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar planos');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar planos:', error);
      // Retorna planos padrão se a API não estiver disponível
      return this.getDefaultPlans();
    }
  }

  async getPlan(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/plans/${id}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar plano');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar plano:', error);
      throw error;
    }
  }

  async createPlan(planData) {
    try {
      const response = await fetch(`${API_BASE_URL}/plans`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(planData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar plano');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao criar plano:', error);
      throw error;
    }
  }

  async updatePlan(id, planData) {
    try {
      const response = await fetch(`${API_BASE_URL}/plans/${id}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(planData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao atualizar plano');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao atualizar plano:', error);
      throw error;
    }
  }

  async deletePlan(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/plans/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error('Erro ao deletar plano');
      }

      return true;
    } catch (error) {
      console.error('Erro ao deletar plano:', error);
      throw error;
    }
  }

  getDefaultPlans() {
    // Retorna os 4 planos padrão com todas as funcionalidades desmarcadas inicialmente
    return [
      {
        id: 1,
        name: 'Básico',
        slug: 'basico',
        features: {
          grupoCuidados: false,
          historico: false,
          remedios: false,
          receitas: false,
          agenda: false,
          medicos: false,
          arquivos: false,
          midias: false,
          sinaisVitais: false,
          configuracoes: false,
          loja: false,
          buscarCuidadores: false,
          smartwatch: false,
          sensorQuedas: false,
          cameras: false,
        },
        isDefault: true,
      },
      {
        id: 2,
        name: 'Intermediário',
        slug: 'intermediario',
        features: {
          grupoCuidados: false,
          historico: false,
          remedios: false,
          receitas: false,
          agenda: false,
          medicos: false,
          arquivos: false,
          midias: false,
          sinaisVitais: false,
          configuracoes: false,
          loja: false,
          buscarCuidadores: false,
          smartwatch: false,
          sensorQuedas: false,
          cameras: false,
        },
        isDefault: false,
      },
      {
        id: 3,
        name: 'Avançado',
        slug: 'avancado',
        features: {
          grupoCuidados: false,
          historico: false,
          remedios: false,
          receitas: false,
          agenda: false,
          medicos: false,
          arquivos: false,
          midias: false,
          sinaisVitais: false,
          configuracoes: false,
          loja: false,
          buscarCuidadores: false,
          smartwatch: false,
          sensorQuedas: false,
          cameras: false,
        },
        isDefault: false,
      },
      {
        id: 4,
        name: 'Pleno',
        slug: 'pleno',
        features: {
          grupoCuidados: false,
          historico: false,
          remedios: false,
          receitas: false,
          agenda: false,
          medicos: false,
          arquivos: false,
          midias: false,
          sinaisVitais: false,
          configuracoes: false,
          loja: false,
          buscarCuidadores: false,
          smartwatch: false,
          sensorQuedas: false,
          cameras: false,
        },
        isDefault: false,
      },
    ];
  }

  getAllFeatures() {
    return [
      { key: 'grupoCuidados', label: 'Grupo de cuidados', description: 'Permite gerenciar grupos de cuidados' },
      { key: 'historico', label: 'Histórico', description: 'Acesso ao histórico de atividades' },
      { key: 'remedios', label: 'Remédios', description: 'Gerenciamento de medicamentos' },
      { key: 'receitas', label: 'Receitas', description: 'Gerenciamento de receitas médicas e prescrições' },
      { key: 'agenda', label: 'Agenda', description: 'Agendamento de compromissos' },
      { key: 'medicos', label: 'Médicos', description: 'Cadastro e gerenciamento de médicos' },
      { key: 'arquivos', label: 'Arquivos', description: 'Armazenamento e acesso a arquivos' },
      { key: 'midias', label: 'Mídias', description: 'Gerenciamento de fotos e vídeos' },
      { key: 'sinaisVitais', label: 'Sinais vitais', description: 'Registro e acompanhamento de sinais vitais' },
      { key: 'configuracoes', label: 'Configurações', description: 'Acesso às configurações do sistema' },
      { key: 'loja', label: 'Loja', description: 'Acesso ao módulo de loja para comprar produtos de fornecedores' },
      { key: 'buscarCuidadores', label: 'Encontrar Cuidador Profissional', description: 'Permite buscar e encontrar cuidadores profissionais na aplicação' },
      { key: 'smartwatch', label: 'Smartwatch', description: 'Integração com smartwatch (ainda não implementado na aplicação)' },
      { key: 'sensorQuedas', label: 'Sensor de Quedas', description: 'Monitoramento de quedas (ainda não implementado na aplicação)' },
      { key: 'cameras', label: 'Câmeras', description: 'Acesso às câmeras (ainda não implementado na aplicação)' },
    ];
  }
}

export default new PlansService();


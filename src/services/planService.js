import apiService from './apiService';

class PlanService {
  /**
   * Obter plano do usuário autenticado
   */
  async getUserPlan() {
    try {
      console.log('📦 PlanService - Buscando plano do usuário');
      
      const response = await apiService.request('/user/plan', {
        method: 'GET',
      });

      if (response && response.plan) {
        console.log('✅ PlanService - Plano obtido:', response.plan.name);
        return {
          success: true,
          plan: response.plan,
          userPlan: response.user_plan,
        };
      }

      return {
        success: false,
        error: 'Plano não encontrado',
      };
    } catch (error) {
      console.error('❌ PlanService - Erro ao buscar plano:', error);
      return {
        success: false,
        error: error.message || 'Erro ao buscar plano',
      };
    }
  }

  /**
   * Verificar se uma feature está disponível no plano
   */
  isFeatureEnabled(plan, featureKey) {
    if (!plan || !plan.features) {
      console.log('⚠️ PlanService.isFeatureEnabled - Plano ou features não disponíveis:', {
        hasPlan: !!plan,
        hasFeatures: !!(plan && plan.features),
        featureKey
      });
      return false;
    }

    // grupoCuidados sempre está disponível (é o próprio grupo)
    if (featureKey === 'grupoCuidados') {
      return true;
    }

    const raw = plan.features[featureKey];
    const enabled =
      raw === true ||
      raw === 1 ||
      raw === '1' ||
      raw === 'true';
    console.log('🔍 PlanService.isFeatureEnabled:', {
      featureKey,
      enabled,
      featureValue: plan.features[featureKey],
      featuresType: typeof plan.features,
      allFeatures: Object.keys(plan.features || {})
    });
    
    return enabled;
  }
}

export default new PlanService();


#!/usr/bin/env node
/**
 * Teste do Ciclo de Vida Frontend - Detalhes de Formação
 * ========================================================
 * Simula exatamente o fluxo do app React Native e verifica:
 * 1. GET /user - formato JSON e presença de formation_description
 * 2. PUT /users/{id} - envio e resposta
 * 3. Tratamento do JSON (formation_description vs formationDescription)
 * 4. Merge no updateUser (AuthContext)
 *
 * Uso:
 *   node scripts/test-frontend-formation-lifecycle.js
 *   BASE_URL=http://192.168.0.20:8000 node scripts/test-frontend-formation-lifecycle.js
 *   TOKEN=xxx USER_ID=9 node scripts/test-frontend-formation-lifecycle.js
 */

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8000';
const API = `${BASE_URL}/api`;
const TOKEN = process.env.TOKEN;
const USER_ID = process.env.USER_ID;

// Valor de teste
const VALOR_TESTE = `Teste Frontend Lifecycle ${Date.now()}`;

// ========== Lógica idêntica ao userService.updateUserData ==========
function parseUpdateResponse(response) {
  if (response && response.id) {
    return { success: true, data: response };
  }
  if (response && response.user) {
    return { success: true, data: response.user };
  }
  if (response && response.success) {
    return response;
  }
  return { success: false, error: 'Resposta inválida da API' };
}

// ========== Lógica idêntica ao userService.getUser ==========
function parseGetUserResponse(response) {
  if (response && response.id) {
    return { success: true, data: response };
  }
  if (response && response.user) {
    return { success: true, data: response.user };
  }
  if (response && response.success) {
    return response;
  }
  return { success: false, error: 'Resposta inválida da API' };
}

// ========== Lógica idêntica ao ProfessionalCaregiverDataScreen ==========
function extractFormationDescription(data) {
  return data?.formation_description ?? data?.formationDescription ?? '';
}

// ========== Lógica idêntica ao AuthContext.updateUser ==========
function mergeUser(user, updatedData) {
  return { ...user, ...updatedData };
}

async function main() {
  console.log('\n==============================================');
  console.log('  TESTE - Ciclo de Vida Frontend (formation_description)');
  console.log('==============================================');
  console.log('Base URL:', BASE_URL);
  console.log('API:', API);
  console.log('==============================================\n');

  let token = TOKEN;
  let userId = USER_ID;

  // Obter token e user_id se não foram passados
  if (!token || !userId) {
    console.log('Obtendo token via backend...');
    const { execSync } = require('child_process');
    const path = require('path');
    const getTokenScript = path.join(__dirname, '..', 'backend-laravel', 'get-caregiver-token.sh');
    try {
      const out = execSync(`bash "${getTokenScript}"`, { encoding: 'utf-8', timeout: 30000 });
      const parts = out.trim().split('\n').pop().split('|');
      userId = parts[0];
      token = parts.slice(1).join('|'); // Token Sanctum: "id|plainTextToken"
    } catch (e) {
      console.error('ERRO: Não foi possível obter token. Execute com:');
      console.error('  TOKEN=xxx USER_ID=9 node scripts/test-frontend-formation-lifecycle.js');
      process.exit(1);
    }
    if (!token || !userId) {
      console.error('ERRO: Nenhum cuidador profissional encontrado.');
      process.exit(1);
    }
    console.log('Token obtido. User ID:', userId);
  }

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  let user = null;
  const results = { ok: true, steps: [] };

  // ---------- PASSO 1: GET /user (como useFocusEffect e loadStorageData) ----------
  console.log('1. GET /api/user - Carregar dados (como useFocusEffect)');
  try {
    const res = await fetch(`${API}/user`, { headers });
    const text = await res.text();
    const contentType = res.headers.get('content-type') || '';

    results.steps.push({ step: 'GET /user', status: res.status, contentType });

    if (!contentType.includes('application/json')) {
      console.log('   FALHOU: Content-Type não é JSON:', contentType);
      results.ok = false;
    }

    let parsed;
    try {
      const firstBrace = text.indexOf('{');
      const cleaned = firstBrace >= 0 ? text.substring(firstBrace) : text;
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.log('   FALHOU: JSON inválido. Primeiros 200 chars:', text.substring(0, 200));
      results.ok = false;
    }

    if (parsed) {
      const getUserResult = parseGetUserResponse(parsed);
      user = getUserResult.data || parsed;
      const formationDesc = extractFormationDescription(user);
      console.log('   HTTP', res.status);
      console.log('   formation_description no JSON:', user.hasOwnProperty('formation_description') ? 'SIM' : 'NÃO');
      console.log('   formationDescription no JSON:', user.hasOwnProperty('formationDescription') ? 'SIM' : 'NÃO');
      console.log('   Valor extraído (extractFormationDescription):', formationDesc || '(vazio)');
      results.steps[0].formation_description = formationDesc;
      results.steps[0].has_snake = user.hasOwnProperty('formation_description');
      results.steps[0].has_camel = user.hasOwnProperty('formationDescription');
    }
  } catch (e) {
    console.log('   ERRO:', e.message);
    results.ok = false;
  }
  console.log('');

  // ---------- PASSO 2: PUT /users/{id} (como handleSubmit) ----------
  console.log('2. PUT /api/users/' + userId + ' - Enviar formation_description');
  try {
    const body = JSON.stringify({
      formation_description: VALOR_TESTE,
      city: user?.city || 'Teste',
      neighborhood: user?.neighborhood || 'Centro',
      formation_details: user?.formation_details || 'Cuidador',
      hourly_rate: user?.hourly_rate || 50,
      availability: user?.availability || 'Manha',
      is_available: true,
    });

    const res = await fetch(`${API}/users/${userId}`, {
      method: 'PUT',
      headers,
      body,
    });

    const text = await res.text();
    const contentType = res.headers.get('content-type') || '';

    results.steps.push({ step: 'PUT /users/' + userId, status: res.status, contentType });

    let parsed;
    try {
      const firstBrace = text.indexOf('{');
      const cleaned = firstBrace >= 0 ? text.substring(firstBrace) : text;
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.log('   FALHOU: Resposta não é JSON válido');
      console.log('   Primeiros 300 chars:', text.substring(0, 300));
      results.ok = false;
    }

    if (parsed) {
      const updateResult = parseUpdateResponse(parsed);
      const responseData = updateResult.data || parsed;
      const formationDesc = extractFormationDescription(responseData);
      console.log('   HTTP', res.status);
      console.log('   formation_description na resposta:', responseData.hasOwnProperty('formation_description') ? 'SIM' : 'NÃO');
      console.log('   Valor retornado:', formationDesc || '(vazio)');
      results.steps[1].formation_description = formationDesc;
      results.steps[1].parse_success = updateResult.success;

      // Simular updateUser (AuthContext)
      if (user && responseData) {
        user = mergeUser(user, responseData);
        const mergedDesc = extractFormationDescription(user);
        console.log('   Após merge (updateUser):', mergedDesc || '(vazio)');
        results.steps[1].after_merge = mergedDesc;
      }
    }
  } catch (e) {
    console.log('   ERRO:', e.message);
    results.ok = false;
  }
  console.log('');

  // ---------- PASSO 3: GET /user novamente (verificar persistência) ----------
  console.log('3. GET /api/user - Verificar persistência');
  try {
    const res = await fetch(`${API}/user`, { headers });
    const text = await res.text();
    let parsed;
    try {
      const firstBrace = text.indexOf('{');
      const cleaned = firstBrace >= 0 ? text.substring(firstBrace) : text;
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.log('   FALHOU: JSON inválido');
      results.ok = false;
    }

    if (parsed) {
      const getUserResult = parseGetUserResponse(parsed);
      const finalUser = getUserResult.data || parsed;
      const formationDesc = extractFormationDescription(finalUser);
      console.log('   HTTP', res.status);
      console.log('   formation_description:', formationDesc || '(vazio)');
      const persisted = formationDesc === VALOR_TESTE;
      console.log('   Valor persistiu corretamente:', persisted ? 'SIM' : 'NÃO');
      results.steps.push({ step: 'GET /user (após PUT)', persisted, formation_description: formationDesc });
    }
  } catch (e) {
    console.log('   ERRO:', e.message);
    results.ok = false;
  }

  // ---------- RESUMO ----------
  console.log('\n==============================================');
  const lastStep = results.steps[results.steps.length - 1];
  const persisted = lastStep && lastStep.formation_description === VALOR_TESTE;
  if (persisted && results.ok) {
    console.log('  RESULTADO: CICLO DE VIDA OK');
    console.log('  - JSON tratado corretamente (snake_case)');
    console.log('  - formation_description enviado e persistido');
    console.log('  - Fallback formationDescription não necessário (backend usa snake_case)');
    console.log('==============================================\n');
    process.exit(0);
  } else {
    console.log('  RESULTADO: VERIFICAR TRATAMENTO');
    if (!persisted) {
      console.log('  - formation_description pode não estar persistindo ou sendo extraído');
    }
    console.log('  - Verifique se o backend retorna formation_description (snake_case)');
    console.log('  - O frontend usa: data?.formation_description ?? data?.formationDescription');
    console.log('==============================================\n');
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('Erro fatal:', e);
  process.exit(1);
});

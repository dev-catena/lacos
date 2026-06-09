/**
 * Valida e-mail com mensagens específicas para erros comuns de digitação.
 */
export function validateEmail(email) {
  const raw = String(email || '').trim();
  if (!raw) {
    return { valid: true };
  }

  if (/\s/.test(raw)) {
    return { valid: false, message: 'E-mail não pode conter espaços.' };
  }

  if (raw.includes('::')) {
    return {
      valid: false,
      message: 'E-mail inválido: não use dois pontos seguidos (::).',
    };
  }

  if (/\.\./.test(raw)) {
    return {
      valid: false,
      message: 'E-mail inválido: não use dois pontos seguidos (..).',
    };
  }

  const atCount = (raw.match(/@/g) || []).length;
  if (atCount === 0) {
    return {
      valid: false,
      message: 'E-mail deve conter o símbolo @ (ex.: nome@clinica.com.br).',
    };
  }
  if (atCount > 1) {
    return {
      valid: false,
      message: 'E-mail deve conter apenas um símbolo @.',
    };
  }

  const [local, domain] = raw.split('@');
  if (!local || !domain) {
    return {
      valid: false,
      message: 'Formato de e-mail inválido. Use algo como: nome@clinica.com.br',
    };
  }

  if (domain.includes(':')) {
    return {
      valid: false,
      message:
        'No domínio do e-mail use ponto (.) em vez de dois pontos (:). Ex.: @hospital.com.br',
    };
  }

  if (!domain.includes('.')) {
    return {
      valid: false,
      message: 'Domínio do e-mail incompleto. Ex.: @clinica.com.br',
    };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
    return {
      valid: false,
      message: 'Formato de e-mail inválido. Use algo como: nome@clinica.com.br',
    };
  }

  return { valid: true };
}

const FIELD_LABELS = {
  group_id: 'Grupo',
  name: 'Nome',
  medical_specialty_id: 'Especialidade',
  crm: 'CRM',
  phone: 'Telefone',
  email: 'E-mail',
  address: 'Endereço',
  notes: 'Observações',
  is_primary: 'Médico principal',
};

function translateValidationMessage(field, label, rawMessage) {
  const msg = String(rawMessage || '');
  const lower = msg.toLowerCase();

  if (lower.includes('required')) {
    return `${label} é obrigatório.`;
  }
  if (
    field === 'email' ||
    lower.includes('must be a valid email') ||
    lower.includes('informe um e-mail válido')
  ) {
    return 'E-mail inválido. Verifique @, pontos (.) e evite dois pontos (:) no endereço.';
  }
  if (lower.includes('must not be greater than') || lower.includes('max')) {
    if (field === 'address') return 'Endereço muito longo (máximo 1000 caracteres).';
    if (field === 'phone') return 'Telefone muito longo. Use DDD + número (ex.: +55(11)98765-4321).';
    if (field === 'crm') return 'CRM muito longo.';
    if (field === 'name') return 'Nome muito longo (máximo 255 caracteres).';
    return `${label}: valor muito longo.`;
  }
  if (lower.includes('must be an integer') || lower.includes('integer')) {
    return `${label}: valor inválido.`;
  }
  if (lower.includes('selected') && lower.includes('invalid')) {
    if (field === 'group_id') return 'Grupo inválido ou sem permissão.';
    if (field === 'medical_specialty_id') return 'Especialidade selecionada não é válida.';
    return `${label}: opção inválida.`;
  }
  if (lower.includes('boolean')) {
    return `${label}: valor inválido.`;
  }

  return `${label}: ${msg}`;
}

/**
 * Converte erros 422 do Laravel em texto legível para Toast/Alert.
 */
export function formatApiValidationErrors(error) {
  const errors = error?.errors || error?._rawErrorData?.errors || error?.erros || {};
  const entries = Object.entries(errors || {});

  if (entries.length === 0) {
    return error?.message || null;
  }

  const messages = [];
  entries.forEach(([field, value]) => {
    const label = FIELD_LABELS[field] || field;
    const list = Array.isArray(value) ? value : [value];
    list.forEach((item) => {
      if (item) messages.push(translateValidationMessage(field, label, item));
    });
  });

  return messages.join('\n');
}

export function getApiErrorMessage(error, fallback = 'Tente novamente') {
  return formatApiValidationErrors(error) || error?.message || fallback;
}

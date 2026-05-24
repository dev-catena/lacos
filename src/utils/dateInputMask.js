/**
 * Formata entrada digitada para dd/mm/aaaa.
 */
export function formatDateInputBR(value) {
  const numbers = (value || '').replace(/\D/g, '').slice(0, 8);

  if (numbers.length > 4) {
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4)}`;
  }
  if (numbers.length > 2) {
    return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
  }

  return numbers;
}

/**
 * Converte ISO (yyyy-mm-dd) ou Date para dd/mm/aaaa.
 */
export function formatDateToBR(dateInput) {
  if (!dateInput) return '';

  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateInput)) {
    const [year, month, day] = dateInput.split('T')[0].split('-');
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }

  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(date.getTime())) return '';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Extrai dia, mês e ano de uma string dd/mm/aaaa.
 */
export function parseBirthDateBR(value) {
  if (!value || typeof value !== 'string') return null;

  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;

  return {
    day: parseInt(match[1], 10),
    month: parseInt(match[2], 10),
    year: parseInt(match[3], 10),
  };
}

/**
 * Valida data de nascimento no formato dd/mm/aaaa.
 */
export function isValidBirthDateBR(value) {
  const parsed = parseBirthDateBR(value);
  if (!parsed) return false;

  const { day, month, year } = parsed;
  const today = new Date();
  const currentYear = today.getFullYear();

  if (year < 1900 || year > currentYear) return false;
  if (month < 1 || month > 12) return false;

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return false;
  }

  return date <= today;
}

/**
 * Converte dd/mm/aaaa para yyyy-mm-dd (API).
 */
export function birthDateBRToISO(value) {
  if (!isValidBirthDateBR(value)) return null;

  const { day, month, year } = parseBirthDateBR(value);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

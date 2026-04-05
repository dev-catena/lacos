/**
 * Níveis de qualificação profissional (médicos) — valores persistidos na API.
 * Rótulos alinhados a fluxos tipo agendamento Unimed.
 * API aceita array (múltipla seleção); valor único legado ainda é normalizado no app.
 */
export const DOCTOR_QUALIFICATION_LEVELS = [
  { value: 'especialista', label: 'Especialista' },
  { value: 'residencia', label: 'Com residência' },
  { value: 'mestrado', label: 'Mestrado' },
  { value: 'doutorado', label: 'Doutorado' },
  { value: 'pos_doutorado', label: 'Pós-doutorado' },
];

const ALLOWED_VALUES = new Set(DOCTOR_QUALIFICATION_LEVELS.map((o) => o.value));

/**
 * @param {unknown} raw
 * @returns {string[]}
 */
export function normalizeProfessionalQualificationLevels(raw) {
  if (raw == null || raw === '') return [];
  if (Array.isArray(raw)) {
    const next = [];
    const seen = new Set();
    for (const x of raw) {
      const s = String(x).trim();
      if (ALLOWED_VALUES.has(s) && !seen.has(s)) {
        seen.add(s);
        next.push(s);
      }
    }
    return next;
  }
  const s = String(raw).trim();
  if (!s) return [];
  if (s.startsWith('[')) {
    try {
      const p = JSON.parse(s);
      if (Array.isArray(p)) return normalizeProfessionalQualificationLevels(p);
    } catch {
      return [];
    }
  }
  return ALLOWED_VALUES.has(s) ? [s] : [];
}

/**
 * @param {string|string[]|null|undefined} value
 * @returns {string}
 */
export function labelForDoctorQualification(value) {
  if (value == null || value === '') return '';
  if (Array.isArray(value)) {
    if (value.length === 0) return '';
    const labels = value.map((v) => {
      const row = DOCTOR_QUALIFICATION_LEVELS.find((o) => o.value === v);
      return row ? row.label : String(v);
    });
    return labels.join(', ');
  }
  const row = DOCTOR_QUALIFICATION_LEVELS.find((o) => o.value === value);
  return row ? row.label : String(value);
}

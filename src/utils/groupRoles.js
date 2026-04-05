/**
 * Papéis da pessoa acompanhada no grupo — não faz sentido como "contato para ligar" na emergência.
 */
export function isAccompaniedPersonGroupRole(role) {
  if (role == null || role === '') return false;
  const r = String(role).toLowerCase();
  return r === 'patient' || r === 'priority_contact' || r === 'accompanied';
}

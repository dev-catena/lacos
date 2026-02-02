import { BR_UFS } from '../constants/brUfs';

const UF_SET = new Set(BR_UFS);

export function parseCrm(raw) {
  if (!raw) return { uf: '', number: '' };

  const s = String(raw).trim().toUpperCase();

  // UF + número (MG-123456, MG/123456, MG 123456)
  let m = s.match(/\b([A-Z]{2})\b\s*[-\/ ]\s*(\d{1,12})\b/);
  if (m && UF_SET.has(m[1])) return { uf: m[1], number: m[2] };

  // número + UF (123456-MG, 123456/MG, 123456 MG)
  m = s.match(/\b(\d{1,12})\b\s*[-\/ ]\s*\b([A-Z]{2})\b/);
  if (m && UF_SET.has(m[2])) return { uf: m[2], number: m[1] };

  // Se tiver UF em qualquer lugar, pegar a primeira UF válida e os dígitos
  const ufMatch = s.match(/\b([A-Z]{2})\b/);
  const digits = s.replace(/\D/g, '').slice(0, 12);
  if (ufMatch && UF_SET.has(ufMatch[1])) {
    return { uf: ufMatch[1], number: digits };
  }

  // Fallback: só números
  return { uf: '', number: digits };
}

export function formatCrmValue(uf, number) {
  const cleanUf = (uf || '').toString().trim().toUpperCase();
  let cleanNumber = (number || '').toString().replace(/\D/g, '');
  
  // Garantir que o número tenha exatamente 6 dígitos (preencher com zeros à esquerda)
  if (cleanNumber && cleanNumber.length > 0) {
    cleanNumber = cleanNumber.padStart(6, '0');
  }

  if (!cleanUf && !cleanNumber) return '';
  if (!cleanUf) return cleanNumber;
  if (!cleanNumber) return cleanUf;

  return `${cleanUf}-${cleanNumber}`;
}

export function formatCrmDisplay(raw) {
  if (!raw) return '';
  const { uf, number } = parseCrm(raw);
  if (uf && number) return `${number}/${uf}`;
  return String(raw);
}




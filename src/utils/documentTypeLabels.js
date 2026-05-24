const DOCUMENT_TYPE_LABELS = {
  exam_lab: 'Exame laboratorial',
  exam_image: 'Exame de imagem',
  prescription: 'Receita médica',
  medical_leave: 'Afastamento médico',
  medical_certificate: 'Atestado médico',
  report: 'Laudo / atestado',
  other: 'Documento',
};

const ENGLISH_TYPE_TITLES = new Set([
  'prescription',
  'receipt',
  'receipts',
  'report',
  'other',
  'exam_lab',
  'exam_image',
  'medical_leave',
  'medical_certificate',
]);

/**
 * Rótulo legível em português para o tipo de documento.
 */
export function getDocumentTypeLabel(type) {
  if (!type) return 'Documento';
  return DOCUMENT_TYPE_LABELS[type] || type;
}

/**
 * Corrige títulos salvos em inglês (ex.: "Receipt - Dra. Maria").
 */
function normalizeEnglishDocumentTitle(title) {
  if (!title) return title;
  return title
    .replace(/^receipts?\s*[-–—]\s*/i, 'Receita médica — ')
    .replace(/^prescription\s*[-–—]\s*/i, 'Receita médica — ');
}

/**
 * Título amigável para listagens (evita "prescription", "Receipt", etc.).
 */
export function getDocumentDisplayTitle(doc) {
  if (!doc) return 'Documento';

  const typeLabel = getDocumentTypeLabel(doc.type);
  const rawTitle = normalizeEnglishDocumentTitle(String(doc.title || '').trim());
  const doctorName = doc.doctor_name || doc.doctor?.name || null;

  const titleIsGeneric =
    !rawTitle ||
    ENGLISH_TYPE_TITLES.has(rawTitle.toLowerCase()) ||
    rawTitle.toLowerCase() === String(doc.type || '').toLowerCase();

  if (!titleIsGeneric) {
    return rawTitle;
  }

  if (doctorName) {
    return `${typeLabel} — ${doctorName}`;
  }

  return typeLabel;
}

export function normalizeDocument(doc) {
  if (!doc) return doc;
  return {
    ...doc,
    doctor_name: doc.doctor_name || doc.doctor?.name || null,
  };
}

export default DOCUMENT_TYPE_LABELS;

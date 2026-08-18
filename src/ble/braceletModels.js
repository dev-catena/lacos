/** Modelos J-Style suportados na aba Pulseira (V5 e V8). */

export const BRACELET_MODEL = {
  v5: 'v5',
  v8: 'v8',
};

const CAPABILITIES = {
  [BRACELET_MODEL.v5]: {
    id: BRACELET_MODEL.v5,
    label: 'Pulseira V5',
    shortLabel: 'V5',
    /** SDK V5: medição manual só HR (2) e SpO₂ (3). */
    supportsManualHrv: false,
    /** SDK V5: ECG via PPG 0x07 (ppgMode 1/3/5), não via 0x28 tipo 4. */
    supportsManualEcgPacket: false,
    supportsPpgEcg: true,
    supportsBpFromHrvHistory: true,
    supportsHeartRate: true,
    supportsSpo2: true,
    supportsTemperature: true,
    supportsSleep: true,
  },
  [BRACELET_MODEL.v8]: {
    id: BRACELET_MODEL.v8,
    label: 'Pulseira V8',
    shortLabel: 'V8',
    supportsManualHrv: true,
    supportsManualEcgPacket: true,
    supportsPpgEcg: true,
    supportsBpFromHrvHistory: true,
    supportsHeartRate: true,
    supportsSpo2: true,
    supportsTemperature: true,
    supportsSleep: true,
  },
};

export function normalizeBraceletModel(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === BRACELET_MODEL.v5) return BRACELET_MODEL.v5;
  if (raw === BRACELET_MODEL.v8) return BRACELET_MODEL.v8;
  return null;
}

export function getBraceletCapabilities(model) {
  const id = normalizeBraceletModel(model) || BRACELET_MODEL.v8;
  return CAPABILITIES[id];
}

export function braceletModelLabel(model) {
  return getBraceletCapabilities(model).label;
}

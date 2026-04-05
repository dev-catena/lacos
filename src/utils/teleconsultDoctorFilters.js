/**
 * Filtros e ordenação da lista de médicos na teleconsulta (AddAppointmentScreen).
 */

const EARTH_RADIUS_KM = 6371;

/** Nome do estado (sem acento, maiúsculas) → sigla UF */
const STATE_NAME_TO_UF = {
  ACRE: 'AC',
  ALAGOAS: 'AL',
  AMAPA: 'AP',
  AMAZONAS: 'AM',
  BAHIA: 'BA',
  CEARA: 'CE',
  'DISTRITO FEDERAL': 'DF',
  'ESPIRITO SANTO': 'ES',
  GOIAS: 'GO',
  MARANHAO: 'MA',
  'MATO GROSSO': 'MT',
  'MATO GROSSO DO SUL': 'MS',
  'MINAS GERAIS': 'MG',
  PARA: 'PA',
  PARAIBA: 'PB',
  PARANA: 'PR',
  PERNAMBUCO: 'PE',
  PIAUI: 'PI',
  'RIO DE JANEIRO': 'RJ',
  'RIO GRANDE DO NORTE': 'RN',
  'RIO GRANDE DO SUL': 'RS',
  RONDONIA: 'RO',
  RORAIMA: 'RR',
  'SANTA CATARINA': 'SC',
  SERGIPE: 'SE',
  'SAO PAULO': 'SP',
  TOCANTINS: 'TO',
};

function normalizeAccents(str) {
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
}

/**
 * Converte valor salvo em users.state (sigla, nome completo ou vazio) para UF de 2 letras.
 */
export function stateValueToUf(stateRaw) {
  if (stateRaw == null) return null;
  const s = String(stateRaw).trim();
  if (!s) return null;
  const noAccent = normalizeAccents(s);
  if (noAccent.length === 2 && /^[A-Z]{2}$/.test(noAccent)) {
    return noAccent;
  }
  return STATE_NAME_TO_UF[noAccent] || null;
}

/**
 * Ex.: "brasília df" → { cityPart: "brasília", ufPart: "DF" }
 */
function parseCityQueryWithOptionalUf(cityQueryLower) {
  const s = (cityQueryLower || '').trim();
  if (!s) return { cityPart: '', ufPart: null };
  const m = s.match(/^(.+?)\s+([a-z]{2})$/i);
  if (m) {
    return { cityPart: m[1].trim().toLowerCase(), ufPart: m[2].toUpperCase() };
  }
  return { cityPart: s.toLowerCase(), ufPart: null };
}

/**
 * UF digitada pelo usuário bate com o estado do médico (sigla, nome completo ou ausente).
 * Se não há UF no cadastro mas o usuário filtrou cidade e ela bateu, não excluímos (evita falso negativo).
 * Se o usuário filtrou só UF, médico sem estado no cadastro não entra.
 */
function matchesStateFilter(doctorStateRaw, filterUf, cityAlreadyMatches, hasCityFilter) {
  if (!filterUf || filterUf.length < 2) return true;
  const want = filterUf.slice(0, 2).toUpperCase();
  const docUf = stateValueToUf(doctorStateRaw);
  if (docUf) {
    return docUf === want;
  }
  if (hasCityFilter && cityAlreadyMatches) {
    return true;
  }
  return false;
}

export function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

function doctorSpecialtyId(d) {
  return d.medical_specialty_id ?? d.medicalSpecialtyId ?? d.medical_specialty?.id ?? null;
}

/**
 * Lista de níveis persistidos em `users.professional_qualification_level` (array JSON ou legado string).
 * @returns {string[]}
 */
export function doctorQualificationLevelsList(d) {
  if (!d || typeof d !== 'object') return [];
  const v = d.professional_qualification_level ?? d.user?.professional_qualification_level ?? null;
  if (v == null || v === '') return [];
  if (Array.isArray(v)) {
    return v.map((x) => String(x).trim()).filter(Boolean);
  }
  const s = String(v).trim();
  if (!s) return [];
  if (s.startsWith('[')) {
    try {
      const p = JSON.parse(s);
      if (Array.isArray(p)) return p.map((x) => String(x).trim()).filter(Boolean);
    } catch {
      return [];
    }
  }
  return [s];
}

/** Primeiro nível (legado); prefira `doctorQualificationLevelsList` para filtros inclusivos. */
export function doctorQualificationLevel(d) {
  const list = doctorQualificationLevelsList(d);
  return list.length ? list[0] : null;
}

/**
 * Normaliza sexo/gênero do cadastro (API pode enviar português ou inglês).
 * @param {string|null|undefined} raw
 * @returns {'masculino'|'feminino'|'outro'|null}
 */
export function normalizeDoctorGender(raw) {
  if (raw == null || raw === '') return null;
  const s = String(raw).trim().toLowerCase();
  if (s === 'male' || s === 'masculino' || s === 'm') return 'masculino';
  if (s === 'female' || s === 'feminino' || s === 'f') return 'feminino';
  if (s === 'other' || s === 'outro' || s === 'others') return 'outro';
  return 'outro';
}

function doctorCity(d) {
  return (d.city || '').toString().trim().toLowerCase();
}

function doctorState(d) {
  return (d.state || '').toString().trim().toUpperCase();
}

function parseLatLng(d) {
  const lat = d.latitude != null ? Number(d.latitude) : NaN;
  const lng = d.longitude != null ? Number(d.longitude) : NaN;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

/**
 * @param {object[]} doctors
 * @param {object} filters
 * @param {number|null} filters.specialtyId
 * @param {string} filters.cityQuery
 * @param {string} filters.stateQuery
 * @param {boolean} filters.onlyWithAvailability
 * @param {number|null} filters.maxDistanceKm
 * @param {string} filters.nameQuery
 * @param {'masculino'|'feminino'|'outro'|null|undefined} filters.gender — filtra pelo sexo informado no cadastro do profissional
 * @param {string[]|null|undefined} filters.qualificationLevels — níveis desejados (ex.: mestrado, doutorado); OR: médico precisa ter pelo menos um; vazio = qualquer
 * @param {string|null|undefined} [filters.qualificationLevel] — legado: um único nível (equivalente a um item em qualificationLevels)
 * @param {{ lat: number, lng: number }|null} refLocation
 */
export function filterTeleconsultDoctors(doctors, filters, refLocation) {
  if (!Array.isArray(doctors)) return [];

  const rawCityInput = (filters.cityQuery || '').trim().toLowerCase();
  const parsedCity = parseCityQueryWithOptionalUf(rawCityInput);
  const cityQ = parsedCity.cityPart;
  let stateQ = (filters.stateQuery || '').trim().toUpperCase().slice(0, 2);
  if (parsedCity.ufPart && !stateQ) {
    stateQ = parsedCity.ufPart;
  }
  const nameQ = (filters.nameQuery || '').trim().toLowerCase();
  const specId = filters.specialtyId != null ? Number(filters.specialtyId) : null;
  const onlyAvail = !!filters.onlyWithAvailability;
  const maxKm = filters.maxDistanceKm != null ? Number(filters.maxDistanceKm) : null;
  const hasRef =
    refLocation &&
    Number.isFinite(refLocation.lat) &&
    Number.isFinite(refLocation.lng);

  const genderWanted = filters.gender != null ? normalizeDoctorGender(filters.gender) : null;

  /** @type {string[]} */
  let qualWantedList = [];
  if (Array.isArray(filters.qualificationLevels) && filters.qualificationLevels.length > 0) {
    qualWantedList = [
      ...new Set(
        filters.qualificationLevels
          .map((x) => String(x).trim())
          .filter((s) => s !== '')
      ),
    ];
  } else if (
    filters.qualificationLevel != null &&
    String(filters.qualificationLevel).trim() !== ''
  ) {
    qualWantedList = [String(filters.qualificationLevel).trim()];
  }

  return doctors.filter((d) => {
    if (specId != null && !Number.isNaN(specId)) {
      const sid = doctorSpecialtyId(d);
      if (sid == null || Number(sid) !== specId) return false;
    }

    if (genderWanted != null) {
      const dg = normalizeDoctorGender(d.gender);
      if (dg !== genderWanted) return false;
    }

    if (qualWantedList.length > 0) {
      const levels = doctorQualificationLevelsList(d);
      const hasAny = qualWantedList.some((q) => levels.includes(q));
      if (!hasAny) return false;
    }

    let cityMatches = true;
    if (cityQ) {
      const c = doctorCity(d);
      cityMatches = !!(c && c.includes(cityQ));
      if (!cityMatches) return false;
    }

    if (stateQ) {
      const st = d.state != null ? d.state : '';
      if (!matchesStateFilter(st, stateQ, cityMatches, !!cityQ)) return false;
    }

    if (nameQ) {
      const n = (d.name || '').toString().toLowerCase();
      if (!n.includes(nameQ)) return false;
    }

    if (onlyAvail) {
      const isPlatform = d.is_platform_doctor === true;
      if (isPlatform && !d.has_future_availability && !d.next_slot_at) {
        return false;
      }
    }

    if (maxKm != null && maxKm > 0 && hasRef) {
      const ll = parseLatLng(d);
      if (ll) {
        const km = haversineKm(refLocation.lat, refLocation.lng, ll.lat, ll.lng);
        if (km > maxKm) return false;
      }
    }

    return true;
  });
}

/**
 * @param {'name'|'next_slot'|'distance'} sortBy
 * @param {{ lat: number, lng: number }|null} refLocation
 */
export function sortTeleconsultDoctors(doctors, sortBy, refLocation) {
  const list = [...doctors];
  const hasRef =
    refLocation &&
    Number.isFinite(refLocation.lat) &&
    Number.isFinite(refLocation.lng);

  if (sortBy === 'next_slot') {
    list.sort((a, b) => {
      const ta = a.next_slot_at ? new Date(a.next_slot_at).getTime() : Number.POSITIVE_INFINITY;
      const tb = b.next_slot_at ? new Date(b.next_slot_at).getTime() : Number.POSITIVE_INFINITY;
      if (ta !== tb) return ta - tb;
      return (a.name || '').localeCompare(b.name || '', 'pt-BR');
    });
    return list;
  }

  if (sortBy === 'distance' && hasRef) {
    list.sort((a, b) => {
      const la = parseLatLng(a);
      const lb = parseLatLng(b);
      const da = la
        ? haversineKm(refLocation.lat, refLocation.lng, la.lat, la.lng)
        : Number.POSITIVE_INFINITY;
      const db = lb
        ? haversineKm(refLocation.lat, refLocation.lng, lb.lat, lb.lng)
        : Number.POSITIVE_INFINITY;
      if (da !== db) return da - db;
      return (a.name || '').localeCompare(b.name || '', 'pt-BR');
    });
    return list;
  }

  list.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'pt-BR'));
  return list;
}

export function formatNextSlotLabel(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  try {
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return null;
  }
}

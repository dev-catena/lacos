import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import apiService from './apiService';

const LEGACY_STORAGE_KEY = '@lacos:streamAgents';
const USER_STORAGE_PREFIX = '@lacos:streamAgents:';

/** Proxy HTTPS no gateway → API HTTP do agente (porta 8000). */
export const STREAM_API_HTTPS_PROXY_ORIGIN = 'https://gateway.lacosapp.com/rtmp-agent';

/** WHEP HTTPS legado (upstream fixo no gateway). */
export const DEFAULT_WHEP_PUBLIC_URL = 'https://gateway.lacosapp.com/rtmp-whep';

/** WHEP HTTPS dinâmico por host do agente (proxy nginx → :8890). */
export const STREAM_WHEP_HTTPS_PROXY_ORIGIN = 'https://gateway.lacosapp.com/rtmp-whep-proxy';

const DEFAULT_WHEP_PORT = '8890';

const FETCH_TIMEOUT_MS = 20000;

export const DEFAULT_STREAM_AUTH = {
  user: 'roboflex',
  pass: 'yhvh77',
};

function normalizeStreamApi(streamApi) {
  return String(streamApi || '').trim().replace(/\/$/, '');
}

function normalizeWhepPublicUrl(value) {
  const url = String(value || '').trim().replace(/\/$/, '');
  return url || null;
}

function parseHttpStreamApi(streamApi) {
  const base = normalizeStreamApi(streamApi);
  if (!base.startsWith('http://')) return null;

  try {
    const parsed = new URL(base);
    const hostname = parsed.hostname;
    const port = parsed.port || '80';
    if (!hostname) return null;
    return { hostname, port, base };
  } catch {
    return null;
  }
}

/** No iOS, HTTP direto (:8000) costuma falhar — usa proxy HTTPS no gateway. */
export function buildHttpsProxyStreamApi(streamApi) {
  const parsed = parseHttpStreamApi(streamApi);
  if (!parsed) return null;
  return `${STREAM_API_HTTPS_PROXY_ORIGIN}/${parsed.hostname}/${parsed.port}`;
}

export function getStreamApiCandidates(streamApi) {
  const direct = normalizeStreamApi(streamApi);
  const candidates = [];

  if (Platform.OS === 'ios') {
    const proxy = buildHttpsProxyStreamApi(direct);
    if (proxy && proxy !== direct) {
      candidates.push(proxy);
    }
  }

  if (!candidates.includes(direct)) {
    candidates.push(direct);
  }

  return candidates;
}

export function resolveSnapshotStreamApi(streamApi) {
  const candidates = getStreamApiCandidates(streamApi);
  return candidates[0] || normalizeStreamApi(streamApi);
}

function toBase64(value) {
  if (typeof global.btoa === 'function') {
    return global.btoa(value);
  }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  let i = 0;
  const input = unescape(encodeURIComponent(value));
  while (i < input.length) {
    const chr1 = input.charCodeAt(i++);
    const chr2 = input.charCodeAt(i++);
    const chr3 = input.charCodeAt(i++);
    const enc1 = chr1 >> 2;
    const enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
    let enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
    let enc4 = chr3 & 63;
    if (Number.isNaN(chr2)) {
      enc3 = 64;
      enc4 = 64;
    } else if (Number.isNaN(chr3)) {
      enc4 = 64;
    }
    output += chars.charAt(enc1) + chars.charAt(enc2) + chars.charAt(enc3) + chars.charAt(enc4);
  }
  return output;
}

function normalizeAuth(auth) {
  if (auth?.user && auth?.pass) {
    return { user: String(auth.user), pass: String(auth.pass) };
  }
  return { ...DEFAULT_STREAM_AUTH };
}

function normalizeCameras(cameras) {
  if (!Array.isArray(cameras) || cameras.length === 0) {
    throw new Error('QR inválido');
  }

  return cameras.map((camera) => {
    if (!camera?.id || !camera?.nome) {
      throw new Error('QR inválido');
    }
    return {
      id: String(camera.id).trim(),
      nome: String(camera.nome).trim(),
    };
  });
}

function camerasSignature(cameras) {
  return (cameras || [])
    .map((camera) => `${camera.id}:${camera.nome}`)
    .sort()
    .join('|');
}

async function fetchWithTimeout(url, options = {}, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function mapFetchError(error) {
  if (error?.name === 'AbortError') {
    return new Error('Tempo esgotado ao conectar ao servidor de streaming.');
  }
  return new Error('Sem conexão com o servidor de streaming. Verifique a rede.');
}

export async function getCurrentUserId() {
  try {
    const storedUser = await AsyncStorage.getItem('@lacos:user');
    if (!storedUser) return null;
    const user = JSON.parse(storedUser);
    return user?.id != null ? String(user.id) : null;
  } catch {
    return null;
  }
}

async function getStorageKey() {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('Faça login para vincular um agente de câmeras.');
  }
  return `${USER_STORAGE_PREFIX}${userId}`;
}

async function migrateLegacyStorageIfNeeded(userKey) {
  const legacyRaw = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
  if (!legacyRaw) return;

  const currentRaw = await AsyncStorage.getItem(userKey);
  if (!currentRaw) {
    await AsyncStorage.setItem(userKey, legacyRaw);
  }
  await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
}

export function parseQrPayload(text) {
  let data;
  try {
    data = JSON.parse(String(text || '').trim());
  } catch {
    throw new Error('QR inválido');
  }

  if (data?.v !== 1) {
    throw new Error('QR inválido');
  }

  // ── Formato novo: agente SegCond ──────────────────────────────────────────
  if (data.type === 'guard_agent_pair') {
    const guardApi = String(data.guard_api || '').trim().replace(/\/$/, '');
    const pairingId = String(data.pairing_id || '').trim();
    const code = String(data.code || '').trim();

    if (!guardApi || !pairingId || !code) {
      throw new Error('QR inválido');
    }

    return {
      v: 1,
      type: 'guard_agent_pair',
      guard_api: guardApi,
      pairing_id: pairingId,
      code,
    };
  }

  // ── Formato legado: lacos_cameras ─────────────────────────────────────────
  if (data.type !== 'lacos_cameras') {
    throw new Error('QR inválido');
  }

  const streamApi = normalizeStreamApi(data.stream_api);
  if (!streamApi) {
    throw new Error('QR inválido');
  }

  const whepPublicUrl = normalizeWhepPublicUrl(data.whep_public_url);

  return {
    v: 1,
    type: 'lacos_cameras',
    stream_api: streamApi,
    auth: normalizeAuth(data.auth),
    cameras: normalizeCameras(data.cameras),
    ...(whepPublicUrl ? { whep_public_url: whepPublicUrl } : {}),
  };
}

/**
 * Aceita um pareamento guard_agent_pair via API Guard.
 * Retorna {success, agent_uuid, nome} quando vinculado.
 */
export async function claimGuardPairing(guardApi, pairingId, code) {
  const response = await apiService.request(
    `/stream-agents/pairing/${pairingId}/claim`,
    {
      method: 'POST',
      body: JSON.stringify({ code }),
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (!response.success) {
    throw new Error(response.message || 'Erro ao vincular agente.');
  }

  return response;
}

/**
 * Aguarda o agente sincronizar câmeras após o claim (até maxWaitMs).
 * Retorna o primeiro agente com câmeras ou null.
 */
export async function waitForAgentSync(maxWaitMs = 15000, intervalMs = 2000) {
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, intervalMs));
    try {
      const response = await apiService.request('/user/stream-agents');
      const agents = response?.agents ?? [];
      const ready = agents.find((a) => Array.isArray(a.cameras) && a.cameras.length > 0);
      if (ready) return ready;
    } catch {
      // continua tentando
    }
  }
  return null;
}

export async function listAgents() {
  // Agentes locais (formato legado lacos_cameras)
  let localAgents = [];
  try {
    const storageKey = await getStorageKey();
    await migrateLegacyStorageIfNeeded(storageKey);
    const raw = await AsyncStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      localAgents = Array.isArray(parsed) ? parsed : [];
    }
  } catch (error) {
    if (error?.message?.includes('Faça login')) return [];
  }

  // Agentes do backend (formato guard_agent_pair, com câmeras sincronizadas)
  let backendAgents = [];
  try {
    const response = await apiService.request('/user/stream-agents');
    const raw = response?.agents ?? [];
    backendAgents = raw
      .filter((a) => a.agent_uuid && Array.isArray(a.cameras) && a.cameras.length > 0)
      .map((a) => ({
        stream_api: a.stream_api || '',
        nome: a.nome || 'Agente SegCond',
        agent_uuid: a.agent_uuid,
        cameras: (a.cameras || []).map((c) => ({ id: c.id ?? c.stream_id, nome: c.nome })),
        auth: null,
        type: 'guard',
      }));
  } catch {
    // sem rede ou não autenticado — usa só agentes locais
  }

  // Mescla: evita duplicar agentes que também estejam no AsyncStorage
  const localStreamApis = new Set(localAgents.map((a) => normalizeStreamApi(a.stream_api)));
  const uniqueBackend = backendAgents.filter(
    (a) => !a.stream_api || !localStreamApis.has(normalizeStreamApi(a.stream_api))
  );

  return [...localAgents, ...uniqueBackend];
}

async function persistAgents(agents) {
  const storageKey = await getStorageKey();
  await AsyncStorage.setItem(storageKey, JSON.stringify(agents));
}

export async function saveAgent(payload) {
  const parsed = parseQrPayload(JSON.stringify(payload));
  const agents = await listAgents();
  const streamApi = parsed.stream_api;
  const signature = camerasSignature(parsed.cameras);

  const exactDuplicate = agents.find((agent) => {
    if (normalizeStreamApi(agent.stream_api) !== streamApi) return false;
    return camerasSignature(agent.cameras || []) === signature;
  });

  if (exactDuplicate) {
    return {
      success: true,
      duplicate: true,
      agent: exactDuplicate,
      updated: false,
      created: false,
    };
  }

  const existingIndex = agents.findIndex(
    (agent) => normalizeStreamApi(agent.stream_api) === streamApi
  );

  const savedAgent = {
    stream_api: streamApi,
    auth: parsed.auth,
    cameras: parsed.cameras,
    ...(parsed.whep_public_url ? { whep_public_url: parsed.whep_public_url } : {}),
    vinculadoEm:
      existingIndex >= 0
        ? agents[existingIndex].vinculadoEm || new Date().toISOString()
        : new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    agents[existingIndex] = savedAgent;
  } else {
    agents.push(savedAgent);
  }

  await persistAgents(agents);

  return {
    success: true,
    duplicate: false,
    agent: savedAgent,
    updated: existingIndex >= 0,
    created: existingIndex < 0,
  };
}

export async function removeAgent(streamApi) {
  const key = normalizeStreamApi(streamApi);
  const agents = await listAgents();
  const filtered = agents.filter((agent) => normalizeStreamApi(agent.stream_api) !== key);
  await persistAgents(filtered);
  return { success: true };
}

export function listCamerasFromAgents(agents) {
  const items = [];
  (agents || []).forEach((agent) => {
    (agent.cameras || []).forEach((camera) => {
      items.push({
        id: camera.id,
        nome: camera.nome,
        stream_api: agent.stream_api,
        auth: agent.auth || DEFAULT_STREAM_AUTH,
        whep_public_url: agent.whep_public_url || null,
        vinculadoEm: agent.vinculadoEm,
      });
    });
  });
  return items;
}

export function snapshotUrl(streamApi, cameraId, cacheBust = null) {
  const base = resolveSnapshotStreamApi(streamApi);
  const url = `${base}/snapshots/latest/${encodeURIComponent(cameraId)}`;
  return cacheBust ? `${url}?t=${cacheBust}` : url;
}

export function buildSecurePlayProxyUrl(streamApi, cameraId, token) {
  const proxyBase = buildHttpsProxyStreamApi(streamApi);
  if (!proxyBase || !cameraId || !token) return null;
  return `${proxyBase}/streams/secure-play/${encodeURIComponent(cameraId)}?token=${encodeURIComponent(token)}`;
}

/** Redireciona fetch WHEP HTTP → proxy HTTPS antes da página do agente conectar. */
export function buildWhepFetchInterceptorScript(streamApi) {
  const parsed = parseHttpStreamApi(streamApi);
  if (!parsed) return '';

  const httpWhepOrigin = `http://${parsed.hostname}:${DEFAULT_WHEP_PORT}`;
  const httpsWhepOrigin = `${STREAM_WHEP_HTTPS_PROXY_ORIGIN}/${parsed.hostname}/${DEFAULT_WHEP_PORT}`;

  return `(function(){var H=${JSON.stringify(httpWhepOrigin)},S=${JSON.stringify(httpsWhepOrigin)},f=window.fetch.bind(window);window.fetch=function(i,o){var u=typeof i==='string'?i:(i&&i.url)||'';if(u.indexOf(H)===0){u=S+u.substring(H.length);if(typeof i==='string'){i=u;}else{i=new Request(u,o||{});}}return f(i,o);};})();true;`;
}

export function buildWhepPublicUrl(streamPath, token, whepPublicUrl = null, streamApi = null) {
  const path = String(streamPath || '').trim().replace(/^\/+|\/+$/g, '');
  if (!path || !token) return null;

  const explicitBase = normalizeWhepPublicUrl(whepPublicUrl);
  if (explicitBase) {
    return `${explicitBase}/${path}/whep?token=${encodeURIComponent(token)}`;
  }

  const parsed = parseHttpStreamApi(streamApi);
  if (parsed && (Platform.OS === 'ios' || parsed.base.startsWith('http://'))) {
    return `${STREAM_WHEP_HTTPS_PROXY_ORIGIN}/${parsed.hostname}/${DEFAULT_WHEP_PORT}/${path}/whep?token=${encodeURIComponent(token)}`;
  }

  return `${DEFAULT_WHEP_PUBLIC_URL}/${path}/whep?token=${encodeURIComponent(token)}`;
}

export function buildCameraPlayerHtml(whepUrl, cameraName = 'Câmera') {
  const safeTitle = String(cameraName || 'Câmera').replace(/[<>&]/g, '');
  const safeWhepUrl = JSON.stringify(whepUrl);

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle}</title>
    <style>
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #0f172a; color: #e5e7eb; font-family: Arial, sans-serif; }
      main { width: min(100%, 960px); padding: 24px; box-sizing: border-box; }
      video { width: 100%; background: #000; border-radius: 12px; }
      p { color: #94a3b8; text-align: center; }
    </style>
  </head>
  <body>
    <main>
      <video id="video" controls autoplay muted playsinline></video>
      <p id="status">Conectando ao stream...</p>
    </main>
    <script>
      const videoEl = document.getElementById("video");
      const statusEl = document.getElementById("status");
      const WHEP_URL = ${safeWhepUrl};
      const RETRY_DELAYS_MS = [1000, 1500, 2500, 4000, 8000];
      let pc = null, reconnectTimer = null, retryCount = 0, connecting = false;

      function setStatus(message) { statusEl.textContent = message; }
      function clearReconnectTimer() { if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; } }
      function cleanupPeerConnection() {
        if (!pc) return;
        pc.ontrack = null; pc.onconnectionstatechange = null; pc.oniceconnectionstatechange = null;
        try { pc.close(); } catch (e) {}
        pc = null; videoEl.srcObject = null;
      }
      async function waitForIceGathering(currentPc) {
        if (currentPc.iceGatheringState === "complete") return;
        await new Promise((resolve) => {
          const onChange = () => {
            if (currentPc.iceGatheringState === "complete") {
              currentPc.removeEventListener("icegatheringstatechange", onChange);
              resolve();
            }
          };
          currentPc.addEventListener("icegatheringstatechange", onChange);
          setTimeout(() => { currentPc.removeEventListener("icegatheringstatechange", onChange); resolve(); }, 2000);
        });
      }
      function classifyPlaybackError(message) {
        if (!message) return "Erro desconhecido.";
        if (message.includes("404")) return "Stream offline.";
        if (message.includes("401") || message.includes("403")) return "Token expirado.";
        if (message.includes("500")) return "Erro no servidor de video (500).";
        return "Falha na conexao.";
      }
      function scheduleReconnect(reason) {
        if (reconnectTimer) return;
        cleanupPeerConnection();
        const delay = RETRY_DELAYS_MS[Math.min(retryCount, RETRY_DELAYS_MS.length - 1)];
        retryCount += 1;
        setStatus(reason + " Tentando reconectar em " + Math.round(delay / 1000) + "s...");
        reconnectTimer = setTimeout(() => { reconnectTimer = null; connect(); }, delay);
      }
      function attachPeerConnectionHandlers(currentPc) {
        currentPc.ontrack = (event) => { videoEl.srcObject = event.streams[0]; retryCount = 0; setStatus("Stream conectado."); };
        currentPc.onconnectionstatechange = () => {
          if (currentPc !== pc) return;
          if (["failed", "disconnected", "closed"].includes(currentPc.connectionState)) scheduleReconnect("Conexao perdida.");
        };
        currentPc.oniceconnectionstatechange = () => {
          if (currentPc !== pc) return;
          if (["failed", "disconnected", "closed"].includes(currentPc.iceConnectionState)) scheduleReconnect("Stream indisponivel.");
        };
      }
      async function connect() {
        if (connecting) return;
        clearReconnectTimer(); cleanupPeerConnection(); connecting = true; setStatus("Conectando ao stream...");
        const currentPc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] }); pc = currentPc;
        currentPc.addTransceiver("video", { direction: "recvonly" });
        currentPc.addTransceiver("audio", { direction: "recvonly" });
        attachPeerConnectionHandlers(currentPc);
        try {
          const offer = await currentPc.createOffer();
          await currentPc.setLocalDescription(offer);
          await waitForIceGathering(currentPc);
          const response = await fetch(WHEP_URL, { method: "POST", headers: { "Content-Type": "application/sdp" }, body: currentPc.localDescription.sdp });
          if (!response.ok) throw new Error(await response.text() || ("HTTP " + response.status));
          await currentPc.setRemoteDescription({ type: "answer", sdp: await response.text() });
          retryCount = 0; setStatus("Aguardando midia...");
        } catch (error) {
          scheduleReconnect(classifyPlaybackError(error.message));
        } finally { connecting = false; }
      }
      window.addEventListener("beforeunload", () => { clearReconnectTimer(); cleanupPeerConnection(); });
      connect();
    </script>
  </body>
</html>`;
}

export function buildPlayerSource(playData, { cameraName, whepPublicUrl, streamApi } = {}) {
  const shouldUseHttpsPlayer =
    Platform.OS === 'ios' ||
    String(playData?.play_url || '').startsWith('http://');

  if (
    shouldUseHttpsPlayer &&
    streamApi &&
    playData?.token &&
    playData?.camera_id
  ) {
    const uri = buildSecurePlayProxyUrl(streamApi, playData.camera_id, playData.token);
    const injectWhepPatch = buildWhepFetchInterceptorScript(streamApi);
    if (uri && injectWhepPatch) {
      return {
        type: 'uri',
        uri,
        injectWhepPatch,
        whepUrl: uri,
      };
    }
  }

  const whepUrl = buildWhepPublicUrl(
    playData?.stream_path,
    playData?.token,
    whepPublicUrl,
    streamApi
  );

  if (shouldUseHttpsPlayer && whepUrl) {
    return {
      type: 'html',
      html: buildCameraPlayerHtml(whepUrl, cameraName),
      whepUrl,
    };
  }

  if (playData?.play_url) {
    return { type: 'uri', uri: playData.play_url };
  }

  return null;
}

async function requestSecurePlayUrl(apiBase, auth, cameraId, ttlSeconds) {
  const credentials = normalizeAuth(auth);
  const url = `${normalizeStreamApi(apiBase)}/streams/secure-play-url/${encodeURIComponent(cameraId)}?ttl_seconds=${ttlSeconds}`;

  let response;
  try {
    response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${toBase64(`${credentials.user}:${credentials.pass}`)}`,
        Accept: 'application/json',
      },
    });
  } catch (error) {
    throw mapFetchError(error);
  }

  if (response.status === 401) {
    throw new Error('Credenciais inválidas para acessar a câmera.');
  }

  if (response.status === 403) {
    throw new Error('Acesso negado ou token expirado. Tente atualizar a transmissão.');
  }

  if (!response.ok) {
    throw new Error('Não foi possível obter o link de transmissão da câmera.');
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('Resposta inválida do servidor de streaming.');
  }

  if (!data?.play_url && (!data?.token || !data?.stream_path)) {
    throw new Error('Servidor de streaming não retornou dados de reprodução.');
  }

  return data;
}

export async function getPlayUrl(streamApi, auth, cameraId, ttlSeconds = 600) {
  const candidates = getStreamApiCandidates(streamApi);
  let lastError = null;

  for (const apiBase of candidates) {
    try {
      return await requestSecurePlayUrl(apiBase, auth, cameraId, ttlSeconds);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Sem conexão com o servidor de streaming. Verifique a rede.');
}

export default {
  getCurrentUserId,
  parseQrPayload,
  listAgents,
  saveAgent,
  removeAgent,
  listCamerasFromAgents,
  snapshotUrl,
  getPlayUrl,
  buildPlayerSource,
  buildWhepPublicUrl,
  buildSecurePlayProxyUrl,
  buildWhepFetchInterceptorScript,
  buildHttpsProxyStreamApi,
  getStreamApiCandidates,
  DEFAULT_STREAM_AUTH,
  DEFAULT_WHEP_PUBLIC_URL,
};

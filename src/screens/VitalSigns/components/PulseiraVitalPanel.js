import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  AppState,
  Platform,
  RefreshControl,
  Alert,
} from 'react-native';
import Toast from 'react-native-toast-message';
import moment from 'moment';
import colors from '../../../constants/colors';
import SafeIcon from '../../../components/SafeIcon';
import { useV8Ble } from '../../../ble/v8/useV8Ble';
import { latestFromVitalRows } from '../../../ble/v8/v8LatestFromVitals';
import {
  BRACELET_MODEL,
  braceletModelLabel,
} from '../../../ble/braceletModels';
import { useAuth } from '../../../contexts/AuthContext';
import vitalSignService from '../../../services/vitalSignService';
import {
  V8_AUTO_RECORD_INTERVAL_MS,
  getLastV8AutoSaveAt,
  isV8AutoSaveDue,
  msUntilNextV8AutoSave,
  persistBraceletVitalSigns,
  setLastV8AutoSaveAt,
} from '../../../services/v8VitalAutoRecord';
import {
  claimV8BlePairing,
  getV8BlePairing,
  isV8BlePairingUnavailable,
  unpairV8BlePairing,
} from '../../../services/v8BlePairingService';
import groupService from '../../../services/groupService';
import { describeCurrentOta, getOtaInfo } from '../../../services/otaUpdateService';

function unwrapGroupPayload(result) {
  const raw = result?.data;
  if (!raw || typeof raw !== 'object') return null;
  if (raw.id && (raw.is_admin !== undefined || raw.created_by !== undefined || raw.group_members)) {
    return raw;
  }
  if (raw.data?.id) return raw.data;
  if (raw.group?.id) return raw.group;
  return raw;
}

function userIsGroupAdmin(group, userId) {
  if (!group || userId == null) return false;
  const uid = String(userId);
  if (group.is_admin === true || group.is_creator === true) return true;
  if (String(group.created_by || '') === uid) return true;
  if (String(group.admin_user_id || '') === uid) return true;
  const me = (group.group_members || []).find((m) => String(m.user_id || m.id || '') === uid);
  return me?.role === 'admin' || me?.is_admin === true;
}

function userIsGroupPatient(group, userId) {
  if (!group || userId == null) return false;
  const uid = String(userId);
  const me = (group.group_members || []).find((m) => String(m.user_id || m.id || '') === uid);
  const role = String(me?.role || group.my_role || '').toLowerCase();
  return role === 'patient' || role === 'priority_contact' || role === 'accompanied';
}

async function resolveGroupAdmin(groupId, userId) {
  try {
    const result = await groupService.getGroup(groupId);
    if (!result?.success) return false;
    return userIsGroupAdmin(unwrapGroupPayload(result), userId);
  } catch {
    return false;
  }
}

function ModelPicker({ selected, onSelect, disabled }) {
  const options = [
    {
      id: BRACELET_MODEL.v5,
      title: 'V5',
      subtitle: 'FC, SpO₂, temp., sono e ECG via PPG',
    },
    {
      id: BRACELET_MODEL.v8,
      title: 'V8',
      subtitle: 'FC, SpO₂, PA, temp., sono e ECG',
    },
  ];
  return (
    <View style={styles.modelPicker}>
      <Text style={styles.sectionTitle}>Qual pulseira o paciente usa?</Text>
      <Text style={styles.sectionHint}>
        Escolha o modelo antes de procurar. Só um fica vinculado a este paciente.
      </Text>
      <View style={styles.modelRow}>
        {options.map((opt) => {
          const active = selected === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              style={[styles.modelCard, active && styles.modelCardActive]}
              onPress={() => onSelect(opt.id)}
              disabled={disabled}
              activeOpacity={0.85}
            >
              <SafeIcon
                name="watch"
                size={22}
                color={active ? colors.primary : colors.gray400}
              />
              <Text style={[styles.modelCardTitle, active && styles.modelCardTitleActive]}>
                {opt.title}
              </Text>
              <Text style={styles.modelCardSub}>{opt.subtitle}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function statusLabel(uiState) {
  switch (uiState) {
    case 'unavailable':
      return 'Bluetooth indisponível';
    case 'poweredOff':
      return 'Bluetooth desligado';
    case 'scanning':
      return 'Procurando dispositivos…';
    case 'connecting':
      return 'Conectando…';
    case 'connected':
      return 'Conectada';
    case 'measuring':
      return 'Medindo frequência cardíaca…';
    case 'measuringSpo2':
      return 'Medindo oxigenação…';
    case 'measuringBP':
      return 'Medindo pressão arterial…';
    case 'measuringEcg':
      return 'Medindo ECG…';
    case 'error':
      return 'Erro';
    default:
      return 'Desconectada';
  }
}

function formatCountdown(ms) {
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function readingNumber(reading) {
  if (reading == null) return null;
  const v = reading.value;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function ReadingsGrid({
  heartRate,
  spo2,
  bloodPressure,
  temperatureC,
  sleepSession,
  ecgResult,
  ecgSampleCount,
  measuringEcg = false,
}) {
  return (
    <>
      <View style={styles.readingsRow}>
        <View style={styles.readingCard}>
          <Text style={styles.readingLabel}>FC</Text>
          <Text style={[styles.readingValue, { color: colors.error }]}>
            {heartRate != null ? heartRate : '—'}
          </Text>
          <Text style={styles.readingUnit}>bpm</Text>
        </View>
        <View style={styles.readingCard}>
          <Text style={styles.readingLabel}>SpO₂</Text>
          <Text style={[styles.readingValue, { color: colors.info }]}>
            {spo2 != null ? spo2 : '—'}
          </Text>
          <Text style={styles.readingUnit}>%</Text>
        </View>
        <View style={styles.readingCard}>
          <Text style={styles.readingLabel}>PA</Text>
          <Text style={[styles.readingValue, { color: colors.primary }]}>
            {bloodPressure
              ? `${bloodPressure.systolic}/${bloodPressure.diastolic}`
              : '—'}
          </Text>
          <Text style={styles.readingUnit}>mmHg</Text>
        </View>
      </View>

      <View style={styles.readingsRow}>
        <View style={styles.readingCard}>
          <Text style={styles.readingLabel}>Temp.</Text>
          <Text style={[styles.readingValue, { color: colors.success }]}>
            {temperatureC != null ? Number(temperatureC).toFixed(1) : '—'}
          </Text>
          <Text style={styles.readingUnit}>°C</Text>
        </View>
        <View style={[styles.readingCard, { flex: 2 }]}>
          <Text style={styles.readingLabel}>Sono</Text>
          <Text style={[styles.readingValue, { color: colors.primaryDark }]}>
            {sleepSession?.totalHours != null ? sleepSession.totalHours : '—'}
          </Text>
          <Text style={styles.readingUnit}>
            {sleepSession?.startAt
              ? `h · ${moment(sleepSession.startAt).format('DD/MM HH:mm')}`
              : 'h'}
          </Text>
        </View>
      </View>

      <View style={styles.readingsRow}>
        <View style={[styles.readingCard, { flex: 1 }]}>
          <Text style={styles.readingLabel}>ECG</Text>
          <Text style={[styles.readingValue, { color: '#0f766e', fontSize: 18 }]}>
            {measuringEcg
              ? ecgSampleCount
              : ecgResult?.heartRate != null
                ? ecgResult.heartRate
                : ecgResult?.samples != null
                  ? ecgResult.samples
                  : '—'}
          </Text>
          <Text style={styles.readingUnit}>
            {measuringEcg
              ? 'amostras'
              : ecgResult?.heartRate != null
                ? 'bpm'
                : ecgResult?.samples
                  ? 'amostras'
                  : '—'}
          </Text>
        </View>
        {ecgResult?.hrv != null || ecgResult?.stress != null ? (
          <View style={[styles.readingCard, { flex: 1 }]}>
            <Text style={styles.readingLabel}>HRV / Stress</Text>
            <Text style={[styles.readingValue, { color: '#0f766e', fontSize: 16 }]}>
              {ecgResult?.hrv ?? '—'} / {ecgResult?.stress ?? '—'}
            </Text>
            <Text style={styles.readingUnit}>ECG</Text>
          </View>
        ) : null}
      </View>
    </>
  );
}

/**
 * Dono da conexão BLE: conecta, mede e grava no grupo.
 */
function PulseiraOwnerPanel({
  groupId,
  onSaved,
  active = true,
  onPairingChanged,
  /** Paciente: grava vínculo no backend ao conectar. */
  claimOwnership = false,
  /** Paciente: envia leituras a cada 5 min. Cuidador: só sob demanda. */
  enableAutoSave = false,
  /** Paciente: sem botões "Medir agora". Demais perfis: com botões. */
  hideManualMeasures = false,
  /** Últimas leituras do backend (exibidas quando o BLE não está conectado). */
  serverLatest = null,
}) {
  const { user } = useAuth();
  const ble = useV8Ble(groupId, user?.id);
  const [saving, setSaving] = useState(false);
  const [lastAutoSaveAt, setLastAutoSaveAtState] = useState(null);
  const [nowTick, setNowTick] = useState(Date.now());
  const savingRef = useRef(false);
  const pairingRouteMissingToastRef = useRef(false);
  const bleRef = useRef(ble);
  bleRef.current = ble;

  const isConnected =
    ble.uiState === 'connected' ||
    ble.uiState === 'measuring' ||
    ble.uiState === 'measuringSpo2' ||
    ble.uiState === 'measuringBP' ||
    ble.uiState === 'measuringEcg';
  const isBusy =
    ble.uiState === 'unavailable' ||
    ble.uiState === 'connecting' ||
    ble.uiState === 'scanning' ||
    ble.uiState === 'measuring' ||
    ble.uiState === 'measuringSpo2' ||
    ble.uiState === 'measuringBP' ||
    ble.uiState === 'measuringEcg';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const last = await getLastV8AutoSaveAt(groupId);
      if (!cancelled) setLastAutoSaveAtState(last);
    })();
    return () => {
      cancelled = true;
    };
  }, [groupId]);

  useEffect(() => {
    // Só grava o vínculo depois de conectar de verdade neste grupo.
    // Carregar pulseira de outro grupo no storage não pode parear a Vovó Rosa.
    const live =
      ble.uiState === 'connected' ||
      ble.uiState === 'measuring' ||
      ble.uiState === 'measuringSpo2' ||
      ble.uiState === 'measuringBP' ||
      ble.uiState === 'measuringEcg';
    if (!claimOwnership) return undefined;
    if (!groupId || !ble.pairedDevice?.id || !live) return undefined;
    if (
      ble.pairedDevice.groupId != null &&
      String(ble.pairedDevice.groupId) !== String(groupId)
    ) {
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        await claimV8BlePairing(
          groupId,
          ble.pairedDevice.id,
          ble.pairedDevice.name,
          ble.pairedDevice.model || ble.braceletModel,
        );
      } catch (e) {
        if (cancelled) return;
        if (e?.status === 403) {
          Toast.show({
            type: 'info',
            text1: 'Pareamento só no app do paciente',
            text2: e.message || 'Use o celular do acompanhado perto da pulseira.',
          });
        } else if (e?.status === 409) {
          Toast.show({
            type: 'info',
            text1: 'Pulseira já vinculada',
            text2: e.message || 'Outro membro já conectou a pulseira deste grupo.',
          });
          onPairingChanged?.();
        } else if (isV8BlePairingUnavailable(e) && !pairingRouteMissingToastRef.current) {
          pairingRouteMissingToastRef.current = true;
          Toast.show({
            type: 'error',
            text1: 'Gateway sem a rota da pulseira',
            text2: 'A conexão local funciona, mas o vínculo não foi gravado. Atualize o servidor.',
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    claimOwnership,
    groupId,
    ble.uiState,
    ble.pairedDevice?.id,
    ble.pairedDevice?.name,
    ble.pairedDevice?.model,
    ble.pairedDevice?.groupId,
    ble.braceletModel,
    onPairingChanged,
  ]);

  const handleChangeBracelet = useCallback(async () => {
    if (claimOwnership) {
      try {
        await unpairV8BlePairing(groupId);
      } catch {
        // segue o unpair local mesmo se a API falhar
      }
    }
    await ble.changeBracelet();
    onPairingChanged?.();
  }, [ble, claimOwnership, groupId, onPairingChanged]);

  // Tick a cada 30s para atualizar countdown na UI
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const runPersist = useCallback(
    async ({ auto }) => {
      if (!groupId || savingRef.current) return null;
      const current = bleRef.current;
      savingRef.current = true;
      if (!auto) setSaving(true);
      try {
        const result = await persistBraceletVitalSigns({
          groupId,
          heartRate: current.heartRate,
          spo2: current.spo2,
          bloodPressure: current.bloodPressure,
          temperatureC: current.temperatureC,
          sleepSession: current.sleepSession,
          ecgResult: current.ecgResult,
          deviceName: current.connectedName || current.pairedDevice?.name,
          braceletModel: current.pairedDevice?.model || current.braceletModel,
          auto,
        });
        if (result.success) {
          if (auto) {
            const ts = Date.now();
            setLastAutoSaveAtState(ts);
            Toast.show({
              type: 'success',
              text1: 'Pulseira — auto-gravação',
              text2: `${result.saved} sinal(is) salvos no grupo.`,
              visibilityTime: 2500,
            });
          }
          const paired = current.pairedDevice;
          if (claimOwnership && paired?.id) {
            claimV8BlePairing(
              groupId,
              paired.id,
              paired.name,
              paired.model || current.braceletModel,
            ).catch(() => {});
          }
          onSaved?.();
        }
        return result;
      } finally {
        savingRef.current = false;
        if (!auto) setSaving(false);
      }
    },
    [claimOwnership, groupId, onSaved],
  );

  const handleSave = useCallback(async () => {
    if (!groupId) {
      Toast.show({ type: 'error', text1: 'Grupo inválido', text2: 'Não foi possível salvar.' });
      return;
    }
    const current = bleRef.current;
    if (
      current.heartRate == null &&
      current.spo2 == null &&
      !current.bloodPressure &&
      current.temperatureC == null &&
      !current.sleepSession &&
      !current.ecgResult
    ) {
      Toast.show({
        type: 'info',
        text1: 'Sem leituras',
        text2: 'Meça ao menos um sinal antes de salvar.',
      });
      return;
    }

    const result = await runPersist({ auto: false });
    if (!result) return;

    if (!result.success) {
      Toast.show({
        type: 'error',
        text1: 'Falha ao salvar',
        text2: result.error || 'Tente novamente',
      });
      return;
    }

    // Manual também conta como checkpoint do intervalo de auto-gravação
    const ts = Date.now();
    await setLastV8AutoSaveAt(groupId, ts);
    setLastAutoSaveAtState(ts);

    if (result.failed > 0) {
      Toast.show({
        type: 'info',
        text1: 'Salvo parcialmente',
        text2: `${result.saved} sinal(is) gravados.`,
      });
    } else {
      Toast.show({
        type: 'success',
        text1: 'Sinais salvos',
        text2: 'Leituras da pulseira registradas no grupo.',
      });
    }
  }, [groupId, runPersist]);

  // Auto-gravação a cada 5 minutos no celular do paciente enquanto conectada
  useEffect(() => {
    if (!enableAutoSave || !groupId || !isConnected) return undefined;

    let cancelled = false;

    const tryAutoSave = async () => {
      if (cancelled || AppState.currentState !== 'active') return;
      const current = bleRef.current;

      try {
        await current.refreshTemperature?.();
        await current.refreshSleep?.();
      } catch {
        // segue com o que já tiver em memória
      }

      // Pequena espera para notificações BLE de temp/sono chegarem
      await new Promise((r) => setTimeout(r, 1200));
      if (cancelled) return;

      const after = bleRef.current;
      const hasData =
        (after.heartRate != null && after.heartRate > 0) ||
        (after.spo2 != null && after.spo2 > 0) ||
        after.bloodPressure ||
        (after.temperatureC != null && after.temperatureC > 0) ||
        (after.sleepSession && after.sleepSession.totalHours > 0);
      if (!hasData) return;

      const due = await isV8AutoSaveDue(groupId, V8_AUTO_RECORD_INTERVAL_MS);
      if (!due || cancelled) return;
      await runPersist({ auto: true });
    };

    // Checa ao conectar / ter leituras; depois a cada 60s (o gate de 5 min evita duplicar)
    void tryAutoSave();
    const id = setInterval(() => {
      void tryAutoSave();
    }, 60_000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [
    enableAutoSave,
    groupId,
    isConnected,
    runPersist,
    ble.heartRate,
    ble.spo2,
    ble.bloodPressure,
    ble.temperatureC,
    ble.sleepSession,
  ]);

  const nextInMs = msUntilNextV8AutoSave(lastAutoSaveAt, V8_AUTO_RECORD_INTERVAL_MS);
  // nowTick força re-render do countdown
  void nowTick;

  const activeModel = ble.pairedDevice?.model || ble.braceletModel;
  const modelLabel = activeModel ? braceletModelLabel(activeModel) : null;

  const serverBp =
    serverLatest?.blood_pressure?.systolic != null
      ? {
          systolic: serverLatest.blood_pressure.systolic,
          diastolic: serverLatest.blood_pressure.diastolic,
        }
      : null;
  const displayHr = isConnected
    ? ble.heartRate
    : readingNumber(serverLatest?.heart_rate);
  const displaySpo2 = isConnected
    ? ble.spo2
    : readingNumber(serverLatest?.oxygen_saturation);
  const displayBp = isConnected ? ble.bloodPressure : serverBp;
  const displayTemp = isConnected
    ? ble.temperatureC
    : readingNumber(serverLatest?.temperature);
  const displaySleep = isConnected
    ? ble.sleepSession
    : (() => {
        const h = readingNumber(serverLatest?.sleep);
        return h != null
          ? { totalHours: h, startAt: serverLatest?.sleep?.measured_at }
          : null;
      })();
  const displayEcg = isConnected
    ? ble.ecgResult
    : serverLatest?.ecg
      ? {
          heartRate: serverLatest.ecg.heart_rate ?? readingNumber(serverLatest.ecg),
          hrv: serverLatest.ecg.hrv ?? null,
          stress: serverLatest.ecg.stress ?? null,
          samples: serverLatest.ecg.samples ?? null,
        }
      : null;

  return (
    <ScrollView
      style={[styles.scroll, !active && styles.hidden]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      pointerEvents={active ? 'auto' : 'none'}
    >
      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <SafeIcon
            name={isConnected ? 'watch' : 'bluetooth-outline'}
            size={22}
            color={isConnected ? colors.success : colors.primary}
          />
          <View style={styles.statusTextWrap}>
            <Text style={styles.statusTitle}>{statusLabel(ble.uiState)}</Text>
            <Text style={styles.statusSubtitle} numberOfLines={2}>
              {ble.statusDetail ||
                (ble.pairedDevice
                  ? `Pareada (${modelLabel || 'V8'}): ${ble.pairedDevice.name}`
                  : 'Escolha V5 ou V8 e conecte a pulseira do paciente')}
            </Text>
          </View>
          {ble.battery != null ? (
            <Text style={styles.battery}>{ble.battery}%</Text>
          ) : null}
        </View>
        {ble.error ? <Text style={styles.errorText}>{ble.error}</Text> : null}
        {ble.lastBreadcrumb?.step && ble.lastBreadcrumb.step !== 'connect:done' ? (
          <View style={styles.breadcrumbBox}>
            <Text style={styles.breadcrumbTitle}>Última etapa antes de falha/crash</Text>
            <Text style={styles.breadcrumbStep} selectable>
              {ble.lastBreadcrumb.step}
            </Text>
            <Text style={styles.breadcrumbMeta} selectable>
              {ble.lastBreadcrumb.at
                ? moment(ble.lastBreadcrumb.at).format('DD/MM HH:mm:ss')
                : ''}
              {ble.lastBreadcrumb.message ? ` · ${ble.lastBreadcrumb.message}` : ''}
            </Text>
            <Text style={styles.breadcrumbHint}>
              Copie essa etapa e envie no chat (build EAS, sem USB).
            </Text>
            <TouchableOpacity onPress={ble.clearLastBreadcrumb} hitSlop={8}>
              <Text style={styles.breadcrumbClear}>Limpar</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        {ble.lastUpdate ? (
          <Text style={styles.updatedAt}>
            Atualizado {moment(ble.lastUpdate).format('DD/MM HH:mm:ss')}
          </Text>
        ) : null}
        {enableAutoSave && isConnected ? (
          <View style={styles.autoSaveBox}>
            <Text style={styles.autoSaveTitle}>Gravação automática (5 min)</Text>
            <Text style={styles.autoSaveText}>
              {lastAutoSaveAt
                ? `Último envio: ${moment(lastAutoSaveAt).format('DD/MM HH:mm')} · próximo em ${formatCountdown(nextInMs)}`
                : 'Aguardando primeira leitura para gravar no grupo a cada 5 minutos'}
            </Text>
          </View>
        ) : null}
        {hideManualMeasures && isConnected ? (
          <Text style={styles.viewerHint}>
            Medidas sob demanda ficam com os cuidadores. Neste celular a pulseira envia
            automaticamente para o grupo a cada 5 minutos.
          </Text>
        ) : null}
      </View>

      <ReadingsGrid
        heartRate={displayHr}
        spo2={displaySpo2}
        bloodPressure={displayBp}
        temperatureC={displayTemp}
        sleepSession={displaySleep}
        ecgResult={displayEcg}
        ecgSampleCount={isConnected ? ble.ecgSampleCount : displayEcg?.samples}
        measuringEcg={ble.uiState === 'measuringEcg'}
      />

      {!isConnected ? (
        <View style={styles.section}>
          {ble.pairedDevice ? (
            <>
              <TouchableOpacity
                style={[styles.primaryBtn, isBusy && styles.btnDisabled]}
                onPress={ble.reconnectPaired}
                disabled={isBusy}
                activeOpacity={0.85}
              >
                {ble.uiState === 'connecting' ? (
                  <ActivityIndicator color={colors.textWhite} />
                ) : (
                  <SafeIcon name="refresh" size={20} color={colors.textWhite} />
                )}
                <Text style={styles.primaryBtnText}>Reconectar pulseira</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={handleChangeBracelet}
                disabled={isBusy}
                activeOpacity={0.85}
              >
                <Text style={styles.secondaryBtnText}>
                  {claimOwnership ? 'Trocar pulseira' : 'Escolher outra pulseira'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <ModelPicker
                selected={ble.braceletModel}
                onSelect={ble.selectBraceletModel}
                disabled={isBusy}
              />
              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  (isBusy || !ble.braceletModel) && styles.btnDisabled,
                ]}
                onPress={ble.startScan}
                disabled={isBusy || !ble.braceletModel}
                activeOpacity={0.85}
              >
              {ble.uiState === 'scanning' ? (
                <ActivityIndicator color={colors.textWhite} />
              ) : (
                <SafeIcon name="bluetooth" size={20} color={colors.textWhite} />
              )}
              <Text style={styles.primaryBtnText}>
                {ble.uiState === 'scanning'
                  ? 'Procurando…'
                  : `Procurar pulseira ${ble.braceletModel ? ble.braceletModel.toUpperCase() : ''}`}
              </Text>
              </TouchableOpacity>
            </>
          )}

          {ble.devices.length > 0 ? (
            <View style={styles.deviceList}>
              <Text style={styles.deviceListTitle}>Dispositivos encontrados</Text>
              {ble.devices.map((d) => (
                <TouchableOpacity
                  key={d.id}
                  style={styles.deviceRow}
                  onPress={() => ble.connect(d.id, d.name)}
                  disabled={isBusy}
                  activeOpacity={0.7}
                >
                  <View>
                    <Text style={styles.deviceName}>{d.name}</Text>
                    <Text style={styles.deviceMeta}>
                      {d.rssi != null ? `${d.rssi} dBm` : d.id.slice(-8)}
                    </Text>
                  </View>
                  <SafeIcon name="chevron-forward" size={18} color={colors.gray400} />
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>
      ) : hideManualMeasures ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monitoramento automático</Text>
          <Text style={styles.sectionHint}>
            Mantenha este app aberto (ou em segundo plano com Bluetooth ligado) perto da
            pulseira. As leituras vão para o backend a cada 5 minutos para o grupo ver.
          </Text>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={ble.disconnect}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryBtnText}>Desconectar</Text>
          </TouchableOpacity>
          {claimOwnership ? (
            <TouchableOpacity
              style={styles.linkBtn}
              onPress={handleChangeBracelet}
              activeOpacity={0.7}
            >
              <Text style={styles.linkBtnText}>Trocar pulseira</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medir agora</Text>
          <Text style={styles.sectionHint}>
            Mantenha a pulseira firme no pulso. SpO₂ e PA levam cerca de 60 segundos. Os
            dados do monitoramento contínuo vêm do celular do paciente (a cada 5 minutos).
          </Text>

          <TouchableOpacity
            style={[
              styles.measureBtn,
              ble.uiState === 'measuring' && styles.measureBtnActive,
            ]}
            onPress={
              ble.uiState === 'measuring' ? ble.stopMeasurement : ble.startMeasurement
            }
            activeOpacity={0.85}
          >
            <SafeIcon name="heart" size={20} color={colors.textWhite} />
            <Text style={styles.measureBtnText}>
              {ble.uiState === 'measuring' ? 'Parar FC' : 'Frequência cardíaca'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.measureBtn,
              styles.measureBtnSpo2,
              ble.uiState === 'measuringSpo2' && styles.measureBtnActive,
            ]}
            onPress={
              ble.uiState === 'measuringSpo2'
                ? ble.stopSpo2Measurement
                : ble.startSpo2Measurement
            }
            activeOpacity={0.85}
          >
            <SafeIcon name="water" size={20} color={colors.textWhite} />
            <Text style={styles.measureBtnText}>
              {ble.uiState === 'measuringSpo2' ? 'Parar SpO₂' : 'Oxigenação (SpO₂)'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.measureBtn,
              styles.measureBtnBp,
              ble.uiState === 'measuringBP' && styles.measureBtnActive,
            ]}
            onPress={
              ble.uiState === 'measuringBP' ? ble.stopBpMeasurement : ble.startBpMeasurement
            }
            activeOpacity={0.85}
          >
            <SafeIcon name="fitness" size={20} color={colors.textWhite} />
            <Text style={styles.measureBtnText}>
              {ble.uiState === 'measuringBP' ? 'Parar PA' : 'Pressão arterial'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.measureBtn, styles.measureBtnTemp]}
            onPress={ble.refreshTemperature}
            activeOpacity={0.85}
          >
            <SafeIcon name="thermometer" size={20} color={colors.textWhite} />
            <Text style={styles.measureBtnText}>Atualizar temperatura</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.measureBtn, styles.measureBtnSleep]}
            onPress={ble.refreshSleep}
            activeOpacity={0.85}
          >
            <SafeIcon name="moon" size={20} color={colors.textWhite} />
            <Text style={styles.measureBtnText}>Atualizar sono</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.measureBtn,
              styles.measureBtnEcg,
              ble.uiState === 'measuringEcg' && styles.measureBtnActive,
            ]}
            onPress={
              ble.uiState === 'measuringEcg'
                ? ble.stopEcgMeasurement
                : ble.startEcgMeasurement
            }
            activeOpacity={0.85}
          >
            <SafeIcon name="pulse" size={20} color={colors.textWhite} />
            <Text style={styles.measureBtnText}>
              {ble.uiState === 'measuringEcg' ? 'Parar ECG' : 'Medir ECG (~50s)'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.btnDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color={colors.textWhite} />
            ) : (
              <SafeIcon name="save-outline" size={20} color={colors.textWhite} />
            )}
            <Text style={styles.primaryBtnText}>Salvar no grupo agora</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={ble.disconnect}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryBtnText}>Desconectar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.linkBtn}
            onPress={handleChangeBracelet}
            activeOpacity={0.7}
          >
            <Text style={styles.linkBtnText}>
              {claimOwnership ? 'Trocar pulseira' : 'Escolher outra pulseira'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {ble.steps != null ? (
        <Text style={styles.stepsHint}>Passos (realtime): {ble.steps}</Text>
      ) : null}
    </ScrollView>
  );
}

function PulseiraViewerPanel({
  active = true,
  pairing,
  latest,
  canUnpair,
  onRefresh,
  refreshing,
  onUnpair,
  loadError,
}) {
  const ownerName = pairing?.paired_by_name;
  const braceletName = pairing?.bracelet_name;
  const modelLabel = pairing?.bracelet_model
    ? braceletModelLabel(pairing.bracelet_model)
    : null;
  const measuredAt =
    latest?.heart_rate?.measured_at ||
    latest?.oxygen_saturation?.measured_at ||
    latest?.blood_pressure?.measured_at ||
    latest?.temperature?.measured_at ||
    latest?.sleep?.measured_at ||
    latest?.ecg?.measured_at ||
    pairing?.last_seen_at;

  const bp =
    latest?.blood_pressure?.systolic != null
      ? {
          systolic: latest.blood_pressure.systolic,
          diastolic: latest.blood_pressure.diastolic,
        }
      : null;

  const sleepHours = readingNumber(latest?.sleep);
  const temp = readingNumber(latest?.temperature);
  const hr = readingNumber(latest?.heart_rate);
  const spo2 = readingNumber(latest?.oxygen_saturation);
  const ecg = latest?.ecg
    ? {
        heartRate: latest.ecg.heart_rate ?? readingNumber(latest.ecg),
        hrv: latest.ecg.hrv ?? null,
        stress: latest.ecg.stress ?? null,
        samples: latest.ecg.samples ?? null,
      }
    : null;

  const hasAny =
    hr != null || spo2 != null || bp || temp != null || sleepHours != null || ecg;

  return (
    <ScrollView
      style={[styles.scroll, !active && styles.hidden]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      pointerEvents={active ? 'auto' : 'none'}
      refreshControl={
        <RefreshControl
          refreshing={!!refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
        />
      }
    >
      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <SafeIcon
            name="watch"
            size={22}
            color={hasAny ? colors.success : colors.primary}
          />
          <View style={styles.statusTextWrap}>
            <Text style={styles.statusTitle}>
              {hasAny ? 'Dados da pulseira do grupo' : 'Aguardando leituras'}
            </Text>
            <Text style={styles.statusSubtitle} numberOfLines={4}>
              {ownerName
                ? `Vinculada pelo paciente (${ownerName})${
                    braceletName ? ` · ${braceletName}` : ''
                  }${modelLabel ? ` · ${modelLabel}` : ''}. Dados enviados pelo celular dele.`
                : 'Aguardando o paciente parear a pulseira no app (Configuração → Pulseira V5/V8).'}
            </Text>
          </View>
        </View>
        {loadError ? <Text style={styles.errorText}>{loadError}</Text> : null}
        {measuredAt ? (
          <Text style={styles.updatedAt}>
            Último registro {moment(measuredAt).format('DD/MM HH:mm:ss')}
          </Text>
        ) : null}
        <Text style={styles.viewerHint}>
          O celular do paciente grava as leituras no grupo a cada 5 minutos. Para medir
          agora, conecte-se à pulseira pelo Bluetooth (perto do paciente). Puxe para
          atualizar.
        </Text>
      </View>

      <ReadingsGrid
        heartRate={hr}
        spo2={spo2}
        bloodPressure={bp}
        temperatureC={temp}
        sleepSession={sleepHours != null ? { totalHours: sleepHours, startAt: latest?.sleep?.measured_at } : null}
        ecgResult={ecg}
      />

      {canUnpair ? (
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={onUnpair}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryBtnText}>Desvincular pulseira do grupo</Text>
        </TouchableOpacity>
      ) : null}
    </ScrollView>
  );
}

/**
 * Painel da pulseira (V5 ou V8) no grupo.
 * - Paciente (patientMode): pareia, auto-grava a cada 5 min, sem Medir agora.
 * - Demais: veem dados do backend e podem medir sob demanda via BLE próximo.
 */
function ModeDebugBanner({ mode, canConnectServer, email, pairingError }) {
  const ota = getOtaInfo();
  const shortOta = ota.updateId ? String(ota.updateId).slice(0, 13) : 'embedded';
  return (
    <View style={styles.modeDebug}>
      <Text style={styles.modeDebugText}>
        modo={mode} · can_connect={canConnectServer == null ? '?' : canConnectServer ? '1' : '0'} ·{' '}
        ota={shortOta} · {email || '?—'}
        {pairingError ? ` · api:${pairingError}` : ''}
      </Text>
      <Text style={styles.modeDebugSub}>{describeCurrentOta()}</Text>
    </View>
  );
}

export default function PulseiraVitalPanel({
  groupId,
  onSaved,
  active = true,
  allowConnect = false,
  /** Perfil paciente/acompanhado: pareamento + auto 5 min, sem medidas sob demanda. */
  patientMode = false,
}) {
  const { user } = useAuth();
  const myId = user?.id != null ? Number(user.id) : null;
  const [loading, setLoading] = useState(true);
  const [canConnect, setCanConnect] = useState(false);
  const [canClaim, setCanClaim] = useState(false);
  const [canUnpair, setCanUnpair] = useState(false);
  const [pairing, setPairing] = useState(null);
  const [latest, setLatest] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [debugMeta, setDebugMeta] = useState({
    canConnectServer: null,
    pairingError: null,
  });

  const refresh = useCallback(async ({ silent } = {}) => {
    if (!groupId) return;
    if (!silent) setRefreshing(true);
    try {
      const vitalsRes = await vitalSignService.getVitalSigns(groupId);
      const fromVitals = latestFromVitalRows(vitalsRes?.data);

      // Fonte: API can_connect. Se a rota ainda não existir no gateway (404),
      // admin/criador não fica preso em viewer — o vínculo local segue só neste grupo.
      let pairingData = null;
      let pairingError = null;
      try {
        pairingData = await getV8BlePairing(groupId);
      } catch (e) {
        pairingData = null;
        pairingError = e?.message || 'pairing_fail';
      }

      const officialPairing = pairingData?.pairing || null;
      const ownerFromPairing =
        officialPairing?.paired_by != null ? Number(officialPairing.paired_by) : null;
      const linkedOwnerId = ownerFromPairing;
      const isLinkedOwner =
        myId != null && linkedOwnerId != null && Number(linkedOwnerId) === myId;

      let adminFallback = false;
      let patientFallback = false;
      if (pairingData?.canConnect !== true) {
        try {
          const result = await groupService.getGroup(groupId);
          if (result?.success) {
            const group = unwrapGroupPayload(result);
            adminFallback = userIsGroupAdmin(group, myId);
            patientFallback = userIsGroupPatient(group, myId);
          }
        } catch {
          adminFallback = pairingData == null ? await resolveGroupAdmin(groupId, myId) : false;
        }
      }
      const nextCanConnect =
        patientMode ||
        pairingData?.canConnect === true ||
        allowConnect ||
        patientFallback ||
        (pairingData == null && adminFallback);

      const nextCanClaim =
        patientMode ||
        pairingData?.canClaim === true ||
        (pairingData == null && (patientFallback || allowConnect));

      const pairingHasData =
        officialPairing && pairingData?.latest && Object.values(pairingData.latest).some(Boolean);
      const emptyLatest = {
        heart_rate: null,
        oxygen_saturation: null,
        blood_pressure: null,
        temperature: null,
        sleep: null,
        ecg: null,
      };
      const latestReadings = officialPairing
        ? pairingHasData
          ? pairingData.latest
          : fromVitals.hasWearable
            ? fromVitals.latest
            : emptyLatest
        : emptyLatest;

      const pairingPayload = officialPairing;

      const nextCanUnpair =
        pairingData?.canUnpair === true && !nextCanConnect;

      console.log('[PulseiraVitalPanel] mode', {
        myId,
        linkedOwnerId,
        isLinkedOwner,
        patientMode,
        serverCanConnect: pairingData?.canConnect,
        nextCanClaim,
        adminFallback,
        nextCanConnect,
        pairingError,
        email: user?.email,
        ota: getOtaInfo().updateId,
      });

      setDebugMeta({
        canConnectServer: pairingData != null ? !!pairingData.canConnect : adminFallback,
        pairingError,
      });
      setPairing(pairingPayload);
      setLatest(latestReadings);
      setCanConnect(nextCanConnect);
      setCanClaim(nextCanClaim);
      setCanUnpair(nextCanUnpair);
      setLoadError(null);
    } catch (e) {
      setCanConnect(false);
      setCanClaim(false);
      setCanUnpair(false);
      setDebugMeta({ canConnectServer: null, pairingError: e?.message || 'fail' });
      setLoadError(e?.message || 'Falha ao carregar dados da pulseira');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [groupId, myId, user?.email, allowConnect, patientMode]);

  useEffect(() => {
    setLoading(true);
    void refresh({ silent: true });
  }, [refresh]);

  useEffect(() => {
    if (!groupId) return undefined;
    // Viewer ou cuidador sem BLE: atualiza leituras do backend
    const id = setInterval(() => {
      void refresh({ silent: true });
    }, 30_000);
    return () => clearInterval(id);
  }, [groupId, refresh]);

  const handleUnpair = useCallback(() => {
    Alert.alert(
      'Desvincular pulseira',
      'Os membros deixarão de ver esta pulseira como vinculada. O paciente poderá parear de novo no app dele.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desvincular',
          style: 'destructive',
          onPress: async () => {
            try {
              await unpairV8BlePairing(groupId);
              await refresh();
            } catch (e) {
              Toast.show({
                type: 'error',
                text1: 'Não foi possível desvincular',
                text2: e?.message || 'Tente novamente',
              });
            }
          },
        },
      ],
    );
  }, [groupId, refresh]);

  if (loading) {
    return (
      <View style={[styles.scroll, !active && styles.hidden, styles.loadingBox]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const debugBanner = (
    <ModeDebugBanner
      mode={canConnect ? (patientMode || canClaim ? 'patient-ble' : 'care-ble') : 'viewer'}
      canConnectServer={debugMeta.canConnectServer}
      email={user?.email}
      pairingError={debugMeta.pairingError}
    />
  );

  if (canConnect) {
    return (
      <View style={[styles.scroll, !active && styles.hidden]}>
        {debugBanner}
        <PulseiraOwnerPanel
          groupId={groupId}
          onSaved={onSaved}
          active={active}
          onPairingChanged={refresh}
          claimOwnership={patientMode || canClaim}
          enableAutoSave={patientMode || canClaim}
          hideManualMeasures={patientMode || canClaim}
          serverLatest={latest}
        />
      </View>
    );
  }

  return (
    <View style={[styles.scroll, !active && styles.hidden]}>
      {debugBanner}
      <PulseiraViewerPanel
        active={active}
        pairing={pairing}
        latest={latest}
        canUnpair={canUnpair}
        refreshing={refreshing}
        onRefresh={refresh}
        onUnpair={handleUnpair}
        loadError={loadError}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  hidden: { display: 'none' },
  loadingBox: { alignItems: 'center', justifyContent: 'center', paddingTop: 40 },
  modeDebug: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFF3CD',
    borderWidth: 1,
    borderColor: '#F0D78C',
  },
  modeDebugText: {
    fontSize: 11,
    color: '#5C4B00',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  modeDebugSub: {
    marginTop: 2,
    fontSize: 10,
    color: '#7A6500',
  },
  content: { padding: 16, paddingBottom: 40 },
  viewerHint: {
    marginTop: 10,
    fontSize: 12,
    color: colors.textLight,
    lineHeight: 17,
  },
  statusCard: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusTextWrap: { flex: 1 },
  statusTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  statusSubtitle: { fontSize: 13, color: colors.textLight, marginTop: 2 },
  battery: { fontSize: 14, fontWeight: '600', color: colors.primary },
  errorText: { marginTop: 8, fontSize: 13, color: colors.error },
  breadcrumbBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  breadcrumbTitle: { fontSize: 12, fontWeight: '700', color: '#92400E' },
  breadcrumbStep: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '700',
    color: '#78350F',
    fontFamily: Platform?.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  breadcrumbMeta: { marginTop: 4, fontSize: 11, color: '#92400E' },
  breadcrumbHint: { marginTop: 6, fontSize: 11, color: '#A16207' },
  breadcrumbClear: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  updatedAt: { marginTop: 8, fontSize: 12, color: colors.gray400 },
  autoSaveBox: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  autoSaveTitle: { fontSize: 13, fontWeight: '700', color: colors.text },
  autoSaveText: { fontSize: 12, color: colors.textLight, marginTop: 4, lineHeight: 17 },
  readingsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  readingCard: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  readingLabel: { fontSize: 12, color: colors.textLight, fontWeight: '600' },
  readingValue: { fontSize: 22, fontWeight: '700', marginTop: 4 },
  readingUnit: { fontSize: 11, color: colors.gray400, marginTop: 2 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  sectionHint: { fontSize: 13, color: colors.textLight, marginBottom: 4 },
  modelPicker: { gap: 8, marginBottom: 4 },
  modelRow: { flexDirection: 'row', gap: 10 },
  modelCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gray200,
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 6,
  },
  modelCardActive: {
    borderColor: colors.primary,
    backgroundColor: '#EEF6FF',
  },
  modelCardTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  modelCardTitleActive: { color: colors.primary },
  modelCardSub: {
    fontSize: 11,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 15,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
  },
  primaryBtnText: { color: colors.textWhite, fontSize: 15, fontWeight: '700' },
  secondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.gray300,
    backgroundColor: colors.backgroundLight,
  },
  secondaryBtnText: { color: colors.text, fontSize: 14, fontWeight: '600' },
  btnDisabled: { opacity: 0.6 },
  deviceList: {
    marginTop: 8,
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    overflow: 'hidden',
  },
  deviceListTitle: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 6,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textLight,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  deviceName: { fontSize: 15, fontWeight: '600', color: colors.text },
  deviceMeta: { fontSize: 12, color: colors.gray400, marginTop: 2 },
  measureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.error,
    borderRadius: 12,
    paddingVertical: 14,
  },
  measureBtnSpo2: { backgroundColor: colors.info },
  measureBtnBp: { backgroundColor: colors.primaryDark },
  measureBtnTemp: { backgroundColor: colors.success },
  measureBtnSleep: { backgroundColor: '#6366f1' },
  measureBtnEcg: { backgroundColor: '#0f766e' },
  measureBtnActive: { opacity: 0.85 },
  measureBtnText: { color: colors.textWhite, fontSize: 15, fontWeight: '700' },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.success,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
  },
  linkBtn: { alignItems: 'center', paddingVertical: 8 },
  linkBtnText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  stepsHint: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 12,
    color: colors.gray400,
  },
});

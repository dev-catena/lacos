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
import { loadPairedDevice } from '../../../ble/v8/pairedStorage';
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
  unpairV8BlePairing,
} from '../../../services/v8BlePairingService';

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
function PulseiraOwnerPanel({ groupId, onSaved, active = true, onPairingChanged }) {
  const ble = useV8Ble(groupId);
  const [saving, setSaving] = useState(false);
  const [lastAutoSaveAt, setLastAutoSaveAtState] = useState(null);
  const [nowTick, setNowTick] = useState(Date.now());
  const savingRef = useRef(false);
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
    if (!groupId || !ble.pairedDevice?.id) return undefined;
    let cancelled = false;
    (async () => {
      try {
        await claimV8BlePairing(groupId, ble.pairedDevice.id, ble.pairedDevice.name);
      } catch (e) {
        if (e?.status === 409) {
          Toast.show({
            type: 'info',
            text1: 'Pulseira já vinculada',
            text2: e.message || 'Outro membro já conectou a pulseira deste grupo.',
          });
          onPairingChanged?.();
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [groupId, ble.pairedDevice?.id, ble.pairedDevice?.name, onPairingChanged]);

  const handleChangeBracelet = useCallback(async () => {
    try {
      await unpairV8BlePairing(groupId);
    } catch {
      // segue o unpair local mesmo se a API falhar
    }
    await ble.changeBracelet();
    onPairingChanged?.();
  }, [ble, groupId, onPairingChanged]);

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
          if (paired?.id) {
            claimV8BlePairing(groupId, paired.id, paired.name).catch(() => {});
          }
          onSaved?.();
        }
        return result;
      } finally {
        savingRef.current = false;
        if (!auto) setSaving(false);
      }
    },
    [groupId, onSaved],
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

    // Manual também conta como checkpoint do intervalo de 30 min
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

  // Auto-gravação a cada 30 minutos enquanto conectada
  useEffect(() => {
    if (!groupId || !isConnected) return undefined;

    let cancelled = false;

    const tryAutoSave = async () => {
      if (cancelled || AppState.currentState !== 'active') return;
      const current = bleRef.current;
      const hasData =
        (current.heartRate != null && current.heartRate > 0) ||
        (current.spo2 != null && current.spo2 > 0) ||
        current.bloodPressure ||
        (current.temperatureC != null && current.temperatureC > 0) ||
        (current.sleepSession && current.sleepSession.totalHours > 0);
      if (!hasData) return;

      const due = await isV8AutoSaveDue(groupId, V8_AUTO_RECORD_INTERVAL_MS);
      if (!due || cancelled) return;
      await runPersist({ auto: true });
    };

    // Checa ao conectar / ter leituras; depois a cada 60s (o gate de 30 min evita duplicar)
    void tryAutoSave();
    const id = setInterval(() => {
      void tryAutoSave();
    }, 60_000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [groupId, isConnected, runPersist, ble.heartRate, ble.spo2, ble.bloodPressure, ble.temperatureC, ble.sleepSession]);

  const nextInMs = msUntilNextV8AutoSave(lastAutoSaveAt, V8_AUTO_RECORD_INTERVAL_MS);
  // nowTick força re-render do countdown
  void nowTick;

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
                  ? `Pareada: ${ble.pairedDevice.name}`
                  : 'Procure e conecte a pulseira V8')}
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
        {isConnected ? (
          <View style={styles.autoSaveBox}>
            <Text style={styles.autoSaveTitle}>Gravação automática (30 min)</Text>
            <Text style={styles.autoSaveText}>
              {lastAutoSaveAt
                ? `Último envio: ${moment(lastAutoSaveAt).format('DD/MM HH:mm')} · próximo em ${formatCountdown(nextInMs)}`
                : 'Aguardando primeira leitura para gravar em vital_signs'}
            </Text>
          </View>
        ) : null}
      </View>

      <ReadingsGrid
        heartRate={ble.heartRate}
        spo2={ble.spo2}
        bloodPressure={ble.bloodPressure}
        temperatureC={ble.temperatureC}
        sleepSession={ble.sleepSession}
        ecgResult={ble.ecgResult}
        ecgSampleCount={ble.ecgSampleCount}
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
                <Text style={styles.secondaryBtnText}>Trocar pulseira</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.primaryBtn, isBusy && styles.btnDisabled]}
              onPress={ble.startScan}
              disabled={isBusy}
              activeOpacity={0.85}
            >
              {ble.uiState === 'scanning' ? (
                <ActivityIndicator color={colors.textWhite} />
              ) : (
                <SafeIcon name="bluetooth" size={20} color={colors.textWhite} />
              )}
              <Text style={styles.primaryBtnText}>
                {ble.uiState === 'scanning' ? 'Procurando…' : 'Procurar pulseira'}
              </Text>
            </TouchableOpacity>
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
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medir agora</Text>
          <Text style={styles.sectionHint}>
            Mantenha a pulseira firme no pulso. SpO₂ e PA levam cerca de 60 segundos. Com a
            conexão ativa, as leituras disponíveis são gravadas no grupo a cada 30 minutos.
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
            <Text style={styles.linkBtnText}>Trocar pulseira</Text>
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
            <Text style={styles.statusSubtitle} numberOfLines={3}>
              {ownerName
                ? `Conectada por ${ownerName}${braceletName ? ` · ${braceletName}` : ''}`
                : braceletName
                  ? `Pulseira ${braceletName} vinculada ao grupo`
                  : 'A pulseira do paciente já está vinculada. Você só visualiza os sinais gravados.'}
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
          Quem conectou a pulseira no celular do cuidador envia os sinais para o grupo.
          Puxe para atualizar.
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
 * Painel da pulseira V8 no grupo: o membro que conecta controla o BLE;
 * os demais só veem os sinais gravados no backend.
 */
export default function PulseiraVitalPanel({ groupId, onSaved, active = true }) {
  const [loading, setLoading] = useState(true);
  const [canConnect, setCanConnect] = useState(false);
  const [canUnpair, setCanUnpair] = useState(false);
  const [pairing, setPairing] = useState(null);
  const [latest, setLatest] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const refresh = useCallback(async ({ silent } = {}) => {
    if (!groupId) return;
    if (!silent) setRefreshing(true);
    try {
      const data = await getV8BlePairing(groupId);
      setPairing(data.pairing);
      setLatest(data.latest);
      setCanConnect(!!data.canConnect);
      setCanUnpair(!!data.canUnpair && !data.canConnect);
      setLoadError(null);
    } catch (e) {
      const local = await loadPairedDevice(groupId);
      setCanConnect(!!local);
      setCanUnpair(false);
      setLoadError(e?.message || 'Falha ao carregar vínculo da pulseira');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [groupId]);

  useEffect(() => {
    setLoading(true);
    void refresh({ silent: true });
  }, [refresh]);

  useEffect(() => {
    if (!groupId || canConnect) return undefined;
    const id = setInterval(() => {
      void refresh({ silent: true });
    }, 30_000);
    return () => clearInterval(id);
  }, [groupId, canConnect, refresh]);

  const handleUnpair = useCallback(() => {
    Alert.alert(
      'Desvincular pulseira',
      'Os membros deixarão de ver esta pulseira como vinculada. Quem conectou poderá parear de novo.',
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

  if (canConnect) {
    return (
      <PulseiraOwnerPanel
        groupId={groupId}
        onSaved={onSaved}
        active={active}
        onPairingChanged={refresh}
      />
    );
  }

  return (
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
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  hidden: { display: 'none' },
  loadingBox: { alignItems: 'center', justifyContent: 'center', paddingTop: 40 },
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

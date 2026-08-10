import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  AppState,
} from 'react-native';
import Toast from 'react-native-toast-message';
import moment from 'moment';
import colors from '../../../constants/colors';
import SafeIcon from '../../../components/SafeIcon';
import { useV8Ble } from '../../../ble/v8/useV8Ble';
import {
  V8_AUTO_RECORD_INTERVAL_MS,
  getLastV8AutoSaveAt,
  isV8AutoSaveDue,
  msUntilNextV8AutoSave,
  persistBraceletVitalSigns,
  setLastV8AutoSaveAt,
} from '../../../services/v8VitalAutoRecord';

function statusLabel(uiState) {
  switch (uiState) {
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

/**
 * Painel BLE da pulseira V8.
 * Grava FC/SpO₂/PA em vital_signs (API) manualmente e a cada 30 minutos enquanto conectada.
 */
export default function PulseiraVitalPanel({ groupId, onSaved, active = true }) {
  const ble = useV8Ble();
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
    ble.uiState === 'measuringBP';
  const isBusy =
    ble.uiState === 'connecting' ||
    ble.uiState === 'scanning' ||
    ble.uiState === 'measuring' ||
    ble.uiState === 'measuringSpo2' ||
    ble.uiState === 'measuringBP';

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
      !current.sleepSession
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

      <View style={styles.readingsRow}>
        <View style={styles.readingCard}>
          <Text style={styles.readingLabel}>FC</Text>
          <Text style={[styles.readingValue, { color: colors.error }]}>
            {ble.heartRate != null ? ble.heartRate : '—'}
          </Text>
          <Text style={styles.readingUnit}>bpm</Text>
        </View>
        <View style={styles.readingCard}>
          <Text style={styles.readingLabel}>SpO₂</Text>
          <Text style={[styles.readingValue, { color: colors.info }]}>
            {ble.spo2 != null ? ble.spo2 : '—'}
          </Text>
          <Text style={styles.readingUnit}>%</Text>
        </View>
        <View style={styles.readingCard}>
          <Text style={styles.readingLabel}>PA</Text>
          <Text style={[styles.readingValue, { color: colors.primary }]}>
            {ble.bloodPressure
              ? `${ble.bloodPressure.systolic}/${ble.bloodPressure.diastolic}`
              : '—'}
          </Text>
          <Text style={styles.readingUnit}>mmHg</Text>
        </View>
      </View>

      <View style={styles.readingsRow}>
        <View style={styles.readingCard}>
          <Text style={styles.readingLabel}>Temp.</Text>
          <Text style={[styles.readingValue, { color: colors.success }]}>
            {ble.temperatureC != null ? ble.temperatureC.toFixed(1) : '—'}
          </Text>
          <Text style={styles.readingUnit}>°C</Text>
        </View>
        <View style={[styles.readingCard, { flex: 2 }]}>
          <Text style={styles.readingLabel}>Sono</Text>
          <Text style={[styles.readingValue, { color: colors.primaryDark }]}>
            {ble.sleepSession?.totalHours != null ? ble.sleepSession.totalHours : '—'}
          </Text>
          <Text style={styles.readingUnit}>
            {ble.sleepSession?.startIso
              ? `h · ${moment(ble.sleepSession.startAt).format('DD/MM HH:mm')}`
              : 'h'}
          </Text>
        </View>
      </View>

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
                onPress={ble.changeBracelet}
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
            onPress={ble.changeBracelet}
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

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  hidden: { display: 'none' },
  content: { padding: 16, paddingBottom: 40 },
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

import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, PermissionsAndroid, Platform } from 'react-native';
import { clearPairedDevice, loadPairedDevice, savePairedDevice } from './pairedStorage';
import {
  clearConnectBreadcrumb,
  loadConnectBreadcrumb,
  saveConnectBreadcrumb,
} from './connectBreadcrumb';
import { elapsedMs, v8Error, v8Log, v8Warn } from './v8BleLog';
import {
  getBraceletCapabilities,
  normalizeBraceletModel,
} from '../braceletModels';
import {
  AUTO_TYPE,
  V8_UUID,
  base64ToBytes,
  bytesToBase64,
  cmdGetBattery,
  cmdGetHrvData,
  cmdGetSleepData,
  cmdGetSpo2History,
  cmdGetTemperatureHistory,
  cmdRealTimeStep,
  cmdRealtimeTemperature,
  cmdEcgStream,
  cmdPpgMode,
  cmdSetAutomatic,
  cmdSetDeviceTime,
  cmdStartEcg,
  cmdStartHeartRate,
  cmdStartHrv,
  cmdStartSpo2,
  cmdStopEcg,
  cmdStopHeartRate,
  cmdStopHrv,
  cmdStopSpo2,
  isPlausibleBloodPressure,
  isPlausibleSpo2,
  isPlausibleTemperatureC,
  MEASURE_TYPE,
  parseBattery,
  parseEcgRaw,
  parseHrvHistory,
  parseMeasurement,
  parseRealtimeActivity,
  parseRealtimeTemperature,
  parseSleepData,
  parseSpo2History,
  parseTemperatureHistory,
  toHex,
} from './v8Protocol';

/** MTU alto (512) derruba GATT em vários Androids; 247 é o máximo útil comum. */
const V8_PREFERRED_MTU = 247;

const BLE_UNAVAILABLE_MSG =
  'Bluetooth nativo indisponível. Recompile o app (não use só OTA) após instalar react-native-ble-plx.';

let BleManager;
let State;
try {
  const bleModule = require('react-native-ble-plx');
  BleManager = bleModule.BleManager;
  State = bleModule.State;
} catch (e) {
  console.error('[V8 BLE] Falha ao carregar react-native-ble-plx:', e);
}

async function requestBlePermissions() {
  if (Platform.OS !== 'android') return true;
  if (Platform.Version >= 31) {
    const result = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ]);
    return (
      result['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
      result['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED
    );
  }
  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  );
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * No Android, connectToDevice(id) sem o periférico no cache GATT derruba o processo.
 * Localiza o device por scan/connectedDevices antes do connect.
 */
async function locateBleDevice(manager, deviceId, timeoutMs = 10000) {
  try {
    const connected = await manager.connectedDevices([V8_UUID.service]);
    const already = connected?.find((d) => d.id === deviceId);
    if (already) return already;
  } catch {
    // ignore
  }
  try {
    const known = await manager.devices([deviceId]);
    if (known?.[0]) return known[0];
  } catch {
    // ignore
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = (device) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        manager.stopDeviceScan();
      } catch {
        // ignore
      }
      resolve(device);
    };
    const timer = setTimeout(() => finish(null), timeoutMs);
    try {
      manager.startDeviceScan(null, { allowDuplicates: false }, (err, device) => {
        if (err) {
          finish(null);
          return;
        }
        if (device?.id === deviceId) finish(device);
      });
    } catch {
      finish(null);
    }
  });
}

function createBleManagerSafe() {
  if (!BleManager) {
    throw new Error(BLE_UNAVAILABLE_MSG);
  }
  return new BleManager();
}

export function useV8Ble(groupId, ownerUserId) {
  const managerRef = useRef(null);
  const notifySubRef = useRef(null);
  const disconnectSubRef = useRef(null);
  const deviceRef = useRef(null);
  const measureTimeoutRef = useRef(null);
  const writeChainRef = useRef(Promise.resolve());
  const uiStateRef = useRef('idle');
  const pairedRef = useRef(null);
  const connectingRef = useRef(false);
  const autoConnectAttemptedRef = useRef(false);
  const handleNotifyRef = useRef(() => {});

  const [uiState, setUiState] = useState('idle');
  const [error, setError] = useState(null);
  const [statusDetail, setStatusDetail] = useState(null);
  const [lastRx, setLastRx] = useState(null);
  const [devices, setDevices] = useState([]);
  const [pairedDevice, setPairedDevice] = useState(null);
  const [braceletModel, setBraceletModelState] = useState(null);
  const braceletModelRef = useRef(null);
  const [pairReady, setPairReady] = useState(false);
  const [connectedName, setConnectedName] = useState(null);
  const [lastBreadcrumb, setLastBreadcrumb] = useState(null);
  const [heartRate, setHeartRate] = useState(null);
  const [spo2, setSpo2] = useState(null);
  const [steps, setSteps] = useState(null);
  const [battery, setBattery] = useState(null);
  const [bloodPressure, setBloodPressure] = useState(null);
  const [temperatureC, setTemperatureC] = useState(null);
  const [sleepSession, setSleepSession] = useState(null);
  const [ecgResult, setEcgResult] = useState(null);
  const [ecgSampleCount, setEcgSampleCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(null);
  const ecgSamplesRef = useRef([]);

  const updateUiState = useCallback((next) => {
    uiStateRef.current = next;
    setUiState(next);
  }, []);

  const applyBraceletModel = useCallback((model) => {
    const next = normalizeBraceletModel(model);
    braceletModelRef.current = next;
    setBraceletModelState(next);
    return next;
  }, []);

  const selectBraceletModel = useCallback(
    (model) => {
      applyBraceletModel(model);
    },
    [applyBraceletModel],
  );

  const currentCaps = () => getBraceletCapabilities(braceletModelRef.current);

  const clearMeasureTimers = useCallback(() => {
    if (measureTimeoutRef.current) {
      clearTimeout(measureTimeoutRef.current);
      measureTimeoutRef.current = null;
    }
  }, []);

  const write = useCallback(async (packet) => {
    const run = async () => {
      const device = deviceRef.current;
      if (!device) throw new Error('Nenhum dispositivo conectado');
      const payload = bytesToBase64(packet);
      try {
        await device.writeCharacteristicWithoutResponseForService(
          V8_UUID.service,
          V8_UUID.write,
          payload,
        );
      } catch (withoutErr) {
        v8Warn('write', 'withoutResponse falhou, tentando withResponse', {
          msg: withoutErr?.message || String(withoutErr),
        });
        await device.writeCharacteristicWithResponseForService(
          V8_UUID.service,
          V8_UUID.write,
          payload,
        );
      }
      // Android: intervalo maior reduz UndeliverableException no RxJava do ble-plx
      await sleep(Platform.OS === 'android' ? 180 : 120);
    };
    const next = writeChainRef.current.then(run, run);
    writeChainRef.current = next.catch(() => undefined);
    await next;
  }, []);

  const applyBloodPressure = useCallback((systolic, diastolic) => {
    if (!isPlausibleBloodPressure(systolic, diastolic)) return false;
    setBloodPressure({ systolic, diastolic });
    setLastUpdate(new Date());
    setStatusDetail(`PA ${systolic}/${diastolic} mmHg`);
    return true;
  }, []);

  const applySpo2 = useCallback((value) => {
    if (!isPlausibleSpo2(value)) return false;
    setSpo2(value);
    setLastUpdate(new Date());
    setStatusDetail(`SpO₂ ${value}%`);
    return true;
  }, []);

  const applyTemperature = useCallback((value) => {
    if (!isPlausibleTemperatureC(value)) return false;
    setTemperatureC(value);
    setLastUpdate(new Date());
    setStatusDetail(`Temp. ${value.toFixed(1)} °C`);
    return true;
  }, []);

  const handleNotify = useCallback(
    (base64) => {
      try {
        const bytes = base64ToBytes(base64);
        setLastRx(`RX ${toHex(bytes)} (${bytes.length}b)`);

        const activity = parseRealtimeActivity(bytes);
        if (activity) {
          if (activity.heartRate > 0) setHeartRate(activity.heartRate);
          if (activity.spo2 > 0) applySpo2(activity.spo2);
          if (activity.temperatureC > 0) applyTemperature(activity.temperatureC);
          setSteps(activity.step);
          setLastUpdate(new Date());
          return;
        }

        const rtTemp = parseRealtimeTemperature(bytes);
        if (rtTemp) {
          applyTemperature(rtTemp.temperatureC);
          return;
        }

        const tempHist = parseTemperatureHistory(bytes);
        if (tempHist) {
          applyTemperature(tempHist.temperatureC);
          return;
        }

        const sleepParsed = parseSleepData(bytes);
        if (sleepParsed?.latest) {
          setSleepSession(sleepParsed.latest);
          setLastUpdate(new Date());
          setStatusDetail(`Sono ${sleepParsed.latest.totalHours} h`);
          return;
        }

        const ecgRaw = parseEcgRaw(bytes);
        if (ecgRaw && uiStateRef.current === 'measuringEcg') {
          ecgSamplesRef.current.push(...ecgRaw.samples);
          const total = ecgSamplesRef.current.length;
          setEcgSampleCount(total);
          setLastUpdate(new Date());
          if (total % 50 < ecgRaw.samples.length) {
            setStatusDetail(`ECG — ${total} amostras…`);
          }
          return;
        }

        const measurement = parseMeasurement(bytes);
        if (measurement) {
          if (!measurement.isStopAck) {
            if (measurement.heartRate > 0) setHeartRate(measurement.heartRate);
            if (measurement.spo2 > 0) applySpo2(measurement.spo2);
            applyBloodPressure(measurement.systolicBP, measurement.diastolicBP);
            setLastUpdate(new Date());

            if (uiStateRef.current === 'measuringEcg' && measurement.type === MEASURE_TYPE.ecg) {
              const next = {
                heartRate: measurement.heartRate || null,
                hrv: measurement.hrv || null,
                stress: measurement.stress || null,
                systolicBP: measurement.systolicBP || null,
                diastolicBP: measurement.diastolicBP || null,
                samples: ecgSamplesRef.current.length,
                measuredAt: new Date().toISOString(),
              };
              setEcgResult(next);
              if (measurement.heartRate > 0) {
                setStatusDetail(`ECG FC ${measurement.heartRate} — medindo…`);
              }
            }

            if (uiStateRef.current === 'measuringSpo2' && isPlausibleSpo2(measurement.spo2)) {
              setStatusDetail(`SpO₂ ${measurement.spo2}% — medindo…`);
            }
            if (
              uiStateRef.current === 'measuringBP' &&
              isPlausibleBloodPressure(measurement.systolicBP, measurement.diastolicBP)
            ) {
              setStatusDetail(
                `PA ${measurement.systolicBP}/${measurement.diastolicBP} — medindo…`,
              );
            }
          }
          return;
        }

        const hrv = parseHrvHistory(bytes);
        if (hrv) {
          applyBloodPressure(hrv.systolic, hrv.diastolic);
          if (hrv.heartRate > 0) setHeartRate(hrv.heartRate);
          return;
        }

        const spo2Hist = parseSpo2History(bytes);
        if (spo2Hist != null) {
          applySpo2(spo2Hist);
          return;
        }

        const bat = parseBattery(bytes);
        if (bat != null) setBattery(bat);
      } catch (e) {
        console.warn('[V8 BLE] Erro ao processar notify:', e);
        v8Warn('notify:parse', e?.message || String(e));
      }
    },
    [applyBloodPressure, applySpo2, applyTemperature],
  );

  useEffect(() => {
    handleNotifyRef.current = handleNotify;
  }, [handleNotify]);

  const cleanupConnection = useCallback(() => {
    clearMeasureTimers();
    notifySubRef.current?.remove();
    notifySubRef.current = null;
    disconnectSubRef.current?.remove();
    disconnectSubRef.current = null;
    deviceRef.current = null;
    setConnectedName(null);
  }, [clearMeasureTimers]);

  const stopScan = useCallback(() => {
    managerRef.current?.stopDeviceScan();
  }, []);

  const safeWrite = useCallback(
    async (packet, label, t0) => {
      const tWrite = performance.now();
      v8Log('write:start', label, { ms: elapsedMs(t0) });
      try {
        await write(packet);
        v8Log('write:ok', label, { ms: elapsedMs(t0), tookMs: elapsedMs(tWrite) });
      } catch (e) {
        v8Warn('write:fail', label, {
          ms: elapsedMs(t0),
          msg: e?.message || String(e),
        });
      }
    },
    [write],
  );

  const connect = useCallback(
    async (deviceId, displayName, options) => {
      const manager = managerRef.current;
      if (!manager) {
        v8Error('connect:abort', 'manager ausente');
        return;
      }
      if (connectingRef.current) {
        v8Warn('connect:abort', 'já conectando', { deviceId });
        return;
      }

      const t0 = performance.now();
      const shortId = deviceId?.slice?.(-8) || deviceId;
      let step = 'init';
      const mark = async (nextStep, detail) => {
        step = nextStep;
        v8Log(nextStep, detail || displayName || shortId, {
          id: shortId,
          ms: elapsedMs(t0),
          os: Platform.OS,
          api: Platform.Version,
        });
        setStatusDetail(`Etapa: ${nextStep}`);
        // Persiste ANTES da próxima chamada nativa — sobrevive a crash em build EAS
        const crumb = await saveConnectBreadcrumb(nextStep, {
          deviceId: shortId,
          name: displayName || null,
          ms: elapsedMs(t0),
          os: Platform.OS,
          api: Platform.Version,
        });
        if (crumb) setLastBreadcrumb(crumb);
      };

      await mark('connect:begin', displayName);

      await mark('connect:permissions');
      const okPerms = await requestBlePermissions();
      if (!okPerms) {
        v8Error('connect:permissions', 'negadas');
        setError('Permissão de Bluetooth/localização negada.');
        updateUiState('error');
        return;
      }
      v8Log('connect:permissions', 'ok', { ms: elapsedMs(t0) });

      const persist = options?.persist !== false;
      connectingRef.current = true;
      stopScan();
      setError(null);
      setLastRx(null);
      updateUiState('connecting');
      setHeartRate(null);
      setSpo2(null);
      setSteps(null);
      setBattery(null);
      setBloodPressure(null);
      setTemperatureC(null);
      setSleepSession(null);
      setEcgResult(null);
      setEcgSampleCount(0);
      ecgSamplesRef.current = [];

      try {
        if (deviceRef.current) {
          await mark('connect:cancel-previous');
          try {
            await deviceRef.current.cancelConnection();
          } catch (cancelErr) {
            v8Warn('connect:cancel-previous', cancelErr?.message || String(cancelErr));
          }
          cleanupConnection();
        }

        let device;
        if (Platform.OS === 'android') {
          await mark('connect:scan');
          const located = await locateBleDevice(manager, deviceId);
          if (!located) {
            throw new Error(
              'Pulseira não encontrada no Bluetooth. Aproxime o aparelho e toque em Reconectar.',
            );
          }
          v8Log('connect:scan', 'encontrada', { id: shortId, ms: elapsedMs(t0) });
          await mark('connect:gatt');
          device = await located.connect({ autoConnect: false, timeout: 15000 });
        } else {
          await mark('connect:gatt');
          device = await manager.connectToDevice(deviceId, {
            autoConnect: false,
            timeout: 15000,
          });
        }
        v8Log('connect:gatt', 'conectado', {
          id: shortId,
          ms: elapsedMs(t0),
          mtu: device.mtu,
        });

        await mark('connect:discover');
        await device.discoverAllServicesAndCharacteristics();
        try {
          const services = await device.services();
          v8Log('connect:discover', 'ok', {
            ms: elapsedMs(t0),
            services: services?.map((s) => s.uuid) || [],
          });
        } catch {
          v8Log('connect:discover', 'ok (sem listar services)', { ms: elapsedMs(t0) });
        }

        if (Platform.OS === 'android') {
          await mark('connect:mtu');
          try {
            const mtuDevice = await device.requestMTU(V8_PREFERRED_MTU);
            v8Log('connect:mtu', 'ok', {
              requested: V8_PREFERRED_MTU,
              got: mtuDevice?.mtu,
              ms: elapsedMs(t0),
            });
          } catch (mtuErr) {
            v8Warn('connect:mtu', 'ignorado', {
              msg: mtuErr?.message || String(mtuErr),
              ms: elapsedMs(t0),
            });
          }
        }

        deviceRef.current = device;
        setConnectedName(displayName);

        await mark('connect:onDisconnected');
        disconnectSubRef.current = device.onDisconnected((_err, _dev) => {
          v8Warn('disconnect', 'GATT desconectado', {
            id: shortId,
            err: _err?.message || null,
          });
          cleanupConnection();
          updateUiState('idle');
          setError(
            pairedRef.current ? 'Pulseira desconectada. Toque em Reconectar.' : null,
          );
        });

        await mark('connect:monitor');
        notifySubRef.current = device.monitorCharacteristicForService(
          V8_UUID.service,
          V8_UUID.notify,
          (err, characteristic) => {
            if (err) {
              const msg = err?.message || String(err);
              if (!msg.includes('cancelled') && !msg.includes('disconnected')) {
                v8Warn('notify:err', msg);
                setError(msg);
              } else {
                v8Log('notify:err', msg);
              }
              return;
            }
            if (characteristic?.value) {
              try {
                handleNotifyRef.current(characteristic.value);
              } catch (notifyErr) {
                v8Warn('notify:parse', notifyErr?.message || String(notifyErr));
              }
            }
          },
        );
        v8Log('connect:monitor', 'inscrito FFF7', { ms: elapsedMs(t0) });

        // Espaça writes pós-connect para evitar storm GATT / undeliverable Rx no Android
        await mark('connect:settle');
        await sleep(400);

        const postWrites = [
          ['setTime', () => cmdSetDeviceTime()],
          ['battery', () => cmdGetBattery()],
          ['realtime', () => cmdRealTimeStep(true, true)],
          ['autoSpo2', () => cmdSetAutomatic(AUTO_TYPE.spo2, 5)],
          ['autoHrv', () => cmdSetAutomatic(AUTO_TYPE.hrv, 5)],
          ['autoTemp', () => cmdSetAutomatic(AUTO_TYPE.temp, 5)],
          ['spo2Hist', () => cmdGetSpo2History(0)],
          ['hrvHist', () => cmdGetHrvData(0)],
          ['rtTemp', () => cmdRealtimeTemperature()],
          ['tempHist', () => cmdGetTemperatureHistory(0)],
          ['sleep', () => cmdGetSleepData(0)],
        ];
        for (const [label, build] of postWrites) {
          await mark(`connect:write:${label}`);
          await safeWrite(build(), label, t0);
        }

        if (persist) {
          await mark('connect:persist');
          const model =
            normalizeBraceletModel(braceletModelRef.current) ||
            normalizeBraceletModel(pairedRef.current?.model) ||
            'v8';
          applyBraceletModel(model);
          const paired = {
            id: deviceId,
            name: displayName,
            ownerUserId: ownerUserId ?? null,
            model,
          };
          pairedRef.current = paired;
          setPairedDevice(paired);
          await savePairedDevice(paired, groupId);
        }

        await mark('connect:done');
        await clearConnectBreadcrumb();
        setLastBreadcrumb(null);
        updateUiState('connected');
        setError(null);
        setStatusDetail(
          'Conectada — monitoramento ativo (envia ao grupo a cada 5 min no app do paciente)',
        );
        v8Log('connect:done', 'sucesso', { id: shortId, totalMs: elapsedMs(t0) });
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        v8Error('connect:fail', `falhou em ${step}: ${message}`, e);
        await saveConnectBreadcrumb(`FAIL:${step}`, {
          deviceId: shortId,
          message,
          ms: elapsedMs(t0),
        }).then((crumb) => {
          if (crumb) setLastBreadcrumb(crumb);
        });
        setError(
          pairedRef.current
            ? `Falha ao reconectar (${step}): ${message}`
            : `Falha ao conectar (${step}): ${message}`,
        );
        if (Platform.OS !== 'android') {
          try {
            await manager.cancelDeviceConnection(deviceId);
          } catch {
            // ignore
          }
        }
        cleanupConnection();
        updateUiState(pairedRef.current ? 'idle' : 'error');
      } finally {
        connectingRef.current = false;
        v8Log('connect:finally', step, { ms: elapsedMs(t0) });
      }
    },
    [applyBraceletModel, cleanupConnection, groupId, ownerUserId, safeWrite, stopScan, updateUiState],
  );

  const tryAutoConnect = useCallback(async () => {
    const paired = pairedRef.current;
    const manager = managerRef.current;
    if (!paired || !manager || connectingRef.current) {
      v8Log('auto:skip', 'precondição', {
        paired: !!paired,
        manager: !!manager,
        connecting: connectingRef.current,
      });
      return;
    }
    if (
      uiStateRef.current === 'unavailable' ||
      uiStateRef.current === 'connected' ||
      uiStateRef.current === 'connecting' ||
      uiStateRef.current === 'measuring' ||
      uiStateRef.current === 'measuringBP' ||
      uiStateRef.current === 'measuringSpo2' ||
      uiStateRef.current === 'measuringEcg'
    ) {
      v8Log('auto:skip', uiStateRef.current);
      return;
    }
    try {
      const state = await manager.state();
      if (!State || state !== State.PoweredOn) {
        v8Log('auto:skip', `bt state=${state}`);
        return;
      }
    } catch (e) {
      v8Warn('auto:state', e?.message || String(e));
      return;
    }
    const ok = await requestBlePermissions();
    if (!ok) {
      v8Error('auto:permissions', 'negadas');
      setError('Permissão de Bluetooth/localização negada.');
      return;
    }
    // Android: auto-connect no GATT derruba o app (crash em connect:gatt).
    // Quem vinculou reconecta com o botão, depois de um scan.
    if (Platform.OS === 'android') {
      v8Log('auto:skip', 'android-manual');
      setStatusDetail('Toque em Reconectar para ligar a pulseira');
      return;
    }
    v8Log('auto:start', paired.name || paired.id);
    await connect(paired.id, paired.name, { persist: true });
  }, [connect]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [paired, crumb] = await Promise.all([
        loadPairedDevice(groupId, { currentUserId: ownerUserId }),
        loadConnectBreadcrumb(),
      ]);
      if (cancelled) return;
      pairedRef.current = paired;
      setPairedDevice(paired);
      if (paired?.model) applyBraceletModel(paired.model);
      if (crumb?.step && crumb.step !== 'connect:done') {
        setLastBreadcrumb(crumb);
        v8Log('breadcrumb:restored', crumb.step, crumb);
      }
      setPairReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [applyBraceletModel, groupId, ownerUserId]);

  useEffect(() => {
    let manager;
    let sub;
    try {
      v8Log('init', 'criando BleManager');
      manager = createBleManagerSafe();
      managerRef.current = manager;
      sub = manager.onStateChange((state) => {
        v8Log('bt:state', String(state));
        if (!State) return;
        if (state === State.PoweredOff) {
          updateUiState('poweredOff');
          setError('Bluetooth desligado. Ative o Bluetooth do celular.');
        } else if (state === State.PoweredOn) {
          setUiState((prev) => {
            const next = prev === 'poweredOff' ? 'idle' : prev;
            uiStateRef.current = next;
            return next;
          });
          setError((prev) =>
            prev === 'Bluetooth desligado. Ative o Bluetooth do celular.' ? null : prev,
          );
        }
      }, true);
      v8Log('init', 'BleManager ok');
    } catch (e) {
      v8Error('init', 'BleManager falhou', e);
      managerRef.current = null;
      updateUiState('unavailable');
      setError(e instanceof Error ? e.message : BLE_UNAVAILABLE_MSG);
    }
    return () => {
      v8Log('init', 'destroy BleManager');
      clearMeasureTimers();
      notifySubRef.current?.remove();
      disconnectSubRef.current?.remove();
      try {
        sub?.remove();
      } catch {
        // ignore
      }
      try {
        manager?.destroy();
      } catch {
        // ignore
      }
      managerRef.current = null;
    };
  }, [clearMeasureTimers, updateUiState]);

  useEffect(() => {
    if (Platform.OS === 'android') return;
    if (!pairReady || !pairedDevice) return;
    if (autoConnectAttemptedRef.current) return;
    if (uiStateRef.current === 'unavailable') return;
    let cancelled = false;
    (async () => {
      const manager = managerRef.current;
      if (!manager || !State) return;
      for (let i = 0; i < 20 && !cancelled; i++) {
        try {
          const state = await manager.state();
          if (state === State.PoweredOn) {
            autoConnectAttemptedRef.current = true;
            await tryAutoConnect();
            return;
          }
          if (state === State.PoweredOff) return;
        } catch {
          return;
        }
        await sleep(250);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pairReady, pairedDevice, tryAutoConnect]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (Platform.OS === 'android') return;
      if (next !== 'active' || !pairedRef.current) return;
      if (
        uiStateRef.current === 'connected' ||
        uiStateRef.current === 'connecting' ||
        uiStateRef.current === 'measuring' ||
        uiStateRef.current === 'measuringBP' ||
        uiStateRef.current === 'measuringSpo2' ||
        uiStateRef.current === 'measuringEcg' ||
        uiStateRef.current === 'scanning'
      ) {
        return;
      }
      void tryAutoConnect();
    });
    return () => sub.remove();
  }, [tryAutoConnect]);

  const disconnect = useCallback(async () => {
    stopScan();
    try {
      if (deviceRef.current) {
        try {
          await write(cmdStopSpo2());
          await write(cmdStopHeartRate());
          if (currentCaps().supportsManualHrv) {
            await write(cmdStopHrv());
          }
          if (currentCaps().supportsManualEcgPacket) {
            await write(cmdStopEcg());
            await write(cmdEcgStream(false));
          } else {
            await write(cmdPpgMode(3));
            await write(cmdPpgMode(5));
          }
          await write(cmdRealTimeStep(false));
        } catch {
          // ignore
        }
        await deviceRef.current.cancelConnection();
      }
    } catch {
      // ignore
    }
    cleanupConnection();
    updateUiState('idle');
  }, [cleanupConnection, stopScan, updateUiState, write]);

  const changeBracelet = useCallback(async () => {
    await disconnect();
    pairedRef.current = null;
    setPairedDevice(null);
    applyBraceletModel(null);
    await clearPairedDevice(groupId);
    autoConnectAttemptedRef.current = false;
    setDevices([]);
    setError(null);
    setStatusDetail(null);
    updateUiState('idle');
  }, [applyBraceletModel, disconnect, groupId, updateUiState]);

  const reconnectPaired = useCallback(async () => {
    autoConnectAttemptedRef.current = true;
    await tryAutoConnect();
  }, [tryAutoConnect]);

  const startScan = useCallback(async () => {
    const manager = managerRef.current;
    if (!manager || !State) {
      v8Error('scan', 'manager indisponível');
      setError(BLE_UNAVAILABLE_MSG);
      updateUiState('unavailable');
      return;
    }
    if (!normalizeBraceletModel(braceletModelRef.current)) {
      setError('Escolha o modelo da pulseira (V5 ou V8) antes de procurar.');
      updateUiState('idle');
      return;
    }
    setError(null);
    v8Log('scan:begin', 'permissoes');
    const ok = await requestBlePermissions();
    if (!ok) {
      v8Error('scan:permissions', 'negadas');
      setError('Permissão de Bluetooth/localização negada.');
      updateUiState('error');
      return;
    }
    const state = await manager.state();
    if (state !== State.PoweredOn) {
      v8Warn('scan', `bt state=${state}`);
      updateUiState('poweredOff');
      setError('Bluetooth desligado.');
      return;
    }
    setDevices([]);
    updateUiState('scanning');
    v8Log('scan:start', 'startDeviceScan');
    const seen = new Set();
    manager.startDeviceScan(null, { allowDuplicates: false }, (err, device) => {
      if (err) {
        v8Error('scan:err', err.message || String(err), err);
        setError(err.message);
        updateUiState('error');
        manager.stopDeviceScan();
        return;
      }
      if (!device) return;
      const modelTag = (braceletModelRef.current || 'v8').toUpperCase();
      const name =
        device.name ||
        device.localName ||
        (device.serviceUUIDs?.some((u) => u.toUpperCase().includes('FFF0'))
          ? `${modelTag} ${device.id.slice(-5)}`
          : null);
      if (!name) return;
      if (!seen.has(device.id)) {
        seen.add(device.id);
        v8Log('scan:found', name, { id: device.id.slice(-8), rssi: device.rssi });
      }
      setDevices((prev) => {
        if (prev.some((d) => d.id === device.id)) {
          return prev.map((d) =>
            d.id === device.id ? { ...d, name, rssi: device.rssi } : d,
          );
        }
        return [...prev, { id: device.id, name, rssi: device.rssi }].sort(
          (a, b) => (b.rssi ?? -999) - (a.rssi ?? -999),
        );
      });
    });
    setTimeout(() => {
      manager.stopDeviceScan();
      setUiState((prev) => {
        if (prev !== 'scanning') return prev;
        uiStateRef.current = 'idle';
        v8Log('scan:timeout', '15s');
        return 'idle';
      });
    }, 15000);
  }, [updateUiState]);

  const startMeasurement = useCallback(async () => {
    try {
      setError(null);
      clearMeasureTimers();
      setStatusDetail('Iniciando medição de batimentos…');
      updateUiState('measuring');

      await write(cmdStopSpo2());
      if (currentCaps().supportsManualHrv) {
        await write(cmdStopHrv());
      }
      await write(cmdRealTimeStep(true, true));
      await write(cmdStartHeartRate(60));
      setStatusDetail('Medindo batimentos — pulseira firme no pulso');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      updateUiState('connected');
    }
  }, [clearMeasureTimers, updateUiState, write]);

  const stopMeasurement = useCallback(async () => {
    try {
      clearMeasureTimers();
      await write(cmdStopHeartRate());
      await write(cmdRealTimeStep(true, true));
      updateUiState('connected');
      setStatusDetail(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [clearMeasureTimers, updateUiState, write]);

  const startSpo2Measurement = useCallback(async () => {
    try {
      setError(null);
      clearMeasureTimers();
      setSpo2(null);
      setStatusDetail('Iniciando oxigenação…');
      updateUiState('measuringSpo2');

      await write(cmdStopHeartRate());
      if (currentCaps().supportsManualHrv) {
        await write(cmdStopHrv());
      }
      await write(cmdRealTimeStep(true, true));
      await write(cmdStartSpo2(60));
      setStatusDetail('Medindo SpO₂ (~60s) — não mexa o braço');

      measureTimeoutRef.current = setTimeout(async () => {
        try {
          await write(cmdStopSpo2());
          await write(cmdGetSpo2History(0));
          await write(cmdRealTimeStep(true, true));
        } catch {
          // ignore
        } finally {
          if (uiStateRef.current === 'measuringSpo2') {
            updateUiState('connected');
            setStatusDetail((prev) =>
              prev?.startsWith('SpO₂')
                ? prev
                : 'SpO₂: sem valor. Confira se o sensor está na pele.',
            );
          }
          measureTimeoutRef.current = null;
        }
      }, 60_000);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      updateUiState('connected');
    }
  }, [clearMeasureTimers, updateUiState, write]);

  const stopSpo2Measurement = useCallback(async () => {
    try {
      clearMeasureTimers();
      await write(cmdStopSpo2());
      await write(cmdGetSpo2History(0));
      await write(cmdRealTimeStep(true, true));
      updateUiState('connected');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [clearMeasureTimers, updateUiState, write]);

  const startBpMeasurement = useCallback(async () => {
    try {
      setError(null);
      clearMeasureTimers();
      setStatusDetail('Iniciando medição de pressão…');
      updateUiState('measuringBP');

      await write(cmdStopSpo2());
      await write(cmdRealTimeStep(true, true));
      await write(cmdSetAutomatic(AUTO_TYPE.hrv, 5));
      await write(cmdStartHeartRate(60));
      if (currentCaps().supportsManualHrv) {
        await sleep(200);
        await write(cmdStartHrv(60));
      }
      await write(cmdGetHrvData(0));
      setStatusDetail('Medindo PA (~60s) — pulseira firme e parada');

      measureTimeoutRef.current = setTimeout(async () => {
        try {
          if (currentCaps().supportsManualHrv) {
            await write(cmdStopHrv());
          }
          await write(cmdStopHeartRate());
          await write(cmdGetHrvData(0));
          await write(cmdGetHrvData(2));
          await write(cmdRealTimeStep(true, true));
        } catch {
          // ignore
        } finally {
          if (uiStateRef.current === 'measuringBP') {
            updateUiState('connected');
            setStatusDetail((prev) =>
              prev?.startsWith('PA ')
                ? prev
                : 'PA indisponível neste modelo/firmware. Veja o status.',
            );
          }
          measureTimeoutRef.current = null;
        }
      }, 60_000);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      updateUiState('connected');
    }
  }, [clearMeasureTimers, updateUiState, write]);

  const stopBpMeasurement = useCallback(async () => {
    try {
      clearMeasureTimers();
      if (currentCaps().supportsManualHrv) {
        await write(cmdStopHrv());
      }
      await write(cmdStopHeartRate());
      await write(cmdGetHrvData(0));
      await write(cmdRealTimeStep(true, true));
      updateUiState('connected');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [clearMeasureTimers, updateUiState, write]);

  const refreshTemperature = useCallback(async () => {
    try {
      setError(null);
      setStatusDetail('Lendo temperatura…');
      await write(cmdRealtimeTemperature());
      await write(cmdGetTemperatureHistory(0));
      await write(cmdRealTimeStep(true, true));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [write]);

  const refreshSleep = useCallback(async () => {
    try {
      setError(null);
      setStatusDetail('Lendo dados de sono…');
      await write(cmdGetSleepData(0));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [write]);

  const startEcgMeasurement = useCallback(async () => {
    try {
      setError(null);
      clearMeasureTimers();
      ecgSamplesRef.current = [];
      setEcgSampleCount(0);
      setEcgResult(null);
      setStatusDetail('Iniciando ECG…');
      updateUiState('measuringEcg');

      await write(cmdStopHeartRate());
      await write(cmdStopSpo2());
      if (currentCaps().supportsManualHrv) {
        await write(cmdStopHrv());
      }
      if (currentCaps().supportsManualEcgPacket) {
        await write(cmdStartEcg(50_000));
        await write(cmdEcgStream(true));
      } else {
        await write(cmdPpgMode(1));
      }
      setStatusDetail('Medindo ECG (~50s) — mantenha o dedo/pulso firme');

      measureTimeoutRef.current = setTimeout(async () => {
        try {
          if (currentCaps().supportsManualEcgPacket) {
            await write(cmdStopEcg(50_000));
            await write(cmdEcgStream(false));
          } else {
            await write(cmdPpgMode(3));
            await write(cmdPpgMode(5));
          }
          await write(cmdRealTimeStep(true, true));
        } catch {
          // ignore
        } finally {
          if (uiStateRef.current === 'measuringEcg') {
            const samples = ecgSamplesRef.current.length;
            setEcgResult((prev) => ({
              heartRate: prev?.heartRate || null,
              hrv: prev?.hrv || null,
              stress: prev?.stress || null,
              systolicBP: prev?.systolicBP || null,
              diastolicBP: prev?.diastolicBP || null,
              samples,
              measuredAt: new Date().toISOString(),
            }));
            updateUiState('connected');
            setStatusDetail(
              samples > 0
                ? `ECG concluído — ${samples} amostras`
                : 'ECG: sem amostras. Confira contato na pele e tente de novo.',
            );
          }
          measureTimeoutRef.current = null;
        }
      }, 50_000);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      updateUiState('connected');
    }
  }, [clearMeasureTimers, updateUiState, write]);

  const stopEcgMeasurement = useCallback(async () => {
    try {
      clearMeasureTimers();
      if (currentCaps().supportsManualEcgPacket) {
        await write(cmdStopEcg(50_000));
        await write(cmdEcgStream(false));
      } else {
        await write(cmdPpgMode(3));
        await write(cmdPpgMode(5));
      }
      await write(cmdRealTimeStep(true, true));
      const samples = ecgSamplesRef.current.length;
      setEcgResult((prev) => ({
        heartRate: prev?.heartRate || null,
        hrv: prev?.hrv || null,
        stress: prev?.stress || null,
        systolicBP: prev?.systolicBP || null,
        diastolicBP: prev?.diastolicBP || null,
        samples,
        measuredAt: new Date().toISOString(),
      }));
      updateUiState('connected');
      setStatusDetail(samples > 0 ? `ECG parado — ${samples} amostras` : null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [clearMeasureTimers, updateUiState, write]);

  const clearLastBreadcrumb = useCallback(async () => {
    await clearConnectBreadcrumb();
    setLastBreadcrumb(null);
  }, []);

  return {
    uiState,
    error,
    statusDetail,
    lastRx,
    devices,
    pairedDevice,
    pairReady,
    connectedName,
    braceletModel,
    selectBraceletModel,
    lastBreadcrumb,
    clearLastBreadcrumb,
    heartRate,
    spo2,
    steps,
    battery,
    bloodPressure,
    temperatureC,
    sleepSession,
    ecgResult,
    ecgSampleCount,
    lastUpdate,
    startScan,
    stopScan,
    connect,
    disconnect,
    changeBracelet,
    reconnectPaired,
    startMeasurement,
    stopMeasurement,
    startSpo2Measurement,
    stopSpo2Measurement,
    startBpMeasurement,
    stopBpMeasurement,
    refreshTemperature,
    refreshSleep,
    startEcgMeasurement,
    stopEcgMeasurement,
  };
}

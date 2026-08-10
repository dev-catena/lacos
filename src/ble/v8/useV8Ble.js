import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, PermissionsAndroid, Platform } from 'react-native';
import { BleManager, State } from 'react-native-ble-plx';
import { clearPairedDevice, loadPairedDevice, savePairedDevice } from './pairedStorage';
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
  cmdSetAutomatic,
  cmdSetDeviceTime,
  cmdStartHeartRate,
  cmdStartHrv,
  cmdStartSpo2,
  cmdStopHeartRate,
  cmdStopHrv,
  cmdStopSpo2,
  isPlausibleBloodPressure,
  isPlausibleSpo2,
  isPlausibleTemperatureC,
  parseBattery,
  parseHrvHistory,
  parseMeasurement,
  parseRealtimeActivity,
  parseRealtimeTemperature,
  parseSleepData,
  parseSpo2History,
  parseTemperatureHistory,
  toHex,
} from './v8Protocol';

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

export function useV8Ble() {
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
  const [pairReady, setPairReady] = useState(false);
  const [connectedName, setConnectedName] = useState(null);
  const [heartRate, setHeartRate] = useState(null);
  const [spo2, setSpo2] = useState(null);
  const [steps, setSteps] = useState(null);
  const [battery, setBattery] = useState(null);
  const [bloodPressure, setBloodPressure] = useState(null);
  const [temperatureC, setTemperatureC] = useState(null);
  const [sleepSession, setSleepSession] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const updateUiState = useCallback((next) => {
    uiStateRef.current = next;
    setUiState(next);
  }, []);

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
      } catch {
        await device.writeCharacteristicWithResponseForService(
          V8_UUID.service,
          V8_UUID.write,
          payload,
        );
      }
      await sleep(120);
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

      const sleep = parseSleepData(bytes);
      if (sleep?.latest) {
        setSleepSession(sleep.latest);
        setLastUpdate(new Date());
        setStatusDetail(`Sono ${sleep.latest.totalHours} h`);
        return;
      }

      const measurement = parseMeasurement(bytes);
      if (measurement) {
        if (!measurement.isStopAck) {
          if (measurement.heartRate > 0) setHeartRate(measurement.heartRate);
          if (measurement.spo2 > 0) applySpo2(measurement.spo2);
          applyBloodPressure(measurement.systolicBP, measurement.diastolicBP);
          setLastUpdate(new Date());

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

  const connect = useCallback(
    async (deviceId, displayName, options) => {
      const manager = managerRef.current;
      if (!manager || connectingRef.current) return;

      const persist = options?.persist !== false;
      connectingRef.current = true;
      stopScan();
      setError(null);
      setStatusDetail(null);
      setLastRx(null);
      updateUiState('connecting');
      setHeartRate(null);
      setSpo2(null);
      setSteps(null);
      setBattery(null);
      setBloodPressure(null);
      setTemperatureC(null);
      setSleepSession(null);

      try {
        if (deviceRef.current) {
          try {
            await deviceRef.current.cancelConnection();
          } catch {
            // ignore
          }
          cleanupConnection();
        }

        const device = await manager.connectToDevice(deviceId, {
          autoConnect: false,
          timeout: 15000,
          requestMTU: 512,
        });
        await device.discoverAllServicesAndCharacteristics();
        try {
          await device.requestMTU(512);
        } catch {
          // iOS gerencia sozinho
        }

        deviceRef.current = device;
        setConnectedName(displayName);

        disconnectSubRef.current = device.onDisconnected(() => {
          cleanupConnection();
          updateUiState('idle');
          setError(
            pairedRef.current ? 'Pulseira desconectada. Toque em Reconectar.' : null,
          );
        });

        notifySubRef.current = device.monitorCharacteristicForService(
          V8_UUID.service,
          V8_UUID.notify,
          (err, characteristic) => {
            if (err) {
              if (!err.message?.includes('cancelled')) setError(err.message);
              return;
            }
            if (characteristic?.value) handleNotifyRef.current(characteristic.value);
          },
        );

        await sleep(300);
        await write(cmdSetDeviceTime());
        await write(cmdGetBattery());
        // Realtime com temperatura ligada (tempEnable=true)
        await write(cmdRealTimeStep(true, true));
        await write(cmdSetAutomatic(AUTO_TYPE.spo2, 5));
        await write(cmdSetAutomatic(AUTO_TYPE.hrv, 5));
        await write(cmdSetAutomatic(AUTO_TYPE.temp, 5));
        await write(cmdGetSpo2History(0));
        await write(cmdGetHrvData(0));
        await write(cmdRealtimeTemperature());
        await write(cmdGetTemperatureHistory(0));
        await write(cmdGetSleepData(0));

        if (persist) {
          const paired = { id: deviceId, name: displayName };
          pairedRef.current = paired;
          setPairedDevice(paired);
          await savePairedDevice(paired);
        }

        updateUiState('connected');
        setError(null);
        setStatusDetail('Conectada — use os botões de medição');
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        setError(
          pairedRef.current
            ? `Falha ao reconectar: ${message}`
            : `Falha ao conectar: ${message}`,
        );
        cleanupConnection();
        updateUiState(pairedRef.current ? 'idle' : 'error');
      } finally {
        connectingRef.current = false;
      }
    },
    [cleanupConnection, stopScan, updateUiState, write],
  );

  const tryAutoConnect = useCallback(async () => {
    const paired = pairedRef.current;
    const manager = managerRef.current;
    if (!paired || !manager || connectingRef.current) return;
    if (
      uiStateRef.current === 'connected' ||
      uiStateRef.current === 'connecting' ||
      uiStateRef.current === 'measuring' ||
      uiStateRef.current === 'measuringBP' ||
      uiStateRef.current === 'measuringSpo2'
    ) {
      return;
    }
    const state = await manager.state();
    if (state !== State.PoweredOn) return;
    const ok = await requestBlePermissions();
    if (!ok) {
      setError('Permissão de Bluetooth/localização negada.');
      return;
    }
    await connect(paired.id, paired.name, { persist: true });
  }, [connect]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const paired = await loadPairedDevice();
      if (cancelled) return;
      pairedRef.current = paired;
      setPairedDevice(paired);
      setPairReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const manager = new BleManager();
    managerRef.current = manager;
    const sub = manager.onStateChange((state) => {
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
    return () => {
      clearMeasureTimers();
      notifySubRef.current?.remove();
      disconnectSubRef.current?.remove();
      sub.remove();
      manager.destroy();
      managerRef.current = null;
    };
  }, [clearMeasureTimers, updateUiState]);

  useEffect(() => {
    if (!pairReady || !pairedDevice) return;
    if (autoConnectAttemptedRef.current) return;
    let cancelled = false;
    (async () => {
      const manager = managerRef.current;
      if (!manager) return;
      for (let i = 0; i < 20 && !cancelled; i++) {
        const state = await manager.state();
        if (state === State.PoweredOn) {
          autoConnectAttemptedRef.current = true;
          await tryAutoConnect();
          return;
        }
        if (state === State.PoweredOff) return;
        await sleep(250);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pairReady, pairedDevice, tryAutoConnect]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next !== 'active' || !pairedRef.current) return;
      if (
        uiStateRef.current === 'connected' ||
        uiStateRef.current === 'connecting' ||
        uiStateRef.current === 'measuring' ||
        uiStateRef.current === 'measuringBP' ||
        uiStateRef.current === 'measuringSpo2' ||
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
          await write(cmdStopHrv());
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
    await clearPairedDevice();
    autoConnectAttemptedRef.current = false;
    setDevices([]);
    setError(null);
    setStatusDetail(null);
    updateUiState('idle');
  }, [disconnect, updateUiState]);

  const reconnectPaired = useCallback(async () => {
    autoConnectAttemptedRef.current = true;
    await tryAutoConnect();
  }, [tryAutoConnect]);

  const startScan = useCallback(async () => {
    const manager = managerRef.current;
    if (!manager) return;
    setError(null);
    const ok = await requestBlePermissions();
    if (!ok) {
      setError('Permissão de Bluetooth/localização negada.');
      updateUiState('error');
      return;
    }
    const state = await manager.state();
    if (state !== State.PoweredOn) {
      updateUiState('poweredOff');
      setError('Bluetooth desligado.');
      return;
    }
    setDevices([]);
    updateUiState('scanning');
    manager.startDeviceScan(null, { allowDuplicates: false }, (err, device) => {
      if (err) {
        setError(err.message);
        updateUiState('error');
        manager.stopDeviceScan();
        return;
      }
      if (!device) return;
      const name =
        device.name ||
        device.localName ||
        (device.serviceUUIDs?.some((u) => u.toUpperCase().includes('FFF0'))
          ? `V8 ${device.id.slice(-5)}`
          : null);
      if (!name) return;
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
      await write(cmdStopHrv());
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
      await write(cmdStopHrv());
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
      await sleep(200);
      await write(cmdStartHrv(60));
      await write(cmdGetHrvData(0));
      setStatusDetail('Medindo PA (~60s) — pulseira firme e parada');

      measureTimeoutRef.current = setTimeout(async () => {
        try {
          await write(cmdStopHrv());
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
      await write(cmdStopHrv());
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

  return {
    uiState,
    error,
    statusDetail,
    lastRx,
    devices,
    pairedDevice,
    pairReady,
    connectedName,
    heartRate,
    spo2,
    steps,
    battery,
    bloodPressure,
    temperatureC,
    sleepSession,
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
  };
}

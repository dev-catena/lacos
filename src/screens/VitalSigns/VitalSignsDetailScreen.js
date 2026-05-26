import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  Alert,
  Pressable,
  RefreshControl,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import colors from '../../constants/colors';
import { ArrowBackIcon, AddIcon, PulseIcon } from '../../components/CustomIcons';
import SafeIcon from '../../components/SafeIcon';
import vitalSignService from '../../services/vitalSignService';
import deviceService from '../../services/deviceService';
import VitalSignsLineChart from '../../components/VitalSignsLineChart';
import moment from 'moment';
import AddVitalSignModal from './AddVitalSignModal';
import { buildWatchVitalData, getWatchVitalsLatestMs } from '../../utils/thalamusHealthAdapter';
import Toast from 'react-native-toast-message';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const WATCH_EXTRA_TEXT_KEYS = new Set([
  '__fall_alerts__',
  '__ecg__',
  '__sleep_sessions__',
  '__sleep_entries__',
]);

function watchHealthApiPath(imei, suffix) {
  const id = imei || '{imei}';
  return `/api/health/${id}${suffix}`;
}

function watchModalTitleForKey(key) {
  switch (key) {
    case '__fall_alerts__':
      return 'Queda';
    case '__ecg__':
      return 'ECG';
    case '__sleep_sessions__':
      return 'Sono — sessões';
    case '__sleep_entries__':
      return 'Sono — registros';
    default:
      return null;
  }
}

/** `last_battery_percentage` na resposta de smartwatch-health (Thalamus authorized-devices). */
function parseWatchBatteryFromSmartwatchPayload(data) {
  if (!data || typeof data !== 'object') return null;
  const pct = data.last_battery_percentage;
  if (pct == null || pct === '') return null;
  const n = Number(pct);
  if (Number.isNaN(n)) return null;
  return Math.min(100, Math.max(0, Math.round(n)));
}

function getLatestWatchRow(data) {
  if (!Array.isArray(data) || data.length === 0) return null;
  return [...data].sort(
    (a, b) => new Date(b.measured_at) - new Date(a.measured_at)
  )[0];
}

function formatWatchDisplayValue(rawValue) {
  let value = rawValue;
  if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
    try {
      value = JSON.parse(value);
    } catch {
      // mantém string
    }
  }
  if (Array.isArray(value) && value.length > 0) value = value[0];
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    if (value.systolic != null && value.diastolic != null) {
      return `${value.systolic}/${value.diastolic}`;
    }
  }
  const n = parseFloat(value);
  if (!Number.isNaN(n)) return n.toFixed(1);
  return String(value ?? '—');
}

const VitalSignsDetailScreen = ({ route, navigation }) => {
  const { groupId, groupName } = route.params || {};
  
  const [loading, setLoading] = useState(true);
  const [vitalSignsData, setVitalSignsData] = useState({});
  const [basalValues, setBasalValues] = useState({});
  const [selectedIndicator, setSelectedIndicator] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedIndicatorData, setSelectedIndicatorData] = useState([]);
  const [activeTab, setActiveTab] = useState('manual');
  const [hasSmartwatch, setHasSmartwatch] = useState(false);
  const [watchImei, setWatchImei] = useState(null);
  const [watchNickname, setWatchNickname] = useState(null);
  const [watchBatteryPercent, setWatchBatteryPercent] = useState(null);
  const [watchVitalData, setWatchVitalData] = useState(null);
  const [watchError, setWatchError] = useState(null);
  const [refreshingManual, setRefreshingManual] = useState(false);
  const [refreshingWatch, setRefreshingWatch] = useState(false);
  const [measuringNow, setMeasuringNow] = useState(false);
  const [measureStatus, setMeasureStatus] = useState('');
  const [watchDataUpdatedAt, setWatchDataUpdatedAt] = useState(null);
  const watchScrollRef = useRef(null);

  // Configuração dos indicadores
  const indicatorsConfig = [
    {
      key: 'blood_pressure',
      label: 'Pressão Arterial',
      icon: 'pulse',
      color: colors.error,
      unit: 'mmHg',
      enabledKey: 'monitor_blood_pressure',
    },
    {
      key: 'heart_rate',
      label: 'Frequência Cardíaca',
      icon: 'heart',
      color: colors.secondary,
      unit: 'bpm',
      enabledKey: 'monitor_heart_rate',
    },
    {
      key: 'oxygen_saturation',
      label: 'Saturação de Oxigênio',
      icon: 'water',
      color: colors.info,
      unit: '%',
      enabledKey: 'monitor_oxygen_saturation',
    },
    {
      key: 'blood_glucose',
      label: 'Glicemia',
      icon: 'fitness',
      color: colors.warning,
      unit: 'mg/dL',
      enabledKey: 'monitor_blood_glucose',
    },
    {
      key: 'temperature',
      label: 'Temperatura',
      icon: 'thermometer',
      color: colors.success,
      unit: '°C',
      enabledKey: 'monitor_temperature',
    },
    {
      key: 'respiratory_rate',
      label: 'Frequência Respiratória',
      icon: 'leaf',
      color: colors.primary,
      unit: 'ipm',
      enabledKey: 'monitor_respiratory_rate',
    },
  ];

  const latestWatchReadings = useMemo(() => {
    if (!watchVitalData) return [];
    return indicatorsConfig
      .map((indicator) => {
        const row = getLatestWatchRow(watchVitalData[indicator.key]);
        if (!row) return null;
        return {
          key: indicator.key,
          label: indicator.label,
          color: indicator.color,
          unit: indicator.unit,
          value: formatWatchDisplayValue(row.value),
          measured_at: row.measured_at,
        };
      })
      .filter(Boolean);
  }, [watchVitalData]);

  const applyVitalSignsResult = useCallback((result) => {
    if (!result?.success) {
      return;
    }

    const rows = Array.isArray(result.data) ? result.data : [];
    const organized = {};
    const basals = {};

    indicatorsConfig.forEach((indicator) => {
      const typeData = rows.filter((item) => item.type === indicator.key);

      const sortedData = [...typeData].sort(
        (a, b) => new Date(a.measured_at) - new Date(b.measured_at)
      );

      organized[indicator.key] = sortedData.slice(-20);

      if (typeData.length > 0) {
        if (indicator.key === 'blood_pressure') {
          const systolicValues = [];
          const diastolicValues = [];
          typeData.forEach((item) => {
            let value = item.value;
            if (Array.isArray(value) && value.length > 0) value = value[0];
            if (
              typeof value === 'object' &&
              value !== null &&
              value.systolic != null &&
              value.diastolic != null
            ) {
              systolicValues.push(parseFloat(value.systolic));
              diastolicValues.push(parseFloat(value.diastolic));
            }
          });
          if (systolicValues.length > 0 && diastolicValues.length > 0) {
            const avgSystolic = systolicValues.reduce((a, b) => a + b, 0) / systolicValues.length;
            const avgDiastolic = diastolicValues.reduce((a, b) => a + b, 0) / diastolicValues.length;
            basals[indicator.key] = {
              systolic: Math.round(avgSystolic),
              diastolic: Math.round(avgDiastolic),
            };
          }
        } else {
          const values = typeData.map((item) => {
            let value = item.value;
            if (Array.isArray(value) && value.length > 0) value = value[0];
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
              if (value.systolic && value.diastolic) return (value.systolic + value.diastolic) / 2;
              if (Array.isArray(value) && value.length > 0) return parseFloat(value[0]) || 0;
            }
            return parseFloat(value) || 0;
          });
          const sum = values.reduce((a, b) => a + b, 0);
          basals[indicator.key] = sum / values.length;
        }
      }
    });

    setVitalSignsData(organized);
    setBasalValues(basals);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadWatchData = async (watchRes) => {
      if (cancelled || !watchRes?.success || !watchRes.data) {
        if (!cancelled) {
          setHasSmartwatch(false);
          setWatchImei(null);
          setWatchNickname(null);
          setWatchBatteryPercent(null);
          setWatchVitalData(null);
          if (watchRes?.error) setWatchError(watchRes.error);
        }
        return false;
      }

      const d = watchRes.data;
      if (!d.has_smartwatch) {
        if (!cancelled) {
          setHasSmartwatch(false);
          setWatchImei(null);
          setWatchNickname(null);
          setWatchBatteryPercent(null);
          setWatchVitalData(null);
        }
        return false;
      }

      if (!cancelled) {
        setHasSmartwatch(true);
        setWatchImei(d.imei || null);
        setWatchNickname(d.device_nickname || null);
        setWatchBatteryPercent(parseWatchBatteryFromSmartwatchPayload(d));
        setWatchVitalData(buildWatchVitalData(d.health));
        setWatchDataUpdatedAt(new Date());
        setActiveTab('watch');
        setWatchError(null);
      }
      return true;
    };

    const bootstrap = async () => {
      try {
        setLoading(true);
        setWatchError(null);

        const [vitRes, watchRes] = await Promise.all([
          vitalSignService.getVitalSigns(groupId),
          deviceService.getGroupSmartwatchHealth(groupId),
        ]);

        if (cancelled) return;

        const hasWatch = await loadWatchData(watchRes);

        try {
          applyVitalSignsResult(vitRes);
        } catch (applyError) {
          console.error('❌ Erro ao processar sinais manuais:', applyError);
        }

        if (!hasWatch) {
          setActiveTab('manual');
        }

        if (!vitRes.success && !hasWatch) {
          Alert.alert(
            'Erro',
            vitRes.error || watchRes.error || 'Não foi possível carregar os sinais vitais'
          );
        } else if (!vitRes.success) {
          Toast.show({
            type: 'info',
            text1: 'Histórico manual indisponível',
            text2: vitRes.error || 'Os dados do relógio continuam disponíveis na aba Relógio.',
            visibilityTime: 5000,
          });
        }
      } catch (error) {
        console.error('❌ Erro ao carregar sinais vitais:', error);
        if (!cancelled) {
          Alert.alert('Erro', 'Não foi possível carregar os sinais vitais');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [groupId, applyVitalSignsResult]);

  const onRefreshManual = useCallback(async () => {
    setRefreshingManual(true);
    try {
      const result = await vitalSignService.getVitalSigns(groupId);
      applyVitalSignsResult(result);
    } finally {
      setRefreshingManual(false);
    }
  }, [groupId, applyVitalSignsResult]);

  const onRefreshWatch = useCallback(async () => {
    setRefreshingWatch(true);
    setWatchError(null);
    try {
      const watchRes = await deviceService.getGroupSmartwatchHealth(groupId);
      if (watchRes.success && watchRes.data?.has_smartwatch) {
        setWatchVitalData(buildWatchVitalData(watchRes.data.health));
        setWatchImei(watchRes.data.imei || null);
        setWatchNickname(watchRes.data.device_nickname || null);
        setWatchBatteryPercent(parseWatchBatteryFromSmartwatchPayload(watchRes.data));
        setHasSmartwatch(true);
        setWatchDataUpdatedAt(new Date());
        return buildWatchVitalData(watchRes.data.health);
      }
      if (watchRes.error) {
        setWatchError(watchRes.error);
      }
    } finally {
      setRefreshingWatch(false);
    }
    return null;
  }, [groupId]);

  const fetchWatchVitalData = useCallback(async () => {
    const watchRes = await deviceService.getGroupSmartwatchHealth(groupId);
    if (watchRes.success && watchRes.data?.has_smartwatch) {
      const vitalData = buildWatchVitalData(watchRes.data.health);
      setWatchVitalData(vitalData);
      setWatchImei(watchRes.data.imei || null);
      setWatchNickname(watchRes.data.device_nickname || null);
      setWatchBatteryPercent(parseWatchBatteryFromSmartwatchPayload(watchRes.data));
      setHasSmartwatch(true);
      setWatchDataUpdatedAt(new Date());
      return vitalData;
    }
    return null;
  }, [groupId]);

  const handleMeasureNow = useCallback(async () => {
    if (!hasSmartwatch || measuringNow) return;

    setMeasuringNow(true);
    setMeasureStatus('Enviando comando ao relógio...');

    try {
      const result = await deviceService.requestSmartwatchHealthReading(groupId);

      if (!result.success) {
        Alert.alert(
          'Não foi possível medir',
          result.error || result.data?.message || 'Tente novamente em instantes.'
        );
        return;
      }

      setMeasureStatus('Aguardando leitura do relógio...');
      const baselineMs = getWatchVitalsLatestMs(watchVitalData);

      Toast.show({
        type: 'info',
        text1: 'Leitura solicitada',
        text2: 'Aguarde no relógio — pode levar até 1 minuto para aparecer.',
        visibilityTime: 5000,
      });

      const pollIntervalsMs = [8000, 10000, 12000, 15000, 15000, 20000];
      let gotNewerReading = false;

      for (let i = 0; i < pollIntervalsMs.length; i += 1) {
        await sleep(pollIntervalsMs[i]);
        setMeasureStatus(`Buscando leitura no servidor (${i + 1}/${pollIntervalsMs.length})...`);
        const vitalData = await fetchWatchVitalData();
        if (vitalData && getWatchVitalsLatestMs(vitalData) > baselineMs) {
          gotNewerReading = true;
          break;
        }
      }

      if (gotNewerReading) {
        Toast.show({
          type: 'success',
          text1: 'Nova leitura recebida',
          text2: 'Confira o resumo "Últimas leituras" abaixo.',
          visibilityTime: 5000,
        });
      } else {
        Toast.show({
          type: 'info',
          text1: 'Ainda sem leitura nova',
          text2: 'O relógio pode demorar. Puxe a tela para atualizar em instantes.',
          visibilityTime: 6000,
        });
      }

      setTimeout(() => {
        watchScrollRef.current?.scrollTo({ y: 220, animated: true });
      }, 400);
    } catch (error) {
      console.error('Erro ao solicitar medição imediata:', error);
      Alert.alert('Erro', 'Não foi possível solicitar a leitura no relógio.');
    } finally {
      setMeasuringNow(false);
      setMeasureStatus('');
    }
  }, [groupId, hasSmartwatch, measuringNow, watchVitalData, fetchWatchVitalData]);

  const handleChartPress = async (indicatorKey) => {
    if (activeTab === 'watch' && watchVitalData) {
      const data = watchVitalData[indicatorKey] || [];
      const allData = [...data].sort(
        (a, b) => new Date(b.measured_at) - new Date(a.measured_at)
      );
      setSelectedIndicatorData(allData);
      setSelectedIndicator(indicatorKey);
      setShowDetailsModal(true);
      return;
    }

    try {
      const result = await vitalSignService.getVitalSigns(groupId, indicatorKey);
      if (result.success && result.data) {
        const allData = [...result.data].sort((a, b) =>
          new Date(b.measured_at) - new Date(a.measured_at)
        );
        setSelectedIndicatorData(allData);
        setSelectedIndicator(indicatorKey);
        setShowDetailsModal(true);
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
      const result = vitalSignsData[indicatorKey] || [];
      const allData = [...result].sort((a, b) =>
        new Date(b.measured_at) - new Date(a.measured_at)
      );
      setSelectedIndicatorData(allData);
      setSelectedIndicator(indicatorKey);
      setShowDetailsModal(true);
    }
  };

  const openWatchTextListModal = (modalKey, list) => {
    if (!list?.length) return;
    setSelectedIndicatorData(list);
    setSelectedIndicator(modalKey);
    setShowDetailsModal(true);
  };

  const watchEndpointFailed = (endpointKey) =>
    watchVitalData?.endpointErrors?.find((e) => e.key === endpointKey);

  const handleFallAlertsPress = () => {
    if (!watchVitalData?.fallAlerts?.length) return;
    const items = watchVitalData.fallAlerts.map((row) => ({
      measured_at: row.measured_at,
      value: row.value,
      measured_by_name: row.measured_by_name || 'Relógio',
      wearable_name: row.wearable_name || 'Thalamus',
    }));
    openWatchTextListModal('__fall_alerts__', items);
  };

  const handleAddMeasure = () => {
    setShowAddModal(true);
  };

  const handleAddSuccess = () => {
    setShowAddModal(false);
    vitalSignService.getVitalSigns(groupId).then(applyVitalSignsResult);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const enabledIndicators = indicatorsConfig.filter(indicator => {
    // Por enquanto, mostrar todos. Depois pode filtrar por configuração do grupo
    return true;
  });

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowBackIcon size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.title}>Sinais Vitais</Text>
          <Text style={styles.subtitle}>{groupName}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {hasSmartwatch && watchImei ? (
        <View style={styles.imeiBanner}>
          <View style={styles.watchBatteryRow}>
            <SafeIcon name="battery-half-outline" size={22} color={colors.primary} />
            <Text style={styles.watchBatteryLabel}>Carga da bateria</Text>
            <Text style={styles.watchBatteryValue}>
              {watchBatteryPercent != null ? `${watchBatteryPercent}%` : '—'}
            </Text>
          </View>
          <Text style={[styles.imeiBannerLabel, styles.imeiBannerLabelAfterBattery]}>Dispositivo</Text>
          <Text style={styles.imeiBannerValue} numberOfLines={1}>
            {watchNickname ? `${watchNickname} · ` : ''}IMEI {watchImei}
          </Text>
        </View>
      ) : null}

      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'watch' && styles.tabActive]}
          onPress={() => setActiveTab('watch')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'watch' && styles.tabTextActive]}>Relógio</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'manual' && styles.tabActive]}
          onPress={() => setActiveTab('manual')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'manual' && styles.tabTextActive]}>Manual</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'watch' ? (
        <ScrollView
          ref={watchScrollRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshingWatch} onRefresh={onRefreshWatch} colors={[colors.primary]} />
          }
        >
          {!hasSmartwatch ? (
            <View style={styles.emptyState}>
              <PulseIcon size={64} color={colors.gray300} />
              <Text style={styles.emptyTitle}>Nenhum relógio associado</Text>
              <Text style={styles.emptyText}>
                Cadastre um smartwatch neste grupo para ver os dados da API Thalamus na aba Relógio.
              </Text>
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.measureNowButton, measuringNow && styles.measureNowButtonDisabled]}
                onPress={handleMeasureNow}
                disabled={measuringNow}
                activeOpacity={0.85}
              >
                {measuringNow ? (
                  <ActivityIndicator color={colors.textWhite} />
                ) : (
                  <SafeIcon name="pulse" size={22} color={colors.textWhite} />
                )}
                <View style={styles.measureNowTextWrap}>
                  <Text style={styles.measureNowTitle}>
                    {measuringNow ? 'Medindo no relógio...' : 'Medir todos os sinais agora'}
                  </Text>
                  <Text style={styles.measureNowSubtitle}>
                    {measureStatus || 'Os resultados aparecem no resumo e nos cards abaixo'}
                  </Text>
                </View>
              </TouchableOpacity>

              {latestWatchReadings.length > 0 ? (
                <View style={styles.latestReadingsCard}>
                  <View style={styles.latestReadingsHeader}>
                    <Text style={styles.latestReadingsTitle}>Últimas leituras do relógio</Text>
                    {watchDataUpdatedAt ? (
                      <Text style={styles.latestReadingsUpdated}>
                        Atualizado {moment(watchDataUpdatedAt).format('DD/MM HH:mm')}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={styles.latestReadingsHint}>
                    Toque em um item para ver o histórico completo com data e hora.
                  </Text>
                  {latestWatchReadings.map((item) => (
                    <TouchableOpacity
                      key={item.key}
                      style={styles.latestReadingRow}
                      onPress={() => handleChartPress(item.key)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.latestReadingLabel}>{item.label}</Text>
                      <View style={styles.latestReadingValueWrap}>
                        <Text style={[styles.latestReadingValue, { color: item.color }]}>
                          {item.value} {item.unit}
                        </Text>
                        <Text style={styles.latestReadingTime}>
                          {moment(item.measured_at).format('DD/MM HH:mm')}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.latestReadingsEmpty}>
                  <Text style={styles.latestReadingsEmptyText}>
                    Após medir, os valores aparecerão aqui e nos gráficos de cada sinal abaixo.
                  </Text>
                </View>
              )}

              {watchError ? (
                <View style={styles.watchErrorBanner}>
                  <Text style={styles.watchErrorText}>{watchError}</Text>
                </View>
              ) : null}
              {watchVitalData?.endpointErrors?.length ? (
                <Text style={styles.watchPartialHint}>
                  Alguns dados do relógio não puderam ser carregados ({watchVitalData.endpointErrors.length}{' '}
                  endpoint(s)).
                </Text>
              ) : null}

              {watchVitalData?.comprehensiveText ? (
                <View style={styles.comprehensiveCard}>
                  <Text style={styles.comprehensiveTitle}>Visão geral (relógio)</Text>
                  <Text style={styles.comprehensiveBody}>{watchVitalData.comprehensiveText}</Text>
                </View>
              ) : null}

              {enabledIndicators.length === 0 ? (
                <View style={styles.emptyState}>
                  <PulseIcon size={64} color={colors.gray300} />
                  <Text style={styles.emptyTitle}>Nenhum indicador habilitado</Text>
                </View>
              ) : (
                enabledIndicators.map((indicator) => {
                  const data = watchVitalData ? watchVitalData[indicator.key] || [] : [];
                  const basal = watchVitalData?.basalValues?.[indicator.key];

                  return (
                    <TouchableOpacity
                      key={indicator.key}
                      style={styles.indicatorCard}
                      onPress={() => handleChartPress(indicator.key)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.indicatorHeader}>
                        <View style={[styles.indicatorIcon, { backgroundColor: indicator.color + '20' }]}>
                          <SafeIcon name={indicator.icon} size={24} color={indicator.color} />
                        </View>
                        <Text style={styles.indicatorLabel}>{indicator.label}</Text>
                      </View>

                      {data.length > 0 ? (
                        <VitalSignsLineChart
                          data={data}
                          basalValue={basal}
                          unit={indicator.unit}
                          color={indicator.color}
                          label={indicator.label}
                        />
                      ) : (
                        <View style={styles.noDataContainer}>
                          <Text style={styles.noDataText}>Nenhum dado do relógio para este indicador</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })
              )}

              <View style={styles.watchExtraSection}>
                <Text style={styles.watchExtraTitle}>Queda</Text>
                <Text style={styles.watchExtraEndpoint}>{watchHealthApiPath(watchImei, '/fall-down-alerts')}</Text>
                {watchEndpointFailed('fall_down_alerts') ? (
                  <Text style={styles.watchExtraEndpointError}>
                    Falha ao carregar (HTTP {watchEndpointFailed('fall_down_alerts').status || '—'}).
                  </Text>
                ) : null}
                {watchVitalData?.fallAlerts?.length > 0 ? (
                  <TouchableOpacity onPress={handleFallAlertsPress} activeOpacity={0.7}>
                    <View style={styles.indicatorHeader}>
                      <View style={[styles.indicatorIcon, { backgroundColor: colors.warning + '20' }]}>
                        <SafeIcon name="warning" size={24} color={colors.warning} />
                      </View>
                      <Text style={styles.indicatorLabel}>Alertas de queda</Text>
                    </View>
                    <Text style={styles.watchExtraHint}>
                      {watchVitalData.fallAlerts.length} registro(s) — toque para ver a lista
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.watchExtraHint}>Nenhum alerta ou lista vazia.</Text>
                )}
              </View>

              <View style={styles.watchExtraSection}>
                <Text style={styles.watchExtraTitle}>ECG</Text>
                <Text style={styles.watchExtraEndpoint}>{watchHealthApiPath(watchImei, '/ecg-data')}</Text>
                {watchEndpointFailed('ecg_data') ? (
                  <Text style={styles.watchExtraEndpointError}>
                    Falha ao carregar (HTTP {watchEndpointFailed('ecg_data').status || '—'}).
                  </Text>
                ) : null}
                {watchVitalData?.ecgList?.length > 0 ? (
                  <TouchableOpacity
                    onPress={() => openWatchTextListModal('__ecg__', watchVitalData.ecgList)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.watchExtraHint}>
                      {watchVitalData.ecgList.length} registro(s) — toque para ver a lista
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.watchExtraHint}>Sem dados ECG ou lista vazia.</Text>
                )}
              </View>

              <View style={styles.watchExtraSection}>
                <Text style={styles.watchExtraTitle}>Sono — sessões</Text>
                <Text style={styles.watchExtraEndpoint}>{watchHealthApiPath(watchImei, '/sleep-sessions')}</Text>
                {watchEndpointFailed('sleep_sessions') ? (
                  <Text style={styles.watchExtraEndpointError}>
                    Falha ao carregar (HTTP {watchEndpointFailed('sleep_sessions').status || '—'}).
                  </Text>
                ) : null}
                {watchVitalData?.sleepSessionsList?.length > 0 ? (
                  <TouchableOpacity
                    onPress={() =>
                      openWatchTextListModal('__sleep_sessions__', watchVitalData.sleepSessionsList)
                    }
                    activeOpacity={0.7}
                  >
                    <Text style={styles.watchExtraHint}>
                      {watchVitalData.sleepSessionsList.length} sessão(ões) — toque para ver a lista
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.watchExtraHint}>Sem sessões de sono ou lista vazia.</Text>
                )}
              </View>

              <View style={styles.watchExtraSection}>
                <Text style={styles.watchExtraTitle}>Sono — registros</Text>
                <Text style={styles.watchExtraEndpoint}>{watchHealthApiPath(watchImei, '/sleep-entries')}</Text>
                {watchEndpointFailed('sleep_entries') ? (
                  <Text style={styles.watchExtraEndpointError}>
                    Falha ao carregar (HTTP {watchEndpointFailed('sleep_entries').status || '—'}).
                  </Text>
                ) : null}
                {watchVitalData?.sleepEntriesList?.length > 0 ? (
                  <TouchableOpacity
                    onPress={() =>
                      openWatchTextListModal('__sleep_entries__', watchVitalData.sleepEntriesList)
                    }
                    activeOpacity={0.7}
                  >
                    <Text style={styles.watchExtraHint}>
                      {watchVitalData.sleepEntriesList.length} registro(s) — toque para ver a lista
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.watchExtraHint}>Sem registros de sono ou lista vazia.</Text>
                )}
              </View>
            </>
          )}
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshingManual}
              onRefresh={onRefreshManual}
              colors={[colors.primary]}
            />
          }
        >
          {enabledIndicators.length === 0 ? (
            <View style={styles.emptyState}>
              <PulseIcon size={64} color={colors.gray300} />
              <Text style={styles.emptyTitle}>Nenhum indicador habilitado</Text>
              <Text style={styles.emptyText}>Configure os indicadores nas configurações do grupo</Text>
            </View>
          ) : (
            enabledIndicators.map((indicator) => {
              const data = vitalSignsData[indicator.key] || [];
              const basal = basalValues[indicator.key];

              return (
                <TouchableOpacity
                  key={indicator.key}
                  style={styles.indicatorCard}
                  onPress={() => handleChartPress(indicator.key)}
                  activeOpacity={0.7}
                >
                  <View style={styles.indicatorHeader}>
                    <View style={[styles.indicatorIcon, { backgroundColor: indicator.color + '20' }]}>
                      <SafeIcon name={indicator.icon} size={24} color={indicator.color} />
                    </View>
                    <Text style={styles.indicatorLabel}>{indicator.label}</Text>
                  </View>

                  {data.length > 0 ? (
                    <VitalSignsLineChart
                      data={data}
                      basalValue={basal}
                      unit={indicator.unit}
                      color={indicator.color}
                      label={indicator.label}
                    />
                  ) : (
                    <View style={styles.noDataContainer}>
                      <Text style={styles.noDataText}>Nenhuma medida registrada</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Modal de Detalhes */}
      <Modal
        visible={showDetailsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDetailsModal(false)}
        statusBarTranslucent={false}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowDetailsModal(false)}
        >
          <Pressable 
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {watchModalTitleForKey(selectedIndicator) ||
                  indicatorsConfig.find((i) => i.key === selectedIndicator)?.label ||
                  'Detalhes'}
              </Text>
              <TouchableOpacity
                onPress={() => setShowDetailsModal(false)}
                style={styles.modalCloseButton}
              >
                <SafeIcon name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              {selectedIndicatorData.map((item, index) => {
                // Formatar o valor corretamente
                let displayValue = '';
                let value = item.value;
                
                // Se value é string JSON, tentar parsear
                if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
                  try {
                    value = JSON.parse(value);
                  } catch (e) {
                    // Se falhar, manter como string
                  }
                }
                
                // Se value é array, pegar primeiro elemento
                if (Array.isArray(value) && value.length > 0) {
                  value = value[0];
                }
                
                // Se value ainda é array dentro de array, pegar primeiro
                if (Array.isArray(value) && value.length > 0) {
                  value = value[0];
                }
                
                const isWatchTextModal = WATCH_EXTRA_TEXT_KEYS.has(selectedIndicator);

                // Formatar baseado no tipo
                if (isWatchTextModal) {
                  displayValue = typeof value === 'string' ? value : JSON.stringify(value || '');
                } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                  // Objeto com systolic/diastolic (pressão arterial)
                  if (value.systolic !== undefined && value.diastolic !== undefined) {
                    displayValue = `${value.systolic}/${value.diastolic}`;
                  } else {
                    // Outro objeto, tentar pegar primeiro valor
                    const keys = Object.keys(value);
                    if (keys.length > 0) {
                      displayValue = String(value[keys[0]]);
                    } else {
                      displayValue = 'N/A';
                    }
                  }
                } else {
                  // Valor numérico ou string
                  const numValue = parseFloat(value);
                  if (!isNaN(numValue)) {
                    displayValue = numValue.toFixed(1);
                  } else {
                    displayValue = String(value || 'N/A');
                  }
                }
                
                const unit = isWatchTextModal
                  ? ''
                  : indicatorsConfig.find((i) => i.key === selectedIndicator)?.unit || '';
                
                return (
                  <View key={index} style={styles.detailItem}>
                    <View style={styles.detailItemLeft}>
                      <Text style={styles.detailDate}>
                        {moment(item.measured_at).format('DD/MM/YYYY')}
                      </Text>
                      <Text style={styles.detailTime}>
                        {moment(item.measured_at).format('HH:mm')}
                      </Text>
                    </View>
                    <View style={styles.detailItemCenter}>
                      <Text
                        style={isWatchTextModal ? styles.detailValueWatchExtra : styles.detailValue}
                      >
                        {displayValue} {unit}
                      </Text>
                      <Text style={styles.detailSource}>
                        {item.measured_by_name || item.wearable_name || 'Manual'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal de Adicionar Medida */}
      <AddVitalSignModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddSuccess}
        groupId={groupId}
        groupName={groupName}
      />

      {/* Botão Flutuante — apenas medições manuais */}
      {activeTab === 'manual' ? (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleAddMeasure}
          activeOpacity={0.8}
        >
          <AddIcon size={28} color={colors.white} />
        </TouchableOpacity>
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 2,
  },
  headerSpacer: {
    width: 40,
  },
  imeiBanner: {
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  watchBatteryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  watchBatteryLabel: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  watchBatteryValue: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primary,
  },
  imeiBannerLabelAfterBattery: {
    marginTop: 10,
  },
  imeiBannerLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  imeiBannerValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.backgroundLight,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textLight,
  },
  tabTextActive: {
    color: colors.textWhite,
  },
  watchErrorBanner: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  watchErrorText: {
    color: '#991b1b',
    fontSize: 14,
  },
  watchPartialHint: {
    fontSize: 13,
    color: colors.warning,
    marginBottom: 12,
  },
  measureNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  measureNowButtonDisabled: {
    opacity: 0.85,
  },
  measureNowTextWrap: {
    flex: 1,
  },
  measureNowTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textWhite,
  },
  measureNowSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  latestReadingsCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  latestReadingsHeader: {
    marginBottom: 6,
  },
  latestReadingsTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  latestReadingsUpdated: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
  },
  latestReadingsHint: {
    fontSize: 13,
    color: colors.textLight,
    marginBottom: 12,
    lineHeight: 18,
  },
  latestReadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  latestReadingLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    paddingRight: 8,
  },
  latestReadingValueWrap: {
    alignItems: 'flex-end',
  },
  latestReadingValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  latestReadingTime: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2,
  },
  latestReadingsEmpty: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  latestReadingsEmptyText: {
    fontSize: 13,
    color: colors.textLight,
    lineHeight: 18,
    textAlign: 'center',
  },
  comprehensiveCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  comprehensiveTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  comprehensiveBody: {
    fontSize: 13,
    color: colors.textLight,
    lineHeight: 20,
    fontFamily: 'System',
  },
  watchExtraSection: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  watchExtraTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  watchExtraEndpoint: {
    fontSize: 11,
    color: colors.textLight,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 10,
  },
  watchExtraHint: {
    fontSize: 14,
    color: colors.textLight,
  },
  watchExtraEndpointError: {
    fontSize: 13,
    color: colors.error,
    marginBottom: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  indicatorCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  indicatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  indicatorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  indicatorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  noDataContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 14,
    color: colors.textLight,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Branco puro e opaco
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#FFFFFF', // Branco puro e opaco
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 1001,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: '#FFFFFF', // Branco puro e opaco
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalScrollView: {
    maxHeight: 400,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF', // Branco puro e opaco
  },
  detailItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: '#FFFFFF', // Branco puro e opaco
  },
  detailItemLeft: {
    width: 100,
    marginRight: 16,
  },
  detailDate: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  detailTime: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
  },
  detailItemCenter: {
    flex: 1,
  },
  detailValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  detailValueWatchExtra: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  detailSource: {
    fontSize: 13,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  emptyModalState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyModalText: {
    fontSize: 14,
    color: colors.textLight,
  },
});

export default VitalSignsDetailScreen;


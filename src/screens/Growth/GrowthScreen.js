import React, { useState, useCallback } from 'react';
import KidsBackground from '../../components/KidsBackground';
import { isKidsGroup } from '../../stores/currentGroupStore';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Line, Polyline, Circle, Text as SvgText, Defs, LinearGradient, Stop, Path } from 'react-native-svg';
import Toast from 'react-native-toast-message';
import colors from '../../constants/colors';
import growthService from '../../services/growthService';

const KIDS_GREEN = '#16a34a';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Curvas de referência OMS ────────────────────────────────────────────────
// Fonte: WHO Child Growth Standards (valores aproximados, meninos)
// Índices de idade em meses: 0,1,2,3,4,5,6,7,8,9,10,11,12,15,18,21,24
const WHO_AGES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 18, 21, 24];

const WHO_DATA = {
  weight: {
    label: 'Peso',
    unit: 'kg',
    color: colors.primary,
    p3:  [2.5, 3.4, 4.3, 5.0, 5.6, 6.1, 6.4, 6.7, 7.0, 7.2, 7.5, 7.7, 7.8, 8.4, 8.9, 9.2, 9.7],
    p50: [3.3, 4.5, 5.6, 6.4, 7.0, 7.5, 7.9, 8.3, 8.6, 8.9, 9.2, 9.4, 9.6, 10.3, 10.9, 11.5, 12.2],
    p97: [4.4, 5.8, 7.1, 8.0, 8.7, 9.3, 9.8, 10.3, 10.7, 11.0, 11.4, 11.7, 12.0, 12.8, 13.7, 14.5, 15.3],
  },
  height: {
    label: 'Comprimento/Altura',
    unit: 'cm',
    color: '#7c3aed',
    p3:  [46.1, 50.8, 54.4, 57.3, 59.7, 61.7, 63.3, 64.8, 66.2, 67.5, 68.7, 69.9, 71.0, 74.0, 76.9, 79.7, 81.7],
    p50: [49.9, 54.7, 58.4, 61.4, 63.9, 65.9, 67.6, 69.2, 70.6, 72.0, 73.3, 74.5, 75.7, 79.1, 82.3, 85.1, 87.8],
    p97: [53.7, 58.6, 62.4, 65.5, 68.0, 70.1, 71.9, 73.5, 75.0, 76.5, 77.9, 79.2, 80.5, 84.2, 87.7, 90.6, 93.9],
  },
  head: {
    label: 'Perímetro Cefálico',
    unit: 'cm',
    color: '#0891b2',
    p3:  [32.1, 34.9, 36.4, 37.5, 38.4, 39.2, 39.9, 40.5, 41.0, 41.5, 41.9, 42.3, 42.6, 43.4, 44.1, 44.7, 45.2],
    p50: [34.5, 37.3, 38.9, 40.0, 41.0, 41.8, 42.6, 43.2, 43.8, 44.3, 44.7, 45.1, 45.4, 46.3, 47.0, 47.5, 48.0],
    p97: [37.0, 39.7, 41.3, 42.5, 43.6, 44.5, 45.2, 45.9, 46.5, 47.0, 47.5, 47.9, 48.2, 49.2, 49.9, 50.4, 50.8],
  },
};

// ─── Cronograma SBP ──────────────────────────────────────────────────────────
function generateSBPSchedule(birthDate) {
  if (!birthDate) return [];
  const birth = new Date(birthDate + 'T12:00:00');
  const schedule = [];

  const addMonths = (date, months) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
  };

  const ageLabel = (months) => {
    if (months < 12) return `${months}º mês`;
    const years = Math.floor(months / 12);
    const rem = months % 12;
    return rem === 0 ? `${years} ano${years > 1 ? 's' : ''}` : `${years}a ${rem}m`;
  };

  // Mensalmente: 1-12 meses
  for (let m = 1; m <= 12; m++) {
    schedule.push({ months: m, date: addMonths(birth, m), label: ageLabel(m), period: 'Mensal' });
  }
  // Trimestralmente: 15, 18, 21, 24 meses
  for (let m = 15; m <= 24; m += 3) {
    schedule.push({ months: m, date: addMonths(birth, m), label: ageLabel(m), period: 'Trimestral' });
  }
  // Semestralmente: 30, 36, 42, 48, 54, 60 meses
  for (let m = 30; m <= 60; m += 6) {
    schedule.push({ months: m, date: addMonths(birth, m), label: ageLabel(m), period: 'Semestral' });
  }

  return schedule;
}

// ─── Componente: Gráfico de Crescimento OMS ──────────────────────────────────
const CHART_PADDING = { top: 20, right: 16, bottom: 32, left: 36 };
const CHART_H = 200;
const CHART_W = SCREEN_WIDTH - 32;
const INNER_W = CHART_W - CHART_PADDING.left - CHART_PADDING.right;
const INNER_H = CHART_H - CHART_PADDING.top - CHART_PADDING.bottom;

function toXY(ageMonths, value, minAge, maxAge, minVal, maxVal) {
  const x = CHART_PADDING.left + ((ageMonths - minAge) / (maxAge - minAge || 1)) * INNER_W;
  const y = CHART_PADDING.top + INNER_H - ((value - minVal) / (maxVal - minVal || 1)) * INNER_H;
  return { x, y };
}

function whoPoints(ages, values, minAge, maxAge, minVal, maxVal) {
  return ages
    .filter((a) => a >= minAge && a <= maxAge)
    .map((a, i) => {
      const idx = WHO_AGES.indexOf(a);
      if (idx === -1) return null;
      const { x, y } = toXY(a, values[idx], minAge, maxAge, minVal, maxVal);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .filter(Boolean)
    .join(' ');
}

const GrowthChart = ({ records, metric }) => {
  const ref = WHO_DATA[metric];

  if (!records || records.length === 0) {
    const maxAge = 24;
    const minVal = ref.p3[0] * 0.9;
    const maxVal = ref.p97[ref.p97.length - 1] * 1.05;

    return (
      <View style={styles.chartWrap}>
        <Svg width={CHART_W} height={CHART_H}>
          {renderGrid(0, maxAge, minVal, maxVal, ref)}
          {renderWHO(0, maxAge, minVal, maxVal, ref)}
          {renderAxes(0, maxAge, minVal, maxVal, ref)}
        </Svg>
        <View style={styles.chartEmpty}>
          <Text style={styles.chartEmptyText}>Adicione medições para ver seus dados no gráfico</Text>
        </View>
      </View>
    );
  }

  const field = metric === 'weight' ? 'weight' : metric === 'height' ? 'height' : 'head_circumference';
  const validRecords = records.filter((r) => r[field] != null && r.age_months != null);

  if (validRecords.length === 0) {
    return (
      <View style={styles.chartWrap}>
        <Text style={styles.chartEmptyText}>Sem dados de {ref.label.toLowerCase()} para exibir.</Text>
      </View>
    );
  }

  const ages = validRecords.map((r) => r.age_months);
  const vals = validRecords.map((r) => parseFloat(r[field]));

  const minAge = 0;
  const maxAge = Math.max(24, ...ages);
  const whoAgesFiltered = WHO_AGES.filter((a) => a <= maxAge);
  const allVals = [
    ...vals,
    ...whoAgesFiltered.map((a) => { const i = WHO_AGES.indexOf(a); return [ref.p3[i], ref.p97[i]]; }).flat(),
  ];
  const minVal = Math.min(...allVals) * 0.97;
  const maxVal = Math.max(...allVals) * 1.03;

  const userPoints = validRecords.map((r) => {
    const { x, y } = toXY(r.age_months, parseFloat(r[field]), minAge, maxAge, minVal, maxVal);
    return { x, y, r };
  });

  return (
    <View style={styles.chartWrap}>
      <Svg width={CHART_W} height={CHART_H}>
        {renderGrid(minAge, maxAge, minVal, maxVal, ref)}
        {renderWHO(minAge, maxAge, minVal, maxVal, ref)}
        {/* Linha do usuário */}
        {userPoints.length > 1 && (
          <Polyline
            points={userPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
            fill="none"
            stroke={ref.color}
            strokeWidth={2.5}
          />
        )}
        {/* Pontos do usuário */}
        {userPoints.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={5} fill={ref.color} stroke="#fff" strokeWidth={2} />
        ))}
        {renderAxes(minAge, maxAge, minVal, maxVal, ref)}
      </Svg>

      {/* Legenda */}
      <View style={styles.legend}>
        <LegendItem color="#aaa" dash label="P3 / P97 OMS" />
        <LegendItem color="#999" dash label="P50 OMS" />
        <LegendItem color={ref.color} label={`Medições (${ref.unit})`} />
      </View>
    </View>
  );
};

function renderGrid(minAge, maxAge, minVal, maxVal, ref) {
  const lines = [];
  // 4 linhas horizontais de grade
  for (let i = 0; i <= 4; i++) {
    const val = minVal + (i / 4) * (maxVal - minVal);
    const { y } = toXY(minAge, val, minAge, maxAge, minVal, maxVal);
    lines.push(
      <Line key={`hg${i}`} x1={CHART_PADDING.left} y1={y} x2={CHART_W - CHART_PADDING.right} y2={y}
        stroke={colors.border} strokeWidth={0.7} />,
      <SvgText key={`hgt${i}`} x={CHART_PADDING.left - 4} y={y + 4} fontSize="9" fill={colors.textLight}
        textAnchor="end">{val.toFixed(val >= 10 ? 0 : 1)}</SvgText>
    );
  }
  return lines;
}

function renderWHO(minAge, maxAge, minVal, maxVal, ref) {
  const filtered = WHO_AGES.filter((a) => a >= minAge && a <= maxAge);
  const p3pts  = whoPoints(filtered, ref.p3,  minAge, maxAge, minVal, maxVal);
  const p50pts = whoPoints(filtered, ref.p50, minAge, maxAge, minVal, maxVal);
  const p97pts = whoPoints(filtered, ref.p97, minAge, maxAge, minVal, maxVal);

  return (
    <>
      <Polyline points={p3pts}  fill="none" stroke="#bbb" strokeWidth={1} strokeDasharray="4,3" />
      <Polyline points={p97pts} fill="none" stroke="#bbb" strokeWidth={1} strokeDasharray="4,3" />
      <Polyline points={p50pts} fill="none" stroke="#ccc" strokeWidth={1.5} strokeDasharray="6,3" />
    </>
  );
}

function renderAxes(minAge, maxAge, minVal, maxVal, ref) {
  // Marcadores no eixo X (meses)
  const xTicks = [0, 3, 6, 9, 12, 18, 24].filter((a) => a <= maxAge);
  return (
    <>
      <Line x1={CHART_PADDING.left} y1={CHART_PADDING.top} x2={CHART_PADDING.left}
        y2={CHART_H - CHART_PADDING.bottom} stroke={colors.border} strokeWidth={1} />
      <Line x1={CHART_PADDING.left} y1={CHART_H - CHART_PADDING.bottom}
        x2={CHART_W - CHART_PADDING.right} y2={CHART_H - CHART_PADDING.bottom} stroke={colors.border} strokeWidth={1} />
      {xTicks.map((a) => {
        const { x } = toXY(a, minVal, minAge, maxAge, minVal, maxVal);
        return (
          <SvgText key={`xt${a}`} x={x} y={CHART_H - CHART_PADDING.bottom + 12}
            fontSize="9" fill={colors.textLight} textAnchor="middle">
            {a < 12 ? `${a}m` : `${a / 12}a`}
          </SvgText>
        );
      })}
    </>
  );
}

const LegendItem = ({ color, dash, label }) => (
  <View style={styles.legendItem}>
    <View style={[styles.legendLine, { backgroundColor: dash ? 'transparent' : color,
      borderColor: color, borderWidth: dash ? 1, borderStyle: dash ? 'dashed' : 'solid' }]} />
    <Text style={styles.legendText}>{label}</Text>
  </View>
);

// ─── Tela principal ───────────────────────────────────────────────────────────
const METRIC_TABS = [
  { id: 'weight', label: 'Peso',   icon: 'barbell-outline' },
  { id: 'height', label: 'Altura', icon: 'resize-outline' },
  { id: 'head',   label: 'PC',     icon: 'ellipse-outline' },
];

const VIEW_TABS = [
  { id: 'chart',    label: 'Gráfico',   icon: 'stats-chart-outline' },
  { id: 'calendar', label: 'Calendário', icon: 'calendar-outline' },
  { id: 'records',  label: 'Registros', icon: 'list-outline' },
];

const GrowthScreen = ({ route, navigation }) => {
  const { groupId, groupName } = route.params || {};
  const [loading, setLoading]     = useState(true);
  const [records, setRecords]     = useState([]);
  const [birthDate, setBirthDate] = useState(null);
  const [metric, setMetric]       = useState('weight');
  const [view, setView]           = useState('chart');

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [groupId])
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await growthService.getRecords(groupId);
      setBirthDate(result.birth_date || null);
      const sorted = (result.records || []).sort((a, b) =>
        new Date(a.date) - new Date(b.date)
      );
      setRecords(sorted);
    } catch (error) {
      console.error('GrowthScreen:', error);
      Toast.show({ type: 'error', text1: 'Erro ao carregar registros de crescimento.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (item) => {
    Alert.alert(
      'Remover medição',
      `Deseja remover o registro de ${formatDate(item.date)}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await growthService.deleteRecord(groupId, item.id);
              Toast.show({ type: 'success', text1: 'Registro removido.' });
              loadData();
            } catch {
              Toast.show({ type: 'error', text1: 'Erro ao remover registro.' });
            }
          },
        },
      ]
    );
  };

  // Calendário SBP: próximas medições
  const schedule = generateSBPSchedule(birthDate);
  const today = new Date();
  const upcoming = schedule.filter((s) => s.date >= today).slice(0, 8);
  const past     = schedule.filter((s) => s.date < today);

  const lastRecord = records[records.length - 1];

  // ── Render ──
  const renderRecordItem = ({ item }) => (
    <TouchableOpacity
      style={styles.recordCard}
      activeOpacity={0.8}
      onLongPress={() => handleDelete(item)}
    >
      <View style={[styles.recordBar, { backgroundColor: KIDS_GREEN }]} />
      <View style={styles.recordContent}>
        <View style={styles.recordHeader}>
          <Text style={styles.recordDate}>{formatDate(item.date)}</Text>
          {item.age_months != null && (
            <View style={styles.ageBadge}>
              <Text style={styles.ageBadgeText}>{item.age_months}m</Text>
            </View>
          )}
        </View>
        <View style={styles.recordMetrics}>
          {item.weight        != null && <MetricChip icon="barbell-outline"  value={`${item.weight} kg`}  color={colors.primary} />}
          {item.height        != null && <MetricChip icon="resize-outline"   value={`${item.height} cm`}  color="#7c3aed" />}
          {item.head_circumference != null && <MetricChip icon="ellipse-outline" value={`${item.head_circumference} cm`} color="#0891b2" />}
        </View>
        {item.notes ? <Text style={styles.recordNotes} numberOfLines={1}>{item.notes}</Text> : null}
      </View>
      <Ionicons name="ellipsis-vertical" size={16} color={colors.textLight} style={{ alignSelf: 'center' }} />
    </TouchableOpacity>
  );

  const renderCalendarItem = ({ item }) => {
    const isNext = item === upcoming[0];
    return (
      <View style={[styles.calItem, isNext && styles.calItemNext]}>
        <View style={[styles.calDot, { backgroundColor: isNext ? KIDS_GREEN : colors.border }]} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.calLabel, isNext && { color: KIDS_GREEN, fontWeight: '700' }]}>
            {item.label}
          </Text>
          <Text style={styles.calDate}>{formatDate(item.date.toISOString())} · {item.period}</Text>
        </View>
        {isNext && (
          <View style={styles.nextBadge}>
            <Text style={styles.nextBadgeText}>Próxima</Text>
          </View>
        )}
      </View>
    );
  };

  const ref = WHO_DATA[metric];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      {isKidsGroup() && <KidsBackground />}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Crescimento</Text>
          {groupName ? <Text style={styles.headerSubtitle}>{groupName}</Text> : null}
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddGrowth', { groupId, groupName, birthDate })}
        >
          <Ionicons name="add" size={26} color={KIDS_GREEN} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={KIDS_GREEN} />
          <Text style={styles.loadingText}>Carregando dados de crescimento...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

          {/* Banner sem data de nascimento */}
          {!birthDate && (
            <View style={[styles.banner, { backgroundColor: colors.warning + '18' }]}>
              <Ionicons name="information-circle-outline" size={16} color={colors.warning} />
              <Text style={[styles.bannerText, { color: colors.warning }]}>
                Cadastre a data de nascimento do paciente para ver as datas previstas de medição.
              </Text>
            </View>
          )}

          {/* Cards de resumo */}
          {lastRecord && (
            <View style={styles.summaryRow}>
              {lastRecord.weight        != null && <SummaryCard icon="barbell-outline"  label="Peso"   value={`${lastRecord.weight} kg`}  color={colors.primary} />}
              {lastRecord.height        != null && <SummaryCard icon="resize-outline"   label="Altura" value={`${lastRecord.height} cm`}  color="#7c3aed" />}
              {lastRecord.head_circumference != null && <SummaryCard icon="ellipse-outline" label="PC" value={`${lastRecord.head_circumference} cm`} color="#0891b2" />}
            </View>
          )}

          {/* Tabs de visualização */}
          <View style={styles.viewTabsRow}>
            {VIEW_TABS.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[styles.viewTab, view === t.id && styles.viewTabActive]}
                onPress={() => setView(t.id)}
              >
                <Ionicons name={t.icon} size={14} color={view === t.id ? '#fff' : colors.textLight} />
                <Text style={[styles.viewTabText, view === t.id && styles.viewTabTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Vista: Gráfico ── */}
          {view === 'chart' && (
            <View>
              {/* Seletor de métrica */}
              <View style={styles.metricTabsRow}>
                {METRIC_TABS.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.metricTab, metric === t.id && { borderColor: WHO_DATA[t.id].color, backgroundColor: WHO_DATA[t.id].color + '15' }]}
                    onPress={() => setMetric(t.id)}
                  >
                    <Ionicons name={t.icon} size={15} color={metric === t.id ? WHO_DATA[t.id].color : colors.textLight} />
                    <Text style={[styles.metricTabText, metric === t.id && { color: WHO_DATA[t.id].color, fontWeight: '700' }]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.chartCard}>
                <View style={styles.chartHeader}>
                  <Text style={styles.chartTitle}>{ref.label} · {ref.unit}</Text>
                  <Text style={styles.chartSubtitle}>Curvas OMS: P3 · P50 · P97</Text>
                </View>
                <GrowthChart records={records} metric={metric} />
              </View>

              {records.length === 0 && (
                <View style={styles.emptyContainer}>
                  <Ionicons name="trending-up-outline" size={48} color={colors.gray300} />
                  <Text style={styles.emptyText}>Nenhum dado registrado ainda.</Text>
                  <TouchableOpacity
                    style={styles.emptyBtn}
                    onPress={() => navigation.navigate('AddGrowth', { groupId, groupName, birthDate })}
                  >
                    <Text style={styles.emptyBtnText}>Adicionar primeira medição</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* ── Vista: Calendário SBP ── */}
          {view === 'calendar' && (
            <View style={styles.calendarSection}>
              <View style={styles.calHeaderRow}>
                <Ionicons name="calendar" size={18} color={KIDS_GREEN} />
                <Text style={styles.calSectionTitle}>Próximas medições (SBP)</Text>
              </View>
              {!birthDate ? (
                <Text style={styles.calNoDate}>Informe a data de nascimento para ver o calendário.</Text>
              ) : upcoming.length === 0 ? (
                <Text style={styles.calNoDate}>Todas as medições do cronograma já foram realizadas.</Text>
              ) : (
                <FlatList
                  data={upcoming}
                  keyExtractor={(_, i) => String(i)}
                  renderItem={renderCalendarItem}
                  scrollEnabled={false}
                  ItemSeparatorComponent={() => <View style={styles.calSep} />}
                />
              )}

              {past.length > 0 && (
                <>
                  <View style={[styles.calHeaderRow, { marginTop: 24 }]}>
                    <Ionicons name="checkmark-circle-outline" size={18} color={colors.textLight} />
                    <Text style={[styles.calSectionTitle, { color: colors.textLight }]}>
                      Medições passadas ({past.length})
                    </Text>
                  </View>
                  <FlatList
                    data={past.slice(-5).reverse()}
                    keyExtractor={(_, i) => String(i)}
                    renderItem={({ item }) => (
                      <View style={[styles.calItem, { opacity: 0.55 }]}>
                        <View style={[styles.calDot, { backgroundColor: colors.gray300 }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.calLabel}>{item.label}</Text>
                          <Text style={styles.calDate}>{formatDate(item.date.toISOString())} · {item.period}</Text>
                        </View>
                      </View>
                    )}
                    scrollEnabled={false}
                    ItemSeparatorComponent={() => <View style={styles.calSep} />}
                  />
                </>
              )}

              <View style={styles.sbpNote}>
                <Ionicons name="information-circle-outline" size={13} color={colors.textLight} />
                <Text style={styles.sbpNoteText}>
                  Cronograma baseado nas recomendações da Sociedade Brasileira de Pediatria (SBP):
                  mensal (1–12 meses) · trimestral (1–2 anos) · semestral (após 2 anos).
                </Text>
              </View>
            </View>
          )}

          {/* ── Vista: Registros ── */}
          {view === 'records' && (
            <View>
              {records.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="clipboard-outline" size={48} color={colors.gray300} />
                  <Text style={styles.emptyText}>Nenhum registro de medição.</Text>
                  <TouchableOpacity
                    style={styles.emptyBtn}
                    onPress={() => navigation.navigate('AddGrowth', { groupId, groupName, birthDate })}
                  >
                    <Text style={styles.emptyBtnText}>Adicionar primeira medição</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <FlatList
                  data={[...records].reverse()}
                  keyExtractor={(item) => String(item.id)}
                  renderItem={renderRecordItem}
                  scrollEnabled={false}
                  contentContainerStyle={{ paddingTop: 8 }}
                  ListFooterComponent={
                    <Text style={styles.longPressHint}>Segure um registro para excluí-lo.</Text>
                  }
                />
              )}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

// ─── Sub-componentes ──────────────────────────────────────────────────────────
const SummaryCard = ({ icon, label, value, color }) => (
  <View style={[styles.summaryCard, { borderColor: color + '40' }]}>
    <Ionicons name={icon} size={20} color={color} />
    <Text style={[styles.summaryValue, { color }]}>{value}</Text>
    <Text style={styles.summaryLabel}>{label}</Text>
  </View>
);

const MetricChip = ({ icon, value, color }) => (
  <View style={[styles.metricChip, { backgroundColor: color + '15' }]}>
    <Ionicons name={icon} size={12} color={color} />
    <Text style={[styles.metricChipText, { color }]}>{value}</Text>
  </View>
);

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00');
  return d.toLocaleDateString('pt-BR');
};

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: colors.background },
  header:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.backgroundLight, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn:          { padding: 4 },
  headerCenter:     { flex: 1, marginLeft: 8 },
  headerTitle:      { fontSize: 18, fontWeight: '700', color: colors.text },
  headerSubtitle:   { fontSize: 12, color: colors.textLight, marginTop: 1 },
  addBtn:           { padding: 4 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText:      { color: colors.textLight, fontSize: 14 },

  banner:           { flexDirection: 'row', alignItems: 'flex-start', gap: 8, margin: 16, padding: 12, borderRadius: 10 },
  bannerText:       { flex: 1, fontSize: 13, lineHeight: 18 },

  summaryRow:       { flexDirection: 'row', marginHorizontal: 16, marginTop: 16, gap: 10 },
  summaryCard:      { flex: 1, alignItems: 'center', gap: 4, padding: 10, backgroundColor: colors.backgroundLight, borderRadius: 12, borderWidth: 1 },
  summaryValue:     { fontSize: 14, fontWeight: '700' },
  summaryLabel:     { fontSize: 10, color: colors.textLight },

  viewTabsRow:      { flexDirection: 'row', marginHorizontal: 16, marginTop: 16, gap: 8 },
  viewTab:          { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 7, borderRadius: 20, backgroundColor: colors.gray100 },
  viewTabActive:    { backgroundColor: KIDS_GREEN },
  viewTabText:      { fontSize: 11, color: colors.textLight, fontWeight: '500' },
  viewTabTextActive:{ color: '#fff', fontWeight: '700' },

  metricTabsRow:    { flexDirection: 'row', marginHorizontal: 16, marginTop: 16, gap: 8 },
  metricTab:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.backgroundLight, borderWidth: 1.5, borderColor: colors.border },
  metricTabText:    { fontSize: 11, color: colors.textLight, fontWeight: '500' },

  chartCard:        { margin: 16, padding: 14, backgroundColor: colors.backgroundLight, borderRadius: 14, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  chartHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  chartTitle:       { fontSize: 14, fontWeight: '700', color: colors.text },
  chartSubtitle:    { fontSize: 10, color: colors.textLight },

  chartWrap:        { alignItems: 'center' },
  chartEmpty:       { marginTop: 8, paddingHorizontal: 16 },
  chartEmptyText:   { fontSize: 12, color: colors.textLight, textAlign: 'center' },

  legend:           { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10, justifyContent: 'center' },
  legendItem:       { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendLine:       { width: 20, height: 2, borderRadius: 1 },
  legendText:       { fontSize: 10, color: colors.textLight },

  calendarSection:  { margin: 16, padding: 16, backgroundColor: colors.backgroundLight, borderRadius: 14, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  calHeaderRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  calSectionTitle:  { fontSize: 15, fontWeight: '700', color: colors.text },
  calNoDate:        { fontSize: 13, color: colors.textLight, textAlign: 'center', paddingVertical: 20 },
  calItem:          { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  calItemNext:      { backgroundColor: KIDS_GREEN + '0D', marginHorizontal: -8, paddingHorizontal: 8, borderRadius: 10 },
  calDot:           { width: 10, height: 10, borderRadius: 5 },
  calLabel:         { fontSize: 14, fontWeight: '600', color: colors.text },
  calDate:          { fontSize: 12, color: colors.textLight, marginTop: 2 },
  calSep:           { height: 1, backgroundColor: colors.border, marginLeft: 22 },
  nextBadge:        { backgroundColor: KIDS_GREEN, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  nextBadgeText:    { fontSize: 10, color: '#fff', fontWeight: '700' },
  sbpNote:          { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 20, padding: 10, backgroundColor: colors.gray50, borderRadius: 8 },
  sbpNoteText:      { flex: 1, fontSize: 11, color: colors.textLight, lineHeight: 16 },

  recordCard:       { flexDirection: 'row', backgroundColor: colors.backgroundLight, marginHorizontal: 16, marginBottom: 10, borderRadius: 12, overflow: 'hidden', elevation: 1, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  recordBar:        { width: 4 },
  recordContent:    { flex: 1, padding: 12 },
  recordHeader:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  recordDate:       { fontSize: 14, fontWeight: '700', color: colors.text },
  ageBadge:         { backgroundColor: KIDS_GREEN + '22', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
  ageBadgeText:     { fontSize: 11, color: KIDS_GREEN, fontWeight: '600' },
  recordMetrics:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  metricChip:       { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  metricChipText:   { fontSize: 12, fontWeight: '600' },
  recordNotes:      { marginTop: 6, fontSize: 12, color: colors.textLight },
  longPressHint:    { textAlign: 'center', fontSize: 11, color: colors.textLight, paddingVertical: 12 },

  emptyContainer:   { alignItems: 'center', paddingTop: 40, gap: 12 },
  emptyText:        { fontSize: 14, color: colors.textLight, textAlign: 'center' },
  emptyBtn:         { backgroundColor: KIDS_GREEN, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10, marginTop: 4 },
  emptyBtnText:     { color: '#fff', fontWeight: '700', fontSize: 14 },
});

export default GrowthScreen;

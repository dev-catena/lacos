import React, { useState, useCallback } from 'react';
import KidsBackground from '../../components/KidsBackground';
import { isKidsGroup } from '../../stores/currentGroupStore';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import colors from '../../constants/colors';
import vaccinationService from '../../services/vaccinationService';

const STATUS_TABS = [
  { id: 'all', label: 'Todas' },
  { id: 'pending', label: 'Pendentes' },
  { id: 'overdue', label: 'Atrasadas' },
  { id: 'applied', label: 'Aplicadas' },
];

const STATUS_CONFIG = {
  applied:  { color: colors.success,  icon: 'checkmark-circle',      label: 'Aplicada'  },
  pending:  { color: colors.info,     icon: 'time-outline',           label: 'Pendente'  },
  overdue:  { color: colors.error,    icon: 'alert-circle',           label: 'Atrasada'  },
};

const VaccinationScreen = ({ route, navigation }) => {
  const { groupId, groupName } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState([]);
  const [birthDate, setBirthDate] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  useFocusEffect(
    useCallback(() => {
      loadSchedule();
    }, [groupId])
  );

  const loadSchedule = async () => {
    setLoading(true);
    try {
      const result = await vaccinationService.getSchedule(groupId);
      setBirthDate(result.birth_date || null);
      setSchedule(result.schedule || []);
    } catch (error) {
      console.error('VaccinationScreen:', error);
      Toast.show({ type: 'error', text1: 'Erro ao carregar calendário vacinal.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecord = (item) => {
    Alert.alert(
      'Remover registro',
      `Deseja remover o registro de "${item.vaccine_name} (${item.dose})"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await vaccinationService.deleteRecord(groupId, item.record_id);
              Toast.show({ type: 'success', text1: 'Registro removido.' });
              loadSchedule();
            } catch {
              Toast.show({ type: 'error', text1: 'Erro ao remover registro.' });
            }
          },
        },
      ]
    );
  };

  const filteredSchedule = schedule.filter((item) =>
    filterStatus === 'all' ? true : item.status === filterStatus
  );

  const counts = {
    all:     schedule.length,
    pending: schedule.filter((i) => i.status === 'pending').length,
    overdue: schedule.filter((i) => i.status === 'overdue').length,
    applied: schedule.filter((i) => i.status === 'applied').length,
  };

  const renderItem = ({ item }) => {
    const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() =>
          item.status === 'applied' && item.record_id
            ? navigation.navigate('VaccinationDetails', { groupId, recordId: item.record_id })
            : navigation.navigate('AddVaccination', {
                groupId,
                groupName,
                scheduleItem: item,
              })
        }
        onLongPress={() => item.status === 'applied' && handleDeleteRecord(item)}
      >
        {/* Linha de status colorida à esquerda */}
        <View style={[styles.statusBar, { backgroundColor: cfg.color }]} />

        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.vaccineName}>{item.vaccine_name}</Text>
              <View style={[styles.badge, { backgroundColor: cfg.color + '22' }]}>
                <Ionicons name={cfg.icon} size={12} color={cfg.color} />
                <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
              </View>
            </View>
            <Text style={styles.doseText}>{item.dose}</Text>
          </View>

          <View style={styles.cardMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={13} color={colors.textLight} />
              <Text style={styles.metaText}>
                {item.age_label}
                {item.due_date ? ` · previsto ${formatDate(item.due_date)}` : ''}
              </Text>
            </View>
            {item.status === 'applied' && item.applied_at && (
              <View style={styles.metaItem}>
                <Ionicons name="checkmark-outline" size={13} color={colors.success} />
                <Text style={[styles.metaText, { color: colors.success }]}>
                  Aplicada em {formatDate(item.applied_at)}
                </Text>
              </View>
            )}
          </View>

          {item.description ? (
            <Text style={styles.description} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
        </View>

        <Ionicons
          name={item.status === 'applied' ? 'document-text-outline' : 'add-circle-outline'}
          size={20}
          color={cfg.color}
          style={styles.actionIcon}
        />
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View>
      {/* Info nascimento */}
      {birthDate ? (
        <View style={styles.birthBanner}>
          <Ionicons name="person-outline" size={16} color={colors.primary} />
          <Text style={styles.birthText}>
            Data de nascimento registrada: <Text style={{ fontWeight: '700' }}>{formatDate(birthDate)}</Text>
          </Text>
        </View>
      ) : (
        <View style={[styles.birthBanner, { backgroundColor: colors.warning + '18' }]}>
          <Ionicons name="information-circle-outline" size={16} color={colors.warning} />
          <Text style={[styles.birthText, { color: colors.warning }]}>
            Cadastre a data de nascimento do paciente para ver as datas previstas.
          </Text>
        </View>
      )}

      {/* Resumo */}
      <View style={styles.summaryRow}>
        <SummaryCard count={counts.applied} label="Aplicadas" color={colors.success} icon="checkmark-circle" />
        <SummaryCard count={counts.pending} label="Pendentes" color={colors.info}    icon="time-outline"    />
        <SummaryCard count={counts.overdue} label="Atrasadas" color={colors.error}   icon="alert-circle"   />
      </View>

      {/* Tabs de filtro */}
      <View style={styles.tabsRow}>
        {STATUS_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, filterStatus === tab.id && styles.tabActive]}
            onPress={() => setFilterStatus(tab.id)}
          >
            <Text style={[styles.tabText, filterStatus === tab.id && styles.tabTextActive]}>
              {tab.label}
              {tab.id !== 'all' ? ` (${counts[tab.id]})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

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
          <Text style={styles.headerTitle}>Vacinação</Text>
          {groupName ? <Text style={styles.headerSubtitle}>{groupName}</Text> : null}
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddVaccination', { groupId, groupName })}
        >
          <Ionicons name="add" size={26} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando calendário vacinal...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredSchedule}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="medical-outline" size={48} color={colors.gray300} />
              <Text style={styles.emptyText}>
                {filterStatus === 'all'
                  ? 'Nenhuma vacina no calendário.'
                  : `Nenhuma vacina ${STATUS_CONFIG[filterStatus]?.label?.toLowerCase() || ''}.`}
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const SummaryCard = ({ count, label, color, icon }) => (
  <View style={[styles.summaryCard, { borderColor: color + '40' }]}>
    <Ionicons name={icon} size={22} color={color} />
    <Text style={[styles.summaryCount, { color }]}>{count}</Text>
    <Text style={styles.summaryLabel}>{label}</Text>
  </View>
);

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('pt-BR');
};

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: colors.background },
  header:            { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.backgroundLight, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn:           { padding: 4 },
  headerCenter:      { flex: 1, marginLeft: 8 },
  headerTitle:       { fontSize: 18, fontWeight: '700', color: colors.text },
  headerSubtitle:    { fontSize: 12, color: colors.textLight, marginTop: 1 },
  addBtn:            { padding: 4 },
  loadingContainer:  { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText:       { color: colors.textLight, fontSize: 14 },
  listContent:       { paddingBottom: 32 },

  birthBanner:       { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 16, padding: 12, backgroundColor: colors.primary + '12', borderRadius: 10 },
  birthText:         { flex: 1, fontSize: 13, color: colors.text },

  summaryRow:        { flexDirection: 'row', marginHorizontal: 16, gap: 10, marginBottom: 16 },
  summaryCard:       { flex: 1, alignItems: 'center', gap: 4, padding: 12, backgroundColor: colors.backgroundLight, borderRadius: 12, borderWidth: 1 },
  summaryCount:      { fontSize: 22, fontWeight: '800' },
  summaryLabel:      { fontSize: 11, color: colors.textLight },

  tabsRow:           { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12, gap: 8 },
  tab:               { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, backgroundColor: colors.gray100 },
  tabActive:         { backgroundColor: colors.primary },
  tabText:           { fontSize: 12, color: colors.textLight, fontWeight: '500' },
  tabTextActive:     { color: '#fff', fontWeight: '700' },

  card:              { flexDirection: 'row', backgroundColor: colors.backgroundLight, marginHorizontal: 16, marginBottom: 10, borderRadius: 12, overflow: 'hidden', elevation: 1, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  statusBar:         { width: 4 },
  cardContent:       { flex: 1, padding: 12 },
  cardHeader:        { marginBottom: 6 },
  cardTitleRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  vaccineName:       { fontSize: 15, fontWeight: '700', color: colors.text, flex: 1, marginRight: 8 },
  badge:             { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText:         { fontSize: 11, fontWeight: '600' },
  doseText:          { fontSize: 13, color: colors.textLight },
  cardMeta:          { gap: 3 },
  metaItem:          { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText:          { fontSize: 12, color: colors.textLight },
  description:       { marginTop: 6, fontSize: 12, color: colors.textLight, lineHeight: 16 },
  actionIcon:        { alignSelf: 'center', marginRight: 12 },

  emptyContainer:    { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText:         { fontSize: 14, color: colors.textLight, textAlign: 'center' },
});

export default VaccinationScreen;

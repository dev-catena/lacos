import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  TextInput,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import { CameraView, useCameraPermissions } from 'expo-camera';
import colors from '../../constants/colors';
import { ArrowBackIcon } from '../../components/CustomIcons';
import locationModuleService from '../../services/locationModuleService';
import {
  isBleScanAvailable,
  looksLikeMac,
  scanNearbyGateways,
} from '../../ble/mokoGatewayScan';
import { extractMacFromQrPayload } from '../../utils/macFromQr';

function MacQrScannerModal({ visible, title, onClose, onMacFound }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (visible) setLocked(false);
  }, [visible]);

  const onBarcodeScanned = useCallback(
    ({ data }) => {
      if (locked || !data) return;
      const mac = extractMacFromQrPayload(data);
      if (!mac) {
        setLocked(true);
        Alert.alert(
          'QR sem MAC',
          'Não encontrei um endereço MAC neste código. Tente outro QR ou digite manualmente.',
          [{ text: 'OK', onPress: () => setLocked(false) }],
        );
        return;
      }
      setLocked(true);
      onMacFound(mac, data);
    },
    [locked, onMacFound],
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.qrRoot}>
        {!permission ? (
          <View style={styles.qrCentered}>
            <ActivityIndicator color={colors.textWhite} />
          </View>
        ) : !permission.granted ? (
          <SafeAreaView style={styles.qrPermission} edges={['top', 'bottom']}>
            <Text style={styles.qrPermissionTitle}>Permissão de câmera</Text>
            <Text style={styles.qrPermissionText}>
              Precisamos da câmera para ler o QR Code com o MAC do dispositivo.
            </Text>
            <TouchableOpacity style={styles.scanBtn} onPress={requestPermission}>
              <Text style={styles.scanBtnText}>Permitir câmera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.qrCancel} onPress={onClose}>
              <Text style={styles.qrCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </SafeAreaView>
        ) : (
          <>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={locked ? undefined : onBarcodeScanned}
            />
            <SafeAreaView style={styles.qrOverlay} edges={['top', 'bottom']}>
              <View style={styles.qrHeader}>
                <TouchableOpacity onPress={onClose} style={styles.qrCloseBtn}>
                  <Ionicons name="close" size={26} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.qrHeaderTitle}>{title || 'Ler QR Code'}</Text>
                <View style={{ width: 40 }} />
              </View>
              <View style={styles.qrFrameWrap}>
                <View style={styles.qrFrame} />
                <Text style={styles.qrHint}>Aponte para o QR da pulseira ou da caixa</Text>
              </View>
            </SafeAreaView>
          </>
        )}
      </View>
    </Modal>
  );
}

const MODES = {
  live: 'live',
  history: 'history',
  config: 'config',
};

function displayName(item) {
  return item.member_name || item.bracelet_name || item.bracelet_mac || 'Pulseira';
}

function formatTime(at) {
  if (!at) return '—';
  const m = moment(at);
  return m.isValid() ? m.format('DD/MM HH:mm') : String(at);
}

function ModeTabs({ mode, onChange }) {
  const tabs = [
    { id: MODES.live, label: 'Agora', icon: 'radio-outline' },
    { id: MODES.history, label: 'Trajeto', icon: 'git-branch-outline' },
    { id: MODES.config, label: 'Config.', icon: 'settings-outline' },
  ];
  return (
    <View style={styles.modeRow}>
      {tabs.map((t) => {
        const active = mode === t.id;
        return (
          <TouchableOpacity
            key={t.id}
            style={[styles.modeTab, active && styles.modeTabActive]}
            onPress={() => onChange(t.id)}
            activeOpacity={0.85}
          >
            <Ionicons name={t.icon} size={18} color={active ? colors.primary : colors.gray500} />
            <Text style={[styles.modeTabText, active && styles.modeTabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function LivePanel({ positions, gateways, windowMinutes, onRefresh, refreshing }) {
  const gatewayOnlineMs = 2 * 60 * 1000;

  return (
    <ScrollView
      contentContainerStyle={styles.panelScroll}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
      }
    >
      <Text style={styles.hint}>
        Posição estimada pelo gateway que mais “ouve” a pulseira (últimos {windowMinutes} min).
      </Text>
      {positions.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="locate-outline" size={48} color={colors.gray300} />
          <Text style={styles.emptyTitle}>Nenhuma pulseira cadastrada</Text>
          <Text style={styles.emptyText}>
            Em Config., associe uma pulseira MOKO a um acompanhado e cadastre os gateways da casa.
          </Text>
        </View>
      ) : (
        positions.map((p) => (
          <View key={p.id} style={styles.liveCard}>
            <View style={styles.liveCardHeader}>
              <Ionicons
                name={p.is_online ? 'person-circle' : 'person-circle-outline'}
                size={28}
                color={p.is_online ? '#0d9488' : colors.gray400}
              />
              <View style={styles.liveCardTitleWrap}>
                <Text style={styles.liveCardName}>{displayName(p)}</Text>
                <Text style={styles.liveCardSub}>
                  {p.bracelet_mac || ''}
                </Text>
              </View>
              <View style={[styles.statusPill, p.is_online ? styles.statusOnline : styles.statusOffline]}>
                <Text style={styles.statusPillText}>{p.is_online ? 'Online' : 'Sem sinal'}</Text>
              </View>
            </View>
            <View style={styles.placeRow}>
              <Ionicons name="home-outline" size={20} color={colors.primary} />
              <Text style={styles.placeLabel}>
                {p.current?.place_label || 'Local desconhecido'}
              </Text>
            </View>
            {p.current?.recorded_at ? (
              <Text style={styles.metaText}>Atualizado {formatTime(p.current.recorded_at)}</Text>
            ) : null}
          </View>
        ))
      )}
      {gateways.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Gateways na casa</Text>
          {gateways.map((g) => {
            const seenMs = g.last_seen_at ? moment(g.last_seen_at).valueOf() : 0;
            const online = seenMs > 0 && Date.now() - seenMs < gatewayOnlineMs;
            return (
              <View key={g.id} style={styles.gatewayChip}>
                <Ionicons
                  name="wifi"
                  size={18}
                  color={online ? '#0d9488' : colors.gray400}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.gatewayChipTitle}>{g.place_label}</Text>
                  <Text style={styles.gatewayChipText}>
                    {g.gateway_mac}
                    {g.last_seen_at
                      ? ` · visto ${formatTime(g.last_seen_at)}`
                      : ' · ainda sem dados do MQTT'}
                  </Text>
                </View>
                <View style={[styles.statusPill, online ? styles.statusOnline : styles.statusOffline]}>
                  <Text style={styles.statusPillText}>{online ? 'Ativo' : 'Inativo'}</Text>
                </View>
              </View>
            );
          })}
        </>
      ) : null}
    </ScrollView>
  );
}

function HistoryPanel({ groupId, bracelets, onRefresh, refreshing }) {
  const [selectedId, setSelectedId] = useState(bracelets[0]?.id ?? null);
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (bracelets.length && !selectedId) setSelectedId(bracelets[0].id);
  }, [bracelets, selectedId]);

  const loadHistory = useCallback(async () => {
    if (!groupId || !selectedId) return;
    setLoading(true);
    try {
      const from = moment().subtract(24, 'hours').toISOString();
      const res = await locationModuleService.getLocationHistory(groupId, {
        braceletId: selectedId,
        from,
        limit: 150,
      });
      setPoints(res.points || []);
    } catch (e) {
      Alert.alert('Trajeto', e?.message || 'Erro ao carregar');
      setPoints([]);
    } finally {
      setLoading(false);
    }
  }, [groupId, selectedId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const selected = bracelets.find((b) => b.id === selectedId);

  return (
    <ScrollView
      contentContainerStyle={styles.panelScroll}
      refreshControl={
        <RefreshControl
          refreshing={refreshing || loading}
          onRefresh={() => {
            onRefresh();
            loadHistory();
          }}
          colors={[colors.primary]}
        />
      }
    >
      <Text style={styles.hint}>Trajeto nas últimas 24 horas (por cômodo/gateway).</Text>
      {bracelets.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>Cadastre pulseiras em Config.</Text>
        </View>
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {bracelets.map((b) => (
              <TouchableOpacity
                key={b.id}
                style={[styles.personChip, selectedId === b.id && styles.personChipActive]}
                onPress={() => setSelectedId(b.id)}
              >
                <Text style={[styles.personChipText, selectedId === b.id && styles.personChipTextActive]}>
                  {displayName(b)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {selected ? (
            <Text style={styles.sectionTitle}>Histórico — {displayName(selected)}</Text>
          ) : null}
          {loading && points.length === 0 ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
          ) : points.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum registro no período.</Text>
          ) : (
            points.map((pt, idx) => (
              <View key={`${pt.id}-${idx}`} style={styles.historyRow}>
                <View style={styles.historyDot} />
                <View style={styles.historyBody}>
                  <Text style={styles.historyPlace}>{pt.place_label || '—'}</Text>
                  <Text style={styles.historyTime}>{formatTime(pt.recorded_at)}</Text>
                </View>
              </View>
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}

function ConfigPanel({ groupId, gateways, bracelets, members, onChanged }) {
  const [gwModal, setGwModal] = useState(false);
  const [brModal, setBrModal] = useState(false);
  const [editingGw, setEditingGw] = useState(null);
  const [editingBr, setEditingBr] = useState(null);
  const [gwMac, setGwMac] = useState('');
  const [gwName, setGwName] = useState('');
  const [gwPlace, setGwPlace] = useState('');
  const [gwDesc, setGwDesc] = useState('');
  const [brMac, setBrMac] = useState('');
  const [brName, setBrName] = useState('');
  const [brMemberId, setBrMemberId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanDevices, setScanDevices] = useState([]);
  const [showAllBle, setShowAllBle] = useState(false);
  const [scanHint, setScanHint] = useState('');
  const [qrTarget, setQrTarget] = useState(null); // 'gateway' | 'bracelet' | null

  const openGw = (item = null) => {
    setEditingGw(item);
    setGwMac(item?.gateway_mac || '');
    setGwName(item?.device_name || '');
    setGwPlace(item?.place_label || '');
    setGwDesc(item?.place_description || '');
    setScanDevices([]);
    setShowAllBle(false);
    setScanHint('');
    setGwModal(true);
  };

  const closeGwModal = () => {
    setGwModal(false);
    setScanning(false);
    setScanDevices([]);
  };

  const runGatewayScan = async () => {
    if (!isBleScanAvailable()) {
      Alert.alert(
        'Bluetooth',
        'Scan BLE indisponível neste build. Digite o MAC manualmente (Device Info no MKScannerPro).',
      );
      return;
    }
    setScanning(true);
    setScanDevices([]);
    setScanHint('Procurando gateways próximos…');
    try {
      const { devices } = await scanNearbyGateways({
        durationMs: 8000,
        onDevice: (d) => {
          setScanDevices((prev) => {
            const next = new Map(prev.map((x) => [x.id, x]));
            next.set(d.id, d);
            return [...next.values()].sort((a, b) => {
              if (a.isMoko !== b.isMoko) return a.isMoko ? -1 : 1;
              return (b.rssi ?? -999) - (a.rssi ?? -999);
            });
          });
        },
      });
      setScanDevices(devices);
      const mokoCount = devices.filter((d) => d.isMoko).length;
      setScanHint(
        mokoCount > 0
          ? `${mokoCount} gateway(s) MOKO encontrado(s). Toque para selecionar.`
          : devices.length
            ? 'Nenhum Mini/MKGW óbvio. Mostrando BLE próximos — ou digite o MAC.'
            : 'Nenhum dispositivo encontrado. Aproxime o celular do gateway e tente de novo.',
      );
      if (!mokoCount && devices.length) setShowAllBle(true);
    } catch (e) {
      setScanHint('');
      Alert.alert('Scan BLE', e?.message || 'Falha ao escanear');
    } finally {
      setScanning(false);
    }
  };

  const selectScannedGateway = (device) => {
    const mac = looksLikeMac(device.mac) ? device.mac : '';
    setGwName(device.name || '');
    if (mac) {
      setGwMac(mac);
    } else {
      setGwMac('');
      Alert.alert(
        'MAC no iOS',
        'Neste aparelho o Bluetooth não mostra o MAC real. Abra o MKScannerPro → Device Info e cole o MAC aqui. O nome já foi preenchido.',
      );
    }
  };

  const openBr = (item = null) => {
    setEditingBr(item);
    setBrMac(item?.bracelet_mac || '');
    setBrName(item?.bracelet_name || '');
    setBrMemberId(item?.member_user_id ?? null);
    setBrModal(true);
  };

  const saveGw = async () => {
    if (!gwMac.trim() || !gwPlace.trim()) {
      Alert.alert('Gateway', 'Informe MAC e onde fica (ex.: Quarto da vovó).');
      return;
    }
    setSaving(true);
    try {
      await locationModuleService.saveLocationGateway(
        groupId,
        {
          gateway_mac: gwMac.trim(),
          device_name: gwName.trim() || null,
          place_label: gwPlace.trim(),
          place_description: gwDesc.trim() || null,
        },
        editingGw?.id,
      );
      setGwModal(false);
      setScanDevices([]);
      onChanged();
    } catch (e) {
      Alert.alert('Gateway', e?.message || 'Erro');
    } finally {
      setSaving(false);
    }
  };

  const saveBr = async () => {
    if (!brMac.trim()) {
      Alert.alert('Pulseira', 'Informe o MAC da pulseira.');
      return;
    }
    setSaving(true);
    try {
      await locationModuleService.saveLocationBracelet(
        groupId,
        {
          bracelet_mac: brMac.trim(),
          bracelet_name: brName.trim() || null,
          member_user_id: brMemberId,
        },
        editingBr?.id,
      );
      setBrModal(false);
      onChanged();
    } catch (e) {
      Alert.alert('Pulseira', e?.message || 'Erro');
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteGw = (item) => {
    Alert.alert('Remover gateway', `Excluir "${item.place_label}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            await locationModuleService.deleteLocationGateway(groupId, item.id);
            onChanged();
          } catch (e) {
            Alert.alert('Erro', e?.message);
          }
        },
      },
    ]);
  };

  const confirmDeleteBr = (item) => {
    Alert.alert('Remover pulseira', `Excluir ${displayName(item)}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            await locationModuleService.deleteLocationBracelet(groupId, item.id);
            onChanged();
          } catch (e) {
            Alert.alert('Erro', e?.message);
          }
        },
      },
    ]);
  };

  const patientMembers = members.filter((m) =>
    ['patient', 'accompanied', 'accompanied_person', 'priority_contact'].includes(m.role),
  );

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.panelScroll}>
        <Text style={styles.sectionTitle}>Gateways (cômodos)</Text>
        <Text style={styles.hint}>
          Descreva onde cada gateway MOKO está: sala, quarto, corredor…
        </Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => openGw()}>
          <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
          <Text style={styles.addBtnText}>Adicionar gateway</Text>
        </TouchableOpacity>
        {gateways.map((g) => (
          <View key={g.id} style={styles.configCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.configTitle}>{g.place_label}</Text>
              <Text style={styles.configSub}>{g.gateway_mac}</Text>
              {g.place_description ? (
                <Text style={styles.configDesc}>{g.place_description}</Text>
              ) : null}
            </View>
            <TouchableOpacity onPress={() => openGw(g)} style={styles.iconBtn}>
              <Ionicons name="create-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => confirmDeleteGw(g)} style={styles.iconBtn}>
              <Ionicons name="trash-outline" size={22} color={colors.error} />
            </TouchableOpacity>
          </View>
        ))}

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Pulseiras</Text>
        <Text style={styles.hint}>Associe cada pulseira MOKO a um acompanhado do grupo.</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => openBr()}>
          <Ionicons name="watch-outline" size={22} color={colors.primary} />
          <Text style={styles.addBtnText}>Adicionar pulseira</Text>
        </TouchableOpacity>
        {bracelets.map((b) => (
          <View key={b.id} style={styles.configCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.configTitle}>{displayName(b)}</Text>
              <Text style={styles.configSub}>{b.bracelet_mac}</Text>
            </View>
            <TouchableOpacity onPress={() => openBr(b)} style={styles.iconBtn}>
              <Ionicons name="create-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => confirmDeleteBr(b)} style={styles.iconBtn}>
              <Ionicons name="trash-outline" size={22} color={colors.error} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <Modal
        visible={gwModal}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={closeGwModal}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeGwModal} />
          <View style={styles.modalSheet}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>{editingGw ? 'Editar gateway' : 'Novo gateway'}</Text>

            {!editingGw ? (
              <View style={styles.scanBlock}>
                <TouchableOpacity
                  style={[styles.scanBtn, scanning && styles.scanBtnDisabled]}
                  onPress={runGatewayScan}
                  disabled={scanning}
                >
                  {scanning ? (
                    <ActivityIndicator color={colors.textWhite} />
                  ) : (
                    <Ionicons name="bluetooth-outline" size={20} color={colors.textWhite} />
                  )}
                  <Text style={styles.scanBtnText}>
                    {scanning ? 'Escaneando…' : 'Procurar gateway por Bluetooth'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.scanBtn, styles.scanBtnSecondary]}
                  onPress={() => setQrTarget('gateway')}
                >
                  <Ionicons name="qr-code-outline" size={20} color={colors.textWhite} />
                  <Text style={styles.scanBtnText}>Ler QR Code do gateway</Text>
                </TouchableOpacity>
                {scanHint ? <Text style={styles.scanHint}>{scanHint}</Text> : null}
                {(showAllBle
                  ? scanDevices
                  : scanDevices.filter((d) => d.isMoko)
                ).map((d) => (
                  <TouchableOpacity
                    key={d.id}
                    style={styles.scanRow}
                    onPress={() => selectScannedGateway(d)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.scanRowTitle}>{d.name}</Text>
                      <Text style={styles.scanRowSub}>
                        {looksLikeMac(d.mac) ? d.mac : d.id}
                        {d.rssi != null ? ` · ${d.rssi} dBm` : ''}
                        {d.isMoko ? ' · MOKO' : ''}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.gray400} />
                  </TouchableOpacity>
                ))}
                {scanDevices.length > 0 && !showAllBle && scanDevices.some((d) => !d.isMoko) ? (
                  <TouchableOpacity onPress={() => setShowAllBle(true)}>
                    <Text style={styles.scanLink}>Ver todos os BLE próximos</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}

            <TextInput
              style={styles.input}
              placeholder="MAC do gateway"
              placeholderTextColor={colors.placeholder}
              value={gwMac}
              onChangeText={setGwMac}
              editable={!editingGw}
              autoCapitalize="characters"
            />
            <TextInput
              style={styles.input}
              placeholder="Nome do aparelho (opcional)"
              placeholderTextColor={colors.placeholder}
              value={gwName}
              onChangeText={setGwName}
            />
            <TextInput
              style={styles.input}
              placeholder="Onde fica? (ex.: Quarto da Rosa)"
              placeholderTextColor={colors.placeholder}
              value={gwPlace}
              onChangeText={setGwPlace}
            />
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Descrição (opcional)"
              placeholderTextColor={colors.placeholder}
              value={gwDesc}
              onChangeText={setGwDesc}
              multiline
            />
            <TouchableOpacity style={styles.primaryBtn} onPress={saveGw} disabled={saving}>
              {saving ? (
                <ActivityIndicator color={colors.textWhite} />
              ) : (
                <Text style={styles.primaryBtnText}>Salvar</Text>
              )}
            </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={brModal}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setBrModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setBrModal(false)} />
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{editingBr ? 'Editar pulseira' : 'Nova pulseira'}</Text>
            {!editingBr ? (
              <View style={styles.scanBlock}>
                <TouchableOpacity
                  style={styles.scanBtn}
                  onPress={() => setQrTarget('bracelet')}
                >
                  <Ionicons name="qr-code-outline" size={20} color={colors.textWhite} />
                  <Text style={styles.scanBtnText}>Ler QR Code da pulseira</Text>
                </TouchableOpacity>
                <Text style={styles.scanHint}>
                  Aponte a câmera para o QR da pulseira ou da embalagem. O MAC é preenchido
                  automaticamente.
                </Text>
              </View>
            ) : null}
            <TextInput
              style={styles.input}
              placeholder="MAC da pulseira"
              placeholderTextColor={colors.placeholder}
              value={brMac}
              onChangeText={setBrMac}
              editable={!editingBr}
              autoCapitalize="characters"
            />
            <TextInput
              style={styles.input}
              placeholder="Apelido (opcional)"
              placeholderTextColor={colors.placeholder}
              value={brName}
              onChangeText={setBrName}
            />
            <Text style={styles.fieldLabel}>Acompanhado</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.personChip, brMemberId == null && styles.personChipActive]}
                onPress={() => setBrMemberId(null)}
              >
                <Text style={styles.personChipText}>Nenhum</Text>
              </TouchableOpacity>
              {patientMembers.map((m) => (
                <TouchableOpacity
                  key={m.user_id}
                  style={[styles.personChip, brMemberId === m.user_id && styles.personChipActive]}
                  onPress={() => setBrMemberId(m.user_id)}
                >
                  <Text
                    style={[
                      styles.personChipText,
                      brMemberId === m.user_id && styles.personChipTextActive,
                    ]}
                  >
                    {m.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.primaryBtn} onPress={saveBr} disabled={saving}>
              {saving ? (
                <ActivityIndicator color={colors.textWhite} />
              ) : (
                <Text style={styles.primaryBtnText}>Salvar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <MacQrScannerModal
        visible={qrTarget != null}
        title={
          qrTarget === 'gateway' ? 'QR do gateway' : 'QR da pulseira'
        }
        onClose={() => setQrTarget(null)}
        onMacFound={(mac) => {
          if (qrTarget === 'gateway') {
            setGwMac(mac);
          } else if (qrTarget === 'bracelet') {
            setBrMac(mac);
          }
          setQrTarget(null);
        }}
      />
    </View>
  );
}

export default function GatewayLocationScreen({ route, navigation }) {
  const { groupId, groupName, initialMode } = route.params || {};
  const [mode, setMode] = useState(initialMode || MODES.live);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [positions, setPositions] = useState([]);
  const [gateways, setGateways] = useState([]);
  const [bracelets, setBracelets] = useState([]);
  const [members, setMembers] = useState([]);
  const [windowMinutes, setWindowMinutes] = useState(5);
  const pollRef = useRef(null);

  const loadAll = useCallback(async ({ silent } = {}) => {
    if (!groupId) return;
    if (!silent) setLoading(true);
    try {
      const [rt, gw, br, mem] = await Promise.all([
        locationModuleService.getLocationRealtime(groupId),
        locationModuleService.listLocationGateways(groupId),
        locationModuleService.listLocationBracelets(groupId),
        locationModuleService.getLocationAssignableMembers(groupId),
      ]);
      setPositions(rt.positions || []);
      setGateways(rt.gateways || gw || []);
      setWindowMinutes(rt.window_minutes || 5);
      setBracelets(br || []);
      setMembers(mem || []);
    } catch (e) {
      if (!silent) Alert.alert('Localização', e?.message || 'Erro ao carregar');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (mode !== MODES.live || !groupId) {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      return undefined;
    }
    pollRef.current = setInterval(() => loadAll({ silent: true }), 30_000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [mode, groupId, loadAll]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAll({ silent: true });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowBackIcon size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.title}>Localização</Text>
          <Text style={styles.subtitle}>{groupName || 'Gateway BLE'}</Text>
        </View>
        <TouchableOpacity style={styles.headerAction} onPress={onRefresh}>
          <Ionicons name="refresh-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ModeTabs mode={mode} onChange={setMode} />

      {loading && mode === MODES.live ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : mode === MODES.live ? (
        <LivePanel
          positions={positions}
          gateways={gateways}
          windowMinutes={windowMinutes}
          onRefresh={onRefresh}
          refreshing={refreshing}
        />
      ) : mode === MODES.history ? (
        <HistoryPanel
          groupId={groupId}
          bracelets={bracelets}
          onRefresh={onRefresh}
          refreshing={refreshing}
        />
      ) : (
        <ConfigPanel
          groupId={groupId}
          gateways={gateways}
          bracelets={bracelets}
          members={members}
          onChanged={() => loadAll({ silent: true })}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1, marginLeft: 12 },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textLight, marginTop: 2 },
  headerAction: { padding: 8 },
  modeRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.backgroundLight,
  },
  modeTabActive: { backgroundColor: colors.primary + '18' },
  modeTabText: { fontSize: 13, fontWeight: '600', color: colors.gray500 },
  modeTabTextActive: { color: colors.primary },
  panelScroll: { padding: 16, paddingBottom: 40 },
  hint: { fontSize: 13, color: colors.textLight, marginBottom: 16, lineHeight: 18 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyBox: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: colors.text, marginTop: 12 },
  emptyText: { fontSize: 14, color: colors.textLight, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  liveCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  liveCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  liveCardTitleWrap: { flex: 1, marginLeft: 10 },
  liveCardName: { fontSize: 16, fontWeight: '700', color: colors.text },
  liveCardSub: { fontSize: 12, color: colors.textLight },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusOnline: { backgroundColor: '#ccfbf1' },
  statusOffline: { backgroundColor: colors.backgroundLight },
  statusPillText: { fontSize: 11, fontWeight: '700', color: colors.text },
  placeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  placeLabel: { fontSize: 18, fontWeight: '600', color: colors.primary, flex: 1 },
  metaText: { fontSize: 12, color: colors.textLight, marginTop: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 8 },
  gatewayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  gatewayChipTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  gatewayChipText: { fontSize: 12, color: colors.textLight, marginTop: 2 },
  chipScroll: { marginBottom: 12 },
  personChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.backgroundLight,
    marginRight: 8,
  },
  personChipActive: { backgroundColor: colors.primary },
  personChipText: { fontSize: 13, fontWeight: '600', color: colors.text },
  personChipTextActive: { color: colors.white },
  historyRow: { flexDirection: 'row', marginBottom: 14 },
  historyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginTop: 6,
    marginRight: 12,
  },
  historyBody: { flex: 1, borderLeftWidth: 0 },
  historyPlace: { fontSize: 15, fontWeight: '600', color: colors.text },
  historyTime: { fontSize: 12, color: colors.textLight, marginTop: 2 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingVertical: 8,
  },
  addBtnText: { fontSize: 15, fontWeight: '600', color: colors.primary },
  configCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  configTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  configSub: { fontSize: 12, color: colors.textLight, marginTop: 2 },
  configDesc: { fontSize: 12, color: colors.gray500, marginTop: 4 },
  iconBtn: { padding: 6 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 32,
    opacity: 1,
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    maxHeight: '88%',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, color: colors.text },
  scanBlock: { marginBottom: 14 },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0d9488',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  scanBtnSecondary: {
    backgroundColor: colors.primary,
    marginTop: 8,
  },
  scanBtnDisabled: { opacity: 0.7 },
  scanBtnText: { color: colors.textWhite, fontWeight: '700', fontSize: 14 },
  scanHint: { fontSize: 12, color: colors.textLight, marginTop: 8, lineHeight: 17 },
  qrRoot: { flex: 1, backgroundColor: '#000' },
  qrCentered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  qrPermission: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 24,
    justifyContent: 'center',
  },
  qrPermissionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  qrPermissionText: { fontSize: 14, color: '#cbd5e1', marginBottom: 20, lineHeight: 20 },
  qrCancel: { marginTop: 16, alignItems: 'center' },
  qrCancelText: { color: '#94a3b8', fontWeight: '600' },
  qrOverlay: { flex: 1, justifyContent: 'space-between' },
  qrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  qrCloseBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrHeaderTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  qrFrameWrap: { alignItems: 'center', marginBottom: 80 },
  qrFrame: {
    width: 240,
    height: 240,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  qrHint: {
    marginTop: 16,
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  scanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scanRowTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  scanRowSub: { fontSize: 12, color: colors.textLight, marginTop: 2 },
  scanLink: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 15,
    color: colors.text,
    backgroundColor: '#ffffff',
  },
  inputMultiline: { minHeight: 72, textAlignVertical: 'top' },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.textLight, marginBottom: 8 },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText: { color: colors.textWhite, fontWeight: '700', fontSize: 16 },
});

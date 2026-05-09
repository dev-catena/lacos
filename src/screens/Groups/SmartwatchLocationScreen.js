import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import colors from '../../constants/colors';
import { ArrowBackIcon } from '../../components/CustomIcons';
import groupService from '../../services/groupService';
import deviceService from '../../services/deviceService';

function buildLeafletHtml(points) {
  const payload = JSON.stringify(points ?? []);
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin=""/>
  <style>html,body,#map{margin:0;padding:0;height:100%;width:100%;}</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
<script>
(function(){
  var pts = ${payload};
  var map = L.map('map');
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);
  if (!pts || pts.length === 0) {
    map.setView([-19.92, -43.94], 11);
    return;
  }
  var ordered = pts.slice().reverse();
  var latlngs = ordered.map(function(p) { return [p.latitude, p.longitude]; });
  var bounds = L.latLngBounds(latlngs);
  try {
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 16, animate: false });
  } catch (e) {
    map.setView(latlngs[0], 14);
  }
  if (latlngs.length > 1) {
    L.polyline(latlngs, { color: '#2563eb', weight: 4, opacity: 0.88 }).addTo(map);
  }
  for (var i = 0; i < pts.length; i++) {
    var p = pts[i];
    var isNewest = i === 0;
    L.circleMarker([p.latitude, p.longitude], {
      radius: isNewest ? 11 : 6,
      color: isNewest ? '#b91c1c' : '#1d4ed8',
      fillColor: isNewest ? '#ef4444' : '#3b82f6',
      fillOpacity: 0.92,
      weight: 2
    }).addTo(map).bindPopup(isNewest ? 'Posição atual' : ('Ponto ' + (i + 1)));
  }
})();
</script>
</body>
</html>`;
}

function formatPointTime(at) {
  if (at == null || at === '') return '—';
  if (typeof at === 'number') {
    const sec = at > 1e12 ? Math.floor(at / 1000) : at;
    const m = moment.unix(sec);
    return m.isValid() ? m.format('DD/MM/YYYY HH:mm') : String(at);
  }
  const m = moment(String(at));
  return m.isValid() ? m.format('DD/MM/YYYY HH:mm') : String(at);
}

const SmartwatchLocationScreen = ({ route, navigation }) => {
  const initialGroupId = route.params?.groupId;
  const initialGroupName = route.params?.groupName;

  const [groupId, setGroupId] = useState(initialGroupId || null);
  const [groupName, setGroupName] = useState(initialGroupName || '');
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(!initialGroupId);
  const [loadingMap, setLoadingMap] = useState(!!initialGroupId);
  const [points, setPoints] = useState([]);
  const [meta, setMeta] = useState({
    hasSmartwatch: false,
    imei: null,
    message: '',
    thalamusOk: true,
  });

  const loadGroups = useCallback(async () => {
    setLoadingGroups(true);
    try {
      const res = await groupService.getMyGroups();
      if (res.success && Array.isArray(res.data)) {
        setGroups(res.data);
      } else {
        setGroups([]);
      }
    } finally {
      setLoadingGroups(false);
    }
  }, []);

  const loadLocations = useCallback(async (gid) => {
    if (!gid) return;
    setLoadingMap(true);
    try {
      const res = await deviceService.getGroupSmartwatchLocations(gid, 11);
      if (res.success && res.data) {
        const d = res.data;
        setMeta({
          hasSmartwatch: !!d.has_smartwatch,
          imei: d.imei || null,
          message: d.message || '',
          thalamusOk: d.ok !== false,
        });
        setPoints(Array.isArray(d.points) ? d.points : []);
      } else {
        setMeta({
          hasSmartwatch: false,
          imei: null,
          message: res.error || 'Erro ao carregar',
          thalamusOk: false,
        });
        setPoints([]);
      }
    } finally {
      setLoadingMap(false);
    }
  }, []);

  useEffect(() => {
    if (!groupId) {
      loadGroups();
    }
  }, [groupId, loadGroups]);

  useEffect(() => {
    if (groupId) {
      loadLocations(groupId);
    }
  }, [groupId, loadLocations]);

  const onSelectGroup = (g) => {
    setGroupId(g.id);
    setGroupName(g.name || '');
  };

  const onBack = () => {
    if (initialGroupId) {
      navigation.goBack();
      return;
    }
    if (groupId) {
      setGroupId(null);
      setGroupName('');
      setPoints([]);
      setMeta({ hasSmartwatch: false, imei: null, message: '', thalamusOk: true });
      loadGroups();
      return;
    }
    navigation.goBack();
  };

  const mapHtml = buildLeafletHtml(points);
  const listPoints = points.slice(0, 10);

  if (!groupId) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <ArrowBackIcon size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.title}>Localização</Text>
            <Text style={styles.subtitle}>Escolha o grupo do relógio</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
        {loadingGroups ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : groups.length === 0 ? (
          <View style={styles.centered}>
            <Ionicons name="people-outline" size={56} color={colors.gray300} />
            <Text style={styles.muted}>Nenhum grupo encontrado.</Text>
          </View>
        ) : (
          <FlatList
            data={groups}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listPad}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.groupRow} onPress={() => onSelectGroup(item)} activeOpacity={0.75}>
                <View style={styles.groupRowIcon}>
                  <Ionicons name="map-outline" size={24} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.groupRowName}>{item.name}</Text>
                  {item.accompanied_name ? (
                    <Text style={styles.groupRowSub}>{item.accompanied_name}</Text>
                  ) : null}
                </View>
                <Ionicons name="chevron-forward" size={22} color={colors.gray400} />
              </TouchableOpacity>
            )}
          />
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowBackIcon size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.title}>Localização</Text>
          <Text style={styles.subtitle}>{groupName}</Text>
          {meta.imei ? <Text style={styles.meta}>IMEI {meta.imei}</Text> : null}
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {!meta.hasSmartwatch ? (
        <View style={styles.centered}>
          <Ionicons name="location-outline" size={56} color={colors.gray300} />
          <Text style={styles.muted}>{meta.message || 'Sem relógio com IMEI neste grupo.'}</Text>
        </View>
      ) : loadingMap ? (
        <View style={[styles.mapWrap, styles.centered]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <View style={styles.mapWrap}>
            <WebView
              originWhitelist={['*']}
              source={{ html: mapHtml }}
              style={styles.webview}
              scrollEnabled={false}
              javaScriptEnabled
              domStorageEnabled
              setBuiltInZoomControls={false}
              {...(Platform.OS === 'android' ? { mixedContentMode: 'always' } : {})}
            />
          </View>
          {!meta.thalamusOk && meta.message ? (
            <Text style={styles.warn}>API Thalamus: {meta.message}</Text>
          ) : null}
          <Text style={styles.sectionLabel}>Últimos pontos (até 10)</Text>
          {listPoints.length === 0 ? (
            <Text style={styles.muted}>
              {
                'Nenhum ponto retornado. Padrão Thalamus: GET health/{imei}/locations (…/api/health/.../locations). Ajuste THALAMUS_SW_LOCATIONS_PATH se precisar.'
              }
            </Text>
          ) : (
            listPoints.map((p, idx) => (
              <View key={`${p.latitude}-${p.longitude}-${idx}`} style={styles.pointRow}>
                <View style={[styles.badge, idx === 0 && styles.badgeCurrent]}>
                  <Text style={[styles.badgeText, idx === 0 && styles.badgeTextCurrent]}>{idx === 0 ? 'Atual' : idx + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.coord}>
                    {p.latitude?.toFixed(5)}, {p.longitude?.toFixed(5)}
                  </Text>
                  <Text style={styles.time}>{formatPointTime(p.at)}</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerTitle: { flex: 1 },
  title: { fontSize: 18, fontWeight: '600', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textLight, marginTop: 2 },
  meta: { fontSize: 12, color: colors.textLight, marginTop: 4 },
  headerSpacer: { width: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  muted: { fontSize: 14, color: colors.textLight, textAlign: 'center', marginTop: 8 },
  listPad: { padding: 16, paddingBottom: 32 },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  groupRowIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary + '18',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupRowName: { fontSize: 16, fontWeight: '600', color: colors.text },
  groupRowSub: { fontSize: 13, color: colors.textLight, marginTop: 2 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  mapWrap: {
    height: 280,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.gray200,
  },
  webview: { flex: 1, backgroundColor: colors.gray200 },
  warn: {
    marginHorizontal: 16,
    marginTop: 10,
    fontSize: 13,
    color: colors.warning || '#b45309',
  },
  sectionLabel: {
    marginHorizontal: 16,
    marginTop: 18,
    marginBottom: 8,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.backgroundLight,
    marginRight: 12,
  },
  badgeCurrent: { backgroundColor: '#fee2e2' },
  badgeText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  badgeTextCurrent: { color: '#b91c1c' },
  coord: { fontSize: 14, fontWeight: '600', color: colors.text },
  time: { fontSize: 13, color: colors.textLight, marginTop: 4 },
});

export default SmartwatchLocationScreen;

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import colors from '../../constants/colors';
import { ArrowBackIcon, VideoCamIcon } from '../../components/CustomIcons';
import streamCamerasService from '../../services/streamCamerasService';

const CameraThumbnail = ({ streamApi, cameraId, refreshKey }) => {
  const [failed, setFailed] = useState(false);
  const uri = streamCamerasService.snapshotUrl(streamApi, cameraId, refreshKey);

  if (failed) {
    return (
      <View style={styles.thumbnailPlaceholder}>
        <Ionicons name="image-outline" size={28} color={colors.gray400} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={styles.thumbnail}
      resizeMode="cover"
      onError={() => setFailed(true)}
    />
  );
};

const CamerasListScreen = ({ route, navigation }) => {
  const { groupId, groupName } = route.params || {};
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(Date.now());

  const loadData = useCallback(async () => {
    const savedAgents = await streamCamerasService.listAgents();
    setAgents(savedAgents);
  }, []);

  const sections = useMemo(
    () =>
      agents.map((agent) => ({
        key: agent.stream_api,
        agent,
        title: agent.stream_api,
        data: agent.cameras || [],
      })),
    [agents]
  );

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setLoading(true);
        await loadData();
        setLoading(false);
      })();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    setRefreshKey(Date.now());
    await loadData();
    setRefreshing(false);
  };

  const openScanner = () => {
    navigation.navigate('ScanCameraQr', { groupId, groupName });
  };

  const openPlayer = (agent, camera) => {
    navigation.navigate('CameraPlayer', {
      groupId,
      groupName,
      streamApi: agent.stream_api,
      auth: agent.auth || streamCamerasService.DEFAULT_STREAM_AUTH,
      whepPublicUrl: agent.whep_public_url || null,
      cameraId: camera.id,
      cameraName: camera.nome,
    });
  };

  const confirmRemoveAgent = (agent) => {
    Alert.alert(
      'Remover agente',
      `Deseja remover o agente ${agent.stream_api}? As câmeras deste servidor deixarão de aparecer no app.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover agente',
          style: 'destructive',
          onPress: async () => {
            await streamCamerasService.removeAgent(agent.stream_api);
            await loadData();
          },
        },
      ]
    );
  };

  const renderSectionHeader = ({ section }) => (
    <View style={styles.agentSection}>
      <View style={styles.agentHeader}>
        <View style={styles.agentHeaderIcon}>
          <Ionicons name="server-outline" size={22} color={colors.primary} />
        </View>
        <View style={styles.agentHeaderBody}>
          <Text style={styles.agentTitle}>Agente de streaming</Text>
          <Text style={styles.agentUrl} numberOfLines={2}>
            {section.agent.stream_api}
          </Text>
          <Text style={styles.agentMeta}>
            {(section.data || []).length} câmera(s) disponíveis neste agente
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => confirmRemoveAgent(section.agent)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCamera = ({ item, section }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => openPlayer(section.agent, item)}
      activeOpacity={0.85}
    >
      <CameraThumbnail
        streamApi={section.agent.stream_api}
        cameraId={item.id}
        refreshKey={refreshKey}
      />
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{item.nome}</Text>
        <Text style={styles.cardSubtitle}>Câmera do agente · {item.id}</Text>
      </View>
      <Ionicons name="play-circle" size={32} color={colors.primary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowBackIcon size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Câmeras</Text>
          <Text style={styles.headerSubtitle}>
            {groupName ? `${groupName} · ` : ''}câmeras dos agentes vinculados
          </Text>
        </View>
        <TouchableOpacity onPress={openScanner} style={styles.addButton}>
          <Ionicons name="add" size={26} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={renderCamera}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={agents.length === 0 ? styles.emptyList : styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          stickySectionHeadersEnabled={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <VideoCamIcon size={64} color={colors.gray400} />
              <Text style={styles.emptyTitle}>Nenhum agente vinculado</Text>
              <Text style={styles.emptySub}>
                Escaneie o QR Code do agente de câmeras. As câmeras publicadas naquele
                servidor de streaming ficarão disponíveis aqui.
              </Text>
            </View>
          }
        />
      )}

      <View style={styles.linkBar}>
        <TouchableOpacity style={styles.linkBarButton} onPress={openScanner} activeOpacity={0.85}>
          <Ionicons name="qr-code-outline" size={22} color="#fff" />
          <Text style={styles.linkBarButtonText}>+ Vincular agente (QR Code)</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: { padding: 4, marginRight: 8 },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  headerSubtitle: { fontSize: 13, color: colors.textLight, marginTop: 2 },
  addButton: { padding: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingBottom: 100 },
  emptyList: { flexGrow: 1, paddingBottom: 100 },
  agentSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  agentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
  },
  agentHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  agentHeaderBody: { flex: 1, marginRight: 8 },
  agentTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  agentUrl: { fontSize: 14, color: colors.text, marginTop: 4 },
  agentMeta: { fontSize: 12, color: colors.textLight, marginTop: 4 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumbnail: {
    width: 72,
    height: 54,
    borderRadius: 8,
    backgroundColor: colors.gray200,
  },
  thumbnailPlaceholder: {
    width: 72,
    height: 54,
    borderRadius: 8,
    backgroundColor: colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1, marginHorizontal: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  cardSubtitle: { fontSize: 12, color: colors.textLight, marginTop: 4 },
  empty: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 24 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  linkBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
  },
  linkBarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  linkBarButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default CamerasListScreen;

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import { ArrowBackIcon, VideoCamIcon } from '../../components/CustomIcons';
import cameraService from '../../services/cameraService';

const CamerasListScreen = ({ route, navigation }) => {
  const { groupId, groupName, isAdmin = false } = route.params || {};
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [linkModalVisible, setLinkModalVisible] = useState(false);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [manualCameraId, setManualCameraId] = useState('');
  const [manualCameraName, setManualCameraName] = useState('');
  const [linking, setLinking] = useState(false);

  const loadCameras = useCallback(async () => {
    if (!groupId) return;
    const result = await cameraService.listGroupCameras(groupId);
    if (result.success) {
      setCameras(result.cameras);
    } else {
      Alert.alert(
        'Erro',
        result.error || 'Não foi possível carregar as câmeras'
      );
      setCameras(result.cameras || []);
    }
  }, [groupId]);

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      await loadCameras();
      setLoading(false);
    })();
  }, [loadCameras]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCameras();
    setRefreshing(false);
  };

  const openLinkModal = async () => {
    setLinkModalVisible(true);
    setLoadingAvailable(true);
    const result = await cameraService.listAvailableCameras(groupId);
    setLoadingAvailable(false);
    if (result.success) {
      setAvailableCameras(result.cameras.filter((c) => !c.linked));
    } else {
      setAvailableCameras([]);
    }
  };

  const handleLink = async (rtmpCameraId, name) => {
    if (!rtmpCameraId?.trim()) {
      Alert.alert('Atenção', 'Informe o ID da câmera');
      return;
    }
    setLinking(true);
    const result = await cameraService.linkCamera(groupId, {
      rtmp_camera_id: rtmpCameraId.trim(),
      name: name?.trim() || rtmpCameraId.trim(),
    });
    setLinking(false);
    if (result.success) {
      setLinkModalVisible(false);
      setManualCameraId('');
      setManualCameraName('');
      await loadCameras();
    } else {
      Alert.alert('Erro', result.error || 'Não foi possível vincular a câmera');
    }
  };

  const handleUnlink = (camera) => {
    Alert.alert(
      'Remover câmera',
      `Deseja remover "${camera.name}" deste grupo?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            const result = await cameraService.unlinkCamera(groupId, camera.id);
            if (result.success) {
              await loadCameras();
            } else {
              Alert.alert('Erro', result.error);
            }
          },
        },
      ]
    );
  };

  const openPlayer = (camera) => {
    navigation.navigate('CameraPlayer', {
      groupId,
      groupName,
      camera,
    });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => openPlayer(item)}
      activeOpacity={0.85}
    >
      <View style={styles.cardIcon}>
        <VideoCamIcon size={28} color={colors.primary} />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: item.connected ? colors.success : colors.gray400 },
            ]}
          />
          <Text style={styles.statusText}>
            {item.connected ? 'Online' : 'Offline'}
          </Text>
        </View>
        {item.last_error ? (
          <Text style={styles.errorText} numberOfLines={1}>
            {item.last_error}
          </Text>
        ) : null}
      </View>
      <Ionicons name="play-circle" size={32} color={colors.primary} />
      {isAdmin ? (
        <TouchableOpacity
          style={styles.unlinkBtn}
          onPress={() => handleUnlink(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      ) : null}
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
          <Text style={styles.headerSubtitle}>{groupName || 'Grupo'}</Text>
        </View>
        {isAdmin ? (
          <TouchableOpacity onPress={openLinkModal} style={styles.addButton}>
            <Ionicons name="add" size={26} color={colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={cameras}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={cameras.length === 0 ? styles.emptyList : styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <VideoCamIcon size={64} color={colors.gray400} />
              <Text style={styles.emptyTitle}>Nenhuma câmera vinculada</Text>
              <Text style={styles.emptySub}>
                {isAdmin
                  ? 'Toque em + para vincular uma câmera da sua rede local.'
                  : 'Peça ao administrador do grupo para vincular uma câmera.'}
              </Text>
            </View>
          }
        />
      )}

      <Modal visible={linkModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Vincular câmera</Text>
            <Text style={styles.modalHint}>
              Escolha uma câmera do servidor RTMP ou informe o ID manualmente.
            </Text>

            {loadingAvailable ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
            ) : (
              availableCameras.slice(0, 8).map((cam) => (
                <TouchableOpacity
                  key={cam.rtmp_camera_id}
                  style={styles.availableItem}
                  onPress={() => handleLink(cam.rtmp_camera_id, cam.name)}
                  disabled={linking}
                >
                  <Text style={styles.availableName}>{cam.name}</Text>
                  <Text style={styles.availableId}>{cam.rtmp_camera_id}</Text>
                </TouchableOpacity>
              ))
            )}

            <TextInput
              style={styles.input}
              placeholder="ID da câmera (ex: camerad8365fc05f391)"
              value={manualCameraId}
              onChangeText={setManualCameraId}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Nome exibido (opcional)"
              value={manualCameraName}
              onChangeText={setManualCameraName}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setLinkModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirm}
                onPress={() => handleLink(manualCameraId, manualCameraName)}
                disabled={linking}
              >
                {linking ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmText}>Vincular</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  list: { padding: 16, paddingBottom: 32 },
  emptyList: { flexGrow: 1, padding: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 13, color: colors.textLight },
  errorText: { fontSize: 11, color: colors.error, marginTop: 4 },
  unlinkBtn: { marginLeft: 8, padding: 4 },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.backgroundLight,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: '85%',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  modalHint: { fontSize: 13, color: colors.textLight, marginTop: 8, marginBottom: 12 },
  availableItem: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.background,
    marginBottom: 8,
  },
  availableName: { fontSize: 15, fontWeight: '600', color: colors.text },
  availableId: { fontSize: 12, color: colors.textLight, marginTop: 2 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
    fontSize: 15,
    color: colors.text,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 12,
  },
  modalCancel: { paddingVertical: 12, paddingHorizontal: 16 },
  modalCancelText: { color: colors.textLight, fontSize: 16 },
  modalConfirm: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  modalConfirmText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});

export default CamerasListScreen;

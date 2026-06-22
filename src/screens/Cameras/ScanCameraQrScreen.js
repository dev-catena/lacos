import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import { ArrowBackIcon } from '../../components/CustomIcons';
import streamCamerasService from '../../services/streamCamerasService';

const ScanCameraQrScreen = ({ route, navigation }) => {
  const { groupId, groupName } = route.params || {};
  const [permission, requestPermission] = useCameraPermissions();
  const [processing, setProcessing] = useState(false);
  const [scanned, setScanned] = useState(false);

  const handleBarcodeScanned = useCallback(
    async ({ data }) => {
      if (processing || scanned || !data) return;

      setProcessing(true);
      setScanned(true);

      try {
        const payload = streamCamerasService.parseQrPayload(data);
        const result = await streamCamerasService.saveAgent(payload);

        if (result.duplicate) {
          Alert.alert(
            'Agente já vinculado',
            'Este agente já está salvo na sua conta. As câmeras continuam disponíveis.',
            [
              {
                text: 'Ver câmeras',
                onPress: () =>
                  navigation.replace('Cameras', {
                    groupId,
                    groupName,
                  }),
              },
            ]
          );
          return;
        }

        const title = result.updated ? 'Agente atualizado' : 'Agente vinculado';
        const message = result.updated
          ? 'A lista de câmeras deste agente foi atualizada a partir do QR Code.'
          : 'O agente foi vinculado à sua conta. As câmeras do servidor de streaming já estão disponíveis.';

        Alert.alert(title, message, [
          {
            text: 'Ver câmeras',
            onPress: () =>
              navigation.replace('Cameras', {
                groupId,
                groupName,
              }),
          },
        ]);
      } catch (error) {
        const message =
          error?.message === 'QR inválido'
            ? 'QR inválido. Escaneie o código fornecido pelo agente de câmeras.'
            : error?.message || 'Não foi possível reconhecer este QR Code.';

        Alert.alert('Não reconhecido', message, [
          {
            text: 'Tentar novamente',
            onPress: () => {
              setScanned(false);
              setProcessing(false);
            },
          },
        ]);
      } finally {
        setProcessing(false);
      }
    },
    [groupId, groupName, navigation, processing, scanned]
  );

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowBackIcon size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Vincular câmeras</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.permissionBox}>
          <Ionicons name="camera-outline" size={64} color={colors.gray400} />
          <Text style={styles.permissionTitle}>Permissão de câmera necessária</Text>
          <Text style={styles.permissionText}>
            Para escanear o QR Code do agente de câmeras, permita o acesso à câmera do celular.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Permitir câmera</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />

      <SafeAreaView style={styles.overlay} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.headerDark}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowBackIcon size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitleDark}>Escanear QR do agente</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.scanArea}>
          <View style={styles.scanFrame} />
          <Text style={styles.hint}>
            Aponte para o QR Code do agente de câmeras
          </Text>
        </View>

        {processing ? (
          <View style={styles.processingBox}>
            <ActivityIndicator color="#fff" />
            <Text style={styles.processingText}>Vinculando agente...</Text>
          </View>
        ) : null}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  overlay: { flex: 1, justifyContent: 'space-between' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  headerDark: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  backButton: { padding: 4, marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.text },
  headerTitleDark: { flex: 1, fontSize: 18, fontWeight: '700', color: '#fff' },
  scanArea: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  scanFrame: {
    width: 260,
    height: 260,
    borderWidth: 3,
    borderColor: '#fff',
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  hint: {
    marginTop: 24,
    color: '#fff',
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  processingBox: {
    alignItems: 'center',
    paddingBottom: 32,
    gap: 8,
  },
  processingText: { color: '#fff', fontSize: 14 },
  permissionBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  permissionButton: {
    marginTop: 20,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});

export default ScanCameraQrScreen;

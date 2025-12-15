import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../constants/colors';
import bleService from '../../services/bleService';
import postureClassifier from '../../services/postureClassifier';
import fallSensorService from '../../services/fallSensorService';

const TARGET_MAC = '24E4B9E48D8F'; // MAC do sensor WT901BLE67

const FallSensorScreen = ({ route, navigation }) => {
  const { groupId, groupName } = route.params || {};
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [sensorMac, setSensorMac] = useState(null);
  const [currentPosture, setCurrentPosture] = useState(null);
  const [postureHistory, setPostureHistory] = useState([]);
  const [fallAlerts, setFallAlerts] = useState([]);
  const [lastSaved, setLastSaved] = useState(null);

  const dataIntervalRef = useRef(null);
  const saveIntervalRef = useRef(null);
  const previousMagnitudeRef = useRef(null);

  useEffect(() => {
    loadFallAlerts();
    loadPostureHistory();

    return () => {
      // Cleanup: desconectar e limpar intervalos
      if (dataIntervalRef.current) {
        clearInterval(dataIntervalRef.current);
      }
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
      if (isConnected) {
        bleService.disconnect();
      }
    };
  }, []);

  const loadFallAlerts = async () => {
    try {
      const result = await fallSensorService.getFallAlerts(groupId, 24);
      if (result.success) {
        setFallAlerts(result.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
    }
  };

  const loadPostureHistory = async () => {
    try {
      const result = await fallSensorService.getHistory(groupId, { limit: 10 });
      if (result.success) {
        setPostureHistory(result.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const handleConnect = async () => {
    try {
      setConnecting(true);
      setLoading(true);

      // Inicializar BLE primeiro
      const initResult = await bleService.initialize();
      if (!initResult.success) {
        if (initResult.requiresRebuild) {
          Alert.alert(
            'Módulo BLE não disponível',
            'O app precisa ser recompilado para usar o sensor de queda.\n\n' +
            'Execute no terminal:\n' +
            'npm run android\n\n' +
            'Ou se estiver usando Expo:\n' +
            'npx expo run:android',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('Erro', initResult.error || 'Não foi possível inicializar o Bluetooth');
        }
        setConnecting(false);
        setLoading(false);
        return;
      }

      // Escanear e conectar ao sensor
      const scanResult = await bleService.scanForDevices(TARGET_MAC, 10000);
      
      if (!scanResult.success) {
        Alert.alert('Erro', scanResult.error || 'Não foi possível escanear dispositivos');
        setConnecting(false);
        setLoading(false);
        return;
      }

      const device = scanResult.device || (scanResult.devices && scanResult.devices[0]);
      
      if (!device) {
        Alert.alert('Sensor não encontrado', 'Certifique-se de que o sensor está ligado e próximo ao dispositivo.');
        return;
      }

      // Conectar ao dispositivo
      const connectResult = await bleService.connectToDevice(device.id);
      
      if (!connectResult.success) {
        Alert.alert('Erro', connectResult.error || 'Não foi possível conectar ao sensor');
        return;
      }

      setIsConnected(true);
      setSensorMac(connectResult.macAddress || device.id);

      // Assinar notificações de dados do sensor
      // O bleService tentará automaticamente UUIDs padrão e alternativos
      await bleService.subscribeToNotifications(null, null, handleSensorData);

      // Iniciar leitura periódica de dados (fallback se notificações não funcionarem)
      dataIntervalRef.current = setInterval(async () => {
        const readResult = await bleService.readSensorData();
        if (readResult.success) {
          handleSensorData(readResult);
        }
      }, 100); // Ler a cada 100ms

      // Salvar dados no backend a cada 5 segundos
      saveIntervalRef.current = setInterval(() => {
        if (currentPosture) {
          saveCurrentPosture();
        }
      }, 5000);

      Alert.alert('Conectado!', 'Sensor conectado com sucesso. Coloque o sensor no cinto.');
    } catch (error) {
      console.error('Erro ao conectar:', error);
      Alert.alert('Erro', 'Não foi possível conectar ao sensor');
    } finally {
      setConnecting(false);
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      if (dataIntervalRef.current) {
        clearInterval(dataIntervalRef.current);
        dataIntervalRef.current = null;
      }
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
        saveIntervalRef.current = null;
      }

      await bleService.disconnect();
      setIsConnected(false);
      setSensorMac(null);
      setCurrentPosture(null);
      previousMagnitudeRef.current = null;
    } catch (error) {
      console.error('Erro ao desconectar:', error);
    }
  };

  const handleSensorData = (result) => {
    if (!result.success || !result.data) return;

    const { acceleration_x, acceleration_y, acceleration_z, gyro_x, gyro_y, gyro_z } = result.data;

    // Classificar postura
    const classification = postureClassifier.classifyPosture(
      acceleration_x,
      acceleration_y,
      acceleration_z,
      gyro_x,
      gyro_y,
      gyro_z,
      previousMagnitudeRef.current
    );

    previousMagnitudeRef.current = classification.magnitude;

    const postureData = {
      ...classification,
      acceleration_x,
      acceleration_y,
      acceleration_z,
      gyro_x,
      gyro_y,
      gyro_z,
      timestamp: new Date().toISOString(),
    };

    setCurrentPosture(postureData);

    // Se queda detectada, adicionar alerta
    if (classification.posture === 'fall') {
      Alert.alert(
        '⚠️ Queda Detectada!',
        'Uma queda foi detectada. Verifique se a pessoa está bem.',
        [{ text: 'OK' }]
      );
      loadFallAlerts();
    }

    // Adicionar ao histórico local
    setPostureHistory((prev) => [postureData, ...prev].slice(0, 20));
  };

  const saveCurrentPosture = async () => {
    if (!currentPosture) return;

    try {
      const result = await fallSensorService.saveSensorData(groupId, {
        sensor_mac: sensorMac,
        posture: currentPosture.posture,
        acceleration_x: currentPosture.acceleration_x,
        acceleration_y: currentPosture.acceleration_y,
        acceleration_z: currentPosture.acceleration_z,
        gyro_x: currentPosture.gyro_x,
        gyro_y: currentPosture.gyro_y,
        gyro_z: currentPosture.gyro_z,
        magnitude: currentPosture.magnitude,
        is_fall_detected: currentPosture.posture === 'fall',
        confidence: currentPosture.confidence * 100, // Converter para porcentagem
        sensor_timestamp: currentPosture.timestamp,
      });

      if (result.success) {
        setLastSaved(new Date());
      }
    } catch (error) {
      console.error('Erro ao salvar postura:', error);
    }
  };

  const getPostureColor = (posture) => {
    const colorsMap = {
      'standing': colors.success,
      'sitting': colors.info,
      'lying_ventral': colors.warning,
      'lying_dorsal': colors.warning,
      'lying_lateral_right': colors.warning,
      'lying_lateral_left': colors.warning,
      'fall': '#FF0000',
    };
    return colorsMap[posture] || colors.text;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? insets.top + 16 : 16 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Sensor de Queda</Text>
          {groupName && (
            <Text style={styles.headerSubtitle}>{groupName}</Text>
          )}
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Status de Conexão */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={[styles.statusIndicator, { backgroundColor: isConnected ? colors.success : colors.gray400 }]} />
            <Text style={styles.statusText}>
              {isConnected ? 'Conectado' : 'Desconectado'}
            </Text>
          </View>
          {sensorMac && (
            <Text style={styles.macText}>MAC: {sensorMac}</Text>
          )}
        </View>

        {/* Botão Conectar/Desconectar */}
        {!isConnected ? (
          <TouchableOpacity
            style={[styles.connectButton, connecting && styles.connectButtonDisabled]}
            onPress={handleConnect}
            disabled={connecting}
          >
            {connecting ? (
              <>
                <ActivityIndicator size="small" color={colors.textWhite} />
                <Text style={styles.connectButtonText}>Conectando...</Text>
              </>
            ) : (
              <>
                <Ionicons name="bluetooth" size={24} color={colors.textWhite} />
                <Text style={styles.connectButtonText}>Conectar ao Sensor</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.disconnectButton}
            onPress={handleDisconnect}
          >
            <Ionicons name="close-circle" size={24} color={colors.textWhite} />
            <Text style={styles.disconnectButtonText}>Desconectar</Text>
          </TouchableOpacity>
        )}

        {/* Instrução */}
        {isConnected && (
          <View style={styles.instructionCard}>
            <Ionicons name="information-circle" size={24} color={colors.info} />
            <Text style={styles.instructionText}>
              Coloque o sensor no cinto para monitoramento contínuo.
            </Text>
          </View>
        )}

        {/* Postura Atual */}
        {currentPosture && (
          <View style={styles.postureCard}>
            <Text style={styles.postureLabel}>Postura Atual</Text>
            <View style={[styles.postureBadge, { backgroundColor: getPostureColor(currentPosture.posture) + '20' }]}>
              <Text style={[styles.postureText, { color: getPostureColor(currentPosture.posture) }]}>
                {postureClassifier.getPostureName(currentPosture.posture)}
              </Text>
            </View>
            {currentPosture.confidence && (
              <Text style={styles.confidenceText}>
                Confiança: {(currentPosture.confidence * 100).toFixed(0)}%
              </Text>
            )}
            {lastSaved && (
              <Text style={styles.lastSavedText}>
                Último salvamento: {new Date(lastSaved).toLocaleTimeString()}
              </Text>
            )}
          </View>
        )}

        {/* Alertas de Queda */}
        {fallAlerts.length > 0 && (
          <View style={styles.alertsCard}>
            <View style={styles.alertsHeader}>
              <Ionicons name="warning" size={24} color="#FF0000" />
              <Text style={styles.alertsTitle}>Alertas de Queda ({fallAlerts.length})</Text>
            </View>
            {fallAlerts.slice(0, 5).map((alert, index) => (
              <View key={index} style={styles.alertItem}>
                <Text style={styles.alertTime}>
                  {new Date(alert.created_at).toLocaleString()}
                </Text>
                <Text style={styles.alertText}>Queda detectada</Text>
              </View>
            ))}
          </View>
        )}

        {/* Histórico de Posturas */}
        {postureHistory.length > 0 && (
          <View style={styles.historyCard}>
            <Text style={styles.historyTitle}>Mudanças Recentes</Text>
            {postureHistory.slice(0, 10).map((item, index) => (
              <View key={index} style={styles.historyItem}>
                <View style={[styles.historyIndicator, { backgroundColor: getPostureColor(item.posture) }]} />
                <View style={styles.historyContent}>
                  <Text style={styles.historyPosture}>
                    {postureClassifier.getPostureName(item.posture)}
                  </Text>
                  <Text style={styles.historyTime}>
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="help-circle" size={24} color={colors.info} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Como usar</Text>
            <Text style={styles.infoText}>
              1. Conecte o sensor via Bluetooth{'\n'}
              2. Coloque o sensor no cinto{'\n'}
              3. O sistema monitorará automaticamente a postura{'\n'}
              4. Alertas serão exibidos em caso de queda
            </Text>
          </View>
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textLight,
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    padding: 20,
  },
  statusCard: {
    backgroundColor: colors.backgroundLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  macText: {
    fontSize: 12,
    color: colors.textLight,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  connectButtonDisabled: {
    opacity: 0.6,
  },
  connectButtonText: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: '600',
  },
  disconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error || '#FF0000',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  disconnectButtonText: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: '600',
  },
  instructionCard: {
    flexDirection: 'row',
    backgroundColor: colors.info + '10',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.info + '20',
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  postureCard: {
    backgroundColor: colors.backgroundLight,
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  postureLabel: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 12,
  },
  postureBadge: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginBottom: 8,
  },
  postureText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  confidenceText: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
  },
  lastSavedText: {
    fontSize: 10,
    color: colors.textLight,
    marginTop: 8,
  },
  alertsCard: {
    backgroundColor: '#FFEBEE',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  alertsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  alertsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D32F2F',
  },
  alertItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FFCDD2',
  },
  alertTime: {
    fontSize: 12,
    color: colors.textLight,
  },
  alertText: {
    fontSize: 14,
    color: '#D32F2F',
    fontWeight: '500',
  },
  historyCard: {
    backgroundColor: colors.backgroundLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyPosture: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  historyTime: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.info + '10',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.info + '20',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: colors.textLight,
    lineHeight: 18,
  },
});

export default FallSensorScreen;


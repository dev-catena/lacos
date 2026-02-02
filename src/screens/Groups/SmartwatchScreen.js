import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../constants/colors';
import { ArrowBackIcon, AddIcon, CloseIcon } from '../../components/CustomIcons';
import { Ionicons } from '@expo/vector-icons';
import deviceService from '../../services/deviceService';
import SafeIcon from '../../components/SafeIcon';

const SmartwatchScreen = ({ route, navigation }) => {
  const { groupId, groupName } = route.params || {};
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    nickname: '',
    type: 'smartwatch',
    identifier: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadDevices();
  }, [groupId]);

  const loadDevices = async () => {
    try {
      setLoading(true);
      const result = await deviceService.getGroupDevices(groupId);
      if (result.success) {
        setDevices(result.data || []);
      } else {
        Alert.alert('Erro', result.error || 'Erro ao carregar dispositivos');
      }
    } catch (error) {
      console.error('Erro ao carregar dispositivos:', error);
      Alert.alert('Erro', 'Erro ao carregar dispositivos');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDevice = () => {
    setFormData({
      nickname: '',
      type: 'smartwatch',
      identifier: '',
    });
    setFormErrors({});
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setFormData({
      nickname: '',
      type: 'smartwatch',
      identifier: '',
    });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.nickname.trim()) {
      errors.nickname = 'Apelido é obrigatório';
    }
    
    if (!formData.type) {
      errors.type = 'Tipo é obrigatório';
    }
    
    if (!formData.identifier.trim()) {
      errors.identifier = 'Identificador é obrigatório';
    } else if (!/^\d+$/.test(formData.identifier.trim())) {
      errors.identifier = 'Identificador deve ser um número';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      const result = await deviceService.createDevice(groupId, {
        nickname: formData.nickname.trim(),
        type: formData.type,
        identifier: formData.identifier.trim(),
      });

      if (result.success) {
        Alert.alert('Sucesso', 'Dispositivo cadastrado com sucesso!');
        handleCloseModal();
        await loadDevices();
      } else {
        Alert.alert('Erro', result.error || 'Erro ao cadastrar dispositivo');
      }
    } catch (error) {
      console.error('Erro ao cadastrar dispositivo:', error);
      Alert.alert('Erro', 'Erro ao cadastrar dispositivo');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDevice = async (deviceId) => {
    const device = devices.find(d => d.id === deviceId);
    const deviceName = device?.nickname || 'este dispositivo';
    
    Alert.alert(
      'Excluir Dispositivo',
      `Tem certeza que deseja excluir ${deviceName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deviceService.deleteDevice(groupId, deviceId);
              if (result.success) {
                Alert.alert('Sucesso', 'Dispositivo excluído com sucesso!');
                await loadDevices();
              } else {
                Alert.alert('Erro', result.error || 'Erro ao excluir dispositivo');
              }
            } catch (error) {
              console.error('Erro ao excluir dispositivo:', error);
              Alert.alert('Erro', 'Erro ao excluir dispositivo');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getTypeLabel = (type) => {
    const labels = {
      smartwatch: 'Smartwatch',
      sensor: 'Sensor',
    };
    return labels[type] || type;
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]} edges={["top", "left", "right"]}>
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
          <Text style={styles.title}>Smartwatch</Text>
          <Text style={styles.subtitle}>{groupName}</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddDevice}
        >
          <AddIcon size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Carregando...</Text>
          </View>
        ) : devices.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="watch-outline" size={64} color={colors.gray300} />
            <Text style={styles.emptyTitle}>Nenhum dispositivo cadastrado</Text>
            <Text style={styles.emptyText}>
              Toque no botão "+" acima para cadastrar um dispositivo.
            </Text>
          </View>
        ) : (
          <View style={styles.devicesList}>
            {devices.map((device) => (
              <View key={device.id} style={styles.deviceCard}>
                <View style={styles.deviceHeader}>
                  <View style={styles.deviceIconContainer}>
                    <Ionicons name="watch-outline" size={32} color={colors.primary} />
                  </View>
                  <View style={styles.deviceInfo}>
                    <Text style={styles.deviceName}>{device.nickname}</Text>
                    <View style={styles.deviceMeta}>
                      <View style={[styles.typeBadge, device.type === 'smartwatch' ? styles.typeSmartwatch : styles.typeSensor]}>
                        <Text style={styles.typeBadgeText}>{getTypeLabel(device.type)}</Text>
                      </View>
                      <Text style={styles.deviceIdentifier}>ID: {device.identifier}</Text>
                    </View>
                    <Text style={styles.deviceDate}>Cadastrado em {formatDate(device.created_at)}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteDevice(device.id)}
                >
                  <SafeIcon name="trash" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal de Adicionar Dispositivo */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cadastrar Dispositivo</Text>
              <TouchableOpacity onPress={handleCloseModal} style={styles.modalCloseButton}>
                <CloseIcon size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Apelido *</Text>
                <TextInput
                  style={[styles.input, formErrors.nickname && styles.inputError]}
                  value={formData.nickname}
                  onChangeText={(text) => setFormData({ ...formData, nickname: text })}
                  placeholder="Ex: Smartwatch João"
                  placeholderTextColor={colors.gray400}
                />
                {formErrors.nickname && (
                  <Text style={styles.errorText}>{formErrors.nickname}</Text>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Tipo *</Text>
                <View style={styles.typeButtons}>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      formData.type === 'smartwatch' && styles.typeButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, type: 'smartwatch' })}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        formData.type === 'smartwatch' && styles.typeButtonTextActive,
                      ]}
                    >
                      Smartwatch
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      formData.type === 'sensor' && styles.typeButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, type: 'sensor' })}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        formData.type === 'sensor' && styles.typeButtonTextActive,
                      ]}
                    >
                      Sensor
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Identificador *</Text>
                <TextInput
                  style={[styles.input, formErrors.identifier && styles.inputError]}
                  value={formData.identifier}
                  onChangeText={(text) => setFormData({ ...formData, identifier: text })}
                  placeholder="Número único do dispositivo"
                  placeholderTextColor={colors.gray400}
                  keyboardType="numeric"
                />
                <Text style={styles.hintText}>
                  Número que será usado para vincular leituras automáticas a este dispositivo.
                </Text>
                {formErrors.identifier && (
                  <Text style={styles.errorText}>{formErrors.identifier}</Text>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCloseModal}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton, saving && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.submitButtonText}>Salvar</Text>
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
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    flex: 1,
    marginLeft: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray600,
    marginTop: 2,
  },
  addButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.gray600,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray600,
    textAlign: 'center',
    lineHeight: 24,
  },
  devicesList: {
    gap: 12,
  },
  deviceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deviceIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  deviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeSmartwatch: {
    backgroundColor: '#DBEAFE',
  },
  typeSensor: {
    backgroundColor: '#DCFCE7',
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  deviceIdentifier: {
    fontSize: 12,
    color: colors.gray600,
    fontFamily: 'monospace',
  },
  deviceDate: {
    fontSize: 12,
    color: colors.gray500,
  },
  deleteButton: {
    padding: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: 'white',
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
  },
  hintText: {
    fontSize: 12,
    color: colors.gray500,
    marginTop: 4,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  typeButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '20',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray600,
  },
  typeButtonTextActive: {
    color: colors.primary,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.gray200,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  submitButton: {
    backgroundColor: colors.primary,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default SmartwatchScreen;

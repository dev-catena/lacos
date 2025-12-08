import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';

const DoctorVideoCallScreen = ({ route, navigation }) => {
  const { appointment, patientInfo } = route.params || {};
  const [isCallActive, setIsCallActive] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [prescriptionType, setPrescriptionType] = useState(null);

  useEffect(() => {
    // Simular início da chamada
    console.log('📹 Iniciando chamada de vídeo com paciente:', patientInfo?.name);
    
    return () => {
      // Cleanup ao sair da tela
      console.log('📹 Encerrando chamada de vídeo');
    };
  }, []);

  const handleEndCall = () => {
    Alert.alert(
      'Encerrar Consulta',
      'Tem certeza que deseja encerrar a consulta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Encerrar',
          style: 'destructive',
          onPress: () => {
            setIsCallActive(false);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleToggleVideo = () => {
    setIsVideoOff(!isVideoOff);
  };

  const handlePrescription = (type) => {
    setPrescriptionType(type);
    setShowPrescriptionModal(true);
  };

  const renderPrescriptionModal = () => {
    const typeLabels = {
      medication: 'Prescrição de Medicamentos',
      exam: 'Solicitação de Exames',
      conduct: 'Outras Condutas',
    };

    return (
      <Modal
        visible={showPrescriptionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPrescriptionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {typeLabels[prescriptionType] || 'Prescrição'}
              </Text>
              <TouchableOpacity
                onPress={() => setShowPrescriptionModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {prescriptionType === 'medication' && (
                <View>
                  <Text style={styles.modalSubtitle}>Medicamentos</Text>
                  <Text style={styles.modalText}>
                    Aqui você pode adicionar medicamentos para prescrever ao paciente.
                  </Text>
                  {/* TODO: Implementar formulário de prescrição de medicamentos */}
                </View>
              )}

              {prescriptionType === 'exam' && (
                <View>
                  <Text style={styles.modalSubtitle}>Exames</Text>
                  <Text style={styles.modalText}>
                    Aqui você pode solicitar exames para o paciente.
                  </Text>
                  {/* TODO: Implementar formulário de solicitação de exames */}
                </View>
              )}

              {prescriptionType === 'conduct' && (
                <View>
                  <Text style={styles.modalSubtitle}>Outras Condutas</Text>
                  <Text style={styles.modalText}>
                    Aqui você pode registrar outras condutas médicas.
                  </Text>
                  {/* TODO: Implementar formulário de outras condutas */}
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowPrescriptionModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={() => {
                  // TODO: Salvar prescrição
                  Alert.alert('Sucesso', 'Prescrição salva com sucesso!');
                  setShowPrescriptionModal(false);
                }}
              >
                <Text style={styles.modalSaveText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  if (!isCallActive) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <StatusBar style="light" />
      
      {/* Área de Vídeo */}
      <View style={styles.videoContainer}>
        {/* Vídeo do Paciente (tela principal) */}
        <View style={styles.mainVideo}>
          {isVideoOff ? (
            <View style={styles.videoPlaceholder}>
              <Ionicons name="person" size={80} color={colors.textLight} />
              <Text style={styles.videoPlaceholderText}>
                {patientInfo?.name || 'Paciente'}
              </Text>
            </View>
          ) : (
            <View style={styles.videoPlaceholder}>
              <Ionicons name="videocam" size={80} color={colors.primary} />
              <Text style={styles.videoPlaceholderText}>Vídeo do Paciente</Text>
              <Text style={styles.videoNote}>
                (Integração com serviço de vídeo será implementada)
              </Text>
            </View>
          )}
        </View>

        {/* Vídeo do Médico (picture-in-picture) */}
        <View style={styles.pipVideo}>
          {isVideoOff ? (
            <View style={styles.pipPlaceholder}>
              <Ionicons name="person" size={24} color={colors.textLight} />
            </View>
          ) : (
            <View style={styles.pipPlaceholder}>
              <Ionicons name="videocam" size={24} color={colors.primary} />
            </View>
          )}
        </View>

        {/* Informações do Paciente */}
        <View style={styles.patientInfoOverlay}>
          <Text style={styles.patientName}>{patientInfo?.name || 'Paciente'}</Text>
          <Text style={styles.callDuration}>00:00</Text>
        </View>
      </View>

      {/* Controles da Chamada */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.controlButton, isMuted && styles.controlButtonActive]}
          onPress={handleToggleMute}
        >
          <Ionicons
            name={isMuted ? 'mic-off' : 'mic'}
            size={24}
            color={isMuted ? '#FFFFFF' : colors.text}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, isVideoOff && styles.controlButtonActive]}
          onPress={handleToggleVideo}
        >
          <Ionicons
            name={isVideoOff ? 'videocam-off' : 'videocam'}
            size={24}
            color={isVideoOff ? '#FFFFFF' : colors.text}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.prescriptionButton]}
          onPress={() => handlePrescription('medication')}
        >
          <Ionicons name="medical" size={24} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.prescriptionButton]}
          onPress={() => handlePrescription('exam')}
        >
          <Ionicons name="document-text" size={24} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.prescriptionButton]}
          onPress={() => handlePrescription('conduct')}
        >
          <Ionicons name="clipboard" size={24} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.endCallButton]}
          onPress={handleEndCall}
        >
          <Ionicons name="call" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Modal de Prescrição */}
      {renderPrescriptionModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  mainVideo: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlaceholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textLight,
    marginTop: 12,
  },
  videoNote: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  pipVideo: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 120,
    height: 160,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  pipPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientInfoOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  callDuration: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    gap: 12,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonActive: {
    backgroundColor: colors.error,
  },
  prescriptionButton: {
    backgroundColor: colors.primary + '30',
  },
  endCallButton: {
    backgroundColor: colors.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  modalText: {
    fontSize: 14,
    color: colors.textLight,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.backgroundLight,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default DoctorVideoCallScreen;


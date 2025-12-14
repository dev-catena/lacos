import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import colors from '../../constants/colors';
import videoCallService from '../../services/videoCallService';
import { useAuth } from '../../contexts/AuthContext';
// Importar RTCView do Agora.io (será disponível após build)
// import { RtcSurfaceView, RtcSurfaceViewMode } from 'react-native-agora';

const DoctorVideoCallScreen = ({ route, navigation }) => {
  const { appointment, patientInfo } = route.params || {};
  const { user } = useAuth();
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [prescriptionType, setPrescriptionType] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [callError, setCallError] = useState(null);
  const [remoteUid, setRemoteUid] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [prescriptionText, setPrescriptionText] = useState('');
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const chatFlatListRef = useRef(null);

  useEffect(() => {
    initializeCall();
    
    return () => {
      // Cleanup ao sair da tela
      endCall();
    };
  }, []);

  const initializeCall = async () => {
    try {
      setIsInitializing(true);
      setCallError(null);

      // Inicializar serviço de vídeo
      const initResult = await videoCallService.initialize();
      if (!initResult.success) {
        throw new Error(initResult.error || 'Erro ao inicializar serviço de vídeo');
      }

      // Modo mock (Expo Go) - mostrar aviso
      if (initResult.mock) {
        console.log('⚠️ Modo MOCK: Vídeo não está funcionando (Expo Go). Use expo-dev-client para vídeo real.');
      }

      // Gerar nome do canal baseado no appointment
      const channelName = `consulta-${appointment?.id || Date.now()}`;
      const userId = appointment?.doctor_id || 1; // ID do médico

      // Entrar no canal
      const joinResult = await videoCallService.joinChannel(channelName, userId);
      if (!joinResult.success) {
        throw new Error(joinResult.error || 'Erro ao entrar no canal');
      }

      setIsCallActive(true);
      setIsInitializing(false);
      console.log('✅ Chamada de vídeo iniciada com sucesso' + (joinResult.mock ? ' (MODO MOCK)' : ''));
    } catch (error) {
      console.error('❌ Erro ao inicializar chamada:', error);
      setCallError(error.message);
      setIsInitializing(false);
      Alert.alert(
        'Erro ao Iniciar Chamada',
        error.message || 'Não foi possível iniciar a chamada de vídeo. Verifique sua conexão e tente novamente.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  };

  const endCall = async () => {
    try {
      await videoCallService.leaveChannel();
      await videoCallService.destroy();
      setIsCallActive(false);
      console.log('✅ Chamada encerrada');
    } catch (error) {
      console.error('❌ Erro ao encerrar chamada:', error);
    }
  };

  const handleEndCall = () => {
    Alert.alert(
      'Encerrar Consulta',
      'Tem certeza que deseja encerrar a consulta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Encerrar',
          style: 'destructive',
          onPress: async () => {
            await endCall();
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleToggleMute = async () => {
    try {
      const newMutedState = !isMuted;
      const result = await videoCallService.toggleMute(newMutedState);
      if (result.success) {
        setIsMuted(newMutedState);
      } else {
        Alert.alert('Erro', 'Não foi possível alterar o áudio');
      }
    } catch (error) {
      console.error('Erro ao alternar mute:', error);
      Alert.alert('Erro', 'Não foi possível alterar o áudio');
    }
  };

  const handleToggleVideo = async () => {
    try {
      const newVideoState = !isVideoOff;
      const result = await videoCallService.toggleVideo(!newVideoState);
      if (result.success) {
        setIsVideoOff(newVideoState);
      } else {
        Alert.alert('Erro', 'Não foi possível alterar o vídeo');
      }
    } catch (error) {
      console.error('Erro ao alternar vídeo:', error);
      Alert.alert('Erro', 'Não foi possível alterar o vídeo');
    }
  };

  const handlePrescription = (type) => {
    setPrescriptionType(type);
    setPrescriptionText('');
    setShowPrescriptionModal(true);
  };

  // Funções do Chat
  const handleSendMessage = async () => {
    if (!messageText.trim() && !sendingMessage) return;

    const newMessage = {
      id: Date.now().toString(),
      text: messageText.trim(),
      senderId: user?.id,
      senderName: user?.name || 'Você',
      type: 'text',
      timestamp: new Date().toISOString(),
      isOwn: true,
    };

    setChatMessages(prev => [...prev, newMessage]);
    setMessageText('');
    setSendingMessage(true);

    // TODO: Enviar mensagem para o backend/WebSocket
    setTimeout(() => {
      setSendingMessage(false);
      if (chatFlatListRef.current) {
        chatFlatListRef.current.scrollToEnd({ animated: true });
      }
    }, 500);
  };

  const handleSendPrescription = (type, text) => {
    const typeLabels = {
      medication: 'Receita Médica',
      exam: 'Solicitação de Exames',
      conduct: 'Outras Condutas',
    };

    const messageText = text || prescriptionText || typeLabels[type] || 'Prescrição';

    const newMessage = {
      id: Date.now().toString(),
      text: messageText,
      senderId: user?.id,
      senderName: user?.name || 'Dr(a). Médico',
      type: type === 'medication' ? 'prescription' : type === 'exam' ? 'referral' : 'text',
      timestamp: new Date().toISOString(),
      isOwn: true,
    };

    setChatMessages(prev => [...prev, newMessage]);
    setShowPrescriptionModal(false);
    setPrescriptionType(null);
    setPrescriptionText('');
    
    // Abrir o chat automaticamente após enviar prescrição
    setShowChat(true);
    
    if (chatFlatListRef.current) {
      setTimeout(() => {
        chatFlatListRef.current.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handlePickImageFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar suas fotos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newMessage = {
          id: Date.now().toString(),
          imageUri: result.assets[0].uri,
          senderId: user?.id,
          senderName: user?.name || 'Dr(a). Médico',
          type: 'image',
          timestamp: new Date().toISOString(),
          isOwn: true,
        };

        setChatMessages(prev => [...prev, newMessage]);
        setSendingMessage(true);

        // TODO: Upload da imagem e envio para o backend
        setTimeout(() => {
          setSendingMessage(false);
          if (chatFlatListRef.current) {
            chatFlatListRef.current.scrollToEnd({ animated: true });
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
    }
  };

  const handlePickImageFromCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Precisamos de permissão para usar a câmera.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newMessage = {
          id: Date.now().toString(),
          imageUri: result.assets[0].uri,
          senderId: user?.id,
          senderName: user?.name || 'Dr(a). Médico',
          type: 'image',
          timestamp: new Date().toISOString(),
          isOwn: true,
        };

        setChatMessages(prev => [...prev, newMessage]);
        setSendingMessage(true);

        // TODO: Upload da imagem e envio para o backend
        setTimeout(() => {
          setSendingMessage(false);
          if (chatFlatListRef.current) {
            chatFlatListRef.current.scrollToEnd({ animated: true });
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Erro ao tirar foto:', error);
      Alert.alert('Erro', 'Não foi possível tirar a foto.');
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const newMessage = {
          id: Date.now().toString(),
          documentUri: result.assets[0].uri,
          documentName: result.assets[0].name,
          documentSize: result.assets[0].size,
          senderId: user?.id,
          senderName: user?.name || 'Dr(a). Médico',
          type: 'document',
          timestamp: new Date().toISOString(),
          isOwn: true,
        };

        setChatMessages(prev => [...prev, newMessage]);
        setSendingMessage(true);

        // TODO: Upload do documento e envio para o backend
        setTimeout(() => {
          setSendingMessage(false);
          if (chatFlatListRef.current) {
            chatFlatListRef.current.scrollToEnd({ animated: true });
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Erro ao selecionar documento:', error);
      Alert.alert('Erro', 'Não foi possível selecionar o documento.');
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Enviar Imagem',
      'Escolha uma opção',
      [
        { text: 'Câmera', onPress: handlePickImageFromCamera },
        { text: 'Galeria', onPress: handlePickImageFromGallery },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const renderChatMessage = ({ item }) => {
    return (
      <View style={[
        styles.chatMessageContainer,
        item.isOwn ? styles.chatMessageOwn : styles.chatMessageOther
      ]}>
        {!item.isOwn && (
          <Text style={styles.chatMessageSender}>{item.senderName}</Text>
        )}
        {item.type === 'text' && (
          <Text style={[
            styles.chatMessageText,
            item.isOwn ? styles.chatMessageTextOwn : styles.chatMessageTextOther
          ]}>
            {item.text}
          </Text>
        )}
        {item.type === 'image' && item.imageUri && (
          <Image source={{ uri: item.imageUri }} style={styles.chatMessageImage} />
        )}
        {item.type === 'document' && (
          <View style={styles.chatMessageDocument}>
            <Ionicons name="document" size={24} color={item.isOwn ? colors.textWhite : colors.primary} />
            <View style={styles.chatMessageDocumentInfo}>
              <Text style={[
                styles.chatMessageDocumentName,
                item.isOwn ? styles.chatMessageTextOwn : styles.chatMessageTextOther
              ]}>
                {item.documentName}
              </Text>
              {item.documentSize && (
                <Text style={[
                  styles.chatMessageDocumentSize,
                  item.isOwn ? styles.chatMessageTextOwn : styles.chatMessageTextOther
                ]}>
                  {(item.documentSize / 1024).toFixed(1)} KB
                </Text>
              )}
            </View>
          </View>
        )}
        {item.type === 'prescription' && (
          <View style={styles.chatMessagePrescription}>
            <Ionicons name="medical" size={24} color={item.isOwn ? colors.textWhite : colors.secondary} />
            <Text style={[
              styles.chatMessageText,
              item.isOwn ? styles.chatMessageTextOwn : styles.chatMessageTextOther
            ]}>
              {item.text || 'Receita Médica'}
            </Text>
          </View>
        )}
        {item.type === 'referral' && (
          <View style={styles.chatMessagePrescription}>
            <Ionicons name="paper-plane" size={24} color={item.isOwn ? colors.textWhite : colors.info} />
            <Text style={[
              styles.chatMessageText,
              item.isOwn ? styles.chatMessageTextOwn : styles.chatMessageTextOther
            ]}>
              {item.text || 'Encaminhamento'}
            </Text>
          </View>
        )}
        <Text style={styles.chatMessageTime}>
          {new Date(item.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
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
                  <Text style={styles.modalSubtitle}>Receita Médica</Text>
                  <Text style={styles.modalText}>
                    Digite a prescrição de medicamentos para o paciente.
                  </Text>
                  <TextInput
                    style={styles.prescriptionInput}
                    placeholder="Ex: Dipirona 500mg - 1 comprimido a cada 8 horas por 5 dias"
                    placeholderTextColor={colors.gray400}
                    value={prescriptionText}
                    onChangeText={setPrescriptionText}
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                  />
                </View>
              )}

              {prescriptionType === 'exam' && (
                <View>
                  <Text style={styles.modalSubtitle}>Solicitação de Exames</Text>
                  <Text style={styles.modalText}>
                    Digite os exames solicitados para o paciente.
                  </Text>
                  <TextInput
                    style={styles.prescriptionInput}
                    placeholder="Ex: Hemograma completo, Glicemia de jejum, Colesterol total"
                    placeholderTextColor={colors.gray400}
                    value={prescriptionText}
                    onChangeText={setPrescriptionText}
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                  />
                </View>
              )}

              {prescriptionType === 'conduct' && (
                <View>
                  <Text style={styles.modalSubtitle}>Outras Condutas</Text>
                  <Text style={styles.modalText}>
                    Digite outras condutas médicas para o paciente.
                  </Text>
                  <TextInput
                    style={styles.prescriptionInput}
                    placeholder="Ex: Repouso relativo, Retorno em 15 dias, Orientação sobre dieta"
                    placeholderTextColor={colors.gray400}
                    value={prescriptionText}
                    onChangeText={setPrescriptionText}
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                  />
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
                  // Enviar prescrição para o chat
                  handleSendPrescription(prescriptionType);
                  Alert.alert('Sucesso', 'Prescrição enviada ao chat!');
                }}
              >
                <Text style={styles.modalSaveText}>Enviar ao Chat</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  if (isInitializing) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Iniciando chamada de vídeo...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (callError) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <StatusBar style="light" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.error} />
          <Text style={styles.errorText}>{callError}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
          {remoteUid ? (
            // TODO: Descomentar após build com Agora.io
            // <RtcSurfaceView
            //   ref={remoteVideoRef}
            //   canvas={{ uid: remoteUid }}
            //   mode={RtcSurfaceViewMode.RtcSurfaceViewModeFit}
            //   style={styles.videoView}
            // />
            <View style={styles.videoPlaceholder}>
              <Ionicons name="videocam" size={80} color={colors.primary} />
              <Text style={styles.videoPlaceholderText}>Vídeo do Paciente</Text>
              <Text style={styles.videoNote}>
                {callError ? 'Erro ao conectar' : 'Aguardando paciente entrar na chamada...'}
              </Text>
              {!callError && (
                <Text style={[styles.videoNote, { marginTop: 8, fontSize: 11, color: colors.textLight }]}>
                  (Modo desenvolvimento - Expo Go)
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.videoPlaceholder}>
              <Ionicons name="person" size={80} color={colors.textLight} />
              <Text style={styles.videoPlaceholderText}>
                {patientInfo?.name || 'Paciente'}
              </Text>
              <Text style={styles.videoNote}>
                (Aguardando paciente entrar na chamada...)
              </Text>
            </View>
          )}
        </View>

        {/* Vídeo do Médico (picture-in-picture) */}
        <View style={styles.pipVideo}>
          {!isVideoOff ? (
            // TODO: Descomentar após build com Agora.io
            // <RtcSurfaceView
            //   ref={localVideoRef}
            //   canvas={{ uid: 0 }} // 0 = local view
            //   mode={RtcSurfaceViewMode.RtcSurfaceViewModeFit}
            //   style={styles.pipVideoView}
            // />
            <View style={styles.pipPlaceholder}>
              <Ionicons name="videocam" size={24} color={colors.primary} />
            </View>
          ) : (
            <View style={styles.pipPlaceholder}>
              <Ionicons name="person" size={24} color={colors.textLight} />
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
          style={[styles.controlButton, showChat && styles.controlButtonActive]}
          onPress={() => setShowChat(!showChat)}
        >
          <Ionicons
            name="chatbubbles"
            size={24}
            color={showChat ? colors.primary : colors.text}
          />
          {chatMessages.length > 0 && (
            <View style={styles.chatBadge}>
              <Text style={styles.chatBadgeText}>{chatMessages.length}</Text>
            </View>
          )}
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

      {/* Modal de Chat */}
      <Modal
        visible={showChat}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowChat(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.chatModalContainer}
        >
          <View style={styles.chatModalContent}>
            {/* Header do Chat */}
            <View style={styles.chatHeader}>
              <Text style={styles.chatHeaderTitle}>Chat da Consulta</Text>
              <TouchableOpacity
                onPress={() => setShowChat(false)}
                style={styles.chatCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Lista de Mensagens */}
            <FlatList
              ref={chatFlatListRef}
              data={chatMessages}
              renderItem={renderChatMessage}
              keyExtractor={(item) => item.id}
              style={styles.chatMessagesList}
              contentContainerStyle={styles.chatMessagesContent}
              onContentSizeChange={() => {
                if (chatFlatListRef.current) {
                  chatFlatListRef.current.scrollToEnd({ animated: true });
                }
              }}
            />

            {/* Input de Mensagem */}
            <View style={styles.chatInputContainer}>
              <TouchableOpacity
                style={styles.chatInputButton}
                onPress={showImagePickerOptions}
              >
                <Ionicons name="image" size={24} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.chatInputButton}
                onPress={handlePickDocument}
              >
                <Ionicons name="document-attach" size={24} color={colors.primary} />
              </TouchableOpacity>
              <TextInput
                style={styles.chatInput}
                placeholder="Digite uma mensagem..."
                placeholderTextColor={colors.gray400}
                value={messageText}
                onChangeText={setMessageText}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[styles.chatSendButton, !messageText.trim() && styles.chatSendButtonDisabled]}
                onPress={handleSendMessage}
                disabled={!messageText.trim() || sendingMessage}
              >
                <Ionicons
                  name="send"
                  size={20}
                  color={messageText.trim() ? colors.textWhite : colors.gray400}
                />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textLight,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
  videoView: {
    flex: 1,
    width: '100%',
    height: '100%',
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
    overflow: 'hidden',
  },
  pipVideoView: {
    width: '100%',
    height: '100%',
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
  prescriptionInput: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: colors.text,
    minHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 12,
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
  chatBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  chatBadgeText: {
    color: colors.textWhite,
    fontSize: 10,
    fontWeight: '700',
  },
  chatModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  chatModalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '70%',
    maxHeight: '80%',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  chatHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  chatCloseButton: {
    padding: 4,
  },
  chatMessagesList: {
    flex: 1,
  },
  chatMessagesContent: {
    padding: 16,
  },
  chatMessageContainer: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  chatMessageOwn: {
    alignSelf: 'flex-end',
  },
  chatMessageOther: {
    alignSelf: 'flex-start',
  },
  chatMessageSender: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 4,
  },
  chatMessageText: {
    fontSize: 14,
    padding: 12,
    borderRadius: 16,
  },
  chatMessageTextOwn: {
    backgroundColor: colors.primary,
    color: colors.textWhite,
  },
  chatMessageTextOther: {
    backgroundColor: colors.backgroundLight,
    color: colors.text,
  },
  chatMessageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginTop: 4,
  },
  chatMessageDocument: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    backgroundColor: colors.backgroundLight,
    gap: 12,
  },
  chatMessageDocumentInfo: {
    flex: 1,
  },
  chatMessageDocumentName: {
    fontSize: 14,
    fontWeight: '600',
  },
  chatMessageDocumentSize: {
    fontSize: 12,
    marginTop: 4,
  },
  chatMessagePrescription: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    backgroundColor: colors.secondary + '20',
    gap: 12,
  },
  chatMessageTime: {
    fontSize: 10,
    color: colors.textLight,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    gap: 8,
  },
  chatInputButton: {
    padding: 8,
  },
  chatInput: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    maxHeight: 100,
  },
  chatSendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatSendButtonDisabled: {
    backgroundColor: colors.gray300,
  },
});

export default DoctorVideoCallScreen;


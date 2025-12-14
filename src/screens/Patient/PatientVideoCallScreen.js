import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
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

const PatientVideoCallScreen = ({ route, navigation }) => {
  const { appointment, doctorInfo } = route.params || {};
  const { user } = useAuth();
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [callError, setCallError] = useState(null);
  const [remoteUid, setRemoteUid] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const chatFlatListRef = useRef(null);

  useEffect(() => {
    initializeCall();
    
    return () => {
      // Cleanup ao sair da tela
      endCall();
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isCallActive) {
      // Iniciar contador de duração
      durationIntervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    }
  }, [isCallActive]);

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
      const userId = appointment?.group_id || 1; // ID do paciente/grupo

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
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      console.log('✅ Chamada encerrada');
    } catch (error) {
      console.error('❌ Erro ao encerrar chamada:', error);
    }
  };

  const handleEndCall = () => {
    Alert.alert(
      'Encerrar Chamada',
      'Tem certeza que deseja encerrar a chamada?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Encerrar',
          style: 'destructive',
          onPress: () => {
            endCall();
            navigation.goBack();
          },
        },
      ]
    );
  };

  const toggleMute = async () => {
    try {
      const result = await videoCallService.muteLocalAudio(!isMuted);
      if (result.success) {
        setIsMuted(!isMuted);
      }
    } catch (error) {
      console.error('❌ Erro ao alternar áudio:', error);
    }
  };

  const toggleVideo = async () => {
    try {
      const result = await videoCallService.muteLocalVideo(!isVideoOff);
      if (result.success) {
        setIsVideoOff(!isVideoOff);
      }
    } catch (error) {
      console.error('❌ Erro ao alternar vídeo:', error);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isInitializing) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <StatusBar style="light" />
        <View style={styles.connectingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.connectingText}>Conectando...</Text>
          <Text style={styles.connectingSubtext}>
            Aguarde enquanto conectamos você à consulta
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (callError && !isCallActive) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <StatusBar style="light" />
        <View style={styles.connectingContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.error} />
          <Text style={styles.connectingText}>Erro na Conexão</Text>
          <Text style={styles.connectingSubtext}>{callError}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setCallError(null);
              initializeCall();
            }}
          >
            <Text style={styles.retryButtonText}>Tentar Novamente</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Voltar</Text>
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
        {/* Vídeo do Médico (tela principal) */}
        <View style={styles.mainVideo}>
          {remoteUid ? (
            <View style={styles.videoPlaceholder}>
              <Ionicons name="videocam" size={80} color={colors.primary} />
              <Text style={styles.videoPlaceholderText}>Vídeo do Médico</Text>
              <Text style={styles.videoNote}>
                {callError ? 'Erro ao conectar' : 'Aguardando médico entrar na chamada...'}
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
                {doctorInfo?.name || 'Dr(a). Médico'}
              </Text>
              <Text style={styles.videoNote}>
                (Aguardando médico entrar na chamada...)
              </Text>
            </View>
          )}
        </View>

        {/* Vídeo do Paciente (picture-in-picture) */}
        <View style={styles.pipVideo}>
          {isVideoOff ? (
            <View style={styles.pipPlaceholder}>
              <Ionicons name="person" size={24} color={colors.textLight} />
            </View>
          ) : (
            <View style={styles.pipPlaceholder}>
              <Text style={styles.pipText}>Você</Text>
            </View>
          )}
        </View>

        {/* Informações do Médico */}
        <View style={styles.doctorInfoOverlay}>
          <Text style={styles.doctorName}>
            {doctorInfo?.name || 'Dr(a). Médico'}
          </Text>
          {callDuration > 0 && (
            <Text style={styles.callDuration}>
              {formatDuration(callDuration)}
            </Text>
          )}
        </View>
      </View>

      {/* Controles */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.controlButton, isMuted && styles.controlButtonActive]}
          onPress={toggleMute}
        >
          <Ionicons
            name={isMuted ? 'mic-off' : 'mic'}
            size={24}
            color={isMuted ? colors.error : colors.textWhite}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, isVideoOff && styles.controlButtonActive]}
          onPress={toggleVideo}
        >
          <Ionicons
            name={isVideoOff ? 'videocam-off' : 'videocam'}
            size={24}
            color={isVideoOff ? colors.error : colors.textWhite}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, showChat && styles.controlButtonActive]}
          onPress={() => setShowChat(!showChat)}
        >
          <Ionicons
            name="chatbubbles"
            size={24}
            color={showChat ? colors.primary : colors.textWhite}
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
          <Ionicons name="call" size={24} color={colors.textWhite} />
        </TouchableOpacity>
      </View>

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
  connectingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingHorizontal: 40,
  },
  connectingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
  },
  connectingSubtext: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 8,
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
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backButtonText: {
    color: colors.textLight,
    fontSize: 14,
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
  pipText: {
    fontSize: 12,
    color: colors.textLight,
  },
  doctorInfoOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  doctorName: {
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
    gap: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonActive: {
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
  },
  endCallButton: {
    backgroundColor: colors.error,
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

export default PatientVideoCallScreen;


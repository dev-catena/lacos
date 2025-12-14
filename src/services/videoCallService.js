/**
 * Serviço de Chamada de Vídeo
 * 
 * Suporta múltiplas implementações:
 * 1. Agora.io (recomendado) - Requer expo-dev-client
 * 2. react-native-webrtc - Requer expo-dev-client
 * 3. Mock (para desenvolvimento no Expo Go)
 */

// ============================================
// MODO: Verificar se Agora.io está disponível
// ============================================

let RtcEngine = null;
let ChannelProfileType = null;
let ClientRoleType = null;
let isAgoraAvailable = false;

try {
  // Tentar importar Agora.io (só funciona com expo-dev-client)
  const agoraModule = require('react-native-agora');
  RtcEngine = agoraModule.RtcEngine;
  ChannelProfileType = agoraModule.ChannelProfileType;
  ClientRoleType = agoraModule.ClientRoleType;
  isAgoraAvailable = true;
  console.log('✅ Agora.io disponível (expo-dev-client)');
} catch (error) {
  // Agora.io não está disponível (Expo Go)
  console.log('⚠️ Agora.io não disponível - usando modo mock (Expo Go)');
  isAgoraAvailable = false;
}

// ============================================
// CLASSE: VideoCallService
// ============================================

class VideoCallService {
  constructor() {
    this.engine = null;
    this.appId = process.env.AGORA_APP_ID || '75ae244af79944a18a059d2fcb18c1dc';
    this.isInitialized = false;
    this.isMockMode = !isAgoraAvailable;
  }

  /**
   * Inicializar o engine do Agora (ou modo mock)
   */
  async initialize() {
    if (this.isInitialized) {
      return { success: true };
    }

    // Se Agora.io não está disponível, usar modo mock
    if (this.isMockMode) {
      console.log('📹 Modo MOCK: Simulando inicialização de vídeo');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay
      this.isInitialized = true;
      return { success: true, mock: true };
    }

    // Modo real com Agora.io
    try {
      this.engine = await RtcEngine.create(this.appId);
      
      // Configurar eventos
      this.engine.addListener('JoinChannelSuccess', (channel, uid, elapsed) => {
        console.log('✅ Entrou no canal:', channel, 'UID:', uid);
      });

      this.engine.addListener('UserJoined', (uid, elapsed) => {
        console.log('👤 Usuário entrou:', uid);
      });

      this.engine.addListener('UserOffline', (uid, reason) => {
        console.log('👤 Usuário saiu:', uid);
      });

      this.engine.addListener('Error', (err) => {
        console.error('❌ Erro Agora:', err);
      });

      this.isInitialized = true;
      return { success: true };
    } catch (error) {
      console.error('Erro ao inicializar Agora:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Entrar em um canal de vídeo
   */
  async joinChannel(channelName, userId, token = null) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Modo mock (Expo Go)
      if (this.isMockMode) {
        console.log('📹 Modo MOCK: Simulando entrada no canal:', channelName);
        await new Promise(resolve => setTimeout(resolve, 500)); // Simular delay
        return { success: true, mock: true };
      }

      // Modo real com Agora.io
      // Habilitar vídeo
      await this.engine.enableVideo();
      await this.engine.startPreview();

      // Configurar perfil do canal (comunicação 1-para-1)
      await this.engine.setChannelProfile(ChannelProfileType.Communication);

      // Entrar no canal
      await this.engine.joinChannel(token, channelName, userId, {
        clientRoleType: ClientRoleType.Broadcaster,
      });

      return { success: true };
    } catch (error) {
      console.error('Erro ao entrar no canal:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sair do canal
   */
  async leaveChannel() {
    try {
      // Modo mock
      if (this.isMockMode) {
        console.log('📹 Modo MOCK: Simulando saída do canal');
        return { success: true, mock: true };
      }

      // Modo real
      if (this.engine) {
        await this.engine.leaveChannel();
        await this.engine.stopPreview();
        await this.engine.disableVideo();
      }
      return { success: true };
    } catch (error) {
      console.error('Erro ao sair do canal:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mute/Unmute áudio
   */
  async toggleMute(mute) {
    try {
      // Modo mock
      if (this.isMockMode) {
        console.log('📹 Modo MOCK: Simulando mute/unmute:', mute);
        return { success: true, muted: mute, mock: true };
      }

      // Modo real
      if (this.engine) {
        await this.engine.muteLocalAudioStream(mute);
        return { success: true, muted: mute };
      }
      return { success: false };
    } catch (error) {
      console.error('Erro ao alternar mute:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Ligar/Desligar vídeo
   */
  async toggleVideo(enable) {
    try {
      // Modo mock
      if (this.isMockMode) {
        console.log('📹 Modo MOCK: Simulando ligar/desligar vídeo:', enable);
        return { success: true, enabled: enable, mock: true };
      }

      // Modo real
      if (this.engine) {
        await this.engine.enableLocalVideo(enable);
        return { success: true, enabled: enable };
      }
      return { success: false };
    } catch (error) {
      console.error('Erro ao alternar vídeo:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obter view do vídeo local (para exibir)
   */
  getLocalVideoView() {
    if (!this.engine) return null;
    return RtcEngine.createRendererView(0); // 0 = local view
  }

  /**
   * Obter view do vídeo remoto (para exibir)
   */
  getRemoteVideoView(uid) {
    if (!this.engine) return null;
    return RtcEngine.createRendererView(uid);
  }

  /**
   * Limpar recursos
   */
  async destroy() {
    try {
      // Modo mock
      if (this.isMockMode) {
        console.log('📹 Modo MOCK: Simulando destruição do engine');
        this.isInitialized = false;
        return { success: true, mock: true };
      }

      // Modo real
      if (this.engine) {
        await this.leaveChannel();
        await RtcEngine.destroy();
        this.engine = null;
        this.isInitialized = false;
      }
      return { success: true };
    } catch (error) {
      console.error('Erro ao destruir engine:', error);
      return { success: false, error: error.message };
    }
  }
}

// ============================================
// OPÇÃO 2: REACT-NATIVE-WEBRTC (Alternativa)
// ============================================

/*
import {
  mediaDevices,
  RTCPeerConnection,
  RTCView,
  RTCSessionDescription,
  RTCIceCandidate,
} from 'react-native-webrtc';

class VideoCallServiceWebRTC {
  constructor() {
    this.localStream = null;
    this.remoteStream = null;
    this.peerConnection = null;
    this.socket = null; // Socket.io para sinalização
  }

  async initialize(socket) {
    this.socket = socket;
    
    // Configurar eventos do socket
    this.socket.on('offer', this.handleOffer.bind(this));
    this.socket.on('answer', this.handleAnswer.bind(this));
    this.socket.on('ice-candidate', this.handleIceCandidate.bind(this));
  }

  async startLocalVideo() {
    try {
      this.localStream = await mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      return { success: true, stream: this.localStream };
    } catch (error) {
      console.error('Erro ao obter mídia local:', error);
      return { success: false, error: error.message };
    }
  }

  async createPeerConnection() {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        // Adicione seus próprios servidores TURN se necessário
      ],
    };

    this.peerConnection = new RTCPeerConnection(configuration);

    // Adicionar stream local
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });
    }

    // Configurar eventos
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.socket) {
        this.socket.emit('ice-candidate', event.candidate);
      }
    };

    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0];
    };
  }

  async createOffer() {
    try {
      await this.createPeerConnection();
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      
      if (this.socket) {
        this.socket.emit('offer', offer);
      }
      
      return { success: true, offer };
    } catch (error) {
      console.error('Erro ao criar offer:', error);
      return { success: false, error: error.message };
    }
  }

  async handleOffer(offer) {
    try {
      await this.createPeerConnection();
      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(offer)
      );
      
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      
      if (this.socket) {
        this.socket.emit('answer', answer);
      }
    } catch (error) {
      console.error('Erro ao processar offer:', error);
    }
  }

  async handleAnswer(answer) {
    try {
      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    } catch (error) {
      console.error('Erro ao processar answer:', error);
    }
  }

  async handleIceCandidate(candidate) {
    try {
      await this.peerConnection.addIceCandidate(
        new RTCIceCandidate(candidate)
      );
    } catch (error) {
      console.error('Erro ao adicionar ICE candidate:', error);
    }
  }

  async stop() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
  }
}
*/

// Exportar instância única
const videoCallService = new VideoCallService();
export default videoCallService;


/**
 * Serviço de videoconferência via Agora.io (react-native-agora v4).
 * Requer build com expo-dev-client — no Expo Go opera em modo simulado.
 */

import { Platform, PermissionsAndroid } from 'react-native';
import { AGORA_APP_ID } from '../config/agora';

let createAgoraRtcEngine = null;
let ChannelProfileType = null;
let ClientRoleType = null;
let RtcSurfaceView = null;
let isAgoraAvailable = false;

try {
  const agora = require('react-native-agora');
  createAgoraRtcEngine = agora.createAgoraRtcEngine;
  ChannelProfileType = agora.ChannelProfileType;
  ClientRoleType = agora.ClientRoleType;
  RtcSurfaceView = agora.RtcSurfaceView;
  isAgoraAvailable = true;
} catch {
  isAgoraAvailable = false;
}

export { RtcSurfaceView, isAgoraAvailable };

async function requestCameraAndMicPermissions() {
  if (Platform.OS !== 'android') return true;

  const granted = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.CAMERA,
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
  ]);

  return (
    granted[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED &&
    granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED
  );
}

class VideoCallService {
  constructor() {
    this.engine = null;
    this.isInitialized = false;
    this.isMockMode = !isAgoraAvailable;
    this.handlers = {};
    this.localUid = 0;
    this.eventHandler = null;
  }

  setEventHandlers(handlers = {}) {
    this.handlers = handlers;
  }

  get mock() {
    return this.isMockMode;
  }

  async initialize() {
    if (this.isInitialized) {
      return { success: true, mock: this.isMockMode };
    }

    if (this.isMockMode) {
      await new Promise((r) => setTimeout(r, 800));
      this.isInitialized = true;
      return { success: true, mock: true };
    }

    try {
      const permitted = await requestCameraAndMicPermissions();
      if (!permitted) {
        return { success: false, error: 'Permissão de câmera e microfone necessária' };
      }

      this.engine = createAgoraRtcEngine();
      this.engine.initialize({ appId: AGORA_APP_ID });

      this.eventHandler = {
        onJoinChannelSuccess: (_connection, uid) => {
          this.localUid = uid;
          this.handlers.onJoinChannelSuccess?.(uid);
        },
        onUserJoined: (_connection, uid) => {
          this.handlers.onUserJoined?.(uid);
        },
        onUserOffline: (_connection, uid) => {
          this.handlers.onUserOffline?.(uid);
        },
        onError: (err) => {
          console.error('❌ Agora onError:', err);
          this.handlers.onError?.(err);
        },
      };

      this.engine.registerEventHandler(this.eventHandler);

      this.engine.setChannelProfile(ChannelProfileType.ChannelProfileCommunication);
      this.engine.setClientRole(ClientRoleType.ClientRoleBroadcaster);
      this.engine.enableVideo();
      this.engine.enableAudio();
      this.engine.startPreview();

      this.isInitialized = true;
      return { success: true, mock: false };
    } catch (error) {
      console.error('Erro ao inicializar Agora:', error);
      return { success: false, error: error.message || 'Falha ao inicializar vídeo' };
    }
  }

  async joinChannel(channelName, userId, token = '') {
    try {
      if (!this.isInitialized) {
        const init = await this.initialize();
        if (!init.success) return init;
      }

      if (this.isMockMode) {
        await new Promise((r) => setTimeout(r, 500));
        this.handlers.onJoinChannelSuccess?.(userId);
        return { success: true, mock: true };
      }

      const uid = Number(userId) || 0;
      await this.engine.joinChannel(token || '', channelName, uid, {
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
        channelProfile: ChannelProfileType.ChannelProfileCommunication,
        publishMicrophoneTrack: true,
        publishCameraTrack: true,
        autoSubscribeAudio: true,
        autoSubscribeVideo: true,
      });

      return { success: true, mock: false };
    } catch (error) {
      console.error('Erro ao entrar no canal:', error);
      return { success: false, error: error.message || 'Falha ao entrar no canal' };
    }
  }

  async leaveChannel() {
    try {
      if (this.isMockMode) {
        return { success: true, mock: true };
      }

      if (this.engine) {
        this.engine.stopPreview();
        await this.engine.leaveChannel();
      }
      return { success: true };
    } catch (error) {
      console.error('Erro ao sair do canal:', error);
      return { success: false, error: error.message };
    }
  }

  async toggleMute(mute) {
    try {
      if (this.isMockMode) {
        return { success: true, muted: mute, mock: true };
      }

      if (this.engine) {
        this.engine.muteLocalAudioStream(mute);
        return { success: true, muted: mute };
      }
      return { success: false };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async toggleVideo(enable) {
    try {
      if (this.isMockMode) {
        return { success: true, enabled: enable, mock: true };
      }

      if (this.engine) {
        this.engine.muteLocalVideoStream(!enable);
        if (enable) {
          this.engine.startPreview();
        }
        return { success: true, enabled: enable };
      }
      return { success: false };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async destroy() {
    try {
      if (this.isMockMode) {
        this.isInitialized = false;
        this.handlers = {};
        return { success: true, mock: true };
      }

      if (this.engine) {
        if (this.eventHandler) {
          this.engine.unregisterEventHandler(this.eventHandler);
          this.eventHandler = null;
        }
        await this.leaveChannel();
        this.engine.release();
        this.engine = null;
      }
      this.isInitialized = false;
      this.handlers = {};
      this.localUid = 0;
      return { success: true };
    } catch (error) {
      console.error('Erro ao destruir engine:', error);
      return { success: false, error: error.message };
    }
  }
}

const videoCallService = new VideoCallService();
export default videoCallService;

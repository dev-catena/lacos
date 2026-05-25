/**
 * Serviço de videoconferência via Agora.io (react-native-agora v4).
 * Requer build com expo-dev-client — no Expo Go opera em modo simulado.
 */

import { Platform, PermissionsAndroid } from 'react-native';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { AGORA_APP_ID } from '../config/agora';

let createAgoraRtcEngine = null;
let ChannelProfileType = null;
let ClientRoleType = null;
let RtcSurfaceView = null;
let VideoSourceType = null;
let RenderModeType = null;
let isAgoraAvailable = false;

try {
  const agora = require('react-native-agora');
  createAgoraRtcEngine = agora.createAgoraRtcEngine;
  ChannelProfileType = agora.ChannelProfileType;
  ClientRoleType = agora.ClientRoleType;
  RtcSurfaceView = agora.RtcSurfaceView;
  VideoSourceType = agora.VideoSourceType;
  RenderModeType = agora.RenderModeType;
  isAgoraAvailable = true;
} catch {
  isAgoraAvailable = false;
}

export { RtcSurfaceView, VideoSourceType, RenderModeType, isAgoraAvailable };

async function requestCameraAndMicPermissions() {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.CAMERA,
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    ]);

    return (
      granted[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED &&
      granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED
    );
  }

  const camera = await ImagePicker.requestCameraPermissionsAsync();
  const audio = await Audio.requestPermissionsAsync();
  return camera.status === 'granted' && audio.status === 'granted';
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
        onJoinChannelSuccess: (connection, _elapsed) => {
          const assignedUid = connection?.localUid ?? connection?.uid ?? this.localUid;
          if (assignedUid) {
            this.localUid = assignedUid;
          }
          this.handlers.onJoinChannelSuccess?.(this.localUid);
        },
        onUserJoined: (_connection, remoteUid, _elapsed) => {
          const uid = Number(remoteUid);
          if (!Number.isFinite(uid) || uid <= 0) return;
          this.ensureRemoteMediaSubscribed(uid);
          this.handlers.onUserJoined?.(uid);
        },
        onUserOffline: (_connection, remoteUid, _reason) => {
          const uid = Number(remoteUid);
          if (Number.isFinite(uid)) {
            this.handlers.onUserOffline?.(uid);
          }
        },
        onFirstRemoteVideoDecoded: (_connection, remoteUid, _width, _height, _elapsed) => {
          const uid = Number(remoteUid);
          if (!Number.isFinite(uid) || uid <= 0) return;
          this.ensureRemoteMediaSubscribed(uid);
          this.handlers.onRemoteVideoReady?.(uid);
        },
        onError: (err, msg) => {
          console.error('❌ Agora onError:', err, msg);
          this.handlers.onError?.(err, msg);
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
      const result = this.engine.joinChannel(token || '', channelName, uid, {
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
        channelProfile: ChannelProfileType.ChannelProfileCommunication,
        publishMicrophoneTrack: true,
        publishCameraTrack: true,
        autoSubscribeAudio: true,
        autoSubscribeVideo: true,
      });

      if (result !== 0) {
        return { success: false, error: `Falha ao entrar no canal (código ${result})` };
      }

      if (this.engine?.muteAllRemoteVideoStreams) {
        this.engine.muteAllRemoteVideoStreams(false);
      }
      if (this.engine?.muteAllRemoteAudioStreams) {
        this.engine.muteAllRemoteAudioStreams(false);
      }

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

  getLocalUid() {
    return this.localUid || 0;
  }

  ensureRemoteMediaSubscribed(uid) {
    if (this.isMockMode || !this.engine) return;
    try {
      this.engine.muteRemoteVideoStream(uid, false);
      this.engine.muteRemoteAudioStream(uid, false);
    } catch (e) {
      console.warn('Agora ensureRemoteMediaSubscribed:', e?.message);
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

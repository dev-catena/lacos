/**
 * Serviço de videoconferência via Agora.io (react-native-agora v4).
 * Requer build com expo-dev-client — no Expo Go opera em modo simulado.
 */

import { Platform, PermissionsAndroid } from 'react-native';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { AGORA_APP_ID } from '../config/agora';
import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  RtcSurfaceView,
  RtcTextureView,
  VideoSourceType,
  RenderModeType,
  isAgoraAvailable,
} from './agoraBindings';

export { RtcSurfaceView, RtcTextureView, VideoSourceType, RenderModeType, isAgoraAvailable };

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
    /** Evita loop notify → handler → prepare → evento Agora → notify */
    this.notifiedRemoteUids = new Set();
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
          this.ensureLocalMediaPublished();
          this.handlers.onJoinChannelSuccess?.(this.localUid);
        },
        onUserJoined: (_connection, remoteUid, _elapsed) => {
          const uid = Number(remoteUid);
          if (!Number.isFinite(uid) || uid <= 0) return;
          this.notifyRemoteUser(uid);
        },
        onUserStateChanged: (_connection, remoteUid, _state) => {
          const uid = Number(remoteUid);
          if (!Number.isFinite(uid) || uid <= 0) return;
          this.notifyRemoteUser(uid);
        },
        onFirstRemoteVideoFrame: (_connection, remoteUid, _width, _height, _elapsed) => {
          const uid = Number(remoteUid);
          if (!Number.isFinite(uid) || uid <= 0) return;
          this.notifyRemoteUser(uid);
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
          this.notifyRemoteUser(uid);
        },
        onRemoteVideoStateChanged: (_connection, remoteUid, state, _reason, _elapsed) => {
          const uid = Number(remoteUid);
          if (!Number.isFinite(uid) || uid <= 0) return;
          // RemoteVideoState: 1=starting, 2=decoding, 3=frozen
          if (state === 1 || state === 2 || state === 3) {
            this.notifyRemoteUser(uid);
          }
        },
        onConnectionStateChanged: (connection, state, reason) => {
          console.log('📡 Agora connection:', {
            channel: connection?.channelId,
            state,
            reason,
          });
          if (state === 5) {
            this.handlers.onError?.(reason, 'Falha na conexão com o canal de vídeo');
          }
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
      if (this.engine.setDefaultAudioRouteToSpeakerphone) {
        this.engine.setDefaultAudioRouteToSpeakerphone(true);
      }
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

      this.ensureLocalMediaPublished();

      return { success: true, mock: false };
    } catch (error) {
      console.error('Erro ao entrar no canal:', error);
      return { success: false, error: error.message || 'Falha ao entrar no canal' };
    }
  }

  async leaveChannel() {
    try {
      this.notifiedRemoteUids.clear();
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

  prepareRemoteUser(uid) {
    const n = Number(uid);
    if (!Number.isFinite(n) || n <= 0) return;
    this.ensureRemoteMediaSubscribed(n);
  }

  notifyRemoteUser(uid, forceSurfaceRefresh = false) {
    const n = Number(uid);
    if (!Number.isFinite(n) || n <= 0) return;
    const local = Number(this.localUid) || 0;
    if (local > 0 && n === local) return;

    this.ensureRemoteMediaSubscribed(n);
    const isNew = !this.notifiedRemoteUids.has(n);
    if (isNew) {
      this.notifiedRemoteUids.add(n);
      this.handlers.onUserJoined?.(n);
    }
    if (isNew || forceSurfaceRefresh) {
      this.handlers.onRemoteVideoReady?.(n);
    }
  }

  ensureLocalMediaPublished() {
    if (this.isMockMode || !this.engine) return;
    try {
      if (this.engine.enableLocalVideo) {
        this.engine.enableLocalVideo(true);
      }
      this.engine.muteLocalVideoStream(false);
      this.engine.muteLocalAudioStream(false);
      this.engine.startPreview();
      if (this.engine.updateChannelMediaOptions) {
        this.engine.updateChannelMediaOptions({
          publishCameraTrack: true,
          publishMicrophoneTrack: true,
          clientRoleType: ClientRoleType.ClientRoleBroadcaster,
          channelProfile: ChannelProfileType.ChannelProfileCommunication,
        });
      }
    } catch (e) {
      console.warn('Agora ensureLocalMediaPublished:', e?.message);
    }
  }

  ensureRemoteMediaSubscribed(uid) {
    if (this.isMockMode || !this.engine) return;
    const n = Number(uid);
    if (!Number.isFinite(n) || n <= 0) return;
    try {
      // Agora v4: vídeo remoto só via RtcSurfaceView (setupRemoteVideo foi removido).
      this.engine.muteRemoteVideoStream(n, false);
      this.engine.muteRemoteAudioStream(n, false);
    } catch (e) {
      console.warn('Agora ensureRemoteMediaSubscribed:', e?.message);
    }
  }

  async destroy() {
    try {
      if (this.isMockMode) {
        this.isInitialized = false;
        this.handlers = {};
        this.notifiedRemoteUids.clear();
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
      this.notifiedRemoteUids.clear();
      return { success: true };
    } catch (error) {
      console.error('Erro ao destruir engine:', error);
      return { success: false, error: error.message };
    }
  }
}

const videoCallService = new VideoCallService();
export default videoCallService;

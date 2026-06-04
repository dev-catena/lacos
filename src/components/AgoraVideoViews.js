import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import videoCallService, {
  RtcSurfaceView,
  RtcTextureView,
  VideoSourceType,
  RenderModeType,
  isAgoraAvailable,
} from '../services/videoCallService';

const RemoteRtcView = Platform.OS === 'android' ? RtcTextureView : RtcSurfaceView;
import colors from '../constants/colors';
import { PersonIcon, VideoCamIcon } from './CustomIcons';

const localCanvas = {
  uid: 0,
  sourceType: VideoSourceType?.VideoSourceCamera,
  renderMode: RenderModeType?.RenderModeFit,
};

function remoteCanvas(uid) {
  return {
    uid: Number(uid),
    sourceType: VideoSourceType?.VideoSourceRemote,
    renderMode: RenderModeType?.RenderModeFit,
  };
}

/**
 * Vídeo remoto em tela cheia (participante da consulta).
 */
export function RemoteVideoView({
  uid,
  isCallActive,
  isJoined,
  waitingLabel,
  participantName,
  remoteConfirmed = true,
  surfaceKey = 0,
}) {
  const remoteUid = uid != null ? Number(uid) : null;
  const ready = isJoined || isCallActive;
  const shouldRender =
    isAgoraAvailable && ready && remoteUid != null && remoteUid > 0 && remoteConfirmed;

  useEffect(() => {
    if (shouldRender && remoteUid > 0) {
      videoCallService.prepareRemoteUser(remoteUid);
    }
  }, [shouldRender, remoteUid]);

  if (shouldRender && RemoteRtcView) {
    return (
      <RemoteRtcView
        key={`remote-${remoteUid}-${surfaceKey}`}
        style={styles.fill}
        canvas={remoteCanvas(remoteUid)}
        zOrderMediaOverlay={false}
      />
    );
  }

  return (
    <View style={styles.placeholder}>
      {remoteUid != null ? (
        <>
          <VideoCamIcon size={80} color={colors.primary} />
          <Text style={styles.placeholderTitle}>{participantName || 'Participante'}</Text>
          <Text style={styles.placeholderSub}>Conectado (modo simulado)</Text>
        </>
      ) : (
        <>
          <PersonIcon size={80} color={colors.textLight} />
          <Text style={styles.placeholderTitle}>{participantName || 'Participante'}</Text>
          <Text style={styles.placeholderSub}>{waitingLabel || 'Aguardando entrar na chamada...'}</Text>
          {!isAgoraAvailable && (
            <Text style={styles.mockHint}>
              Instale o app de desenvolvimento (expo-dev-client) para vídeo real
            </Text>
          )}
        </>
      )}
    </View>
  );
}

/**
 * Vídeo local picture-in-picture (própria câmera).
 * Agora v4: uid 0 + VideoSourceCamera = setupLocalVideo (nunca usar o UID remoto aqui).
 */
export function LocalVideoView({ isJoined, isCallActive, videoOff, label = 'Você' }) {
  const showVideo = isAgoraAvailable && (isJoined || isCallActive) && !videoOff;

  if (showVideo) {
    return (
      <RtcSurfaceView
        key="local-preview"
        style={styles.fill}
        canvas={localCanvas}
        zOrderMediaOverlay
      />
    );
  }

  return (
    <View style={styles.pipPlaceholder}>
      <PersonIcon size={24} color={colors.textLight} />
      <Text style={styles.pipLabel}>{videoOff ? 'Câmera desligada' : label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textLight,
    marginTop: 12,
    textAlign: 'center',
  },
  placeholderSub: {
    fontSize: 13,
    color: colors.textLight,
    marginTop: 8,
    textAlign: 'center',
  },
  mockHint: {
    fontSize: 11,
    color: colors.gray400,
    marginTop: 16,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  pipPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pipLabel: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 4,
    textAlign: 'center',
  },
});

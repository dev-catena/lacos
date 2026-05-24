import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RtcSurfaceView, isAgoraAvailable } from '../services/videoCallService';
import colors from '../constants/colors';
import { PersonIcon, VideoCamIcon } from './CustomIcons';

/**
 * Vídeo remoto em tela cheia (participante da consulta).
 */
export function RemoteVideoView({ uid, waitingLabel, participantName }) {
  if (isAgoraAvailable && uid != null) {
    return (
      <RtcSurfaceView
        style={styles.fill}
        canvas={{ uid }}
        zOrderMediaOverlay={false}
      />
    );
  }

  return (
    <View style={styles.placeholder}>
      {uid != null ? (
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
 */
export function LocalVideoView({ videoOff, label = 'Você' }) {
  if (isAgoraAvailable && !videoOff) {
    return (
      <RtcSurfaceView
        style={styles.fill}
        canvas={{ uid: 0 }}
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

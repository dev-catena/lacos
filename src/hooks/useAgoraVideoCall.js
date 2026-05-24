import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import videoCallService from '../services/videoCallService';
import { getTeleconsultChannelName, toAgoraUid } from '../config/agora';

/**
 * Hook compartilhado para iniciar/encerrar chamada Agora na teleconsulta.
 */
export default function useAgoraVideoCall({
  appointmentId,
  userId,
  onJoined,
  navigation,
  enabled = true,
}) {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [callError, setCallError] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [isMockMode, setIsMockMode] = useState(false);
  const mountedRef = useRef(true);

  const endCall = useCallback(async () => {
    try {
      await videoCallService.leaveChannel();
      await videoCallService.destroy();
      if (mountedRef.current) {
        setIsCallActive(false);
        setRemoteUsers([]);
      }
    } catch (error) {
      console.error('Erro ao encerrar chamada:', error);
    }
  }, []);

  const initializeCall = useCallback(async () => {
    try {
      setIsInitializing(true);
      setCallError(null);
      setRemoteUsers([]);

      videoCallService.setEventHandlers({
        onJoinChannelSuccess: () => {
          if (mountedRef.current) setIsCallActive(true);
        },
        onUserJoined: (uid) => {
          if (!mountedRef.current) return;
          setRemoteUsers((prev) => (prev.includes(uid) ? prev : [...prev, uid]));
        },
        onUserOffline: (uid) => {
          if (!mountedRef.current) return;
          setRemoteUsers((prev) => prev.filter((id) => id !== uid));
        },
        onError: (err) => {
          console.error('Agora error:', err);
        },
      });

      const initResult = await videoCallService.initialize();
      if (!initResult.success) {
        throw new Error(initResult.error || 'Erro ao inicializar serviço de vídeo');
      }

      setIsMockMode(!!initResult.mock);

      const channelName = getTeleconsultChannelName(appointmentId);
      const agoraUid = toAgoraUid(userId);

      const joinResult = await videoCallService.joinChannel(channelName, agoraUid);
      if (!joinResult.success) {
        throw new Error(joinResult.error || 'Erro ao entrar no canal');
      }

      if (mountedRef.current) {
        setIsCallActive(true);
        setIsInitializing(false);
        onJoined?.({ mock: joinResult.mock, channelName, uid: agoraUid });
      }
    } catch (error) {
      console.error('Erro ao inicializar chamada:', error);
      if (mountedRef.current) {
        setCallError(error.message);
        setIsInitializing(false);
        Alert.alert(
          'Erro ao Iniciar Chamada',
          error.message || 'Não foi possível iniciar a chamada de vídeo.',
          [{ text: 'OK', onPress: () => navigation?.goBack?.() }]
        );
      }
    }
  }, [appointmentId, userId, onJoined, navigation]);

  useEffect(() => {
    mountedRef.current = true;

    if (!enabled) {
      setIsInitializing(false);
      return () => {
        mountedRef.current = false;
      };
    }

    initializeCall();

    return () => {
      mountedRef.current = false;
      endCall();
    };
  }, [enabled, initializeCall, endCall]);

  const primaryRemoteUid = remoteUsers.length > 0 ? remoteUsers[0] : null;

  return {
    isCallActive,
    isInitializing,
    callError,
    remoteUsers,
    primaryRemoteUid,
    isMockMode,
    endCall,
    retryCall: initializeCall,
  };
}

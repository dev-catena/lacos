import { useState, useEffect, useRef } from 'react';
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
  const [isJoined, setIsJoined] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [callError, setCallError] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [isMockMode, setIsMockMode] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const onJoinedRef = useRef(onJoined);
  const navigationRef = useRef(navigation);
  onJoinedRef.current = onJoined;
  navigationRef.current = navigation;

  const frozenUserIdRef = useRef(null);
  if (userId) {
    frozenUserIdRef.current = userId;
  }

  const appointmentIdRef = useRef(appointmentId);
  appointmentIdRef.current = appointmentId;

  const readyToCall = enabled && appointmentId && frozenUserIdRef.current;

  useEffect(() => {
    if (!enabled) {
      setIsInitializing(false);
      return undefined;
    }

    if (!readyToCall) {
      setIsInitializing(true);
      return undefined;
    }

    let cancelled = false;

    const startCall = async () => {
      try {
        setIsInitializing(true);
        setCallError(null);
        setRemoteUsers([]);
        setIsJoined(false);
        setIsCallActive(false);

        videoCallService.setEventHandlers({
          onJoinChannelSuccess: () => {
            if (cancelled) return;
            setIsJoined(true);
            setIsCallActive(true);
          },
          onUserJoined: (uid) => {
            if (cancelled) return;
            setRemoteUsers((prev) => (prev.includes(uid) ? prev : [...prev, uid]));
          },
          onUserOffline: (uid) => {
            if (cancelled) return;
            setRemoteUsers((prev) => prev.filter((id) => id !== uid));
          },
          onError: (err) => {
            console.error('Agora error:', err);
          },
        });

        const initResult = await videoCallService.initialize();
        if (cancelled) return;

        if (!initResult.success) {
          throw new Error(initResult.error || 'Erro ao inicializar serviço de vídeo');
        }

        setIsMockMode(!!initResult.mock);

        const channelName = getTeleconsultChannelName(appointmentIdRef.current);
        const agoraUid = toAgoraUid(frozenUserIdRef.current);

        const joinResult = await videoCallService.joinChannel(channelName, agoraUid);
        if (cancelled) return;

        if (!joinResult.success) {
          throw new Error(joinResult.error || 'Erro ao entrar no canal');
        }

        setIsCallActive(true);
        setIsInitializing(false);

        if (initResult.mock) {
          setIsJoined(true);
        }

        onJoinedRef.current?.({ mock: joinResult.mock, channelName, uid: agoraUid });
      } catch (error) {
        console.error('Erro ao inicializar chamada:', error);
        if (cancelled) return;

        setCallError(error.message);
        setIsInitializing(false);
        setIsCallActive(false);
        setIsJoined(false);

        Alert.alert(
          'Erro ao Iniciar Chamada',
          error.message || 'Não foi possível iniciar a chamada de vídeo.',
          [{ text: 'OK', onPress: () => navigationRef.current?.goBack?.() }]
        );
      }
    };

    startCall();

    return () => {
      cancelled = true;
      videoCallService.leaveChannel().catch(() => {});
      videoCallService.destroy().catch(() => {});
    };
  }, [enabled, readyToCall, appointmentId, retryKey]);

  const endCall = async () => {
    try {
      await videoCallService.leaveChannel();
      await videoCallService.destroy();
      setIsCallActive(false);
      setIsJoined(false);
      setRemoteUsers([]);
    } catch (error) {
      console.error('Erro ao encerrar chamada:', error);
    }
  };

  const retryCall = async () => {
    await videoCallService.destroy().catch(() => {});
    setCallError(null);
    setRetryKey((k) => k + 1);
  };

  const primaryRemoteUid = remoteUsers.length > 0 ? remoteUsers[0] : null;

  return {
    isCallActive,
    isJoined,
    isInitializing,
    callError,
    remoteUsers,
    primaryRemoteUid,
    isMockMode,
    endCall,
    retryCall,
  };
}

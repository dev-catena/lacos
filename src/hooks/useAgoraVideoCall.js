import { useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import videoCallService from '../services/videoCallService';
import appointmentService from '../services/appointmentService';
import {
  getTeleconsultChannelName,
  toAgoraUid,
  resolveAppointmentIdForVideo,
} from '../config/agora';

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
  const [localUid, setLocalUid] = useState(0);
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

  const resolvedAppointmentId = resolveAppointmentIdForVideo(appointmentId);
  const appointmentIdRef = useRef(resolvedAppointmentId);
  appointmentIdRef.current = resolvedAppointmentId;

  const readyToCall = enabled && resolvedAppointmentId && frozenUserIdRef.current;

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
        setLocalUid(0);

        videoCallService.setEventHandlers({
          onJoinChannelSuccess: (uid) => {
            if (cancelled) return;
            const resolved = Number(uid) || videoCallService.getLocalUid() || 0;
            setLocalUid(resolved);
            setIsJoined(true);
            setIsCallActive(true);
          },
          onUserJoined: (uid) => {
            if (cancelled) return;
            const n = Number(uid);
            if (!Number.isFinite(n) || n <= 0) return;
            setRemoteUsers((prev) => (prev.includes(n) ? prev : [...prev, n]));
          },
          onRemoteVideoReady: (uid) => {
            if (cancelled) return;
            const n = Number(uid);
            if (!Number.isFinite(n) || n <= 0) return;
            setRemoteUsers((prev) => (prev.includes(n) ? prev : [...prev, n]));
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

        const resolvedId = appointmentIdRef.current;
        let channelName = getTeleconsultChannelName(resolvedId);
        let agoraUid = toAgoraUid(frozenUserIdRef.current);
        let rtcToken = '';

        if (!initResult.mock) {
          const tokenResult = await appointmentService.getAgoraToken(resolvedId);
          if (cancelled) return;

          if (tokenResult.success && tokenResult.data?.success) {
            const { token, channel_name: apiChannel, uid: apiUid } = tokenResult.data;
            rtcToken = token || '';
            if (apiChannel) channelName = apiChannel;
            if (apiUid != null && Number(apiUid) > 0) {
              agoraUid = Number(apiUid);
            }
          } else {
            const errMsg = String(tokenResult.error || tokenResult.data?.message || '');
            const endpointMissing = /404|not found/i.test(errMsg);
            if (endpointMissing) {
              console.warn('⚠️ Endpoint agora-token indisponível — join legado sem token');
            } else {
              throw new Error(errMsg || 'Não foi possível obter token de vídeo');
            }
          }
        }

        console.log('📹 Agora join:', {
          channelName,
          agoraUid,
          appointmentId: resolvedId,
          hasToken: !!rtcToken,
        });

        const joinResult = await videoCallService.joinChannel(channelName, agoraUid, rtcToken);
        if (cancelled) return;

        if (!joinResult.success) {
          throw new Error(joinResult.error || 'Erro ao entrar no canal');
        }

        setIsCallActive(true);
        setIsInitializing(false);

        if (initResult.mock) {
          setIsJoined(true);
          setLocalUid(agoraUid);
        } else {
          const currentLocal = videoCallService.getLocalUid();
          if (currentLocal) {
            setLocalUid(currentLocal);
          }
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
  }, [enabled, readyToCall, resolvedAppointmentId, retryKey]);

  const endCall = async () => {
    try {
      await videoCallService.leaveChannel();
      await videoCallService.destroy();
      setIsCallActive(false);
      setIsJoined(false);
      setLocalUid(0);
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
    localUid,
    isMockMode,
    endCall,
    retryCall,
  };
}

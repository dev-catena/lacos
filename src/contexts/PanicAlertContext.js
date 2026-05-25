import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useAuth } from './AuthContext';
import panicService from '../services/panicService';
import { startPanicAlarm, stopPanicAlarm } from '../utils/panicAlarm';

const PanicAlertContext = createContext(null);

const POLL_INTERVAL_MS = 8000;

function buildSourceLabel(event) {
  if (!event) return '';
  if (event.trigger_type === 'watch') return 'Relógio inteligente';
  if (event.trigger_type === 'voice') return 'Comando de voz';
  return 'Botão de pânico';
}

export function PanicAlertProvider({ children }) {
  const { signed, user } = useAuth();
  const [activeEvent, setActiveEvent] = useState(null);
  const [dismissedIds, setDismissedIds] = useState([]);
  const dismissedIdsRef = useRef([]);
  const [disarming, setDisarming] = useState(false);
  const pollRef = useRef(null);
  const alarmActiveRef = useRef(false);

  const syncAlarm = useCallback(async (shouldPlay) => {
    if (shouldPlay && !alarmActiveRef.current) {
      alarmActiveRef.current = true;
      await startPanicAlarm();
      return;
    }
    if (!shouldPlay && alarmActiveRef.current) {
      alarmActiveRef.current = false;
      await stopPanicAlarm();
    }
  }, []);

  const showEvent = useCallback((event) => {
    if (!event?.id) return;
    if (dismissedIdsRef.current.includes(event.id)) return;
    setActiveEvent((current) => {
      if (current?.id === event.id) return current;
      return event;
    });
  }, []);

  const activateFromTrigger = useCallback((payload) => {
    const event = payload?.panic_event ?? payload;
    if (!event?.id) return;
    showEvent({
      ...event,
      user_name: event.user_name ?? user?.name,
      emergency_contacts: payload?.emergency_contacts ?? [],
    });
  }, [showEvent, user?.name]);

  const pollActivePanics = useCallback(async () => {
    if (!signed || !user) return;

    try {
      const response = await panicService.getActiveEvents();
      if (!response?.success || !Array.isArray(response.data)) return;

      const ongoing = response.data.filter((item) => item.call_status === 'ongoing');
      if (ongoing.length === 0) {
        setActiveEvent(null);
        return;
      }

      const dismissed = dismissedIdsRef.current;
      const next = ongoing.find((item) => !dismissed.includes(item.id)) ?? null;
      if (next) {
        showEvent(next);
      } else {
        setActiveEvent(null);
      }
    } catch (error) {
      console.warn('PanicAlert: falha ao consultar pânicos ativos', error?.message || error);
    }
  }, [signed, user, showEvent]);

  useEffect(() => {
    dismissedIdsRef.current = dismissedIds;
  }, [dismissedIds]);

  useEffect(() => {
    syncAlarm(!!activeEvent);
    return () => {
      stopPanicAlarm();
      alarmActiveRef.current = false;
    };
  }, [activeEvent, syncAlarm]);

  useEffect(() => {
    if (!signed || !user) {
      setActiveEvent(null);
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return undefined;
    }

    pollActivePanics();
    pollRef.current = setInterval(pollActivePanics, POLL_INTERVAL_MS);

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        pollActivePanics();
      }
    });

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      sub.remove();
    };
  }, [signed, user, pollActivePanics]);

  const disarmPanic = useCallback(async () => {
    if (!activeEvent?.id || disarming) return;

    setDisarming(true);
    try {
      await panicService.disarm(activeEvent.id, {
        status: 'completed',
        duration: 0,
      });
      setDismissedIds((prev) => {
        const next = [...prev, activeEvent.id];
        dismissedIdsRef.current = next;
        return next;
      });
      setActiveEvent(null);
    } catch (error) {
      console.error('PanicAlert: erro ao desarmar', error);
      throw error;
    } finally {
      setDisarming(false);
    }
  }, [activeEvent, disarming]);

  const value = useMemo(() => ({
    activeEvent,
    disarming,
    activateFromTrigger,
    disarmPanic,
    sourceLabel: buildSourceLabel(activeEvent),
    isCaregiverView: activeEvent ? activeEvent.user_id !== user?.id : false,
  }), [activeEvent, disarming, activateFromTrigger, disarmPanic, user?.id]);

  return (
    <PanicAlertContext.Provider value={value}>
      {children}
    </PanicAlertContext.Provider>
  );
}

export function usePanicAlert() {
  const ctx = useContext(PanicAlertContext);
  if (!ctx) {
    throw new Error('usePanicAlert deve ser usado dentro de PanicAlertProvider');
  }
  return ctx;
}

export default PanicAlertContext;

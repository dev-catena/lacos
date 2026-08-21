import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigationState } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import groupService from '../../services/groupService';
import websocketService from '../../services/websocketService';
import { dispatchBraceletRemoteMeasure } from '../../services/braceletRemoteMeasure';
import PulseiraVitalPanel from '../VitalSigns/components/PulseiraVitalPanel';

function routeNamesInState(state, acc = []) {
  if (!state?.routes?.length) return acc;
  const route = state.routes[state.index ?? 0];
  if (route?.name) acc.push(route.name);
  if (route?.state) return routeNamesInState(route.state, acc);
  return acc;
}

/**
 * Uma única instância BLE do paciente: permanece montada o tempo todo
 * (não desconecta ao sair/entrar em Configuração). Na tela Configuração
 * o painel fica visível; nas demais abas fica oculto mas conectado.
 */
export default function PatientBraceletHost() {
  const insets = useSafeAreaInsets();
  const [groupId, setGroupId] = useState(null);
  const onSettingsScreen = useNavigationState((state) =>
    routeNamesInState(state).includes('PatientSettings'),
  );

  const loadGroup = useCallback(async () => {
    try {
      const groupsResult = await groupService.getMyGroups();
      if (!groupsResult.success || !groupsResult.data?.length) {
        setGroupId(null);
        return;
      }
      setGroupId(groupsResult.data[0].id);
    } catch {
      setGroupId(null);
    }
  }, []);

  useEffect(() => {
    void loadGroup();
  }, [loadGroup]);

  useEffect(() => {
    if (!groupId) return undefined;
    let unsub = () => {};
    (async () => {
      try {
        await websocketService.initialize();
        unsub = websocketService.onBraceletMeasure(groupId, (data) => {
          void dispatchBraceletRemoteMeasure(data);
        });
      } catch (e) {
        console.warn('[PatientBraceletHost] ws measure', e?.message || e);
      }
    })();
    return () => {
      unsub();
    };
  }, [groupId]);

  if (!groupId) {
    return null;
  }

  return (
    <View
      style={
        onSettingsScreen
          ? [styles.settingsPanel, { top: insets.top + 56 }]
          : styles.host
      }
      pointerEvents={onSettingsScreen ? 'auto' : 'none'}
    >
      {onSettingsScreen ? (
        <View style={styles.introCard}>
          <Ionicons name="watch-outline" size={22} color={colors.primary} />
          <Text style={styles.introText}>
            Pareie a pulseira V5 ou V8 neste celular (perto do paciente). As leituras vão
            automaticamente para o grupo a cada 5 minutos enquanto o app estiver aberto.
            A conexão permanece ativa; só desconecta ao trocar de pulseira.
          </Text>
        </View>
      ) : null}
      <PulseiraVitalPanel
        groupId={groupId}
        active
        allowConnect
        patientMode
      />
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    overflow: 'hidden',
  },
  settingsPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    zIndex: 30,
  },
  introCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  introText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textLight,
  },
});

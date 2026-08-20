import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigationState } from '@react-navigation/native';
import groupService from '../../services/groupService';
import PulseiraVitalPanel from '../VitalSigns/components/PulseiraVitalPanel';

function routeNamesInState(state, acc = []) {
  if (!state?.routes?.length) return acc;
  const route = state.routes[state.index ?? 0];
  if (route?.name) acc.push(route.name);
  if (route?.state) return routeNamesInState(route.state, acc);
  return acc;
}

/**
 * Mantém BLE + auto-gravação (5 min) enquanto o paciente usa o app.
 * Desliga quando a tela Configuração está aberta (lá já há o painel visível),
 * para não haver dois BleManagers ao mesmo tempo.
 */
export default function PatientBraceletHost() {
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

  if (!groupId || onSettingsScreen) {
    return null;
  }

  return (
    <View style={styles.host} pointerEvents="none">
      <PulseiraVitalPanel groupId={groupId} active={false} allowConnect patientMode />
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
});

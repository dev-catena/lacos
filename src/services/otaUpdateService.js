import { Alert } from 'react-native';
import * as Updates from 'expo-updates';
import Toast from 'react-native-toast-message';

export function getOtaInfo() {
  return {
    enabled: !!Updates.isEnabled,
    updateId: Updates.updateId || null,
    createdAt: Updates.createdAt || null,
    channel: Updates.channel || null,
    isEmbedded: !!Updates.isEmbeddedLaunch,
  };
}

export function formatOtaDate(date) {
  if (!date) return '—';
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('pt-BR');
}

export function describeCurrentOta() {
  const info = getOtaInfo();
  if (info.isEmbedded || !info.updateId) {
    return 'Rodando o binário original (sem OTA aplicado)';
  }
  return `OTA ${info.updateId}`;
}

/**
 * Consulta o canal EAS, baixa se houver versão nova e pede para reiniciar.
 */
export async function checkAndApplyOtaUpdate() {
  if (!Updates.isEnabled) {
    Alert.alert(
      'Atualização OTA',
      'OTA não está disponível neste build. Use o app da loja ou o APK EAS (não o Expo Go).',
    );
    return { ok: false, reason: 'disabled' };
  }

  const check = await Updates.checkForUpdateAsync();
  if (!check.isAvailable) {
    Toast.show({
      type: 'success',
      text1: 'App atualizado',
      text2: infoChannelHint(),
    });
    return { ok: true, reason: 'up-to-date' };
  }

  Toast.show({
    type: 'info',
    text1: 'Baixando atualização…',
    text2: 'Aguarde o download da nova versão.',
  });
  await Updates.fetchUpdateAsync();
  Alert.alert(
    'Atualização pronta',
    'Uma nova versão foi baixada. O app será reiniciado para aplicá-la.',
    [
      { text: 'Agora não', style: 'cancel' },
      {
        text: 'Reiniciar agora',
        onPress: () => {
          Updates.reloadAsync().catch((e) => {
            Alert.alert('Erro', e?.message || 'Não foi possível reiniciar.');
          });
        },
      },
    ],
  );
  return { ok: true, reason: 'downloaded' };
}

function infoChannelHint() {
  const channel = Updates.channel;
  return channel
    ? `Não há nova versão no canal ${channel}.`
    : 'Não há nova versão OTA no canal.';
}

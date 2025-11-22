import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MEDICATIONS_STORAGE_KEY = '@lacos_medications';

// Configurar como as notificações devem ser tratadas quando o app está em primeiro plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Solicita permissão para enviar notificações
 */
export const requestNotificationPermission = async () => {
  try {
    if (!Device.isDevice) {
      console.log('Notificações não funcionam em simulador');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      Alert.alert(
        'Permissão Negada',
        'Você não receberá lembretes dos medicamentos. Ative nas configurações do dispositivo.'
      );
      return false;
    }

    // Configurar canal de notificação (Android)
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('medication-reminders', {
        name: 'Lembretes de Medicamentos',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        sound: 'default',
        lightColor: '#FF6B6B',
      });
    }

    return true;
  } catch (error) {
    console.error('Erro ao solicitar permissão de notificação:', error);
    return false;
  }
};

/**
 * Agenda notificações para um medicamento específico
 */
export const scheduleMedicationNotifications = async (medication) => {
  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      return;
    }

    // Cancelar notificações anteriores deste medicamento
    await cancelMedicationNotifications(medication.id);

    // Agendar notificações para cada horário
    const notificationIds = [];

    for (const time of medication.schedule) {
      const [hours, minutes] = time.split(':').map(Number);

      // Criar identificador de notificação
      const trigger = {
        hour: hours,
        minute: minutes,
        repeats: true,
      };

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `💊 ${medication.name}`,
          body: `Hora de tomar ${medication.dosage} ${medication.unit}`,
          data: {
            medicationId: medication.id,
            scheduledTime: time,
            medicationName: medication.name,
          },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          categoryIdentifier: 'medication-reminder',
        },
        trigger,
      });

      notificationIds.push(notificationId);

      console.log(`✅ Notificação agendada: ${medication.name} às ${time} (ID: ${notificationId})`);
    }

    // Salvar IDs das notificações
    await saveMedicationNotificationIds(medication.id, notificationIds);

    return notificationIds;
  } catch (error) {
    console.error('Erro ao agendar notificações:', error);
    throw error;
  }
};

/**
 * Cancela todas as notificações de um medicamento
 */
export const cancelMedicationNotifications = async (medicationId) => {
  try {
    const notificationIds = await getMedicationNotificationIds(medicationId);
    
    if (notificationIds && notificationIds.length > 0) {
      for (const notifId of notificationIds) {
        await Notifications.cancelScheduledNotificationAsync(notifId);
      }
      console.log(`🗑️  ${notificationIds.length} notificação(ões) cancelada(s) para medicamento ${medicationId}`);
    }

    // Remover IDs salvos
    await AsyncStorage.removeItem(`@notification_ids_${medicationId}`);
  } catch (error) {
    console.error('Erro ao cancelar notificações:', error);
  }
};

/**
 * Reagenda todas as notificações de medicamentos ativos
 */
export const rescheduleAllMedications = async () => {
  try {
    const medsJson = await AsyncStorage.getItem(MEDICATIONS_STORAGE_KEY);
    if (!medsJson) {
      return;
    }

    const medications = JSON.parse(medsJson);
    const activeMeds = medications.filter(med => med.active);

    console.log(`📅 Reagendando notificações para ${activeMeds.length} medicamento(s)...`);

    for (const med of activeMeds) {
      await scheduleMedicationNotifications(med);
    }

    console.log('✅ Todas as notificações foram reagendadas');
  } catch (error) {
    console.error('Erro ao reagendar notificações:', error);
  }
};

/**
 * Salva os IDs das notificações de um medicamento
 */
const saveMedicationNotificationIds = async (medicationId, notificationIds) => {
  try {
    await AsyncStorage.setItem(
      `@notification_ids_${medicationId}`,
      JSON.stringify(notificationIds)
    );
  } catch (error) {
    console.error('Erro ao salvar IDs de notificação:', error);
  }
};

/**
 * Recupera os IDs das notificações de um medicamento
 */
const getMedicationNotificationIds = async (medicationId) => {
  try {
    const idsJson = await AsyncStorage.getItem(`@notification_ids_${medicationId}`);
    return idsJson ? JSON.parse(idsJson) : [];
  } catch (error) {
    console.error('Erro ao recuperar IDs de notificação:', error);
    return [];
  }
};

/**
 * Lista todas as notificações agendadas (debug)
 */
export const getAllScheduledNotifications = async () => {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log('📋 Notificações agendadas:', notifications.length);
    notifications.forEach((notif, index) => {
      console.log(`  ${index + 1}. ${notif.content.title} - Trigger:`, notif.trigger);
    });
    return notifications;
  } catch (error) {
    console.error('Erro ao listar notificações:', error);
    return [];
  }
};

/**
 * Cancela todas as notificações do app
 */
export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('🗑️  Todas as notificações foram canceladas');
  } catch (error) {
    console.error('Erro ao cancelar todas as notificações:', error);
  }
};

/**
 * Configura listeners para notificações
 */
export const setupNotificationListeners = () => {
  // Listener para quando uma notificação é recebida enquanto o app está aberto
  const receivedListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('📬 Notificação recebida:', notification);
  });

  // Listener para quando o usuário interage com a notificação
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('👆 Usuário interagiu com notificação:', response);
    const data = response.notification.request.content.data;
    
    // Aqui você pode navegar para a tela de detalhes do medicamento
    if (data.medicationId) {
      // navigation.navigate('MedicationDetails', { medicationId: data.medicationId });
    }
  });

  return () => {
    Notifications.removeNotificationSubscription(receivedListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
};

export default {
  requestNotificationPermission,
  scheduleMedicationNotifications,
  cancelMedicationNotifications,
  rescheduleAllMedications,
  getAllScheduledNotifications,
  cancelAllNotifications,
  setupNotificationListeners,
};


import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import colors from '../../constants/colors';
import notificationApiService from '../../services/notificationApiService';
import moment from 'moment';
import 'moment/locale/pt-br';
moment.locale('pt-br');

const NotificationsScreen = ({ navigation }) => {
  const [filter, setFilter] = useState('todas'); // todas, lidas, nao-lidas
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Carregar notificações quando a tela recebe foco
  useFocusEffect(
    React.useCallback(() => {
      loadNotifications();
      // Forçar atualização do contador no tab bar quando a tela receber foco
      // Isso garante que o contador seja atualizado quando voltar para esta tela
    }, [])
  );

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const result = await notificationApiService.getNotifications({ limit: 50 });
      
      if (result.success && result.data) {
        const formattedNotifications = result.data.map(notification => {
          const createdAt = moment(notification.created_at);
          
          // Determinar ícone e cor baseado no tipo
          let icon = 'notifications';
          let color = colors.primary;
          
          switch (notification.type) {
            case 'appointment':
              icon = 'calendar';
              color = colors.warning;
              break;
            case 'vital_sign':
              icon = 'pulse';
              color = colors.error;
              break;
            default:
              icon = 'notifications';
              color = colors.primary;
          }
          
          return {
            id: notification.id,
            type: notification.type,
            icon: icon,
            color: color,
            title: notification.title,
            message: notification.message,
            time: createdAt.fromNow(),
            dateTime: createdAt.format('DD/MM/YYYY [às] HH:mm'),
            timestamp: notification.created_at,
            read: notification.read || false,
            readAt: notification.read_at,
            data: notification.data || {},
            metadata: notification.data || {},
            action_type: notification.data?.action_type || notification.action_type || null,
            groupId: notification.data?.group_id || notification.group_id || null,
            groupName: notification.data?.group_name || 'Sistema',
          };
        });
        
        setNotifications(formattedNotifications);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const result = await notificationApiService.markAllAsRead();
      if (result.success) {
        // Recarregar notificações
        await loadNotifications();
        // Forçar atualização do contador no tab bar
        // O CustomTabBar vai atualizar quando a tela receber foco novamente
      }
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  const handleDeleteAll = async () => {
    Alert.alert(
      'Limpar Notificações',
      'Tem certeza que deseja excluir todas as notificações? Esta ação não pode ser desfeita.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await notificationApiService.deleteAllNotifications();
              if (result.success) {
                await loadNotifications();
              } else {
                Alert.alert('Erro', result.error || 'Não foi possível limpar as notificações');
              }
            } catch (error) {
              console.error('Erro ao limpar notificações:', error);
              Alert.alert('Erro', 'Não foi possível limpar as notificações');
            }
          },
        },
      ]
    );
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      const result = await notificationApiService.deleteNotification(notificationId);
      if (result.success) {
        // Remover da lista local
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      } else {
        Alert.alert('Erro', result.error || 'Não foi possível excluir a notificação');
      }
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
      Alert.alert('Erro', 'Não foi possível excluir a notificação');
    }
  };

  // Mapear tipo de notificação para o card correto no GroupDetail
  const getCardFromNotificationType = (notification) => {
    // Verificar se há metadata com action_type (atividades)
    const actionType = notification.metadata?.action_type || notification.action_type;
    const notificationType = notification.type;

    // Mapear tipos de atividade/notificação para cards
    const cardMap = {
      // Agenda
      'appointment_cancelled': 'agenda',
      'appointment_created': 'agenda',
      'consultation_created': 'agenda',
      'appointment': 'agenda',
      
      // Medicamentos
      'medication_created': 'medications',
      'medication_updated': 'medications',
      'medication_discontinued': 'medications',
      'medication_completed': 'medications',
      'medication': 'medications',
      
      // Documentos
      'document_created': 'documents',
      'document': 'documents',
      
      // Receitas
      'prescription_created': 'prescriptions',
      'prescription': 'prescriptions',
      
      // Sinais Vitais
      'vital_sign_recorded': 'vitalsigns',
      'vital_sign': 'vitalsigns',
    };

    return cardMap[actionType] || cardMap[notificationType] || null;
  };

  const handleNotificationPress = async (notification) => {
    // Marcar como lida se ainda não estiver lida
    if (!notification.read) {
      try {
        await notificationApiService.markAsRead(notification.id);
        // Atualizar estado local
        setNotifications(prev => 
          prev.map(n => 
            n.id === notification.id 
              ? { ...n, read: true, readAt: new Date().toISOString() }
              : n
          )
        );
      } catch (error) {
        console.error('Erro ao marcar notificação como lida:', error);
      }
    }

    // Navegar para o grupo se tiver groupId
    if (notification.groupId) {
      const targetCard = getCardFromNotificationType(notification);
      
      navigation.navigate('GroupDetail', {
        groupId: notification.groupId,
        groupName: notification.groupName,
        openCard: targetCard, // Parâmetro para indicar qual card abrir
      });
    }
  };

  // Filtrar notificações baseado no filtro selecionado
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'todas') return true;
    if (filter === 'nao-lidas') return !notification.read;
    if (filter === 'lidas') return notification.read;
    return true;
  });

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Notificações</Text>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person-circle-outline" size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.headerBottom}>
          <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.headerActionButton}>
            <Text style={styles.markAllRead}>Marcar todas como lidas</Text>
          </TouchableOpacity>
          {notifications.length > 0 && (
            <TouchableOpacity onPress={handleDeleteAll} style={styles.headerActionButton}>
              <Ionicons name="trash-outline" size={18} color={colors.error} />
              <Text style={styles.clearAllText}>Limpar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filtros */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'todas' && styles.filterButtonActive]}
          onPress={() => setFilter('todas')}
        >
          <Text style={[styles.filterText, filter === 'todas' && styles.filterTextActive]}>
            Todas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'nao-lidas' && styles.filterButtonActive]}
          onPress={() => setFilter('nao-lidas')}
        >
          <Text style={[styles.filterText, filter === 'nao-lidas' && styles.filterTextActive]}>
            Não lidas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'lidas' && styles.filterButtonActive]}
          onPress={() => setFilter('lidas')}
        >
          <Text style={[styles.filterText, filter === 'lidas' && styles.filterTextActive]}>
            Lidas
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Carregando notificações...</Text>
          </View>
        ) : filteredNotifications.length > 0 ? (
          <View style={styles.notificationsList}>
            {filteredNotifications.map((notification) => (
              <View
                key={notification.id}
                style={[
                  styles.notificationCard,
                  !notification.read && styles.notificationCardUnread,
                ]}
              >
                <TouchableOpacity
                  style={styles.notificationCardContent}
                  onPress={() => handleNotificationPress(notification)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.notificationIcon, { backgroundColor: notification.color + '20' }]}>
                    <Ionicons name={notification.icon} size={24} color={notification.color} />
                  </View>
                  <View style={styles.notificationContent}>
                    <Text style={styles.notificationTitle}>{notification.title}</Text>
                    <Text style={styles.notificationMessage}>{notification.message}</Text>
                    <View style={styles.notificationMeta}>
                      <Text style={styles.notificationGroup}>{notification.groupName}</Text>
                      <Text style={styles.notificationTime}>• {notification.time}</Text>
                    </View>
                    <Text style={styles.notificationDateTime}>{notification.dateTime}</Text>
                  </View>
                  {!notification.read && <View style={styles.unreadDot} />}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteNotification(notification.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={64} color={colors.gray300} />
            <Text style={styles.emptyTitle}>Nenhuma notificação</Text>
            <Text style={styles.emptyText}>
              {filter === 'todas' 
                ? 'Você está em dia! Não há notificações no momento.'
                : filter === 'nao-lidas'
                ? 'Todas as notificações foram lidas.'
                : 'Nenhuma notificação lida.'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerBottom: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 16,
  },
  headerActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearAllText: {
    fontSize: 14,
    color: colors.error,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  markAllRead: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  filterTextActive: {
    color: colors.textWhite,
  },
  notificationsList: {
    paddingHorizontal: 20,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  notificationCardContent: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
  },
  deleteButton: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.error + '10',
  },
  notificationCardUnread: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
    marginBottom: 6,
  },
  notificationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  notificationGroup: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  notificationTime: {
    fontSize: 12,
    color: colors.gray400,
  },
  notificationDateTime: {
    fontSize: 11,
    color: colors.gray400,
    marginTop: 4,
    fontStyle: 'italic',
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: colors.textLight,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginLeft: 8,
  },
  emptyState: {
    paddingHorizontal: 40,
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default NotificationsScreen;


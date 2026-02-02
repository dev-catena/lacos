import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import colors from '../../constants/colors';
import activityService from '../../services/activityService';
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
    }, [])
  );

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const result = await activityService.getRecentActivities(50);
      
      if (result.success && result.data) {
        // Filtrar apenas notificações (tipos específicos)
        const notificationTypes = [
          'medication_created',
          'medication_updated',
          'medication_discontinued',
          'medication_completed',
          'prescription_created',
          'consultation_created',
          'appointment_created',
          'occurrence_created',
          'document_created',
          'member_joined',
          'member_promoted',
          'member_removed',
          'group_photo_updated',
          'vital_sign_recorded',
          'smartwatch_registered',
          'caregiver_hired',
        ];
        
        const formattedNotifications = result.data
          .filter(activity => notificationTypes.includes(activity.action_type))
          .map(activity => {
            const createdAt = moment(activity.created_at);
            return {
              id: activity.id,
              type: activity.action_type,
              icon: activityService.getActivityIcon(activity.action_type),
              color: activityService.getActivityColor(activity.action_type),
              title: activityService.getActivityTypeLabel(activity.action_type),
              message: activity.description || activityService.getActivityTypeLabel(activity.action_type),
              time: createdAt.fromNow(),
              dateTime: createdAt.format('DD/MM/YYYY [às] HH:mm'),
              timestamp: activity.created_at,
              read: false, // Por enquanto todas são não lidas
              groupName: activity.group?.name || activity.group_name || 'Grupo',
              groupId: activity.group_id || activity.group?.id,
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
          <TouchableOpacity onPress={() => {}}>
            <Text style={styles.markAllRead}>Marcar todas como lidas</Text>
          </TouchableOpacity>
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
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationCard,
                  !notification.read && styles.notificationCardUnread,
                ]}
                onPress={() => {
                  // Navegar para o grupo se tiver groupId
                  if (notification.groupId) {
                    navigation.navigate('GroupDetail', {
                      groupId: notification.groupId,
                      groupName: notification.groupName,
                    });
                  }
                }}
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
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
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


import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';

const NotificationsScreen = () => {
  const [filter, setFilter] = useState('todas'); // todas, lidas, nao-lidas

  // Mock de notificações para demonstração
  const mockNotifications = [
    {
      id: '1',
      type: 'medication',
      icon: 'medical',
      color: colors.primary,
      title: 'Hora da medicação',
      message: 'Lembrete: Administrar medicação às 14:00',
      time: '2 horas atrás',
      read: false,
    },
    {
      id: '2',
      type: 'appointment',
      icon: 'calendar',
      color: colors.warning,
      title: 'Consulta amanhã',
      message: 'Consulta cardiológica agendada para amanhã às 10:00',
      time: '5 horas atrás',
      read: false,
    },
    {
      id: '3',
      type: 'group',
      icon: 'people',
      color: colors.secondary,
      title: 'Novo membro no grupo',
      message: 'Maria Silva foi adicionada ao grupo',
      time: '1 dia atrás',
      read: true,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Notificações</Text>
        <TouchableOpacity>
          <Text style={styles.markAllRead}>Marcar todas como lidas</Text>
        </TouchableOpacity>
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
        {/* Lista de notificações */}
        <View style={styles.notificationsList}>
          {mockNotifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationCard,
                !notification.read && styles.notificationCardUnread,
              ]}
            >
              <View style={[styles.notificationIcon, { backgroundColor: notification.color + '20' }]}>
                <Ionicons name={notification.icon} size={24} color={notification.color} />
              </View>
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <Text style={styles.notificationMessage}>{notification.message}</Text>
                <Text style={styles.notificationTime}>{notification.time}</Text>
              </View>
              {!notification.read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Empty State - pode ser mostrado quando não há notificações */}
        {/* <View style={styles.emptyState}>
          <Ionicons name="notifications-off-outline" size={64} color={colors.gray300} />
          <Text style={styles.emptyTitle}>Nenhuma notificação</Text>
          <Text style={styles.emptyText}>
            Você está em dia! Não há notificações no momento.
          </Text>
        </View> */}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  markAllRead: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
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
  notificationTime: {
    fontSize: 12,
    color: colors.gray400,
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


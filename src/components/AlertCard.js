import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../constants/colors';
import moment from 'moment';

const AlertCard = ({ alert, onMarkAsTaken, onDismiss }) => {
  const getAlertConfig = () => {
    switch (alert.type) {
      case 'medication':
        return {
          icon: 'medical',
          iconColor: '#FF6B6B',
          backgroundColor: '#FFE5E5',
          title: 'Lembrete de Medicamento',
        };
      case 'appointment':
        return {
          icon: 'calendar',
          iconColor: '#4ECDC4',
          backgroundColor: '#E0F7F7',
          title: 'Lembrete de Consulta',
        };
      case 'vital_signs':
        return {
          icon: 'heart-circle',
          iconColor: '#FF6B6B',
          backgroundColor: '#FFE5E5',
          title: 'Alerta de Sinais Vitais',
        };
      case 'sedentary':
        return {
          icon: 'walk',
          iconColor: '#FFA94D',
          backgroundColor: '#FFF3E0',
          title: 'Alerta de Sedentarismo',
        };
      default:
        return {
          icon: 'notifications',
          iconColor: colors.primary,
          backgroundColor: colors.lightGray,
          title: 'Notificação',
        };
    }
  };

  const config = getAlertConfig();

  const handleOpenMaps = () => {
    if (alert.location) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(alert.location)}`;
      Linking.openURL(url);
    }
  };

  const handleOpenWaze = () => {
    if (alert.location) {
      const url = `https://waze.com/ul?q=${encodeURIComponent(alert.location)}`;
      Linking.openURL(url);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: config.backgroundColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: config.iconColor }]}>
          <Ionicons name={config.icon} size={24} color="#FFFFFF" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{config.title}</Text>
          {alert.time && (
            <Text style={styles.time}>
              {moment(alert.time).format('HH:mm')}
            </Text>
          )}
        </View>
        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.message}>{alert.message}</Text>
        
        {alert.details && (
          <Text style={styles.details}>{alert.details}</Text>
        )}

        {/* Medication specific */}
        {alert.type === 'medication' && alert.medication_name && (
          <View style={styles.medicationInfo}>
            <Text style={styles.medicationName}>{alert.medication_name}</Text>
            {alert.dosage && (
              <Text style={styles.dosage}>{alert.dosage}</Text>
            )}
          </View>
        )}

        {/* Vital signs specific */}
        {alert.type === 'vital_signs' && alert.value && (
          <View style={styles.vitalInfo}>
            <Text style={styles.vitalValue}>{alert.value}</Text>
            {alert.normal_range && (
              <Text style={styles.normalRange}>
                Normal: {alert.normal_range}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {/* Mark as taken (medications) */}
        {alert.type === 'medication' && onMarkAsTaken && (
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryAction]}
            onPress={onMarkAsTaken}
          >
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Marcar como Tomado</Text>
          </TouchableOpacity>
        )}

        {/* Location buttons (appointments) */}
        {alert.type === 'appointment' && alert.location && (
          <View style={styles.locationButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryAction]}
              onPress={handleOpenMaps}
            >
              <Ionicons name="navigate" size={18} color={colors.primary} />
              <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                Google Maps
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryAction]}
              onPress={handleOpenWaze}
            >
              <Ionicons name="navigate-circle" size={18} color={colors.primary} />
              <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                Waze
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 12,
    borderRadius: 16,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  time: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 8,
  },
  details: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  medicationInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 8,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  dosage: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  vitalInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 8,
    alignItems: 'center',
  },
  vitalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF6B6B',
    marginBottom: 4,
  },
  normalRange: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  actions: {
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  primaryAction: {
    backgroundColor: colors.primary,
  },
  secondaryAction: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  locationButtons: {
    flexDirection: 'row',
    gap: 8,
  },
});

export default AlertCard;


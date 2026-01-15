import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import colors from '../../constants/colors';
import { ArrowBackIcon } from '../../components/CustomIcons';
import appointmentService from '../../services/appointmentService';
import apiService from '../../services/apiService';

const PaymentStatusScreen = ({ route, navigation }) => {
  const { appointmentId, appointment } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [isMock, setIsMock] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadPaymentStatus();
    }, [appointmentId])
  );

  const loadPaymentStatus = async () => {
    try {
      setLoading(true);
      const response = await apiService.get(`/appointments/${appointmentId}/payment-status`, {
        requiresAuth: true,
      });
      
      if (response && response.success) {
        setPaymentStatus(response);
        setIsMock(response.is_mock || false);
      } else {
        Alert.alert('Erro', 'Não foi possível carregar o status do pagamento');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Erro ao carregar status:', error);
      Alert.alert('Erro', 'Não foi possível carregar o status do pagamento');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return colors.warning;
      case 'paid_held':
        return colors.info;
      case 'released':
        return colors.success;
      case 'refunded':
        return colors.error;
      default:
        return colors.gray400;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Aguardando Pagamento';
      case 'paid_held':
        return 'Pagamento em Hold';
      case 'released':
        return 'Pagamento Liberado';
      case 'refunded':
        return 'Reembolsado';
      default:
        return status;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return 'time-outline';
      case 'paid_held':
        return 'lock-closed-outline';
      case 'released':
        return 'checkmark-circle-outline';
      case 'refunded':
        return 'arrow-undo-outline';
      default:
        return 'information-circle-outline';
    }
  };

  const formatCurrency = (value) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando status...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Tarja de Mockup */}
      {isMock && (
        <View style={styles.mockupBanner}>
          <Ionicons name="warning" size={16} color={colors.warning} />
          <Text style={styles.mockupBannerText}>
            MOCKUP - Sistema de pagamento em modo de teste
          </Text>
        </View>
      )}
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ArrowBackIcon size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Status do Pagamento</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Status Card */}
        <View style={[styles.statusCard, { borderColor: getStatusColor(paymentStatus?.payment_status) }]}>
          <View style={[styles.statusIconContainer, { backgroundColor: getStatusColor(paymentStatus?.payment_status) + '20' }]}>
            <Ionicons 
              name={getStatusIcon(paymentStatus?.payment_status)} 
              size={48} 
              color={getStatusColor(paymentStatus?.payment_status)} 
            />
          </View>
          <Text style={styles.statusLabel}>
            {getStatusLabel(paymentStatus?.payment_status)}
          </Text>
          {paymentStatus?.payment_status === 'paid_held' && (
            <Text style={styles.statusSubtext}>
              O pagamento está em hold e será liberado após a consulta
            </Text>
          )}
        </View>

        {/* Informações do Pagamento */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Informações do Pagamento</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Valor:</Text>
            <Text style={styles.infoValue}>{formatCurrency(paymentStatus?.amount)}</Text>
          </View>
          
          {paymentStatus?.payment_id && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>ID do Pagamento:</Text>
              <Text style={styles.infoValueSmall}>{paymentStatus.payment_id}</Text>
            </View>
          )}
          
          {paymentStatus?.hold_id && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>ID do Hold:</Text>
              <Text style={styles.infoValueSmall}>{paymentStatus.hold_id}</Text>
            </View>
          )}
          
          {paymentStatus?.held_at && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Data do Pagamento:</Text>
              <Text style={styles.infoValue}>
                {new Date(paymentStatus.held_at).toLocaleString('pt-BR')}
              </Text>
            </View>
          )}
          
          {paymentStatus?.scheduled_at && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Data da Consulta:</Text>
              <Text style={styles.infoValue}>
                {new Date(paymentStatus.scheduled_at).toLocaleString('pt-BR')}
              </Text>
            </View>
          )}
          
          {paymentStatus?.time_until_auto_release && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Liberação Automática:</Text>
              <Text style={styles.infoValue}>
                {paymentStatus.time_until_auto_release}
              </Text>
            </View>
          )}
        </View>

        {/* Ações */}
        {paymentStatus?.payment_status === 'paid_held' && (
          <View style={styles.actionsCard}>
            <Text style={styles.actionsTitle}>Ações Disponíveis</Text>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.confirmButton]}
              onPress={async () => {
                try {
                  const response = await apiService.post(`/appointments/${appointmentId}/confirm`, {}, {
                    requiresAuth: true,
                  });
                  
                  if (response && response.success) {
                    Alert.alert(
                      'Sucesso',
                      'Consulta confirmada! O pagamento foi liberado.',
                      [{ text: 'OK', onPress: () => navigation.goBack() }]
                    );
                  } else {
                    Alert.alert('Erro', 'Não foi possível confirmar a consulta');
                  }
                } catch (error) {
                  console.error('Erro ao confirmar:', error);
                  Alert.alert('Erro', 'Não foi possível confirmar a consulta');
                }
              }}
            >
              <Ionicons name="checkmark-circle" size={20} color={colors.textWhite} />
              <Text style={styles.actionButtonText}>Confirmar Consulta Realizada</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => {
                Alert.alert(
                  'Cancelar Consulta',
                  'Tem certeza que deseja cancelar? O valor será reembolsado.',
                  [
                    { text: 'Não', style: 'cancel' },
                    {
                      text: 'Sim',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          const response = await apiService.post(
                            `/appointments/${appointmentId}/cancel`,
                            { cancelled_by: 'patient', reason: 'Cancelado pelo paciente' },
                            { requiresAuth: true }
                          );
                          
                          if (response && response.success) {
                            Alert.alert(
                              'Sucesso',
                              'Consulta cancelada! O reembolso será processado.',
                              [{ text: 'OK', onPress: () => navigation.goBack() }]
                            );
                          } else {
                            Alert.alert('Erro', 'Não foi possível cancelar a consulta');
                          }
                        } catch (error) {
                          console.error('Erro ao cancelar:', error);
                          Alert.alert('Erro', 'Não foi possível cancelar a consulta');
                        }
                      },
                    },
                  ]
                );
              }}
            >
              <Ionicons name="close-circle" size={20} color={colors.textWhite} />
              <Text style={styles.actionButtonText}>Cancelar Consulta</Text>
            </TouchableOpacity>
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
  mockupBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.warning + '20',
    borderBottomWidth: 2,
    borderBottomColor: colors.warning,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  mockupBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.warning,
    textTransform: 'uppercase',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textLight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  statusCard: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
  },
  statusIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  statusSubtext: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 8,
  },
  infoCard: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textLight,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    textAlign: 'right',
  },
  infoValueSmall: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textLight,
    flex: 1,
    textAlign: 'right',
  },
  actionsCard: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    padding: 20,
  },
  actionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  confirmButton: {
    backgroundColor: colors.success,
  },
  cancelButton: {
    backgroundColor: colors.error,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textWhite,
  },
});

export default PaymentStatusScreen;


import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../constants/colors';
import SafeIcon from '../../components/SafeIcon';
import paymentService from '../../services/paymentService';
import Toast from 'react-native-toast-message';
import moment from 'moment';
import 'moment/locale/pt-br';

moment.locale('pt-br');

/**
 * [MOCK] Tela de Pagamento - Mockup para testes
 * 
 * Esta tela simula o processo de pagamento de uma teleconsulta.
 * Em produção, esta tela deve ser substituída pela integração real com gateway de pagamento.
 * 
 * TAG: [MOCK]
 */
const PaymentScreen = ({ route, navigation }) => {
  const { appointment, groupId, groupName } = route.params || {};
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [installments, setInstallments] = useState(1);

  // Calcular valor total da consulta (valor do médico + 20% da plataforma)
  // SEMPRE calcular baseado no consultation_price do médico, não confiar no amount
  const calculateTotalAmount = () => {
    // Buscar o valor original da consulta do médico
    const consultationPrice = appointment?.doctorUser?.consultation_price || 
                              appointment?.doctor?.consultation_price || 
                              100.00;
    
    // Calcular valor total: consultation_price * 1.20 (consulta + 20% taxa da plataforma)
    return Math.round(consultationPrice * 1.20 * 100) / 100;
  };
  
  const amount = calculateTotalAmount();

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatCardNumber = (text) => {
    // Remover caracteres não numéricos
    const cleaned = text.replace(/\D/g, '');
    // Limitar a 16 dígitos
    const limited = cleaned.slice(0, 16);
    // Adicionar espaços a cada 4 dígitos
    return limited.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (text) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    }
    return cleaned;
  };

  const handlePayment = async () => {
    // Validações básicas
    if (paymentMethod === 'credit_card' || paymentMethod === 'debit_card') {
      if (!cardNumber || cardNumber.replace(/\s/g, '').length < 16) {
        Toast.show({
          type: 'error',
          text1: 'Cartão inválido',
          text2: 'Digite um número de cartão válido',
        });
        return;
      }
      if (!cardName || cardName.length < 3) {
        Toast.show({
          type: 'error',
          text1: 'Nome inválido',
          text2: 'Digite o nome completo do portador',
        });
        return;
      }
      if (!cardExpiry || cardExpiry.length < 5) {
        Toast.show({
          type: 'error',
          text1: 'Validade inválida',
          text2: 'Digite a validade no formato MM/AA',
        });
        return;
      }
      if (!cardCvv || cardCvv.length < 3) {
        Toast.show({
          type: 'error',
          text1: 'CVV inválido',
          text2: 'Digite o código de segurança',
        });
        return;
      }
    }

    setLoading(true);

    try {
      // Gerar token mock do cartão
      const cardToken = `card_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const result = await paymentService.processPayment(appointment.id, {
        payment_method: paymentMethod,
        card_token: cardToken,
        installments: installments,
      });

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Pagamento processado!',
          text2: 'Sua consulta foi confirmada e o pagamento está em hold',
        });

        // Navegar de volta e recarregar a lista
        navigation.goBack();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Erro no pagamento',
          text2: result.error || 'Não foi possível processar o pagamento',
        });
      }
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro no pagamento',
        text2: 'Tente novamente mais tarde',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <SafeIcon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pagamento</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Badge MOCK */}
      <View style={styles.mockBadge}>
        <Text style={styles.mockBadgeText}>🔧 [MOCK] Tela de Pagamento - Apenas para Testes</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Informações da Consulta */}
        <View style={styles.appointmentCard}>
          <Text style={styles.sectionTitle}>Consulta</Text>
          <Text style={styles.appointmentTitle}>{appointment?.title || 'Teleconsulta'}</Text>
          {appointment?.doctorUser?.name || appointment?.doctor?.name ? (
            <Text style={styles.appointmentDoctor}>
              Dr(a). {appointment?.doctorUser?.name || appointment?.doctor?.name}
            </Text>
          ) : null}
          <Text style={styles.appointmentDate}>
            {moment(appointment?.scheduled_at || appointment?.appointment_date).format('DD/MM/YYYY [às] HH:mm')}
          </Text>
        </View>

        {/* Valor */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Valor Total</Text>
          <Text style={styles.amountValue}>{formatCurrency(amount)}</Text>
          {(() => {
            const consultationPrice = appointment?.doctorUser?.consultation_price || 
                                      appointment?.doctor?.consultation_price;
            if (consultationPrice && amount !== consultationPrice) {
              const platformFee = amount - consultationPrice;
              return (
                <View style={styles.amountBreakdown}>
                  <Text style={styles.amountBreakdownText}>
                    Consulta: {formatCurrency(consultationPrice)}
                  </Text>
                  <Text style={styles.amountBreakdownText}>
                    Taxa da plataforma (20%): {formatCurrency(platformFee)}
                  </Text>
                </View>
              );
            }
            return null;
          })()}
        </View>

        {/* Método de Pagamento */}
        <View style={styles.paymentMethodCard}>
          <Text style={styles.sectionTitle}>Método de Pagamento</Text>
          
          <TouchableOpacity
            style={[
              styles.paymentMethodOption,
              paymentMethod === 'credit_card' && styles.paymentMethodOptionActive,
            ]}
            onPress={() => setPaymentMethod('credit_card')}
          >
            <SafeIcon
              name={paymentMethod === 'credit_card' ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={paymentMethod === 'credit_card' ? colors.primary : colors.gray400}
            />
            <Text style={styles.paymentMethodText}>Cartão de Crédito</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentMethodOption,
              paymentMethod === 'debit_card' && styles.paymentMethodOptionActive,
            ]}
            onPress={() => setPaymentMethod('debit_card')}
          >
            <SafeIcon
              name={paymentMethod === 'debit_card' ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={paymentMethod === 'debit_card' ? colors.primary : colors.gray400}
            />
            <Text style={styles.paymentMethodText}>Cartão de Débito</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentMethodOption,
              paymentMethod === 'pix' && styles.paymentMethodOptionActive,
            ]}
            onPress={() => setPaymentMethod('pix')}
          >
            <SafeIcon
              name={paymentMethod === 'pix' ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={paymentMethod === 'pix' ? colors.primary : colors.gray400}
            />
            <Text style={styles.paymentMethodText}>PIX</Text>
          </TouchableOpacity>
        </View>

        {/* Dados do Cartão (se crédito ou débito) */}
        {(paymentMethod === 'credit_card' || paymentMethod === 'debit_card') && (
          <View style={styles.cardDataCard}>
            <Text style={styles.sectionTitle}>Dados do Cartão</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Número do Cartão</Text>
              <TextInput
                style={styles.input}
                placeholder="0000 0000 0000 0000"
                value={cardNumber}
                onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                keyboardType="numeric"
                maxLength={19}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome no Cartão</Text>
              <TextInput
                style={styles.input}
                placeholder="NOME COMPLETO"
                value={cardName}
                onChangeText={setCardName}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.inputGroupHalf]}>
                <Text style={styles.label}>Validade</Text>
                <TextInput
                  style={styles.input}
                  placeholder="MM/AA"
                  value={cardExpiry}
                  onChangeText={(text) => setCardExpiry(formatExpiry(text))}
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>

              <View style={[styles.inputGroup, styles.inputGroupHalf]}>
                <Text style={styles.label}>CVV</Text>
                <TextInput
                  style={styles.input}
                  placeholder="123"
                  value={cardCvv}
                  onChangeText={(text) => setCardCvv(text.replace(/\D/g, '').slice(0, 4))}
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                />
              </View>
            </View>

            {paymentMethod === 'credit_card' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Parcelas</Text>
                <TextInput
                  style={styles.input}
                  placeholder="1"
                  value={installments.toString()}
                  onChangeText={(text) => {
                    const num = parseInt(text.replace(/\D/g, '')) || 1;
                    setInstallments(Math.min(Math.max(num, 1), 12));
                  }}
                  keyboardType="numeric"
                />
              </View>
            )}
          </View>
        )}

        {/* Informação PIX (se PIX) */}
        {paymentMethod === 'pix' && (
          <View style={styles.pixInfoCard}>
            <Text style={styles.sectionTitle}>Pagamento via PIX</Text>
            <Text style={styles.pixInfoText}>
              O código PIX será gerado após confirmar o pagamento.
            </Text>
          </View>
        )}

        {/* Botão de Pagar */}
        <TouchableOpacity
          style={[styles.payButton, loading && styles.payButtonDisabled]}
          onPress={handlePayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.textWhite} />
          ) : (
            <>
              <SafeIcon name="card" size={20} color={colors.textWhite} />
              <Text style={styles.payButtonText}>
                Pagar {formatCurrency(amount)}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Aviso de Segurança */}
        <Text style={styles.securityText}>
          🔒 Seus dados estão seguros. Este é um ambiente de teste [MOCK].
        </Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  mockBadge: {
    backgroundColor: colors.warning + '20',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.warning,
  },
  mockBadgeText: {
    fontSize: 12,
    color: colors.warning,
    textAlign: 'center',
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  appointmentCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray600,
    marginBottom: 12,
  },
  appointmentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  appointmentDoctor: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  appointmentDate: {
    fontSize: 14,
    color: colors.gray600,
  },
  amountCard: {
    backgroundColor: colors.primary + '10',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  amountLabel: {
    fontSize: 14,
    color: colors.gray600,
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
  },
  amountBreakdown: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.primary + '30',
    width: '100%',
    alignItems: 'center',
  },
  amountBreakdownText: {
    fontSize: 12,
    color: colors.gray600,
    marginTop: 4,
  },
  paymentMethodCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  paymentMethodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  paymentMethodOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  paymentMethodText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  cardDataCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputGroupHalf: {
    flex: 1,
    marginRight: 8,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pixInfoCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pixInfoText: {
    fontSize: 14,
    color: colors.gray600,
    lineHeight: 20,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 8,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textWhite,
  },
  securityText: {
    fontSize: 12,
    color: colors.gray500,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default PaymentScreen;

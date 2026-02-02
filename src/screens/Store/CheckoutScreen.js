import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import colors from '../../constants/colors';
import storeService from '../../services/storeService';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';

const CheckoutScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { cartItems, shippingQuote, shippingAddress: routeShippingAddress } = route.params || {};
  const { clearCart } = useCart();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [buyerData, setBuyerData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const subtotal = cartItems?.reduce((sum, item) => sum + (item.product.price * item.quantity), 0) || 0;
  const shipping = shippingQuote ? parseFloat(shippingQuote.price) : 0;
  const total = subtotal + shipping;

  const handleFinishOrder = async () => {
    if (!buyerData.name || !buyerData.email || !buyerData.phone) {
      Alert.alert('Dados incompletos', 'Por favor, preencha todos os dados do comprador');
      return;
    }

    try {
      setLoading(true);

      const orderData = {
        items: cartItems.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
        payment_method: paymentMethod,
        shipping_address: routeShippingAddress.address,
        shipping_number: routeShippingAddress.number,
        shipping_complement: routeShippingAddress.complement || '',
        shipping_neighborhood: routeShippingAddress.neighborhood,
        shipping_city: routeShippingAddress.city,
        shipping_state: routeShippingAddress.state,
        shipping_zip_code: routeShippingAddress.zip_code.replace(/\D/g, ''),
        buyer_name: buyerData.name,
        buyer_email: buyerData.email,
        buyer_phone: buyerData.phone,
        shipping_service: shippingQuote.service_code,
        shipping_price: shippingQuote.price,
        shipping_deadline: shippingQuote.deadline,
      };

      const result = await storeService.createOrder(orderData);

      if (result.success) {
        clearCart();
        Alert.alert(
          'Pedido criado!',
          'Seu pedido foi criado com sucesso. Aguarde a confirmação do pagamento.',
          [
            {
              text: 'Ver pedidos',
              onPress: () => navigation.navigate('Orders'),
            },
            {
              text: 'OK',
              onPress: () => navigation.navigate('StoreMain'),
            },
          ]
        );
      } else {
        throw new Error(result.message || 'Erro ao criar pedido');
      }
    } catch (error) {
      console.error('Erro ao finalizar pedido:', error);
      Alert.alert('Erro', 'Erro ao finalizar pedido. ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Finalizar Compra</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Dados do comprador */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados do Comprador</Text>
          
          <View style={styles.input}>
            <Text style={styles.inputLabel}>Nome completo</Text>
            <TextInput
              style={styles.textInput}
              value={buyerData.name}
              onChangeText={(text) => setBuyerData(prev => ({ ...prev, name: text }))}
              placeholder="Nome completo"
            />
          </View>

          <View style={styles.input}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.textInput}
              value={buyerData.email}
              onChangeText={(text) => setBuyerData(prev => ({ ...prev, email: text }))}
              placeholder="email@exemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.input}>
            <Text style={styles.inputLabel}>Telefone</Text>
            <TextInput
              style={styles.textInput}
              value={buyerData.phone}
              onChangeText={(text) => setBuyerData(prev => ({ ...prev, phone: text }))}
              placeholder="(00) 00000-0000"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Método de pagamento */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Método de Pagamento</Text>
          
          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'pix' && styles.paymentOptionActive]}
            onPress={() => setPaymentMethod('pix')}
          >
            <Ionicons 
              name={paymentMethod === 'pix' ? 'radio-button-on' : 'radio-button-off'} 
              size={24} 
              color={paymentMethod === 'pix' ? colors.primary : colors.gray400} 
            />
            <Text style={styles.paymentOptionText}>PIX</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'credit_card' && styles.paymentOptionActive]}
            onPress={() => setPaymentMethod('credit_card')}
          >
            <Ionicons 
              name={paymentMethod === 'credit_card' ? 'radio-button-on' : 'radio-button-off'} 
              size={24} 
              color={paymentMethod === 'credit_card' ? colors.primary : colors.gray400} 
            />
            <Text style={styles.paymentOptionText}>Cartão de Crédito</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'debit_card' && styles.paymentOptionActive]}
            onPress={() => setPaymentMethod('debit_card')}
          >
            <Ionicons 
              name={paymentMethod === 'debit_card' ? 'radio-button-on' : 'radio-button-off'} 
              size={24} 
              color={paymentMethod === 'debit_card' ? colors.primary : colors.gray400} 
            />
            <Text style={styles.paymentOptionText}>Cartão de Débito</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'boleto' && styles.paymentOptionActive]}
            onPress={() => setPaymentMethod('boleto')}
          >
            <Ionicons 
              name={paymentMethod === 'boleto' ? 'radio-button-on' : 'radio-button-off'} 
              size={24} 
              color={paymentMethod === 'boleto' ? colors.primary : colors.gray400} 
            />
            <Text style={styles.paymentOptionText}>Boleto</Text>
          </TouchableOpacity>
        </View>

        {/* Resumo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumo do Pedido</Text>
          
          {cartItems?.map((item) => (
            <View key={item.product.id} style={styles.summaryItem}>
              <Text style={styles.summaryItemName}>
                {item.product.name} x {item.quantity}
              </Text>
              <Text style={styles.summaryItemPrice}>
                {formatPrice(item.product.price * item.quantity)}
              </Text>
            </View>
          ))}

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Frete</Text>
            <Text style={styles.summaryValue}>{formatPrice(shipping)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.summaryTotalLabel}>Total</Text>
            <Text style={styles.summaryTotalValue}>{formatPrice(total)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerTotal}>
          <Text style={styles.footerTotalLabel}>Total</Text>
          <Text style={styles.footerTotalValue}>{formatPrice(total)}</Text>
        </View>
        <TouchableOpacity
          style={styles.finishButton}
          onPress={handleFinishOrder}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.textWhite} />
          ) : (
            <Text style={styles.finishButtonText}>Finalizar Pedido</Text>
          )}
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textDark,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    marginTop: 16,
    backgroundColor: colors.backgroundLight,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textDark,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.textDark,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  paymentOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  paymentOptionText: {
    fontSize: 16,
    color: colors.textDark,
    marginLeft: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryItemName: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  summaryItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textLight,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
  },
  summaryTotal: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  summaryTotalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.backgroundLight,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerTotal: {
    flex: 1,
  },
  footerTotalLabel: {
    fontSize: 12,
    color: colors.textLight,
  },
  footerTotalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  finishButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    minWidth: 150,
    alignItems: 'center',
  },
  finishButtonText: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default CheckoutScreen;


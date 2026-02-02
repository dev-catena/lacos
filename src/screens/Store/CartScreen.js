import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../contexts/CartContext';
import colors from '../../constants/colors';
import storeService from '../../services/storeService';
import { useAuth } from '../../contexts/AuthContext';

const CartScreen = ({ navigation }) => {
  const { cartItems, updateQuantity, removeFromCart, getTotalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [shippingQuote, setShippingQuote] = useState(null);
  const [calculatingShipping, setCalculatingShipping] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    zip_code: '',
    address: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
  });

  useEffect(() => {
    if (user) {
      // Preencher endereço do usuário se disponível
      setShippingAddress(prev => ({
        ...prev,
        zip_code: user.zip_code || '',
        address: user.address || '',
        number: user.address_number || '',
        complement: user.address_complement || '',
        neighborhood: user.neighborhood || '',
        city: user.city || '',
        state: user.state || '',
      }));
    }
  }, [user]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const calculateShipping = async () => {
    const cleanZipCode = shippingAddress.zip_code?.replace(/\D/g, '') || '';
    if (!cleanZipCode || cleanZipCode.length !== 8) {
      Alert.alert('CEP inválido', 'Por favor, informe um CEP válido com 8 dígitos');
      return;
    }

    if (cartItems.length === 0) {
      Alert.alert('Carrinho vazio', 'Adicione produtos ao carrinho antes de calcular o frete');
      return;
    }

    // Obter CEP de origem do fornecedor do primeiro produto
    const firstProduct = cartItems[0].product;
    const supplierZipCode = firstProduct?.supplier?.zip_code?.replace(/\D/g, '') || null;
    
    if (!supplierZipCode || supplierZipCode.length !== 8) {
      Alert.alert(
        'CEP do fornecedor não disponível', 
        'O fornecedor não possui CEP cadastrado. Entre em contato com o suporte.'
      );
      return;
    }

    try {
      setCalculatingShipping(true);
      
      // Calcular peso total (assumindo 0.5kg por item como padrão)
      const totalWeight = cartItems.reduce((sum, item) => {
        return sum + (item.quantity * 0.5); // 0.5kg por item
      }, 0);

      // Usar CEP do fornecedor como origem
      const result = await storeService.calculateShipping({
        origin_zip: supplierZipCode,
        destination_zip: cleanZipCode,
        weight: totalWeight,
        length: 20,
        height: 5,
        width: 15,
      });

      if (result.success) {
        setShippingQuote(result.quote);
      } else {
        Alert.alert('Erro', result.message || 'Erro ao calcular frete');
      }
    } catch (error) {
      console.error('Erro ao calcular frete:', error);
      Alert.alert('Erro', 'Erro ao calcular frete. ' + error.message);
    } finally {
      setCalculatingShipping(false);
    }
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      Alert.alert('Carrinho vazio', 'Adicione produtos ao carrinho antes de finalizar a compra');
      return;
    }

    if (!shippingQuote) {
      Alert.alert('Frete não calculado', 'Por favor, calcule o frete antes de finalizar a compra');
      return;
    }

    // Validar endereço completo
    if (!shippingAddress.zip_code || !shippingAddress.address || !shippingAddress.number || 
        !shippingAddress.neighborhood || !shippingAddress.city || !shippingAddress.state) {
      Alert.alert('Endereço incompleto', 'Por favor, preencha todos os campos do endereço de entrega');
      return;
    }

    // Navegar para tela de checkout
    navigation.navigate('Checkout', {
      cartItems,
      shippingQuote,
      shippingAddress,
    });
  };

  const subtotal = getTotalPrice();
  const shipping = shippingQuote ? parseFloat(shippingQuote.price) : 0;
  const total = subtotal + shipping;

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
        <Text style={styles.headerTitle}>Carrinho</Text>
        <View style={styles.placeholder} />
      </View>

      {cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={80} color={colors.gray400} />
          <Text style={styles.emptyText}>Seu carrinho está vazio</Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => navigation.navigate('StoreMain')}
          >
            <Text style={styles.shopButtonText}>Continuar comprando</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {/* Lista de itens */}
          {cartItems.map((item) => {
            const imageUrl = item.product.images?.[0] || item.product.image_url;
            return (
              <View key={item.product.id} style={styles.cartItem}>
                {imageUrl ? (
                  <Image source={{ uri: imageUrl }} style={styles.itemImage} />
                ) : (
                  <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                    <Ionicons name="image-outline" size={30} color={colors.gray400} />
                  </View>
                )}
                
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.product.name}
                  </Text>
                  {item.product.supplier && (
                    <Text style={styles.itemSupplier} numberOfLines={1}>
                      {item.product.supplier.company_name}
                    </Text>
                  )}
                  <Text style={styles.itemPrice}>
                    {formatPrice(item.product.price)}
                  </Text>
                  
                  <View style={styles.quantityContainer}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
                    >
                      <Ionicons name="remove" size={18} color={colors.textDark} />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
                      disabled={item.quantity >= (item.product.stock || 999)}
                    >
                      <Ionicons name="add" size={18} color={colors.textDark} />
                    </TouchableOpacity>
                  </View>
                </View>
                
                <View style={styles.itemActions}>
                  <Text style={styles.itemTotal}>
                    {formatPrice(item.product.price * item.quantity)}
                  </Text>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeFromCart(item.product.id)}
                  >
                    <Ionicons name="trash-outline" size={20} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          {/* Seção de endereço e frete */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Endereço de Entrega</Text>
            
            <View style={styles.inputRow}>
              <View style={[styles.input, { flex: 1 }]}>
                <Text style={styles.inputLabel}>CEP</Text>
                <TextInput
                  style={styles.textInput}
                  value={shippingAddress.zip_code}
                  onChangeText={(text) => {
                    const numbers = text.replace(/\D/g, '');
                    const formatted = numbers.length <= 8 
                      ? numbers.replace(/(\d{5})(\d{3})/, '$1-$2')
                      : numbers.slice(0, 8).replace(/(\d{5})(\d{3})/, '$1-$2');
                    setShippingAddress(prev => ({ ...prev, zip_code: formatted }));
                  }}
                  placeholder="00000-000"
                  keyboardType="numeric"
                  maxLength={9}
                />
              </View>
              <TouchableOpacity
                style={styles.calculateButton}
                onPress={calculateShipping}
                disabled={calculatingShipping || !shippingAddress.zip_code}
              >
                {calculatingShipping ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={styles.calculateButtonText}>Calcular</Text>
                )}
              </TouchableOpacity>
            </View>

            {shippingQuote && (
              <View style={styles.shippingQuote}>
                <Text style={styles.shippingLabel}>
                  Frete ({shippingQuote.service_name}):
                </Text>
                <Text style={styles.shippingPrice}>
                  {formatPrice(shippingQuote.price)}
                </Text>
                <Text style={styles.shippingDeadline}>
                  Prazo: {shippingQuote.deadline} dias úteis
                </Text>
              </View>
            )}

            <View style={styles.input}>
              <Text style={styles.inputLabel}>Endereço</Text>
              <TextInput
                style={styles.textInput}
                value={shippingAddress.address}
                onChangeText={(text) => setShippingAddress(prev => ({ ...prev, address: text }))}
                placeholder="Rua, Avenida, etc."
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.input, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Número</Text>
                <TextInput
                  style={styles.textInput}
                  value={shippingAddress.number}
                  onChangeText={(text) => setShippingAddress(prev => ({ ...prev, number: text }))}
                  placeholder="123"
                />
              </View>
              <View style={[styles.input, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>Complemento</Text>
                <TextInput
                  style={styles.textInput}
                  value={shippingAddress.complement}
                  onChangeText={(text) => setShippingAddress(prev => ({ ...prev, complement: text }))}
                  placeholder="Apto, Bloco, etc."
                />
              </View>
            </View>

            <View style={styles.input}>
              <Text style={styles.inputLabel}>Bairro</Text>
              <TextInput
                style={styles.textInput}
                value={shippingAddress.neighborhood}
                onChangeText={(text) => setShippingAddress(prev => ({ ...prev, neighborhood: text }))}
                placeholder="Bairro"
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.input, { flex: 2 }]}>
                <Text style={styles.inputLabel}>Cidade</Text>
                <TextInput
                  style={styles.textInput}
                  value={shippingAddress.city}
                  onChangeText={(text) => setShippingAddress(prev => ({ ...prev, city: text }))}
                  placeholder="Cidade"
                />
              </View>
              <View style={[styles.input, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>UF</Text>
                <TextInput
                  style={styles.textInput}
                  value={shippingAddress.state}
                  onChangeText={(text) => setShippingAddress(prev => ({ ...prev, state: text.toUpperCase().slice(0, 2) }))}
                  placeholder="SP"
                  maxLength={2}
                  autoCapitalize="characters"
                />
              </View>
            </View>
          </View>

          {/* Resumo */}
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Frete</Text>
              <Text style={styles.summaryValue}>
                {shippingQuote ? formatPrice(shipping) : 'Não calculado'}
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryTotal]}>
              <Text style={styles.summaryTotalLabel}>Total</Text>
              <Text style={styles.summaryTotalValue}>{formatPrice(total)}</Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Footer com botão de finalizar */}
      {cartItems.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.footerTotal}>
            <Text style={styles.footerTotalLabel}>Total</Text>
            <Text style={styles.footerTotalValue}>{formatPrice(total)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.checkoutButton, (!shippingQuote || loading) && styles.checkoutButtonDisabled]}
            onPress={handleCheckout}
            disabled={!shippingQuote || loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.textWhite} />
            ) : (
              <Text style={styles.checkoutButtonText}>Finalizar Compra</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    color: colors.textLight,
    marginTop: 16,
    marginBottom: 24,
  },
  shopButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopButtonText: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: '600',
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundLight,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: colors.gray100,
  },
  itemImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 4,
  },
  itemSupplier: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
    minWidth: 30,
    textAlign: 'center',
  },
  itemActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 8,
  },
  removeButton: {
    padding: 4,
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
  inputRow: {
    flexDirection: 'row',
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
  calculateButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    marginTop: 20,
    minWidth: 100,
  },
  calculateButtonText: {
    color: colors.textWhite,
    fontSize: 14,
    fontWeight: '600',
  },
  shippingQuote: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  shippingLabel: {
    fontSize: 14,
    color: colors.textDark,
  },
  shippingPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 4,
  },
  shippingDeadline: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
  },
  summary: {
    padding: 16,
    backgroundColor: colors.backgroundLight,
    marginTop: 16,
    marginBottom: 16,
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
  checkoutButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    minWidth: 150,
    alignItems: 'center',
  },
  checkoutButtonDisabled: {
    backgroundColor: colors.gray400,
    opacity: 0.6,
  },
  checkoutButtonText: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default CartScreen;


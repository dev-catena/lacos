import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import colors from '../../constants/colors';
import storeService from '../../services/storeService';
import { useAuth } from '../../contexts/AuthContext';

const ProductDetailsScreen = ({ navigation }) => {
  const route = useRoute();
  const { productId } = route.params;
  const { user } = useAuth();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  // Checkout form
  const [checkoutData, setCheckoutData] = useState({
    payment_method: 'pix',
    delivery_method: 'delivery',
    buyer_name: user?.name || '',
    buyer_email: user?.email || '',
    buyer_phone: user?.phone || '',
    shipping_address: '',
    shipping_number: '',
    shipping_complement: '',
    shipping_neighborhood: '',
    shipping_city: '',
    shipping_state: '',
    shipping_zip_code: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const result = await storeService.getProduct(productId);
      
      if (result.success) {
        setProduct(result.product);
      }
    } catch (error) {
      console.error('Erro ao carregar produto:', error);
      Alert.alert('Erro', 'Erro ao carregar produto. ' + error.message);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const calculateTotal = () => {
    if (!product) return 0;
    const subtotal = product.price * quantity;
    let deliveryFee = 0;
    
    if (checkoutData.delivery_method === 'delivery' && product.delivery_fee) {
      deliveryFee = product.delivery_fee;
      if (product.free_delivery_above && subtotal >= (product.free_delivery_threshold || 0)) {
        deliveryFee = 0;
      }
    }
    
    return subtotal + deliveryFee;
  };

  const handleCheckout = async () => {
    if (!product) return;

    // Validações
    if (quantity > product.stock) {
      Alert.alert('Erro', 'Quantidade solicitada maior que o estoque disponível');
      return;
    }

    if (checkoutData.delivery_method === 'delivery') {
      if (!checkoutData.shipping_address || !checkoutData.shipping_number || 
          !checkoutData.shipping_neighborhood || !checkoutData.shipping_city || 
          !checkoutData.shipping_state || !checkoutData.shipping_zip_code) {
        Alert.alert('Erro', 'Preencha todos os campos de endereço de entrega');
        return;
      }
    }

    try {
      setSubmitting(true);
      
      const orderData = {
        items: [{
          product_id: product.id,
          quantity: quantity,
        }],
        payment_method: checkoutData.payment_method,
        delivery_method: checkoutData.delivery_method,
        buyer_name: checkoutData.buyer_name,
        buyer_email: checkoutData.buyer_email,
        buyer_phone: checkoutData.buyer_phone,
        ...(checkoutData.delivery_method === 'delivery' && {
          shipping_address: checkoutData.shipping_address,
          shipping_number: checkoutData.shipping_number,
          shipping_complement: checkoutData.shipping_complement,
          shipping_neighborhood: checkoutData.shipping_neighborhood,
          shipping_city: checkoutData.shipping_city,
          shipping_state: checkoutData.shipping_state,
          shipping_zip_code: checkoutData.shipping_zip_code,
        }),
      };

      const result = await storeService.createOrder(orderData);
      
      if (result.success) {
        Alert.alert(
          'Pedido Criado!',
          `Seu pedido ${result.order.order_number} foi criado com sucesso!`,
          [
            {
              text: 'Ver Pedidos',
              onPress: () => {
                navigation.navigate('Orders');
                navigation.navigate('OrderDetails', { orderId: result.order.id });
              },
            },
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      Alert.alert('Erro', 'Erro ao criar pedido. ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Produto não encontrado</Text>
        </View>
      </SafeAreaView>
    );
  }

  const images = product.images || (product.image_url ? [product.image_url] : []);
  const currentImage = images[selectedImageIndex] || null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <ScrollView style={styles.scrollView}>
        {/* Header com botão voltar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.textDark} />
          </TouchableOpacity>
        </View>

        {/* Imagens do produto */}
        {currentImage ? (
          <Image source={{ uri: currentImage }} style={styles.productImage} />
        ) : (
          <View style={[styles.productImage, styles.productImagePlaceholder]}>
            <Ionicons name="image-outline" size={64} color={colors.gray400} />
          </View>
        )}

        {/* Indicadores de imagens */}
        {images.length > 1 && (
          <View style={styles.imageIndicators}>
            {images.map((_, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.indicator,
                  selectedImageIndex === index && styles.indicatorActive,
                ]}
                onPress={() => setSelectedImageIndex(index)}
              />
            ))}
          </View>
        )}

        {/* Informações do produto */}
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product.name}</Text>
          
          {product.supplier && (
            <Text style={styles.supplierName}>
              {product.supplier.company_name}
            </Text>
          )}

          <View style={styles.priceContainer}>
            <Text style={styles.productPrice}>{formatPrice(product.price)}</Text>
            {product.stock > 0 ? (
              <Text style={styles.stockText}>{product.stock} em estoque</Text>
            ) : (
              <Text style={styles.outOfStockText}>Esgotado</Text>
            )}
          </View>

          {product.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionTitle}>Descrição</Text>
              <Text style={styles.descriptionText}>{product.description}</Text>
            </View>
          )}

          {/* Formas de pagamento */}
          {product.payment_methods && product.payment_methods.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Formas de Pagamento</Text>
              <View style={styles.paymentMethods}>
                {product.payment_methods.map((method, index) => (
                  <View key={index} style={styles.paymentMethodChip}>
                    <Text style={styles.paymentMethodText}>
                      {method === 'credit_card' ? 'Cartão de Crédito' :
                       method === 'debit_card' ? 'Cartão de Débito' :
                       method === 'pix' ? 'PIX' :
                       method === 'boleto' ? 'Boleto' : method}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Formas de entrega */}
          {product.delivery_methods && product.delivery_methods.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Formas de Entrega</Text>
              <View style={styles.deliveryMethods}>
                {product.delivery_methods.map((method, index) => (
                  <View key={index} style={styles.deliveryMethodChip}>
                    <Text style={styles.deliveryMethodText}>
                      {method === 'delivery' ? 'Entrega' :
                       method === 'pickup' ? 'Retirada' :
                       method === 'both' ? 'Entrega ou Retirada' : method}
                    </Text>
                  </View>
                ))}
              </View>
              {product.delivery_fee && (
                <Text style={styles.deliveryFeeText}>
                  Taxa de entrega: {formatPrice(product.delivery_fee)}
                  {product.free_delivery_above && (
                    <Text> (Grátis acima de {formatPrice(product.free_delivery_threshold || 0)})</Text>
                  )}
                </Text>
              )}
            </View>
          )}

          {/* Seletor de quantidade */}
          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>Quantidade</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Ionicons name="remove" size={20} color={colors.textDark} />
              </TouchableOpacity>
              <Text style={styles.quantityValue}>{quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(Math.min(product.stock, quantity + 1))}
                disabled={quantity >= product.stock}
              >
                <Ionicons name="add" size={20} color={colors.textDark} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Botão de comprar */}
      {product.stock > 0 && (
        <View style={styles.footer}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>{formatPrice(calculateTotal())}</Text>
          </View>
          <TouchableOpacity
            style={styles.buyButton}
            onPress={() => setShowCheckout(true)}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colors.textWhite} />
            ) : (
              <Text style={styles.buyButtonText}>Comprar</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Modal de Checkout */}
      <Modal
        visible={showCheckout}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Finalizar Compra</Text>
            <TouchableOpacity onPress={() => setShowCheckout(false)}>
              <Ionicons name="close" size={24} color={colors.textDark} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Resumo do pedido */}
            <View style={styles.orderSummary}>
              <Text style={styles.orderSummaryTitle}>Resumo do Pedido</Text>
              <View style={styles.orderSummaryItem}>
                <Text>{product.name} x{quantity}</Text>
                <Text>{formatPrice(product.price * quantity)}</Text>
              </View>
              {checkoutData.delivery_method === 'delivery' && product.delivery_fee && (
                <View style={styles.orderSummaryItem}>
                  <Text>Taxa de entrega</Text>
                  <Text>
                    {product.free_delivery_above && calculateTotal() - (product.price * quantity) >= product.free_delivery_threshold
                      ? 'Grátis'
                      : formatPrice(product.delivery_fee)}
                  </Text>
                </View>
              )}
              <View style={[styles.orderSummaryItem, styles.orderSummaryTotal]}>
                <Text style={styles.orderSummaryTotalText}>Total</Text>
                <Text style={styles.orderSummaryTotalValue}>{formatPrice(calculateTotal())}</Text>
              </View>
            </View>

            {/* Forma de pagamento */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Forma de Pagamento *</Text>
              <View style={styles.paymentOptions}>
                {['pix', 'credit_card', 'debit_card', 'boleto'].map((method) => {
                  if (product.payment_methods && !product.payment_methods.includes(method)) return null;
                  
                  const labels = {
                    pix: 'PIX',
                    credit_card: 'Cartão de Crédito',
                    debit_card: 'Cartão de Débito',
                    boleto: 'Boleto',
                  };
                  
                  return (
                    <TouchableOpacity
                      key={method}
                      style={[
                        styles.radioOption,
                        checkoutData.payment_method === method && styles.radioOptionActive,
                      ]}
                      onPress={() => setCheckoutData({ ...checkoutData, payment_method: method })}
                    >
                      <Ionicons
                        name={checkoutData.payment_method === method ? 'radio-button-on' : 'radio-button-off'}
                        size={20}
                        color={checkoutData.payment_method === method ? colors.primary : colors.gray400}
                      />
                      <Text style={styles.radioOptionText}>{labels[method]}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Forma de entrega */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Forma de Entrega *</Text>
              <View style={styles.paymentOptions}>
                {['delivery', 'pickup'].map((method) => {
                  if (product.delivery_methods && !product.delivery_methods.includes(method) && 
                      !product.delivery_methods.includes('both')) return null;
                  
                  const labels = {
                    delivery: 'Entrega',
                    pickup: 'Retirada',
                  };
                  
                  return (
                    <TouchableOpacity
                      key={method}
                      style={[
                        styles.radioOption,
                        checkoutData.delivery_method === method && styles.radioOptionActive,
                      ]}
                      onPress={() => setCheckoutData({ ...checkoutData, delivery_method: method })}
                    >
                      <Ionicons
                        name={checkoutData.delivery_method === method ? 'radio-button-on' : 'radio-button-off'}
                        size={20}
                        color={checkoutData.delivery_method === method ? colors.primary : colors.gray400}
                      />
                      <Text style={styles.radioOptionText}>{labels[method]}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Dados do comprador */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Nome *</Text>
              <TextInput
                style={styles.input}
                value={checkoutData.buyer_name}
                onChangeText={(text) => setCheckoutData({ ...checkoutData, buyer_name: text })}
                placeholder="Seu nome completo"
              />
              
              <Text style={styles.formLabel}>E-mail *</Text>
              <TextInput
                style={styles.input}
                value={checkoutData.buyer_email}
                onChangeText={(text) => setCheckoutData({ ...checkoutData, buyer_email: text })}
                placeholder="seu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              
              <Text style={styles.formLabel}>Telefone *</Text>
              <TextInput
                style={styles.input}
                value={checkoutData.buyer_phone}
                onChangeText={(text) => setCheckoutData({ ...checkoutData, buyer_phone: text })}
                placeholder="(00) 00000-0000"
                keyboardType="phone-pad"
              />
            </View>

            {/* Endereço de entrega (se delivery) */}
            {checkoutData.delivery_method === 'delivery' && (
              <View style={styles.formSection}>
                <Text style={styles.formSectionTitle}>Endereço de Entrega</Text>
                
                <Text style={styles.formLabel}>Endereço *</Text>
                <TextInput
                  style={styles.input}
                  value={checkoutData.shipping_address}
                  onChangeText={(text) => setCheckoutData({ ...checkoutData, shipping_address: text })}
                  placeholder="Rua, Avenida, etc."
                />
                
                <View style={styles.rowInputs}>
                  <View style={[styles.input, styles.halfInput]}>
                    <TextInput
                      value={checkoutData.shipping_number}
                      onChangeText={(text) => setCheckoutData({ ...checkoutData, shipping_number: text })}
                      placeholder="Número *"
                    />
                  </View>
                  <View style={[styles.input, styles.halfInput]}>
                    <TextInput
                      value={checkoutData.shipping_complement}
                      onChangeText={(text) => setCheckoutData({ ...checkoutData, shipping_complement: text })}
                      placeholder="Complemento"
                    />
                  </View>
                </View>
                
                <Text style={styles.formLabel}>Bairro *</Text>
                <TextInput
                  style={styles.input}
                  value={checkoutData.shipping_neighborhood}
                  onChangeText={(text) => setCheckoutData({ ...checkoutData, shipping_neighborhood: text })}
                  placeholder="Bairro"
                />
                
                <View style={styles.rowInputs}>
                  <View style={[styles.input, styles.halfInput]}>
                    <TextInput
                      value={checkoutData.shipping_city}
                      onChangeText={(text) => setCheckoutData({ ...checkoutData, shipping_city: text })}
                      placeholder="Cidade *"
                    />
                  </View>
                  <View style={[styles.input, styles.halfInput]}>
                    <TextInput
                      value={checkoutData.shipping_state}
                      onChangeText={(text) => setCheckoutData({ ...checkoutData, shipping_state: text.toUpperCase() })}
                      placeholder="UF *"
                      maxLength={2}
                      autoCapitalize="characters"
                    />
                  </View>
                </View>
                
                <Text style={styles.formLabel}>CEP *</Text>
                <TextInput
                  style={styles.input}
                  value={checkoutData.shipping_zip_code}
                  onChangeText={(text) => setCheckoutData({ ...checkoutData, shipping_zip_code: text })}
                  placeholder="00000-000"
                  keyboardType="numeric"
                />
              </View>
            )}

            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleCheckout}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={colors.textWhite} />
              ) : (
                <Text style={styles.submitButtonText}>Finalizar Pedido</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textLight,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  productImage: {
    width: '100%',
    height: 300,
    backgroundColor: colors.gray100,
  },
  productImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gray300,
  },
  indicatorActive: {
    backgroundColor: colors.primary,
  },
  productInfo: {
    padding: 16,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 8,
  },
  supplierName: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  productPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
  },
  stockText: {
    fontSize: 14,
    color: colors.success,
  },
  outOfStockText: {
    fontSize: 14,
    color: colors.error,
  },
  descriptionContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  section: {
    marginTop: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 12,
  },
  paymentMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  paymentMethodChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.gray100,
  },
  paymentMethodText: {
    fontSize: 14,
    color: colors.text,
  },
  deliveryMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  deliveryMethodChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.gray100,
  },
  deliveryMethodText: {
    fontSize: 14,
    color: colors.text,
  },
  deliveryFeeText: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 8,
  },
  quantityContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 12,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityValue: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textDark,
    minWidth: 40,
    textAlign: 'center',
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
  totalContainer: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 14,
    color: colors.textLight,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  buyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  buyButtonText: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  orderSummary: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  orderSummaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 12,
  },
  orderSummaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderSummaryTotal: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  orderSummaryTotalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  orderSummaryTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  formSection: {
    marginBottom: 24,
  },
  formSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textDark,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.textDark,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  paymentOptions: {
    gap: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  radioOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  radioOptionText: {
    fontSize: 16,
    color: colors.textDark,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProductDetailsScreen;






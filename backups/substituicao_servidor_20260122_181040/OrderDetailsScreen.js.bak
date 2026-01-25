import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import colors from '../../constants/colors';
import storeService from '../../services/storeService';
import { useAuth } from '../../contexts/AuthContext';

const OrderDetailsScreen = ({ navigation }) => {
  const route = useRoute();
  const { orderId } = route.params;
  const { user } = useAuth();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [activeTab, setActiveTab] = useState('details'); // 'details' or 'chat'
  const flatListRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  useEffect(() => {
    loadOrder();
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [orderId]);

  useEffect(() => {
    if (activeTab === 'chat' && order) {
      loadConversation();
      // Polling para atualizar mensagens
      pollingIntervalRef.current = setInterval(() => {
        if (conversation) {
          loadMessages();
        }
      }, 3000);
      
      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [activeTab, order, conversation]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const result = await storeService.getOrder(orderId);
      
      if (result.success) {
        setOrder(result.order);
      }
    } catch (error) {
      console.error('Erro ao carregar pedido:', error);
      Alert.alert('Erro', 'Erro ao carregar pedido. ' + error.message);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = async () => {
    try {
      const result = await storeService.getOrderConversation(orderId);
      
      if (result.success && result.conversations && result.conversations.length > 0) {
        const conv = result.conversations[0];
        setConversation(conv);
        loadMessages(conv.id);
      } else {
        // Criar conversa se não existir (será criada automaticamente ao enviar primeira mensagem)
        setConversation({ id: null, order_id: orderId });
      }
    } catch (error) {
      console.error('Erro ao carregar conversa:', error);
    }
  };

  const loadMessages = async (conversationId = null) => {
    if (!conversationId && !conversation?.id) return;
    
    try {
      const convId = conversationId || conversation.id;
      const result = await storeService.getConversationMessages(convId);
      
      if (result.success) {
        setMessages(result.messages || []);
        // Scroll para o final
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !conversation) return;

    try {
      setSendingMessage(true);
      
      // Se não tem conversa ainda, criar ao enviar primeira mensagem
      let convId = conversation.id;
      if (!convId) {
        // Criar conversa primeiro (o backend cria automaticamente ao enviar mensagem)
        // Por enquanto, vamos tentar enviar e o backend cria
        convId = 'new'; // Placeholder
      }

      const result = await storeService.sendMessage(convId === 'new' ? null : convId, messageText, orderId);
      
      if (result.success) {
        setMessageText('');
        // Recarregar conversa e mensagens
        await loadConversation();
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      Alert.alert('Erro', 'Erro ao enviar mensagem. ' + error.message);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleCancelOrder = () => {
    Alert.alert(
      'Cancelar Pedido',
      'Tem certeza que deseja cancelar este pedido?',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await storeService.cancelOrder(orderId);
              if (result.success) {
                Alert.alert('Sucesso', 'Pedido cancelado com sucesso');
                loadOrder();
              }
            } catch (error) {
              Alert.alert('Erro', 'Erro ao cancelar pedido. ' + error.message);
            }
          },
        },
      ]
    );
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    const colorsMap = {
      pending: colors.warning,
      confirmed: colors.info,
      processing: colors.info,
      shipped: colors.primary,
      delivered: colors.success,
      cancelled: colors.error,
    };
    return colorsMap[status] || colors.gray500;
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pendente',
      confirmed: 'Confirmado',
      processing: 'Em Processamento',
      shipped: 'Enviado',
      delivered: 'Entregue',
      cancelled: 'Cancelado',
    };
    return labels[status] || status;
  };

  const renderMessage = ({ item }) => {
    const isOwn = item.sender_id === user?.id;
    
    return (
      <View style={[styles.messageContainer, isOwn && styles.messageContainerOwn]}>
        <View style={[styles.messageBubble, isOwn && styles.messageBubbleOwn]}>
          <Text style={[styles.messageText, isOwn && styles.messageTextOwn]}>
            {item.content}
          </Text>
          <Text style={[styles.messageTime, isOwn && styles.messageTimeOwn]}>
            {formatDate(item.created_at)}
          </Text>
        </View>
      </View>
    );
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

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Pedido não encontrado</Text>
        </View>
      </SafeAreaView>
    );
  }

  const canCancel = ['pending', 'confirmed', 'processing'].includes(order.status);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pedido {order.order_number}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'details' && styles.tabActive]}
          onPress={() => setActiveTab('details')}
        >
          <Text style={[styles.tabText, activeTab === 'details' && styles.tabTextActive]}>
            Detalhes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'chat' && styles.tabActive]}
          onPress={() => setActiveTab('chat')}
        >
          <Text style={[styles.tabText, activeTab === 'chat' && styles.tabTextActive]}>
            Conversar
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'details' ? (
        <ScrollView style={styles.content}>
          {/* Status */}
          <View style={styles.statusCard}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                {getStatusLabel(order.status)}
              </Text>
            </View>
            <Text style={styles.statusDate}>
              Pedido em {formatDate(order.created_at)}
            </Text>
          </View>

          {/* Fornecedor */}
          {order.supplier && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Fornecedor</Text>
              <Text style={styles.sectionText}>{order.supplier.company_name}</Text>
            </View>
          )}

          {/* Itens do Pedido */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Itens do Pedido</Text>
            {order.items?.map((item, index) => (
              <View key={index} style={styles.orderItem}>
                <View style={styles.orderItemInfo}>
                  <Text style={styles.orderItemName}>
                    {item.product?.name || 'Produto'}
                  </Text>
                  <Text style={styles.orderItemQuantity}>
                    {item.quantity}x {formatPrice(item.price)}
                  </Text>
                </View>
                <Text style={styles.orderItemSubtotal}>
                  {formatPrice(item.subtotal)}
                </Text>
              </View>
            ))}
          </View>

          {/* Informações de Pagamento */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pagamento</Text>
            <Text style={styles.sectionText}>
              {order.payment_method === 'credit_card' ? 'Cartão de Crédito' :
               order.payment_method === 'debit_card' ? 'Cartão de Débito' :
               order.payment_method === 'pix' ? 'PIX' :
               order.payment_method === 'boleto' ? 'Boleto' : order.payment_method}
            </Text>
            <Text style={styles.sectionSubtext}>
              Status: {order.payment_status === 'pending' ? 'Pendente' :
                      order.payment_status === 'paid' ? 'Pago' :
                      order.payment_status === 'refunded' ? 'Reembolsado' : order.payment_status}
            </Text>
          </View>

          {/* Endereço de Entrega */}
          {order.shipping_address && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Endereço de Entrega</Text>
              <Text style={styles.sectionText}>
                {order.shipping_address}, {order.shipping_number}
                {order.shipping_complement && `, ${order.shipping_complement}`}
              </Text>
              <Text style={styles.sectionText}>
                {order.shipping_neighborhood}, {order.shipping_city} - {order.shipping_state}
              </Text>
              <Text style={styles.sectionText}>CEP: {order.shipping_zip_code}</Text>
            </View>
          )}

          {/* Total */}
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total do Pedido</Text>
            <Text style={styles.totalValue}>{formatPrice(order.total_amount)}</Text>
          </View>

          {/* Botão Cancelar */}
          {canCancel && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelOrder}
            >
              <Ionicons name="close-circle" size={20} color={colors.error} />
              <Text style={styles.cancelButtonText}>Cancelar Pedido</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      ) : (
        <KeyboardAvoidingView
          style={styles.chatContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={100}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.messagesList}
            ListEmptyComponent={
              <View style={styles.emptyMessagesContainer}>
                <Ionicons name="chatbubbles-outline" size={64} color={colors.gray400} />
                <Text style={styles.emptyMessagesText}>
                  Nenhuma mensagem ainda. Inicie a conversa!
                </Text>
              </View>
            }
          />
          
          <View style={styles.chatInputContainer}>
            <TextInput
              style={styles.chatInput}
              value={messageText}
              onChangeText={setMessageText}
              placeholder="Digite sua mensagem..."
              placeholderTextColor={colors.placeholder}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendButton, (!messageText.trim() || sendingMessage) && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={!messageText.trim() || sendingMessage}
            >
              {sendingMessage ? (
                <ActivityIndicator size="small" color={colors.textWhite} />
              ) : (
                <Ionicons name="send" size={20} color={colors.textWhite} />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textDark,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 16,
    color: colors.textLight,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statusCard: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusDate: {
    fontSize: 14,
    color: colors.textLight,
  },
  section: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  sectionSubtext: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 4,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  orderItemInfo: {
    flex: 1,
  },
  orderItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textDark,
    marginBottom: 4,
  },
  orderItemQuantity: {
    fontSize: 14,
    color: colors.textLight,
  },
  orderItemSubtotal: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  totalCard: {
    backgroundColor: colors.primary + '10',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textDark,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error + '10',
    borderRadius: 8,
    padding: 16,
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    justifyContent: 'flex-start',
  },
  messageContainerOwn: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '75%',
    backgroundColor: colors.gray100,
    borderRadius: 16,
    padding: 12,
  },
  messageBubbleOwn: {
    backgroundColor: colors.primary,
  },
  messageText: {
    fontSize: 16,
    color: colors.textDark,
  },
  messageTextOwn: {
    color: colors.textWhite,
  },
  messageTime: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
  },
  messageTimeOwn: {
    color: colors.textWhite + 'CC',
  },
  emptyMessagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyMessagesText: {
    fontSize: 16,
    color: colors.textLight,
    marginTop: 16,
    textAlign: 'center',
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: colors.backgroundLight,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  chatInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.textDark,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default OrderDetailsScreen;


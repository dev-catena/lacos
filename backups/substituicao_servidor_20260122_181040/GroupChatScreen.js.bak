import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import chatService from '../../services/chatService';
import moment from 'moment';

const GroupChatScreen = ({ route, navigation }) => {
  const { groupId, groupName } = route.params || {};
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const flatListRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  useFocusEffect(
    React.useCallback(() => {
      setError(null); // Limpar erro ao focar na tela
      loadMessages(false); // Carregar sem mostrar alerta inicial
      
      // Iniciar polling para atualizar mensagens a cada 3 segundos
      pollingIntervalRef.current = setInterval(() => {
        loadMessages(false); // Não mostrar alerta no polling
      }, 3000);
      
      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      };
    }, [groupId])
  );

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const loadMessages = async (showError = true) => {
    if (!groupId) return;
    
    try {
      setError(null); // Limpar erro anterior
      const result = await chatService.getGroupMessages(groupId);
      
      if (result.success && result.data) {
        // Converter mensagens do backend para o formato do frontend
        const formattedMessages = result.data.map(msg => ({
          id: msg.id,
          senderId: msg.sender_id,
          senderName: msg.sender?.name || 'Usuário',
          senderPhoto: msg.sender?.photo_url || msg.sender?.photo || null,
          text: msg.message,
          type: msg.type,
          imageUrl: msg.image_url,
          timestamp: new Date(msg.created_at),
          isOwn: msg.sender_id === user?.id,
        }));
        
        setMessages(formattedMessages);
        setLoading(false);
        setError(null); // Limpar erro em caso de sucesso
        
        // Reiniciar polling se foi parado por erro anterior
        if (!pollingIntervalRef.current) {
          pollingIntervalRef.current = setInterval(() => {
            loadMessages(false); // Não mostrar alerta no polling
          }, 3000);
        }
        
        // Scroll para o final após carregar
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        const errorMessage = result.error || 'Erro ao carregar mensagens do grupo';
        setError(errorMessage);
        setLoading(false);
        
        // Parar polling quando há erro
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        
        if (showError && !errorMessage.includes('mesmo grupo')) {
          Alert.alert('Erro', errorMessage);
        }
      }
    } catch (err) {
      const errorMessage = err.message || 'Erro ao carregar mensagens do grupo';
      console.error('Erro ao carregar mensagens:', err);
      setError(errorMessage);
      setLoading(false);
      
      // Parar polling quando há erro
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      
      if (showError) {
        Alert.alert('Erro', errorMessage);
      }
    }
  };

  const handleSendText = async () => {
    if (!inputText.trim() || !groupId) return;

    const textToSend = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const result = await chatService.sendGroupMessage(groupId, textToSend);
      
      if (result.success) {
        // Recarregar mensagens para pegar a mensagem salva do backend
        await loadMessages();
      } else {
        Alert.alert('Erro', result.error || 'Erro ao enviar mensagem');
        // Restaurar texto se falhar
        setInputText(textToSend);
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      Alert.alert('Erro', 'Não foi possível enviar a mensagem');
      setInputText(textToSend);
    } finally {
      setSending(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permissão necessária',
          'Precisamos de permissão para acessar suas fotos.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSending(true);

        try {
          const sendResult = await chatService.sendGroupImageMessage(
            groupId,
            result.assets[0].uri
          );
          
          if (sendResult.success) {
            // Recarregar mensagens
            await loadMessages();
          } else {
            Alert.alert('Erro', sendResult.error || 'Erro ao enviar imagem');
          }
        } catch (error) {
          console.error('Erro ao enviar imagem:', error);
          Alert.alert('Erro', 'Não foi possível enviar a imagem');
        } finally {
          setSending(false);
        }
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
    }
  };

  const renderMessage = ({ item }) => {
    const isOwn = item.isOwn;

    return (
      <View
        style={[
          styles.messageContainer,
          isOwn ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        {!isOwn && (
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              {item.senderPhoto ? (
                <Image
                  source={{ uri: item.senderPhoto }}
                  style={styles.avatarImage}
                />
              ) : (
                <Ionicons name="person" size={20} color={colors.primary} />
              )}
            </View>
          </View>
        )}

        <View style={styles.messageContent}>
          {!isOwn && (
            <Text style={styles.senderName}>{item.senderName}</Text>
          )}
          <View
            style={[
              styles.messageBubble,
              isOwn ? styles.ownBubble : styles.otherBubble,
            ]}
          >
            {item.type === 'text' ? (
              <Text
                style={[
                  styles.messageText,
                  isOwn ? styles.ownMessageText : styles.otherMessageText,
                ]}
              >
                {item.text}
              </Text>
            ) : (
              <Image 
                source={{ uri: item.imageUrl || item.imageUri }} 
                style={styles.messageImage} 
              />
            )}
            <Text
              style={[
                styles.messageTime,
                isOwn ? styles.ownMessageTime : styles.otherMessageTime,
              ]}
            >
              {moment(item.timestamp).format('HH:mm')}
            </Text>
          </View>
        </View>

        {isOwn && (
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              {user?.photo_url || user?.photo ? (
                <Image
                  source={{ uri: user.photo_url || user.photo }}
                  style={styles.avatarImage}
                />
              ) : (
                <Ionicons name="person" size={20} color={colors.secondary} />
              )}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? insets.top + 12 : 12 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{groupName || 'Grupo'}</Text>
          <Text style={styles.headerSubtitle}>
            {messages.length > 0 ? `${messages.length} mensagens` : 'Nenhuma mensagem'}
          </Text>
        </View>
        <TouchableOpacity style={styles.moreButton} activeOpacity={0.7}>
          <Ionicons name="ellipsis-vertical" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Messages List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error || '#FF6B6B'} />
          <Text style={styles.errorTitle}>Erro ao carregar mensagens</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              setError(null);
              
              // Parar polling atual se existir
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
              }
              
              // Tentar carregar mensagens
              // O loadMessages vai reiniciar o polling automaticamente se for bem-sucedido
              loadMessages(true);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={20} color={colors.white} />
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.imageButton}
            onPress={handlePickImage}
            activeOpacity={0.7}
          >
            <Ionicons name="image-outline" size={24} color={colors.primary} />
          </TouchableOpacity>

          <TextInput
            style={styles.textInput}
            placeholder="Digite sua mensagem..."
            placeholderTextColor={colors.textLight}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || sending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSendText}
            disabled={!inputText.trim() || sending}
            activeOpacity={0.7}
          >
            <Ionicons
              name="send"
              size={20}
              color={inputText.trim() ? colors.white : colors.textLight}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textLight,
    marginTop: 2,
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  ownMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginHorizontal: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  messageContent: {
    maxWidth: '70%',
    flex: 1,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: 4,
    marginLeft: 4,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
  },
  ownBubble: {
    backgroundColor: '#C8A8E9', // Roxo pastel
    borderBottomRightRadius: 4,
    alignSelf: 'flex-end',
  },
  otherBubble: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: 4,
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#2D1B3D', // Texto escuro para contraste com roxo pastel
  },
  otherMessageText: {
    color: colors.text,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  ownMessageTime: {
    color: '#2D1B3D',
    opacity: 0.7,
    textAlign: 'right',
  },
  otherMessageTime: {
    color: colors.textLight,
    textAlign: 'left',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
    gap: 8,
  },
  imageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: colors.backgroundLight,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#C8A8E9', // Roxo pastel
  },
  sendButtonDisabled: {
    backgroundColor: colors.backgroundLight,
  },
});

export default GroupChatScreen;


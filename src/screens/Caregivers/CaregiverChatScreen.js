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

const CaregiverChatScreen = ({ route, navigation }) => {
  const { caregiverId, caregiverName, caregiver } = route.params || {};
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  
  // Foto do caregiver
  const caregiverPhoto = caregiver?.photo_url || caregiver?.photo || null;

  useFocusEffect(
    React.useCallback(() => {
      loadMessages();
      
      // Iniciar polling para atualizar mensagens a cada 3 segundos
      pollingIntervalRef.current = setInterval(() => {
        loadMessages();
      }, 3000);
      
      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }, [caregiverId])
  );

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const loadMessages = async () => {
    if (!caregiverId) return;
    
    try {
      const result = await chatService.getConversation(caregiverId);
      
      if (result.success && result.data) {
        // Converter mensagens do backend para o formato do frontend
        const formattedMessages = result.data.map(msg => ({
          id: msg.id,
          senderId: msg.sender_id,
          senderName: msg.sender?.name || 'Usuário',
          senderPhoto: msg.sender?.photo_url || msg.sender?.photo || null,
          receiverId: msg.receiver_id,
          receiverName: msg.receiver?.name || 'Usuário',
          receiverPhoto: msg.receiver?.photo_url || msg.receiver?.photo || null,
          text: msg.message,
          type: msg.type,
          imageUrl: msg.image_url,
          timestamp: new Date(msg.created_at),
          isOwn: msg.sender_id === user?.id,
        }));
        
        setMessages(formattedMessages);
        setLoading(false);
        
        // Scroll para o final após carregar
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        if (result.error && !result.error.includes('mesmo grupo')) {
          Alert.alert('Erro', result.error || 'Erro ao carregar mensagens');
        }
        setLoading(false);
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      setLoading(false);
    }
  };

  const handleSendText = async () => {
    if (!inputText.trim() || !caregiverId) return;

    const textToSend = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const result = await chatService.sendTextMessage(caregiverId, textToSend);
      
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
          const sendResult = await chatService.sendImageMessage(
            caregiverId,
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
              {item.senderPhoto || caregiverPhoto ? (
                <Image
                  source={{ uri: item.senderPhoto || caregiverPhoto }}
                  style={styles.avatarImage}
                />
              ) : (
                <Ionicons name="person" size={20} color={colors.primary} />
              )}
            </View>
          </View>
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
          <Text style={styles.headerTitle}>{caregiverName || 'Cuidador'}</Text>
          <Text style={styles.headerSubtitle}>Online</Text>
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
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
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
  messageBubble: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 16,
  },
  ownBubble: {
    backgroundColor: '#C8A8E9', // Roxo pastel
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: 4,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CaregiverChatScreen;


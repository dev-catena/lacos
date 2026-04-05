import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import colors from '../../constants/colors';
import chatService from '../../services/chatService';
import API_CONFIG from '../../config/api';
import { MessagesIcon, PersonIcon } from '../../components/CustomIcons';

/**
 * Lista de conversas para cuidador profissional - mensagens de usuários que o contataram
 */
const CaregiverMessagesListScreen = ({ navigation }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadConversations();
    }, [])
  );

  const loadConversations = async () => {
    try {
      setLoading(true);
      const result = await chatService.getConversations();

      if (result.success && result.data) {
        setConversations(Array.isArray(result.data) ? result.data : []);
      } else {
        setConversations([]);
      }
    } catch (error) {
      console.error('CaregiverMessagesListScreen - Erro:', error);
      setConversations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  const openChat = (conv) => {
    const otherUser = conv.other_user;
    if (!otherUser?.id) return;

    navigation.navigate('CaregiverChat', {
      caregiverId: otherUser.id,
      caregiverName: otherUser.name,
      caregiver: otherUser,
    });
  };

  const getPhotoUrl = (user) => {
    const photo = user?.photo_url || user?.photo;
    if (!photo) return null;
    if (photo.startsWith('http://') || photo.startsWith('https://')) return photo;
    const baseUrl = API_CONFIG.BASE_URL.replace('/api', '');
    return photo.startsWith('/') ? `${baseUrl}${photo}` : `${baseUrl}/${photo}`;
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return date.toLocaleDateString('pt-BR', { weekday: 'short' });
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const renderConversation = ({ item }) => {
    const otherUser = item.other_user;
    const lastMsg = item.last_message;
    const unread = item.unread_count || 0;

    const preview = lastMsg?.message || '';
    const previewText = preview.length > 50 ? preview.substring(0, 50) + '...' : preview;
    const isImage = lastMsg?.type === 'image';

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => openChat(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          {getPhotoUrl(otherUser) ? (
            <Image
              source={{ uri: getPhotoUrl(otherUser) }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <PersonIcon size={28} color={colors.textWhite} />
            </View>
          )}
          {unread > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text>
            </View>
          )}
        </View>
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={[styles.name, unread > 0 && styles.nameUnread]} numberOfLines={1}>
              {otherUser?.name || 'Usuário'}
            </Text>
            <Text style={styles.time}>{formatTime(item.last_message_at)}</Text>
          </View>
          <Text style={[styles.preview, unread > 0 && styles.previewUnread]} numberOfLines={1}>
            {isImage ? '📷 Imagem' : previewText || 'Sem mensagens'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && conversations.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <Text style={styles.title}>Mensagens</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando conversas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>Mensagens</Text>
        <Text style={styles.subtitle}>
          Conversas com quem te contatou
        </Text>
      </View>
      {conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MessagesIcon size={64} color={colors.gray400} />
          <Text style={styles.emptyTitle}>Nenhuma conversa</Text>
          <Text style={styles.emptyText}>
            Quando alguém te encontrar na busca de cuidadores e enviar uma mensagem, ela aparecerá aqui.
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => String(item.other_user?.id || Math.random())}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
        />
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textLight,
  },
  listContent: {
    paddingVertical: 8,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.backgroundLight,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.error,
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: colors.textWhite,
    fontSize: 11,
    fontWeight: 'bold',
  },
  conversationContent: {
    flex: 1,
    marginLeft: 14,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  nameUnread: {
    fontWeight: '700',
  },
  time: {
    fontSize: 12,
    color: colors.textLight,
  },
  preview: {
    fontSize: 14,
    color: colors.textLight,
  },
  previewUnread: {
    color: colors.text,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
});

export default CaregiverMessagesListScreen;

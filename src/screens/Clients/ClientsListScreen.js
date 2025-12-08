import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Image,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import colors from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/apiService';
import Toast from 'react-native-toast-message';

const ClientsListScreen = ({ navigation }) => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clients, setClients] = useState([]);

  useFocusEffect(
    React.useCallback(() => {
      loadClients();
    }, [])
  );

  const loadClients = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/caregivers/clients');
      
      if (response && response.success && response.data) {
        setClients(response.data);
      } else {
        throw new Error(response?.message || 'Erro ao carregar clientes');
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: error.message || 'Não foi possível carregar a lista de clientes',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadClients();
  };

  const renderStars = (rating) => {
    if (!rating || rating === 0) return null;
    
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons key={i} name="star" size={14} color="#FFD4A3" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Ionicons key="half" name="star-half" size={14} color="#FFD4A3" />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons key={`empty-${i}`} name="star-outline" size={14} color="#E5E5E5" />
      );
    }

    return stars;
  };

  const renderClientCard = (client) => (
    <TouchableOpacity
      key={client.id}
      style={[styles.clientCard, { borderWidth: 0, borderColor: 'transparent' }]}
      onPress={() => navigation.navigate('ClientDetails', { client })}
      activeOpacity={0.7}
    >
      <View style={styles.clientHeader}>
        <View style={styles.clientAvatar}>
          {client.photo_url || client.photo ? (
            <Image
              source={{ uri: client.photo_url || client.photo }}
              style={styles.clientAvatarImage}
            />
          ) : (
            <Ionicons
              name="person"
              size={32}
              color={colors.primary}
            />
          )}
        </View>
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>{client.name}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={colors.textLight} />
            <Text style={styles.locationText}>
              {client.city ? `${client.neighborhood || ''}, ${client.city}` : 'Localização não informada'}
            </Text>
          </View>
          {client.group_name && (
            <View style={styles.groupRow}>
              <Ionicons name="people-outline" size={14} color={colors.textLight} />
              <Text style={styles.groupText}>{client.group_name}</Text>
            </View>
          )}
          {(client.rating || client.rating === 0) && (
            <View style={styles.ratingRow}>
              <View style={styles.starsContainer}>
                {renderStars(client.rating)}
              </View>
              <Text style={styles.ratingText}>
                {client.rating ? client.rating.toFixed(1) : '0.0'}
              </Text>
              {client.reviews_count > 0 && (
                <Text style={styles.reviewsCountText}>
                  ({client.reviews_count} {client.reviews_count === 1 ? 'avaliação' : 'avaliações'})
                </Text>
              )}
            </View>
          )}
        </View>
      </View>

      {client.phone && (
        <View style={styles.contactRow}>
          <Ionicons name="call-outline" size={16} color={colors.textLight} />
          <Text style={styles.contactText}>{client.phone}</Text>
        </View>
      )}

      {client.email && (
        <View style={styles.contactRow}>
          <Ionicons name="mail-outline" size={16} color={colors.textLight} />
          <Text style={styles.contactText}>{client.email}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Meus Clientes</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando clientes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? insets.top + 16 : 16 }]}>
        <Text style={styles.headerTitle}>Meus Clientes</Text>
        <Text style={styles.headerSubtitle}>
          Admins dos grupos em que você participa
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {clients.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={colors.gray400} />
            <Text style={styles.emptyText}>Nenhum cliente encontrado</Text>
            <Text style={styles.emptySubtext}>
              Você ainda não foi adicionado a nenhum grupo
            </Text>
          </View>
        ) : (
          clients.map(renderClientCard)
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textLight,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textLight,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  clientCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 0,
    borderColor: 'transparent',
    overflow: 'hidden',
    // Remover elevation no Android para evitar borda
    ...(Platform.OS === 'android' ? {
      elevation: 0,
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    }),
  },
  clientHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  clientAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  clientAvatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  locationText: {
    fontSize: 13,
    color: colors.textLight,
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  groupText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  contactText: {
    fontSize: 14,
    color: colors.text,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 4,
  },
  reviewsCountText: {
    fontSize: 12,
    color: colors.textLight,
    marginLeft: 4,
  },
});

export default ClientsListScreen;


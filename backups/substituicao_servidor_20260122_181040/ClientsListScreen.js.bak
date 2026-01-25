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
import { useFocusEffect } from '@react-navigation/native';
import colors from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/apiService';
import Toast from 'react-native-toast-message';
import API_CONFIG from '../../config/api';
import {
  PersonIcon,
  LocationIcon,
  PeopleIcon,
  CallIcon,
  MailIcon,
  StarIcon,
  MaleIcon,
  FemaleIcon,
} from '../../components/CustomIcons';

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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/51b97caa-ec63-41d9-9fe3-852605fb57dc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ClientsListScreen.js:36',message:'loadClients entry',data:{userId:user?.id,userRole:user?.role,userName:user?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    try {
      setLoading(true);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/51b97caa-ec63-41d9-9fe3-852605fb57dc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ClientsListScreen.js:39',message:'Before API call',data:{endpoint:'/caregivers/clients'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      const response = await apiService.get('/caregivers/clients');
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/51b97caa-ec63-41d9-9fe3-852605fb57dc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ClientsListScreen.js:42',message:'After API call',data:{hasResponse:!!response,responseType:typeof response,hasSuccess:response?.success,hasData:!!response?.data,responseKeys:response?Object.keys(response):[],message:response?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      if (response && response.success && response.data) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/51b97caa-ec63-41d9-9fe3-852605fb57dc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ClientsListScreen.js:45',message:'Success path',data:{clientsCount:Array.isArray(response.data)?response.data.length:'not-array',firstClient:Array.isArray(response.data)&&response.data.length>0?response.data[0]:null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        setClients(response.data);
      } else {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/51b97caa-ec63-41d9-9fe3-852605fb57dc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ClientsListScreen.js:48',message:'Response validation failed',data:{hasResponse:!!response,responseSuccess:response?.success,responseMessage:response?.message,fullResponse:JSON.stringify(response)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        throw new Error(response?.message || 'Erro ao carregar clientes');
      }
    } catch (error) {
      // #region agent log
      const errorLogData = {
        location: 'ClientsListScreen.js:51',
        message: 'Error caught',
        data: {
          errorMessage: error?.message,
          errorStatus: error?.status,
          errorErrors: error?.errors,
          fullError: JSON.stringify(error),
          errorType: typeof error,
          errorKeys: error ? Object.keys(error) : [],
          errorStack: error?.stack,
          errorString: String(error),
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'F'
      };
      console.log('🔍 DEBUG ERROR:', JSON.stringify(errorLogData, null, 2));
      fetch('http://127.0.0.1:7242/ingest/51b97caa-ec63-41d9-9fe3-852605fb57dc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(errorLogData)}).catch(()=>{});
      // #endregion
      console.error('Erro ao carregar clientes:', error);
      console.error('Erro completo (stringified):', JSON.stringify(error, null, 2));
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: error.message || 'Não foi possível carregar a lista de clientes',
      });
    } finally {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/51b97caa-ec63-41d9-9fe3-852605fb57dc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ClientsListScreen.js:59',message:'loadClients finally',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
      // #endregion
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
        <StarIcon key={i} size={14} color="#FFD4A3" filled={true} />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <StarIcon key="half" size={14} color="#FFD4A3" filled={false} />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <StarIcon key={`empty-${i}`} size={14} color="#E5E5E5" filled={false} />
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
          {(() => {
            const photoUrl = client.photo_url || client.photo;
            
            if (photoUrl) {
              // Construir URL completa
              let fullPhotoUrl = photoUrl;
              
              // Se não é URL completa, construir
              if (!photoUrl.startsWith('http://') && !photoUrl.startsWith('https://')) {
                const baseUrl = API_CONFIG.BASE_URL.replace('/api', '');
                fullPhotoUrl = photoUrl.startsWith('/') 
                  ? `${baseUrl}${photoUrl}` 
                  : `${baseUrl}/${photoUrl}`;
              }
              
              return (
                <Image
                  source={{ uri: fullPhotoUrl }}
                  style={styles.clientAvatarImage}
                  onError={(error) => {
                    console.log('❌ ClientsListScreen - Erro ao carregar foto:', error);
                  }}
                  resizeMode="cover"
                />
              );
            }
            
            // Se não há foto, mostrar placeholder com iniciais
            const initials = client.name
              ? client.name
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .toUpperCase()
                  .substring(0, 2)
              : '?';
            
            return (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            );
          })()}
        </View>
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>{client.name}</Text>
          <View style={styles.locationRow}>
            <LocationIcon size={14} color={colors.textLight} />
            <Text style={styles.locationText}>
              {client.city ? `${client.neighborhood || ''}, ${client.city}` : 'Localização não informada'}
            </Text>
          </View>
          {client.group_name && (
            <View style={styles.groupRow}>
              <PeopleIcon size={14} color={colors.textLight} />
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
          <CallIcon size={16} color={colors.textLight} />
          <Text style={styles.contactText}>{client.phone}</Text>
        </View>
      )}

      {client.email && (
        <View style={styles.contactRow}>
          <MailIcon size={16} color={colors.textLight} />
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
          <Text style={styles.headerTitle}>
          {user?.profile === 'doctor' ? 'Meus Pacientes' : 'Meus Clientes'}
        </Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>
            {user?.profile === 'doctor' ? 'Carregando pacientes...' : 'Carregando clientes...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? insets.top + 16 : 16 }]}>
        <Text style={styles.headerTitle}>
          {user?.profile === 'doctor' ? 'Meus Pacientes' : 'Meus Clientes'}
        </Text>
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
            <PeopleIcon size={64} color={colors.gray400} />
            <Text style={styles.emptyText}>
              {user?.profile === 'doctor' ? 'Nenhum paciente encontrado' : 'Nenhum cliente encontrado'}
            </Text>
            <Text style={styles.emptySubtext}>
              {user?.profile === 'doctor' 
                ? 'Você ainda não tem pacientes cadastrados'
                : 'Você ainda não foi adicionado a nenhum grupo'}
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
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
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


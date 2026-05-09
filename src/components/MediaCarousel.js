import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import colors from '../constants/colors';
import moment from 'moment';
import API_CONFIG from '../config/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.7;
const CARD_MARGIN = 12;

const MediaCarousel = ({ media = [], onMediaPress }) => {
  const [loadingMedia, setLoadingMedia] = useState({});
  const [videoErrors, setVideoErrors] = useState({}); // Rastrear vídeos com erro

  // Filtrar mídias válidas (não expiradas - 24h)
  // Usar useMemo para garantir que o filtro seja recalculado quando media mudar
  const validMedia = useMemo(() => {
    const filtered = media.filter(item => {
      if (!item.created_at) return true;
      const createdAt = moment(item.created_at);
      const now = moment();
      const hoursDiff = now.diff(createdAt, 'hours');
      return hoursDiff < 24;
    });
    console.log('🖼️ MediaCarousel - Mídias válidas:', filtered.length, 'de', media.length);
    return filtered;
  }, [media]);

  if (!validMedia || validMedia.length === 0) {
    return null;
  }

  const handleMediaLoad = (mediaId) => {
    setLoadingMedia(prev => ({ ...prev, [mediaId]: false }));
  };

  const handleMediaLoadStart = (mediaId) => {
    setLoadingMedia(prev => ({ ...prev, [mediaId]: true }));
  };

  const renderMediaCard = (item, index) => {
    const isVideo = item.type === 'video' || item.media_type === 'video';
    let mediaUrl = item.url || item.media_url || item.file_url;
    
    // Construir URL completa se for relativa
    if (mediaUrl && !mediaUrl.startsWith('http://') && !mediaUrl.startsWith('https://')) {
      // Extrair o domínio base da API (remover /api do final)
      const baseUrl = API_CONFIG.BASE_URL.replace('/api', '');
      
      // Se começar com /storage, adicionar o domínio do servidor
      if (mediaUrl.startsWith('/storage/')) {
        mediaUrl = `${baseUrl}${mediaUrl}`;
      } else if (mediaUrl.startsWith('storage/')) {
        mediaUrl = `${baseUrl}/${mediaUrl}`;
      } else {
        // Tentar construir URL completa
        mediaUrl = mediaUrl.startsWith('/') ? `${baseUrl}${mediaUrl}` : `${baseUrl}/${mediaUrl}`;
      }
    }
    
    // Calcular tempo restante até expirar
    const createdAt = moment(item.created_at);
    const expiresAt = createdAt.clone().add(24, 'hours');
    const hoursLeft = expiresAt.diff(moment(), 'hours');

    return (
      <TouchableOpacity
        key={item.id || index}
        style={styles.mediaCard}
        onPress={() => onMediaPress && onMediaPress(item)}
        activeOpacity={0.8}
      >
        {loadingMedia[item.id] && (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        )}

        {mediaUrl ? (
          isVideo ? (
            videoErrors[item.id] ? (
              // Fallback quando vídeo não pode ser carregado
              <View style={[styles.mediaContent, { backgroundColor: colors.gray200, justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="videocam-off" size={48} color={colors.gray400} />
                <Text style={{ color: colors.gray400, marginTop: 8, fontSize: 12, textAlign: 'center', paddingHorizontal: 8 }}>
                  Vídeo não suportado
                </Text>
                <Text style={{ color: colors.gray300, marginTop: 4, fontSize: 10, textAlign: 'center', paddingHorizontal: 8 }}>
                  Toque para tentar reproduzir
                </Text>
              </View>
            ) : (
              <Video
                source={{ uri: mediaUrl }}
                style={styles.mediaContent}
                resizeMode="cover"
                shouldPlay={false}
                isLooping={false}
                useNativeControls={false}
                pointerEvents="none"
                onLoadStart={() => handleMediaLoadStart(item.id)}
                onLoad={() => {
                  handleMediaLoad(item.id);
                  // Limpar erro se carregou com sucesso
                  setVideoErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors[item.id];
                    return newErrors;
                  });
                }}
                onError={(error) => {
                  // Verificar se é erro de codec não suportado
                  const errorMessage = error?.message || error?.toString() || '';
                  const isCodecError = errorMessage.includes('decoder') || 
                                     errorMessage.includes('HEVC') || 
                                     errorMessage.includes('codec') ||
                                     errorMessage.includes('h265') ||
                                     errorMessage.includes('mtk.hevc');
                  
                  if (isCodecError) {
                    // Logar apenas como warning, não como erro crítico
                    console.warn('⚠️ MediaCarousel - Codec de vídeo não suportado neste dispositivo');
                    // Marcar vídeo como com erro para mostrar fallback
                    setVideoErrors(prev => ({ ...prev, [item.id]: true }));
                  } else {
                    // Para outros erros, logar normalmente
                    console.error('❌ MediaCarousel - Erro ao carregar vídeo:', error);
                  }
                  
                  handleMediaLoad(item.id);
                }}
              />
            )
          ) : (
            <Image
              source={{ uri: mediaUrl }}
              style={styles.mediaContent}
              resizeMode="cover"
              onLoadStart={() => handleMediaLoadStart(item.id)}
              onLoad={() => handleMediaLoad(item.id)}
              onError={(error) => {
                console.error('❌ MediaCarousel - Erro ao carregar imagem:', error);
                handleMediaLoad(item.id);
              }}
            />
          )
        ) : (
          <View style={[styles.mediaContent, { backgroundColor: colors.gray200, justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name={isVideo ? 'videocam-outline' : 'image-outline'} size={48} color={colors.gray400} />
            <Text style={{ color: colors.gray400, marginTop: 8, fontSize: 12 }}>URL não disponível</Text>
          </View>
        )}

        {isVideo && (
          <View style={styles.playIcon} pointerEvents="none">
            <Ionicons name="play-circle" size={48} color="#FFFFFF" />
          </View>
        )}

        {/* Info overlay */}
        <View style={styles.mediaInfo} pointerEvents="none">
          {item.description && (
            <Text style={styles.mediaDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          
          <View style={styles.mediaFooter}>
            <View style={styles.timeInfo}>
              <Ionicons name="time-outline" size={14} color="#FFFFFF" />
              <Text style={styles.timeText}>
                {hoursLeft > 1 ? `${hoursLeft}h restantes` : 'Expira em breve'}
              </Text>
            </View>
            
            {item.posted_by_name && (
              <Text style={styles.postedBy}>
                Por: {item.posted_by_name}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="images" size={20} color={colors.primary} />
        <Text style={styles.title}>Momentos Recentes</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{validMedia.length}</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={CARD_WIDTH + CARD_MARGIN * 2}
        decelerationRate="fast"
      >
        {validMedia.map((item, index) => renderMediaCard(item, index))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  mediaCard: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.2,
    borderRadius: 16,
    marginRight: CARD_MARGIN,
    backgroundColor: colors.lightGray,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  mediaContent: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  playIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -24 }, { translateY: -24 }],
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 24,
  },
  mediaInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  mediaDescription: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  mediaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  postedBy: {
    color: '#FFFFFF',
    fontSize: 11,
    opacity: 0.8,
  },
});

export default MediaCarousel;


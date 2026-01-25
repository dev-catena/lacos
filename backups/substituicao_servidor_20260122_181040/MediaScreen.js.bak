import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  RefreshControl,
  SafeAreaView,
  Platform,
  InteractionManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import SafeIcon from '../../components/SafeIcon';
import { Video } from 'expo-av';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import colors from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import mediaService from '../../services/mediaService';
import compressionService from '../../services/compressionService';
import websocketService from '../../services/websocketService';
import moment from 'moment';
import API_CONFIG from '../../config/api';
import VideoPlayerModal from '../../components/VideoPlayerModal';

const MediaScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const { groupId, groupName } = route.params || {};
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [pendingMediaType, setPendingMediaType] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [videoErrors, setVideoErrors] = useState({}); // Rastrear vídeos com erro

  useFocusEffect(
    React.useCallback(() => {
      if (groupId) {
        loadMedia();
        
        // Inicializar WebSocket e escutar eventos
        websocketService.initialize();
        websocketService.listenToGroup(groupId, {
          onMediaDeleted: (data) => {
            console.log('📡 MediaScreen - Mídia deletada via WebSocket:', data);
            console.log('📡 MediaScreen - Dados recebidos:', JSON.stringify(data, null, 2));
            
            // Extrair ID da mídia (pode vir como media_id ou id)
            const deletedMediaId = data.media_id || data.id || data.media?.id;
            
            if (!deletedMediaId) {
              console.warn('⚠️ MediaScreen - ID da mídia não encontrado nos dados:', data);
              // Se não tiver ID, recarregar lista completa
              loadMedia();
              return;
            }
            
            console.log('🗑️ MediaScreen - Removendo mídia ID:', deletedMediaId);
            
            // Remover mídia da lista
            setMedia(prev => {
              const beforeCount = prev.length;
              const filtered = prev.filter(m => {
                // Comparar tanto com id quanto com media_id para garantir
                const mediaId = m.id || m.media_id;
                const shouldKeep = mediaId !== deletedMediaId;
                if (!shouldKeep) {
                  console.log('✅ MediaScreen - Mídia removida:', mediaId);
                }
                return shouldKeep;
              });
              const afterCount = filtered.length;
              
              if (beforeCount === afterCount) {
                console.warn('⚠️ MediaScreen - Mídia não encontrada na lista para remover:', deletedMediaId);
                console.log('📋 MediaScreen - IDs na lista atual:', prev.map(m => m.id || m.media_id));
              } else {
                console.log(`✅ MediaScreen - Mídia removida: ${beforeCount} → ${afterCount} itens`);
              }
              
              return filtered;
            });
          },
          onMediaCreated: (data) => {
            console.log('📡 MediaScreen - Nova mídia criada via WebSocket:', data);
            
            // Se os dados da mídia estão disponíveis, adicionar diretamente
            if (data.media && data.media.id) {
              console.log('📡 MediaScreen - Adicionando mídia via WebSocket:', data.media);
              setMedia(prev => {
                // Verificar se já existe para evitar duplicatas
                const exists = prev.some(m => m.id === data.media.id);
                if (exists) {
                  console.log('📡 MediaScreen - Mídia já existe na lista, atualizando...');
                  return prev.map(m => m.id === data.media.id ? data.media : m);
                }
                // Adicionar no início da lista
                return [data.media, ...prev];
              });
            } else {
              // Se não tiver dados completos, recarregar lista
              console.log('📡 MediaScreen - Recarregando lista completa...');
              loadMedia();
            }
          },
        });
      }

      // Cleanup quando perder foco
      return () => {
        if (groupId) {
          websocketService.stopListeningToGroup(groupId);
        }
      };
    }, [groupId])
  );

  const loadMedia = async () => {
    if (!groupId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const result = await mediaService.getGroupMedia(groupId);
      
      if (result.success && result.data) {
        setMedia(result.data);
      } else {
        setMedia([]);
      }
    } catch (error) {
      console.error('Erro ao carregar mídias:', error);
      setMedia([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadMedia();
  };

  const handlePickMedia = async (type) => {
    // Salvar o tipo e fechar modal - a galeria será aberta quando o modal fechar
    setPendingMediaType(type);
    setShowMediaPicker(false);
  };

  const openImagePicker = async (type) => {
    try {
      // Solicitar permissão
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permissão Necessária',
          'Precisamos de permissão para acessar suas fotos e vídeos.'
        );
        return;
      }

      // Abrir galeria
      // Usar qualidade reduzida para imagens (similar ao WhatsApp)
      // A compressão adicional será feita pelo compressionService se necessário
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: type === 'video' 
          ? ImagePicker.MediaTypeOptions.Videos 
          : ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: type === 'video' ? 1.0 : 0.85, // Vídeos: qualidade máxima (será comprimido depois), Imagens: 85%
        allowsMultipleSelection: false,
        ...(Platform.OS === 'ios' && {
          presentationStyle: 'fullScreen',
        }),
      });

      // Processar resultado
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        await uploadMedia(asset, type);
      }
    } catch (error) {
      console.error('Erro ao selecionar mídia:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a mídia');
    }
  };

  const uploadMedia = async (asset, type) => {
    console.log('📤 MediaScreen - Iniciando upload de mídia');
    console.log('📤 MediaScreen - Grupo ID:', groupId);
    console.log('📤 MediaScreen - Grupo Nome:', groupName);
    console.log('📤 MediaScreen - Asset URI:', asset.uri);
    console.log('📤 MediaScreen - Tipo:', type);
    
    const originalFileSize = asset.fileSize || 0;
    const originalFileSizeMB = originalFileSize > 0 ? (originalFileSize / 1024 / 1024) : 0;
    
    // Validar tamanho do arquivo antes de tentar upload
    // Limites: 100MB para vídeos, 50MB para imagens
    const maxSizeMB = type === 'video' ? 100 : 50;
    
    if (originalFileSize > 0 && originalFileSizeMB > maxSizeMB) {
      Alert.alert(
        'Arquivo muito grande',
        `O ${type === 'video' ? 'vídeo' : 'foto'} selecionado tem ${originalFileSizeMB.toFixed(2)}MB.\n\n` +
        `O tamanho máximo permitido é ${maxSizeMB}MB.\n\n` +
        `Por favor, escolha um arquivo menor ou comprima o ${type === 'video' ? 'vídeo' : 'foto'} antes de enviar.`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    setUploading(true);
    
    // Mostrar toast de compressão se necessário
    let shouldCompress = compressionService.shouldCompress(originalFileSize, type);
    if (shouldCompress) {
      Toast.show({
        type: 'info',
        text1: 'Comprimindo...',
        text2: `${type === 'video' ? 'Vídeo' : 'Foto'} está sendo comprimida para reduzir o tamanho`,
        visibilityTime: 2000,
      });
    }
    
    try {
      // Comprimir mídia se necessário (similar ao WhatsApp)
      let finalAsset = asset;
      if (shouldCompress) {
        console.log('🗜️ MediaScreen - Comprimindo mídia antes do upload...');
        try {
          finalAsset = await compressionService.compressMedia(asset, type);
          
          // Verificar se houve erro na compressão
          if (finalAsset.error) {
            console.warn('⚠️ MediaScreen - Erro na compressão, usando arquivo original:', finalAsset.error);
            Toast.show({
              type: 'info',
              text1: 'Compressão não disponível',
              text2: 'Usando arquivo original',
              visibilityTime: 2000,
            });
            // Usar asset original se compressão falhar
            finalAsset = asset;
          } else if (finalAsset.compressionInfo) {
            const { originalSize, compressedSize, ratio } = finalAsset.compressionInfo;
            const originalMB = (originalSize / 1024 / 1024).toFixed(2);
            const compressedMB = (compressedSize / 1024 / 1024).toFixed(2);
            
            console.log(`✅ MediaScreen - Compressão concluída: ${originalMB}MB → ${compressedMB}MB (${ratio}% redução)`);
            
            Toast.show({
              type: 'success',
              text1: 'Compressão concluída',
              text2: `Tamanho reduzido de ${originalMB}MB para ${compressedMB}MB`,
              visibilityTime: 2000,
            });
          }
        } catch (compressionError) {
          console.error('❌ MediaScreen - Erro ao comprimir mídia:', compressionError);
          // Em caso de erro, usar asset original
          finalAsset = asset;
          Toast.show({
            type: 'info',
            text1: 'Compressão falhou',
            text2: 'Usando arquivo original',
            visibilityTime: 2000,
          });
        }
      }
      
      const finalFileSize = finalAsset.fileSize || originalFileSize;
      const finalFileSizeMB = finalFileSize > 0 ? (finalFileSize / 1024 / 1024) : 0;
      
      const mediaData = {
        uri: finalAsset.uri,
        type: type,
        description: '', // TODO: Adicionar campo de descrição
        fileSize: finalFileSize, // Incluir tamanho do arquivo para cálculo de timeout
      };

      console.log('📤 MediaScreen - Enviando para mediaService.postMedia...');
      console.log('📤 MediaScreen - Tamanho do arquivo:', finalFileSizeMB > 0 ? `${finalFileSizeMB.toFixed(2)}MB` : 'desconhecido');
      if (shouldCompress && finalAsset.compressionInfo) {
        console.log('📤 MediaScreen - Arquivo comprimido antes do upload');
      }
      
      const result = await mediaService.postMedia(groupId, mediaData);
      console.log('📤 MediaScreen - Resultado do upload:', result);

      if (result.success && result.data) {
        console.log('✅ MediaScreen - Upload bem-sucedido!');
        console.log('📦 MediaScreen - Dados retornados:', JSON.stringify(result.data, null, 2));
        
        // Construir URL completa se necessário
        let mediaUrl = result.data.url || result.data.media_url;
        if (mediaUrl && !mediaUrl.startsWith('http://') && !mediaUrl.startsWith('https://')) {
          const baseUrl = API_CONFIG.BASE_URL.replace('/api', '');
          mediaUrl = mediaUrl.startsWith('/') ? `${baseUrl}${mediaUrl}` : `${baseUrl}/${mediaUrl}`;
        }
        
        // Adicionar mídia imediatamente à lista (otimista)
        const newMedia = {
          id: result.data.id,
          group_id: result.data.group_id || groupId,
          type: result.data.type || type,
          url: mediaUrl,
          media_url: mediaUrl,
          thumbnail_url: result.data.thumbnail_url,
          description: result.data.description || '',
          posted_by_user_id: result.data.posted_by_user_id,
          posted_by_name: result.data.posted_by_name || user?.name || 'Você',
          created_at: result.data.created_at || new Date().toISOString(),
          updated_at: result.data.updated_at || new Date().toISOString(),
        };
        
        console.log('➕ MediaScreen - Adicionando mídia à lista:', newMedia.id);
        
        // Adicionar no início da lista
        setMedia(prev => {
          // Verificar se já existe para evitar duplicatas
          const exists = prev.some(m => m.id === newMedia.id);
          if (exists) {
            console.log('⚠️ MediaScreen - Mídia já existe, atualizando...');
            return prev.map(m => m.id === newMedia.id ? newMedia : m);
          }
          console.log('✅ MediaScreen - Nova mídia adicionada à lista');
          return [newMedia, ...prev];
        });
        
        Toast.show({
          type: 'success',
          text1: 'Sucesso',
          text2: `${type === 'video' ? 'Vídeo' : 'Foto'} postada com sucesso!`,
        });
        
        // Recarregar lista após um pequeno delay para garantir sincronização
        setTimeout(() => {
          console.log('🔄 MediaScreen - Recarregando lista para sincronização...');
          loadMedia();
        }, 1000);
      } else {
        console.log('❌ MediaScreen - Falha no upload:', result.error);
        
        // Tratar erro 413 especificamente
        let errorMessage = result.error || 'Erro ao fazer upload';
        if (result.error && result.error.includes('413')) {
          errorMessage = `Arquivo muito grande (${finalFileSizeMB.toFixed(2)}MB).\n\nO tamanho máximo permitido é ${maxSizeMB}MB.\n\nPor favor, escolha um arquivo menor.`;
        }
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('❌ MediaScreen - Erro ao fazer upload:', error);
      
      // Verificar se é erro 413
      let errorMessage = error.message || 'Não foi possível fazer upload da mídia';
      if (error.status === 413 || error.message?.includes('413')) {
        const currentSizeMB = finalFileSizeMB > 0 ? finalFileSizeMB : originalFileSizeMB;
        errorMessage = `Arquivo muito grande (${currentSizeMB.toFixed(2)}MB).\n\nO tamanho máximo permitido é ${maxSizeMB}MB.\n\nPor favor, escolha um arquivo menor.`;
      }
      
      Alert.alert('Erro no Upload', errorMessage);
    } finally {
      setUploading(false);
      console.log('📤 MediaScreen - Upload finalizado');
    }
  };

  const handleDeleteMedia = (mediaId) => {
    Alert.alert(
      'Remover Mídia',
      'Tem certeza que deseja remover esta mídia? Ela desaparecerá para todos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await mediaService.deleteMedia(mediaId);
              
              if (result.success) {
                Toast.show({
                  type: 'success',
                  text1: 'Mídia removida',
                });
                loadMedia();
              }
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Erro',
                text2: 'Não foi possível remover a mídia',
              });
            }
          },
        },
      ]
    );
  };

  const renderMediaItem = ({ item }) => {
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
    
    console.log('🖼️ MediaScreen - Renderizando item:', { 
      id: item.id, 
      type: item.type, 
      url: mediaUrl,
      originalUrl: item.url || item.media_url 
    });
    
    // Calcular tempo restante
    const createdAt = moment(item.created_at);
    const expiresAt = createdAt.clone().add(24, 'hours');
    const hoursLeft = expiresAt.diff(moment(), 'hours');
    const isExpired = hoursLeft <= 0;

    const handleMediaPress = () => {
      if (isVideo && mediaUrl) {
        // Se o vídeo teve erro de codec, tentar abrir mesmo assim (pode funcionar no player)
        if (videoErrors[item.id]) {
          console.log('⚠️ MediaScreen - Tentando reproduzir vídeo que teve erro de codec');
        }
        console.log('▶️ MediaScreen - Reproduzindo vídeo:', mediaUrl);
        setSelectedVideo({
          uri: mediaUrl,
          title: item.description || 'Vídeo',
        });
        setShowVideoPlayer(true);
      }
    };

    return (
      <TouchableOpacity
        style={[styles.mediaItem, isExpired && styles.expiredMedia]}
        onPress={handleMediaPress}
        onLongPress={() => handleDeleteMedia(item.id)}
        activeOpacity={0.8}
      >
        {mediaUrl ? (
          isVideo ? (
            videoErrors[item.id] ? (
              // Fallback quando vídeo não pode ser carregado
              <View style={[styles.mediaThumbnail, { backgroundColor: colors.gray200, justifyContent: 'center', alignItems: 'center' }]}>
                <SafeIcon name="videocam-off" size={48} color={colors.gray400} />
                <Text style={{ color: colors.gray400, marginTop: 8, fontSize: 12, textAlign: 'center', paddingHorizontal: 8 }}>
                  Vídeo não suportado
                </Text>
                <Text style={{ color: colors.gray300, marginTop: 4, fontSize: 10, textAlign: 'center', paddingHorizontal: 8 }}>
                  Toque para tentar reproduzir
                </Text>
              </View>
            ) : (
              <View style={styles.videoContainer}>
                <Video
                  source={{ uri: mediaUrl }}
                  style={styles.mediaThumbnail}
                  resizeMode="cover"
                  shouldPlay={false}
                  useNativeControls={false}
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
                      console.warn('⚠️ MediaScreen - Codec de vídeo não suportado neste dispositivo');
                      // Marcar vídeo como com erro para mostrar fallback
                      setVideoErrors(prev => ({ ...prev, [item.id]: true }));
                    } else {
                      // Para outros erros, logar normalmente
                      console.error('❌ MediaScreen - Erro ao carregar vídeo:', error);
                    }
                  }}
                />
                <View style={styles.playIconOverlay}>
                  <SafeIcon name="play-circle" size={48} color="#FFFFFF" />
                </View>
              </View>
            )
          ) : (
            <Image
              source={{ uri: mediaUrl }}
              style={styles.mediaThumbnail}
              resizeMode="cover"
              onError={(error) => {
                console.error('❌ Erro ao carregar imagem:', error);
              }}
            />
          )
        ) : (
          <View style={[styles.mediaThumbnail, { backgroundColor: colors.gray200, justifyContent: 'center', alignItems: 'center' }]}>
            <SafeIcon name={isVideo ? 'videocam' : 'image'} size={48} color={colors.gray400} />
            <Text style={{ color: colors.gray400, marginTop: 8, fontSize: 12 }}>URL não disponível</Text>
          </View>
        )}
        
        <View style={styles.mediaInfo}>
          <Text style={styles.mediaTime}>
            {isExpired ? 'Expirada' : `${hoursLeft}h restantes`}
          </Text>
          <Text style={styles.mediaDate}>
            {moment(item.created_at).format('DD/MM HH:mm')}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteMedia(item.id)}
        >
          <SafeIcon name="trash-outline" size={20} color="#FF6B6B" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <SafeIcon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Mídias do Grupo</Text>
          {groupName && <Text style={styles.headerSubtitle}>{groupName}</Text>}
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <SafeIcon name="information-circle" size={20} color={colors.primary} />
        <View style={styles.infoTextContainer}>
          <Text style={styles.infoText}>
            Fotos e vídeos postados aqui aparecem para o paciente por 24 horas
          </Text>
        </View>
      </View>

      {/* Media List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={media}
          renderItem={renderMediaItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.mediaList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <SafeIcon name="images" size={64} color={colors.gray300} />
              <Text style={styles.emptyText}>Nenhuma mídia postada</Text>
              <Text style={styles.emptySubtext}>
                Toque no botão + para adicionar fotos ou vídeos
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
            />
          }
        />
      )}

      {/* Add Media Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          console.log('➕ MediaScreen - Botão "+" clicado');
          console.log('➕ MediaScreen - Modal atual:', showMediaPicker);
          setShowMediaPicker(true);
          console.log('➕ MediaScreen - Modal deve abrir agora');
        }}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <SafeIcon name="add" size={32} color="#FFFFFF" />
        )}
      </TouchableOpacity>

      {/* Media Picker Modal */}
      {console.log('🔲 MediaScreen - Renderizando Modal. Visível:', showMediaPicker)}
      <Modal
        visible={showMediaPicker}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowMediaPicker(false);
        }}
        onDismiss={() => {
          // Quando o modal fechar completamente, abrir a galeria se houver tipo pendente
          if (pendingMediaType) {
            const type = pendingMediaType;
            setPendingMediaType(null);
            // Pequeno delay para garantir que o modal fechou completamente
            setTimeout(() => {
              openImagePicker(type);
            }, 100);
          }
        }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            console.log('🔲 MediaScreen - Overlay clicado (fora do menu)');
            setShowMediaPicker(false);
          }}
        >
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={(e) => {
              console.log('🔲 MediaScreen - Clique dentro do menu (não propagar)');
              e.stopPropagation();
            }}
          >
            <View style={styles.pickerMenu}>
              <TouchableOpacity
                style={styles.pickerOption}
                onPress={() => {
                  console.log('🎯 MediaScreen - Botão "Escolher Foto" pressionado');
                  handlePickMedia('image');
                }}
              >
                <SafeIcon name="image" size={24} color={colors.primary} />
                <Text style={styles.pickerOptionText}>Escolher Foto</Text>
              </TouchableOpacity>
              
              <View style={styles.pickerDivider} />
              
              <TouchableOpacity
                style={styles.pickerOption}
                onPress={() => {
                  console.log('🎯 MediaScreen - Botão "Escolher Vídeo" pressionado');
                  handlePickMedia('video');
                }}
              >
                <SafeIcon name="videocam" size={24} color={colors.primary} />
                <Text style={styles.pickerOptionText}>Escolher Vídeo</Text>
              </TouchableOpacity>
              
              <View style={styles.pickerDivider} />
              
              <TouchableOpacity
                style={[styles.pickerOption, styles.cancelOption]}
                onPress={() => {
                  console.log('🎯 MediaScreen - Botão "Cancelar" pressionado');
                  setShowMediaPicker(false);
                }}
              >
                <Text style={styles.cancelOptionText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Video Player Modal */}
      <VideoPlayerModal
        visible={showVideoPlayer}
        videoUri={selectedVideo?.uri}
        videoTitle={selectedVideo?.title}
        onClose={() => {
          setShowVideoPlayer(false);
          setSelectedVideo(null);
        }}
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 2,
  },
  headerRight: {
    width: 40, // Para balancear o backButton
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 12,
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  infoText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaList: {
    padding: 16,
  },
  mediaItem: {
    flex: 1,
    margin: 6,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  expiredMedia: {
    opacity: 0.5,
  },
  videoContainer: {
    position: 'relative',
  },
  mediaThumbnail: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.lightGray,
  },
  playIconOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -24 }, { translateY: -24 }],
  },
  mediaInfo: {
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  mediaTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  mediaDate: {
    fontSize: 10,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 2,
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerMenu: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 16,
  },
  pickerOptionText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  pickerDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 24,
  },
  cancelOption: {
    justifyContent: 'center',
    marginTop: 8,
  },
  cancelOptionText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default MediaScreen;


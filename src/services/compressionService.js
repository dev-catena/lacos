import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

// Tentar importar react-native-compressor (pode não estar disponível no Expo managed)
let VideoCompressor = null;
try {
  const compressorModule = require('react-native-compressor');
  VideoCompressor = compressorModule?.Video;
} catch (error) {
  console.warn('⚠️ CompressionService - react-native-compressor não disponível, compressão de vídeo limitada');
}

/**
 * Serviço de compressão de mídia (imagens e vídeos)
 * Similar ao algoritmo do WhatsApp
 */
class CompressionService {
  /**
   * Comprimir imagem
   * @param {string} uri - URI da imagem original
   * @param {object} options - Opções de compressão
   * @returns {Promise<object>} - { uri, width, height, fileSize }
   */
  async compressImage(uri, options = {}) {
    try {
      console.log('🗜️ CompressionService - Comprimindo imagem:', uri);
      
      // Verificar se o URI é válido
      if (!uri || typeof uri !== 'string') {
        console.warn('⚠️ CompressionService - URI inválido, retornando original');
        return {
          uri: uri,
          error: 'URI inválido',
        };
      }

      const {
        maxWidth = 1920,      // WhatsApp usa ~1920px para imagens
        maxHeight = 1920,
        quality = 0.85,       // WhatsApp usa ~85% de qualidade
        compressFormat = ImageManipulator.SaveFormat.JPEG,
      } = options;

      // Obter informações da imagem original
      let originalInfo;
      try {
        originalInfo = await FileSystem.getInfoAsync(uri);
      } catch (fileError) {
        console.warn('⚠️ CompressionService - Erro ao obter informações do arquivo:', fileError);
        return {
          uri: uri,
          error: 'Erro ao acessar arquivo',
        };
      }

      const originalSize = originalInfo.exists ? originalInfo.size : 0;
      const originalSizeMB = originalSize > 0 ? (originalSize / 1024 / 1024).toFixed(2) : 0;
      
      console.log('📏 CompressionService - Tamanho original:', originalSizeMB, 'MB');

      // Se o arquivo não existe, retornar original
      if (!originalInfo.exists) {
        console.warn('⚠️ CompressionService - Arquivo não encontrado, retornando original');
        return {
          uri: uri,
          fileSize: 0,
          originalSize: 0,
          compressionRatio: 0,
        };
      }

      // Manipular imagem: redimensionar e comprimir
      let manipulatedImage;
      try {
        manipulatedImage = await ImageManipulator.manipulateAsync(
          uri,
          [
            {
              resize: {
                width: maxWidth,
                height: maxHeight,
              },
            },
          ],
          {
            compress: quality,
            format: compressFormat,
          }
        );
      } catch (manipulateError) {
        console.error('❌ CompressionService - Erro ao manipular imagem:', manipulateError);
        // Retornar original em caso de erro
        return {
          uri: uri,
          fileSize: originalSize,
          originalSize: originalSize,
          compressionRatio: 0,
          error: manipulateError.message,
        };
      }

      // Verificar tamanho final
      let compressedInfo;
      try {
        compressedInfo = await FileSystem.getInfoAsync(manipulatedImage.uri);
      } catch (infoError) {
        console.warn('⚠️ CompressionService - Erro ao obter informações da imagem comprimida:', infoError);
        // Se não conseguir obter informações, usar valores da imagem manipulada
        return {
          uri: manipulatedImage.uri,
          width: manipulatedImage.width,
          height: manipulatedImage.height,
          fileSize: originalSize, // Usar tamanho original como fallback
          originalSize: originalSize,
          compressionRatio: 0,
          warning: 'Não foi possível verificar o tamanho final',
        };
      }

      const compressedSize = compressedInfo.exists ? compressedInfo.size : 0;
      const compressedSizeMB = compressedSize > 0 ? (compressedSize / 1024 / 1024).toFixed(2) : 0;
      
      const compressionRatio = originalSize > 0 
        ? ((1 - compressedSize / originalSize) * 100).toFixed(1) 
        : 0;

      console.log('✅ CompressionService - Imagem comprimida:', {
        original: `${originalSizeMB}MB`,
        compressed: `${compressedSizeMB}MB`,
        reduction: `${compressionRatio}%`,
        dimensions: `${manipulatedImage.width}x${manipulatedImage.height}`,
      });

      return {
        uri: manipulatedImage.uri,
        width: manipulatedImage.width,
        height: manipulatedImage.height,
        fileSize: compressedSize,
        originalSize: originalSize,
        compressionRatio: parseFloat(compressionRatio),
      };
    } catch (error) {
      console.error('❌ CompressionService - Erro ao comprimir imagem:', error);
      // Em caso de erro, retornar a imagem original com informações básicas
      try {
        const originalInfo = await FileSystem.getInfoAsync(uri);
        const originalSize = originalInfo.exists ? originalInfo.size : 0;
        return {
          uri: uri,
          fileSize: originalSize,
          originalSize: originalSize,
          compressionRatio: 0,
          error: error.message,
        };
      } catch (fallbackError) {
        return {
          uri: uri,
          fileSize: 0,
          originalSize: 0,
          compressionRatio: 0,
          error: error.message,
        };
      }
    }
  }

  /**
   * Comprimir vídeo
   * @param {string} uri - URI do vídeo original
   * @param {object} options - Opções de compressão
   * @returns {Promise<object>} - { uri, fileSize }
   */
  async compressVideo(uri, options = {}) {
    let originalSize = 0;
    
    try {
      console.log('🗜️ CompressionService - Comprimindo vídeo:', uri);
      
      const {
        quality = 'medium',   // 'low', 'medium', 'high'
        bitrate = null,       // Bitrate customizado (opcional)
        maxWidth = 1280,      // WhatsApp usa ~1280px para vídeos
        maxHeight = 1280,
      } = options;

      // Obter informações do vídeo original
      const originalInfo = await FileSystem.getInfoAsync(uri);
      originalSize = originalInfo.exists ? originalInfo.size : 0;
      const originalSizeMB = originalSize > 0 ? (originalSize / 1024 / 1024).toFixed(2) : 0;
      
      console.log('📏 CompressionService - Tamanho original do vídeo:', originalSizeMB, 'MB');

      // Verificar se react-native-compressor está disponível
      if (!VideoCompressor) {
        console.warn('⚠️ CompressionService - Compressor de vídeo não disponível, retornando vídeo original');
        // Em Expo managed workflow, não podemos comprimir vídeos facilmente
        // O usuário deve selecionar vídeos menores ou usar uma build customizada
        return {
          uri: uri,
          fileSize: originalSize,
          originalSize: originalSize,
          compressionRatio: 0,
          warning: 'Compressão de vídeo não disponível nesta configuração',
        };
      }

      // Comprimir vídeo usando react-native-compressor
      // Esta biblioteca usa FFmpeg internamente
      // IMPORTANTE: Usar H.264 (libx264) para máxima compatibilidade
      // HEVC/H.265 não é suportado em muitos dispositivos Android
      const compressedUri = await VideoCompressor.compress(
        uri,
        {
          compressionMethod: 'auto', // Usa o melhor método disponível
          quality: quality,
          ...(bitrate && { bitrate: bitrate }),
          maxWidth: maxWidth,
          maxHeight: maxHeight,
          minimumFileSizeForCompression: 0, // Comprimir sempre
          // Forçar uso de H.264 para compatibilidade máxima
          // Nota: react-native-compressor pode não suportar todas essas opções
          // Mas tentamos especificar para garantir compatibilidade
        },
        (progress) => {
          // Callback de progresso (opcional)
          const progressPercent = Math.round(progress * 100);
          console.log(`📊 CompressionService - Progresso: ${progressPercent}%`);
        }
      );

      // Verificar tamanho final
      const compressedInfo = await FileSystem.getInfoAsync(compressedUri);
      const compressedSize = compressedInfo.exists ? compressedInfo.size : 0;
      const compressedSizeMB = compressedSize > 0 ? (compressedSize / 1024 / 1024).toFixed(2) : 0;
      
      const compressionRatio = originalSize > 0 
        ? ((1 - compressedSize / originalSize) * 100).toFixed(1) 
        : 0;

      console.log('✅ CompressionService - Vídeo comprimido:', {
        original: `${originalSizeMB}MB`,
        compressed: `${compressedSizeMB}MB`,
        reduction: `${compressionRatio}%`,
      });

      return {
        uri: compressedUri,
        fileSize: compressedSize,
        originalSize: originalSize,
        compressionRatio: parseFloat(compressionRatio),
      };
    } catch (error) {
      console.error('❌ CompressionService - Erro ao comprimir vídeo:', error);
      // Em caso de erro, retornar o vídeo original
      return {
        uri: uri,
        fileSize: originalSize || 0,
        originalSize: originalSize || 0,
        compressionRatio: 0,
        error: error.message,
      };
    }
  }

  /**
   * Comprimir mídia (imagem ou vídeo) automaticamente
   * @param {object} asset - Asset do ImagePicker
   * @param {string} type - 'image' ou 'video'
   * @returns {Promise<object>} - Asset comprimido
   */
  async compressMedia(asset, type) {
    try {
      console.log('🗜️ CompressionService - Comprimindo mídia:', type);
      
      if (type === 'image') {
        const compressed = await this.compressImage(asset.uri);
        return {
          ...asset,
          uri: compressed.uri,
          width: compressed.width || asset.width,
          height: compressed.height || asset.height,
          fileSize: compressed.fileSize || asset.fileSize,
          compressionInfo: {
            originalSize: compressed.originalSize,
            compressedSize: compressed.fileSize,
            ratio: compressed.compressionRatio,
          },
        };
      } else if (type === 'video') {
        const compressed = await this.compressVideo(asset.uri);
        return {
          ...asset,
          uri: compressed.uri,
          fileSize: compressed.fileSize || asset.fileSize,
          compressionInfo: {
            originalSize: compressed.originalSize,
            compressedSize: compressed.fileSize,
            ratio: compressed.compressionRatio,
          },
        };
      }
      
      // Se não for imagem nem vídeo, retornar original
      return asset;
    } catch (error) {
      console.error('❌ CompressionService - Erro ao comprimir mídia:', error);
      return asset; // Retornar original em caso de erro
    }
  }

  /**
   * Verificar se deve comprimir baseado no tamanho
   * @param {number} fileSize - Tamanho do arquivo em bytes
   * @param {string} type - 'image' ou 'video'
   * @returns {boolean}
   */
  shouldCompress(fileSize, type) {
    // Comprimir se:
    // - Imagens maiores que 2MB
    // - Vídeos maiores que 10MB
    const threshold = type === 'image' ? 2 * 1024 * 1024 : 10 * 1024 * 1024;
    return fileSize > threshold;
  }

  /**
   * Imagens: sempre JPEG antes do upload (HEIC falha no servidor Linux).
   * Vídeos: comprimir quando possível (react-native-compressor) para caber no limite do nginx.
   */
  shouldPrepareForUpload(type) {
    if (type === 'image') {
      return true;
    }
    if (type === 'video' && VideoCompressor) {
      return true;
    }
    return false;
  }
}

export default new CompressionService();


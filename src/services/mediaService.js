import apiService from './apiService';

class MediaService {
  /**
   * Buscar mídias de um grupo (visíveis para o paciente)
   */
  async getGroupMedia(groupId) {
    try {
      console.log('🎬 MediaService - Buscando mídias do grupo:', groupId);
      
      const response = await apiService.request(`/groups/${groupId}/media`, {
        method: 'GET',
      });

      if (response && Array.isArray(response)) {
        console.log(`✅ MediaService - ${response.length} mídia(s) encontrada(s)`);
        return {
          success: true,
          data: response,
        };
      } else if (response && response.data) {
        console.log(`✅ MediaService - ${response.data.length} mídia(s) encontrada(s)`);
        return {
          success: true,
          data: response.data,
        };
      }

      return {
        success: true,
        data: [],
      };
    } catch (error) {
      console.error('❌ MediaService - Erro ao buscar mídias:', error);
      return {
        success: false,
        error: error.message || 'Erro ao buscar mídias',
        data: [],
      };
    }
  }

  /**
   * Dados mock para demonstração (DESATIVADO - usando backend real)
   */
  getMockMedia() {
    const now = new Date();
    
    return [
      {
        id: 1,
        type: 'image',
        url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18',
        media_url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18',
        description: 'Momento especial em família',
        posted_by_name: 'João Silva',
        created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2h atrás
      },
      {
        id: 2,
        type: 'image',
        url: 'https://images.unsplash.com/photo-1476611338391-6f395a0ebc7b',
        media_url: 'https://images.unsplash.com/photo-1476611338391-6f395a0ebc7b',
        description: 'Almoço especial de domingo',
        posted_by_name: 'Maria Santos',
        created_at: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(), // 5h atrás
      },
      {
        id: 3,
        type: 'image',
        url: 'https://images.unsplash.com/photo-1543269865-cbf427effbad',
        media_url: 'https://images.unsplash.com/photo-1543269865-cbf427effbad',
        description: 'Passeio no parque',
        posted_by_name: 'Pedro Costa',
        created_at: new Date(now.getTime() - 10 * 60 * 60 * 1000).toISOString(), // 10h atrás
      },
    ];
  }

  /**
   * Postar nova mídia no grupo
   */
  async postMedia(groupId, mediaData) {
    try {
      console.log('📤 MediaService - Postando mídia no grupo:', groupId);
      
      const formData = new FormData();
      
      // Adicionar arquivo (imagem ou vídeo)
      if (mediaData.uri) {
        const uriParts = mediaData.uri.split('.');
        const fileType = uriParts[uriParts.length - 1];
        const mediaType = mediaData.type || 'image';
        
        formData.append('file', {
          uri: mediaData.uri,
          type: mediaType === 'video' ? `video/${fileType}` : `image/${fileType}`,
          name: `media.${fileType}`,
        });
        
        formData.append('type', mediaType);
      }
      
      // Adicionar descrição se houver
      if (mediaData.description) {
        formData.append('description', mediaData.description);
      }

      // Calcular timeout baseado no tamanho do arquivo
      // Para arquivos grandes (vídeos), usar timeout maior
      const fileSize = mediaData.fileSize || 0;
      const fileSizeMB = fileSize > 0 ? (fileSize / 1024 / 1024) : 0;
      
      // Timeout padrão: 5 minutos para uploads de mídia
      // Para arquivos grandes, calcular baseado no tamanho:
      // - Estimativa conservadora: 0.5MB/s (conexão lenta)
      // - Adicionar 3 minutos de margem de segurança
      let customTimeout = 300000; // 5 minutos padrão
      
      if (fileSize > 0) {
        // Calcular: tamanho em MB / 0.5 MB/s = segundos necessários
        // Converter para ms e adicionar 3 minutos de margem
        const estimatedSeconds = (fileSizeMB / 0.5); // Tempo estimado em segundos
        const estimatedMs = estimatedSeconds * 1000;
        customTimeout = Math.max(estimatedMs + 180000, 300000); // Mínimo 5 minutos, adicionar 3 minutos de margem
        
        console.log(`⏱️ MediaService - Arquivo: ${fileSizeMB.toFixed(2)}MB | Tipo: ${mediaData.type || 'unknown'}`);
        console.log(`⏱️ MediaService - Tempo estimado: ${(estimatedSeconds / 60).toFixed(1)}min | Timeout configurado: ${(customTimeout / 1000 / 60).toFixed(1)}min`);
      } else {
        console.log(`⏱️ MediaService - Tamanho do arquivo não informado, usando timeout padrão: ${(customTimeout / 1000 / 60).toFixed(1)}min`);
      }
      
      const response = await apiService.request(`/groups/${groupId}/media`, {
        method: 'POST',
        body: formData,
        timeout: customTimeout, // Timeout customizado para uploads grandes
      });

      if (response && response.id) {
        console.log('✅ MediaService - Mídia postada com sucesso');
        return {
          success: true,
          data: response,
        };
      } else if (response && response.success) {
        return response;
      }

      return {
        success: false,
        error: 'Resposta inválida da API',
      };
    } catch (error) {
      // Se o endpoint não existe (404), retornar erro específico
      if (error.status === 404 || error.message?.includes('not be found')) {
        console.log('ℹ️ MediaService - Endpoint ainda não implementado no backend');
        return {
          success: false,
          error: 'Funcionalidade de mídias ainda não está disponível. Por favor, entre em contato com o suporte.',
        };
      }
      
      // Tratar erro 413 (Payload Too Large)
      if (error.status === 413 || error.message?.includes('413')) {
        console.error('❌ MediaService - Erro 413 (Payload Too Large)');
        const fileSizeMB = mediaData.fileSize ? (mediaData.fileSize / 1024 / 1024).toFixed(2) : 'desconhecido';
        const maxSizeMB = mediaData.type === 'video' ? 100 : 50;
        
        // Verificar se o arquivo realmente excede o limite
        const fileSize = mediaData.fileSize || 0;
        const fileSizeInMB = fileSize / 1024 / 1024;
        const maxSizeInMB = mediaData.type === 'video' ? 30 : 10;
        
        if (fileSize > 0 && fileSizeInMB > maxSizeInMB) {
          // Arquivo realmente excede o limite
          return {
            success: false,
            error: `Arquivo muito grande (${fileSizeMB}MB). O tamanho máximo permitido é ${maxSizeMB}MB para ${mediaData.type === 'video' ? 'vídeos' : 'imagens'}.`,
            status: 413,
          };
        } else {
          // Arquivo está dentro do limite, mas servidor rejeitou - problema de configuração
          return {
            success: false,
            error: `O servidor rejeitou o arquivo (${fileSizeMB}MB). O limite de upload do servidor está muito baixo. Por favor, entre em contato com o administrador do sistema para aumentar os limites de upload no servidor.`,
            status: 413,
          };
        }
      }
      
      console.error('❌ MediaService - Erro ao postar mídia:', error);
      return {
        success: false,
        error: error.message || 'Erro ao postar mídia',
        status: error.status,
      };
    }
  }

  /**
   * Deletar mídia
   */
  async deleteMedia(mediaId) {
    try {
      console.log('🗑️ MediaService - Deletando mídia:', mediaId);
      
      const response = await apiService.request(`/media/${mediaId}`, {
        method: 'DELETE',
      });

      return {
        success: true,
        data: response,
      };
    } catch (error) {
      console.error('❌ MediaService - Erro ao deletar mídia:', error);
      return {
        success: false,
        error: error.message || 'Erro ao deletar mídia',
      };
    }
  }
}

export default new MediaService();


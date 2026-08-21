// IMPORTANTE: Importar pusher-init primeiro para garantir que Pusher esteja global
import '../config/pusher-init';

import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import API_CONFIG from '../config/api';
import { getPusherKey, getPusherCluster } from '../config/pusher';
import AsyncStorage from '@react-native-async-storage/async-storage';

class WebSocketService {
  constructor() {
    this.echo = null;
    this.isConnected = false;
    this.listeners = new Map(); // Armazenar listeners por grupo
    /** @type {Map<string, Set<Function>>} */
    this.braceletMeasureHandlers = new Map();
    /** @type {Map<string, Set<Function>>} */
    this.braceletMeasureFinishedHandlers = new Map();
  }

  /**
   * Inicializar conexão WebSocket
   */
  async initialize() {
    try {
      if (this.echo) {
        console.log('🔌 WebSocket - Já inicializado');
        return;
      }

      // Obter token de autenticação
      const token = await AsyncStorage.getItem('@lacos:token');
      
      if (!token) {
        console.warn('⚠️ WebSocket - Token não encontrado, não é possível conectar');
        return;
      }

      // Extrair base URL (remover /api)
      const baseUrl = API_CONFIG.BASE_URL.replace('/api', '');

      // Configurar Pusher
      // Nota: Para usar Laravel Reverb, você precisaria configurar socket.io
      // Por enquanto, vamos usar Pusher como padrão
      const pusherKey = getPusherKey();
      const pusherCluster = getPusherCluster();
      
      console.log('🔌 WebSocket - Configurando Pusher:', { key: pusherKey, cluster: pusherCluster });
      
      // Configurar Echo - o Pusher já está disponível globalmente
      this.echo = new Echo({
        broadcaster: 'pusher',
        key: pusherKey,
        cluster: pusherCluster,
        encrypted: true,
        forceTLS: true,
        authEndpoint: `${baseUrl}/broadcasting/auth`,
        auth: {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        },
        enabledTransports: ['ws', 'wss'],
      });

      // Eventos de conexão
      this.echo.connector.pusher.connection.bind('connected', () => {
        console.log('✅ WebSocket - Conectado');
        this.isConnected = true;
      });

      this.echo.connector.pusher.connection.bind('disconnected', () => {
        console.log('⚠️ WebSocket - Desconectado');
        this.isConnected = false;
      });

      this.echo.connector.pusher.connection.bind('error', (error) => {
        console.error('❌ WebSocket - Erro:', error);
        this.isConnected = false;
      });

      console.log('🔌 WebSocket - Inicializado');
    } catch (error) {
      console.error('❌ WebSocket - Erro ao inicializar:', error);
    }
  }

  /**
   * Escutar eventos de um grupo
   */
  async listenToGroup(groupId, callbacks) {
    try {
      if (!this.echo) {
        await this.initialize();
      }

      if (!this.echo) {
        console.warn('⚠️ WebSocket - Echo não disponível');
        return;
      }

      const channelName = `group.${groupId}`;
      
      // Remover listener anterior se existir
      if (this.listeners.has(channelName)) {
        this.stopListeningToGroup(groupId);
      }

      console.log(`🔌 WebSocket - Escutando canal: ${channelName}`);

      const channel = this.echo.private(channelName);

      // Escutar evento de mídia deletada
      if (callbacks.onMediaDeleted) {
        channel.listen('.media.deleted', (data) => {
          console.log('📡 WebSocket - Evento .media.deleted recebido:', data);
          console.log('📡 WebSocket - Tipo de dados:', typeof data);
          console.log('📡 WebSocket - Estrutura completa:', JSON.stringify(data, null, 2));
          
          // Garantir que os dados estão no formato esperado
          const eventData = data || {};
          callbacks.onMediaDeleted(eventData);
        });
      }

      // Escutar evento de mídia criada
      if (callbacks.onMediaCreated) {
        channel.listen('.media.created', (data) => {
          console.log('📡 WebSocket - Nova mídia criada:', data);
          callbacks.onMediaCreated(data);
        });
      }

      channel.listen('.bracelet.measure', (data) => {
        console.log('📡 WebSocket - bracelet.measure:', data);
        const key = String(groupId);
        this.braceletMeasureHandlers.get(key)?.forEach((fn) => {
          try {
            fn(data || {});
          } catch (e) {
            console.warn('bracelet.measure handler', e);
          }
        });
        if (callbacks.onBraceletMeasure) {
          callbacks.onBraceletMeasure(data || {});
        }
      });

      channel.listen('.bracelet.measure.finished', (data) => {
        console.log('📡 WebSocket - bracelet.measure.finished:', data);
        const key = String(groupId);
        this.braceletMeasureFinishedHandlers.get(key)?.forEach((fn) => {
          try {
            fn(data || {});
          } catch (e) {
            console.warn('bracelet.measure.finished handler', e);
          }
        });
        if (callbacks.onBraceletMeasureFinished) {
          callbacks.onBraceletMeasureFinished(data || {});
        }
      });

      // Armazenar referência do canal
      this.listeners.set(channelName, channel);

      console.log(`✅ WebSocket - Escutando eventos do grupo ${groupId}`);
    } catch (error) {
      console.error('❌ WebSocket - Erro ao escutar grupo:', error);
    }
  }

  /**
   * Handler permanente para pedido de medição (app do paciente).
   * Não substitui os listeners de mídia do Home.
   */
  onBraceletMeasure(groupId, fn) {
    const key = String(groupId);
    if (!this.braceletMeasureHandlers.has(key)) {
      this.braceletMeasureHandlers.set(key, new Set());
    }
    this.braceletMeasureHandlers.get(key).add(fn);
    // Garante canal inscrito
    void this.ensureGroupChannel(groupId);
    return () => {
      this.braceletMeasureHandlers.get(key)?.delete(fn);
    };
  }

  onBraceletMeasureFinished(groupId, fn) {
    const key = String(groupId);
    if (!this.braceletMeasureFinishedHandlers.has(key)) {
      this.braceletMeasureFinishedHandlers.set(key, new Set());
    }
    this.braceletMeasureFinishedHandlers.get(key).add(fn);
    void this.ensureGroupChannel(groupId);
    return () => {
      this.braceletMeasureFinishedHandlers.get(key)?.delete(fn);
    };
  }

  async ensureGroupChannel(groupId) {
    try {
      if (!this.echo) await this.initialize();
      if (!this.echo) return;
      const channelName = `group.${groupId}`;
      if (this.listeners.has(channelName)) return;

      const channel = this.echo.private(channelName);
      const key = String(groupId);

      channel.listen('.bracelet.measure', (data) => {
        console.log('📡 WebSocket - bracelet.measure:', data);
        this.braceletMeasureHandlers.get(key)?.forEach((fn) => {
          try {
            fn(data || {});
          } catch (e) {
            console.warn('bracelet.measure handler', e);
          }
        });
      });

      channel.listen('.bracelet.measure.finished', (data) => {
        console.log('📡 WebSocket - bracelet.measure.finished:', data);
        this.braceletMeasureFinishedHandlers.get(key)?.forEach((fn) => {
          try {
            fn(data || {});
          } catch (e) {
            console.warn('bracelet.measure.finished handler', e);
          }
        });
      });

      this.listeners.set(channelName, channel);
    } catch (e) {
      console.warn('ensureGroupChannel', e?.message || e);
    }
  }

  /**
   * Parar de escutar eventos de um grupo
   */
  stopListeningToGroup(groupId) {
    try {
      const channelName = `group.${groupId}`;
      const channel = this.listeners.get(channelName);

      if (channel) {
        channel.stopListening('.media.deleted');
        channel.stopListening('.media.created');
        channel.stopListening('.bracelet.measure');
        channel.stopListening('.bracelet.measure.finished');
        this.echo?.leave(channelName);
        this.listeners.delete(channelName);
        console.log(`🔌 WebSocket - Parou de escutar grupo ${groupId}`);
      }
    } catch (error) {
      console.error('❌ WebSocket - Erro ao parar de escutar:', error);
    }
  }

  /**
   * Desconectar
   */
  disconnect() {
    try {
      // Parar de escutar todos os canais
      this.listeners.forEach((channel, channelName) => {
        channel.stopListening();
        this.echo?.leave(channelName);
      });
      this.listeners.clear();

      // Desconectar Echo
      if (this.echo) {
        this.echo.disconnect();
        this.echo = null;
      }

      this.isConnected = false;
      console.log('🔌 WebSocket - Desconectado');
    } catch (error) {
      console.error('❌ WebSocket - Erro ao desconectar:', error);
    }
  }

  /**
   * Reconectar
   */
  async reconnect() {
    this.disconnect();
    await this.initialize();
  }
}

export default new WebSocketService();


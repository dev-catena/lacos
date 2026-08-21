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
    this.listeners = new Map(); // Armazenar canais por grupo
    /** @type {Map<string, Set<Function>>} */
    this.braceletMeasureHandlers = new Map();
    /** @type {Map<string, Set<Function>>} */
    this.braceletMeasureFinishedHandlers = new Map();
    /** @type {Map<string, boolean>} */
    this.braceletChannelBound = new Map();
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

      const token = await AsyncStorage.getItem('@lacos:token');

      if (!token) {
        console.warn('⚠️ WebSocket - Token não encontrado, não é possível conectar');
        return;
      }

      const baseUrl = API_CONFIG.BASE_URL.replace('/api', '');
      const pusherKey = getPusherKey();
      const pusherCluster = getPusherCluster();

      console.log('🔌 WebSocket - Configurando Pusher:', { key: pusherKey, cluster: pusherCluster });

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

  hasBraceletHandlers(groupId) {
    const key = String(groupId);
    return (
      (this.braceletMeasureHandlers.get(key)?.size || 0) > 0 ||
      (this.braceletMeasureFinishedHandlers.get(key)?.size || 0) > 0
    );
  }

  bindBraceletChannelListeners(channel, groupId) {
    const key = String(groupId);
    if (this.braceletChannelBound.get(key)) {
      return;
    }

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

    this.braceletChannelBound.set(key, true);
  }

  /**
   * Escutar eventos de mídia de um grupo.
   * NÃO derruba o canal se houver handlers da pulseira (Medir agora).
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
      console.log(`🔌 WebSocket - Escutando canal: ${channelName}`);

      let channel = this.listeners.get(channelName);
      if (channel) {
        // Só troca listeners de mídia; mantém bracelet.*
        channel.stopListening('.media.deleted');
        channel.stopListening('.media.created');
      } else {
        channel = this.echo.private(channelName);
        this.listeners.set(channelName, channel);
      }

      this.bindBraceletChannelListeners(channel, groupId);

      if (callbacks.onMediaDeleted) {
        channel.listen('.media.deleted', (data) => {
          console.log('📡 WebSocket - Evento .media.deleted recebido:', data);
          callbacks.onMediaDeleted(data || {});
        });
      }

      if (callbacks.onMediaCreated) {
        channel.listen('.media.created', (data) => {
          console.log('📡 WebSocket - Nova mídia criada:', data);
          callbacks.onMediaCreated(data);
        });
      }

      console.log(`✅ WebSocket - Escutando eventos do grupo ${groupId}`);
    } catch (error) {
      console.error('❌ WebSocket - Erro ao escutar grupo:', error);
    }
  }

  /**
   * Handler permanente para pedido de medição (app do paciente).
   */
  onBraceletMeasure(groupId, fn) {
    const key = String(groupId);
    if (!this.braceletMeasureHandlers.has(key)) {
      this.braceletMeasureHandlers.set(key, new Set());
    }
    this.braceletMeasureHandlers.get(key).add(fn);
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
      let channel = this.listeners.get(channelName);
      if (!channel) {
        channel = this.echo.private(channelName);
        this.listeners.set(channelName, channel);
      }
      this.bindBraceletChannelListeners(channel, groupId);
    } catch (e) {
      console.warn('ensureGroupChannel', e?.message || e);
    }
  }

  /**
   * Parar listeners de mídia. Mantém o canal se a pulseira ainda precisa dele.
   */
  stopListeningToGroup(groupId) {
    try {
      const channelName = `group.${groupId}`;
      const channel = this.listeners.get(channelName);
      const key = String(groupId);

      if (!channel) {
        return;
      }

      channel.stopListening('.media.deleted');
      channel.stopListening('.media.created');

      if (this.hasBraceletHandlers(groupId)) {
        console.log(
          `🔌 WebSocket - Mídia removida; canal ${channelName} mantido (pulseira)`,
        );
        return;
      }

      channel.stopListening('.bracelet.measure');
      channel.stopListening('.bracelet.measure.finished');
      this.braceletChannelBound.delete(key);
      this.echo?.leave(channelName);
      this.listeners.delete(channelName);
      console.log(`🔌 WebSocket - Parou de escutar grupo ${groupId}`);
    } catch (error) {
      console.error('❌ WebSocket - Erro ao parar de escutar:', error);
    }
  }

  disconnect() {
    try {
      this.listeners.forEach((channel, channelName) => {
        channel.stopListening();
        this.echo?.leave(channelName);
      });
      this.listeners.clear();
      this.braceletChannelBound.clear();

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

  async reconnect() {
    this.disconnect();
    await this.initialize();
  }
}

export default new WebSocketService();

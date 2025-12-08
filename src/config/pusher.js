// Configurações do Pusher para WebSocket
// Estas credenciais são públicas e seguras para uso no frontend
export const PUSHER_CONFIG = {
  KEY: '3ca33cf8a09a78469df9',
  CLUSTER: 'sa1',
};

// Usar variável de ambiente se disponível, senão usar valores padrão
export const getPusherKey = () => {
  return process.env.EXPO_PUBLIC_PUSHER_KEY || PUSHER_CONFIG.KEY;
};

export const getPusherCluster = () => {
  return process.env.EXPO_PUBLIC_PUSHER_CLUSTER || PUSHER_CONFIG.CLUSTER;
};








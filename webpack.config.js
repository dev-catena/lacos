// Configuração Webpack para Expo Web escutar em 0.0.0.0

const EXPO_IP = process.env.EXPO_IP || '10.102.0.103';
const EXPO_PORT = process.env.EXPO_PORT || '8081';

module.exports = {
  devServer: {
    host: '0.0.0.0', // Escutar em todas as interfaces
    port: parseInt(EXPO_PORT),
    allowedHosts: 'all', // Permitir acesso de qualquer host
    client: {
      webSocketURL: {
        hostname: EXPO_IP, // Usar IP ao invés de localhost
        port: EXPO_PORT,
      },
    },
  },
};











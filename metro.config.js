const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Habilitar Fast Refresh explicitamente (importante para iOS)
config.resolver = {
  ...config.resolver,
};

// Configurar Fast Refresh
config.transformer = {
  ...config.transformer,
  enableBabelRCLookup: true,
  enableBabelRuntime: true,
};

// Forçar IP correto para o Metro bundler
// Isso garante que o QR code use o IP correto ao invés de localhost
const EXPO_IP = process.env.REACT_NATIVE_PACKAGER_HOSTNAME || 
                process.env.EXPO_PACKAGER_HOSTNAME || 
                process.env.HOST || 
                '10.102.0.103';
const EXPO_PORT = process.env.REACT_NATIVE_PACKAGER_PORT || 
                  process.env.EXPO_PACKAGER_PORT || 
                  process.env.PORT || 
                  '8081';

// FORÇAR o hostname ANTES de qualquer coisa
if (EXPO_IP && EXPO_IP !== 'localhost' && EXPO_IP !== '127.0.0.1') {
  // Configurar o hostname que será usado nas URLs - DEVE SER FEITO PRIMEIRO
  process.env.REACT_NATIVE_PACKAGER_HOSTNAME = EXPO_IP;
  process.env.EXPO_PACKAGER_HOSTNAME = EXPO_IP;
  process.env.HOST = EXPO_IP;
  process.env.PORT = EXPO_PORT;
  
  // Tentar outras variáveis que o Expo pode usar
  process.env.METRO_HOST = EXPO_IP;
  process.env.PACKAGER_HOSTNAME = EXPO_IP;
  
  console.log(`📱 Metro configurado para usar IP: ${EXPO_IP}:${EXPO_PORT}`);
}

// Configurar servidor Metro para usar o IP correto
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    // Middleware para interceptar e reescrever URLs
    return (req, res, next) => {
      // Reescrever URLs que contêm localhost
      if (req.url && (req.url.includes('localhost') || req.url.includes('127.0.0.1'))) {
        req.url = req.url.replace(/localhost|127\.0\.0\.1/g, EXPO_IP);
      }
      return middleware(req, res, next);
    };
  },
  // Forçar o hostname que será usado nas URLs geradas
  rewriteRequestUrl: (url) => {
    // Substituir localhost pelo IP correto nas URLs
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      return url.replace(/localhost|127\.0\.0\.1/g, EXPO_IP);
    }
    return url;
  },
};

module.exports = config;

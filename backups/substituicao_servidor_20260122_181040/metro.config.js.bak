const { getDefaultConfig } = require('expo/metro-config');
const http = require('http');

const config = getDefaultConfig(__dirname);

// IP CORRETO - NUNCA MUDAR
const EXPO_IP = '10.102.0.103';
const EXPO_PORT = '8081';

// FORÇAR TODAS as variáveis ANTES de qualquer coisa
process.env.REACT_NATIVE_PACKAGER_HOSTNAME = EXPO_IP;
process.env.EXPO_PACKAGER_HOSTNAME = EXPO_IP;
process.env.PACKAGER_HOSTNAME = EXPO_IP;
process.env.REACT_NATIVE_PACKAGER_PORT = EXPO_PORT;
process.env.EXPO_PACKAGER_PORT = EXPO_PORT;
process.env.HOST = EXPO_IP;
process.env.PORT = EXPO_PORT;
process.env.METRO_HOST = EXPO_IP;
process.env.EXPO_NO_LOCALHOST = '1';
process.env.EXPO_USE_LOCALHOST = '0';
process.env.EXPO_NO_DOTENV = '1';

// SOBRESCREVER qualquer tentativa de usar localhost
process.env.LOCALHOST = EXPO_IP;
process.env.HOSTNAME = EXPO_IP;

console.log(`🚫 Metro FORÇADO: ${EXPO_IP}:${EXPO_PORT} (localhost COMPLETAMENTE BLOQUEADO)`);

config.resolver = {
  ...config.resolver,
};

config.transformer = {
  ...config.transformer,
  enableBabelRCLookup: true,
  enableBabelRuntime: true,
};

// SOLUÇÃO RADICAL: Interceptar o servidor HTTP do Metro ANTES de iniciar
config.server = {
  ...config.server,
  // Forçar o servidor a escutar em TODAS as interfaces (0.0.0.0)
  port: parseInt(EXPO_PORT),
  // Escutar em todas as interfaces IPv4 para permitir conexão do Android
  host: '0.0.0.0',
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Adicionar CORS headers para permitir acesso de outros dispositivos
      // IMPORTANTE: Incluir Content-Type nos headers permitidos
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Expo-Platform, expo-platform');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      
      // Responder a preflight requests
      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }
      
      // CORREÇÃO: Adicionar header Expo-Platform se não existir
      // Isso resolve o erro "Must Specify Expo platform header"
      if (!req.headers['expo-platform'] && !req.headers['Expo-Platform']) {
        // Detectar plataforma pelo User-Agent ou assumir Android
        const userAgent = req.headers['user-agent'] || '';
        let platform = 'android'; // Padrão
        
        if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
          platform = 'ios';
        } else if (userAgent.includes('Expo') && userAgent.includes('Android')) {
          platform = 'android';
        }
        
        // Adicionar header
        req.headers['Expo-Platform'] = platform;
        req.headers['expo-platform'] = platform;
        // Log apenas em desenvolvimento ou quando necessário
        // console.log(`📱 Header Expo-Platform adicionado: ${platform}`);
      }
      
      // CORREÇÃO: Adicionar parâmetro platform na URL se não existir
      if (req.url && !req.url.includes('platform=') && !req.url.includes('?platform=')) {
        const separator = req.url.includes('?') ? '&' : '?';
        const platform = req.headers['Expo-Platform'] || req.headers['expo-platform'] || 'android';
        req.url = `${req.url}${separator}platform=${platform}`;
        // Log apenas em desenvolvimento ou quando necessário
        // console.log(`📱 Parâmetro platform adicionado na URL: ${platform}`);
      }
      
      // Reescrever URL da requisição
      if (req.url) {
        req.url = req.url.replace(/localhost|127\.0\.0\.1/g, EXPO_IP);
      }
      
      // Reescrever host header
      if (req.headers.host) {
        req.headers.host = req.headers.host.replace(/localhost|127\.0\.0\.1/g, EXPO_IP);
      }
      
      // Interceptar TODA resposta antes de enviar
      const originalWrite = res.write;
      const originalEnd = res.end;
      const originalSetHeader = res.setHeader;
      const originalWriteHead = res.writeHead;
      
      // Interceptar setHeader
      res.setHeader = function(name, value) {
        if (typeof value === 'string') {
          value = value
            .replace(/http:\/\/localhost(:\d+)?/gi, `http://${EXPO_IP}:${EXPO_PORT}`)
            .replace(/https:\/\/localhost(:\d+)?/gi, `https://${EXPO_IP}:${EXPO_PORT}`)
            .replace(/exp:\/\/localhost(:\d+)?/gi, `exp://${EXPO_IP}:${EXPO_PORT}`)
            .replace(/localhost(:\d+)?/g, `${EXPO_IP}:${EXPO_PORT}`)
            .replace(/127\.0\.0\.1(:\d+)?/g, `${EXPO_IP}:${EXPO_PORT}`);
        }
        return originalSetHeader.call(this, name, value);
      };
      
      // Interceptar writeHead
      res.writeHead = function(statusCode, statusMessage, headers) {
        if (headers) {
          Object.keys(headers).forEach(key => {
            if (typeof headers[key] === 'string') {
              headers[key] = headers[key]
                .replace(/localhost(:\d+)?/g, `${EXPO_IP}:${EXPO_PORT}`)
                .replace(/127\.0\.0\.1(:\d+)?/g, `${EXPO_IP}:${EXPO_PORT}`);
            }
          });
        }
        return originalWriteHead.apply(this, arguments);
      };
      
      // Interceptar write
      res.write = function(chunk, encoding) {
        if (chunk) {
          const str = chunk.toString();
          const corrected = str
            .replace(/http:\/\/localhost(:\d+)?/gi, `http://${EXPO_IP}:${EXPO_PORT}`)
            .replace(/https:\/\/localhost(:\d+)?/gi, `https://${EXPO_IP}:${EXPO_PORT}`)
            .replace(/exp:\/\/localhost(:\d+)?/gi, `exp://${EXPO_IP}:${EXPO_PORT}`)
            .replace(/localhost(:\d+)?/g, `${EXPO_IP}:${EXPO_PORT}`)
            .replace(/127\.0\.0\.1(:\d+)?/g, `${EXPO_IP}:${EXPO_PORT}`);
          return originalWrite.call(this, Buffer.from(corrected), encoding);
        }
        return originalWrite.apply(this, arguments);
      };
      
      // Interceptar end
      res.end = function(chunk, encoding) {
        if (chunk) {
          const str = chunk.toString();
          const corrected = str
            .replace(/http:\/\/localhost(:\d+)?/gi, `http://${EXPO_IP}:${EXPO_PORT}`)
            .replace(/https:\/\/localhost(:\d+)?/gi, `https://${EXPO_IP}:${EXPO_PORT}`)
            .replace(/exp:\/\/localhost(:\d+)?/gi, `exp://${EXPO_IP}:${EXPO_PORT}`)
            .replace(/localhost(:\d+)?/g, `${EXPO_IP}:${EXPO_PORT}`)
            .replace(/127\.0\.0\.1(:\d+)?/g, `${EXPO_IP}:${EXPO_PORT}`);
          return originalEnd.call(this, Buffer.from(corrected), encoding);
        }
        return originalEnd.apply(this, arguments);
      };
      
      return middleware(req, res, next);
    };
  },
  
  rewriteRequestUrl: (url) => {
    return url.replace(/localhost|127\.0\.0\.1/g, EXPO_IP);
  },
};

module.exports = config;

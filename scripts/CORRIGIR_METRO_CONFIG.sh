#!/bin/bash

# Script para corrigir metro.config.js e garantir que use o IP correto

cd /home/darley/lacos || exit 1

echo "🔧 Corrigindo metro.config.js..."

# Verificar IP atual
IP=$(hostname -I | awk '{print $1}')
EXPO_IP="10.102.0.103"

if [ "$IP" != "$EXPO_IP" ]; then
    echo "⚠️  IP atual ($IP) diferente do esperado ($EXPO_IP)"
    read -p "Usar IP atual? (s/n) [s]: " USAR_IP_ATUAL
    USAR_IP_ATUAL=${USAR_IP_ATUAL:-s}
    if [ "$USAR_IP_ATUAL" = "s" ]; then
        EXPO_IP="$IP"
    fi
fi

echo "📱 Usando IP: $EXPO_IP"
echo ""

# Fazer backup
if [ -f "metro.config.js" ]; then
    cp metro.config.js metro.config.js.backup.$(date +%s)
    echo "✅ Backup criado"
fi

# Criar metro.config.js corrigido
cat > metro.config.js << EOF
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// IP correto para o Metro bundler
const EXPO_IP = '${EXPO_IP}';
const EXPO_PORT = '8081';

// FORÇAR o hostname ANTES de qualquer coisa
process.env.REACT_NATIVE_PACKAGER_HOSTNAME = EXPO_IP;
process.env.EXPO_PACKAGER_HOSTNAME = EXPO_IP;
process.env.HOST = EXPO_IP;
process.env.PORT = EXPO_PORT;
process.env.METRO_HOST = EXPO_IP;
process.env.PACKAGER_HOSTNAME = EXPO_IP;
process.env.EXPO_DEVTOOLS_LISTEN_ADDRESS = '0.0.0.0';

console.log(\`📱 Metro configurado para usar IP: \${EXPO_IP}:\${EXPO_PORT}\`);

// Configurar servidor Metro para escutar em todas as interfaces
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Reescrever URLs que contêm localhost
      if (req.url && (req.url.includes('localhost') || req.url.includes('127.0.0.1'))) {
        req.url = req.url.replace(/localhost|127\.0\.0\.1/g, EXPO_IP);
      }
      return middleware(req, res, next);
    };
  },
  rewriteRequestUrl: (url) => {
    // Substituir localhost pelo IP correto nas URLs
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      return url.replace(/localhost|127\.0\.0\.1/g, EXPO_IP);
    }
    return url;
  },
};

module.exports = config;
EOF

echo "✅ metro.config.js atualizado"
echo ""
echo "📄 Conteúdo:"
head -20 metro.config.js
echo ""


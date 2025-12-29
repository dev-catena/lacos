#!/bin/bash

# Script para iniciar Expo com IP correto para iOS e Android
# Força o uso do IP da rede local em vez de localhost

set -e

cd /home/darley/lacos || exit 1

echo "🔧 Iniciando Expo com IP correto para iOS e Android"
echo "===================================================="
echo ""

# IP e Porta
EXPO_IP="10.102.0.103"
EXPO_PORT="8081"

# Verificar IP atual
CURRENT_IP=$(hostname -I | awk '{print $1}')
if [ "$CURRENT_IP" != "$EXPO_IP" ]; then
    echo "⚠️  IP atual ($CURRENT_IP) diferente do configurado ($EXPO_IP)"
    read -p "Usar IP atual? (s/n) [s]: " USAR_IP_ATUAL
    USAR_IP_ATUAL=${USAR_IP_ATUAL:-s}
    if [ "$USAR_IP_ATUAL" = "s" ]; then
        EXPO_IP="$CURRENT_IP"
    fi
fi

echo "📱 Configuração:"
echo "   IP: $EXPO_IP"
echo "   Porta: $EXPO_PORT"
echo "   URL esperada: exp://$EXPO_IP:$EXPO_PORT"
echo ""

# Parar processos
echo "🛑 Parando processos..."
pkill -f "expo start" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true
sleep 2

# Limpar cache
echo "🧹 Limpando cache..."
rm -rf .expo 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true

# Configurar .expo/settings.json
echo "📝 Configurando .expo/settings.json..."
mkdir -p .expo
cat > .expo/settings.json << EOF
{
  "hostType": "lan",
  "lanType": "ip",
  "dev": true,
  "minify": false
}
EOF

# Configurar TODAS as variáveis de ambiente
export EXPO_NO_DOTENV=1
export EXPO_USE_METRO_WORKSPACE_ROOT=1
export REACT_NATIVE_PACKAGER_HOSTNAME=$EXPO_IP
export EXPO_PACKAGER_HOSTNAME=$EXPO_IP
export PACKAGER_HOSTNAME=$EXPO_IP
export REACT_NATIVE_PACKAGER_PORT=$EXPO_PORT
export EXPO_PACKAGER_PORT=$EXPO_PORT
export HOST=$EXPO_IP
export PORT=$EXPO_PORT
export METRO_HOST=$EXPO_IP
export EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
export EXPO_DEVTOOLS_LISTEN_PORT=$EXPO_PORT
# CRÍTICO: Forçar que NÃO use localhost
export EXPO_NO_LOCALHOST=1
export EXPO_USE_LOCALHOST=0
export EXPO_USE_FAST_RESOLVER=1

echo "✅ Configuração completa"
echo ""
echo "🚀 Iniciando Expo com --lan (força IP da rede)..."
echo "   QR code deve mostrar: exp://$EXPO_IP:$EXPO_PORT"
echo "   Se ainda mostrar localhost, use manualmente no iOS:"
echo "   Expo Go → Enter URL manually → exp://$EXPO_IP:$EXPO_PORT"
echo ""

# Iniciar Expo com --lan e interceptar saída para substituir localhost
npx expo start --clear --lan 2>&1 | sed -u "s|localhost:8081|$EXPO_IP:$EXPO_PORT|g" | sed -u "s|127\.0\.0\.1:8081|$EXPO_IP:$EXPO_PORT|g" | sed -u "s|exp://localhost|exp://$EXPO_IP|g" | sed -u "s|http://localhost|http://$EXPO_IP|g"




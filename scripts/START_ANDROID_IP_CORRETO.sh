#!/bin/bash

# Script para iniciar Expo com IP correto para Android
# Baseado no FORCAR_EXPO_GO_REAL.sh que funciona para iOS

set -e

cd /home/darley/lacos || exit 1

EXPO_IP="10.102.0.103"
EXPO_PORT="8081"

echo "🚀 Iniciando Expo para Android com IP correto..."
echo "   IP: $EXPO_IP"
echo "   Porta: $EXPO_PORT"
echo ""

# Parar processos antigos
echo "🛑 Parando processos antigos..."
pkill -f "expo start" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true
sleep 2

# Limpar cache
echo "🧹 Limpando cache..."
rm -rf .expo 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf .metro 2>/dev/null || true
rm -rf /tmp/metro-* 2>/dev/null || true
rm -rf /tmp/haste-* 2>/dev/null || true

# Configurar .expo/settings.json (CRÍTICO para forçar o IP)
echo "📝 Configurando .expo/settings.json..."
mkdir -p .expo
cat > .expo/settings.json << EOF
{
  "hostType": "lan",
  "lanType": "ip",
  "dev": true
}
EOF

echo "✅ Preparação concluída!"
echo ""
echo "🌐 Iniciando Expo em modo LAN..."
echo "   O QR code deve mostrar: exp://$EXPO_IP:$EXPO_PORT"
echo ""

# IMPORTANTE: Passar variáveis diretamente no comando (não export)
# Isso garante que o Metro bundler use o IP correto
REACT_NATIVE_PACKAGER_HOSTNAME=$EXPO_IP \
EXPO_PACKAGER_HOSTNAME=$EXPO_IP \
EXPO_NO_LOCALHOST=1 \
EXPO_USE_LOCALHOST=0 \
EXPO_USE_DEV_CLIENT=0 \
EXPO_NO_DOTENV=1 \
HOST=$EXPO_IP \
PORT=$EXPO_PORT \
npx expo start --lan --port $EXPO_PORT --clear



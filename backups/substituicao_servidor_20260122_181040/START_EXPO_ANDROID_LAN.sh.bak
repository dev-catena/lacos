#!/bin/bash

# Script para iniciar Expo em modo LAN com IP correto para Android
# Este modo funciona melhor para Android quando está na mesma rede

set -e

cd /home/darley/lacos || exit 1

EXPO_IP="10.102.0.103"
EXPO_PORT="8081"

echo "🚀 Iniciando Expo em modo LAN para Android..."
echo "   IP: $EXPO_IP"
echo "   Porta: $EXPO_PORT"
echo "   URL: exp://$EXPO_IP:$EXPO_PORT"
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

# Configurar .expo/settings.json
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
echo "🌐 Iniciando em modo LAN..."
echo "   O QR code deve mostrar: exp://$EXPO_IP:$EXPO_PORT"
echo "   Certifique-se de que o Android está na mesma rede Wi-Fi"
echo ""

# LAN mode com IP forçado - IMPORTANTE: passar variáveis diretamente no comando
# Usar --lan e forçar IP através das variáveis de ambiente
REACT_NATIVE_PACKAGER_HOSTNAME=$EXPO_IP \
EXPO_PACKAGER_HOSTNAME=$EXPO_IP \
EXPO_NO_LOCALHOST=1 \
EXPO_USE_LOCALHOST=0 \
EXPO_USE_DEV_CLIENT=0 \
npx expo start --lan --port $EXPO_PORT --clear --go


#!/bin/bash

# Script para corrigir problemas do Expo Go no Android

cd /home/darley/lacos || exit 1

echo "🔧 Corrigindo Expo Go para Android"
echo "===================================="
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
rm -rf .metro 2>/dev/null || true

# IP
EXPO_IP="192.168.1.105"
EXPO_PORT="8081"

echo "📱 Configuração:"
echo "   IP: $EXPO_IP"
echo "   Porta: $EXPO_PORT"
echo "   Modo: Tunnel (mais confiável para Android)"
echo ""

# Configurar variáveis
export EXPO_USE_DEV_CLIENT=0
export EXPO_NO_DOTENV=1
export REACT_NATIVE_PACKAGER_HOSTNAME=$EXPO_IP
export EXPO_PACKAGER_HOSTNAME=$EXPO_IP
export EXPO_NO_LOCALHOST=1

# Criar .expo/settings.json
mkdir -p .expo
cat > .expo/settings.json << EOF
{
  "hostType": "tunnel",
  "dev": true
}
EOF

echo "🚀 Iniciando Expo Go em TUNNEL MODE..."
echo "   Tunnel mode é mais confiável para Android"
echo "   QR code será gerado automaticamente"
echo ""

# Iniciar com tunnel mode (mais confiável para Android)
EXPO_USE_DEV_CLIENT=0 \
EXPO_NO_DOTENV=1 \
npx expo start --tunnel --clear --go








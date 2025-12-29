#!/bin/bash

# Script para forçar uso do Expo Go (não dev-client) e corrigir QR code

set -e

cd /home/darley/lacos || exit 1

echo "🔧 Forçando uso do Expo Go (não dev-client)"
echo "============================================="
echo ""
echo "⚠️  O problema pode ser que está usando expo-dev-client"
echo "   Este script força o uso do Expo Go padrão"
echo ""

# Parar tudo
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
  "dev": true
}
EOF

# IP e Porta
EXPO_IP="10.102.0.103"
EXPO_PORT="8081"

# Verificar IP
IP=$(hostname -I | awk '{print $1}')
if [ "$IP" != "$EXPO_IP" ]; then
    read -p "IP atual ($IP) diferente. Usar atual? (s/n) [s]: " USAR_IP
    USAR_IP=${USAR_IP:-s}
    if [ "$USAR_IP" = "s" ]; then
        EXPO_IP="$IP"
    fi
fi

echo ""
echo "📱 Configuração:"
echo "   IP: $EXPO_IP"
echo "   Porta: $EXPO_PORT"
echo "   Modo: Expo Go (não dev-client)"
echo ""

# Configurar variáveis
export EXPO_NO_DOTENV=1
export REACT_NATIVE_PACKAGER_HOSTNAME=$EXPO_IP
export EXPO_PACKAGER_HOSTNAME=$EXPO_IP
export EXPO_NO_LOCALHOST=1
export EXPO_USE_LOCALHOST=0
# CRÍTICO: Forçar Expo Go
export EXPO_USE_DEV_CLIENT=0

echo "🚀 Iniciando Expo Go em TUNNEL MODE..."
echo "   QR code deve funcionar corretamente agora"
echo ""

# Iniciar SEM --dev-client (forçar Expo Go)
EXPO_USE_DEV_CLIENT=0 \
REACT_NATIVE_PACKAGER_HOSTNAME=$EXPO_IP \
EXPO_PACKAGER_HOSTNAME=$EXPO_IP \
EXPO_NO_LOCALHOST=1 \
npx expo start --tunnel --clear


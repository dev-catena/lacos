#!/bin/bash

# Script para FORÇAR Expo Go definitivamente

set -e

cd /home/darley/lacos || exit 1

echo "🔧 FORÇANDO EXPO GO (Solução Definitiva)"
echo "=========================================="
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

# IP
EXPO_IP="192.168.100.10"
EXPO_PORT="8081"

echo "📱 Configuração:"
echo "   IP: $EXPO_IP"
echo "   Porta: $EXPO_PORT"
echo "   Modo: Expo Go (FORÇADO)"
echo ""

# Configurar variáveis de ambiente
export EXPO_USE_DEV_CLIENT=0
export EXPO_NO_DOTENV=1
export REACT_NATIVE_PACKAGER_HOSTNAME=$EXPO_IP
export EXPO_PACKAGER_HOSTNAME=$EXPO_IP
export EXPO_NO_LOCALHOST=1
export EXPO_USE_LOCALHOST=0

# Criar/atualizar .expo/settings.json
mkdir -p .expo
cat > .expo/settings.json << EOF
{
  "hostType": "lan",
  "lanType": "ip",
  "dev": true,
  "scheme": null
}
EOF

echo "🚀 Iniciando Expo Go..."
echo "   O QR code deve mostrar: exp://$EXPO_IP:$EXPO_PORT"
echo "   NÃO deve mostrar: exp+lacos:// ou expo-development-client"
echo ""

# Iniciar com --go para forçar Expo Go
EXPO_USE_DEV_CLIENT=0 \
EXPO_NO_DOTENV=1 \
REACT_NATIVE_PACKAGER_HOSTNAME=$EXPO_IP \
EXPO_PACKAGER_HOSTNAME=$EXPO_IP \
EXPO_NO_LOCALHOST=1 \
npx expo start --tunnel --clear --go








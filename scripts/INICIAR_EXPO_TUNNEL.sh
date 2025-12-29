#!/bin/bash

# Script simples para iniciar Expo em Tunnel Mode
# Esta é a solução mais confiável para problemas de QR code

set -e

cd /home/darley/lacos || exit 1

echo "🚀 Iniciando Expo em TUNNEL MODE"
echo "================================="
echo ""
echo "✅ Esta é a solução mais confiável para problemas de QR code"
echo "✅ Funciona no iOS e Android"
echo "✅ Funciona mesmo em redes diferentes"
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

# Verificar se expo-dev-client está instalado
USE_DEV_CLIENT=""
if npm list expo-dev-client > /dev/null 2>&1; then
    USE_DEV_CLIENT="--dev-client"
    echo "✅ Usando expo-dev-client"
else
    echo "✅ Usando Expo Go"
fi

echo ""
echo "🚀 Iniciando Expo em TUNNEL MODE..."
echo "   O QR code deve funcionar normalmente agora!"
echo ""

# Iniciar em tunnel mode
if [ -n "$USE_DEV_CLIENT" ]; then
    npx expo start --tunnel --clear $USE_DEV_CLIENT
else
    npx expo start --tunnel --clear
fi


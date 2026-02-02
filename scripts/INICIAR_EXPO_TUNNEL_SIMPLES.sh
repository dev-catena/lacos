#!/bin/bash

# Script SIMPLES para iniciar Expo em Tunnel Mode SEM interceptação
# Use este se o QR code não aparecer com o script complexo

set -e

cd /home/darley/lacos || exit 1

echo "🚇 Iniciando Expo em TUNNEL MODE (Modo Simples)"
echo "================================================"
echo ""
echo "✅ Este script NÃO intercepta a saída"
echo "✅ QR code deve aparecer normalmente"
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
echo "   O QR code deve aparecer em alguns segundos!"
echo ""
echo "💡 Dica: Se o QR code não aparecer, pressione 's' no terminal"
echo ""

# Iniciar em tunnel mode SEM interceptação
if [ -n "$USE_DEV_CLIENT" ]; then
    npx expo start --tunnel --clear $USE_DEV_CLIENT
else
    npx expo start --tunnel --clear
fi


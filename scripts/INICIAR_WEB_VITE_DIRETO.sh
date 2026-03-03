#!/bin/bash

# Script para iniciar web usando Vite DIRETAMENTE (sem Expo CLI)
# Isso garante que escute em 0.0.0.0 e seja acessível de outros dispositivos

set -e

cd /home/darley/lacos || exit 1

EXPO_IP="192.168.0.20"
EXPO_PORT="8081"

echo "🌐 INICIANDO WEB COM VITE DIRETO"
echo "================================="
echo ""
echo "📱 IP: $EXPO_IP"
echo "🔌 Porta: $EXPO_PORT"
echo ""
echo "✅ Vite será iniciado diretamente (sem Expo CLI)"
echo "✅ Garantido escutar em 0.0.0.0 (todas as interfaces)"
echo ""

# Verificar se pasta web existe
if [ ! -d "web" ]; then
    echo "❌ Pasta 'web' não encontrada!"
    echo "   Execute: npx create-expo-app --template web"
    exit 1
fi

# Parar processos antigos
echo "1️⃣ Parando processos antigos..."
pkill -f "expo start" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
sleep 2
echo "✅ Parado"
echo ""

# Configurar variáveis de ambiente
export EXPO_IP="$EXPO_IP"
export EXPO_PORT="$EXPO_PORT"
export HOST="0.0.0.0"
export PORT="$EXPO_PORT"

echo "═══════════════════════════════════════════════════════════"
echo "🚀 INICIANDO VITE DIRETO"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📋 IMPORTANTE:"
echo "   ✅ Servidor será acessível em: http://${EXPO_IP}:${EXPO_PORT}"
echo "   ✅ Escutando em 0.0.0.0 (todas as interfaces)"
echo "   ✅ Outros dispositivos na mesma rede podem acessar"
echo ""
echo "📱 Para acessar de outro dispositivo:"
echo "   1. Certifique-se que está na mesma rede Wi-Fi"
echo "   2. Abra navegador no dispositivo"
echo "   3. Acesse: http://${EXPO_IP}:${EXPO_PORT}"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""

# Ir para pasta web e iniciar Vite
cd web

# Verificar se package.json tem script dev
if grep -q '"dev"' package.json; then
    echo "🚀 Iniciando Vite com script 'dev'..."
    npm run dev
else
    echo "🚀 Iniciando Vite diretamente..."
    npx vite --host 0.0.0.0 --port "$EXPO_PORT"
fi


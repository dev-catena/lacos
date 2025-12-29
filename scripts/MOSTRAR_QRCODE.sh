#!/bin/bash

# Script para mostrar QR code do Expo que está rodando

echo "📱 Verificando Expo rodando..."
echo ""

# Verificar se Expo está rodando
if ! lsof -i :8081 > /dev/null 2>&1; then
    echo "❌ Expo não está rodando na porta 8081"
    echo ""
    echo "💡 Para iniciar o Expo:"
    echo "   ./INICIAR_EXPO_SEM_LOCALHOST.sh"
    echo "   ou"
    echo "   npm run start:no-localhost:tunnel"
    exit 1
fi

echo "✅ Expo está rodando!"
echo ""

# Tentar obter URL do Expo
echo "🔍 Tentando obter informações do Expo..."
echo ""

# Verificar se há processo Expo
EXPO_PID=$(pgrep -f "expo start" | head -1)
if [ -n "$EXPO_PID" ]; then
    echo "📋 Processo Expo encontrado (PID: $EXPO_PID)"
    echo ""
fi

# Verificar se há URL do tunnel
TUNNEL_URL=$(curl -s http://localhost:8081 2>/dev/null | grep -oP 'exp://[^"]+' | head -1)

if [ -n "$TUNNEL_URL" ]; then
    echo "🎯 URL encontrada: $TUNNEL_URL"
    echo ""
    echo "📱 Use esta URL no Expo Go:"
    echo "   $TUNNEL_URL"
    echo ""
else
    # Tentar obter do status
    STATUS=$(curl -s http://localhost:8081/status 2>/dev/null)
    if [ -n "$STATUS" ]; then
        echo "✅ Metro está respondendo"
        echo ""
        echo "💡 Para ver o QR code:"
        echo "   1. Vá para o terminal onde o Expo está rodando"
        echo "   2. Pressione 's' para mostrar o QR code"
        echo "   3. Ou use a URL: exp://10.102.0.103:8081"
    else
        echo "⚠️  Não foi possível obter URL automaticamente"
        echo ""
        echo "💡 Tente:"
        echo "   1. Pressione 's' no terminal do Expo para mostrar QR code"
        echo "   2. Ou use: exp://10.102.0.103:8081"
    fi
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "📱 INSTRUÇÕES:"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "1. No terminal onde o Expo está rodando, pressione 's'"
echo "   Isso vai mostrar o QR code"
echo ""
echo "2. Ou use a URL manualmente no Expo Go:"
if [ -n "$TUNNEL_URL" ]; then
    echo "   $TUNNEL_URL"
else
    echo "   exp://10.102.0.103:8081"
fi
echo ""
echo "3. No Expo Go:"
echo "   → Toque em 'Enter URL manually'"
echo "   → Cole a URL acima"
echo "   → Conecte"
echo ""


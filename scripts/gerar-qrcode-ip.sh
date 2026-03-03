#!/bin/bash

# Script para gerar QR code com a URL correta do Expo

EXPO_IP="192.168.0.20"
EXPO_PORT="8081"
EXPO_URL="exp://${EXPO_IP}:${EXPO_PORT}"

echo "════════════════════════════════════════════════════════════"
echo "📱 URL CORRETA DO EXPO:"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "   $EXPO_URL"
echo ""
echo "════════════════════════════════════════════════════════════"
echo ""

# Tentar gerar QR code se qrencode estiver disponível
if command -v qrencode > /dev/null 2>&1; then
    echo "📱 Gerando QR code com a URL correta..."
    echo ""
    qrencode -t ANSI "$EXPO_URL"
    echo ""
    echo "✅ Escaneie o QR code acima com o Expo Go"
else
    echo "⚠️  qrencode não está instalado."
    echo ""
    echo "📦 Para instalar e gerar QR code:"
    echo "   sudo apt install qrencode"
    echo ""
    echo "🌐 Ou use uma ferramenta online:"
    echo "   1. Acesse: https://www.qr-code-generator.com/"
    echo "   2. Cole a URL: $EXPO_URL"
    echo "   3. Gere e escaneie o QR code"
    echo ""
    echo "📋 Ou use manualmente no Expo Go:"
    echo "   1. Abra o Expo Go"
    echo "   2. Toque em 'Enter URL manually'"
    echo "   3. Cole: $EXPO_URL"
    echo ""
fi


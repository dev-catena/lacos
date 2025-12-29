#!/bin/bash

# Script para iniciar Expo com QR code CORRIGIDO (sem localhost)

set -e

cd /home/darley/lacos || exit 1

echo "🔧 INICIANDO EXPO COM QR CODE CORRIGIDO"
echo "======================================="
echo ""

# IP e Porta
EXPO_IP="10.102.0.103"
EXPO_PORT="8081"
EXPO_URL="exp://${EXPO_IP}:${EXPO_PORT}"

# Verificar IP atual
IP_ATUAL=$(hostname -I | awk '{print $1}')
if [ "$IP_ATUAL" != "$EXPO_IP" ]; then
    echo "⚠️  IP atual ($IP_ATUAL) diferente do esperado ($EXPO_IP)"
    echo "   Usando IP atual: $IP_ATUAL"
    EXPO_IP="$IP_ATUAL"
    EXPO_URL="exp://${EXPO_IP}:${EXPO_PORT}"
fi

echo "📱 Configuração:"
echo "   IP: $EXPO_IP"
echo "   Porta: $EXPO_PORT"
echo "   URL: $EXPO_URL"
echo ""

# 1. Parar processos
echo "1️⃣ Parando processos antigos..."
pkill -f "expo start" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true
sleep 2
echo "✅ Processos parados"
echo ""

# 2. Limpar cache
echo "2️⃣ Limpando cache..."
rm -rf .expo 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true
echo "✅ Cache limpo"
echo ""

# 3. Escolher modo
echo "═══════════════════════════════════════════════════════════"
echo "🎯 ESCOLHA O MODO:"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "1. LAN Mode (mais rápido, mesma rede)"
echo "   QR code será corrigido para: $EXPO_URL"
echo ""
echo "2. Tunnel Mode (mais confiável, qualquer rede)"
echo "   QR code do tunnel será preservado"
echo ""
read -p "Escolha (1 ou 2) [1]: " MODO
MODO=${MODO:-1}
echo ""

echo "═══════════════════════════════════════════════════════════"
echo "🚀 INICIANDO EXPO (QR CODE SERÁ CORRIGIDO)"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📋 IMPORTANTE:"
echo "   - QR code será corrigido automaticamente"
echo "   - URLs de localhost serão substituídas por: $EXPO_URL"
echo "   - O QR code deve funcionar corretamente agora!"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""

if [ "$MODO" = "2" ]; then
    node start-expo-qrcode-corrigido.js --tunnel
else
    node start-expo-qrcode-corrigido.js --lan
fi


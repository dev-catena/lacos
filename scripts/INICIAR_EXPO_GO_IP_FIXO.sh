#!/bin/bash

# Script para iniciar Expo Go com IP FIXO
# GARANTE que o QR code sempre mostra: exp://10.102.0.103:8081
# NUNCA, NUNCA, NUNCA usa localhost

echo ""
echo "🚀 ============================================"
echo "🚀 EXPO GO - IP FIXO (10.102.0.103:8081)"
echo "🚀 ============================================"
echo ""

cd /home/darley/lacos || exit 1

# Parar processos antigos
echo "🛑 Parando processos antigos..."
pkill -f "expo start" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true
pkill -f "node.*expo" 2>/dev/null || true
sleep 2

# Liberar porta 8081
if lsof -i :8081 > /dev/null 2>&1; then
    echo "🔓 Liberando porta 8081..."
    lsof -ti :8081 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

# Limpar cache
echo "🧹 Limpando cache..."
rm -rf .expo 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf .metro 2>/dev/null || true

echo ""
echo "✅ Preparação concluída!"
echo ""
echo "📱 IP FIXO: 10.102.0.103"
echo "📱 PORTA: 8081"
echo "📱 QR CODE: exp://10.102.0.103:8081"
echo ""
echo "⚠️  GARANTINDO QUE NUNCA USE LOCALHOST!"
echo ""

# Executar o script Node.js
node start-expo-ip-forcado.js
















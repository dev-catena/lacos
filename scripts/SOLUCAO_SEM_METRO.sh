#!/bin/bash

# Solução SEM Metro - Usa apenas Tunnel Mode do Expo
# Não depende de configuração de rede local

set -e

cd /home/darley/lacos || exit 1

echo "🌐 SOLUÇÃO SEM METRO LOCAL"
echo "=========================="
echo ""
echo "✅ Esta solução usa apenas Tunnel Mode do Expo"
echo "✅ Não depende de configuração de rede local"
echo "✅ Funciona mesmo se Metro local não estiver acessível"
echo ""

# 1. Parar tudo
echo "1️⃣ Parando processos..."
pkill -f "expo start" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true
sleep 2
echo "✅ Parado"
echo ""

# 2. Limpar cache
echo "2️⃣ Limpando cache..."
rm -rf .expo 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true
echo "✅ Limpo"
echo ""

# 3. Verificar dev-client
USE_DEV_CLIENT=""
if npm list expo-dev-client > /dev/null 2>&1; then
    USE_DEV_CLIENT="--dev-client"
    echo "✅ Usando expo-dev-client"
else
    echo "✅ Usando Expo Go"
fi
echo ""

echo "═══════════════════════════════════════════════════════════"
echo "🚀 INICIANDO EXPO EM TUNNEL MODE"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📋 IMPORTANTE:"
echo "   - O Tunnel Mode cria um túnel público"
echo "   - Não precisa de configuração de rede local"
echo "   - Funciona em qualquer rede (Wi-Fi, 4G, etc)"
echo "   - O QR code aparecerá automaticamente"
echo ""
echo "⏱️  Aguarde alguns segundos para o túnel conectar..."
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""

# 4. Gerar QR code em background após 15 segundos
(
    sleep 15
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "📱 GERANDO QR CODE ALTERNATIVO..."
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    
    # Tentar obter URL do tunnel
    TUNNEL_URL=$(curl -s http://localhost:8081 2>/dev/null | grep -oP 'exp://[^"]+' | head -1)
    
    if [ -n "$TUNNEL_URL" ]; then
        echo "🎯 URL do Tunnel: $TUNNEL_URL"
        echo ""
        qrcode-terminal "$TUNNEL_URL" 2>/dev/null || node -e "require('qrcode-terminal').generate('$TUNNEL_URL', {small: true})" 2>/dev/null || echo "   $TUNNEL_URL"
    else
        # Se não conseguir, usar IP local como fallback
        IP=$(hostname -I | awk '{print $1}')
        FALLBACK_URL="exp://${IP}:8081"
        echo "⚠️  Não foi possível obter URL do tunnel"
        echo "💡 Use esta URL manualmente: $FALLBACK_URL"
        echo ""
        qrcode-terminal "$FALLBACK_URL" 2>/dev/null || node -e "require('qrcode-terminal').generate('$FALLBACK_URL', {small: true})" 2>/dev/null || echo "   $FALLBACK_URL"
    fi
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo ""
) &

# 5. Iniciar em Tunnel Mode COM interceptação de localhost
if [ -n "$USE_DEV_CLIENT" ]; then
    node start-expo-tunnel-sem-localhost.js --dev-client
else
    node start-expo-tunnel-sem-localhost.js
fi


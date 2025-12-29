#!/bin/bash

# Script para iniciar Expo com QR code CORRETO (sem localhost)
# Gera QR code customizado com exp://10.102.0.103:8081

set -e

cd /home/darley/lacos || exit 1

echo "📱 INICIANDO EXPO COM QR CODE CORRETO"
echo "====================================="
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

# 3. Verificar se qrcode-terminal está instalado
echo "3️⃣ Verificando qrcode-terminal..."
if npm list -g qrcode-terminal > /dev/null 2>&1 || npm list qrcode-terminal > /dev/null 2>&1; then
    echo "✅ qrcode-terminal instalado"
    TEM_QRCODE=true
else
    echo "⚠️  qrcode-terminal não instalado"
    echo "   Instalando..."
    npm install -g qrcode-terminal 2>/dev/null || npm install qrcode-terminal 2>/dev/null || {
        echo "   ⚠️  Não foi possível instalar, mas continuando..."
        TEM_QRCODE=false
    }
    if [ $? -eq 0 ]; then
        TEM_QRCODE=true
        echo "✅ qrcode-terminal instalado"
    fi
fi
echo ""

# 4. Escolher modo
echo "═══════════════════════════════════════════════════════════"
echo "🎯 ESCOLHA O MODO:"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "1. LAN Mode (mais rápido, mesma rede)"
echo "   URL: $EXPO_URL"
echo "   QR code: exp://$EXPO_IP:$EXPO_PORT"
echo ""
echo "2. Tunnel Mode (mais confiável, qualquer rede)"
echo "   URL: será gerada automaticamente"
echo ""
read -p "Escolha (1 ou 2) [1]: " MODO
MODO=${MODO:-1}
echo ""

echo "═══════════════════════════════════════════════════════════"
echo "🚀 INICIANDO EXPO COM QR CODE CORRETO"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📋 IMPORTANTE:"
echo "   - QR code será gerado com URL CORRETA: $EXPO_URL"
echo "   - Qualquer localhost será substituído automaticamente"
echo "   - Use o QR code que aparecer (ou a URL manualmente)"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""

# 5. Gerar QR code correto em background (após alguns segundos)
if [ "$TEM_QRCODE" = "true" ]; then
    (
        sleep 8
        echo ""
        echo "═══════════════════════════════════════════════════════════"
        echo "📱 QR CODE CORRETO (use este no Expo Go):"
        echo "═══════════════════════════════════════════════════════════"
        echo ""
        if [ "$MODO" = "2" ]; then
            # Em tunnel mode, tentar obter URL do tunnel
            TUNNEL_URL=$(curl -s http://localhost:8081 2>/dev/null | grep -oP 'exp://[^"]+' | head -1)
            if [ -n "$TUNNEL_URL" ]; then
                qrcode-terminal "$TUNNEL_URL" 2>/dev/null || node -e "require('qrcode-terminal').generate('$TUNNEL_URL', {small: true})" 2>/dev/null || echo "   $TUNNEL_URL"
            else
                qrcode-terminal "$EXPO_URL" 2>/dev/null || node -e "require('qrcode-terminal').generate('$EXPO_URL', {small: true})" 2>/dev/null || echo "   $EXPO_URL"
            fi
        else
            qrcode-terminal "$EXPO_URL" 2>/dev/null || node -e "require('qrcode-terminal').generate('$EXPO_URL', {small: true})" 2>/dev/null || echo "   $EXPO_URL"
        fi
        echo ""
        echo "═══════════════════════════════════════════════════════════"
        echo ""
    ) &
fi

# 6. Iniciar Expo
if [ "$MODO" = "2" ]; then
    node start-expo-com-qrcode-correto.js --tunnel
else
    node start-expo-com-qrcode-correto.js --lan
fi


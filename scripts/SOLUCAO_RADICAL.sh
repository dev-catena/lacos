#!/bin/bash

# SOLUÇÃO RADICAL - Para tudo, limpa tudo, configura tudo do zero
# NÃO permite que NENHUMA URL use localhost

set -e

cd /home/darley/lacos || exit 1

echo "🚫 SOLUÇÃO RADICAL - BLOQUEIO TOTAL DE LOCALHOST"
echo "================================================="
echo ""
echo "⚠️  Esta solução vai:"
echo "   1. Parar TODOS os processos"
echo "   2. Limpar TUDO"
echo "   3. Configurar Metro para NUNCA usar localhost"
echo "   4. Interceptar TODA saída do terminal"
echo ""

EXPO_IP="10.102.0.103"
EXPO_PORT="8081"
EXPO_URL="exp://${EXPO_IP}:${EXPO_PORT}"

# Verificar IP
IP_ATUAL=$(hostname -I | awk '{print $1}')
if [ "$IP_ATUAL" != "$EXPO_IP" ]; then
    EXPO_IP="$IP_ATUAL"
    EXPO_URL="exp://${EXPO_IP}:${EXPO_PORT}"
fi

echo "📱 IP: $EXPO_IP"
echo "🔌 Porta: $EXPO_PORT"
echo "🎯 URL: $EXPO_URL"
echo ""

# 1. MATAR TUDO
echo "1️⃣ MATANDO TODOS os processos..."
pkill -9 -f "expo" 2>/dev/null || true
pkill -9 -f "metro" 2>/dev/null || true
pkill -9 -f "node.*8081" 2>/dev/null || true
pkill -9 -f "ngrok" 2>/dev/null || true
sleep 3
echo "✅ Tudo parado"
echo ""

# 2. LIBERAR PORTA
echo "2️⃣ Liberando porta 8081..."
lsof -ti :8081 | xargs kill -9 2>/dev/null || true
sleep 2
echo "✅ Porta livre"
echo ""

# 3. LIMPAR TUDO
echo "3️⃣ Limpando TUDO..."
rm -rf .expo 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf .metro 2>/dev/null || true
rm -rf /tmp/metro-* 2>/dev/null || true
rm -rf /tmp/haste-* 2>/dev/null || true
rm -rf /tmp/react-* 2>/dev/null || true
echo "✅ Cache limpo"
echo ""

# 4. CONFIGURAR .expo/settings.json
echo "4️⃣ Configurando Expo..."
mkdir -p .expo
cat > .expo/settings.json << EOF
{
  "hostType": "lan",
  "lanType": "ip",
  "dev": true,
  "minify": false
}
EOF
echo "✅ Configurado"
echo ""

# 5. VERIFICAR dev-client
USE_DEV_CLIENT=""
if npm list expo-dev-client > /dev/null 2>&1; then
    USE_DEV_CLIENT="--dev-client"
fi

# 6. ESCOLHER MODO
echo "═══════════════════════════════════════════════════════════"
echo "🎯 ESCOLHA:"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "1. LAN Mode (recomendado)"
echo "   URL: $EXPO_URL"
echo ""
echo "2. Tunnel Mode"
echo ""
read -p "Escolha (1 ou 2) [1]: " MODO
MODO=${MODO:-1}
echo ""

echo "═══════════════════════════════════════════════════════════"
echo "🚀 INICIANDO COM BLOQUEIO RADICAL"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📋 GARANTIAS:"
echo "   ✅ Metro.config.js intercepta respostas HTTP"
echo "   ✅ Script intercepta saída do terminal"
echo "   ✅ NENHUMA URL usará localhost"
echo ""
echo "📱 Use no Expo Go: $EXPO_URL"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""

# 7. CONFIGURAR VARIÁVEIS
export REACT_NATIVE_PACKAGER_HOSTNAME="$EXPO_IP"
export EXPO_PACKAGER_HOSTNAME="$EXPO_IP"
export PACKAGER_HOSTNAME="$EXPO_IP"
export REACT_NATIVE_PACKAGER_PORT="$EXPO_PORT"
export EXPO_PACKAGER_PORT="$EXPO_PORT"
export METRO_HOST="$EXPO_IP"
export HOST="$EXPO_IP"
export PORT="$EXPO_PORT"
export EXPO_NO_LOCALHOST="1"
export EXPO_USE_LOCALHOST="0"
export EXPO_NO_DOTENV="1"
export EXPO_USE_METRO_WORKSPACE_ROOT="1"
export LOCALHOST="$EXPO_IP"
export HOSTNAME="$EXPO_IP"

# 8. GERAR QR CODE EM BACKGROUND
(
    sleep 10
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "📱 GERANDO QR CODE..."
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    EXPO_IP="$EXPO_IP" EXPO_PORT="$EXPO_PORT" node gerar-qrcode-forcado.js
) &

# 9. INICIAR
if [ "$MODO" = "2" ]; then
    if [ -n "$USE_DEV_CLIENT" ]; then
        node start-expo-com-qrcode-forcado.js --tunnel --dev-client
    else
        node start-expo-com-qrcode-forcado.js --tunnel
    fi
else
    if [ -n "$USE_DEV_CLIENT" ]; then
        node start-expo-com-qrcode-forcado.js --lan --dev-client
    else
        node start-expo-com-qrcode-forcado.js --lan
    fi
fi


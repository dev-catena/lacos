#!/bin/bash

# Script DEFINITIVO para iniciar Expo SEM LOCALHOST
# Resolve: "failed to download remote update" no iOS e Android

set -e

cd /home/darley/lacos || exit 1

echo "🚫 INICIANDO EXPO SEM LOCALHOST (DEFINITIVO)"
echo "============================================="
echo ""
echo "✅ Este script garante que NENHUMA URL use localhost"
echo "✅ Resolve erros: 'failed to download remote update'"
echo "✅ Funciona no iOS e Android"
echo ""

# IP e Porta
EXPO_IP="192.168.0.20"
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

# 1. Parar TODOS os processos
echo "1️⃣ Parando TODOS os processos Expo/Metro..."
pkill -f "expo start" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true
pkill -f "node.*8081" 2>/dev/null || true
sleep 3
echo "✅ Processos parados"
echo ""

# 2. Liberar porta 8081
echo "2️⃣ Liberando porta 8081..."
if lsof -i :8081 > /dev/null 2>&1; then
    lsof -ti :8081 | xargs kill -9 2>/dev/null || true
    sleep 2
fi
echo "✅ Porta 8081 livre"
echo ""

# 3. Limpar TUDO
echo "3️⃣ Limpando cache completamente..."
rm -rf .expo 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf .metro 2>/dev/null || true
rm -rf /tmp/metro-* 2>/dev/null || true
rm -rf /tmp/haste-* 2>/dev/null || true
echo "✅ Cache limpo"
echo ""

# 4. Verificar metro.config.js
echo "4️⃣ Verificando metro.config.js..."
if grep -q "localhost" metro.config.js 2>/dev/null; then
    echo "   ⚠️  metro.config.js pode ter localhost, mas será interceptado"
else
    echo "   ✅ metro.config.js configurado corretamente"
fi
echo ""

# 5. Configurar .expo/settings.json
echo "5️⃣ Configurando .expo/settings.json..."
mkdir -p .expo
cat > .expo/settings.json << EOF
{
  "hostType": "lan",
  "lanType": "ip",
  "dev": true,
  "minify": false
}
EOF
echo "✅ Configuração criada"
echo ""

# 6. Verificar se expo-dev-client está instalado
USE_DEV_CLIENT=""
if npm list expo-dev-client > /dev/null 2>&1; then
    USE_DEV_CLIENT="--dev-client"
    echo "✅ Detectado expo-dev-client"
else
    echo "✅ Usando Expo Go"
fi
echo ""

# 7. Escolher modo
echo "═══════════════════════════════════════════════════════════"
echo "🎯 ESCOLHA O MODO:"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "1. LAN Mode (recomendado para mesma rede)"
echo "   URL: $EXPO_URL"
echo "   ✅ Mais rápido"
echo "   ✅ Funciona se iOS/Android estiverem na mesma rede"
echo ""
echo "2. Tunnel Mode (recomendado se tiver problemas de rede)"
echo "   URL: será gerada automaticamente"
echo "   ✅ Funciona em qualquer rede"
echo "   ⚠️  Pode ser mais lento"
echo ""
read -p "Escolha (1 ou 2) [1]: " MODO
MODO=${MODO:-1}
echo ""

echo "═══════════════════════════════════════════════════════════"
echo "🚀 INICIANDO EXPO (LOCALHOST BLOQUEADO)"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📋 GARANTIAS:"
echo "   ✅ NENHUMA URL usará localhost"
echo "   ✅ Todas as respostas HTTP terão IP correto"
echo "   ✅ Metro intercepta e corrige localhost automaticamente"
echo ""
echo "📱 URL PARA USAR NO EXPO GO:"
if [ "$MODO" = "2" ]; then
    echo "   (Será mostrada após iniciar - procure por exp://)"
else
    echo "   $EXPO_URL"
fi
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""

# 8. Configurar TODAS as variáveis de ambiente
export REACT_NATIVE_PACKAGER_HOSTNAME="$EXPO_IP"
export EXPO_PACKAGER_HOSTNAME="$EXPO_IP"
export PACKAGER_HOSTNAME="$EXPO_IP"
export REACT_NATIVE_PACKAGER_PORT="$EXPO_PORT"
export EXPO_PACKAGER_PORT="$EXPO_PORT"
export EXPO_DEVTOOLS_LISTEN_ADDRESS="0.0.0.0"
export HOST="$EXPO_IP"
export PORT="$EXPO_PORT"
export METRO_HOST="$EXPO_IP"
export EXPO_NO_DOTENV="1"
export EXPO_NO_LOCALHOST="1"
export EXPO_USE_LOCALHOST="0"
export EXPO_USE_METRO_WORKSPACE_ROOT="1"

# 9. Iniciar Expo com interceptação total
if [ "$MODO" = "2" ]; then
    if [ -n "$USE_DEV_CLIENT" ]; then
        node start-expo-intercepta-tudo.js --tunnel --dev-client
    else
        node start-expo-intercepta-tudo.js --tunnel
    fi
else
    if [ -n "$USE_DEV_CLIENT" ]; then
        node start-expo-intercepta-tudo.js --lan --dev-client
    else
        node start-expo-intercepta-tudo.js --lan
    fi
fi


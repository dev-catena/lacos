#!/bin/bash

# Script para iniciar Expo corrigindo problemas de conexão
# Resolve: "failed to download remoto" e problemas de timeout

set -e

cd /home/darley/lacos || exit 1

echo "🔧 INICIANDO EXPO - CORREÇÃO DE CONEXÃO"
echo "======================================="
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

# 1. Parar TODOS os processos relacionados
echo "1️⃣ Parando processos antigos..."
pkill -f "expo start" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true
pkill -f "node.*8081" 2>/dev/null || true
sleep 3
echo "✅ Processos parados"
echo ""

# 2. Liberar porta 8081
echo "2️⃣ Liberando porta 8081..."
if lsof -i :8081 > /dev/null 2>&1; then
    echo "   Porta 8081 ainda em uso, forçando liberação..."
    lsof -ti :8081 | xargs kill -9 2>/dev/null || true
    sleep 2
fi
echo "✅ Porta 8081 livre"
echo ""

# 3. Limpar cache
echo "3️⃣ Limpando cache..."
rm -rf .expo 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf .metro 2>/dev/null || true
rm -rf /tmp/metro-* 2>/dev/null || true
rm -rf /tmp/haste-* 2>/dev/null || true
echo "✅ Cache limpo"
echo ""

# 4. Verificar conectividade
echo "4️⃣ Verificando conectividade..."
if ! ping -c 1 -W 2 8.8.8.8 > /dev/null 2>&1; then
    echo "⚠️  Sem conectividade com internet"
    echo "   Tunnel mode pode não funcionar"
else
    echo "✅ Internet OK"
fi
echo ""

# 5. Configurar .expo/settings.json
echo "5️⃣ Configurando Expo..."
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

# 7. Escolher modo de inicialização
echo "═══════════════════════════════════════════════════════════"
echo "🎯 ESCOLHA O MODO DE INICIALIZAÇÃO:"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "1. LAN Mode (mais rápido, requer mesma rede)"
echo "   URL: $EXPO_URL"
echo ""
echo "2. Tunnel Mode (mais confiável, funciona em qualquer rede)"
echo "   URL: será gerada automaticamente"
echo ""
read -p "Escolha (1 ou 2) [1]: " MODO
MODO=${MODO:-1}
echo ""

if [ "$MODO" = "2" ]; then
    echo "🚀 Iniciando em TUNNEL MODE..."
    echo "   ✅ Funciona mesmo em redes diferentes"
    echo "   ✅ QR code funciona normalmente"
    echo ""
    
    if [ -n "$USE_DEV_CLIENT" ]; then
        npx expo start --tunnel --clear $USE_DEV_CLIENT
    else
        npx expo start --tunnel --clear
    fi
else
    echo "🚀 Iniciando em LAN MODE..."
    echo "   URL para usar no Expo Go: $EXPO_URL"
    echo ""
    echo "⚠️  IMPORTANTE:"
    echo "   - Se o QR code mostrar localhost, IGNORE"
    echo "   - Use a URL acima MANUALMENTE no Expo Go"
    echo ""
    
    # Configurar TODAS as variáveis de ambiente
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
    
    if [ -n "$USE_DEV_CLIENT" ]; then
        npx expo start --lan --port "$EXPO_PORT" --clear $USE_DEV_CLIENT
    else
        npx expo start --lan --port "$EXPO_PORT" --clear
    fi
fi


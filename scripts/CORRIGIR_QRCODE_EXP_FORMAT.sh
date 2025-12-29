#!/bin/bash

# Script para corrigir QR code que gera http://localhost ao invés de exp://

set -e

cd /home/darley/lacos || exit 1

echo "🔧 Corrigindo QR Code para usar formato exp://"
echo "==============================================="
echo ""

# 1. Parar TUDO
echo "1️⃣ Parando processos..."
pkill -f "expo start" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true
pkill -f "node.*8081" 2>/dev/null || true
sleep 3
echo "✅ Processos parados"
echo ""

# 2. Limpar TUDO
echo "2️⃣ Limpando cache completamente..."
rm -rf .expo 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf .metro 2>/dev/null || true
rm -rf /tmp/metro-* 2>/dev/null || true
rm -rf /tmp/haste-* 2>/dev/null || true
echo "✅ Cache limpo"
echo ""

# 3. Verificar IP
IP=$(hostname -I | awk '{print $1}')
EXPO_IP="10.102.0.103"
EXPO_PORT="8081"

if [ "$IP" != "$EXPO_IP" ]; then
    echo "⚠️  IP atual ($IP) diferente do esperado ($EXPO_IP)"
    read -p "Usar IP atual? (s/n) [s]: " USAR_IP_ATUAL
    USAR_IP_ATUAL=${USAR_IP_ATUAL:-s}
    if [ "$USAR_IP_ATUAL" = "s" ]; then
        EXPO_IP="$IP"
    fi
fi

echo "📱 Configuração:"
echo "   IP: $EXPO_IP"
echo "   Porta: $EXPO_PORT"
echo ""

# 4. Configurar .expo/settings.json
echo "3️⃣ Configurando .expo/settings.json..."
mkdir -p .expo
cat > .expo/settings.json << EOF
{
  "hostType": "lan",
  "lanType": "ip",
  "dev": true,
  "minify": false,
  "urlRandomness": "fixed"
}
EOF
echo "✅ Configuração criada"
echo ""

# 5. Configurar variáveis de ambiente CRÍTICAS
echo "4️⃣ Configurando variáveis de ambiente..."
export EXPO_NO_DOTENV=1
export EXPO_USE_METRO_WORKSPACE_ROOT=1
export REACT_NATIVE_PACKAGER_HOSTNAME=$EXPO_IP
export EXPO_PACKAGER_HOSTNAME=$EXPO_IP
export REACT_NATIVE_PACKAGER_PORT=$EXPO_PORT
export EXPO_PACKAGER_PORT=$EXPO_PORT
export EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
export HOST=$EXPO_IP
export PORT=$EXPO_PORT
export METRO_HOST=$EXPO_IP
export PACKAGER_HOSTNAME=$EXPO_IP
# CRÍTICO: Forçar formato exp://
export EXPO_NO_LOCALHOST=1
export EXPO_USE_LOCALHOST=0
export EXPO_USE_FAST_RESOLVER=1
# Forçar que use Expo Go (não dev-client) se possível
export EXPO_USE_DEV_CLIENT=0
echo "✅ Variáveis configuradas"
echo ""

# 6. Verificar se está usando dev-client
echo "5️⃣ Verificando configuração..."
if npm list expo-dev-client > /dev/null 2>&1; then
    echo "⚠️  expo-dev-client está instalado"
    echo "   Isso pode estar causando o problema"
    echo ""
    echo "   Opções:"
    echo "   1. Usar Expo Go (recomendado para resolver o problema)"
    echo "   2. Continuar com dev-client"
    echo ""
    read -p "   Escolha (1 ou 2) [1]: " ESCOLHA
    ESCOLHA=${ESCOLHA:-1}
    
    if [ "$ESCOLHA" = "1" ]; then
        USE_DEV_CLIENT=""
        echo "✅ Usando Expo Go"
    else
        USE_DEV_CLIENT="--dev-client"
        echo "✅ Usando expo-dev-client"
    fi
else
    USE_DEV_CLIENT=""
    echo "✅ Usando Expo Go"
fi
echo ""

# 7. Mostrar informações
echo "═══════════════════════════════════════════════════════════"
echo "📱 CONFIGURAÇÃO FINAL:"
echo "═══════════════════════════════════════════════════════════"
echo "   IP: $EXPO_IP"
echo "   Porta: $EXPO_PORT"
echo "   URL esperada: exp://$EXPO_IP:$EXPO_PORT"
echo "   Modo: $([ -z "$USE_DEV_CLIENT" ] && echo "Expo Go" || echo "Dev Client")"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   - O QR code DEVE mostrar: exp://$EXPO_IP:$EXPO_PORT"
echo "   - NÃO deve mostrar: http://localhost:8081"
echo "   - Ao escanear, deve abrir no Expo Go (não no navegador)"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""

# 8. Perguntar modo
echo "Escolha o modo de inicialização:"
echo "1️⃣  TUNNEL MODE (Recomendado - sempre funciona)"
echo "2️⃣  LAN MODE com IP forçado"
echo ""
read -p "Escolha (1 ou 2) [1]: " OPCAO
OPCAO=${OPCAO:-1}

case $OPCAO in
    1)
        echo ""
        echo "🚀 Iniciando em TUNNEL MODE..."
        echo "   QR code deve mostrar formato exp://"
        echo ""
        if [ -z "$USE_DEV_CLIENT" ]; then
            # Forçar Expo Go no tunnel
            EXPO_USE_DEV_CLIENT=0 \
            npx expo start --tunnel --clear
        else
            npx expo start --tunnel --clear --dev-client
        fi
        ;;
    2)
        echo ""
        echo "🚀 Iniciando em LAN MODE com IP forçado..."
        echo "   IP: $EXPO_IP"
        echo "   Porta: $EXPO_PORT"
        echo ""
        if [ -z "$USE_DEV_CLIENT" ]; then
            REACT_NATIVE_PACKAGER_HOSTNAME=$EXPO_IP \
            EXPO_PACKAGER_HOSTNAME=$EXPO_IP \
            EXPO_NO_LOCALHOST=1 \
            EXPO_USE_LOCALHOST=0 \
            EXPO_USE_DEV_CLIENT=0 \
            EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0 \
            npx expo start --lan --host $EXPO_IP --port $EXPO_PORT --clear
        else
            REACT_NATIVE_PACKAGER_HOSTNAME=$EXPO_IP \
            EXPO_PACKAGER_HOSTNAME=$EXPO_IP \
            EXPO_NO_LOCALHOST=1 \
            EXPO_USE_LOCALHOST=0 \
            EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0 \
            npx expo start --lan --host $EXPO_IP --port $EXPO_PORT --clear --dev-client
        fi
        ;;
    *)
        echo "❌ Opção inválida"
        exit 1
        ;;
esac


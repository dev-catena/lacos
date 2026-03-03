#!/bin/bash

# Script para forçar Expo a usar IP correto e evitar localhost:8082

set -e

cd /home/darley/lacos || exit 1

echo "🔧 Forçando Expo a usar IP correto (evitar localhost:8082)"
echo "============================================================"
echo ""

# IP e Porta
EXPO_IP="192.168.0.20"
EXPO_PORT="8081"

# Verificar IP atual
IP=$(hostname -I | awk '{print $1}')
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
echo "   URL esperada: exp://$EXPO_IP:$EXPO_PORT"
echo ""

# Parar processos
echo "🛑 Parando processos..."
pkill -f "expo start" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true
sleep 2

# Limpar cache
echo "🧹 Limpando cache..."
rm -rf .expo 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true

# Configurar .expo/settings.json
echo "📝 Configurando .expo/settings.json..."
mkdir -p .expo
cat > .expo/settings.json << EOF
{
  "hostType": "lan",
  "dev": true,
  "minify": false
}
EOF

# Configurar TODAS as variáveis necessárias
export EXPO_NO_DOTENV=1
export EXPO_USE_METRO_WORKSPACE_ROOT=1
export REACT_NATIVE_PACKAGER_HOSTNAME=$EXPO_IP
export EXPO_PACKAGER_HOSTNAME=$EXPO_IP
export REACT_NATIVE_PACKAGER_PORT=$EXPO_PORT
export EXPO_PACKAGER_PORT=$EXPO_PORT
export EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
export EXPO_DEVTOOLS_LISTEN_PORT=$EXPO_PORT
export HOST=$EXPO_IP
export PORT=$EXPO_PORT
export METRO_HOST=$EXPO_IP
export PACKAGER_HOSTNAME=$EXPO_IP
# CRÍTICO: Forçar que NÃO use localhost
export EXPO_NO_LOCALHOST=1
export EXPO_USE_LOCALHOST=0
export EXPO_USE_FAST_RESOLVER=1

echo "✅ Configuração completa"
echo ""
echo "🚀 Iniciando Expo..."
echo "   O QR code deve mostrar: exp://$EXPO_IP:$EXPO_PORT"
echo "   NÃO deve mostrar: http://localhost:8082"
echo ""

# Verificar se expo-dev-client está instalado
USE_DEV_CLIENT=""
if npm list expo-dev-client > /dev/null 2>&1; then
    USE_DEV_CLIENT="--dev-client"
fi

# Atualizar metro.config.js e start-expo.js com o IP correto ANTES de iniciar
echo "📝 Atualizando arquivos de configuração com IP: $EXPO_IP..."
if [ -f "metro.config.js" ]; then
    sed -i "s/const EXPO_IP = '[^']*';/const EXPO_IP = '$EXPO_IP';/g" metro.config.js
    echo "✅ metro.config.js atualizado"
fi
if [ -f "start-expo.js" ]; then
    sed -i "s/const EXPO_IP = '[^']*';/const EXPO_IP = '$EXPO_IP';/g" start-expo.js
    echo "✅ start-expo.js atualizado"
fi
echo ""

# Usar o script start-expo.js que intercepta e reescreve URLs
# Este script força o IP correto mesmo quando o Expo mostra localhost
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "🚀 INICIANDO EXPO..."
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "🎯 URL CORRETA PARA USAR NO EXPO GO:"
echo "   exp://$EXPO_IP:$EXPO_PORT"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   - Se o QR code mostrar localhost:8081 ou http://localhost:8081"
echo "     IGNORE e use a URL acima manualmente no Expo Go"
echo ""
echo "   - No Expo Go: Toque em 'Enter URL manually' e cole:"
echo "     exp://$EXPO_IP:$EXPO_PORT"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""

if [ -n "$USE_DEV_CLIENT" ]; then
    node start-expo.js --dev-client --clear
else
    node start-expo.js --clear
fi


#!/bin/bash

# Script ULTRA ROBUSTO para forçar Expo a usar IP correto
# Este script força o IP em TODAS as camadas possíveis

set -e

cd /home/darley/lacos || exit 1

echo "🔧 INICIANDO EXPO COM IP FORÇADO"
echo "=================================="
echo ""

# IP e Porta
EXPO_IP="10.102.0.103"
EXPO_PORT="8081"
EXPO_URL="exp://${EXPO_IP}:${EXPO_PORT}"

# Verificar IP atual
IP=$(hostname -I | awk '{print $1}')
if [ "$IP" != "$EXPO_IP" ]; then
    echo "⚠️  IP atual ($IP) diferente do esperado ($EXPO_IP)"
    read -p "Usar IP atual? (s/n) [s]: " USAR_IP_ATUAL
    USAR_IP_ATUAL=${USAR_IP_ATUAL:-s}
    if [ "$USAR_IP_ATUAL" = "s" ]; then
        EXPO_IP="$IP"
        EXPO_URL="exp://${EXPO_IP}:${EXPO_PORT}"
    fi
fi

echo ""
echo "📱 Configuração:"
echo "   IP: $EXPO_IP"
echo "   Porta: $EXPO_PORT"
echo "   URL: $EXPO_URL"
echo ""

# Parar processos
echo "🛑 Parando processos antigos..."
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
  "lanType": "ip",
  "dev": true
}
EOF

# Verificar se expo-dev-client está instalado
USE_DEV_CLIENT=""
if npm list expo-dev-client > /dev/null 2>&1; then
    USE_DEV_CLIENT="--dev-client"
    echo "✅ Detectado expo-dev-client"
else
    echo "✅ Usando Expo Go padrão"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "🚀 INICIANDO EXPO COM IP FORÇADO"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "🎯 URL CORRETA PARA USAR NO EXPO GO:"
echo "   $EXPO_URL"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   - O QR code pode mostrar localhost:8081 ou http://localhost:8081"
echo "   - IGNORE o QR code se mostrar localhost"
echo "   - Use a URL acima MANUALMENTE no Expo Go:"
echo "     → Toque em 'Enter URL manually'"
echo "     → Cole: $EXPO_URL"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""

# CRÍTICO: Passar TODAS as variáveis de ambiente DIRETAMENTE no comando
# Isso garante que o Metro bundler herda essas variáveis
REACT_NATIVE_PACKAGER_HOSTNAME="$EXPO_IP" \
EXPO_PACKAGER_HOSTNAME="$EXPO_IP" \
PACKAGER_HOSTNAME="$EXPO_IP" \
REACT_NATIVE_PACKAGER_PORT="$EXPO_PORT" \
EXPO_PACKAGER_PORT="$EXPO_PORT" \
EXPO_DEVTOOLS_LISTEN_ADDRESS="0.0.0.0" \
HOST="$EXPO_IP" \
PORT="$EXPO_PORT" \
METRO_HOST="$EXPO_IP" \
EXPO_NO_DOTENV="1" \
EXPO_NO_LOCALHOST="1" \
EXPO_USE_LOCALHOST="0" \
EXPO_USE_METRO_WORKSPACE_ROOT="1" \
npx expo start --lan --port "$EXPO_PORT" --clear $USE_DEV_CLIENT


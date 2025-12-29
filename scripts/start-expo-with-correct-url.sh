#!/bin/bash

echo "🔧 Iniciando Expo com IP correto (10.102.0.103)..."
echo ""

cd /home/darley/lacos || exit 1

# Parar processos antigos
echo "🛑 Parando processos antigos..."
pkill -f "expo start" 2>/dev/null
pkill -f "metro" 2>/dev/null
pkill -f "node.*8081" 2>/dev/null
sleep 2

# Limpar cache
echo "🧹 Limpando cache..."
rm -rf .expo 2>/dev/null
rm -rf node_modules/.cache 2>/dev/null

# Liberar porta 8081
if lsof -i :8081 > /dev/null 2>&1; then
    echo "🔓 Liberando porta 8081..."
    lsof -ti :8081 | xargs kill -9 2>/dev/null
    sleep 1
fi

# IP correto
EXPO_IP="10.102.0.103"
EXPO_PORT="8081"
EXPO_URL="exp://${EXPO_IP}:${EXPO_PORT}"

echo ""
echo "════════════════════════════════════════════════════════════"
echo "📱 URL CORRETA PARA USAR NO EXPO GO:"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "   $EXPO_URL"
echo ""
echo "════════════════════════════════════════════════════════════"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   - O QR code pode mostrar localhost, mas IGNORE isso"
echo "   - Use a URL acima manualmente no Expo Go"
echo "   - No Expo Go: Toque em 'Enter URL manually' e cole: $EXPO_URL"
echo ""
echo "════════════════════════════════════════════════════════════"
echo ""

# Verificar se expo-dev-client está instalado
USE_DEV_CLIENT=""
if npm list expo-dev-client > /dev/null 2>&1; then
    echo "✅ Usando expo-dev-client"
    USE_DEV_CLIENT="--dev-client"
else
    echo "✅ Usando Expo Go"
fi

# Configurar variáveis de ambiente
export REACT_NATIVE_PACKAGER_HOSTNAME=$EXPO_IP
export EXPO_PACKAGER_HOSTNAME=$EXPO_IP
export HOST=$EXPO_IP
export PORT=$EXPO_PORT

echo "🚀 Iniciando Expo..."
echo ""

# Iniciar Expo em background e capturar a saída
if [ -n "$USE_DEV_CLIENT" ]; then
    REACT_NATIVE_PACKAGER_HOSTNAME=$EXPO_IP \
    EXPO_PACKAGER_HOSTNAME=$EXPO_IP \
    HOST=$EXPO_IP \
    PORT=$EXPO_PORT \
    npx expo start --lan --port $EXPO_PORT --clear $USE_DEV_CLIENT &
else
    REACT_NATIVE_PACKAGER_HOSTNAME=$EXPO_IP \
    EXPO_PACKAGER_HOSTNAME=$EXPO_IP \
    HOST=$EXPO_IP \
    PORT=$EXPO_PORT \
    npx expo start --lan --port $EXPO_PORT --clear &
fi

EXPO_PID=$!

# Aguardar um pouco para o Expo iniciar
sleep 5

# Mostrar a URL correta novamente após o Expo iniciar
echo ""
echo "════════════════════════════════════════════════════════════"
echo "📱 URL CORRETA (USE ESTA NO EXPO GO):"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "   $EXPO_URL"
echo ""
echo "════════════════════════════════════════════════════════════"
echo ""
echo "💡 Dica: Execute './gerar-qrcode-ip.sh' em outro terminal"
echo "   para gerar um QR code com a URL correta!"
echo ""

# Aguardar o processo Expo
wait $EXPO_PID


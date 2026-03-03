#!/bin/bash

echo "🔧 Corrigindo QR code para usar IP 192.168.0.20 (não localhost)..."
echo ""

cd /home/darley/lacos || exit 1

# Parar processos antigos
echo "🛑 Parando processos antigos..."
pkill -f "expo start" 2>/dev/null
pkill -f "metro" 2>/dev/null
pkill -f "node.*8081" 2>/dev/null
sleep 3

# Limpar TUDO
echo "🧹 Limpando cache completamente..."
rm -rf .expo 2>/dev/null
rm -rf node_modules/.cache 2>/dev/null
rm -rf .metro 2>/dev/null

# Liberar porta 8081
if lsof -i :8081 > /dev/null 2>&1; then
    echo "🔓 Liberando porta 8081..."
    lsof -ti :8081 | xargs kill -9 2>/dev/null
    sleep 2
fi

# IP correto
EXPO_IP="192.168.0.20"
EXPO_PORT="8081"

echo ""
echo "📱 Configurando Expo para usar:"
echo "   IP: $EXPO_IP"
echo "   Porta: $EXPO_PORT"
echo ""

# Verificar se expo-dev-client está instalado
USE_DEV_CLIENT=""
if npm list expo-dev-client > /dev/null 2>&1; then
    echo "✅ Usando expo-dev-client"
    USE_DEV_CLIENT="--dev-client"
else
    echo "✅ Usando Expo Go"
fi

# IMPORTANTE: A variável REACT_NATIVE_PACKAGER_HOSTNAME deve ser
# exportada ANTES de executar o comando expo start
# E deve ser passada diretamente no comando também
export REACT_NATIVE_PACKAGER_HOSTNAME=$EXPO_IP
export EXPO_PACKAGER_HOSTNAME=$EXPO_IP
export REACT_NATIVE_PACKAGER_PORT=$EXPO_PORT

echo ""
echo "🚀 Iniciando Expo..."
echo "   REACT_NATIVE_PACKAGER_HOSTNAME=$EXPO_IP"
echo "   Comando: expo start --lan --host $EXPO_IP --port $EXPO_PORT"
echo ""

# Executar com a variável de ambiente no mesmo comando
# Isso garante que o Metro bundler use o IP correto
if [ -n "$USE_DEV_CLIENT" ]; then
    REACT_NATIVE_PACKAGER_HOSTNAME=$EXPO_IP npx expo start --lan --host $EXPO_IP --port $EXPO_PORT --clear $USE_DEV_CLIENT
else
    REACT_NATIVE_PACKAGER_HOSTNAME=$EXPO_IP npx expo start --lan --host $EXPO_IP --port $EXPO_PORT --clear
fi


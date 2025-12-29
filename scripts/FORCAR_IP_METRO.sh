#!/bin/bash

echo "🔧 Forçando Metro bundler a usar IP 10.102.0.103..."
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
rm -rf /tmp/metro-* 2>/dev/null
rm -rf /tmp/haste-* 2>/dev/null

# Liberar porta 8081
if lsof -i :8081 > /dev/null 2>&1; then
    echo "🔓 Liberando porta 8081..."
    lsof -ti :8081 | xargs kill -9 2>/dev/null
    sleep 2
fi

# IP correto
EXPO_IP="10.102.0.103"
EXPO_PORT="8081"

echo ""
echo "📱 Configurando Expo/Metro para usar:"
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

# Configurar TODAS as variáveis de ambiente possíveis
# E passá-las diretamente no comando
export EXPO_NO_DOTENV=1
export EXPO_USE_METRO_WORKSPACE_ROOT=1
export REACT_NATIVE_PACKAGER_HOSTNAME=$EXPO_IP
export EXPO_PACKAGER_HOSTNAME=$EXPO_IP
export REACT_NATIVE_PACKAGER_PORT=$EXPO_PORT
export EXPO_PACKAGER_PORT=$EXPO_PORT
export HOST=$EXPO_IP
export PORT=$EXPO_PORT

echo ""
echo "🚀 Iniciando Expo com todas as variáveis configuradas..."
echo "   REACT_NATIVE_PACKAGER_HOSTNAME=$EXPO_IP"
echo "   EXPO_PACKAGER_HOSTNAME=$EXPO_IP"
echo "   HOST=$EXPO_IP"
echo "   metro.config.js configurado para usar $EXPO_IP"
echo ""

# Executar com TODAS as variáveis passadas diretamente no comando
if [ -n "$USE_DEV_CLIENT" ]; then
    REACT_NATIVE_PACKAGER_HOSTNAME=$EXPO_IP \
    EXPO_PACKAGER_HOSTNAME=$EXPO_IP \
    HOST=$EXPO_IP \
    PORT=$EXPO_PORT \
    npx expo start --lan --host $EXPO_IP --port $EXPO_PORT --clear $USE_DEV_CLIENT
else
    REACT_NATIVE_PACKAGER_HOSTNAME=$EXPO_IP \
    EXPO_PACKAGER_HOSTNAME=$EXPO_IP \
    HOST=$EXPO_IP \
    PORT=$EXPO_PORT \
    npx expo start --lan --host $EXPO_IP --port $EXPO_PORT --clear
fi


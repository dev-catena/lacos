#!/bin/bash

echo "🚀 Iniciando Expo com IP correto (192.168.0.20)..."
echo ""

cd /home/darley/lacos || exit 1

# Parar processos antigos
echo "🛑 Parando processos antigos..."
pkill -f "expo start" 2>/dev/null
pkill -f "metro" 2>/dev/null
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

# IP correto (confirmado pelo usuário)
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

# Configurar variáveis de ambiente para forçar o IP
export EXPO_NO_DOTENV=1
export EXPO_USE_METRO_WORKSPACE_ROOT=1
export REACT_NATIVE_PACKAGER_HOSTNAME=$EXPO_IP

echo ""
echo "🚀 Iniciando Expo..."
echo "   O QR code deve mostrar: exp://$EXPO_IP:$EXPO_PORT"
echo ""

if [ -n "$USE_DEV_CLIENT" ]; then
    npx expo start --lan --host $EXPO_IP --port $EXPO_PORT --clear $USE_DEV_CLIENT
else
    npx expo start --lan --host $EXPO_IP --port $EXPO_PORT --clear
fi


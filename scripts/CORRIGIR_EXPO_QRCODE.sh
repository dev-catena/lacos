#!/bin/bash

echo "🔧 Corrigindo configuração do Expo para gerar QR code correto..."
echo ""

cd /home/darley/lacos || exit 1

# Parar todos os processos Expo/Metro
echo "🛑 Parando processos antigos..."
pkill -f "expo start" 2>/dev/null
pkill -f "metro" 2>/dev/null
pkill -f "node.*expo" 2>/dev/null
sleep 3

# Limpar cache completamente
echo "🧹 Limpando cache..."
rm -rf .expo 2>/dev/null
rm -rf node_modules/.cache 2>/dev/null
rm -rf .metro 2>/dev/null

# Liberar porta 8081
if lsof -i :8081 > /dev/null 2>&1; then
    echo "🔓 Liberando porta 8081..."
    lsof -ti :8081 | xargs kill -9 2>/dev/null
    sleep 2
fi

# Verificar se expo-dev-client está instalado
if npm list expo-dev-client > /dev/null 2>&1; then
    echo "✅ expo-dev-client encontrado"
    USE_DEV_CLIENT="--dev-client"
else
    echo "ℹ️  expo-dev-client não encontrado (usando Expo Go)"
    USE_DEV_CLIENT=""
fi

echo ""
echo "🚀 Iniciando Expo com configurações corretas..."
echo "   - Tunnel mode (para funcionar em qualquer rede)"
echo "   - Porta 8081 (padrão)"
if [ -n "$USE_DEV_CLIENT" ]; then
    echo "   - Dev client mode"
fi
echo ""

# Iniciar Expo com tunnel
# Usar variáveis de ambiente para forçar configuração correta
export EXPO_NO_DOTENV=1
export EXPO_USE_METRO_WORKSPACE_ROOT=1
export EXPO_PUBLIC_PORT=8081

if [ -n "$USE_DEV_CLIENT" ]; then
    npx expo start --tunnel --dev-client --clear --port 8081
else
    npx expo start --tunnel --clear --port 8081
fi


#!/bin/bash

# Script para iniciar Expo corrigindo problema "checking for update" no Android

set -e

cd /home/darley/lacos || exit 1

echo "🔧 Iniciando Expo para Android (corrigindo 'checking for update')"
echo "================================================================"
echo ""

# IP e Porta
EXPO_IP="192.168.0.20"
EXPO_PORT="8081"

# 1. Parar processos antigos
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
echo "✅ Cache limpo"
echo ""

# 4. Configurar .expo/settings.json
echo "4️⃣ Configurando Expo..."
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

# 5. Configurar variáveis de ambiente
export EXPO_IP=$EXPO_IP
export EXPO_PORT=$EXPO_PORT
export REACT_NATIVE_PACKAGER_HOSTNAME=$EXPO_IP
export EXPO_PACKAGER_HOSTNAME=$EXPO_IP
export PACKAGER_HOSTNAME=$EXPO_IP
export HOST=$EXPO_IP
export METRO_HOST=$EXPO_IP
export EXPO_NO_LOCALHOST=1
export EXPO_USE_LOCALHOST=0
export EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
export PORT=$EXPO_PORT
export EXPO_PACKAGER_PORT=$EXPO_PORT
export REACT_NATIVE_PACKAGER_PORT=$EXPO_PORT

echo "📱 Configuração:"
echo "   IP: $EXPO_IP"
echo "   Porta: $EXPO_PORT"
echo "   URL: exp://$EXPO_IP:$EXPO_PORT"
echo ""
echo "🚀 Iniciando Expo..."
echo ""
echo "⚠️  IMPORTANTE:"
echo "   1. Aguarde o QR code aparecer"
echo "   2. No Android, use: exp://$EXPO_IP:$EXPO_PORT"
echo "   3. Se ficar em 'checking for update', pressione 'r' no terminal para recarregar"
echo ""

# Iniciar Expo com --offline para evitar buscar atualizações
npx expo start --lan --port $EXPO_PORT --go --clear --offline




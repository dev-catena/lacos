#!/bin/bash

echo "🔧 Forçando Expo a usar IP 192.168.0.20..."
echo ""

cd /home/darley/lacos || exit 1

# Parar processos antigos
echo "🛑 Parando processos antigos..."
pkill -f "expo start" 2>/dev/null
pkill -f "metro" 2>/dev/null
pkill -f "node.*8081" 2>/dev/null
sleep 3

# Limpar TUDO relacionado ao Expo
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

# Configurar TODAS as variáveis de ambiente possíveis
export EXPO_NO_DOTENV=1
export EXPO_USE_METRO_WORKSPACE_ROOT=1
export REACT_NATIVE_PACKAGER_HOSTNAME=$EXPO_IP
export EXPO_PACKAGER_HOSTNAME=$EXPO_IP
export REACT_NATIVE_PACKAGER_PORT=$EXPO_PORT
export EXPO_PACKAGER_PORT=$EXPO_PORT

# Criar/atualizar .expo/settings.json para forçar o IP
mkdir -p .expo
cat > .expo/settings.json << EOF
{
  "urlRandomness": "ncbFZPw",
  "hostType": "lan",
  "lanType": "ip",
  "dev": true,
  "minify": false,
  "urlRandomness": "ncbFZPw"
}
EOF

echo ""
echo "🚀 Iniciando Expo com configurações forçadas..."
echo "   Variáveis de ambiente configuradas"
echo "   .expo/settings.json atualizado"
echo ""

# Tentar múltiplas abordagens
# Primeiro: usar --lan com --host explicitamente
if [ -n "$USE_DEV_CLIENT" ]; then
    REACT_NATIVE_PACKAGER_HOSTNAME=$EXPO_IP npx expo start --lan --host $EXPO_IP --port $EXPO_PORT --clear $USE_DEV_CLIENT
else
    REACT_NATIVE_PACKAGER_HOSTNAME=$EXPO_IP npx expo start --lan --host $EXPO_IP --port $EXPO_PORT --clear
fi


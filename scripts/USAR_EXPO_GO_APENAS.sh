#!/bin/bash

# Script para forçar uso do Expo Go (não dev-client) e corrigir QR code

set -e

cd /home/darley/lacos || exit 1

echo "🔧 Forçando uso do Expo Go (não dev-client)"
echo "============================================="
echo ""
echo "⚠️  O problema pode ser que está usando expo-dev-client"
echo "   Este script força o uso do Expo Go padrão"
echo ""

# Parar tudo
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
  "lanType": "ip",
  "dev": true
}
EOF

# IP e Porta (usar IP local do usuário)
EXPO_IP="192.168.100.10"
EXPO_PORT="8081"

# Verificar IP atual
CURRENT_IP=$(hostname -I | awk '{print $1}')
echo "📍 IP atual do sistema: $CURRENT_IP"
echo "📍 IP configurado: $EXPO_IP"

# Se IP atual for diferente, perguntar
if [ "$CURRENT_IP" != "$EXPO_IP" ]; then
    echo ""
    read -p "IP atual ($CURRENT_IP) diferente do configurado ($EXPO_IP). Usar atual? (s/n) [s]: " USAR_IP
    USAR_IP=${USAR_IP:-s}
    if [ "$USAR_IP" = "s" ]; then
        EXPO_IP="$CURRENT_IP"
        echo "✅ Usando IP atual: $EXPO_IP"
    else
        echo "✅ Usando IP configurado: $EXPO_IP"
    fi
fi

echo ""
echo "📱 Configuração:"
echo "   IP: $EXPO_IP"
echo "   Porta: $EXPO_PORT"
echo "   Modo: Expo Go (não dev-client)"
echo ""

# Configurar variáveis
export EXPO_NO_DOTENV=1
export REACT_NATIVE_PACKAGER_HOSTNAME=$EXPO_IP
export EXPO_PACKAGER_HOSTNAME=$EXPO_IP
export EXPO_NO_LOCALHOST=1
export EXPO_USE_LOCALHOST=0
# CRÍTICO: Forçar Expo Go
export EXPO_USE_DEV_CLIENT=0

echo "🚀 Iniciando Expo Go em TUNNEL MODE..."
echo "   QR code deve funcionar corretamente agora"
echo ""

# CRÍTICO: Remover expo-dev-client temporariamente do package.json para forçar Expo Go
echo "🔧 Verificando se precisa remover expo-dev-client temporariamente..."
if grep -q '"expo-dev-client"' package.json; then
    echo "⚠️  expo-dev-client encontrado no package.json"
    echo "💡 Vou criar um package.json temporário sem expo-dev-client"
    
    # Criar backup
    cp package.json package.json.backup.expo-go
    
    # Remover expo-dev-client temporariamente
    node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    delete pkg.dependencies['expo-dev-client'];
    delete pkg.devDependencies['expo-dev-client'];
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    "
    echo "✅ expo-dev-client removido temporariamente"
    RESTORE_PACKAGE=true
else
    RESTORE_PACKAGE=false
fi

# Iniciar SEM --dev-client (forçar Expo Go)
echo ""
echo "🚀 Iniciando Expo Go..."
echo ""

EXPO_USE_DEV_CLIENT=0 \
REACT_NATIVE_PACKAGER_HOSTNAME=$EXPO_IP \
EXPO_PACKAGER_HOSTNAME=$EXPO_IP \
EXPO_NO_LOCALHOST=1 \
EXPO_NO_DOTENV=1 \
npx expo start --tunnel --clear --go

# Restaurar package.json se necessário
if [ "$RESTORE_PACKAGE" = "true" ]; then
    echo ""
    echo "🔄 Restaurando package.json original..."
    mv package.json.backup.expo-go package.json
    echo "✅ package.json restaurado"
fi


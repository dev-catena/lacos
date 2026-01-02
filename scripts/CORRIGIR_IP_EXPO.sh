#!/bin/bash

# Script para corrigir o IP do Expo automaticamente

cd /home/darley/lacos || exit 1

echo "🔧 Corrigindo IP do Expo..."
echo ""

# Detectar IP atual da máquina
CURRENT_IP=$(ip addr show | grep -E "inet.*192.168" | head -1 | awk '{print $2}' | cut -d'/' -f1)

if [ -z "$CURRENT_IP" ]; then
    CURRENT_IP=$(hostname -I | awk '{print $1}')
fi

echo "📍 IP detectado: $CURRENT_IP"
echo ""

# IP correto esperado
CORRECT_IP="192.168.1.105"

if [ "$CURRENT_IP" != "$CORRECT_IP" ]; then
    echo "⚠️  IP atual ($CURRENT_IP) diferente do esperado ($CORRECT_IP)"
    read -p "Usar IP atual? (s/n) [s]: " USAR_ATUAL
    USAR_ATUAL=${USAR_ATUAL:-s}
    if [ "$USAR_ATUAL" = "s" ]; then
        CORRECT_IP="$CURRENT_IP"
    fi
fi

echo ""
echo "✅ Usando IP: $CORRECT_IP"
echo ""

# Corrigir arquivos
echo "📝 Corrigindo arquivos..."

# metro.config.js
if [ -f "metro.config.js" ]; then
    sed -i "s/const EXPO_IP = '.*';/const EXPO_IP = '$CORRECT_IP';/g" metro.config.js
    echo "   ✅ metro.config.js"
fi

# start-expo-ip-forcado.js
if [ -f "start-expo-ip-forcado.js" ]; then
    sed -i "s/const FORCED_IP = '.*';/const FORCED_IP = '$CORRECT_IP';/g" start-expo-ip-forcado.js
    echo "   ✅ start-expo-ip-forcado.js"
fi

# scripts/start-expo.js
if [ -f "scripts/start-expo.js" ]; then
    sed -i "s/const EXPO_IP = '.*';/const EXPO_IP = '$CORRECT_IP';/g" scripts/start-expo.js
    echo "   ✅ scripts/start-expo.js"
fi

# scripts/USAR_EXPO_GO_APENAS.sh
if [ -f "scripts/USAR_EXPO_GO_APENAS.sh" ]; then
    sed -i "s/EXPO_IP=\"192.168\.[0-9]\+\.[0-9]\+\"/EXPO_IP=\"$CORRECT_IP\"/g" scripts/USAR_EXPO_GO_APENAS.sh
    echo "   ✅ scripts/USAR_EXPO_GO_APENAS.sh"
fi

# scripts/FORCAR_EXPO_GO_DEFINITIVO.sh
if [ -f "scripts/FORCAR_EXPO_GO_DEFINITIVO.sh" ]; then
    sed -i "s/EXPO_IP=\"192.168\.[0-9]\+\.[0-9]\+\"/EXPO_IP=\"$CORRECT_IP\"/g" scripts/FORCAR_EXPO_GO_DEFINITIVO.sh
    echo "   ✅ scripts/FORCAR_EXPO_GO_DEFINITIVO.sh"
fi

echo ""
echo "✅ IP corrigido em todos os arquivos!"
echo ""
echo "🔄 Agora reinicie o Expo:"
echo "   npm start"
echo "   ou"
echo "   ./scripts/USAR_EXPO_GO_APENAS.sh"



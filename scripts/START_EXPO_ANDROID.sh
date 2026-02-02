#!/bin/bash

# Script para iniciar Expo com IP correto para Android
# Funciona tanto com Expo Go quanto com tunnel

set -e

cd /home/darley/lacos || exit 1

EXPO_IP="10.102.0.103"
EXPO_PORT="8081"

echo "🚀 Iniciando Expo com IP correto para Android..."
echo "   IP: $EXPO_IP"
echo "   Porta: $EXPO_PORT"
echo ""

# Parar processos antigos
echo "🛑 Parando processos antigos..."
pkill -f "expo start" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true
sleep 2

# Limpar cache
echo "🧹 Limpando cache..."
rm -rf .expo 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf .metro 2>/dev/null || true
rm -rf /tmp/metro-* 2>/dev/null || true
rm -rf /tmp/haste-* 2>/dev/null || true

# Configurar .expo/settings.json
mkdir -p .expo
cat > .expo/settings.json << EOF
{
  "hostType": "lan",
  "lanType": "ip",
  "dev": true
}
EOF

echo "✅ Preparação concluída!"
echo ""

# Perguntar se quer usar tunnel
echo "Escolha o modo:"
echo "  1) Tunnel (funciona mesmo em redes diferentes) - Recomendado"
echo "  2) LAN (mesma rede Wi-Fi)"
read -p "Opção [1]: " OPCAO
OPCAO=${OPCAO:-1}

if [ "$OPCAO" = "1" ]; then
    echo ""
    echo "🚇 Iniciando em modo TUNNEL..."
    echo "   O QR code deve mostrar: exp://$EXPO_IP:$EXPO_PORT (ou uma URL do tunnel)"
    echo ""
    
    # Tunnel mode com IP forçado
    REACT_NATIVE_PACKAGER_HOSTNAME=$EXPO_IP \
    EXPO_PACKAGER_HOSTNAME=$EXPO_IP \
    EXPO_NO_LOCALHOST=1 \
    EXPO_USE_LOCALHOST=0 \
    npx expo start --tunnel --clear --go
else
    echo ""
    echo "🌐 Iniciando em modo LAN..."
    echo "   O QR code deve mostrar: exp://$EXPO_IP:$EXPO_PORT"
    echo ""
    
    # LAN mode com IP forçado
    REACT_NATIVE_PACKAGER_HOSTNAME=$EXPO_IP \
    EXPO_PACKAGER_HOSTNAME=$EXPO_IP \
    EXPO_NO_LOCALHOST=1 \
    EXPO_USE_LOCALHOST=0 \
    npx expo start --lan --host $EXPO_IP --port $EXPO_PORT --clear --go
fi



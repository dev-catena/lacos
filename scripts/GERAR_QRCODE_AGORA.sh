#!/bin/bash

# Script para gerar QR code AGORA (enquanto Expo está rodando)

cd /home/darley/lacos || exit 1

EXPO_IP="192.168.0.20"
EXPO_PORT="8081"

# Verificar IP atual
IP_ATUAL=$(hostname -I | awk '{print $1}')
if [ "$IP_ATUAL" != "$EXPO_IP" ]; then
    EXPO_IP="$IP_ATUAL"
fi

echo "📱 Gerando QR code com URL: exp://${EXPO_IP}:${EXPO_PORT}"
echo ""

EXPO_IP="$EXPO_IP" EXPO_PORT="$EXPO_PORT" node gerar-qrcode-forcado.js


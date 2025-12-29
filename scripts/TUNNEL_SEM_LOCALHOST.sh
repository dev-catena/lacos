#!/bin/bash

# Script SIMPLES para Tunnel Mode SEM localhost

set -e

cd /home/darley/lacos || exit 1

echo "🌐 TUNNEL MODE SEM LOCALHOST"
echo "============================="
echo ""

# Parar tudo
pkill -f "expo start" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true
sleep 2

# Limpar cache
rm -rf .expo 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true

echo "🚀 Iniciando Tunnel Mode com bloqueio de localhost..."
echo ""

# Verificar dev-client
if npm list expo-dev-client > /dev/null 2>&1; then
    node start-expo-tunnel-sem-localhost.js --dev-client
else
    node start-expo-tunnel-sem-localhost.js
fi


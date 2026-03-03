#!/bin/bash

# Script para iniciar Expo BLOQUEANDO completamente localhost
# Substitui TODAS as URLs de localhost pelo IP correto

set -e

cd /home/darley/lacos || exit 1

echo "🚫 INICIANDO EXPO SEM LOCALHOST"
echo "================================"
echo ""

# IP e Porta
EXPO_IP="192.168.0.20"
EXPO_PORT="8081"
EXPO_URL="exp://${EXPO_IP}:${EXPO_PORT}"

# Verificar IP atual
IP_ATUAL=$(hostname -I | awk '{print $1}')
if [ "$IP_ATUAL" != "$EXPO_IP" ]; then
    echo "⚠️  IP atual ($IP_ATUAL) diferente do esperado ($EXPO_IP)"
    echo "   Usando IP atual: $IP_ATUAL"
    EXPO_IP="$IP_ATUAL"
    EXPO_URL="exp://${EXPO_IP}:${EXPO_PORT}"
fi

echo "📱 Configuração:"
echo "   IP: $EXPO_IP"
echo "   Porta: $EXPO_PORT"
echo "   URL: $EXPO_URL"
echo ""

# 1. Parar TODOS os processos
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

# 5. Escolher modo
echo "═══════════════════════════════════════════════════════════"
echo "🎯 ESCOLHA O MODO:"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "1. LAN Mode (mais rápido, mesma rede)"
echo "   URL: $EXPO_URL"
echo ""
echo "2. Tunnel Mode (mais confiável, qualquer rede)"
echo "   URL: será gerada automaticamente"
echo ""
read -p "Escolha (1 ou 2) [1]: " MODO
MODO=${MODO:-1}
echo ""

echo "═══════════════════════════════════════════════════════════"
echo "🚀 INICIANDO EXPO (LOCALHOST SERÁ BLOQUEADO)"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📋 IMPORTANTE:"
echo "   - TODAS as URLs de localhost serão substituídas automaticamente"
echo "   - URL CORRETA: $EXPO_URL"
echo "   - Use esta URL no Expo Go se necessário"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""

if [ "$MODO" = "2" ]; then
    node start-expo-forced-ip-no-localhost.js --tunnel
else
    node start-expo-forced-ip-no-localhost.js --lan
fi


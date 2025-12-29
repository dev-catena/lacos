#!/bin/bash

echo "🔧 Corrigindo problema de localhost:8001 no Expo..."
echo ""

cd /home/darley/lacos || exit 1

# 1. Parar processos do Expo/Metro que possam estar rodando
echo "🛑 Parando processos do Expo/Metro..."
pkill -f "expo start" 2>/dev/null
pkill -f "metro" 2>/dev/null
pkill -f "node.*8081" 2>/dev/null
sleep 2
echo "✅ Processos parados"
echo ""

# 2. Limpar cache
echo "🧹 Limpando cache do Expo e Metro..."
rm -rf .expo 2>/dev/null
rm -rf node_modules/.cache 2>/dev/null
npx expo start --clear 2>/dev/null &
sleep 1
pkill -f "expo start" 2>/dev/null
echo "✅ Cache limpo"
echo ""

# 3. Verificar se a porta 8081 está livre
echo "🔍 Verificando porta 8081..."
if lsof -i :8081 > /dev/null 2>&1; then
    echo "⚠️ Porta 8081 está em uso. Tentando liberar..."
    lsof -ti :8081 | xargs kill -9 2>/dev/null
    sleep 1
fi
echo "✅ Porta 8081 disponível"
echo ""

# 4. Obter IP da máquina
MY_IP=$(hostname -I | awk '{print $1}' || ip addr show | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}' | cut -d/ -f1)
echo "📱 Seu IP local: $MY_IP"
echo ""

echo "✅ Preparação concluída!"
echo ""
echo "🚀 Agora inicie o Expo com um dos comandos abaixo:"
echo ""
echo "   Opção 1 (Tunnel - Funciona sempre):"
echo "   npm run start:tunnel"
echo ""
echo "   Opção 2 (LAN - Mesma rede Wi-Fi):"
echo "   npm run start:lan"
echo ""
echo "   Opção 3 (Normal com IP manual):"
echo "   EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0 npx expo start"
echo "   Depois use: exp://$MY_IP:8081 no app"
echo ""

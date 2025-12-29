#!/bin/bash

echo "🚀 Iniciando Expo corretamente..."
echo ""

cd /home/darley/lacos || exit 1

# Parar processos antigos
echo "🛑 Parando processos antigos..."
pkill -f "expo start" 2>/dev/null
pkill -f "metro" 2>/dev/null
sleep 2

# Limpar cache
echo "🧹 Limpando cache..."
rm -rf .expo 2>/dev/null
rm -rf node_modules/.cache 2>/dev/null

# Liberar porta 8081
if lsof -i :8081 > /dev/null 2>&1; then
    echo "🔓 Liberando porta 8081..."
    lsof -ti :8081 | xargs kill -9 2>/dev/null
    sleep 1
fi

echo ""
echo "✅ Preparação concluída!"
echo ""
echo "🚀 Escolha uma opção:"
echo ""
echo "   1. Tunnel Mode (Recomendado - Funciona sempre):"
echo "      npm run start:tunnel"
echo ""
echo "   2. LAN Mode (Mesma rede Wi-Fi):"
echo "      npm run start:lan"
echo ""
echo "   3. Normal:"
echo "      npm start"
echo ""


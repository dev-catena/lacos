#!/bin/bash

echo "🧹 Limpando cache e reiniciando Expo..."

cd /home/darley/lacos || exit 1

# Parar todos os processos
echo "🛑 Parando processos..."
pkill -f "expo start" 2>/dev/null
pkill -f "metro" 2>/dev/null
pkill -f "node.*8081" 2>/dev/null
pkill -f "node.*19000" 2>/dev/null
sleep 2

# Limpar TUDO
echo "🧹 Limpando cache..."
rm -rf .expo 2>/dev/null
rm -rf node_modules/.cache 2>/dev/null
rm -rf .metro 2>/dev/null
rm -rf /tmp/metro-* 2>/dev/null
rm -rf /tmp/haste-* 2>/dev/null
rm -rf /tmp/react-* 2>/dev/null

# Limpar cache do watchman se existir
watchman watch-del-all 2>/dev/null || true

# Liberar porta 8081
if lsof -i :8081 > /dev/null 2>&1; then
    echo "🔓 Liberando porta 8081..."
    lsof -ti :8081 | xargs kill -9 2>/dev/null
    sleep 2
fi

echo ""
echo "✅ Limpeza concluída!"
echo ""
echo "🚀 Para iniciar o Expo, use:"
echo "   npm start"
echo ""
echo "   Ou com tunnel (recomendado para evitar erros de rede):"
echo "   npm run start:tunnel"
echo ""



#!/bin/bash

# Script para testar deep links usando Expo Go (sem precisar de build nativo)

echo "📱 Testando Deep Links com Expo Go"
echo ""
echo "⚠️  IMPORTANTE: Deep links customizados (lacos://) podem não funcionar no Expo Go"
echo "   Mas você pode testar URLs HTTP/HTTPS usando o navegador do dispositivo"
echo ""
echo "🔧 Iniciando Expo em modo tunnel..."
echo ""

cd /home/darley/lacos

# Verificar se já está rodando
if lsof -Pi :8081 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Expo já está rodando na porta 8081"
    echo "   Você pode acessar: http://localhost:8081"
else
    echo "🚀 Iniciando Expo..."
    npx expo start --tunnel --clear
fi

echo ""
echo "💡 Para testar deep links:"
echo "   1. Abra o Expo Go no seu dispositivo Android"
echo "   2. Escaneie o QR code"
echo "   3. Para testar URLs, use o navegador do dispositivo e acesse:"
echo "      http://192.168.1.105/grupo/TESTE123"
echo "   4. O Android deve perguntar qual app abrir (se o app estiver instalado)"



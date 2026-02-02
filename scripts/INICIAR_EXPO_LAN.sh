#!/bin/bash

echo "🚀 Iniciando Expo em modo LAN (mesma rede Wi-Fi)..."
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

# Obter IP local
MY_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || ip route get 1.1.1.1 | awk '{print $7; exit}')

echo ""
echo "📱 Seu IP local: $MY_IP"
echo "   Certifique-se que o celular está na mesma rede Wi-Fi!"
echo ""

# Verificar se expo-dev-client está instalado
if npm list expo-dev-client > /dev/null 2>&1; then
    echo "✅ Usando expo-dev-client"
    npx expo start --lan --dev-client --clear --port 8081
else
    echo "✅ Usando Expo Go"
    npx expo start --lan --clear --port 8081
fi


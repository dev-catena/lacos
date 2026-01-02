#!/bin/bash

# Script para recarregar o app com cache limpo

echo "🔄 Limpando cache e recarregando app..."
echo ""

# Parar processos do Expo/Metro
echo "1️⃣ Parando processos do Expo/Metro..."
pkill -f "expo start" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true
sleep 2
echo "✅ Processos parados"
echo ""

# Limpar cache do Metro
echo "2️⃣ Limpando cache do Metro..."
cd /home/darley/lacos
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf .expo 2>/dev/null || true
echo "✅ Cache limpo"
echo ""

echo "📱 Agora recarregue o app:"
echo "   - No dispositivo: Shake → Reload"
echo "   - No emulador: Ctrl+R (Android) ou Cmd+R (iOS)"
echo ""
echo "💡 Ou reinicie o Expo com:"
echo "   npx expo start --clear"



#!/bin/bash

echo "🧹 ============================================"
echo "🧹 LIMPANDO CACHE DO EXPO/METRO"
echo "🧹 ============================================"
echo ""

cd /home/darley/lacos

echo "1️⃣ Parando processos do Expo/Metro..."
pkill -f "expo start" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true
sleep 2

echo ""
echo "2️⃣ Removendo cache do Expo..."
rm -rf .expo 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf .metro 2>/dev/null || true
rm -rf .expo-shared 2>/dev/null || true

echo ""
echo "3️⃣ Limpando cache do npm..."
npm cache clean --force 2>/dev/null || true

echo ""
echo "4️⃣ Limpando watchman (se instalado)..."
watchman watch-del-all 2>/dev/null || true

echo ""
echo "✅ Cache limpo com sucesso!"
echo ""
echo "📱 Agora reinicie o Expo com:"
echo "   npm start"
echo "   ou"
echo "   npx expo start --clear"
echo ""





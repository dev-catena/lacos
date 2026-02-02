#!/bin/bash

echo "🧹 Limpando TODOS os caches do Expo/React Native..."
echo ""

# Parar processos do Expo/Metro
echo "1️⃣ Parando processos do Expo/Metro..."
pkill -f "expo start" || true
pkill -f "metro" || true
pkill -f "node.*expo" || true
sleep 2

# Limpar cache do Expo
echo "2️⃣ Limpando cache do Expo..."
rm -rf .expo
rm -rf .expo-shared
rm -rf node_modules/.cache
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*
rm -rf $TMPDIR/react-*

# Limpar cache do Metro
echo "3️⃣ Limpando cache do Metro..."
rm -rf /tmp/metro-*
rm -rf /tmp/haste-*
rm -rf /tmp/react-*

# Limpar watchman (se instalado)
echo "4️⃣ Limpando watchman..."
watchman watch-del-all 2>/dev/null || true

# Limpar cache do npm/yarn
echo "5️⃣ Limpando cache do npm..."
npm cache clean --force 2>/dev/null || true

echo ""
echo "✅ Cache limpo completamente!"
echo ""
echo "🚀 Agora execute: npx expo start --clear"
echo ""






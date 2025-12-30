#!/bin/bash

echo "🧹 Limpando cache do Expo/Metro..."
echo ""

cd /home/darley/lacos || exit 1

# Parar processos do Expo
echo "🛑 Parando processos do Expo..."
pkill -f "expo start" || true
pkill -f "metro" || true
sleep 2

# Limpar cache do Metro
echo "🗑️  Limpando cache do Metro..."
rm -rf .expo
rm -rf node_modules/.cache
rm -rf $TMPDIR/metro-* 2>/dev/null || true
rm -rf $TMPDIR/haste-* 2>/dev/null || true

# Limpar cache do npm/yarn
echo "🗑️  Limpando cache do npm..."
npm cache clean --force 2>/dev/null || true

# Limpar watchman (se instalado)
echo "🗑️  Limpando watchman..."
watchman watch-del-all 2>/dev/null || true

echo ""
echo "✅ Cache limpo!"
echo ""
echo "🚀 Reiniciando Expo..."
echo "   Execute: npx expo start --clear"
echo ""






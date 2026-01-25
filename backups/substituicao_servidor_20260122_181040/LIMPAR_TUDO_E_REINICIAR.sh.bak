#!/bin/bash

echo "🧹 Limpando TUDO e reiniciando..."
echo ""

cd /home/darley/lacos || exit 1

# Parar processos
echo "🛑 Parando processos..."
pkill -f "expo start" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true
sleep 2

# Limpar cache
echo "🗑️  Limpando cache..."
rm -rf .expo
rm -rf node_modules/.cache
rm -rf $TMPDIR/metro-* 2>/dev/null || true
rm -rf $TMPDIR/haste-* 2>/dev/null || true

echo ""
echo "✅ Cache limpo!"
echo ""
echo "🚀 Iniciando Expo com cache limpo..."
echo "   Depois, no dispositivo: Agite → Reload"
echo ""

npx expo start --clear






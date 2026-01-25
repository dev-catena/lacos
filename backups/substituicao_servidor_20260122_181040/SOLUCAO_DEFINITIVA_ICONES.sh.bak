#!/bin/bash

echo "🔧 SOLUÇÃO DEFINITIVA PARA ÍCONES NO ANDROID"
echo "=============================================="
echo ""

echo "1️⃣ Parando processos do Expo..."
pkill -f "expo start" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true
sleep 2

echo ""
echo "2️⃣ Limpando todos os caches..."
rm -rf .expo
rm -rf node_modules/.cache
rm -rf $TMPDIR/metro-* 2>/dev/null || true
rm -rf $TMPDIR/haste-* 2>/dev/null || true

echo ""
echo "3️⃣ Verificando instalação do @expo/vector-icons..."
npm list @expo/vector-icons 2>&1 | head -3

echo ""
echo "4️⃣ Reinstalando @expo/vector-icons..."
npm install @expo/vector-icons@^15.0.3 --save

echo ""
echo "5️⃣ Limpando cache do npm..."
npm cache clean --force

echo ""
echo "✅ Limpeza concluída!"
echo ""
echo "📱 PRÓXIMOS PASSOS:"
echo ""
echo "1. No dispositivo Android:"
echo "   - Configurações → Apps → Expo Go"
echo "   - Armazenamento → Limpar dados (não apenas cache!)"
echo "   - Desinstalar e reinstalar o Expo Go da Play Store"
echo ""
echo "2. No computador, execute:"
echo "   npm start -- --clear"
echo ""
echo "3. Escaneie o QR code novamente"
echo ""
echo "⚠️  Se ainda não funcionar, o problema pode ser:"
echo "   - Versão incompatível do Expo Go"
echo "   - Problema com o dispositivo Android"
echo "   - Necessidade de build nativo (npx expo run:android)"

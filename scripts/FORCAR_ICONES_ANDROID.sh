#!/bin/bash

echo "🔧 Forçando carregamento de ícones no Android"
echo "=============================================="
echo ""

echo "1️⃣ Verificando se as fontes estão sendo carregadas..."
grep -n "Ionicons.font" App.js && echo "✅ Fontes encontradas no App.js" || echo "❌ Fontes NÃO encontradas"

echo ""
echo "2️⃣ Verificando versão do @expo/vector-icons..."
npm list @expo/vector-icons 2>&1 | head -3

echo ""
echo "3️⃣ Limpando cache..."
rm -rf .expo
rm -rf node_modules/.cache

echo ""
echo "✅ Pronto! Agora execute:"
echo "   npm start -- --clear"
echo ""
echo "📱 No dispositivo Android:"
echo "   1. Feche completamente o Expo Go"
echo "   2. Abra novamente"
echo "   3. Escaneie o QR code"
echo "   4. Os ícones devem aparecer agora"

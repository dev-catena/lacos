#!/bin/bash

echo "🧹 Limpando cache para corrigir ícones em chinês no Android..."

cd /home/darley/lacos

# Parar processos do Expo/Metro
echo "📱 Parando processos do Metro/Expo..."
pkill -f "expo start" || true
pkill -f "metro" || true
sleep 2

# Limpar cache do Metro
echo "🗑️  Limpando cache do Metro..."
rm -rf .expo
rm -rf node_modules/.cache
rm -rf /tmp/metro-*
rm -rf /tmp/haste-*

# Limpar cache do npm
echo "📦 Limpando cache do npm..."
npm cache clean --force

# Limpar watchman (se instalado)
if command -v watchman &> /dev/null; then
    echo "👀 Limpando cache do Watchman..."
    watchman watch-del-all || true
fi

# Limpar cache do Android (se tiver build nativo)
if [ -d "android" ]; then
    echo "🤖 Limpando cache do Android..."
    cd android
    ./gradlew clean || true
    cd ..
fi

# Limpar node_modules e reinstalar (opcional, mas recomendado)
echo "📚 Reinstalando dependências..."
rm -rf node_modules
npm install

echo ""
echo "✅ Cache limpo!"
echo ""
echo "📱 Agora execute:"
echo "   npx expo start --clear"
echo ""
echo "💡 No Android, faça:"
echo "   1. Feche completamente o app Expo Go"
echo "   2. Limpe o cache do Expo Go (Configurações > Apps > Expo Go > Limpar cache)"
echo "   3. Abra o Expo Go novamente"
echo "   4. Escaneie o QR code novamente"


#!/bin/bash

echo "🔧 Corrigindo ícones aparecendo como símbolos em chinês no Android..."
echo ""

cd /home/darley/lacos

# 1. Parar todos os processos do Metro/Expo
echo "📱 Parando processos do Metro/Expo..."
pkill -f "expo start" || true
pkill -f "metro" || true
pkill -f "node.*expo" || true
sleep 2

# 2. Limpar todos os caches
echo "🗑️  Limpando caches..."
rm -rf .expo
rm -rf node_modules/.cache
rm -rf /tmp/metro-*
rm -rf /tmp/haste-*
rm -rf /tmp/react-*

# 3. Limpar cache do watchman (se instalado)
if command -v watchman &> /dev/null; then
    echo "👀 Limpando cache do Watchman..."
    watchman watch-del-all 2>/dev/null || true
fi

# 4. Limpar cache do npm
echo "📦 Limpando cache do npm..."
npm cache clean --force

# 5. Limpar cache do Android (se tiver build nativo)
if [ -d "android" ]; then
    echo "🤖 Limpando cache do Android..."
    cd android
    ./gradlew clean 2>/dev/null || true
    rm -rf .gradle
    rm -rf app/build
    cd ..
fi

# 6. Verificar se @expo/vector-icons está instalado
echo "🔍 Verificando dependências..."
if ! grep -q "@expo/vector-icons" package.json; then
    echo "⚠️  @expo/vector-icons não encontrado no package.json"
    echo "📦 Instalando @expo/vector-icons..."
    npm install @expo/vector-icons
fi

# 7. Reinstalar node_modules (opcional, mas recomendado)
read -p "Deseja reinstalar node_modules? (s/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo "📚 Reinstalando dependências..."
    rm -rf node_modules
    npm install
fi

echo ""
echo "✅ Limpeza concluída!"
echo ""
echo "📱 PRÓXIMOS PASSOS:"
echo ""
echo "1. No Android:"
echo "   - Feche completamente o app Expo Go"
echo "   - Vá em Configurações > Apps > Expo Go > Armazenamento > Limpar cache"
echo "   - Abra o Expo Go novamente"
echo ""
echo "2. No terminal, execute:"
echo "   npx expo start --clear"
echo ""
echo "3. Escaneie o QR code novamente"
echo ""
echo "💡 Se o problema persistir:"
echo "   - Desinstale e reinstale o Expo Go"
echo "   - Certifique-se de estar usando Expo Go SDK 54"
echo "   - Verifique se o dispositivo está na mesma rede"





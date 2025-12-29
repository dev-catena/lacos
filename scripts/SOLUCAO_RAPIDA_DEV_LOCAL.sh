#!/bin/bash

# Solução RÁPIDA: Desenvolvimento local sem depender de rede

set -e

cd /home/darley/lacos || exit 1

echo "⚡ SOLUÇÃO RÁPIDA: DESENVOLVIMENTO LOCAL"
echo "========================================="
echo ""
echo "Esta solução usa emulador/simulador LOCAL"
echo "Não precisa de rede, Expo Go, ou conexão remota"
echo ""

# Verificar se tem Android Studio / Xcode
echo "1️⃣ Verificando ambiente..."
HAS_ANDROID=false
HAS_IOS=false

if command -v adb &> /dev/null; then
    HAS_ANDROID=true
    echo "✅ Android SDK encontrado"
fi

if command -v xcodebuild &> /dev/null; then
    HAS_IOS=true
    echo "✅ Xcode encontrado"
fi

if [ "$HAS_ANDROID" = "false" ] && [ "$HAS_IOS" = "false" ]; then
    echo "❌ Nenhum ambiente de desenvolvimento encontrado"
    echo ""
    echo "💡 Instale:"
    echo "   - Android Studio (para Android)"
    echo "   - Xcode (para iOS - apenas macOS)"
    exit 1
fi
echo ""

# Escolher plataforma
echo "2️⃣ Escolher plataforma:"
if [ "$HAS_ANDROID" = "true" ]; then
    echo "   1. Android (emulador local)"
fi
if [ "$HAS_IOS" = "true" ]; then
    echo "   2. iOS (simulador local)"
fi
read -p "Escolha [1]: " ESCOLHA
ESCOLHA=${ESCOLHA:-1}
echo ""

# Parar processos antigos
echo "3️⃣ Parando processos antigos..."
pkill -f "expo start" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true
sleep 2
echo "✅ Parado"
echo ""

# Limpar cache
echo "4️⃣ Limpando cache..."
rm -rf .expo 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true
echo "✅ Limpo"
echo ""

# Rodar
echo "5️⃣ Iniciando desenvolvimento local..."
echo ""

if [ "$ESCOLHA" = "1" ] && [ "$HAS_ANDROID" = "true" ]; then
    echo "🚀 Iniciando Android (emulador local)..."
    echo ""
    echo "📋 O que vai acontecer:"
    echo "   1. Metro bundler vai iniciar (localhost:8081)"
    echo "   2. Emulador Android vai abrir"
    echo "   3. App vai ser instalado e rodar"
    echo "   4. Tudo LOCAL, sem rede!"
    echo ""
    
    # Verificar se tem expo-dev-client
    if npm list expo-dev-client > /dev/null 2>&1; then
        npx expo run:android
    else
        # Tentar React Native CLI
        if command -v react-native &> /dev/null; then
            npx react-native run-android
        else
            echo "⚠️  Instalando expo-dev-client para build local..."
            npx expo install expo-dev-client
            npx expo run:android
        fi
    fi
elif [ "$ESCOLHA" = "2" ] && [ "$HAS_IOS" = "true" ]; then
    echo "🚀 Iniciando iOS (simulador local)..."
    echo ""
    echo "📋 O que vai acontecer:"
    echo "   1. Metro bundler vai iniciar (localhost:8081)"
    echo "   2. Simulador iOS vai abrir"
    echo "   3. App vai ser instalado e rodar"
    echo "   4. Tudo LOCAL, sem rede!"
    echo ""
    
    if npm list expo-dev-client > /dev/null 2>&1; then
        npx expo run:ios
    else
        if command -v react-native &> /dev/null; then
            npx react-native run-ios
        else
            echo "⚠️  Instalando expo-dev-client para build local..."
            npx expo install expo-dev-client
            npx expo run:ios
        fi
    fi
fi

echo ""
echo "✅ Desenvolvimento local iniciado!"
echo ""
echo "💡 Vantagens:"
echo "   - Tudo local (sem rede)"
echo "   - Sem problemas de conexão"
echo "   - Hot reload funciona"
echo "   - Debug fácil"
echo ""


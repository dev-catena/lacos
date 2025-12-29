#!/bin/bash

# Script para criar Expo Dev Client (app customizado, não precisa Expo Go)

set -e

cd /home/darley/lacos || exit 1

echo "📱 CRIANDO EXPO DEV CLIENT"
echo "=========================="
echo ""
echo "Este script vai:"
echo "  1. Instalar expo-dev-client"
echo "  2. Gerar build de desenvolvimento"
echo "  3. Instalar no dispositivo"
echo "  4. Configurar desenvolvimento local"
echo ""

# 1. Verificar se já tem expo-dev-client
echo "1️⃣ Verificando expo-dev-client..."
if npm list expo-dev-client > /dev/null 2>&1; then
    echo "✅ expo-dev-client já instalado"
else
    echo "   Instalando expo-dev-client..."
    npx expo install expo-dev-client
    echo "✅ Instalado"
fi
echo ""

# 2. Escolher plataforma
echo "2️⃣ Escolher plataforma:"
echo "   1. Android"
echo "   2. iOS"
echo "   3. Ambos"
read -p "Escolha (1, 2 ou 3) [1]: " PLATAFORMA
PLATAFORMA=${PLATAFORMA:-1}
echo ""

# 3. Gerar build
echo "3️⃣ Gerando build de desenvolvimento..."
case $PLATAFORMA in
    1)
        echo "   Gerando build Android..."
        npx expo run:android
        ;;
    2)
        echo "   Gerando build iOS..."
        npx expo run:ios
        ;;
    3)
        echo "   Gerando builds Android e iOS..."
        npx expo run:android &
        ANDROID_PID=$!
        npx expo run:ios &
        IOS_PID=$!
        wait $ANDROID_PID
        wait $IOS_PID
        ;;
esac
echo "✅ Build gerado"
echo ""

# 4. Instruções
echo "═══════════════════════════════════════════════════════════"
echo "✅ DEV CLIENT CRIADO!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo ""
echo "1. O app foi instalado no dispositivo/emulador"
echo ""
echo "2. Iniciar servidor de desenvolvimento:"
echo "   npx expo start --dev-client"
echo ""
echo "3. No app customizado (não Expo Go):"
echo "   - O app vai conectar automaticamente"
echo   "   - Ou escaneie o QR code"
echo ""
echo "✅ Vantagens:"
echo "   - Não precisa Expo Go"
echo "   - App customizado instalado"
echo "   - Funciona offline após build"
echo "   - Pode usar módulos nativos"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""


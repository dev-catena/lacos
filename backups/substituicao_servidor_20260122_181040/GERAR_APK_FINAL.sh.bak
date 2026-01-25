#!/bin/bash

# Script para gerar APK final (produção) após desenvolvimento web

set -e

cd /home/darley/lacos || exit 1

echo "📱 GERANDO APK FINAL"
echo "===================="
echo ""
echo "Este script gera APK de produção usando EAS Build"
echo "Não precisa Android SDK local!"
echo ""

# Verificar se EAS CLI está instalado
echo "1️⃣ Verificando EAS CLI..."
if command -v eas &> /dev/null; then
    echo "✅ EAS CLI instalado"
else
    echo "   Instalando EAS CLI..."
    npm install -g eas-cli
    echo "✅ Instalado"
fi
echo ""

# Verificar se está logado
echo "2️⃣ Verificando login..."
if eas whoami &> /dev/null; then
    echo "✅ Logado no EAS"
else
    echo "⚠️  Não está logado"
    echo "   Fazendo login..."
    eas login
fi
echo ""

# Verificar configuração
echo "3️⃣ Verificando configuração..."
if [ -f "eas.json" ]; then
    echo "✅ eas.json encontrado"
else
    echo "   Criando configuração..."
    eas build:configure
fi
echo ""

# Escolher tipo de build
echo "4️⃣ Escolher tipo de build:"
echo "   1. Development (para testes)"
echo "   2. Production (para distribuição)"
read -p "Escolha (1 ou 2) [2]: " TIPO
TIPO=${TIPO:-2}

if [ "$TIPO" = "1" ]; then
    PROFILE="development"
    echo "✅ Build de desenvolvimento"
else
    PROFILE="production"
    echo "✅ Build de produção"
fi
echo ""

# Escolher plataforma
echo "5️⃣ Escolher plataforma:"
echo "   1. Android (APK)"
echo "   2. iOS (IPA)"
echo "   3. Ambos"
read -p "Escolha (1, 2 ou 3) [1]: " PLATAFORMA
PLATAFORMA=${PLATAFORMA:-1}

case $PLATAFORMA in
    1)
        PLATFORM="android"
        ;;
    2)
        PLATFORM="ios"
        ;;
    3)
        PLATFORM="all"
        ;;
esac
echo ""

echo "═══════════════════════════════════════════════════════════"
echo "🚀 INICIANDO BUILD"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📋 Configuração:"
echo "   Perfil: $PROFILE"
echo "   Plataforma: $PLATFORM"
echo ""
echo "⏱️  Isso pode levar 10-20 minutos"
echo "   (Build acontece na nuvem)"
echo ""
echo "📱 Após o build:"
echo "   - Você receberá um link para download"
echo "   - Ou QR code para instalar"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""

# Gerar build
eas build --profile "$PROFILE" --platform "$PLATFORM"

echo ""
echo "✅ Build iniciado!"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo ""
echo "1. Aguarde o build terminar (10-20 min)"
echo "2. Você receberá um link/QR code"
echo "3. Baixe e instale o APK no dispositivo"
echo ""
echo "💡 Para ver status:"
echo "   eas build:list"
echo ""


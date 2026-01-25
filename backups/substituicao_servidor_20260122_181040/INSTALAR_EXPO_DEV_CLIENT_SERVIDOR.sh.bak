#!/bin/bash

echo "🔧 Instalando expo-dev-client no servidor..."
echo ""

# Ir para o diretório correto (frontend)
cd /home/darley/lacos || {
    echo "❌ Erro: Diretório /home/darley/lacos não encontrado"
    exit 1
}

echo "📂 Diretório atual: $(pwd)"
echo ""

# Verificar se package.json existe
if [ ! -f "package.json" ]; then
    echo "❌ Erro: package.json não encontrado"
    exit 1
fi

# Verificar se expo está instalado
if ! npm list expo > /dev/null 2>&1; then
    echo "📦 Expo não encontrado. Instalando expo primeiro..."
    npm install expo@~54.0.0
    echo "✅ Expo instalado"
    echo ""
fi

# Instalar expo-dev-client
echo "📦 Instalando expo-dev-client..."
npx expo install expo-dev-client

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

echo ""
echo "✅ Instalação concluída!"
echo ""
echo "📋 Verificando instalação..."
npm list expo-dev-client 2>/dev/null | head -3 || echo "⚠️ Verifique manualmente"

echo ""
echo "📝 Próximos passos:"
echo "   1. Para gerar build Android: npx expo run:android"
echo "   2. Para iniciar servidor: npx expo start --dev-client"
echo ""


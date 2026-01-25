#!/bin/bash

echo "🔧 Instalando e configurando expo-dev-client..."
echo ""

cd /home/darley/lacos || exit 1

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: package.json não encontrado. Execute este script na raiz do projeto."
    exit 1
fi

# Instalar expo-dev-client
echo "📦 Instalando expo-dev-client..."
npx expo install expo-dev-client

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Verificar se app.json existe
if [ ! -f "app.json" ]; then
    echo "⚠️ app.json não encontrado. Criando..."
    cat > app.json << 'EOF'
{
  "expo": {
    "name": "Laços",
    "slug": "lacos",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "plugins": [
      "expo-dev-client"
    ],
    "android": {
      "package": "com.lacos.app"
    },
    "ios": {
      "bundleIdentifier": "com.lacos.app"
    }
  }
}
EOF
    echo "✅ app.json criado"
else
    echo "✅ app.json encontrado"
fi

# Criar eas.json se não existir
if [ ! -f "eas.json" ]; then
    echo "📝 Criando eas.json..."
    cat > eas.json << 'EOF'
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  }
}
EOF
    echo "✅ eas.json criado"
else
    echo "✅ eas.json já existe"
fi

echo ""
echo "✅ Configuração concluída!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Para Android: npx expo run:android"
echo "   2. Para iniciar servidor: npx expo start --dev-client"
echo "   3. Conectar dispositivo e testar"
echo ""


#!/bin/bash

echo "📹 Instalando Agora.io para Telemedicina..."
echo ""

cd /home/darley/lacos || exit 1

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: package.json não encontrado. Execute este script na raiz do projeto."
    exit 1
fi

# Verificar se expo-dev-client está instalado
if ! npm list expo-dev-client > /dev/null 2>&1; then
    echo "⚠️ expo-dev-client não encontrado. Instalando..."
    npx expo install expo-dev-client
fi

# Instalar react-native-agora
echo "📦 Instalando react-native-agora..."
npm install react-native-agora

# Verificar instalação
if npm list react-native-agora > /dev/null 2>&1; then
    echo "✅ react-native-agora instalado com sucesso!"
else
    echo "❌ Erro ao instalar react-native-agora"
    exit 1
fi

# Verificar app.json
echo ""
echo "🔍 Verificando app.json..."

if grep -q "expo-dev-client" app.json; then
    echo "✅ expo-dev-client configurado no app.json"
else
    echo "⚠️ expo-dev-client não encontrado no app.json"
    echo "   Adicione 'expo-dev-client' ao array 'plugins'"
fi

if grep -q "CAMERA" app.json; then
    echo "✅ Permissão de câmera configurada"
else
    echo "⚠️ Permissão de câmera não encontrada"
    echo "   Adicione 'CAMERA' ao array 'permissions' (Android)"
fi

echo ""
echo "✅ Instalação concluída!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Criar conta no Agora.io: https://www.agora.io/"
echo "   2. Obter App ID do projeto"
echo "   3. Atualizar src/services/videoCallService.js com o App ID"
echo "   4. Gerar build: eas build --profile development --platform android"
echo "   5. Instalar APK no dispositivo"
echo "   6. Iniciar servidor: npx expo start --dev-client"
echo ""
echo "📚 Veja o guia completo em: GUIA_TELEMEDICINA_AGORA.md"
echo ""


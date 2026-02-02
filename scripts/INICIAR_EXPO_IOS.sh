#!/bin/bash

echo "🚀 Iniciando Expo para iOS (com tunnel)..."
echo ""

cd /home/darley/lacos || exit 1

# Iniciar Expo com tunnel (funciona em qualquer rede)
echo "📱 Iniciando Expo com tunnel mode..."
echo "   Isso permite conectar iOS mesmo em redes diferentes"
echo ""

npx expo start --tunnel


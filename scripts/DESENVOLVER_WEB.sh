#!/bin/bash

# Desenvolvimento Web (sem precisar Android SDK)

set -e

cd /home/darley/lacos || exit 1

echo "🌐 DESENVOLVIMENTO WEB (SEM ANDROID SDK)"
echo "========================================="
echo ""
echo "✅ Esta solução desenvolve no navegador"
echo "✅ Não precisa Android SDK ou iOS"
echo "✅ Hot reload rápido"
echo "✅ Debug fácil"
echo ""

# Verificar se tem Expo (já deve ter)
echo "1️⃣ Verificando Expo..."
if npm list expo > /dev/null 2>&1; then
    echo "✅ Expo encontrado - usando Expo Web (mais fácil!)"
    USE_EXPO_WEB=true
else
    echo "⚠️  Expo não encontrado"
    echo "   Tentando instalar react-native-web com --legacy-peer-deps..."
    npm install react-native-web --legacy-peer-deps || {
        echo "❌ Erro ao instalar. Use Expo Web:"
        echo "   npm install expo"
        exit 1
    }
    USE_EXPO_WEB=false
fi
echo ""

echo "═══════════════════════════════════════════════════════════"
echo "🚀 INICIANDO DESENVOLVIMENTO WEB"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📋 O que vai acontecer:"
echo "   1. Servidor web vai iniciar"
echo "   2. Navegador vai abrir automaticamente"
echo "   3. Você desenvolve no navegador"
echo "   4. Hot reload funciona"
echo ""
echo "💡 Vantagens:"
echo "   - Desenvolvimento rápido"
echo "   - Debug fácil (DevTools)"
echo "   - Não precisa Android/iOS"
echo "   - Testa no navegador primeiro"
echo ""
echo "⚠️  Limitações:"
echo "   - Alguns recursos nativos não funcionam"
echo "   - Depois precisa testar no mobile"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""

# Parar processos antigos
pkill -f "expo start" 2>/dev/null || true
pkill -f "webpack" 2>/dev/null || true
sleep 2

# Iniciar
if [ "$USE_EXPO_WEB" = "true" ]; then
    echo "🚀 Iniciando Expo Web..."
    npx expo start --web
else
    echo "⚠️  Expo não encontrado"
    echo ""
    echo "💡 Instale Expo:"
    echo "   npm install expo"
    echo ""
    echo "Ou use React Native Web manualmente com webpack/vite"
    exit 1
fi


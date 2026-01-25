#!/bin/bash

# Solução SIMPLES: Usar Expo Web (já deve estar instalado)

set -e

cd /home/darley/lacos || exit 1

echo "🌐 DESENVOLVIMENTO WEB COM EXPO"
echo "================================"
echo ""
echo "✅ Usando Expo Web (já instalado)"
echo "✅ Não precisa instalar nada novo"
echo "✅ Funciona agora mesmo"
echo ""

# Parar processos antigos
echo "1️⃣ Parando processos antigos..."
pkill -f "expo start" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true
sleep 2
echo "✅ Parado"
echo ""

# Limpar cache
echo "2️⃣ Limpando cache..."
rm -rf .expo 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true
echo "✅ Limpo"
echo ""

echo "═══════════════════════════════════════════════════════════"
echo "🚀 INICIANDO EXPO WEB"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📋 O que vai acontecer:"
echo "   1. Expo vai iniciar servidor web"
echo "   2. Navegador vai abrir automaticamente"
echo "   3. Você desenvolve no navegador"
echo "   4. Hot reload funciona"
echo ""
echo "💡 Vantagens:"
echo "   - Desenvolvimento rápido"
echo "   - Debug fácil (DevTools do navegador)"
echo "   - Não precisa Android SDK"
echo "   - Não precisa iOS"
echo "   - Funciona agora mesmo!"
echo ""
echo "⚠️  Limitações:"
echo "   - Alguns recursos nativos não funcionam no web"
echo "   - Depois precisa testar no mobile"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""

# Iniciar Expo Web
echo "🚀 Iniciando..."
npx expo start --web


#!/bin/bash

# Script simples para iniciar desenvolvimento web

set -e

cd /home/darley/lacos || exit 1

echo "🌐 INICIANDO DESENVOLVIMENTO WEB"
echo "================================"
echo ""
echo "✅ Dependências instaladas"
echo "✅ Pronto para desenvolver"
echo ""

# Parar processos antigos (se houver)
pkill -f "expo start" 2>/dev/null || true
sleep 1

echo "🚀 Iniciando servidor web..."
echo ""
echo "📋 O que vai acontecer:"
echo "   1. Servidor web inicia"
echo "   2. Navegador abre automaticamente"
echo "   3. Você desenvolve no navegador"
echo "   4. Hot reload funciona"
echo ""
echo "💡 Para parar: Pressione Ctrl+C"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""

# Iniciar
npm run web


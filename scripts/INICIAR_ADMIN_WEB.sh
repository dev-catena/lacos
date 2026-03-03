#!/bin/bash

# Script para iniciar a INTERFACE ADMIN no web
# Restaura a pasta web/ e inicia o servidor Vite

set -e

cd /home/darley/lacos || exit 1

EXPO_IP="192.168.0.20"
EXPO_PORT="8081"

echo "🌐 INICIANDO INTERFACE ADMIN NO WEB"
echo "===================================="
echo ""
echo "⚠️  IMPORTANTE: Este script inicia a INTERFACE ADMIN (não o app mobile)"
echo ""

# Verificar se pasta web-admin existe e restaurar
if [ -d "web-admin" ] && [ ! -d "web" ]; then
    echo "1️⃣ Restaurando pasta 'web-admin/' para 'web/'..."
    mv web-admin web
    echo "   ✅ Pasta restaurada (web-admin -> web)"
    echo ""
elif [ ! -d "web" ]; then
    echo "❌ Pasta 'web/' não encontrada!"
    echo "   Execute: ./INICIAR_APP_MOBILE_WEB.sh primeiro"
    exit 1
fi

# Parar processos antigos
echo "2️⃣ Parando processos antigos..."
pkill -f "expo start" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
sleep 2
echo "✅ Parado"
echo ""

# Configurar variáveis de ambiente
export EXPO_IP="$EXPO_IP"
export EXPO_PORT="$EXPO_PORT"
export HOST="0.0.0.0"
export PORT="$EXPO_PORT"

echo "═══════════════════════════════════════════════════════════"
echo "🚀 INICIANDO INTERFACE ADMIN"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📋 IMPORTANTE:"
echo "   ✅ INTERFACE ADMIN será acessível em: http://${EXPO_IP}:${EXPO_PORT}"
echo "   ✅ Escutando em 0.0.0.0 (todas as interfaces)"
echo "   ✅ Outros dispositivos na mesma rede podem acessar"
echo ""
echo "📱 Para acessar de outro dispositivo:"
echo "   1. Certifique-se que está na mesma rede Wi-Fi"
echo "   2. Abra navegador no dispositivo"
echo "   3. Acesse: http://${EXPO_IP}:${EXPO_PORT}"
echo ""
echo "💡 Para voltar a usar app mobile:"
echo "   - Pare este script (Ctrl+C)"
echo "   - Execute: mv web web-admin"
echo "   - Execute: ./INICIAR_APP_MOBILE_WEB.sh"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""

# Ir para pasta web e iniciar Vite
cd web

# Verificar se package.json tem script dev
if grep -q '"dev"' package.json; then
    echo "🚀 Iniciando Vite com script 'dev'..."
    npm run dev -- --host 0.0.0.0 --port "$EXPO_PORT"
else
    echo "🚀 Iniciando Vite diretamente..."
    npx vite --host 0.0.0.0 --port "$EXPO_PORT"
fi







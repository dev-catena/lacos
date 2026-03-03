#!/bin/bash

# Script para iniciar o APP MOBILE Laços no web (não a interface admin)
# Renomeia temporariamente a pasta web/ para que o Expo use o App.js

set -e

cd /home/darley/lacos || exit 1

EXPO_IP="192.168.0.20"
EXPO_PORT="8081"

echo "📱 INICIANDO APP MOBILE NO WEB"
echo "==============================="
echo ""
echo "⚠️  IMPORTANTE: Este script inicia o APP MOBILE (não a interface admin)"
echo ""

# Verificar se pasta web existe e renomear temporariamente
if [ -d "web" ]; then
    echo "1️⃣ Renomeando pasta 'web/' para 'web-admin/' temporariamente..."
    mv web web-admin 2>/dev/null || {
        if [ -d "web-admin" ]; then
            echo "   ⚠️  Pasta web-admin já existe, removendo..."
            rm -rf web-admin
            mv web web-admin
        fi
    }
    echo "   ✅ Pasta renomeada (web -> web-admin)"
    echo "   💡 Para acessar admin depois: mv web-admin web"
    echo ""
fi

# Parar processos antigos
echo "2️⃣ Parando processos antigos..."
pkill -f "expo start" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true
sleep 2
echo "✅ Parado"
echo ""

# Configurar variáveis de ambiente
export HOST="0.0.0.0"
export PORT="$EXPO_PORT"
export EXPO_IP="$EXPO_IP"
export EXPO_PORT="$EXPO_PORT"
export EXPO_DEVTOOLS_LISTEN_ADDRESS="0.0.0.0"
export REACT_NATIVE_PACKAGER_HOSTNAME="$EXPO_IP"
export EXPO_PACKAGER_HOSTNAME="$EXPO_IP"
export WEB_HOST="0.0.0.0"
export WDS_SOCKET_HOST="$EXPO_IP"
export WDS_SOCKET_PORT="$EXPO_PORT"
export HOSTNAME="0.0.0.0"

echo "═══════════════════════════════════════════════════════════"
echo "🚀 INICIANDO APP MOBILE NO WEB"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📋 IMPORTANTE:"
echo "   ✅ APP MOBILE será acessível em: http://${EXPO_IP}:${EXPO_PORT}"
echo "   ✅ Escutando em 0.0.0.0 (todas as interfaces)"
echo "   ✅ Outros dispositivos na mesma rede podem acessar"
echo ""
echo "📱 Para acessar de outro dispositivo:"
echo "   1. Certifique-se que está na mesma rede Wi-Fi"
echo "   2. Abra navegador no dispositivo"
echo "   3. Acesse: http://${EXPO_IP}:${EXPO_PORT}"
echo ""
echo "💡 Para voltar a usar interface admin:"
echo "   - Pare este script (Ctrl+C)"
echo "   - Execute: mv web-admin web"
echo "   - Execute: ./INICIAR_WEB_IP.sh (ou cd web && npm run dev)"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""

# Função para restaurar pasta web ao sair
cleanup() {
    echo ""
    echo "🔄 Restaurando pasta web-admin para web..."
    if [ -d "web-admin" ] && [ ! -d "web" ]; then
        mv web-admin web
        echo "✅ Pasta restaurada"
    fi
    exit 0
}

trap cleanup SIGINT SIGTERM

# Iniciar Expo Web (agora vai usar App.js porque web/ não existe)
echo "🚀 Iniciando Expo Web com App.js (app mobile)..."
node start-web-forcado-ip.js







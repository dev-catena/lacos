#!/bin/bash

# Script para verificar erro 500 no login
# Servidor: 192.168.0.20 (porta 63022)

set -e

SERVER="192.168.0.20"
PORT="63022"
USER="darley"
PASSWORD="yhvh77"
REMOTE_PATH="/var/www/lacos-backend"

echo "🔍 Verificando erro 500 no login..."
echo "   Servidor: $USER@$SERVER:$PORT"
echo ""

# Verificar se sshpass está instalado
if ! command -v sshpass &> /dev/null; then
    echo "❌ sshpass não está instalado!"
    echo "   Instale com: sudo apt-get install sshpass"
    exit 1
fi

# Verificar logs do Laravel
echo "📋 Verificando logs do Laravel..."
echo ""
sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no \
    "$USER@$SERVER" "cd $REMOTE_PATH && tail -50 storage/logs/laravel.log | grep -A 10 -B 5 'login\|2FA\|WhatsAppService\|AuthController' || tail -30 storage/logs/laravel.log"

echo ""
echo ""
echo "🔍 Verificando se AuthController existe..."
sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no \
    "$USER@$SERVER" "ls -la $REMOTE_PATH/app/Http/Controllers/Api/AuthController.php 2>&1 || echo '❌ AuthController não encontrado'"

echo ""
echo ""
echo "🔍 Verificando se WhatsAppService existe..."
sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no \
    "$USER@$SERVER" "ls -la $REMOTE_PATH/app/Services/WhatsAppService.php 2>&1 || echo '❌ WhatsAppService não encontrado'"

echo ""
echo ""
echo "🔍 Verificando rotas de 2FA..."
sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no \
    "$USER@$SERVER" "grep -n '2fa/enable\|2fa/disable' $REMOTE_PATH/routes/api.php || echo '❌ Rotas de 2FA não encontradas'"

echo ""
echo ""
echo "✅ Verificação concluída!"
echo ""
echo "💡 Se o AuthController não existir, você precisa aplicar o script completo:"
echo "   ./scripts/APLICAR_2FA_WHATSAPP_ONLY_SERVIDOR.sh"


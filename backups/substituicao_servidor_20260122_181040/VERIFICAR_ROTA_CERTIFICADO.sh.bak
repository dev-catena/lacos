#!/bin/bash

# Script para verificar se a rota de certificado está registrada

SSH_USER="darley"
SSH_HOST="193.203.182.22"
SSH_PORT="63022"
SSH_PASS="yhvh77"
BACKEND_PATH="/var/www/lacos-backend"

echo "🔍 Verificando se a rota de certificado está registrada..."

sshpass -p "$SSH_PASS" ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $BACKEND_PATH && php artisan route:list | grep -i certificate || echo '❌ Rota de certificado NÃO encontrada'"















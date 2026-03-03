#!/bin/bash

# Script para ver o conteúdo real da rota /user no servidor

SSH_USER="darley"
SSH_HOST="192.168.0.20"
SSH_PORT="63022"
SSH_PASS="yhvh77"
BACKEND_PATH="/var/www/lacos-backend"

echo "🔍 Verificando o conteúdo da rota /user no servidor..."

sshpass -p "$SSH_PASS" ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $BACKEND_PATH && grep -A 15 \"Route::get('/user'\" routes/api.php"















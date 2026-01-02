#!/bin/bash

# Script para verificar se o endpoint /user retorna os campos do certificado

SSH_USER="darley"
SSH_HOST="193.203.182.22"
SSH_PORT="63022"
SSH_PASS="yhvh77"
BACKEND_PATH="/var/www/lacos-backend"

echo "🔍 Verificando se o endpoint /user retorna campos do certificado..."

sshpass -p "$SSH_PASS" ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $BACKEND_PATH && grep -A 10 \"Route::get('/user'\" routes/api.php | grep -E 'makeVisible|certificate' || echo '❌ makeVisible não encontrado na rota /user'"










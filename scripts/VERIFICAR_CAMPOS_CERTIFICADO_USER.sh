#!/bin/bash

# Script para verificar se os campos do certificado estão sendo retornados no endpoint /user

SSH_USER="darley"
SSH_HOST="193.203.182.22"
SSH_PORT="63022"
BACKEND_PATH="/var/www/lacos-backend"

echo "🔍 Verificando se os campos do certificado estão no modelo User..."

# Verificar se o modelo User existe e quais campos tem
ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $BACKEND_PATH && find . -name 'User.php' -path '*/Models/*' -type f 2>/dev/null | head -1"

echo ""
echo "📋 Verificando campos do certificado na tabela users..."
ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $BACKEND_PATH && sudo mysql -u root -e 'DESCRIBE users;' lacos_db | grep -E 'certificate|has_certificate' || echo 'Campos não encontrados'"

echo ""
echo "📋 Verificando se o endpoint /user retorna os campos do certificado..."
echo "   (Execute manualmente: curl -H 'Authorization: Bearer TOKEN' http://193.203.182.22/api/user | grep certificate)"













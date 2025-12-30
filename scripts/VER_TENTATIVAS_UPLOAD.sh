#!/bin/bash

# Script para ver todas as tentativas de upload de certificado

SSH_USER="darley"
SSH_HOST="193.203.182.22"
SSH_PORT="63022"
SSH_PASS="yhvh77"
BACKEND_PATH="/var/www/lacos-backend"

echo "🔍 Verificando todas as tentativas de upload de certificado..."
echo ""

# Ver todas as linhas que mencionam certificate, upload, POST, etc.
echo "📋 Últimas 1000 linhas do log filtradas por certificado/upload:"
sshpass -p "$SSH_PASS" ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "tail -1000 $BACKEND_PATH/storage/logs/laravel.log | grep -i -E 'certificate|upload.*pfx|POST.*certificate|CertificateController|certificate_file|multipart.*certificate' | tail -50"

echo ""
echo ""
echo "📋 Todas as requisições POST recentes:"
sshpass -p "$SSH_PASS" ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "tail -500 $BACKEND_PATH/storage/logs/laravel.log | grep -i 'POST' | tail -20"

echo ""
echo ""
echo "📋 Erros recentes:"
sshpass -p "$SSH_PASS" ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "tail -500 $BACKEND_PATH/storage/logs/laravel.log | grep -i 'ERROR' | tail -10"






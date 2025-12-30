#!/bin/bash

# Script para ver os últimos logs de upload (últimas 500 linhas)

SSH_USER="darley"
SSH_HOST="193.203.182.22"
SSH_PORT="63022"
SSH_PASS="yhvh77"
BACKEND_PATH="/var/www/lacos-backend"

echo "🔍 Verificando últimos logs de upload (últimas 500 linhas)..."
echo ""

# Ver últimos logs relacionados a upload, certificate, POST /certificate
sshpass -p "$SSH_PASS" ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "tail -500 $BACKEND_PATH/storage/logs/laravel.log | grep -i -E 'certificate|upload|POST.*certificate|CertificateController|FormData|multipart' | tail -30"

echo ""
echo ""
echo "📋 Verificando erros recentes..."
sshpass -p "$SSH_PASS" ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "tail -200 $BACKEND_PATH/storage/logs/laravel.log | grep -i 'ERROR' | tail -10"






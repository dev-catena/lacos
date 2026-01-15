#!/bin/bash

# Script para monitorar tentativas de upload de certificado em tempo real

SSH_USER="darley"
SSH_HOST="193.203.182.22"
SSH_PORT="63022"
SSH_PASS="yhvh77"
BACKEND_PATH="/var/www/lacos-backend"

echo "👀 Monitorando uploads de certificado..."
echo "Pressione Ctrl+C para parar"
echo ""

sshpass -p "$SSH_PASS" ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "tail -f $BACKEND_PATH/storage/logs/laravel.log | grep -i -E 'certificate|upload|POST.*certificate|CertificateController|FormData|multipart|certificate_file'"















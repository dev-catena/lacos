#!/bin/bash

# Script para ver os logs relacionados ao upload de certificado

SSH_USER="darley"
SSH_HOST="193.203.182.22"
SSH_PORT="63022"
SSH_PASS="yhvh77"

echo "🔍 Verificando logs de upload de certificado..."

sshpass -p "$SSH_PASS" ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "tail -100 /var/www/lacos-backend/storage/logs/laravel.log | grep -i -E 'certificate|upload|pfx' | tail -30"






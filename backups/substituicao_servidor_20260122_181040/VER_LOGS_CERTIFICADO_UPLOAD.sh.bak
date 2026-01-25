#!/bin/bash

# Script para ver os logs de upload de certificado

SSH_USER="darley"
SSH_HOST="193.203.182.22"
SSH_PORT="63022"
SSH_PASS="yhvh77"
BACKEND_PATH="/var/www/lacos-backend"

echo "🔍 Verificando logs de upload de certificado..."
echo ""

# Ver últimos logs relacionados a certificado
sshpass -p "$SSH_PASS" ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "tail -200 $BACKEND_PATH/storage/logs/laravel.log | grep -i -E 'certificate|upload|pfx|CertificateController' | tail -50"

echo ""
echo ""
echo "📋 Para monitorar em tempo real:"
echo "   ssh -p $SSH_PORT $SSH_USER@$SSH_HOST"
echo "   tail -f $BACKEND_PATH/storage/logs/laravel.log | grep -i certificate"















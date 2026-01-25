#!/bin/bash

# Script para verificar se o certificado foi salvo no banco de dados

SSH_USER="darley"
SSH_HOST="10.102.0.103"
SSH_PORT="63022"
SSH_PASS="yhvh77"

echo "🔍 Verificando certificado do usuário ID 50 no banco de dados..."

sshpass -p "$SSH_PASS" ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd /var/www/lacos-backend && echo 'yhvh77' | sudo -S php artisan tinker --execute=\"\\\$user = App\\\\Models\\\\User::find(50); echo 'ID: ' . \\\$user->id . PHP_EOL; echo 'Nome: ' . \\\$user->name . PHP_EOL; echo 'has_certificate: ' . (\\\$user->has_certificate ? 'true' : 'false') . PHP_EOL; echo 'certificate_type: ' . (\\\$user->certificate_type ?? 'null') . PHP_EOL; echo 'certificate_path: ' . (\\\$user->certificate_path ?? 'null') . PHP_EOL; echo 'certificate_uploaded_at: ' . (\\\$user->certificate_uploaded_at ?? 'null') . PHP_EOL;\"" 2>&1


#!/bin/bash

# Script para corrigir CORS manualmente no servidor
# Adiciona suporte para porta 8081

set -e

SERVER_HOST="193.203.182.22"
SERVER_PORT="63022"
SERVER_USER="darley"
SERVER_PASS="yhvh77"

echo "🔧 Corrigindo CORS no servidor..."

sshpass -p "$SERVER_PASS" ssh -p "$SERVER_PORT" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_HOST" << 'ENDSSH'
cd /var/www/lacos-backend

# Criar arquivo CORS atualizado
cat > /tmp/cors_fixed.php << 'CORSEOF'
<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'admin/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:8081',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:8081',
        'http://193.203.182.22',
        'https://193.203.182.22',
        'http://admin.lacosapp.com',
        'https://admin.lacosapp.com',
        'http://lacosapp.com',
        'https://lacosapp.com',
        'http://www.lacosapp.com',
        'https://www.lacosapp.com',
    ],
    'allowed_origins_patterns' => [
        '#^http://10\.\d+\.\d+\.\d+(:\d+)?$#',
        '#^http://192\.168\.\d+\.\d+(:\d+)?$#',
        '#^http://172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+(:\d+)?$#',
    ],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
CORSEOF

# Copiar usando sudo com senha
echo "yhvh77" | sudo -S cp /tmp/cors_fixed.php config/cors.php
echo "yhvh77" | sudo -S chown www-data:www-data config/cors.php
echo "yhvh77" | sudo -S chmod 644 config/cors.php

# Limpar cache (sem sudo, usando usuário correto)
php artisan config:clear 2>&1 | grep -v "Access denied" || true

echo "✅ CORS atualizado!"

ENDSSH

echo ""
echo "🎉 CORS corrigido! Teste novamente o login."








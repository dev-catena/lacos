#!/bin/bash

# Script para corrigir CORS incluindo admin.lacosapp.com e http/https

set -e

SERVER="193.203.182.22"
USER="darley"
PASSWORD="yhvh77"
PORT="63022"
BACKEND_DIR="/var/www/lacos-backend"

echo "🔧 Corrigindo CORS para incluir admin.lacosapp.com..."
echo ""

sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" << 'REMOTE_SCRIPT'
    export SUDO_PASS='yhvh77'
    cd /var/www/lacos-backend
    
    # Fazer backup do config/cors.php se existir
    if [ -f config/cors.php ]; then
        echo "$SUDO_PASS" | sudo -S cp config/cors.php config/cors.php.bak.$(date +%Y%m%d_%H%M%S)
        echo "✅ Backup de config/cors.php criado"
    fi
    
    # Criar/Atualizar config/cors.php
    echo "$SUDO_PASS" | sudo -S tee config/cors.php > /dev/null << 'CORS_EOF'
<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie', 'admin/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173',
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
CORS_EOF

    echo "$SUDO_PASS" | sudo -S chown www-data:www-data config/cors.php
    echo "$SUDO_PASS" | sudo -S chmod 644 config/cors.php
    echo "✅ config/cors.php atualizado"
    
    # Limpar cache
    echo ""
    echo "🧹 Limpando cache..."
    echo "$SUDO_PASS" | sudo -S -u www-data php artisan config:clear
    echo "$SUDO_PASS" | sudo -S -u www-data php artisan cache:clear
    echo "$SUDO_PASS" | sudo -S -u www-data php artisan optimize:clear
    echo "✅ Cache limpo"
    
    echo ""
    echo "✅ CORS configurado com sucesso!"
    echo ""
    echo "📝 Origens permitidas:"
    echo "   - http://admin.lacosapp.com"
    echo "   - https://admin.lacosapp.com"
    echo "   - http://lacosapp.com"
    echo "   - https://lacosapp.com"
    echo "   - http://193.203.182.22"
    echo "   - E outros domínios locais"
REMOTE_SCRIPT

echo ""
echo "✅ CORS corrigido com sucesso!"













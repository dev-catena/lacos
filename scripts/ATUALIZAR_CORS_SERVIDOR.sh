#!/bin/bash

# Script para atualizar configuração de CORS no servidor
# Adiciona suporte para porta 8081 (Vite dev server)

set -e

# Configurações do servidor
SERVER_HOST="10.102.0.103"
SERVER_PORT="63022"
SERVER_USER="darley"
SERVER_PASS="yhvh77"
SERVER_BACKEND="/var/www/lacos-backend"

echo "🔧 Atualizando configuração de CORS no servidor..."
echo "   Servidor: $SERVER_USER@$SERVER_HOST:$SERVER_PORT"
echo ""

# Verificar se sshpass está instalado
if ! command -v sshpass &> /dev/null; then
    echo "❌ Erro: sshpass não está instalado."
    echo "   Instale com: sudo apt-get install sshpass"
    exit 1
fi

# Atualizar CORS no servidor
sshpass -p "$SERVER_PASS" ssh -p "$SERVER_PORT" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_HOST" << 'ENDSSH'
cd /var/www/lacos-backend

# Backup do arquivo original
cp config/cors.php config/cors.php.backup

# Atualizar allowed_origins para incluir porta 8081
cat > /tmp/cors_update.php << 'PHPUPDATE'
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
        'http://localhost:8081',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:8081',
        'http://10.102.0.103',
        'https://10.102.0.103',
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
PHPUPDATE

# Copiar arquivo atualizado
sudo cp /tmp/cors_update.php config/cors.php
sudo chown www-data:www-data config/cors.php
sudo chmod 644 config/cors.php

# Limpar cache do Laravel
php artisan config:clear
php artisan cache:clear

echo "✅ Configuração de CORS atualizada!"
echo ""
echo "📋 Origens permitidas agora incluem:"
echo "   - http://localhost:8081"
echo "   - http://127.0.0.1:8081"
echo ""
echo "🔄 Cache do Laravel limpo"

ENDSSH

echo ""
echo "🎉 CORS atualizado com sucesso!"
echo ""
echo "📝 Agora o web-admin na porta 8081 deve funcionar corretamente."








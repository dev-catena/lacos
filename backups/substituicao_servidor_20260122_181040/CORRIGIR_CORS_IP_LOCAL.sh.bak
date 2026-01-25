#!/bin/bash

# Script para corrigir CORS para aceitar IPs locais
# Execute no servidor

set -e

cd /var/www/lacos-backend

echo "🔧 Atualizando CORS para aceitar IPs locais..."
echo ""

# Criar/Atualizar config/cors.php
sudo bash -c "cat > config/cors.php << 'EOF'
<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'admin/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173',
        'http://193.203.182.22',
        'http://193.203.182.22:3000',
        'https://193.203.182.22',
        'http://10.102.0.103:3000',
        'http://10.102.0.103',
    ],
    // Permitir qualquer IP na rede local
    'allowed_origins_patterns' => [
        '#^http://10\.\d+\.\d+\.\d+(:\d+)?$#',
        '#^http://192\.168\.\d+\.\d+(:\d+)?$#',
        '#^http://172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+(:\d+)?$#',
    ],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
EOF
"
sudo chown www-data:www-data config/cors.php
echo "✅ config/cors.php atualizado"
echo ""

# Limpar cache
php artisan config:clear
echo "✅ Cache limpo"
echo ""

echo "=========================================="
echo "✅ CORS atualizado!"
echo "=========================================="
echo ""
echo "📋 IPs permitidos:"
echo "   - localhost:3000"
echo "   - 127.0.0.1:3000"
echo "   - 193.203.182.22"
echo "   - 10.102.0.103:3000"
echo "   - Qualquer IP 10.x.x.x (padrão)"
echo "   - Qualquer IP 192.168.x.x (padrão)"
echo ""


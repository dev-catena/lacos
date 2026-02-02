#!/bin/bash

# Script para aplicar rotas de login no servidor

SERVER_IP="10.102.0.103"
SERVER_USER="darley"
SERVER_PASSWORD="yhvh77"
PORT="63022"

echo "🚀 Aplicando rotas de login no servidor..."
echo ""

# Instalar sshpass se não estiver instalado
if ! command -v sshpass &> /dev/null; then
    echo "📦 Instalando sshpass..."
    sudo apt-get update && sudo apt-get install -y sshpass
fi

# Copiar arquivo de rotas
echo "📤 Copiando arquivo de rotas..."
sshpass -p "$SERVER_PASSWORD" scp -P $PORT -o StrictHostKeyChecking=no \
    backend-laravel/routes/api.php \
    $SERVER_USER@$SERVER_IP:/tmp/api_routes_login.php

echo ""
echo "✅ Arquivo copiado para o servidor!"
echo ""
echo "📋 Próximos passos (execute no servidor):"
echo ""
echo "1. Fazer backup e aplicar as rotas:"
echo "   ssh -p $PORT $SERVER_USER@$SERVER_IP"
echo "   sudo cp /var/www/lacos-backend/routes/api.php /var/www/lacos-backend/routes/api.php.bak.$(date +%Y%m%d_%H%M%S)"
echo "   sudo cp /tmp/api_routes_login.php /var/www/lacos-backend/routes/api.php"
echo "   sudo chown www-data:www-data /var/www/lacos-backend/routes/api.php"
echo ""
echo "2. Limpar cache do Laravel:"
echo "   cd /var/www/lacos-backend"
echo "   sudo php artisan route:clear"
echo "   sudo php artisan config:clear"
echo ""
echo "3. Verificar rotas:"
echo "   sudo php artisan route:list | grep login"
echo ""
echo "4. Testar o login:"
echo "   curl -X POST http://10.102.0.103/api/login -H 'Content-Type: application/json' -d '{\"login\":\"71533028672\",\"password\":\"111111\"}'"
echo ""













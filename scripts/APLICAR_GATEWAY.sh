#!/bin/bash

# Script para aplicar as mudanças do gateway no servidor
# Este script copia os arquivos necessários e prepara a configuração

SERVER_IP="193.203.182.22"
SERVER_USER="darley"
SERVER_PASSWORD="yhvh77"
PORT="63022"

echo "🚀 Aplicando configuração do gateway..."
echo ""

# Instalar sshpass se não estiver instalado
if ! command -v sshpass &> /dev/null; then
    echo "📦 Instalando sshpass..."
    sudo apt-get update && sudo apt-get install -y sshpass
fi

# Copiar GatewayController
echo "📤 Copiando GatewayController..."
sshpass -p "$SERVER_PASSWORD" scp -P $PORT -o StrictHostKeyChecking=no \
    backend-laravel/app/Http/Controllers/Api/GatewayController.php \
    $SERVER_USER@$SERVER_IP:/tmp/GatewayController.php

# Copiar rotas
echo "📤 Copiando rotas..."
sshpass -p "$SERVER_PASSWORD" scp -P $PORT -o StrictHostKeyChecking=no \
    backend-laravel/routes/api.php \
    $SERVER_USER@$SERVER_IP:/tmp/api_routes_gateway.php

# Copiar script de configuração
echo "📤 Copiando script de configuração..."
sshpass -p "$SERVER_PASSWORD" scp -P $PORT -o StrictHostKeyChecking=no \
    backend-laravel/CONFIGURAR_GATEWAY_MANUAL.sh \
    $SERVER_USER@$SERVER_IP:/tmp/CONFIGURAR_GATEWAY_MANUAL.sh

echo ""
echo "✅ Arquivos copiados para o servidor!"
echo ""
echo "📋 Próximos passos (execute no servidor):"
echo ""
echo "1. Aplicar o GatewayController e as rotas:"
echo "   ssh -p $PORT $SERVER_USER@$SERVER_IP"
echo "   sudo cp /tmp/GatewayController.php /var/www/lacos-backend/app/Http/Controllers/Api/"
echo "   sudo cp /var/www/lacos-backend/routes/api.php /var/www/lacos-backend/routes/api.php.bak"
echo "   sudo cp /tmp/api_routes_gateway.php /var/www/lacos-backend/routes/api.php"
echo "   sudo chown -R www-data:www-data /var/www/lacos-backend/app/Http/Controllers/Api/GatewayController.php"
echo "   sudo chown www-data:www-data /var/www/lacos-backend/routes/api.php"
echo ""
echo "2. Configurar Nginx e SSL:"
echo "   sudo bash /tmp/CONFIGURAR_GATEWAY_MANUAL.sh"
echo ""
echo "3. Limpar cache do Laravel:"
echo "   cd /var/www/lacos-backend"
echo "   sudo php artisan route:clear"
echo "   sudo php artisan config:clear"
echo ""
echo "4. Testar o endpoint:"
echo "   curl https://gateway.lacosapp.com/api/gateway/status"
echo ""













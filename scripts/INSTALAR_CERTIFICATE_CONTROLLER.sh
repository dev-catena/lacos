#!/bin/bash

# Script para copiar CertificateController para o servidor

SSH_USER="darley"
SSH_HOST="193.203.182.22"
SSH_PORT="63022"
SSH_PASS="yhvh77"
BACKEND_PATH="/var/www/lacos-backend"

echo "📦 Copiando CertificateController para o servidor..."

# Verificar se o arquivo local existe
if [ ! -f "backend-laravel/CertificateController_APX.php" ]; then
    echo "❌ Arquivo backend-laravel/CertificateController_APX.php não encontrado!"
    exit 1
fi

# Copiar para o servidor
sshpass -p "$SSH_PASS" scp -P "$SSH_PORT" backend-laravel/CertificateController_APX.php "$SSH_USER@$SSH_HOST:/tmp/CertificateController.php"

if [ $? -eq 0 ]; then
    echo "✅ Arquivo copiado para /tmp/CertificateController.php no servidor"
    echo ""
    echo "📋 Para instalar no servidor, execute:"
    echo "   ssh -p $SSH_PORT $SSH_USER@$SSH_HOST"
    echo "   sudo cp /tmp/CertificateController.php $BACKEND_PATH/app/Http/Controllers/Api/CertificateController.php"
    echo "   sudo chown www-data:www-data $BACKEND_PATH/app/Http/Controllers/Api/CertificateController.php"
    echo "   sudo chmod 644 $BACKEND_PATH/app/Http/Controllers/Api/CertificateController.php"
    echo "   cd $BACKEND_PATH && sudo php artisan route:clear && sudo php artisan config:clear"
else
    echo "❌ Erro ao copiar arquivo"
    exit 1
fi






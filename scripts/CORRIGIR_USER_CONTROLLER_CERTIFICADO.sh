#!/bin/bash

# Script para corrigir o UserController e adicionar método uploadCertificate

SSH_USER="darley"
SSH_HOST="192.168.0.20"
SSH_PORT="63022"
SSH_PASS="yhvh77"
BACKEND_PATH="/var/www/lacos-backend"

echo "🔧 Corrigindo UserController e rota de certificado..."
echo ""

sshpass -p "$SSH_PASS" ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" << 'REMOTE_SCRIPT'
set -e
cd /var/www/lacos-backend

# Fazer backup do UserController atual
echo 'yhvh77' | sudo -S cp app/Http/Controllers/Api/UserController.php app/Http/Controllers/Api/UserController.php.backup.$(date +%s)
echo '✅ Backup do UserController criado'

# Copiar novo UserController
echo 'yhvh77' | sudo -S cp /tmp/UserController_NOVO.php app/Http/Controllers/Api/UserController.php
echo 'yhvh77' | sudo -S chown www-data:www-data app/Http/Controllers/Api/UserController.php
echo '✅ UserController atualizado'

# Corrigir rota no api.php
echo 'yhvh77' | sudo -S sed -i 's/AppHttpControllersApiUserController/App\\Http\\Controllers\\Api\\UserController/g' routes/api.php
echo '✅ Rota corrigida no api.php'

# Verificar sintaxe PHP
php -l app/Http/Controllers/Api/UserController.php
echo '✅ Sintaxe PHP verificada'

# Limpar cache
php artisan route:clear
php artisan config:clear
php artisan cache:clear
echo '✅ Cache limpo'

# Verificar se a rota está registrada
php artisan route:list | grep -i 'users.*certificate' || echo '⚠️ Rota não encontrada (pode ser normal se houver erro)'

echo ''
echo '✅ Correções aplicadas!'
REMOTE_SCRIPT

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ UserController e rota corrigidos no servidor!"
    echo ""
    echo "📝 Agora teste o upload novamente no app"
else
    echo "❌ Erro ao corrigir no servidor"
    exit 1
fi

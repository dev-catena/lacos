#!/bin/bash

# Script para atualizar o UserController com logs detalhados

SSH_USER="darley"
SSH_HOST="193.203.182.22"
SSH_PORT="63022"
SSH_PASS="yhvh77"
BACKEND_PATH="/var/www/lacos-backend"

echo "🔧 Atualizando UserController com logs detalhados..."
echo ""

sshpass -p "$SSH_PASS" ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" << 'REMOTE_SCRIPT'
set -e
cd /var/www/lacos-backend

# Fazer backup
echo 'yhvh77' | sudo -S cp app/Http/Controllers/Api/UserController.php app/Http/Controllers/Api/UserController.php.backup.logs.$(date +%s)
echo '✅ Backup criado'

# Copiar novo UserController
echo 'yhvh77' | sudo -S cp /tmp/UserController_COM_LOGS.php app/Http/Controllers/Api/UserController.php
echo 'yhvh77' | sudo -S chown www-data:www-data app/Http/Controllers/Api/UserController.php
echo '✅ UserController atualizado'

# Verificar sintaxe
php -l app/Http/Controllers/Api/UserController.php
echo '✅ Sintaxe verificada'

echo ''
echo '✅ Atualização concluída!'
echo '📝 Agora os logs mostrarão todas as requisições de upload'
REMOTE_SCRIPT

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ UserController atualizado com logs detalhados!"
    echo ""
    echo "📝 Agora teste o upload novamente e depois verifique os logs:"
    echo "   sshpass -p \"yhvh77\" ssh -p 63022 darley@193.203.182.22 \"cd /var/www/lacos-backend && tail -30 storage/logs/laravel.log | grep -i 'uploadCertificate\|certificate'\""
else
    echo "❌ Erro ao atualizar"
    exit 1
fi





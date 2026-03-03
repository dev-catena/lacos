#!/bin/bash

# Script para atualizar o UserController com suporte completo a certificado

SSH_USER="darley"
SSH_HOST="192.168.0.20"
SSH_PORT="63022"
SSH_PASS="yhvh77"
BACKEND_PATH="/var/www/lacos-backend"

echo "🔧 Atualizando UserController com suporte completo a certificado..."
echo ""

sshpass -p "$SSH_PASS" ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" << 'REMOTE_SCRIPT'
set -e
cd /var/www/lacos-backend

# Fazer backup do UserController atual
echo 'yhvh77' | sudo -S cp app/Http/Controllers/Api/UserController.php app/Http/Controllers/Api/UserController.php.backup.certificado.$(date +%s)
echo '✅ Backup do UserController criado'

# Copiar novo UserController
echo 'yhvh77' | sudo -S cp /tmp/UserController_CERTIFICADO_COMPLETO.php app/Http/Controllers/Api/UserController.php
echo 'yhvh77' | sudo -S chown www-data:www-data app/Http/Controllers/Api/UserController.php
echo '✅ UserController atualizado'

# Verificar sintaxe PHP
php -l app/Http/Controllers/Api/UserController.php
echo '✅ Sintaxe PHP verificada'

# Limpar cache
php artisan route:clear 2>/dev/null || true
php artisan config:clear 2>/dev/null || true
echo '✅ Cache limpo'

# Verificar se a rota está registrada
php artisan route:list 2>/dev/null | grep -i 'users.*certificate' || echo '⚠️ Rota não encontrada (pode ser normal)'

echo ''
echo '✅ Atualização concluída!'
REMOTE_SCRIPT

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ UserController atualizado no servidor!"
    echo ""
    echo "📝 O componente agora suporta:"
    echo "   ✅ Upload de arquivo .pfx"
    echo "   ✅ Criptografia e armazenamento da senha"
    echo "   ✅ Configuração completa para assinatura digital"
    echo ""
    echo "🧪 Teste o upload no app agora!"
else
    echo "❌ Erro ao atualizar no servidor"
    exit 1
fi














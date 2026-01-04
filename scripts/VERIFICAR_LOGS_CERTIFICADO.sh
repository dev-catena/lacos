#!/bin/bash

SSH_USER="darley"
SSH_HOST="193.203.182.22"
SSH_PORT="63022"
SSH_PASS="yhvh77"
BACKEND_PATH="/var/www/lacos-backend"

echo "🔍 Verificando logs de certificado no servidor..."
echo ""

# Verificar logs recentes relacionados a certificado
sshpass -p "$SSH_PASS" ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $BACKEND_PATH && \
    echo '📋 Últimas 50 linhas do log do Laravel:' && \
    tail -n 50 storage/logs/laravel.log | grep -i 'certificado\|certificate' || echo 'Nenhum log de certificado encontrado' && \
    echo '' && \
    echo '📋 Verificando se a rota certificate/upload está registrada:' && \
    php artisan route:list | grep -i certificate || echo 'Rota certificate não encontrada' && \
    echo '' && \
    echo '📋 Verificando se o CertificateController existe:' && \
    ls -la app/Http/Controllers/Api/CertificateController*.php 2>/dev/null || echo 'CertificateController não encontrado'"

echo ""
echo "✅ Verificação concluída!"













#!/bin/bash

# Script para aplicar correções no servidor de produção
# Servidor: 10.102.0.103:63022

SERVER="10.102.0.103"
PORT="63022"
USER="darley"
REMOTE_PATH="/var/www/lacos-backend"

echo "🚀 Aplicando correções no servidor de produção..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Arquivo a ser copiado
FILE="backend-laravel/app/Http/Controllers/Api/GroupController.php"

if [ ! -f "$FILE" ]; then
    echo "❌ Erro: Arquivo $FILE não encontrado!"
    exit 1
fi

echo "📤 Copiando GroupController.php para o servidor..."
scp -P $PORT "$FILE" $USER@$SERVER:$REMOTE_PATH/app/Http/Controllers/Api/GroupController.php

if [ $? -eq 0 ]; then
    echo "✅ Arquivo copiado com sucesso!"
    echo ""
    echo "📝 Próximos passos (execute no servidor):"
    echo "   ssh -p $PORT $USER@$SERVER"
    echo "   cd $REMOTE_PATH"
    echo "   php artisan config:clear"
    echo "   php artisan cache:clear"
    echo "   php artisan route:clear"
    echo "   sudo systemctl restart php8.2-fpm"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ Correções aplicadas no servidor!"
else
    echo "❌ Erro ao copiar arquivo!"
    exit 1
fi








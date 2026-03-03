#!/bin/bash

# Script para adicionar rota de atualização de médico

set -e

SERVER="192.168.0.20"
USER="darley"
PASSWORD="yhvh77"
PORT="63022"
ROUTES_FILE="routes/api.php"
BACKEND_DIR="/var/www/lacos-backend"

echo "🔧 Adicionando rota de atualização de médico..."
echo ""

sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" << EOF
    export SUDO_PASS='$PASSWORD'
    cd $BACKEND_DIR
    
    # Verificar se a rota já existe
    if grep -q "Route::put('/doctors/{id}'" $ROUTES_FILE; then
        echo "✅ Rota de atualização já existe"
    else
        # Adicionar a rota antes do Route::delete
        sed -i "/Route::delete('\/doctors\/{id}',/i\\        Route::put('/doctors/{id}', [AdminDoctorController::class, 'update']);" $ROUTES_FILE
        echo "✅ Rota de atualização adicionada"
    fi
    
    # Limpar cache
    echo "\$SUDO_PASS" | sudo -S -u www-data php artisan route:clear
    echo "\$SUDO_PASS" | sudo -S -u www-data php artisan config:clear
    echo "\$SUDO_PASS" | sudo -S -u www-data php artisan cache:clear
    echo "\$SUDO_PASS" | sudo -S -u www-data php artisan optimize:clear
    
    echo "✅ Cache limpo"
EOF

echo ""
echo "✅ Rota de atualização adicionada com sucesso!"













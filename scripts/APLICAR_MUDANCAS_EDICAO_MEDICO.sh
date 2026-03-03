#!/bin/bash

# Script para aplicar mudanças de edição de médico no servidor
# - Envia AdminDoctorController.php atualizado
# - Adiciona rota de atualização no routes/api.php
# - Limpa cache do Laravel

set -e

SERVER="192.168.0.20"
USER="darley"
PASSWORD="yhvh77"
PORT="63022"
BACKEND_DIR="/var/www/lacos-backend"
CONTROLLER_PATH="app/Http/Controllers/Api/AdminDoctorController.php"
ROUTES_FILE="routes/api.php"

echo "🚀 Aplicando mudanças de edição de médico no servidor..."
echo ""

# 1. Enviar AdminDoctorController.php para /tmp
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONTROLLER_FILE="$SCRIPT_DIR/AdminDoctorController.php"

if [ ! -f "$CONTROLLER_FILE" ]; then
    echo "❌ Erro: AdminDoctorController.php não encontrado em $CONTROLLER_FILE"
    exit 1
fi

echo "📤 1/3 - Enviando AdminDoctorController.php para /tmp no servidor..."
sshpass -p "$PASSWORD" scp -P "$PORT" -o StrictHostKeyChecking=no \
  "$CONTROLLER_FILE" \
  "$USER@$SERVER:/tmp/AdminDoctorController.php"

if [ $? -eq 0 ]; then
    echo "✅ Controller enviado com sucesso"
else
    echo "❌ Erro ao enviar controller"
    exit 1
fi

echo ""

# 2. Aplicar mudanças no servidor
echo "🔧 2/3 - Aplicando mudanças no servidor..."
sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" << 'REMOTE_SCRIPT'
    export SUDO_PASS='yhvh77'
    cd /var/www/lacos-backend
    
    # Fazer backup do controller atual
    if [ -f app/Http/Controllers/Api/AdminDoctorController.php ]; then
        echo "$SUDO_PASS" | sudo -S cp app/Http/Controllers/Api/AdminDoctorController.php \
            app/Http/Controllers/Api/AdminDoctorController.php.bak.$(date +%Y%m%d_%H%M%S)
        echo "✅ Backup do controller criado"
    fi
    
    # Substituir o controller
    echo "$SUDO_PASS" | sudo -S mv /tmp/AdminDoctorController.php app/Http/Controllers/Api/AdminDoctorController.php
    echo "$SUDO_PASS" | sudo -S chown www-data:www-data app/Http/Controllers/Api/AdminDoctorController.php
    echo "$SUDO_PASS" | sudo -S chmod 644 app/Http/Controllers/Api/AdminDoctorController.php
    echo "✅ Controller substituído"
    
    # Verificar se a rota de atualização já existe
    if grep -q "Route::put('/doctors/{id}'," routes/api.php 2>/dev/null; then
        echo "✅ Rota de atualização já existe em routes/api.php"
    else
        # Fazer backup do routes/api.php
        echo "$SUDO_PASS" | sudo -S cp routes/api.php routes/api.php.bak.$(date +%Y%m%d_%H%M%S)
        echo "✅ Backup de routes/api.php criado"
        
        # Adicionar a rota antes do Route::delete
        if grep -q "Route::delete('/doctors/{id}'," routes/api.php; then
            # Usar sed para adicionar a rota antes do delete
            echo "$SUDO_PASS" | sudo -S sed -i "/Route::delete('\/doctors\/{id}',/i\\        Route::put('/doctors/{id}', [AdminDoctorController::class, 'update']);" routes/api.php
            echo "✅ Rota de atualização adicionada em routes/api.php"
        else
            # Se não encontrar o delete, adicionar após o block
            if grep -q "Route::post('/doctors/{id}/block'," routes/api.php; then
                echo "$SUDO_PASS" | sudo -S sed -i "/Route::post('\/doctors\/{id}\/block',/a\\        Route::put('/doctors/{id}', [AdminDoctorController::class, 'update']);" routes/api.php
                echo "✅ Rota de atualização adicionada em routes/api.php"
            else
                echo "⚠️  Não foi possível encontrar local para adicionar a rota. Adicione manualmente:"
                echo "   Route::put('/doctors/{id}', [AdminDoctorController::class, 'update']);"
            fi
        fi
    fi
    
    # Limpar cache do Laravel
    echo ""
    echo "🧹 Limpando cache do Laravel..."
    echo "$SUDO_PASS" | sudo -S -u www-data php artisan route:clear
    echo "$SUDO_PASS" | sudo -S -u www-data php artisan config:clear
    echo "$SUDO_PASS" | sudo -S -u www-data php artisan cache:clear
    echo "$SUDO_PASS" | sudo -S -u www-data php artisan optimize:clear
    echo "✅ Cache limpo"
    
    echo ""
    echo "✅ Todas as mudanças aplicadas com sucesso!"
REMOTE_SCRIPT

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 3/3 - Mudanças aplicadas com sucesso!"
    echo ""
    echo "📝 Resumo das mudanças:"
    echo "   ✅ AdminDoctorController.php atualizado"
    echo "   ✅ Rota PUT /api/admin/doctors/{id} adicionada"
    echo "   ✅ Cache do Laravel limpo"
    echo ""
    echo "🔄 Teste acessando: http://admin.lacosapp.com/medicos"
else
    echo ""
    echo "❌ Erro ao aplicar mudanças no servidor"
    exit 1
fi


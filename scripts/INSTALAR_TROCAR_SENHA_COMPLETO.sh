#!/bin/bash

# Script completo para instalar endpoint de trocar senha no servidor remoto
# Execute localmente: ./INSTALAR_TROCAR_SENHA_COMPLETO.sh

set -e

SERVER="192.168.0.20"
USER="darley"
PASSWORD="yhvh77"
PORT="63022"
BACKEND_DIR="/var/www/lacos-backend"

echo "🔐 Instalando endpoint de trocar senha no servidor..."
echo ""

# 1. Copiar controller para o servidor
echo "📤 Enviando ChangePasswordController para o servidor..."
sshpass -p "$PASSWORD" scp -P "$PORT" -o StrictHostKeyChecking=no \
  ChangePasswordController.php \
  "$USER@$SERVER:/tmp/ChangePasswordController.php"

# 2. Mover controller para o diretório correto no servidor
echo "📁 Instalando controller no servidor..."
sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" "
    export SUDO_PASS='$PASSWORD'
    echo \"\$SUDO_PASS\" | sudo -S cp /tmp/ChangePasswordController.php $BACKEND_DIR/app/Http/Controllers/Api/
    echo \"\$SUDO_PASS\" | sudo -S chown www-data:www-data $BACKEND_DIR/app/Http/Controllers/Api/ChangePasswordController.php
    echo \"\$SUDO_PASS\" | sudo -S chmod 644 $BACKEND_DIR/app/Http/Controllers/Api/ChangePasswordController.php
    rm -f /tmp/ChangePasswordController.php
"

echo "✅ Controller instalado!"
echo ""

# 3. Verificar e adicionar rota
echo "📝 Verificando rota no arquivo de rotas..."
ROUTE_EXISTS=$(sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" \
  "grep -q 'change-password' $BACKEND_DIR/routes/api.php && echo 'yes' || echo 'no'")

if [ "$ROUTE_EXISTS" = "yes" ]; then
    echo "✅ Rota já existe no arquivo de rotas"
else
    echo "⚠️  Rota não encontrada. Adicionando..."
    
    # Adicionar use statement se não existir
    sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" "
        if ! grep -q 'use App\\\\Http\\\\Controllers\\\\Api\\\\ChangePasswordController' $BACKEND_DIR/routes/api.php; then
            export SUDO_PASS='$PASSWORD'
            echo \"\$SUDO_PASS\" | sudo -S sed -i '/use App\\\\Http\\\\Controllers\\\\Api\\\\MedicationCatalogController;/a use App\\\\Http\\\\Controllers\\\\Api\\\\ChangePasswordController;' $BACKEND_DIR/routes/api.php
        fi
    "
    
    # Adicionar rota dentro do grupo auth:sanctum
    sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" "
        export SUDO_PASS='$PASSWORD'
        if ! grep -q 'change-password' $BACKEND_DIR/routes/api.php; then
            echo \"\$SUDO_PASS\" | sudo -S sed -i '/Route::post.*logout/a     Route::post(\"/change-password\", [ChangePasswordController::class, \"changePassword\"]);' $BACKEND_DIR/routes/api.php
        fi
    "
    
    echo "✅ Rota adicionada!"
fi

echo ""

# 4. Limpar cache do Laravel
echo "🧹 Limpando cache do Laravel..."
sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" "
    cd $BACKEND_DIR
    export SUDO_PASS='$PASSWORD'
    echo \"\$SUDO_PASS\" | sudo -S php artisan route:clear
    echo \"\$SUDO_PASS\" | sudo -S php artisan config:clear
    echo \"\$SUDO_PASS\" | sudo -S php artisan cache:clear
"

echo "✅ Cache limpo!"
echo ""

# 5. Verificar instalação
echo "🔍 Verificando instalação..."
sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" "
    echo 'Controller:'
    ls -lh $BACKEND_DIR/app/Http/Controllers/Api/ChangePasswordController.php 2>/dev/null && echo '✅ Controller encontrado' || echo '❌ Controller não encontrado'
    echo ''
    echo 'Rota:'
    grep -n 'change-password' $BACKEND_DIR/routes/api.php && echo '✅ Rota encontrada' || echo '❌ Rota não encontrada'
"

echo ""
echo "✅ Instalação concluída!"
echo ""
echo "📝 Para testar:"
echo "   1. Faça login no site"
echo "   2. Clique no menu de perfil"
echo "   3. Clique em 'Trocar Senha'"
echo "   4. Preencha os campos e teste"





#!/bin/bash

# Script para instalar sistema de fornecedores no servidor remoto
# Execute localmente: ./INSTALAR_SISTEMA_FORNECEDORES.sh

set -e

SERVER="193.203.182.22"
USER="darley"
PASSWORD="yhvh77"
PORT="63022"
BACKEND_DIR="/var/www/lacos-backend"

echo "🏪 Instalando sistema de fornecedores no servidor..."
echo ""

# 1. Enviar arquivos para o servidor
echo "📤 Enviando arquivos para o servidor..."

# Model Supplier
sshpass -p "$PASSWORD" scp -P "$PORT" -o StrictHostKeyChecking=no \
  app/Models/Supplier.php \
  "$USER@$SERVER:/tmp/Supplier.php"

# Model SupplierCategory
sshpass -p "$PASSWORD" scp -P "$PORT" -o StrictHostKeyChecking=no \
  app/Models/SupplierCategory.php \
  "$USER@$SERVER:/tmp/SupplierCategory.php"

# Controller
sshpass -p "$PASSWORD" scp -P "$PORT" -o StrictHostKeyChecking=no \
  app/Http/Controllers/Api/SupplierController.php \
  "$USER@$SERVER:/tmp/SupplierController.php"

# Migrations
sshpass -p "$PASSWORD" scp -P "$PORT" -o StrictHostKeyChecking=no \
  database/migrations/2024_01_15_000001_create_suppliers_table.php \
  "$USER@$SERVER:/tmp/create_suppliers_table.php"

sshpass -p "$PASSWORD" scp -P "$PORT" -o StrictHostKeyChecking=no \
  database/migrations/2024_01_15_000002_create_supplier_categories_table.php \
  "$USER@$SERVER:/tmp/create_supplier_categories_table.php"

# 2. Instalar arquivos no servidor
echo "📁 Instalando arquivos no servidor..."
sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" "
    export SUDO_PASS='$PASSWORD'
    
    # Models
    echo \"\$SUDO_PASS\" | sudo -S cp /tmp/Supplier.php $BACKEND_DIR/app/Models/
    echo \"\$SUDO_PASS\" | sudo -S cp /tmp/SupplierCategory.php $BACKEND_DIR/app/Models/
    echo \"\$SUDO_PASS\" | sudo -S chown www-data:www-data $BACKEND_DIR/app/Models/Supplier.php
    echo \"\$SUDO_PASS\" | sudo -S chown www-data:www-data $BACKEND_DIR/app/Models/SupplierCategory.php
    
    # Controller
    echo \"\$SUDO_PASS\" | sudo -S cp /tmp/SupplierController.php $BACKEND_DIR/app/Http/Controllers/Api/
    echo \"\$SUDO_PASS\" | sudo -S chown www-data:www-data $BACKEND_DIR/app/Http/Controllers/Api/SupplierController.php
    
    # Migrations
    echo \"\$SUDO_PASS\" | sudo -S cp /tmp/create_suppliers_table.php $BACKEND_DIR/database/migrations/
    echo \"\$SUDO_PASS\" | sudo -S cp /tmp/create_supplier_categories_table.php $BACKEND_DIR/database/migrations/
    echo \"\$SUDO_PASS\" | sudo -S chown www-data:www-data $BACKEND_DIR/database/migrations/*.php
    
    # Limpar arquivos temporários
    rm -f /tmp/Supplier.php /tmp/SupplierCategory.php /tmp/SupplierController.php
    rm -f /tmp/create_suppliers_table.php /tmp/create_supplier_categories_table.php
"

echo "✅ Arquivos instalados!"
echo ""

# 3. Executar migrations
echo "🗄️  Executando migrations..."
sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" "
    cd $BACKEND_DIR
    export SUDO_PASS='$PASSWORD'
    # Executar todas as migrations pendentes (incluindo as novas)
    echo \"\$SUDO_PASS\" | sudo -S php artisan migrate --force 2>&1 | grep -E '(Migrating|Migrated|suppliers)' || true
"

echo "✅ Migrations executadas!"
echo ""

# 4. Verificar rotas
echo "🔍 Verificando rotas..."
ROUTE_EXISTS=$(sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" \
  "grep -q 'suppliers/register' $BACKEND_DIR/routes/api.php && echo 'yes' || echo 'no'")

if [ "$ROUTE_EXISTS" = "yes" ]; then
    echo "✅ Rotas já existem"
else
    echo "⚠️  Rotas não encontradas. Adicione manualmente em routes/api.php:"
    echo "   Route::post('/suppliers/register', [SupplierController::class, 'register']);"
    echo "   Route::get('/suppliers/me', [SupplierController::class, 'getMySupplier']);"
fi

# 5. Limpar cache
echo "🧹 Limpando cache..."
sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" "
    cd $BACKEND_DIR
    export SUDO_PASS='$PASSWORD'
    echo \"\$SUDO_PASS\" | sudo -S php artisan route:clear
    echo \"\$SUDO_PASS\" | sudo -S php artisan config:clear
    echo \"\$SUDO_PASS\" | sudo -S php artisan cache:clear
"

echo ""
echo "✅ Instalação concluída!"
echo ""
echo "📝 Verifique se as rotas foram adicionadas em routes/api.php"
echo "   Se não foram adicionadas automaticamente, adicione manualmente dentro do grupo auth:sanctum"


#!/bin/bash

# Script para corrigir cache e executar migration da Loja no servidor

set -e

echo "🔧 Corrigindo cache e executando migration da Loja..."
echo ""

cd /var/www/lacos-backend

# 1. Deletar arquivos de cache
echo "🧹 Removendo arquivos de cache..."
sudo rm -f bootstrap/cache/config.php
sudo rm -f bootstrap/cache/routes-v7.php
sudo rm -f bootstrap/cache/services.php

# 2. Corrigir permissões
echo "🔐 Corrigindo permissões..."
sudo chmod -R 775 storage bootstrap/cache
sudo chown -R www-data:www-data storage bootstrap/cache

# 3. Limpar cache do Laravel
echo "🧹 Limpando cache do Laravel..."
sudo -u www-data php artisan config:clear
sudo -u www-data php artisan cache:clear
sudo -u www-data php artisan route:clear

# 4. Verificar configuração do banco
echo ""
echo "📋 Verificando configuração do banco..."
DB_NAME=$(grep "^DB_DATABASE=" .env | cut -d '=' -f2)
DB_USER=$(grep "^DB_USERNAME=" .env | cut -d '=' -f2)

echo "   Banco: $DB_NAME"
echo "   Usuário: $DB_USER"

if [ "$DB_NAME" != "lacos" ] || [ "$DB_USER" != "lacos" ]; then
    echo "⚠️  ATENÇÃO: Configuração do banco pode estar incorreta!"
    echo "   Esperado: DB_DATABASE=lacos, DB_USERNAME=lacos"
    echo "   Verifique o arquivo .env"
fi

# 5. Executar migration específica
echo ""
echo "📦 Executando migration da Loja..."
sudo -u www-data php artisan migrate --force --path=database/migrations/2024_01_15_000008_add_store_fields_to_supplier_products.php

echo ""
echo "✅ Migration executada com sucesso!"
echo ""
echo "📝 Verificando se os campos foram adicionados..."
mysql -u lacos -p'Lacos2025Secure' lacos -e "DESCRIBE supplier_products;" 2>/dev/null | grep -E "(images|payment_methods|delivery_methods)" && echo "✅ Campos adicionados com sucesso!" || echo "⚠️  Verifique manualmente: mysql -u lacos -p'Lacos2025Secure' lacos -e 'DESCRIBE supplier_products;'"




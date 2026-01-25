#!/bin/bash

# Script para executar migration da Loja no servidor
# Usa o usuário 'lacos' do MySQL

set -e

echo "🚀 Executando migration da Loja..."
echo ""

cd /var/www/lacos-backend

# 1. Limpar cache do Laravel (IMPORTANTE!)
echo "🧹 Limpando cache do Laravel..."
php artisan config:clear
php artisan cache:clear
php artisan route:clear

# 2. Verificar configuração do banco
echo ""
echo "📋 Verificando configuração do banco..."
DB_NAME=$(grep "^DB_DATABASE=" .env | cut -d '=' -f2)
DB_USER=$(grep "^DB_USERNAME=" .env | cut -d '=' -f2)

echo "   Banco: $DB_NAME"
echo "   Usuário: $DB_USER"

if [ "$DB_NAME" != "lacos" ] || [ "$DB_USER" != "lacos" ]; then
    echo "⚠️  ATENÇÃO: Configuração do banco pode estar incorreta!"
    echo "   Esperado: DB_DATABASE=lacos, DB_USERNAME=lacos"
fi

# 3. Executar migration como www-data (para ter permissões corretas)
echo ""
echo "📦 Executando migration..."
sudo -u www-data php artisan migrate --force --path=database/migrations/2024_01_15_000008_add_store_fields_to_supplier_products.php

echo ""
echo "✅ Migration executada com sucesso!"
echo ""
echo "📝 Verificando se a migration foi aplicada..."
mysql -u lacos -p'Lacos2025Secure' lacos -e "DESCRIBE supplier_products;" 2>/dev/null | grep -E "(images|payment_methods|delivery_methods)" && echo "✅ Campos adicionados com sucesso!" || echo "⚠️  Campos não encontrados. Verifique manualmente."




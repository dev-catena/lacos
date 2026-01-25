#!/bin/bash

# Script para executar apenas a migration do consultation_price
# Execute este script no servidor: sudo bash EXECUTAR_MIGRATION_CONSULTATION_PRICE.sh

echo "🔧 Executando migration do consultation_price..."
echo ""

cd /var/www/lacos-backend || exit 1

# Encontrar a migration do consultation_price
MIGRATION_FILE=$(ls -t database/migrations/*add_consultation_price_to_users_table.php 2>/dev/null | head -1)

if [ -z "$MIGRATION_FILE" ]; then
    echo "❌ Migration do consultation_price não encontrada"
    echo "Criando migration manualmente..."
    
    MIGRATION_FILE="database/migrations/$(date +%Y_%m_%d_%H%M%S)_add_consultation_price_to_users_table.php"
    
    sudo cat > "$MIGRATION_FILE" << 'MIGRATION'
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'consultation_price')) {
                $table->decimal('consultation_price', 10, 2)->nullable()->after('hourly_rate');
            }
        });
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'consultation_price')) {
                $table->dropColumn('consultation_price');
            }
        });
    }
};
MIGRATION

    sudo chown www-data:www-data "$MIGRATION_FILE"
    echo "✅ Migration criada: $MIGRATION_FILE"
fi

echo "📋 Migration encontrada: $MIGRATION_FILE"
echo ""

# Verificar se a coluna já existe
if mysql -u root -pyhvh77 lacos -e "DESCRIBE users;" 2>/dev/null | grep -q "consultation_price"; then
    echo "⚠️ Coluna consultation_price já existe no banco de dados"
    mysql -u root -pyhvh77 lacos -e "DESCRIBE users;" | grep consultation_price
    exit 0
fi

echo "📤 Executando migration..."

# Tentar executar a migration específica
php artisan migrate --path=database/migrations/$(basename $MIGRATION_FILE) --force

if [ $? -eq 0 ]; then
    echo "✅ Migration executada com sucesso"
else
    echo "⚠️ Erro ao executar migration via artisan, tentando criar manualmente..."
    
    # Criar coluna manualmente
    mysql -u root -pyhvh77 lacos << 'SQL'
ALTER TABLE users 
ADD COLUMN consultation_price DECIMAL(10,2) NULL 
AFTER hourly_rate;
SQL

    if [ $? -eq 0 ]; then
        echo "✅ Coluna criada manualmente no banco de dados"
        
        # Registrar a migration como executada
        MIGRATION_NAME=$(basename $MIGRATION_FILE .php)
        mysql -u root -pyhvh77 lacos << SQL
INSERT INTO migrations (migration, batch) 
SELECT '$MIGRATION_NAME', COALESCE(MAX(batch), 0) + 1 
FROM migrations 
WHERE NOT EXISTS (
    SELECT 1 FROM migrations WHERE migration = '$MIGRATION_NAME'
);
SQL
        echo "✅ Migration registrada na tabela migrations"
    else
        echo "❌ Erro ao criar coluna manualmente"
        exit 1
    fi
fi

echo ""
echo "📋 Verificando se a coluna foi criada..."

if mysql -u root -pyhvh77 lacos -e "DESCRIBE users;" 2>/dev/null | grep "consultation_price"; then
    echo ""
    echo "✅ Coluna consultation_price criada com sucesso!"
    echo ""
    echo "📊 Detalhes da coluna:"
    mysql -u root -pyhvh77 lacos -e "DESCRIBE users;" | grep consultation_price
else
    echo "❌ Coluna consultation_price NÃO foi criada"
    exit 1
fi

echo ""
echo "✅ Processo concluído!"


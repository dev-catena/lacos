#!/bin/bash

# Script para recriar a tabela medication_catalog corretamente

cd /var/www/lacos-backend

echo "🔄 Recriando tabela medication_catalog..."

# Dropar tabela se existir
php artisan tinker --execute="
    try {
        Schema::dropIfExists('medication_catalog');
        echo '✅ Tabela removida (se existia)' . PHP_EOL;
    } catch (\Exception \$e) {
        echo '⚠️  ' . \$e->getMessage() . PHP_EOL;
    }
"

# Copiar migration corrigida
if [ -f "/tmp/2024_12_20_000001_create_medication_catalog_table.php" ]; then
    echo "📤 Copiando migration corrigida..."
    echo "yhvh77" | sudo -S cp /tmp/2024_12_20_000001_create_medication_catalog_table.php database/migrations/ 2>/dev/null
    echo "✅ Migration copiada"
fi

# Executar migration
echo "🔄 Executando migration..."
php artisan migrate --path=database/migrations/2024_12_20_000001_create_medication_catalog_table.php --force

if [ $? -eq 0 ]; then
    echo "✅ Tabela medication_catalog criada com sucesso!"
    
    # Verificar se a tabela foi criada
    php artisan tinker --execute="
        try {
            \$count = DB::table('medication_catalog')->count();
            echo '✅ Tabela criada e acessível. Total de registros: ' . \$count . PHP_EOL;
        } catch (\Exception \$e) {
            echo '❌ Erro ao acessar tabela: ' . \$e->getMessage() . PHP_EOL;
        }
    "
else
    echo "❌ Erro ao executar migration"
    exit 1
fi








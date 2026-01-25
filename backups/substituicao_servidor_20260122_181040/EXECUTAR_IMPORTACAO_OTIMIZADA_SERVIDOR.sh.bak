#!/bin/bash

# Script para executar no servidor - importação otimizada

cd /var/www/lacos-backend

# Verificar se a tabela existe
TABLE_EXISTS=$(php artisan tinker --execute="
    try {
        DB::table('medication_catalog')->count();
        echo 'EXISTS';
    } catch (\Exception \$e) {
        echo 'NOT_EXISTS';
    }
" 2>/dev/null | grep -o "EXISTS" || echo "NOT_EXISTS")

if [ "$TABLE_EXISTS" = "NOT_EXISTS" ]; then
    echo "🔄 Tabela não existe. Executando migration..."
    
    # Verificar se a migration existe
    if [ -f "database/migrations/2024_12_20_000001_create_medication_catalog_table.php" ]; then
        php artisan migrate --path=database/migrations/2024_12_20_000001_create_medication_catalog_table.php --force
        if [ $? -eq 0 ]; then
            echo "✅ Migration executada com sucesso"
        else
            echo "❌ Erro ao executar migration"
            exit 1
        fi
    else
        echo "❌ Arquivo de migration não encontrado"
        echo "   Copiando de /tmp se existir..."
        if [ -f "/tmp/2024_12_20_000001_create_medication_catalog_table.php" ]; then
            echo "yhvh77" | sudo -S mkdir -p database/migrations 2>/dev/null
            echo "yhvh77" | sudo -S cp /tmp/2024_12_20_000001_create_medication_catalog_table.php database/migrations/ 2>/dev/null
            php artisan migrate --path=database/migrations/2024_12_20_000001_create_medication_catalog_table.php --force
            if [ $? -eq 0 ]; then
                echo "✅ Migration executada com sucesso"
            else
                echo "❌ Erro ao executar migration"
                exit 1
            fi
        else
            echo "❌ Migration não encontrada em /tmp também"
            exit 1
        fi
    fi
else
    echo "✅ Tabela já existe"
fi

# Copiar comando usando sudo com senha
echo "yhvh77" | sudo -S cp /tmp/ImportMedicationsFast.php app/Console/Commands/ 2>/dev/null

# Verificar se arquivo foi copiado
if [ ! -f "app/Console/Commands/ImportMedicationsFast.php" ]; then
    echo "❌ Arquivo não foi copiado corretamente"
    exit 1
fi

echo "✅ Comando copiado"

# Registrar comando
composer dump-autoload -q
if [ $? -ne 0 ]; then
    echo "❌ Erro ao executar composer dump-autoload"
    exit 1
fi

echo "✅ Comando registrado"

# Executar importação
echo ""
echo "🔄 Executando importação..."
php artisan medications:import-fast /tmp/medicamentos_processados.csv

if [ $? -eq 0 ]; then
    # Estatísticas
    echo ""
    echo "📊 Estatísticas finais:"
    php artisan tinker --execute="
        \$total = DB::table('medication_catalog')->count();
        \$active = DB::table('medication_catalog')->where('is_active', true)->where('situacao_registro', 'VÁLIDO')->count();
        echo '   Total: ' . number_format(\$total, 0, ',', '.') . PHP_EOL;
        echo '   Ativos: ' . number_format(\$active, 0, ',', '.') . PHP_EOL;
    "
else
    echo "❌ Erro na importação"
    exit 1
fi


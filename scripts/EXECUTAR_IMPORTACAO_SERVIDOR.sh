#!/bin/bash

# Script para executar a importação de medicamentos no servidor
# Este script deve ser executado NO SERVIDOR

set -e

BACKEND_DIR="/var/www/lacos-backend"
CSV_FILE="/tmp/DADOS_ABERTOS_MEDICAMENTOS.csv"

echo "🚀 Iniciando importação de medicamentos no servidor"
echo ""

# 2. Ir para o diretório do backend
echo "📁 Indo para o diretório do backend..."
cd "$BACKEND_DIR" || {
    echo "❌ Erro: Não foi possível acessar $BACKEND_DIR"
    exit 1
}
echo "✅ Diretório: $BACKEND_DIR"
echo ""

# 3. Criar diretórios necessários (se não existirem)
echo "📁 Criando diretórios necessários..."
sudo mkdir -p database/migrations
sudo mkdir -p app/Models
sudo mkdir -p app/Http/Controllers/Api
sudo mkdir -p app/Console/Commands
echo "✅ Diretórios verificados/criados"
echo ""

# 4. Copiar arquivos de /tmp para os locais corretos
echo "📤 Copiando arquivos de /tmp para os locais corretos..."

if [ -f "/tmp/2024_12_20_000001_create_medication_catalog_table.php" ]; then
    sudo cp /tmp/2024_12_20_000001_create_medication_catalog_table.php database/migrations/
    echo "   ✅ Migration copiada"
else
    echo "   ⚠️  Migration não encontrada em /tmp"
fi

if [ -f "/tmp/MedicationCatalog.php" ]; then
    sudo cp /tmp/MedicationCatalog.php app/Models/
    echo "   ✅ Model copiado"
else
    echo "   ⚠️  Model não encontrado em /tmp"
fi

if [ -f "/tmp/MedicationCatalogController.php" ]; then
    sudo cp /tmp/MedicationCatalogController.php app/Http/Controllers/Api/
    echo "   ✅ Controller copiado"
else
    echo "   ⚠️  Controller não encontrado em /tmp"
fi

if [ -f "/tmp/ImportMedicationsFromCSV.php" ]; then
    sudo cp /tmp/ImportMedicationsFromCSV.php app/Console/Commands/
    echo "   ✅ Command copiado"
else
    echo "   ⚠️  Command não encontrado em /tmp"
fi

# Atualizar o comando se foi copiado novamente
if [ -f "/tmp/ImportMedicationsFromCSV.php" ]; then
    sudo cp /tmp/ImportMedicationsFromCSV.php app/Console/Commands/ 2>/dev/null || true
fi

echo ""

# 5. Executar composer dump-autoload
echo "🔄 Executando composer dump-autoload..."
composer dump-autoload
if [ $? -eq 0 ]; then
    echo "✅ Composer dump-autoload concluído"
else
    echo "❌ Erro ao executar composer dump-autoload"
    exit 1
fi
echo ""

# 6. Verificar se a migration já foi executada
echo "📊 Verificando se a tabela medication_catalog existe..."
TABLE_EXISTS=$(php artisan tinker --execute="
    try {
        DB::table('medication_catalog')->count();
        echo 'EXISTS';
    } catch (\Exception \$e) {
        echo 'NOT_EXISTS';
    }
" 2>/dev/null | grep -o "EXISTS" || echo "NOT_EXISTS")

if [ "$TABLE_EXISTS" = "NOT_EXISTS" ]; then
    echo "🔄 Executando migration..."
    php artisan migrate --path=database/migrations/2024_12_20_000001_create_medication_catalog_table.php --force
    if [ $? -eq 0 ]; then
        echo "✅ Migration executada com sucesso"
    else
        echo "❌ Erro ao executar migration"
        exit 1
    fi
else
    echo "✅ Tabela já existe"
fi
echo ""

# 7. Verificar se o CSV existe
if [ ! -f "$CSV_FILE" ]; then
    echo "❌ Erro: CSV não encontrado: $CSV_FILE"
    exit 1
fi

# 8. Executar a importação
echo "🔄 Executando importação de medicamentos..."
echo "   Arquivo: $CSV_FILE"
echo "   Isso pode levar vários minutos (36.000+ registros)..."
echo ""

php artisan medications:import "$CSV_FILE" --chunk=1000

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Importação concluída com sucesso!"
    echo ""
    
    # 9. Verificar estatísticas
    echo "📊 Estatísticas do catálogo:"
    php artisan tinker --execute="
        \$total = DB::table('medication_catalog')->count();
        \$active = DB::table('medication_catalog')->where('is_active', true)->where('situacao_registro', 'VÁLIDO')->count();
        echo '   Total de medicamentos: ' . number_format(\$total, 0, ',', '.') . PHP_EOL;
        echo '   Medicamentos ativos (VÁLIDO): ' . number_format(\$active, 0, ',', '.') . PHP_EOL;
    "
    echo ""
    echo "🎉 Processo completo finalizado!"
else
    echo ""
    echo "❌ Erro durante a importação"
    exit 1
fi


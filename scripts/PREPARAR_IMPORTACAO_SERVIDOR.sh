#!/bin/bash

# Script para preparar importação: copia CSV e arquivos necessários para /tmp no servidor
# Você executa os comandos manualmente no servidor

set -e

# Configurações do servidor
SERVER_HOST="10.102.0.103"
SERVER_PORT="63022"
SERVER_USER="darley"
SERVER_PASS="yhvh77"
SERVER_TMP="/tmp"

echo "🚀 Preparando importação de medicamentos no servidor"
echo "   Servidor: $SERVER_USER@$SERVER_HOST:$SERVER_PORT"
echo ""

# Verificar se sshpass está instalado
if ! command -v sshpass &> /dev/null; then
    echo "❌ sshpass não está instalado"
    echo "   Instale com: sudo apt-get install sshpass"
    exit 1
fi

# Verificar arquivos locais
CSV_FILE="scripts/DADOS_ABERTOS_MEDICAMENTOS.csv"
FILES=(
    "backend-laravel/database/migrations/2024_12_20_000001_create_medication_catalog_table.php"
    "backend-laravel/app/Models/MedicationCatalog.php"
    "backend-laravel/app/Http/Controllers/Api/MedicationCatalogController.php"
    "backend-laravel/app/Console/Commands/ImportMedicationsFromCSV.php"
)

echo "📋 Verificando arquivos locais..."
MISSING=0
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✅ $file"
    else
        echo "   ❌ $file (não encontrado)"
        MISSING=$((MISSING + 1))
    fi
done

if [ ! -f "$CSV_FILE" ]; then
    echo "   ❌ $CSV_FILE (não encontrado)"
    MISSING=$((MISSING + 1))
fi

if [ $MISSING -gt 0 ]; then
    echo ""
    echo "❌ Alguns arquivos estão faltando. Verifique os caminhos."
    exit 1
fi

echo ""
echo "📤 Copiando arquivos para /tmp no servidor..."
echo ""

# Copiar CSV
echo "📤 Copiando CSV..."
sshpass -p "$SERVER_PASS" scp -P "$SERVER_PORT" -o StrictHostKeyChecking=no "$CSV_FILE" "$SERVER_USER@$SERVER_HOST:$SERVER_TMP/DADOS_ABERTOS_MEDICAMENTOS.csv"
echo "   ✅ CSV copiado"

# Copiar arquivos do backend
for file in "${FILES[@]}"; do
    FILENAME=$(basename "$file")
    echo "📤 Copiando $FILENAME..."
    sshpass -p "$SERVER_PASS" scp -P "$SERVER_PORT" -o StrictHostKeyChecking=no "$file" "$SERVER_USER@$SERVER_HOST:$SERVER_TMP/$FILENAME"
    echo "   ✅ $FILENAME copiado"
done

echo ""
echo "✅ Todos os arquivos foram copiados para /tmp no servidor"
echo ""
echo "📝 INSTRUÇÕES PARA EXECUTAR NO SERVIDOR:"
echo ""
echo "1. Conecte-se ao servidor:"
echo "   ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST"
echo ""
echo "2. Vá para o diretório do backend:"
echo "   cd /var/www/lacos-backend"
echo ""
echo "3. Copie os arquivos de /tmp para os locais corretos:"
echo "   sudo cp /tmp/2024_12_20_000001_create_medication_catalog_table.php database/migrations/"
echo "   sudo cp /tmp/MedicationCatalog.php app/Models/"
echo "   sudo cp /tmp/MedicationCatalogController.php app/Http/Controllers/Api/"
echo "   sudo cp /tmp/ImportMedicationsFromCSV.php app/Console/Commands/"
echo ""
echo "4. Execute composer dump-autoload para registrar o comando:"
echo "   composer dump-autoload"
echo ""
echo "5. Execute a migration (se ainda não foi executada):"
echo "   php artisan migrate --path=database/migrations/2024_12_20_000001_create_medication_catalog_table.php"
echo ""
echo "6. Execute a importação:"
echo "   php artisan medications:import /tmp/DADOS_ABERTOS_MEDICAMENTOS.csv --chunk=1000"
echo ""
echo "7. Verifique as estatísticas:"
echo "   php artisan tinker --execute=\"echo 'Total: ' . DB::table('medication_catalog')->count();\""
echo ""

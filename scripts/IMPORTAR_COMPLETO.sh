#!/bin/bash

# Script completo: copia arquivos e importa medicamentos no servidor
# Faz tudo automaticamente

set -e

# Configurações do servidor
SERVER_HOST="192.168.0.20"
SERVER_PORT="63022"
SERVER_USER="darley"
SERVER_PASS="yhvh77"
SERVER_BACKEND="/var/www/lacos-backend"

echo "🚀 Importação Completa de Medicamentos no Servidor"
echo "   Servidor: $SERVER_USER@$SERVER_HOST:$SERVER_PORT"
echo ""

# Verificar se sshpass está instalado
if ! command -v sshpass &> /dev/null; then
    echo "❌ sshpass não está instalado"
    echo "   Instale com: sudo apt-get install sshpass"
    exit 1
fi

# Verificar se o arquivo CSV existe
CSV_FILE="scripts/DADOS_ABERTOS_MEDICAMENTOS.csv"
if [ ! -f "$CSV_FILE" ]; then
    echo "❌ Erro: Arquivo não encontrado: $CSV_FILE"
    exit 1
fi

echo "✅ Arquivo CSV encontrado: $CSV_FILE"
echo ""

# ==================== PASSO 1: Copiar Arquivos do Backend ====================
echo "📤 PASSO 1: Copiando arquivos do backend para o servidor..."
echo ""

FILES=(
    "backend-laravel/database/migrations/2024_12_20_000001_create_medication_catalog_table.php"
    "backend-laravel/app/Models/MedicationCatalog.php"
    "backend-laravel/app/Http/Controllers/Api/MedicationCatalogController.php"
    "backend-laravel/app/Console/Commands/ImportMedicationsFromCSV.php"
)

COPIED=0
for file in "${FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "⚠️  Arquivo não encontrado: $file"
        continue
    fi
    
    # Determinar destino
    if [[ $file == *"migrations"* ]]; then
        DEST="$SERVER_BACKEND/database/migrations/$(basename $file)"
    elif [[ $file == *"Models"* ]]; then
        DEST="$SERVER_BACKEND/app/Models/$(basename $file)"
    elif [[ $file == *"Controllers"* ]]; then
        DEST="$SERVER_BACKEND/app/Http/Controllers/Api/$(basename $file)"
    elif [[ $file == *"Commands"* ]]; then
        DEST="$SERVER_BACKEND/app/Console/Commands/$(basename $file)"
    fi
    
    echo "   📤 $file -> $DEST"
    
    # Criar diretório
    DIR=$(dirname "$DEST")
    sshpass -p "$SERVER_PASS" ssh -p "$SERVER_PORT" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_HOST" "mkdir -p $DIR" 2>/dev/null || true
    
    # Copiar
    if sshpass -p "$SERVER_PASS" scp -P "$SERVER_PORT" -o StrictHostKeyChecking=no "$file" "$SERVER_USER@$SERVER_HOST:$DEST" 2>/dev/null; then
        echo "      ✅ Copiado"
        COPIED=$((COPIED + 1))
    else
        echo "      ⚠️  Erro ao copiar (pode já existir)"
    fi
done

echo ""
echo "✅ $COPIED arquivo(s) copiado(s)"
echo ""

# ==================== PASSO 2: Adicionar Rotas ====================
echo "📝 PASSO 2: Verificando rotas..."
echo ""

sshpass -p "$SERVER_PASS" ssh -p "$SERVER_PORT" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_HOST" << 'ENDSSH'
cd /var/www/lacos-backend

# Verificar se as rotas já existem
if grep -q "MedicationCatalogController" routes/api.php 2>/dev/null; then
    echo "✅ Rotas já existem"
else
    echo "⚠️  Adicionando rotas..."
    
    # Backup
    cp routes/api.php routes/api.php.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
    
    # Adicionar use statement se não existir
    if ! grep -q "MedicationCatalogController" routes/api.php; then
        # Adicionar após outros use statements
        sed -i '/use App\\Http\\Controllers\\Api\\UserController;/a use App\\Http\\Controllers\\Api\\MedicationCatalogController;' routes/api.php 2>/dev/null || \
        sed -i '/use Illuminate\\Support\\Facades\\Route;/a use App\\Http\\Controllers\\Api\\MedicationCatalogController;' routes/api.php 2>/dev/null || \
        echo "use App\Http\Controllers\Api\MedicationCatalogController;" >> routes/api.php
    fi
    
    # Adicionar rotas se não existirem
    if ! grep -q "/medications/search" routes/api.php; then
        cat >> routes/api.php << 'ROUTES'

// Rotas públicas de medicamentos
Route::get('/medications/search', [MedicationCatalogController::class, 'search']);
Route::get('/medications/info', [MedicationCatalogController::class, 'getInfo']);
Route::get('/medications/stats', [MedicationCatalogController::class, 'stats']);
ROUTES
        echo "✅ Rotas adicionadas"
    else
        echo "✅ Rotas já existem"
    fi
fi
ENDSSH

echo ""

# ==================== PASSO 3: Copiar CSV ====================
echo "📤 PASSO 3: Copiando CSV para o servidor (/tmp)..."
sshpass -p "$SERVER_PASS" scp -P "$SERVER_PORT" -o StrictHostKeyChecking=no "$CSV_FILE" "$SERVER_USER@$SERVER_HOST:/tmp/DADOS_ABERTOS_MEDICAMENTOS.csv"

if [ $? -ne 0 ]; then
    echo "❌ Erro ao copiar CSV"
    exit 1
fi

echo "✅ CSV copiado"
echo ""

# ==================== PASSO 4: Executar Importação ====================
echo "🔄 PASSO 4: Executando importação no servidor..."
echo "   Isso pode levar vários minutos (36.000+ registros)..."
echo ""

sshpass -p "$SERVER_PASS" ssh -p "$SERVER_PORT" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_HOST" << 'ENDSSH'
set -e

BACKEND_DIR="/var/www/lacos-backend"
CSV_FILE="/tmp/DADOS_ABERTOS_MEDICAMENTOS.csv"

cd "$BACKEND_DIR" || {
    echo "❌ Erro: Não foi possível acessar $BACKEND_DIR"
    exit 1
}

echo "✅ Diretório: $BACKEND_DIR"
echo ""

# Verificar arquivo
if [ ! -f "$CSV_FILE" ]; then
    echo "❌ CSV não encontrado: $CSV_FILE"
    exit 1
fi

# Verificar migration
MIGRATION_FILE="database/migrations/2024_12_20_000001_create_medication_catalog_table.php"
if [ -f "$MIGRATION_FILE" ]; then
    # Verificar se tabela existe
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
        php artisan migrate --path="$MIGRATION_FILE" --force
        echo "✅ Migration executada"
    else
        echo "✅ Tabela já existe"
    fi
else
    echo "⚠️  Migration não encontrada, verificando se tabela existe..."
    TABLE_EXISTS=$(php artisan tinker --execute="
        try {
            DB::table('medication_catalog')->count();
            echo 'EXISTS';
        } catch (\Exception \$e) {
            echo 'NOT_EXISTS';
        }
    " 2>/dev/null | grep -o "EXISTS" || echo "NOT_EXISTS")
    
    if [ "$TABLE_EXISTS" = "NOT_EXISTS" ]; then
        echo "❌ Tabela não existe e migration não encontrada"
        exit 1
    fi
fi

echo ""
echo "🔄 Importando medicamentos..."
echo ""

# Importar
php artisan medications:import "$CSV_FILE" --chunk=1000

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Importação concluída!"
    echo ""
    echo "📊 Estatísticas:"
    php artisan tinker --execute="
        \$total = DB::table('medication_catalog')->count();
        \$active = DB::table('medication_catalog')->where('is_active', true)->where('situacao_registro', 'VÁLIDO')->count();
        echo '   Total: ' . number_format(\$total, 0, ',', '.') . PHP_EOL;
        echo '   Ativos: ' . number_format(\$active, 0, ',', '.') . PHP_EOL;
    "
    echo ""
    echo "🧹 Limpando arquivo temporário..."
    rm -f "$CSV_FILE"
    echo "✅ Limpeza concluída"
else
    echo "❌ Erro na importação"
    exit 1
fi
ENDSSH

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Importação concluída com sucesso!"
    echo ""
    echo "📝 Teste a API:"
    echo "   curl 'http://192.168.0.20/api/medications/search?q=paracetamol&limit=5'"
    echo "   curl 'http://192.168.0.20/api/medications/stats'"
else
    echo ""
    echo "❌ Erro durante a importação"
    exit 1
fi


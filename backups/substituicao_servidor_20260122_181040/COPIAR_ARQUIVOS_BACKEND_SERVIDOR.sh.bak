#!/bin/bash

# Script para copiar arquivos do backend para o servidor
# Necessário antes da primeira importação

set -e

# Configurações do servidor
SERVER_HOST="193.203.182.22"
SERVER_PORT="63022"
SERVER_USER="darley"
SERVER_PASS="yhvh77"
SERVER_BACKEND="/var/www/lacos-backend"

echo "📤 Copiando arquivos do backend para o servidor..."
echo "   Servidor: $SERVER_USER@$SERVER_HOST:$SERVER_PORT"
echo ""

# Verificar se sshpass está instalado
if ! command -v sshpass &> /dev/null; then
    echo "❌ sshpass não está instalado"
    echo "   Instale com: sudo apt-get install sshpass"
    exit 1
fi

# Arquivos necessários
FILES=(
    "backend-laravel/database/migrations/2024_12_20_000001_create_medication_catalog_table.php"
    "backend-laravel/app/Models/MedicationCatalog.php"
    "backend-laravel/app/Http/Controllers/Api/MedicationCatalogController.php"
    "backend-laravel/app/Console/Commands/ImportMedicationsFromCSV.php"
)

echo "📋 Arquivos a copiar:"
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✅ $file"
    else
        echo "   ❌ $file (não encontrado)"
    fi
done
echo ""

# Copiar arquivos
for file in "${FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "⚠️  Pulando $file (não encontrado)"
        continue
    fi
    
    # Determinar destino no servidor
    if [[ $file == *"migrations"* ]]; then
        DEST="$SERVER_BACKEND/database/migrations/$(basename $file)"
    elif [[ $file == *"Models"* ]]; then
        DEST="$SERVER_BACKEND/app/Models/$(basename $file)"
    elif [[ $file == *"Controllers"* ]]; then
        DEST="$SERVER_BACKEND/app/Http/Controllers/Api/$(basename $file)"
    elif [[ $file == *"Commands"* ]]; then
        DEST="$SERVER_BACKEND/app/Console/Commands/$(basename $file)"
    else
        DEST="$SERVER_BACKEND/$(basename $file)"
    fi
    
    echo "📤 Copiando $file -> $DEST"
    
    # Criar diretório de destino se necessário
    DIR=$(dirname "$DEST")
    sshpass -p "$SERVER_PASS" ssh -p "$SERVER_PORT" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_HOST" "mkdir -p $DIR" 2>/dev/null || true
    
    # Copiar arquivo
    sshpass -p "$SERVER_PASS" scp -P "$SERVER_PORT" -o StrictHostKeyChecking=no "$file" "$SERVER_USER@$SERVER_HOST:$DEST"
    
    if [ $? -eq 0 ]; then
        echo "   ✅ Copiado com sucesso"
    else
        echo "   ❌ Erro ao copiar"
    fi
done

echo ""
echo "📝 Atualizando rotas no servidor..."
echo ""

# Adicionar rotas (se necessário)
sshpass -p "$SERVER_PASS" ssh -p "$SERVER_PORT" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_HOST" << 'ENDSSH'
cd /var/www/lacos-backend

# Verificar se as rotas já existem
if grep -q "MedicationCatalogController" routes/api.php 2>/dev/null; then
    echo "✅ Rotas já existem"
else
    echo "⚠️  Rotas não encontradas"
    echo "   Você precisa adicionar manualmente em routes/api.php:"
    echo ""
    echo "   use App\Http\Controllers\Api\MedicationCatalogController;"
    echo "   Route::get('/medications/search', [MedicationCatalogController::class, 'search']);"
    echo "   Route::get('/medications/info', [MedicationCatalogController::class, 'getInfo']);"
    echo "   Route::get('/medications/stats', [MedicationCatalogController::class, 'stats']);"
fi
ENDSSH

echo ""
echo "✅ Arquivos copiados!"
echo ""
echo "📝 Próximo passo:"
echo "   ./scripts/IMPORTAR_MEDICAMENTOS_REMOTO.sh"


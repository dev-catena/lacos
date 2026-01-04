#!/bin/bash

# Script para aplicar MedicalSpecialtyController no servidor

BACKEND_DIR="/var/www/lacos-backend"
TMP_DIR="/tmp"

echo "🔧 Aplicando MedicalSpecialtyController..."
echo ""

cd "$BACKEND_DIR" || exit 1

# 1. Criar diretório se não existir
echo "1️⃣ Verificando diretório de controllers..."
sudo mkdir -p app/Http/Controllers/Api
echo "✅ Diretório verificado"

# 2. Criar Model se não existir
echo ""
echo "2️⃣ Criando/atualizando MedicalSpecialty Model..."
if [ -f "$TMP_DIR/MedicalSpecialty_MODEL.php" ]; then
    # Fazer backup se existir
    if [ -f "app/Models/MedicalSpecialty.php" ]; then
        BACKUP_NAME="MedicalSpecialty.php.bak.$(date +%Y%m%d_%H%M%S)"
        sudo cp app/Models/MedicalSpecialty.php "app/Models/$BACKUP_NAME"
        echo "✅ Backup criado: $BACKUP_NAME"
    fi
    
    # Criar diretório Models se não existir
    sudo mkdir -p app/Models
    
    # Copiar model
    sudo cp "$TMP_DIR/MedicalSpecialty_MODEL.php" app/Models/MedicalSpecialty.php
    echo "✅ MedicalSpecialty Model criado/atualizado"
else
    echo "⚠️ Arquivo MedicalSpecialty_MODEL.php não encontrado em $TMP_DIR"
fi

# 3. Criar Controller
echo ""
echo "3️⃣ Criando/atualizando MedicalSpecialtyController..."
if [ -f "$TMP_DIR/MedicalSpecialtyController.php" ]; then
    # Fazer backup se existir
    if [ -f "app/Http/Controllers/Api/MedicalSpecialtyController.php" ]; then
        BACKUP_NAME="MedicalSpecialtyController.php.bak.$(date +%Y%m%d_%H%M%S)"
        sudo cp app/Http/Controllers/Api/MedicalSpecialtyController.php "app/Http/Controllers/Api/$BACKUP_NAME"
        echo "✅ Backup criado: $BACKUP_NAME"
    fi
    
    # Copiar controller
    sudo cp "$TMP_DIR/MedicalSpecialtyController.php" app/Http/Controllers/Api/MedicalSpecialtyController.php
    echo "✅ MedicalSpecialtyController criado/atualizado"
else
    echo "❌ Arquivo MedicalSpecialtyController.php não encontrado em $TMP_DIR"
    exit 1
fi

# 4. Verificar rotas
echo ""
echo "4️⃣ Verificando rotas..."
ROUTES_FILE="routes/api.php"

if ! grep -q "medical-specialties" "$ROUTES_FILE"; then
    echo "⚠️ Rotas de medical-specialties não encontradas em routes/api.php"
    echo "   Adicione manualmente:"
    echo "   Route::get('medical-specialties', [MedicalSpecialtyController::class, 'index']);"
    echo "   Route::get('medical-specialties/{id}', [MedicalSpecialtyController::class, 'show']);"
else
    echo "✅ Rotas encontradas"
fi

# 5. Limpar cache
echo ""
echo "5️⃣ Limpando cache do Laravel..."
php artisan config:clear
php artisan route:clear
php artisan cache:clear
echo "✅ Cache limpo"

echo ""
echo "✅ MedicalSpecialtyController aplicado com sucesso!"
echo ""
echo "📝 Próximos passos:"
echo "   1. Verificar se a tabela medical_specialties existe no banco"
echo "   2. Testar endpoint: GET /api/medical-specialties"
echo "   3. Verificar logs em storage/logs/laravel.log se houver problemas"














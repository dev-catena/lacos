#!/bin/bash

# Script para garantir que a rota de especialidades médicas sempre esteja presente
# Este script verifica e adiciona a rota se ela não existir, mesmo após restaurações

set -e

ROUTES_FILE="/var/www/lacos-backend/routes/api.php"

echo "🔧 Verificando rota de especialidades médicas..."
echo ""

# Verificar se o arquivo existe
if [ ! -f "$ROUTES_FILE" ]; then
    echo "❌ Arquivo de rotas não encontrado: $ROUTES_FILE"
    exit 1
fi

# Verificar se a rota já existe dentro do middleware auth:sanctum
if grep -q "Route::get('/medical-specialties'" "$ROUTES_FILE" && grep -q "MedicalSpecialtyController" "$ROUTES_FILE"; then
    echo "✅ Rota de especialidades médicas já existe"
    
    # Verificar se está dentro do middleware
    if grep -A 10 "Route::middleware('auth:sanctum')" "$ROUTES_FILE" | grep -q "Route::get('/medical-specialties'"; then
        echo "✅ Rota está dentro do middleware auth:sanctum"
        exit 0
    else
        echo "⚠️  Rota existe mas não está dentro do middleware, corrigindo..."
    fi
else
    echo "⚠️  Rota de especialidades médicas não encontrada, adicionando..."
fi

# Fazer backup
BACKUP_FILE="$ROUTES_FILE.backup.antes_especialidades.$(date +%s)"
echo "yhvh77" | sudo -S cp "$ROUTES_FILE" "$BACKUP_FILE" 2>/dev/null || cp "$ROUTES_FILE" "$BACKUP_FILE"
echo "📝 Backup criado: $BACKUP_FILE"
echo ""

# Verificar se o import do controller existe
if ! grep -q "use App\\Http\\Controllers\\Api\\MedicalSpecialtyController;" "$ROUTES_FILE"; then
    echo "📝 Adicionando import do MedicalSpecialtyController..."
    
    # Adicionar após outros imports de controllers
    echo "yhvh77" | sudo -S sed -i "/use App\\Http\\Controllers\\Api\\DoctorController;/a use App\\Http\\Controllers\\Api\\MedicalSpecialtyController;" "$ROUTES_FILE" 2>/dev/null || sed -i "/use App\\Http\\Controllers\\Api\\DoctorController;/a use App\\Http\\Controllers\\Api\\MedicalSpecialtyController;" "$ROUTES_FILE"
fi

# Adicionar rotas dentro do middleware auth:sanctum
# Procurar pela linha "// Doctors & Medical" ou similar e adicionar após
if grep -q "Route::post('doctors/{doctorId}/availability'" "$ROUTES_FILE"; then
    echo "📝 Adicionando rotas após rotas de médicos..."
    
    # Adicionar após a linha de saveAvailability
    echo "yhvh77" | sudo -S sed -i "/Route::post('doctors\/{doctorId}\/availability'/a\\    \\n    // Especialidades Médicas\\n    Route::get('/medical-specialties', [MedicalSpecialtyController::class, 'index']);\\n    Route::get('/medical-specialties/{id}', [MedicalSpecialtyController::class, 'show']);" "$ROUTES_FILE" 2>/dev/null || sed -i "/Route::post('doctors\/{doctorId}\/availability'/a\\    \\n    // Especialidades Médicas\\n    Route::get('/medical-specialties', [MedicalSpecialtyController::class, 'index']);\\n    Route::get('/medical-specialties/{id}', [MedicalSpecialtyController::class, 'show']);" "$ROUTES_FILE"
else
    echo "📝 Adicionando rotas após rotas de emergency-contacts..."
    
    # Adicionar após emergency-contacts se não encontrar doctors
    echo "yhvh77" | sudo -S sed -i "/Route::apiResource('emergency-contacts'/a\\    \\n    // Especialidades Médicas\\n    Route::get('/medical-specialties', [MedicalSpecialtyController::class, 'index']);\\n    Route::get('/medical-specialties/{id}', [MedicalSpecialtyController::class, 'show']);" "$ROUTES_FILE" 2>/dev/null || sed -i "/Route::apiResource('emergency-contacts'/a\\    \\n    // Especialidades Médicas\\n    Route::get('/medical-specialties', [MedicalSpecialtyController::class, 'index']);\\n    Route::get('/medical-specialties/{id}', [MedicalSpecialtyController::class, 'show']);" "$ROUTES_FILE"
fi

# Verificar sintaxe PHP
echo ""
echo "🔍 Verificando sintaxe PHP..."
if php -l "$ROUTES_FILE" > /dev/null 2>&1; then
    echo "✅ Sintaxe PHP válida"
else
    echo "❌ Erro na sintaxe PHP! Restaurando backup..."
    echo "yhvh77" | sudo -S cp "$BACKUP_FILE" "$ROUTES_FILE" 2>/dev/null || cp "$BACKUP_FILE" "$ROUTES_FILE"
    exit 1
fi

# Limpar cache
echo ""
echo "🧹 Limpando cache do Laravel..."
cd /var/www/lacos-backend
php artisan route:clear 2>/dev/null || true
php artisan config:clear 2>/dev/null || true
echo "✅ Cache limpo"

echo ""
echo "=========================================="
echo "✅ Rota de especialidades médicas garantida!"
echo "=========================================="
echo ""
echo "📋 Verificação:"
grep -A 2 "Route::get('/medical-specialties'" "$ROUTES_FILE" | head -3
echo ""


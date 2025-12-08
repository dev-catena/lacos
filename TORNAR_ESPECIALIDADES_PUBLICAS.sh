#!/bin/bash

echo "🔧 Tornando rota de especialidades médicas pública..."
echo ""

cd /var/www/lacos-backend || exit 1

ROUTES_FILE="routes/api.php"
BACKUP_FILE="${ROUTES_FILE}.bak.$(date +%Y%m%d_%H%M%S)"

sudo cp "$ROUTES_FILE" "$BACKUP_FILE"
echo "✅ Backup criado: $BACKUP_FILE"
echo ""

# Mover rotas de medical-specialties para fora do middleware auth:sanctum
# Primeiro, remover as rotas de dentro do middleware
sudo sed -i '/Route::get.*medical-specialties/d' "$ROUTES_FILE"

# Adicionar as rotas na seção de rotas públicas (após login e register)
sudo sed -i "/Route::post('\/login', \[AuthController::class, 'login'\]);/a\\
\\
// Especialidades médicas (públicas para permitir seleção no registro)\\
Route::get('medical-specialties', [MedicalSpecialtyController::class, 'index']);\\
Route::get('medical-specialties/{id}', [MedicalSpecialtyController::class, 'show']);\\
" "$ROUTES_FILE"

# Verificar sintaxe
if php -l "$ROUTES_FILE" > /dev/null 2>&1; then
    echo "✅ Rotas atualizadas"
else
    echo "❌ Erro de sintaxe"
    php -l "$ROUTES_FILE"
    sudo cp "$BACKUP_FILE" "$ROUTES_FILE"
    exit 1
fi
echo ""

# Limpar cache
echo "🧹 Limpando cache..."
php artisan route:clear > /dev/null 2>&1
php artisan config:clear > /dev/null 2>&1
php artisan cache:clear > /dev/null 2>&1
echo "✅ Cache limpo"
echo ""

echo "✅ Concluído!"
echo ""
echo "📋 Resumo:"
echo "   - Rotas medical-specialties movidas para seção pública"
echo "   - Cache limpo"
echo ""


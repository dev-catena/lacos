#!/bin/bash
# Execute este script no servidor: bash EXECUTAR_NO_SERVIDOR.sh

echo "🔧 Instalando rotas de cuidadores profissionais..."
echo ""

cd /var/www/lacos-backend || exit 1

# 1. Copiar arquivos
echo "📝 Copiando arquivos..."
sudo cp /tmp/CaregiverController.php app/Http/Controllers/Api/CaregiverController.php
sudo cp /tmp/CaregiverCourse.php app/Models/CaregiverCourse.php
sudo cp /tmp/CaregiverReview.php app/Models/CaregiverReview.php
sudo chown www-data:www-data app/Http/Controllers/Api/CaregiverController.php app/Models/CaregiverCourse.php app/Models/CaregiverReview.php
echo "✅ Arquivos copiados"
echo ""

# 2. Adicionar import
echo "📝 Adicionando import..."
if ! grep -q "CaregiverController" routes/api.php; then
    sudo sed -i "/use App\\\\Http\\\\Controllers\\\\Api\\\\PopularPharmacyController;/a use App\\\\Http\\\\Controllers\\\\Api\\\\CaregiverController;" routes/api.php
    echo "✅ Import adicionado"
else
    echo "⚠️  Import já existe"
fi
echo ""

# 3. Adicionar rotas
echo "📝 Adicionando rotas..."
if ! grep -q "Route::get('/caregivers'" routes/api.php; then
    # Adicionar antes do último });
    sudo sed -i "s|    Route::post('/alerts/{alertId}/dismiss', \[AlertController::class, 'dismissAlert'\]);|    Route::post('/alerts/{alertId}/dismiss', [AlertController::class, 'dismissAlert']);\n    \n    // Cuidadores Profissionais\n    Route::get('/caregivers', [CaregiverController::class, 'index']);\n    Route::get('/caregivers/{id}', [CaregiverController::class, 'show']);\n    Route::post('/caregivers/{id}/reviews', [CaregiverController::class, 'createReview']);|" routes/api.php
    echo "✅ Rotas adicionadas"
else
    echo "⚠️  Rotas já existem"
fi
echo ""

# 4. Limpar cache
echo "🧹 Limpando cache..."
php artisan route:clear
php artisan config:clear
echo "✅ Cache limpo"
echo ""

# 5. Verificar
echo "📋 Verificando rotas..."
php artisan route:list | grep caregivers

echo ""
echo "✅ Concluído!"


#!/bin/bash

# Script para instalar funcionalidade de preços de farmácias
# Execute no servidor: bash INSTALAR_PRECOS_FARMACIA.sh

cd /var/www/lacos-backend

echo "📦 Criando migration para tabela pharmacy_prices..."

# Criar migration
php artisan make:migration create_pharmacy_prices_table --path=database/migrations

# Copiar conteúdo da migration (se necessário, ajustar o caminho)
# O arquivo create_pharmacy_prices_table.php já foi criado

echo "✅ Migration criada"
echo ""
echo "📝 Execute a migration:"
echo "   php artisan migrate"
echo ""
echo "🛣️  Adicione as rotas em routes/api.php:"
echo "   Route::get('/pharmacy-prices/last', [PharmacyPriceController::class, 'getLastPrice']);"
echo "   Route::post('/pharmacy-prices', [PharmacyPriceController::class, 'store']);"
echo "   Route::get('/pharmacy-prices/history', [PharmacyPriceController::class, 'getHistory']);"
echo ""
echo "✅ Instalação concluída!"



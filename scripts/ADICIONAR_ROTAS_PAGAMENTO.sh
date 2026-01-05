#!/bin/bash

# Script para adicionar rotas de pagamento no routes/api.php

echo "🔧 Adicionando rotas de pagamento..."

cd /var/www/lacos-backend

# Fazer backup
cp routes/api.php routes/api.php.backup.pagamento.$(date +%Y%m%d_%H%M%S)

# Verificar se as rotas já existem
if grep -q "payments/create-intent" routes/api.php; then
    echo "⚠️ Rotas de pagamento já existem no arquivo"
    exit 0
fi

# Encontrar a linha onde adicionar as rotas (após appointments)
# Procurar por "Route::apiResource('appointments'" e adicionar após essa seção

# Criar arquivo temporário com as rotas
cat > /tmp/rotas_pagamento.txt << 'EOF'
    
    // Pagamentos
    Route::post('/payments/create-intent', [App\Http\Controllers\Api\PaymentController::class, 'createIntent']);
    Route::post('/payments/confirm', [App\Http\Controllers\Api\PaymentController::class, 'confirm']);
    Route::get('/payments/status/{paymentIntentId}', [App\Http\Controllers\Api\PaymentController::class, 'checkStatus']);
EOF

# Adicionar as rotas após a linha de appointments
# Procurar por "Route::apiResource('appointments'" e adicionar após a próxima linha vazia
sed -i '/Route::apiResource.*appointments/a\
\
    // Pagamentos\
    Route::post('\''/payments/create-intent'\'', [App\\Http\\Controllers\\Api\\PaymentController::class, '\''createIntent'\'']);\
    Route::post('\''/payments/confirm'\'', [App\\Http\\Controllers\\Api\\PaymentController::class, '\''confirm'\'']);\
    Route::get('\''/payments/status/{paymentIntentId}'\'', [App\\Http\\Controllers\\Api\\PaymentController::class, '\''checkStatus'\'']);' routes/api.php

# Verificar sintaxe
echo ""
echo "📋 Verificando sintaxe PHP..."
php -l routes/api.php

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Rotas de pagamento adicionadas com sucesso!"
    echo ""
    echo "📝 Próximos passos:"
    echo "   1. Limpar cache: php artisan config:clear && php artisan route:clear"
    echo "   2. Verificar rotas: php artisan route:list | grep payment"
else
    echo ""
    echo "❌ Erro na sintaxe. Restaurando backup..."
    cp routes/api.php.backup.pagamento.* routes/api.php
    echo "   Backup restaurado. Verifique manualmente."
fi


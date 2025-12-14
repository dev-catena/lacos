#!/bin/bash

# Script para adicionar rotas de pagamento manualmente (método mais seguro)

echo "📝 Instruções para adicionar rotas de pagamento:"
echo ""
echo "1. Edite o arquivo routes/api.php:"
echo "   nano routes/api.php"
echo ""
echo "2. Encontre a seção de Appointments (por volta da linha 89):"
echo "   // Appointments & Consultations"
echo "   Route::apiResource('appointments', AppointmentController::class);"
echo "   Route::apiResource('consultations', ConsultationController::class);"
echo ""
echo "3. Adicione APÓS essa seção (antes de '// Vital Signs'):"
echo ""
echo "   // Pagamentos"
echo "   Route::post('/payments/create-intent', [App\Http\Controllers\Api\PaymentController::class, 'createIntent']);"
echo "   Route::post('/payments/confirm', [App\Http\Controllers\Api\PaymentController::class, 'confirm']);"
echo "   Route::get('/payments/status/{paymentIntentId}', [App\Http\Controllers\Api\PaymentController::class, 'checkStatus']);"
echo ""
echo "4. Salve o arquivo (Ctrl+O, Enter, Ctrl+X)"
echo ""
echo "5. Verifique a sintaxe:"
echo "   php -l routes/api.php"
echo ""
echo "6. Limpe o cache:"
echo "   php artisan config:clear && php artisan route:clear"


#!/bin/bash

# Script para adicionar todas as rotas do app mobile ao routes/api.php

set -e

cd /var/www/lacos-backend

echo "🔧 Adicionando rotas do app mobile ao routes/api.php..."
echo ""

# 1. Verificar se routes/api.php existe
if [ ! -f "routes/api.php" ]; then
    echo "❌ routes/api.php não existe!"
    exit 1
fi

# 2. Fazer backup
echo "1️⃣ Fazendo backup..."
cp routes/api.php routes/api.php.backup.$(date +%s)
echo "✅ Backup criado"
echo ""

# 3. Verificar se já tem rotas do app mobile
if grep -q "Route::apiResource('groups'" routes/api.php || grep -q "Route::get('/groups'" routes/api.php; then
    echo "✅ Rotas de grupos já existem"
else
    echo "📝 Adicionando rotas do app mobile..."
    
    # Ler o arquivo routes_api_corrigido.php para pegar todas as rotas
    if [ -f "routes_api_corrigido.php" ]; then
        echo "📄 Usando routes_api_corrigido.php como referência..."
        
        # Extrair apenas as rotas autenticadas relevantes
        # Vou adicionar manualmente as principais rotas
        cat >> routes/api.php << 'EOF'

// ==================== ROTAS DO APP MOBILE ====================

use App\Http\Controllers\Api\GroupController;
use App\Http\Controllers\Api\MedicationController;
use App\Http\Controllers\Api\DoseHistoryController;
use App\Http\Controllers\Api\DoctorController;
use App\Http\Controllers\Api\EmergencyContactController;
use App\Http\Controllers\Api\MedicalSpecialtyController;
use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\VitalSignController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\ConsultationController;
use App\Http\Controllers\Api\OccurrenceController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\PopularPharmacyController;
use App\Http\Controllers\Api\CaregiverController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PlanController;

Route::middleware('auth:sanctum')->group(function () {
    
    // User & Auth
    Route::get('/user', function (\Illuminate\Http\Request $request) {
        return response()->json($request->user());
    });
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::put('/users/{id}', [App\Http\Controllers\Api\UserController::class, 'update']);
    Route::get('/user/plan', [PlanController::class, 'getUserPlan']);
    
    // Groups
    Route::apiResource('groups', GroupController::class);
    Route::get('groups/{group}/members', [GroupController::class, 'members']);
    Route::post('groups/{group}/members', [GroupController::class, 'addMember']);
    Route::delete('groups/{group}/members/{member}', [GroupController::class, 'removeMember']);
    Route::post('groups/{group}/generate-code', [GroupController::class, 'generateCode']);
    Route::post('groups/join', [GroupController::class, 'joinByCode']);
    Route::post('groups/{groupId}/photo', [GroupController::class, 'uploadPhoto']);
    
    // Group Roles & Activities
    Route::get('/groups/{groupId}/user/roles', [GroupController::class, 'getUserRoles']);
    Route::post('/groups/{groupId}/members/{userId}/roles', [GroupController::class, 'manageUserRole']);
    Route::put('/groups/{groupId}/members/{memberId}/role', [GroupController::class, 'updateMemberRole']);
    Route::delete('/groups/{groupId}/members/{memberId}', [GroupController::class, 'removeMember']);
    
    // Medications & Dose History
    Route::get('/medications/price', [MedicationController::class, 'getPrice']);
    Route::apiResource('medications', MedicationController::class);
    Route::apiResource('dose-history', DoseHistoryController::class);
    
    // Doctors
    Route::apiResource('doctors', DoctorController::class);
    Route::get('doctors/{doctorId}/availability', [DoctorController::class, 'getAvailability']);
    Route::post('doctors/{doctorId}/availability', [DoctorController::class, 'saveAvailability']);
    
    // Emergency Contacts
    Route::apiResource('emergency-contacts', EmergencyContactController::class);
    
    // Appointments & Consultations
    Route::apiResource('appointments', AppointmentController::class);
    Route::apiResource('consultations', ConsultationController::class);
    
    // Vital Signs
    Route::apiResource('vital-signs', VitalSignController::class);
    
    // Messages
    Route::get("/messages/conversation/{userId}", [MessageController::class, "getConversation"]);
    Route::get("/messages/conversations", [MessageController::class, "getConversations"]);
    Route::post("/messages", [MessageController::class, "sendMessage"]);
    Route::post("/messages/{userId}/read", [MessageController::class, "markAsRead"]);
    Route::get("/messages/group/{groupId}", [MessageController::class, "getGroupMessages"]);
    Route::post("/messages/group", [MessageController::class, "sendGroupMessage"]);
    
    // Documents
    Route::apiResource('documents', DocumentController::class);
    
    // Popular Pharmacies
    Route::get('/popular-pharmacies', [PopularPharmacyController::class, 'index']);
    Route::get('/popular-pharmacies/nearby', [PopularPharmacyController::class, 'getNearby']);
    
    // Payments
    Route::post('/payments/create-intent', [PaymentController::class, 'createIntent']);
    Route::post('/payments/confirm', [PaymentController::class, 'confirm']);
});
EOF
        echo "✅ Rotas do app mobile adicionadas"
    else
        echo "⚠️  routes_api_corrigido.php não encontrado"
        echo "   Adicionando apenas rotas básicas de grupos..."
        
        # Adicionar apenas rotas básicas
        cat >> routes/api.php << 'EOF'

// Rotas de grupos
use App\Http\Controllers\Api\GroupController;

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('groups', GroupController::class);
    Route::get('groups/{group}/members', [GroupController::class, 'members']);
    Route::post('groups/{group}/members', [GroupController::class, 'addMember']);
    Route::post('groups/join', [GroupController::class, 'joinByCode']);
});
EOF
        echo "✅ Rotas básicas de grupos adicionadas"
    fi
fi

# 4. Verificar sintaxe
echo ""
echo "2️⃣ Verificando sintaxe..."
if php -l routes/api.php 2>&1 | grep -q "No syntax errors"; then
    echo "✅ Sintaxe OK"
else
    echo "❌ Erro de sintaxe:"
    php -l routes/api.php
    echo ""
    echo "⚠️  Restaurando backup..."
    LATEST_BACKUP=$(ls -t routes/api.php.backup.* | head -1)
    if [ -n "$LATEST_BACKUP" ]; then
        cp "$LATEST_BACKUP" routes/api.php
        echo "✅ Backup restaurado"
    fi
    exit 1
fi
echo ""

# 5. Limpar cache
echo "3️⃣ Limpando cache..."
php artisan route:clear 2>/dev/null || true
php artisan config:clear 2>/dev/null || true
php artisan cache:clear 2>/dev/null || true
echo "✅ Caches limpos"
echo ""

# 6. Listar rotas de grupos
echo "4️⃣ Listando rotas de grupos..."
php artisan route:list 2>/dev/null | grep -i "groups" | head -10 || echo "⚠️  Nenhuma rota encontrada"
echo ""

# 7. Testar rota
echo "5️⃣ Testando rota /api/groups..."
echo "   (Esta rota requer autenticação, então 401 é esperado sem token)"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET http://localhost/api/groups 2>&1)

if [ "$HTTP_CODE" = "401" ]; then
    echo "   ✅ Rota /api/groups acessível (401 é esperado sem token)"
elif [ "$HTTP_CODE" = "404" ]; then
    echo "   ❌ Rota /api/groups NÃO encontrada (404)"
else
    echo "   📊 Código HTTP: $HTTP_CODE"
fi
echo ""

echo "✅ Verificação concluída!"
echo ""
echo "📝 Próximos passos:"
echo "   1. Teste o login no app mobile"
echo "   2. Verifique se os grupos aparecem"
echo "   3. Se não aparecer, verifique os logs do app"


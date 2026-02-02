#!/bin/bash

# Script para restaurar todas as rotas da API
# Execute com: sudo bash RESTAURAR_ROTAS_COMPLETAS.sh

set -e

cd /var/www/lacos-backend

echo "🔧 Restaurando todas as rotas da API..."
echo ""

# Fazer backup
echo "📝 Fazendo backup do routes/api.php..."
BACKUP_FILE="routes/api.php.bak.$(date +%Y%m%d_%H%M%S)"
cp routes/api.php "$BACKUP_FILE"
echo "✅ Backup criado: $BACKUP_FILE"
echo ""

# Criar arquivo completo de rotas
cat > routes/api.php << 'ROUTES_FILE'
<?php

use App\Http\Controllers\Api\MediaController;
use App\Http\Controllers\Api\AlertController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
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
use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\AdminDoctorController;
use App\Http\Controllers\Api\AdminAuthController;
use App\Http\Controllers\Api\GatewayController;
use App\Http\Controllers\Api\FallSensorController;

// ==================== ROTAS PÚBLICAS ====================

// Gateway Status
Route::get('/gateway/status', [GatewayController::class, 'status']);

// Login e Register para app mobile
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/2fa/login/verify', [AuthController::class, 'verify2FALogin']);

// Login Admin/Root
Route::post('/admin/login', [AdminAuthController::class, 'login']);

// Especialidades médicas (públicas para permitir seleção no registro)
Route::get('medical-specialties', [MedicalSpecialtyController::class, 'index']);
Route::get('medical-specialties/{id}', [MedicalSpecialtyController::class, 'show']);

// Ativação de conta de médico (rota pública)
Route::get('doctors/activate', [AdminDoctorController::class, 'activate']);

// Temporário: Occurrences SEM autenticação (para teste)
Route::apiResource('occurrences', OccurrenceController::class);

// ==================== ROTAS AUTENTICADAS ====================

Route::middleware('auth:sanctum')->group(function () {
    
    // User & Auth
    Route::get('/user', function (Request $request) {
        $user = $request->user();
        
        // Verificar se o usuário está bloqueado
        if ($user && $user->is_blocked) {
            // Revogar todos os tokens do usuário bloqueado
            $user->tokens()->delete();
            
            return response()->json([
                'message' => 'Acesso negado. Sua conta foi bloqueada.',
                'error' => 'account_blocked'
            ], 403);
        }
        
        return response()->json($user);
    });
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);
    
    // 2FA (Autenticação de Dois Fatores)
    Route::post('/2fa/enable', [AuthController::class, 'enable2FA']);
    Route::post('/2fa/disable', [AuthController::class, 'disable2FA']);
    Route::post('/2fa/send-code', [AuthController::class, 'send2FACode']);
    Route::post('/2fa/verify-code', [AuthController::class, 'verify2FACode']);
    
    Route::put('/users/{id}', [App\Http\Controllers\Api\UserController::class, 'update']);
    Route::get('/user/plan', [PlanController::class, 'getUserPlan']);
    
    // Plans (Gestão de Planos - Root User)
    Route::apiResource('plans', PlanController::class);
    
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
    Route::get('/groups/{groupId}/activities', [App\Http\Controllers\Api\GroupActivityController::class, 'index']);
    Route::get('/activities/recent', [App\Http\Controllers\Api\GroupActivityController::class, 'recent']);
    
    // Medications & Dose History
    // IMPORTANTE: Esta rota deve vir ANTES do apiResource para evitar conflito
    Route::get('/medications/price', [MedicationController::class, 'getPrice']);
    Route::apiResource('medications', MedicationController::class);
    Route::apiResource('dose-history', DoseHistoryController::class);
    
    // Pharmacy Prices (Preços informados por usuários)
    Route::get('/pharmacy-prices/last', [App\Http\Controllers\Api\PharmacyPriceController::class, 'getLastPrice']);
    Route::post('/pharmacy-prices', [App\Http\Controllers\Api\PharmacyPriceController::class, 'store']);
    Route::get('/pharmacy-prices/history', [App\Http\Controllers\Api\PharmacyPriceController::class, 'getHistory']);
    
    // Popular Pharmacies (Farmácias Populares)
    Route::get('/popular-pharmacies', [PopularPharmacyController::class, 'index']);
    Route::get('/popular-pharmacies/nearby', [PopularPharmacyController::class, 'getNearby']);
    Route::get('/popular-pharmacies/by-location', [PopularPharmacyController::class, 'getByLocation']);
    
    // Doctors & Medical
    Route::apiResource('doctors', DoctorController::class);
    Route::get('doctors/{doctorId}/availability', [DoctorController::class, 'getAvailability']);
    Route::post('doctors/{doctorId}/availability', [DoctorController::class, 'saveAvailability']);
    
    // Emergency Contacts
    Route::apiResource('emergency-contacts', EmergencyContactController::class);
    Route::post('/emergency-contacts/{id}', [EmergencyContactController::class, 'update']); // Method spoofing
    
    // Appointments & Consultations
    Route::apiResource('appointments', AppointmentController::class);
    Route::apiResource('consultations', ConsultationController::class);
    
    // Pagamentos
    Route::post('/payments/create-intent', [PaymentController::class, 'createIntent']);
    Route::post('/payments/confirm', [PaymentController::class, 'confirm']);
    Route::get('/payments/status/{paymentIntentId}', [PaymentController::class, 'checkStatus']);
    
    // Vital Signs
    Route::apiResource('vital-signs', VitalSignController::class);
    
    // Fall Sensor (Sensor de Queda)
    Route::post('/groups/{groupId}/fall-sensor/data', [FallSensorController::class, 'store']);
    Route::get('/groups/{groupId}/fall-sensor/history', [FallSensorController::class, 'index']);
    Route::get('/groups/{groupId}/fall-sensor/latest', [FallSensorController::class, 'getLatest']);
    Route::get('/groups/{groupId}/fall-sensor/alerts', [FallSensorController::class, 'getFallAlerts']);
    
    // Documents (Documentos)
    Route::apiResource('documents', DocumentController::class);
    Route::get('documents/{id}/download', [DocumentController::class, 'download']);
    
    // Panic Button
    Route::post('panic/trigger', [App\Http\Controllers\Api\PanicController::class, 'trigger']);
    Route::put('panic/{eventId}/end-call', [App\Http\Controllers\Api\PanicController::class, 'endCall']);
    Route::get('panic', [App\Http\Controllers\Api\PanicController::class, 'index']);
    Route::get('panic/config/{groupId}', [App\Http\Controllers\Api\PanicController::class, 'checkConfig']);
    
    // ==================== MÍDIAS ====================
    
    // Listar mídias de um grupo
    Route::get('/groups/{groupId}/media', [MediaController::class, 'index']);
    
    // Postar nova mídia
    Route::post('/groups/{groupId}/media', [MediaController::class, 'store']);
    
    // Deletar mídia
    Route::delete('/media/{mediaId}', [MediaController::class, 'destroy']);
    
    // ==================== ALERTAS ====================
    
    // Listar alertas ativos
    Route::get('/groups/{groupId}/alerts/active', [AlertController::class, 'getActiveAlerts']);
    
    // Marcar medicamento como tomado
    Route::post('/alerts/{alertId}/taken', [AlertController::class, 'markMedicationTaken']);
    
    // Dispensar alerta
    Route::post('/alerts/{alertId}/dismiss', [AlertController::class, 'dismissAlert']);
    
    // ==================== CUIDADORES PROFISSIONAIS ====================
    
    // Rotas de clientes (devem vir ANTES de /caregivers/{id})
    Route::get('/caregivers/clients', [CaregiverController::class, 'getClients']);
    Route::get('/caregivers/clients/{id}', [CaregiverController::class, 'getClientDetails']);
    Route::post('/caregivers/clients/{id}/reviews', [CaregiverController::class, 'createClientReview']);
    
    // Rotas gerais de cuidadores
    Route::get('/caregivers', [CaregiverController::class, 'index']);
    Route::get('/caregivers/{id}', [CaregiverController::class, 'show']);
    Route::post('/caregivers/{id}/reviews', [CaregiverController::class, 'createReview']);
    
    // Rotas de mensagens
    Route::get("/messages/conversation/{userId}", [MessageController::class, "getConversation"]);
    Route::get("/messages/conversations", [MessageController::class, "getConversations"]);
    Route::post("/messages", [MessageController::class, "sendMessage"]);
    Route::post("/messages/{userId}/read", [MessageController::class, "markAsRead"]);
    
    // Rotas de mensagens de grupo
    Route::get("/messages/group/{groupId}", [MessageController::class, "getGroupMessages"]);
    Route::post("/messages/group", [MessageController::class, "sendGroupMessage"]);
    
    // ==================== ROTAS ADMIN (ROOT USER) ====================
    
    // Logout Admin
    Route::post('/admin/logout', [AdminAuthController::class, 'logout']);
    
    // Gestão de Usuários
    Route::prefix('admin')->group(function () {
        // Usuários
        Route::get('/users', [AdminUserController::class, 'index']);
        Route::post('/users/{id}/block', [AdminUserController::class, 'block']);
        Route::post('/users/{id}/unblock', [AdminUserController::class, 'unblock']);
        Route::get('/users/{id}/plan', [AdminUserController::class, 'getUserPlan']);
        Route::delete('/users/{id}', [AdminUserController::class, 'destroy']);
        
        // Médicos
        Route::get('/doctors/pending', [AdminDoctorController::class, 'getPending']);
        Route::get('/doctors', [AdminDoctorController::class, 'index']);
        Route::post('/doctors/{id}/approve', [AdminDoctorController::class, 'approve']);
        Route::post('/doctors/{id}/reject', [AdminDoctorController::class, 'reject']);
        Route::post('/doctors/{id}/block', [AdminDoctorController::class, 'block']);
        Route::put('/doctors/{id}', [AdminDoctorController::class, 'update']);
        Route::delete('/doctors/{id}', [AdminDoctorController::class, 'destroy']);
    });
    
});
ROUTES_FILE

# Ajustar permissões
chown www-data:www-data routes/api.php

echo "✅ Arquivo routes/api.php restaurado com todas as rotas!"
echo ""

# Limpar cache
echo "🧹 Limpando cache do Laravel..."
php artisan route:clear
php artisan config:clear
php artisan cache:clear

echo ""
echo "✅ Rotas restauradas com sucesso!"
echo ""
echo "📋 Verificando rotas..."
php artisan route:list 2>/dev/null | grep -E "login|register|doctors|groups" | head -10 || echo "⚠️  Execute 'php artisan route:list' para ver todas as rotas"
echo ""
echo "✅ Concluído! Todas as rotas foram restauradas."

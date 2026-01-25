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
use App\Http\Controllers\Api\ConsultationController;
use App\Http\Controllers\Api\OccurrenceController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\PopularPharmacyController;
use App\Http\Controllers\Api\CaregiverController;

// ==================== ROTAS PÚBLICAS ====================

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Temporário: Occurrences SEM autenticação (para teste)
Route::apiResource('occurrences', OccurrenceController::class);

// ==================== ROTAS AUTENTICADAS ====================

Route::middleware('auth:sanctum')->group(function () {
    
    // User & Auth
    Route::get('/user', function (Request $request) {
        return response()->json($request->user());
    });
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::put('/users/{id}', [App\Http\Controllers\Api\UserController::class, 'update']);
    
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
    Route::get('medical-specialties', [MedicalSpecialtyController::class, 'index']);
    Route::get('medical-specialties/{id}', [MedicalSpecialtyController::class, 'show']);
    
    // Emergency Contacts
    Route::apiResource('emergency-contacts', EmergencyContactController::class);
    Route::post('/emergency-contacts/{id}', [EmergencyContactController::class, 'update']); // Method spoofing
    
    // Appointments & Consultations
    Route::apiResource('appointments', AppointmentController::class);
    Route::apiResource('consultations', ConsultationController::class);
    
    // Vital Signs
    Route::apiResource('vital-signs', VitalSignController::class);
    
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
    
    Route::get('/caregivers', [CaregiverController::class, 'index']);
    Route::get('/caregivers/{id}', [CaregiverController::class, 'show']);
    Route::post('/caregivers/{id}/reviews', [CaregiverController::class, 'createReview']);
    
});


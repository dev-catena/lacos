<?php

use App\Http\Controllers\Api\AdminAuthController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\GatewayController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\MedicationCatalogController;
use App\Http\Controllers\Api\ChangePasswordController;
use App\Http\Controllers\Api\NotificationPreferenceController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\SupplierProductController;
use App\Http\Controllers\Api\SupplierOrderController;
use App\Http\Controllers\Api\SupplierMessageController;
use App\Http\Controllers\Api\StoreController;
use App\Http\Controllers\Api\PlanController;
use App\Http\Controllers\Api\GroupController;
use App\Http\Controllers\Api\CaregiverController;
use App\Http\Controllers\Api\MedicationController;
use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\GroupActivityController;
use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\AdminDoctorController;
use App\Http\Controllers\Api\AdminCaregiverController;
use App\Http\Controllers\Api\DeviceController;
use App\Http\Controllers\Api\DoctorController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\MediaController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\PanicController;
use App\Http\Controllers\Api\AlertController;
use App\Http\Controllers\Api\EmergencyContactController;
use App\Http\Controllers\Api\MedicalSpecialtyController;
use App\Http\Controllers\Api\GroupMessageController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PrescriptionController;
use App\Http\Controllers\Api\SystemSettingController;
use App\Http\Controllers\Api\VitalSignController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Gateway Status - Rota pública
Route::get('/gateway/status', [GatewayController::class, 'status']);

// ==================== ROTAS PÚBLICAS DE MEDICAMENTOS ====================
// Busca de medicamentos (público - não requer autenticação)
Route::get('/medications/search', [MedicationCatalogController::class, 'search']);
Route::get('/medications/info', [MedicationCatalogController::class, 'getInfo']);
Route::get('/medications/stats', [MedicationCatalogController::class, 'stats']);

// ==================== ROTAS PÚBLICAS DA LOJA ====================
// Listar produtos (público, mas verifica plano se autenticado)
Route::get('/store/products', [StoreController::class, 'getProducts']);
Route::get('/store/products/{id}', [StoreController::class, 'getProduct']);

// ==================== ROTAS PÚBLICAS DE AUTENTICAÇÃO ====================

// Login e Register para app mobile
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/2fa/login/verify', [AuthController::class, 'verify2FALogin']);

// Login Admin/Root - Rota pública
Route::post('/admin/login', [AdminAuthController::class, 'login']);

// Logout Admin - Requer autenticação
Route::middleware('auth:sanctum')->post('/admin/logout', [AdminAuthController::class, 'logout']);

// Especialidades Médicas (públicas para permitir seleção no registro)
Route::get('/medical-specialties', [MedicalSpecialtyController::class, 'index']);
Route::get('/medical-specialties/{id}', [MedicalSpecialtyController::class, 'show']);

// Ativação de médico via token (rota pública - link do email)
Route::get('/doctors/activate', [AdminDoctorController::class, 'activate']);

// ==================== ROTAS ADMIN AUTENTICADAS ====================
Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
    // Gestão de Usuários (apenas root/admin)
    Route::get('/users', [AdminUserController::class, 'index']);
    Route::post('/users/{id}/block', [AdminUserController::class, 'block']);
    Route::post('/users/{id}/unblock', [AdminUserController::class, 'unblock']);
    Route::get('/users/{id}/plan', [AdminUserController::class, 'getUserPlan']);
    Route::put('/users/{id}/plan', [AdminUserController::class, 'updateUserPlan']);
    Route::delete('/users/{id}', [AdminUserController::class, 'destroy']);
    
    // Gestão de Médicos (apenas root/admin)
    Route::get('/doctors', [AdminDoctorController::class, 'index']);
    Route::get('/doctors/pending', [AdminDoctorController::class, 'getPending']);
    Route::get('/doctors/{id}', [AdminDoctorController::class, 'show']);
    Route::post('/doctors/{id}/approve', [AdminDoctorController::class, 'approve']);
    Route::post('/doctors/{id}/reject', [AdminDoctorController::class, 'reject']);
    Route::post('/doctors/{id}/block', [AdminDoctorController::class, 'block']);
    Route::put('/doctors/{id}', [AdminDoctorController::class, 'update']);
    Route::delete('/doctors/{id}', [AdminDoctorController::class, 'destroy']);
    
    // Gestão de Cuidadores (apenas root/admin)
    Route::get('/caregivers', [AdminCaregiverController::class, 'index']);
    Route::get('/caregivers/{id}', [AdminCaregiverController::class, 'show']);
    Route::get('/caregivers/{id}/patients', [AdminCaregiverController::class, 'getPatients']);
    
    // Gestão de Dispositivos/Smartwatch (apenas root/admin)
    Route::get('/devices', [DeviceController::class, 'index']);
    Route::get('/devices/{id}', [DeviceController::class, 'show']);
    Route::post('/devices', [DeviceController::class, 'store']);
    Route::put('/devices/{id}', [DeviceController::class, 'update']);
    Route::delete('/devices/{id}', [DeviceController::class, 'destroy']);
});

// ==================== ROTAS AUTENTICADAS ====================

Route::middleware('auth:sanctum')->group(function () {
    // User & Auth
    Route::get('/user', function (Request $request) {
        $user = $request->user();
        
        // Verificar se o usuário está bloqueado
        if ($user && $user->is_blocked) {
            $user->tokens()->delete();
            
            return response()->json([
                'message' => 'Acesso negado. Sua conta foi bloqueada.',
                'error' => 'account_blocked'
            ], 403);
        }
        
        // Carregar relacionamentos importantes
        if ($user) {
            $user->load(['caregiverCourses', 'medicalSpecialty']);
            
            // Garantir que os cursos sejam incluídos na resposta
            $userData = $user->toArray();
            $courses = $user->caregiverCourses->map(function($course) {
                return [
                    'id' => $course->id,
                    'name' => $course->name,
                    'institution' => $course->institution,
                    'year' => $course->year,
                    'description' => $course->description,
                    'certificate_url' => $course->certificate_url,
                ];
            })->toArray();
            
            $userData['caregiver_courses'] = $courses;
            $userData['caregiverCourses'] = $courses; // Para compatibilidade
            
            return response()->json($userData);
        }
        
        return response()->json($user);
    });
    
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/change-password', [ChangePasswordController::class, 'changePassword']);
    
    // Preferências de Notificação
    Route::get('/notification-preferences', [NotificationPreferenceController::class, 'index']);
    Route::put('/notification-preferences', [NotificationPreferenceController::class, 'update']);
    
    // Notificações
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::put('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);
    Route::delete('/notifications/clear/all', [NotificationController::class, 'destroyAll']);
    
    // Fornecedores
    Route::post('/suppliers/register', [SupplierController::class, 'register']);
    Route::get('/suppliers/me', [SupplierController::class, 'getMySupplier']);
    
    // Gestão de Fornecedores (apenas root)
    Route::get('/suppliers', [SupplierController::class, 'index']);
    Route::put('/suppliers/{id}/approve', [SupplierController::class, 'approve']);
    Route::put('/suppliers/{id}/reject', [SupplierController::class, 'reject']);
    Route::delete('/suppliers/{id}', [SupplierController::class, 'destroy']);
    
    // Produtos do Fornecedor
    Route::get('/suppliers/products', [SupplierProductController::class, 'index']);
    Route::post('/suppliers/products', [SupplierProductController::class, 'store']);
    Route::put('/suppliers/products/{id}', [SupplierProductController::class, 'update']);
    Route::delete('/suppliers/products/{id}', [SupplierProductController::class, 'destroy']);
    Route::patch('/suppliers/products/{id}/toggle-status', [SupplierProductController::class, 'toggleStatus']);
    
    // Pedidos do Fornecedor
    Route::get('/suppliers/orders', [SupplierOrderController::class, 'index']);
    Route::get('/suppliers/orders/{id}', [SupplierOrderController::class, 'show']);
    Route::patch('/suppliers/orders/{id}/status', [SupplierOrderController::class, 'updateStatus']);
    
    // Mensagens do Fornecedor
    Route::get('/suppliers/conversations', [SupplierMessageController::class, 'index']);
    Route::get('/suppliers/conversations/{id}/messages', [SupplierMessageController::class, 'getMessages']);
    Route::post('/suppliers/conversations/{id}/messages', [SupplierMessageController::class, 'sendMessage']);
    
    // Loja - Pedidos do Cliente
    Route::post('/store/orders', [StoreController::class, 'createOrder']);
    Route::get('/store/orders', [StoreController::class, 'getOrders']);
    Route::get('/store/orders/{id}', [StoreController::class, 'getOrder']);
    Route::post('/store/orders/{id}/cancel', [StoreController::class, 'cancelOrder']);
    Route::get('/store/orders/{id}/conversation', [StoreController::class, 'getOrderConversation']);
    Route::get('/store/conversations/{id}/messages', [StoreController::class, 'getConversationMessages']);
    Route::post('/store/conversations/{id}/messages', [StoreController::class, 'sendMessage']);
    
    Route::put('/users/{id}', [App\Http\Controllers\Api\UserController::class, 'update']);
    Route::post('/users/{id}/certificate', [App\Http\Controllers\Api\UserController::class, 'uploadCertificate']);
    
    // Grupos - Gestão de Grupos
    Route::get('/groups', [GroupController::class, 'index']);
    Route::get('/groups/{id}', [GroupController::class, 'show']);
    Route::post('/groups', [GroupController::class, 'store']);
    Route::post('/groups/join', [GroupController::class, 'join']);
    Route::put('/groups/{id}', [GroupController::class, 'update']);
    Route::post('/groups/{id}/photo', [GroupController::class, 'uploadPhoto']);
    Route::delete('/groups/{id}', [GroupController::class, 'destroy']);
    Route::get('/groups/{id}/members', [GroupController::class, 'members']);
    Route::put('/groups/{groupId}/members/{memberId}/role', [GroupController::class, 'updateMemberRole']);
    Route::delete('/groups/{groupId}/members/{memberId}', [GroupController::class, 'removeMember']);
    
    // Dispositivos - Dispositivos dos Grupos (Smartwatch e Sensores)
    Route::get('/groups/{groupId}/devices', [DeviceController::class, 'getGroupDevices']);
    Route::post('/groups/{groupId}/devices', [DeviceController::class, 'createGroupDevice']);
    Route::delete('/groups/{groupId}/devices/{deviceId}', [DeviceController::class, 'destroy']);
    
    // Mídias - Mídias dos Grupos
    Route::get('/groups/{groupId}/media', [MediaController::class, 'index']);
    Route::post('/groups/{groupId}/media', [MediaController::class, 'store']);
    Route::delete('/media/{mediaId}', [MediaController::class, 'destroy']);
    
    // Alertas - Alertas dos Grupos
    Route::get('/groups/{groupId}/alerts/active', [AlertController::class, 'getActiveAlerts']);
    
    // Atividades - Atividades dos Grupos
    Route::get('/activities/recent', [GroupActivityController::class, 'recent']);
    Route::get('/groups/{groupId}/activities', [GroupActivityController::class, 'index']);
    Route::delete('/activities/{id}', [GroupActivityController::class, 'destroy']);
    
    // Compromissos (Agenda) - Gestão de Compromissos
    Route::get('/appointments', [AppointmentController::class, 'index']);
    Route::post('/appointments', [AppointmentController::class, 'store']);
    Route::get('/appointments/{id}', [AppointmentController::class, 'show']);
    Route::put('/appointments/{id}', [AppointmentController::class, 'update']);
    Route::delete('/appointments/{id}', [AppointmentController::class, 'destroy']);
    Route::post('/appointments/{id}/confirm', [AppointmentController::class, 'confirm']);
    Route::post('/appointments/{id}/cancel', [AppointmentController::class, 'cancel']);
    Route::post('/appointments/{id}/payment', [AppointmentController::class, 'processPayment']);
    Route::get('/appointments/{id}/payment-status', [AppointmentController::class, 'paymentStatus']);
    
    // Configurações do Sistema
    Route::get('/system-settings', [SystemSettingController::class, 'index']);
    Route::get('/system-settings/recording', [SystemSettingController::class, 'getRecordingSettings']);
    Route::get('/system-settings/{key}', [SystemSettingController::class, 'show']);
    Route::put('/system-settings/{key}', [SystemSettingController::class, 'update']);
    
    // Medicamentos - Gestão de Medicamentos do Grupo
    Route::get('/medications', [MedicationController::class, 'index']);
    Route::post('/medications', [MedicationController::class, 'store']);
    Route::put('/medications/{id}', [MedicationController::class, 'update']);
    Route::delete('/medications/{id}', [MedicationController::class, 'destroy']);
    Route::patch('/medications/{id}/toggle-active', [MedicationController::class, 'toggleActive']);
    
    // Receitas - Gestão de Receitas do Grupo
    Route::get('/prescriptions', [PrescriptionController::class, 'index']);
    Route::post('/prescriptions', [PrescriptionController::class, 'store']);
    Route::get('/prescriptions/{id}', [PrescriptionController::class, 'show']);
    Route::put('/prescriptions/{id}', [PrescriptionController::class, 'update']);
    Route::post('/prescriptions/generate-signed-recipe', [PrescriptionController::class, 'generateSignedRecipe']);
    Route::post('/prescriptions/generate-signed-certificate', [PrescriptionController::class, 'generateSignedCertificate']);
    Route::get('/prescriptions/validate/{hash}', [PrescriptionController::class, 'validateDocument']);
    
    // Médicos - Gestão de Médicos do Grupo e Agenda
    Route::get('/doctors', [DoctorController::class, 'index']);
    Route::post('/doctors', [DoctorController::class, 'store']); // Criar novo médico
    Route::get('/doctors/{id}/availability', [DoctorController::class, 'getAvailability']);
    Route::post('/doctors/{id}/availability', [DoctorController::class, 'saveAvailability']);
    
    // Documentos - Gestão de Documentos do Grupo
    Route::get('/documents', [DocumentController::class, 'index']);
    Route::post('/documents', [DocumentController::class, 'store']);
    Route::get('/documents/{id}', [DocumentController::class, 'show']);
    Route::put('/documents/{id}', [DocumentController::class, 'update']);
    Route::delete('/documents/{id}', [DocumentController::class, 'destroy']);
    Route::get('/documents/{id}/download', [DocumentController::class, 'download']);
    
    // Cuidadores Profissionais - Busca de cuidadores
    // IMPORTANTE: Rotas específicas devem vir ANTES das rotas com parâmetros dinâmicos
    Route::get('/caregivers/clients', [CaregiverController::class, 'getClients']);
    Route::get('/caregivers/clients/{id}', [CaregiverController::class, 'getClientDetails']);
    Route::get('/caregivers', [CaregiverController::class, 'index']);
    Route::get('/caregivers/{id}', [CaregiverController::class, 'show']);
    
    // Mensagens - Chat entre usuários
    // TODO: Descomentar quando MessageController for criado
    // Route::get('/messages/conversation/{userId}', [MessageController::class, 'getConversation']);
    // Route::post('/messages', [MessageController::class, 'sendMessage']);
    // Route::post('/messages/image', [MessageController::class, 'sendImage']);
    // Route::post('/messages/{id}/read', [MessageController::class, 'markAsRead']);
    
    // Mensagens de Grupo - Chat do grupo
    Route::get('/messages/group/{groupId}', [GroupMessageController::class, 'getGroupMessages']);
    Route::post('/messages/group', [GroupMessageController::class, 'sendGroupMessage']);
    
    // Planos - Gestão de Planos (apenas root/admin)
    Route::get('/plans', [PlanController::class, 'index']);
    Route::get('/plans/{id}', [PlanController::class, 'show']);
    Route::post('/plans', [PlanController::class, 'store']);
    Route::put('/plans/{id}', [PlanController::class, 'update']);
    Route::delete('/plans/{id}', [PlanController::class, 'destroy']);
    Route::get('/user/plan', [PlanController::class, 'getUserPlan']);
    
    // Botão de Pânico - Emergência
    Route::post('/panic/trigger', [PanicController::class, 'trigger']);
    Route::put('/panic/{eventId}/end-call', [PanicController::class, 'endCall']);
    Route::get('/panic', [PanicController::class, 'index']);
    Route::get('/panic/config/{groupId}', [PanicController::class, 'checkConfig']);
    
    // Sinais Vitais - Gestão de Sinais Vitais do Grupo
    Route::get('/vital-signs', [VitalSignController::class, 'index']);
    Route::post('/vital-signs', [VitalSignController::class, 'store']);
    Route::get('/vital-signs/{id}', [VitalSignController::class, 'show']);
    Route::put('/vital-signs/{id}', [VitalSignController::class, 'update']);
    Route::delete('/vital-signs/{id}', [VitalSignController::class, 'destroy']);
    
    // Pagamentos - Gateway de Pagamento (Stripe)
    Route::post('/payments/create-intent', [PaymentController::class, 'createIntent']);
    Route::post('/payments/confirm', [PaymentController::class, 'confirm']);
    Route::get('/payments/status/{paymentIntentId}', [PaymentController::class, 'checkStatus']);
    
    Route::get('/messages/conversation/{userId}', [MessageController::class, 'getConversation']);
    Route::post('/messages', [MessageController::class, 'sendMessage']);
    Route::post('/messages/image', [MessageController::class, 'sendImage']);
    Route::post('/messages/{id}/read', [MessageController::class, 'markAsRead']);
    Route::apiResource('emergency-contacts', EmergencyContactController::class);
    Route::post('/emergency-contacts/{id}', [EmergencyContactController::class, 'update']); // Method spoofing

});


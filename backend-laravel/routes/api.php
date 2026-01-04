<?php

use App\Http\Controllers\Api\AdminAuthController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\GatewayController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\MedicationCatalogController;
use App\Http\Controllers\Api\ChangePasswordController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\SupplierProductController;
use App\Http\Controllers\Api\SupplierOrderController;
use App\Http\Controllers\Api\SupplierMessageController;
use App\Http\Controllers\Api\StoreController;
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
        
        return response()->json($user);
    });
    
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/change-password', [ChangePasswordController::class, 'changePassword']);
    
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
});


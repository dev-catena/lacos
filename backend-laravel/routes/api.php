<?php

use App\Http\Controllers\Api\AdminAuthController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\GatewayController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Gateway Status - Rota pública
Route::get('/gateway/status', [GatewayController::class, 'status']);

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
    Route::put('/users/{id}', [App\Http\Controllers\Api\UserController::class, 'update']);
    Route::post('/users/{id}/certificate', [App\Http\Controllers\Api\UserController::class, 'uploadCertificate']);
});


<?php

use App\Http\Controllers\Api\AdminAuthController;
use Illuminate\Support\Facades\Route;

// Login Admin/Root - Rota pública
Route::post('/admin/login', [AdminAuthController::class, 'login']);

// Logout Admin - Requer autenticação
Route::middleware('auth:sanctum')->post('/admin/logout', [AdminAuthController::class, 'logout']);


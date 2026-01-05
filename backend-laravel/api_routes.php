<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\MediaController;
use App\Http\Controllers\Api\AlertController;

/*
|--------------------------------------------------------------------------
| Rotas da API para Mídias e Alertas
|--------------------------------------------------------------------------
|
| Adicione estas rotas ao seu arquivo routes/api.php
|
*/

Route::middleware('auth:sanctum')->group(function () {
    
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
    
});

/*
|--------------------------------------------------------------------------
| Rotas para Cron Jobs (protegidas)
|--------------------------------------------------------------------------
|
| IMPORTANTE: Proteja estas rotas! Use middleware de IP ou token
|
*/

Route::middleware('cron.protected')->group(function () {
    
    // Limpar mídias antigas (rodar a cada hora)
    Route::get('/cron/media/clean', [MediaController::class, 'cleanOldMedia']);
    
    // Gerar alertas de medicamentos (rodar a cada minuto)
    Route::get('/cron/alerts/generate-medications', [AlertController::class, 'generateMedicationAlerts']);
    
    // Limpar alertas expirados (rodar a cada hora)
    Route::get('/cron/alerts/clean-expired', [AlertController::class, 'cleanExpiredAlerts']);
    
});


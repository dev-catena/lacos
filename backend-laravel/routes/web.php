<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'status' => 'ok',
        'service' => 'Laços API',
        'api_prefix' => '/api',
        'health' => '/api/gateway/status',
    ]);
});

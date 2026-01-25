<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Backend Host Configuration
    |--------------------------------------------------------------------------
    |
    | Configuração do host do backend para uso em URLs geradas
    | Pode ser sobrescrito via variável de ambiente APP_HOST
    |
    */

    'host' => env('APP_HOST', '10.102.0.103'),
    'port' => env('APP_PORT', '8000'),
    
    /*
    |--------------------------------------------------------------------------
    | Backend Base URL
    |--------------------------------------------------------------------------
    |
    | URL base completa do backend
    |
    */
    
    // base_url: usar APP_URL se definido, senão construir a partir de host e port
    'base_url' => env('APP_URL', 'http://' . env('APP_HOST', '10.102.0.103') . ':' . env('APP_PORT', '8000')),
];


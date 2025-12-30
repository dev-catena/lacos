<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class GatewayController extends Controller
{
    /**
     * Endpoint de status do gateway
     * GET /api/gateway/status
     */
    public function status()
    {
        // Limpar todos os output buffers para evitar vazamento de texto
        while (ob_get_level()) {
            ob_end_clean();
        }
        
        return response()->json([
            'status' => 'ativo'
        ], 200, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
}






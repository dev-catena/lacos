<?php

namespace App\Http\Middleware;

use App\Models\ExternalApiClient;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ValidateExternalApiKey
{
    public function handle(Request $request, Closure $next): Response
    {
        $key = $request->header('X-Api-Key') ?? $request->input('api_key');

        if (!$key || !ExternalApiClient::findByKey($key)) {
            return response()->json(['message' => 'API key inválida ou inativa.'], 401);
        }

        return $next($request);
    }
}

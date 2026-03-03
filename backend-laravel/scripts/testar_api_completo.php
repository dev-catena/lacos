<?php

/**
 * Script para testar a API completa e ver exatamente o que está sendo retornado
 */

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Api\GroupController;
use Illuminate\Http\Request;

$email = $argv[1] ?? 'amigo@gmail.com';
$groupId = $argv[2] ?? 1;

echo "🧪 TESTE COMPLETO DA API\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

$user = DB::table('users')->where('email', $email)->first();

if (!$user) {
    echo "❌ Usuário não encontrado!\n";
    exit(1);
}

echo "👤 Usuário: {$user->name} ({$user->email})\n";
echo "   ID: {$user->id}\n\n";

// Simular autenticação
Auth::loginUsingId($user->id);

// Criar request simulado
$request = Request::create("/api/groups/{$groupId}", 'GET');
$request->setUserResolver(function () use ($user) {
    return (object)['id' => $user->id, 'email' => $user->email];
});

// Chamar o controller diretamente
$controller = new GroupController();
$response = $controller->show($groupId);

// Obter conteúdo da resposta
$content = $response->getContent();
$data = json_decode($content, true);

echo "📦 Resposta da API:\n";
echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
echo "\n\n";

echo "🔍 Análise:\n";
echo "   is_admin: " . ($data['is_admin'] ?? 'NÃO DEFINIDO') . " (tipo: " . gettype($data['is_admin'] ?? null) . ")\n";
echo "   is_creator: " . ($data['is_creator'] ?? 'NÃO DEFINIDO') . " (tipo: " . gettype($data['is_creator'] ?? null) . ")\n";
echo "   created_by: " . ($data['created_by'] ?? 'NÃO DEFINIDO') . "\n";
echo "   user_id: {$user->id}\n";
echo "   Comparação created_by == user_id: " . (($data['created_by'] ?? null) == $user->id ? 'true' : 'false') . "\n";

echo "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";











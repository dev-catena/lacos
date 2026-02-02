<?php

/**
 * Script para testar a API de grupos e verificar o retorno de is_admin
 */

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

$email = $argv[1] ?? 'amigo@gmail.com';
$groupId = $argv[2] ?? 1;

echo "🧪 Testando API de grupos para: {$email}, Grupo ID: {$groupId}\n\n";

$user = DB::table('users')->where('email', $email)->first();

if (!$user) {
    echo "❌ Usuário não encontrado!\n";
    exit(1);
}

// Simular autenticação
Auth::loginUsingId($user->id);

// Buscar grupo
$group = DB::table('groups')->where('id', $groupId)->first();

if (!$group) {
    echo "❌ Grupo não encontrado!\n";
    exit(1);
}

echo "📋 Dados do grupo:\n";
echo "   ID: {$group->id}\n";
echo "   Nome: {$group->name}\n";
echo "   created_by: " . ($group->created_by ?? 'NULL') . "\n";
echo "   admin_user_id: " . ($group->admin_user_id ?? 'NULL') . "\n\n";

// Verificar se é criador
$createdBy = $group->created_by ?? $group->admin_user_id ?? null;
$isCreator = $createdBy && (int)$createdBy == (int)$user->id;

echo "🔍 Verificação:\n";
echo "   createdBy: {$createdBy}\n";
echo "   user->id: {$user->id}\n";
echo "   isCreator: " . ($isCreator ? 'true' : 'false') . "\n\n";

// Verificar group_members
$memberInfo = null;
if (DB::getSchemaBuilder()->hasTable('group_members')) {
    $memberInfo = DB::table('group_members')
        ->where('group_id', $groupId)
        ->where('user_id', $user->id)
        ->first();
    
    if ($memberInfo) {
        echo "📋 Membro encontrado em group_members:\n";
        echo "   role: {$memberInfo->role}\n";
    } else {
        echo "⚠️  Não encontrado em group_members\n";
    }
}

// Calcular is_admin
$hasAdminRole = $memberInfo && $memberInfo->role === 'admin';
$isAdmin = $isCreator || $hasAdminRole;

echo "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "✅ Resultado final:\n";
echo "   isCreator: " . ($isCreator ? 'true' : 'false') . "\n";
echo "   hasAdminRole: " . ($hasAdminRole ? 'true' : 'false') . "\n";
echo "   is_admin: " . ($isAdmin ? 'true' : 'false') . "\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";







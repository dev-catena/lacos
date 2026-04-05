<?php

/**
 * Script para verificar grupos de um usuário específico
 */

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

$email = $argv[1] ?? 'amigo@gmail.com';

echo "🔍 Verificando grupos do usuário: {$email}\n\n";

$user = DB::table('users')->where('email', $email)->first();

if (!$user) {
    echo "❌ Usuário não encontrado!\n";
    exit(1);
}

echo "✅ Usuário encontrado:\n";
echo "   ID: {$user->id}\n";
echo "   Nome: {$user->name}\n";
echo "   Email: {$user->email}\n\n";

// Buscar grupos criados pelo usuário
echo "📋 Grupos criados pelo usuário (created_by):\n";
$createdGroups = DB::table('groups')
    ->where('created_by', $user->id)
    ->orWhere('admin_user_id', $user->id)
    ->get();

if ($createdGroups->isEmpty()) {
    echo "   ⚠️  Nenhum grupo encontrado\n";
} else {
    foreach ($createdGroups as $group) {
        echo "   - ID: {$group->id}, Nome: {$group->name}\n";
        echo "     created_by: " . ($group->created_by ?? 'NULL') . "\n";
        echo "     admin_user_id: " . ($group->admin_user_id ?? 'NULL') . "\n";
        
        // Verificar se está em group_members
        if (Schema::hasTable('group_members')) {
            $member = DB::table('group_members')
                ->where('group_id', $group->id)
                ->where('user_id', $user->id)
                ->first();
            
            if ($member) {
                echo "     ✅ Está em group_members com role: {$member->role}\n";
            } else {
                echo "     ⚠️  NÃO está em group_members\n";
            }
        }
        echo "\n";
    }
}

// Buscar grupos via group_members
if (Schema::hasTable('group_members')) {
    echo "📋 Grupos via group_members:\n";
    $memberGroups = DB::table('group_members')
        ->where('user_id', $user->id)
        ->join('groups', 'group_members.group_id', '=', 'groups.id')
        ->select('groups.*', 'group_members.role')
        ->get();
    
    if ($memberGroups->isEmpty()) {
        echo "   ⚠️  Nenhum grupo encontrado via group_members\n";
    } else {
        foreach ($memberGroups as $group) {
            echo "   - ID: {$group->id}, Nome: {$group->name}, Role: {$group->role}\n";
            echo "     created_by: " . ($group->created_by ?? 'NULL') . "\n";
            echo "\n";
        }
    }
}

echo "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "✅ Verificação concluída!\n";











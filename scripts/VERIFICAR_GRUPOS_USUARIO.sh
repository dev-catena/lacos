#!/bin/bash

# Script para verificar e diagnosticar problemas com grupos de usuários

SERVER_IP="10.102.0.103"
SERVER_USER="darley"
SERVER_PASSWORD="yhvh77"
PORT="63022"

echo "🔍 Verificando grupos dos usuários no servidor..."
echo ""

# Copiar script de diagnóstico para o servidor
cat > /tmp/verificar_grupos.php << 'PHP_SCRIPT'
<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\DB;

// Buscar usuários mencionados
$emails = ['amigo@gmail.com', 'bisa@gmail.com'];

foreach ($emails as $email) {
    echo "\n========================================\n";
    echo "📧 Usuário: $email\n";
    echo "========================================\n";
    
    $user = User::where('email', $email)->first();
    
    if (!$user) {
        echo "❌ Usuário não encontrado!\n";
        continue;
    }
    
    echo "✅ ID: {$user->id}\n";
    echo "✅ Nome: {$user->name}\n";
    echo "✅ Perfil: {$user->profile}\n";
    echo "\n";
    
    // Verificar grupos via group_members
    echo "🔍 Buscando grupos via tabela group_members...\n";
    $groupsViaMembers = DB::table('group_members')
        ->where('user_id', $user->id)
        ->join('groups', 'group_members.group_id', '=', 'groups.id')
        ->select('groups.id', 'groups.name', 'group_members.role', 'group_members.is_active')
        ->get();
    
    if ($groupsViaMembers->isEmpty()) {
        echo "⚠️  Nenhum grupo encontrado via group_members\n";
    } else {
        echo "✅ Grupos encontrados via group_members:\n";
        foreach ($groupsViaMembers as $group) {
            echo "   - ID: {$group->id}, Nome: {$group->name}, Role: {$group->role}, Ativo: " . ($group->is_active ? 'Sim' : 'Não') . "\n";
        }
    }
    
    echo "\n";
    
    // Verificar grupos criados pelo usuário
    echo "🔍 Buscando grupos criados pelo usuário...\n";
    $createdGroups = DB::table('groups')
        ->where('created_by', $user->id)
        ->select('id', 'name', 'created_by')
        ->get();
    
    if ($createdGroups->isEmpty()) {
        echo "⚠️  Nenhum grupo criado pelo usuário\n";
    } else {
        echo "✅ Grupos criados:\n";
        foreach ($createdGroups as $group) {
            echo "   - ID: {$group->id}, Nome: {$group->name}\n";
        }
    }
    
    echo "\n";
    
    // Verificar se há grupos com o nome "biza vos"
    echo "🔍 Buscando grupo 'biza vos'...\n";
    $bizaGroup = DB::table('groups')
        ->where('name', 'LIKE', '%biza%')
        ->orWhere('name', 'LIKE', '%vos%')
        ->select('id', 'name', 'created_by')
        ->get();
    
    if ($bizaGroup->isEmpty()) {
        echo "⚠️  Grupo 'biza vos' não encontrado\n";
    } else {
        echo "✅ Grupos encontrados com 'biza' ou 'vos':\n";
        foreach ($bizaGroup as $group) {
            echo "   - ID: {$group->id}, Nome: {$group->name}, Criado por: {$group->created_by}\n";
            
            // Verificar membros deste grupo
            $members = DB::table('group_members')
                ->where('group_id', $group->id)
                ->join('users', 'group_members.user_id', '=', 'users.id')
                ->select('users.id', 'users.email', 'users.name', 'group_members.role')
                ->get();
            
            echo "   Membros:\n";
            foreach ($members as $member) {
                echo "     - {$member->name} ({$member->email}) - Role: {$member->role}\n";
            }
        }
    }
}

echo "\n========================================\n";
echo "📊 Resumo de todas as tabelas relacionadas:\n";
echo "========================================\n";

$totalGroups = DB::table('groups')->count();
$totalMembers = DB::table('group_members')->count();
$totalUsers = DB::table('users')->count();

echo "Total de grupos: $totalGroups\n";
echo "Total de membros (group_members): $totalMembers\n";
echo "Total de usuários: $totalUsers\n";

PHP_SCRIPT

echo "📤 Copiando script de diagnóstico para o servidor..."
sshpass -p "$SERVER_PASSWORD" scp -P $PORT -o StrictHostKeyChecking=no \
    /tmp/verificar_grupos.php \
    $SERVER_USER@$SERVER_IP:/tmp/verificar_grupos.php

echo ""
echo "✅ Script copiado!"
echo ""
echo "📋 Execute no servidor:"
echo "   ssh -p $PORT $SERVER_USER@$SERVER_IP"
echo "   cd /var/www/lacos-backend"
echo "   php /tmp/verificar_grupos.php"
echo ""













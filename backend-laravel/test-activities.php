<?php

/**
 * Script de teste para verificar criação de atividades
 * Execute: php test-activities.php
 */

// Executar no diretório do Laravel
$laravelPath = '/var/www/lacos-backend';
chdir($laravelPath);

require $laravelPath . '/vendor/autoload.php';

$app = require_once $laravelPath . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\GroupActivity;
use App\Models\User;
use App\Models\Group;

echo "🧪 Testando criação de atividades...\n\n";

// Buscar um usuário e grupo de teste
$user = User::first();
$group = Group::first();

if (!$user || !$group) {
    echo "❌ Erro: Não há usuários ou grupos no banco de dados\n";
    exit(1);
}

echo "✅ Usuário: {$user->name} (ID: {$user->id})\n";
echo "✅ Grupo: {$group->name} (ID: {$group->id})\n\n";

// Testar criação de atividade de medicamento
echo "📝 Testando logMedicationCreated...\n";
try {
    $activity = GroupActivity::logMedicationCreated(
        $group->id,
        $user->id,
        $user->name,
        'Teste de Medicamento',
        999
    );
    echo "✅ Atividade criada: ID {$activity->id}, Tipo: {$activity->action_type}\n";
} catch (\Exception $e) {
    echo "❌ Erro: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}

// Testar criação de atividade de documento
echo "\n📝 Testando logDocumentCreated...\n";
try {
    $activity = GroupActivity::logDocumentCreated(
        $group->id,
        $user->id,
        $user->name,
        'Teste de Receita',
        'prescription',
        999
    );
    echo "✅ Atividade criada: ID {$activity->id}, Tipo: {$activity->action_type}\n";
} catch (\Exception $e) {
    echo "❌ Erro: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}

// Testar criação de atividade de conclusão
echo "\n📝 Testando logMedicationCompleted...\n";
try {
    $activity = GroupActivity::logMedicationCompleted(
        $group->id,
        $user->id,
        $user->name,
        'Teste de Medicamento Concluído',
        999
    );
    echo "✅ Atividade criada: ID {$activity->id}, Tipo: {$activity->action_type}\n";
} catch (\Exception $e) {
    echo "❌ Erro: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}

// Testar criação de atividade de descontinuação
echo "\n📝 Testando logMedicationDiscontinued...\n";
try {
    $activity = GroupActivity::logMedicationDiscontinued(
        $group->id,
        $user->id,
        $user->name,
        'Teste de Medicamento Descontinuado',
        999
    );
    echo "✅ Atividade criada: ID {$activity->id}, Tipo: {$activity->action_type}\n";
} catch (\Exception $e) {
    echo "❌ Erro: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}

// Verificar atividades criadas
echo "\n📊 Verificando atividades no banco de dados...\n";
$recentActivities = GroupActivity::where('group_id', $group->id)
    ->orderBy('created_at', 'desc')
    ->limit(5)
    ->get();

echo "✅ Encontradas " . $recentActivities->count() . " atividades recentes:\n";
foreach ($recentActivities as $activity) {
    echo "   - ID {$activity->id}: {$activity->action_type} - {$activity->description}\n";
}

echo "\n✅ Teste concluído!\n";


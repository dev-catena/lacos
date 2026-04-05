<?php
/**
 * Corrige o perfil de um usuário de professional_caregiver para caregiver (cuidador amigo)
 * 
 * Uso: php scripts/corrigir_perfil_cuidador_amigo.php sgtmarlenepereira@gmail.com
 * 
 * Isso fará com que o usuário NÃO apareça mais na lista de Cuidadores profissionais.
 */

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$email = $argv[1] ?? null;

if (!$email) {
    echo "Uso: php scripts/corrigir_perfil_cuidador_amigo.php <email>\n";
    echo "Exemplo: php scripts/corrigir_perfil_cuidador_amigo.php sgtmarlenepereira@gmail.com\n";
    exit(1);
}

$user = \App\Models\User::where('email', $email)->first();

if (!$user) {
    echo "❌ Usuário não encontrado: {$email}\n";
    exit(1);
}

echo "Usuário encontrado: {$user->name} (ID: {$user->id})\n";
echo "Perfil atual: {$user->profile}\n";

if ($user->profile === 'caregiver') {
    echo "✅ Usuário já está como cuidador amigo (caregiver). Nada a fazer.\n";
    exit(0);
}

$oldProfile = $user->profile;
$user->profile = 'caregiver';
$user->save();

echo "✅ Perfil alterado de '{$oldProfile}' para 'caregiver' (cuidador amigo).\n";
echo "   O usuário não aparecerá mais na lista de Cuidadores profissionais.\n";

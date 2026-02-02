<?php
$laravelPath = '/var/www/lacos-backend';
require $laravelPath . '/vendor/autoload.php';

$app = require_once $laravelPath . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

$email = 'amigo@gmail.com';
$password = '22222222';

$user = User::where('email', $email)->first();

if (!$user) {
    echo "❌ Usuário não encontrado: {$email}\n";
    exit(1);
}

echo "Email: {$user->email}\n";
echo "Testando senha '{$password}'...\n";

$isValid = Hash::check($password, $user->password);
echo "Senha válida: " . ($isValid ? 'SIM ✅' : 'NÃO ❌') . "\n";

if (!$isValid) {
    echo "\n⚠️ Senha inválida! Atualizando para '{$password}'...\n";
    $user->password = Hash::make($password);
    $user->save();
    echo "✅ Senha atualizada!\n";
    
    // Verificar novamente
    $isValid = Hash::check($password, $user->password);
    echo "Senha válida agora: " . ($isValid ? 'SIM ✅' : 'NÃO ❌') . "\n";
} else {
    echo "✅ Senha está correta!\n";
}


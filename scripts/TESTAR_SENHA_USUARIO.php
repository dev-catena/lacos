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

if ($user) {
    echo "Email: {$user->email}\n";
    echo "Password hash: " . substr($user->password, 0, 30) . "...\n";
    echo "2FA enabled: " . ($user->two_factor_enabled ? 'true' : 'false') . "\n";
    echo "2FA method: " . ($user->two_factor_method ?? 'NULL') . "\n";
    
    $isValid = Hash::check($password, $user->password);
    echo "Senha '{$password}' é válida: " . ($isValid ? 'SIM' : 'NÃO') . "\n";
    
    if (!$isValid) {
        echo "\n⚠️ Senha inválida! Vamos atualizar para '22222222'...\n";
        $user->password = Hash::make($password);
        $user->save();
        echo "✅ Senha atualizada!\n";
        
        // Verificar novamente
        $isValid = Hash::check($password, $user->password);
        echo "Senha '{$password}' é válida agora: " . ($isValid ? 'SIM' : 'NÃO') . "\n";
    }
} else {
    echo "❌ Usuário não encontrado: {$email}\n";
    exit(1);
}


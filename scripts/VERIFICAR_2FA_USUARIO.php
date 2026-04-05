<?php
$laravelPath = '/var/www/lacos-backend';
require $laravelPath . '/vendor/autoload.php';

$app = require_once $laravelPath . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use Carbon\Carbon;

$email = 'amigo@gmail.com';

$user = User::where('email', $email)->first();

if (!$user) {
    echo "❌ Usuário não encontrado: {$email}\n";
    exit(1);
}

echo "Email: {$user->email}\n";
echo "2FA enabled: " . ($user->two_factor_enabled ? 'true' : 'false') . "\n";
echo "2FA method: " . ($user->two_factor_method ?? 'NULL') . "\n";
echo "2FA phone: " . ($user->two_factor_phone ?? 'NULL') . "\n";
echo "2FA code: " . ($user->two_factor_code ? 'EXISTE (' . substr($user->two_factor_code, 0, 20) . '...)' : 'NULL') . "\n";
echo "2FA expires: " . ($user->two_factor_expires_at ? $user->two_factor_expires_at->format('Y-m-d H:i:s') : 'NULL') . "\n";

if ($user->two_factor_expires_at) {
    $now = Carbon::now();
    $expires = Carbon::parse($user->two_factor_expires_at);
    $isExpired = $now->greaterThan($expires);
    echo "Código expirado: " . ($isExpired ? 'SIM ❌' : 'NÃO ✅') . "\n";
    if (!$isExpired) {
        $minutesLeft = $now->diffInMinutes($expires);
        echo "Minutos restantes: {$minutesLeft}\n";
    }
}


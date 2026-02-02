<?php
$laravelPath = '/var/www/lacos-backend';
require $laravelPath . '/vendor/autoload.php';

$app = require_once $laravelPath . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;

$email = 'amigo@gmail.com';
$newPhone = '5531983104230';

$user = User::where('email', $email)->first();

if ($user) {
    $oldPhone = $user->phone;
    $oldTwoFactorPhone = $user->two_factor_phone;
    
    // Atualizar ambos os campos
    $user->phone = $newPhone;
    $user->two_factor_phone = $newPhone; // Também atualizar o two_factor_phone
    $user->save();
    
    echo "✅ Telefones atualizados com sucesso!\n";
    echo "   Email: {$email}\n";
    echo "   Phone antigo: {$oldPhone}\n";
    echo "   Phone novo: {$user->phone}\n";
    echo "   Two Factor Phone antigo: " . ($oldTwoFactorPhone ?? 'NULL') . "\n";
    echo "   Two Factor Phone novo: {$user->two_factor_phone}\n";
} else {
    echo "❌ Usuário não encontrado: {$email}\n";
    exit(1);
}


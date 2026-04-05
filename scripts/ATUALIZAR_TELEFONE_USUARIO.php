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
    $user->phone = $newPhone;
    $user->save();
    
    echo "✅ Telefone atualizado com sucesso!\n";
    echo "   Email: {$email}\n";
    echo "   Telefone antigo: {$oldPhone}\n";
    echo "   Telefone novo: {$user->phone}\n";
} else {
    echo "❌ Usuário não encontrado: {$email}\n";
    exit(1);
}


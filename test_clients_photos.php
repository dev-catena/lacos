<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;

// Buscar clientes
$clients = User::whereIn('name', ['Biza Vo', 'Cuidador bom'])->get();

echo "🔍 Verificando fotos dos clientes:\n\n";

foreach ($clients as $client) {
    echo "ID: {$client->id}\n";
    echo "Nome: {$client->name}\n";
    echo "Campo photo (banco): " . ($client->getOriginal('photo') ?: 'NULL') . "\n";
    echo "Accessor photo_url: " . ($client->photo_url ?: 'NULL') . "\n";
    echo "---\n";
}



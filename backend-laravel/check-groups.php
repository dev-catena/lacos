<?php
$pdo = new PDO('mysql:host=127.0.0.1;dbname=lacos', 'root', '');
$stmt = $pdo->query("SELECT id, name, photo FROM groups WHERE id IN (1, 2)");
$groups = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "🔍 GRUPOS NO BANCO:\n";
foreach ($groups as $g) {
    echo "ID: {$g['id']}, Nome: {$g['name']}, Photo: " . ($g['photo'] ?? 'NULL') . "\n";
    
    if ($g['photo']) {
        $filePath = __DIR__ . "/storage/app/public/{$g['photo']}";
        $exists = file_exists($filePath);
        echo "  Arquivo existe: " . ($exists ? 'SIM' : 'NÃO') . "\n";
        if ($exists) {
            echo "  Tamanho: " . filesize($filePath) . " bytes\n";
        }
        
        $urlPath = __DIR__ . "/public/storage/{$g['photo']}";
        $urlExists = file_exists($urlPath);
        echo "  Acessível via URL: " . ($urlExists ? 'SIM' : 'NÃO') . "\n";
    }
    echo "\n";
}

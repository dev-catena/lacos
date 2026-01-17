<?php
$authControllerPath = '/var/www/lacos-backend/app/Http/Controllers/Api/AuthController.php';

$content = file_get_contents($authControllerPath);

// Substituir $request->phone por $user->two_factor_phone (que acabou de ser salvo)
$pattern = '/\$result = \$whatsappService->sendVerificationCode\(\$request->phone, \$testCode\);/';
$replacement = '$result = $whatsappService->sendVerificationCode($user->two_factor_phone, $testCode);';

$newContent = preg_replace($pattern, $replacement, $content);

if ($newContent !== $content) {
    file_put_contents($authControllerPath, $newContent);
    echo "✅ AuthController atualizado - agora usa two_factor_phone salvo!\n";
    
    // Também atualizar o log para mostrar o número correto
    $pattern2 = '/\'phone\' => \$request->phone,/';
    $replacement2 = '\'phone\' => $user->two_factor_phone,';
    $newContent = preg_replace($pattern2, $replacement2, $newContent);
    file_put_contents($authControllerPath, $newContent);
    echo "✅ Log também atualizado!\n";
} else {
    echo "❌ Não foi possível encontrar o ponto de substituição\n";
    exit(1);
}


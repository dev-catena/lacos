<?php
$authControllerPath = '/var/www/lacos-backend/app/Http/Controllers/Api/AuthController.php';

$content = file_get_contents($authControllerPath);

// Verificar se o código está sendo salvo como texto plano (sem Hash::make)
// E corrigir para usar Hash::make e sendVerificationCode

// Padrão 1: Código salvo como texto plano
$pattern1 = '/(\$code = str_pad\(rand\(0, 999999\), 6, \'0\', STR_PAD_LEFT\);\s*\n\s*\$user->two_factor_code = \$code;)/';

$replacement1 = '$code = str_pad(rand(0, 999999), 6, \'0\', STR_PAD_LEFT);
                $user->two_factor_code = \Illuminate\Support\Facades\Hash::make($code);';

$newContent = preg_replace($pattern1, $replacement1, $content);

// Padrão 2: Usar sendMessage em vez de sendVerificationCode
$pattern2 = '/(\$whatsappService = new WhatsAppService\(\);\s*\n\s*\$whatsappService->sendMessage\(\s*\$user->two_factor_phone,\s*"Seu código de verificação Laços: \{\$code\}"\s*\);)/';

$replacement2 = '$whatsappService = new \App\Services\WhatsAppService();
                        $result = $whatsappService->sendVerificationCode($user->two_factor_phone ?? $user->phone, $code);
                        
                        if (empty($result[\'success\'])) {
                            \Log::error(\'Erro ao enviar código 2FA via WhatsApp: \' . ($result[\'error\'] ?? \'Erro desconhecido\'));
                            return response()->json([
                                \'success\' => false,
                                \'message\' => \'Erro ao enviar código via WhatsApp\',
                                \'error\' => $result[\'error\'] ?? \'Erro desconhecido\'
                            ], 500);
                        }';

$newContent = preg_replace($pattern2, $replacement2, $newContent);

// Padrão 3: Corrigir resposta para usar requires_2fa (com underscore)
$pattern3 = '/(\'success\' => false,\s*\n\s*\'requires_2fa\' => true,)/';

if (strpos($newContent, "'requires_2fa' => true") === false && strpos($newContent, '"requires_2fa" => true') === false) {
    // Se não encontrar requires_2fa, procurar por requires2FA e substituir
    $pattern3b = '/(\'success\' => false,\s*\n\s*\'requires2FA\' => true,)/';
    $replacement3b = "'success' => false,
                    'requires_2fa' => true,";
    $newContent = preg_replace($pattern3b, $replacement3b, $newContent);
}

if ($newContent !== $content) {
    file_put_contents($authControllerPath, $newContent);
    echo "✅ AuthController atualizado - Login 2FA corrigido!\n";
    echo "   - Código agora é hasheado com Hash::make\n";
    echo "   - Usa sendVerificationCode em vez de sendMessage\n";
    echo "   - Resposta usa requires_2fa\n";
} else {
    echo "ℹ️  Nenhuma alteração necessária (código já está correto ou padrão não encontrado)\n";
}


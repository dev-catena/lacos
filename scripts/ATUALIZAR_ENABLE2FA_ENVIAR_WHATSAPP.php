<?php
$authControllerPath = '/var/www/lacos-backend/app/Http/Controllers/Api/AuthController.php';

$content = file_get_contents($authControllerPath);

// Verificar se já tem envio de WhatsApp
if (strpos($content, 'sendVerificationCode') !== false && strpos($content, '// Enviar código de teste via WhatsApp') !== false) {
    echo "ℹ️  enable2FA já envia WhatsApp. Pulando.\n";
    exit(0);
}

// Procurar o ponto de inserção: após $user->save() e antes do Log::info
$pattern = '/(\$user->two_factor_phone = \$request->phone;\s*\n\s*\$user->save\(\);)(\s*\n\s*\\\\Log::info\(\'2FA ativado\')/';

$replacement = '$1
            
            // Enviar código de teste via WhatsApp
            $whatsappService = new \App\Services\WhatsAppService();
            $testCode = str_pad(rand(0, 999999), 6, \'0\', STR_PAD_LEFT);
            $user->two_factor_code = \Illuminate\Support\Facades\Hash::make($testCode);
            $user->two_factor_expires_at = now()->addMinutes(5);
            $user->save();
            
            $result = $whatsappService->sendVerificationCode($request->phone, $testCode);
            
            if (empty($result[\'success\'])) {
                \Log::warning(\'Erro ao enviar código WhatsApp ao ativar 2FA\', [
                    \'user_id\' => $user->id,
                    \'error\' => $result[\'error\'] ?? \'Erro desconhecido\',
                ]);
                // Não falha a ativação, apenas registra o erro
            } else {
                \Log::info(\'Código WhatsApp enviado ao ativar 2FA\', [
                    \'user_id\' => $user->id,
                    \'phone\' => $request->phone,
                ]);
            }
$2';

$newContent = preg_replace($pattern, $replacement, $content);

if ($newContent !== $content) {
    file_put_contents($authControllerPath, $newContent);
    echo "✅ AuthController atualizado - enable2FA agora envia WhatsApp!\n";
} else {
    echo "❌ Não foi possível encontrar o ponto de inserção no enable2FA\n";
    exit(1);
}


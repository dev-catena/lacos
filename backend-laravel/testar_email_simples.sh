#!/bin/bash

# Script simples para testar email via Tinker
# Uso: ./testar_email_simples.sh [email-destino]

EMAIL="${1:-coroneldarley@gmail.com}"

cd "$(dirname "$0")"

echo "📧 Testando envio de email para: $EMAIL"
echo ""

# Criar script PHP temporário no diretório do backend
BACKEND_DIR="$(pwd)"
TEMP_SCRIPT="$BACKEND_DIR/test_email_temp.php"

cat > "$TEMP_SCRIPT" << 'PHPSCRIPT'
<?php
$backendDir = __DIR__;
require $backendDir . '/vendor/autoload.php';
$app = require_once $backendDir . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Mail;

$emailDestino = $argv[1] ?? 'coroneldarley@gmail.com';

try {
    echo "Tentando enviar email para: $emailDestino\n\n";
    
    Mail::raw('Este é um email de teste do sistema Laços.

Se você recebeu este email, a configuração de SMTP está funcionando!

Data/Hora: ' . date('d/m/Y H:i:s') . '

Atenciosamente,
Sistema Laços', function ($message) use ($emailDestino) {
        $message->to($emailDestino)
                ->subject('✅ Teste de Email - Laços');
    });
    
    echo "✅ Email enviado com sucesso!\n";
    echo "Verifique a caixa de entrada de: $emailDestino\n";
    echo "(Verifique também a pasta de SPAM)\n";
} catch (\Exception $e) {
    echo "❌ Erro: " . $e->getMessage() . "\n";
    echo "\nVerifique:\n";
    echo "  - Configurações SMTP no .env\n";
    echo "  - Logs: tail -f storage/logs/laravel.log\n";
    exit(1);
}
PHPSCRIPT

# Executar script PHP
php "$TEMP_SCRIPT" "$EMAIL"
EXIT_CODE=$?

# Limpar arquivo temporário
rm -f "$TEMP_SCRIPT"

exit $EXIT_CODE


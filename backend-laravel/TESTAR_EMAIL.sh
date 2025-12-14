#!/bin/bash

# Script para testar envio de email via tinker
# Execute no servidor

cd /var/www/lacos-backend

echo "📧 Testando envio de email..."
echo ""

# Criar script PHP temporário
cat > /tmp/test_email.php << EOF
<?php

require __DIR__.'/var/www/lacos-backend/vendor/autoload.php';

\$app = require_once __DIR__.'/var/www/lacos-backend/bootstrap/app.php';
\$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();
EOF

# Ou usar tinker diretamente
echo "📧 Testando envio de email via tinker..."
echo ""

php artisan tinker --execute="
use Illuminate\Support\Facades\Mail;
try {
    Mail::raw('Teste de email do Laços - Sistema de Aprovação de Médicos', function(\$message) {
        \$message->to('coroneldarley@gmail.com')
                ->subject('Teste SMTP Laços');
    });
    echo '✅ Email enviado com sucesso!\n';
    echo '   Verifique a caixa de entrada de: coroneldarley@gmail.com\n';
} catch (Exception \$e) {
    echo '❌ Erro ao enviar email:\n';
    echo '   ' . \$e->getMessage() . '\n';
}
" 2>&1 | grep -v "PHP Warning" | grep -v "memory limit"

echo ""
echo "📋 Para testar manualmente no tinker:"
echo "   php artisan tinker"
echo ""
echo "   Depois execute:"
echo "   use Illuminate\Support\Facades\Mail;"
echo "   Mail::raw('Teste', function(\$m) { \$m->to('coroneldarley@gmail.com')->subject('Teste'); });"
echo ""


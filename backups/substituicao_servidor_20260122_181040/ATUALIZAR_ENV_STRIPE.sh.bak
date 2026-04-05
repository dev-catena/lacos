#!/bin/bash

# Script para atualizar o .env do servidor com as configurações do Stripe
# Execute no servidor: sudo bash /tmp/ATUALIZAR_ENV_STRIPE.sh

cd /var/www/lacos-backend || exit 1

echo "🔧 Atualizando .env com configurações do Stripe..."

# Fazer backup do .env atual
if [ ! -f ".env.backup" ]; then
    cp .env .env.backup
    echo "✅ Backup do .env criado (.env.backup)"
fi

# Verificar se as configurações do Stripe já existem
if grep -q "STRIPE_KEY=" .env; then
    echo "⚠️ Configurações do Stripe já existem no .env"
    echo "   Deseja sobrescrever? (s/n)"
    read -r response
    if [ "$response" != "s" ] && [ "$response" != "S" ]; then
        echo "❌ Operação cancelada"
        exit 0
    fi
    
    # Remover configurações antigas do Stripe
    sed -i '/^STRIPE_KEY=/d' .env
    sed -i '/^STRIPE_SECRET=/d' .env
    sed -i '/^STRIPE_WEBHOOK_SECRET=/d' .env
    sed -i '/^# Stripe Configuration/d' .env
fi

# Adicionar configurações do Stripe
echo "" >> .env
echo "# Stripe Configuration" >> .env
echo "" >> .env
echo "STRIPE_KEY=pk_test_51Scz66ExhPc9VG3mkXmh68Bmw92rEhANTHxFmuLlsCFkHTutBdAvaCDwlXCvJHWI2mZyynXidCHyvzv6C79hju4M00I3JfIwSo" >> .env
echo "" >> .env
echo "STRIPE_SECRET=sk_test_51Scz66ExhPc9VG3m1pSHhdRkR7iegM2REfsdLncEeGY4TiaHjw3FHFCVLmD12anTEordZmW3rkhie8yXyHLYJHX100yqLTW4zb" >> .env
echo "" >> .env
echo "STRIPE_WEBHOOK_SECRET=" >> .env

echo "✅ Configurações do Stripe adicionadas ao .env"

# Verificar se config/services.php tem a configuração do Stripe
if ! grep -q "'stripe'" config/services.php; then
    echo ""
    echo "⚠️ config/services.php não tem configuração do Stripe"
    echo "   Adicione manualmente:"
    echo ""
    echo "   'stripe' => ["
    echo "       'key' => env('STRIPE_KEY'),"
    echo "       'secret' => env('STRIPE_SECRET'),"
    echo "       'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),"
    echo "   ],"
    echo ""
fi

# Limpar cache
echo ""
echo "🧹 Limpando cache..."
php artisan config:clear > /dev/null 2>&1
php artisan cache:clear > /dev/null 2>&1
echo "✅ Cache limpo"

echo ""
echo "✅ Processo concluído!"
echo ""
echo "📝 Próximos passos:"
echo "   1. Verifique se config/services.php tem a configuração do Stripe"
echo "   2. Instale o Stripe SDK: composer require stripe/stripe-php"
echo "   3. Crie o PaymentController (veja backend-laravel/PaymentController_EXEMPLO.php)"
echo "   4. Adicione as rotas em routes/api.php"


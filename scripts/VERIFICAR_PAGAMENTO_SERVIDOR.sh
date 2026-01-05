#!/bin/bash

# Script para verificar configuração de pagamento no servidor

cd /var/www/lacos-backend

echo "🔍 Verificando configuração de pagamento..."
echo ""

# 1. PaymentController
echo "1️⃣ PaymentController:"
if [ -f "app/Http/Controllers/Api/PaymentController.php" ]; then
    echo "   ✅ Existe"
    php -l app/Http/Controllers/Api/PaymentController.php 2>&1 | grep -q "No syntax errors" && echo "   ✅ Sintaxe válida" || echo "   ❌ Erro de sintaxe"
else
    echo "   ❌ Não existe"
fi

echo ""

# 2. Rotas
echo "2️⃣ Rotas de pagamento:"
if grep -q "payments/create-intent" routes/api.php; then
    echo "   ✅ Rotas encontradas em routes/api.php"
else
    echo "   ❌ Rotas não encontradas"
fi

echo ""

# 3. Stripe SDK
echo "3️⃣ Stripe SDK:"
if composer show stripe/stripe-php 2>/dev/null | grep -q "stripe/stripe-php"; then
    echo "   ✅ Instalado"
    composer show stripe/stripe-php 2>/dev/null | head -1
else
    echo "   ❌ Não instalado"
    echo "   📝 Execute: composer require stripe/stripe-php"
fi

echo ""

# 4. Rotas registradas
echo "4️⃣ Rotas registradas no Laravel:"
php artisan route:list 2>/dev/null | grep -i payment | head -5 || echo "   ⚠️ Nenhuma rota de pagamento encontrada (pode ser cache)"

echo ""

# 5. Config Stripe
echo "5️⃣ Configuração Stripe:"
if [ -f "config/services.php" ]; then
    if grep -q "'stripe'" config/services.php; then
        echo "   ✅ Configuração encontrada em config/services.php"
    else
        echo "   ❌ Configuração não encontrada"
    fi
else
    echo "   ⚠️ Arquivo não encontrado"
fi

echo ""
echo "✅ Verificação concluída!"


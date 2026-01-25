#!/bin/bash

# Script para verificar se a configuração de pagamento está completa

echo "🔍 Verificando configuração de pagamento..."
echo ""

cd /var/www/lacos-backend

# 1. Verificar PaymentController
echo "1️⃣ Verificando PaymentController..."
if [ -f "app/Http/Controllers/Api/PaymentController.php" ]; then
    echo "   ✅ PaymentController existe"
    
    # Verificar sintaxe
    php -l app/Http/Controllers/Api/PaymentController.php 2>&1 | grep -q "No syntax errors" && echo "   ✅ Sintaxe válida" || echo "   ❌ Erro de sintaxe"
else
    echo "   ❌ PaymentController NÃO existe"
    echo "   📝 Crie o arquivo: app/Http/Controllers/Api/PaymentController.php"
fi

echo ""

# 2. Verificar rotas de pagamento
echo "2️⃣ Verificando rotas de pagamento..."
if grep -q "payments/create-intent" routes/api.php; then
    echo "   ✅ Rotas de pagamento encontradas em routes/api.php"
    
    # Verificar se PaymentController está importado
    if grep -q "use App\\Http\\Controllers\\Api\\PaymentController;" routes/api.php; then
        echo "   ✅ PaymentController importado corretamente"
    else
        echo "   ⚠️ PaymentController não está importado (mas pode estar usando caminho completo)"
    fi
else
    echo "   ❌ Rotas de pagamento NÃO encontradas"
fi

echo ""

# 3. Verificar Stripe SDK
echo "3️⃣ Verificando Stripe SDK..."
if composer show stripe/stripe-php 2>/dev/null | grep -q "stripe/stripe-php"; then
    echo "   ✅ Stripe SDK instalado"
    composer show stripe/stripe-php 2>/dev/null | head -2
else
    echo "   ❌ Stripe SDK NÃO instalado"
    echo "   📝 Execute: composer require stripe/stripe-php"
fi

echo ""

# 4. Verificar configuração do Stripe no .env
echo "4️⃣ Verificando variáveis de ambiente do Stripe..."
if [ -f ".env" ]; then
    if grep -q "STRIPE_KEY=" .env && grep -q "STRIPE_SECRET=" .env; then
        echo "   ✅ Variáveis STRIPE_KEY e STRIPE_SECRET encontradas no .env"
        
        # Verificar se não estão vazias (sem mostrar os valores)
        STRIPE_KEY=$(grep "^STRIPE_KEY=" .env | cut -d'=' -f2)
        STRIPE_SECRET=$(grep "^STRIPE_SECRET=" .env | cut -d'=' -f2)
        
        if [ -n "$STRIPE_KEY" ] && [ "$STRIPE_KEY" != "" ]; then
            echo "   ✅ STRIPE_KEY configurado"
        else
            echo "   ⚠️ STRIPE_KEY está vazio"
        fi
        
        if [ -n "$STRIPE_SECRET" ] && [ "$STRIPE_SECRET" != "" ]; then
            echo "   ✅ STRIPE_SECRET configurado"
        else
            echo "   ⚠️ STRIPE_SECRET está vazio"
        fi
    else
        echo "   ❌ Variáveis STRIPE_KEY ou STRIPE_SECRET não encontradas no .env"
    fi
else
    echo "   ⚠️ Arquivo .env não encontrado"
fi

echo ""

# 5. Verificar config/services.php
echo "5️⃣ Verificando config/services.php..."
if [ -f "config/services.php" ]; then
    if grep -q "'stripe'" config/services.php; then
        echo "   ✅ Configuração do Stripe encontrada em config/services.php"
    else
        echo "   ❌ Configuração do Stripe NÃO encontrada em config/services.php"
    fi
else
    echo "   ⚠️ Arquivo config/services.php não encontrado"
fi

echo ""

# 6. Verificar rotas registradas
echo "6️⃣ Verificando rotas registradas..."
php artisan route:list 2>/dev/null | grep -q "payments" && echo "   ✅ Rotas de pagamento registradas" || echo "   ⚠️ Rotas de pagamento não aparecem (pode ser cache)"

echo ""
echo "📋 Resumo:"
echo "   - PaymentController: $( [ -f "app/Http/Controllers/Api/PaymentController.php" ] && echo "✅" || echo "❌" )"
echo "   - Rotas em api.php: $( grep -q "payments/create-intent" routes/api.php && echo "✅" || echo "❌" )"
echo "   - Stripe SDK: $( composer show stripe/stripe-php 2>/dev/null | grep -q "stripe/stripe-php" && echo "✅" || echo "❌" )"
echo ""
echo "✅ Verificação concluída!"


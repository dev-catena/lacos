#!/bin/bash

# Script para verificar se o campo consultation_price está configurado corretamente
# Execute: sudo bash VERIFICAR_CONSULTATION_PRICE.sh

echo "🔍 Verificando configuração do campo consultation_price..."
echo ""

cd /var/www/lacos-backend || exit 1

echo "1️⃣ Verificando Model User (app/Models/User.php)..."
echo ""

# Verificar fillable
if grep -A 50 "protected \$fillable" app/Models/User.php | grep -q "consultation_price"; then
    echo "   ✅ consultation_price está no \$fillable"
    grep -A 50 "protected \$fillable" app/Models/User.php | grep -B 2 -A 2 "consultation_price"
else
    echo "   ❌ consultation_price NÃO está no \$fillable"
fi

echo ""
echo "2️⃣ Verificando casts no Model User..."
echo ""

# Verificar casts
if grep -A 20 "protected \$casts" app/Models/User.php | grep -q "consultation_price"; then
    echo "   ✅ consultation_price está no \$casts"
    grep -A 20 "protected \$casts" app/Models/User.php | grep -B 2 -A 2 "consultation_price"
else
    echo "   ❌ consultation_price NÃO está no \$casts"
fi

echo ""
echo "3️⃣ Verificando UserController (app/Http/Controllers/Api/UserController.php)..."
echo ""

# Verificar validação
if grep -q "consultation_price" app/Http/Controllers/Api/UserController.php; then
    echo "   ✅ consultation_price encontrado no UserController"
    echo ""
    echo "   📋 Validação:"
    grep -B 2 -A 2 "consultation_price.*sometimes" app/Http/Controllers/Api/UserController.php
    echo ""
    echo "   📋 Lista de campos (only):"
    grep -B 2 -A 2 "consultation_price" app/Http/Controllers/Api/UserController.php | grep -A 2 "only"
else
    echo "   ❌ consultation_price NÃO encontrado no UserController"
fi

echo ""
echo "4️⃣ Verificando banco de dados..."
echo ""

if mysql -u root -pyhvh77 lacos -e "DESCRIBE users;" 2>/dev/null | grep "consultation_price"; then
    echo "   ✅ Coluna consultation_price existe no banco de dados"
    echo ""
    echo "   📊 Detalhes da coluna:"
    mysql -u root -pyhvh77 lacos -e "DESCRIBE users;" 2>/dev/null | grep consultation_price
else
    echo "   ❌ Coluna consultation_price NÃO existe no banco de dados"
fi

echo ""
echo "5️⃣ Verificando sintaxe PHP..."
echo ""

if php -l app/Models/User.php > /dev/null 2>&1; then
    echo "   ✅ Sintaxe do Model User está correta"
else
    echo "   ❌ Erro de sintaxe no Model User:"
    php -l app/Models/User.php
fi

if php -l app/Http/Controllers/Api/UserController.php > /dev/null 2>&1; then
    echo "   ✅ Sintaxe do UserController está correta"
else
    echo "   ❌ Erro de sintaxe no UserController:"
    php -l app/Http/Controllers/Api/UserController.php
fi

echo ""
echo "✅ Verificação concluída!"
echo ""
echo "📝 Próximos passos:"
echo "   1. Teste salvando o valor da consulta no perfil do médico no app"
echo "   2. Verifique se o valor está sendo persistido"
echo "   3. O valor deve aparecer quando você abrir a tela de dados profissionais novamente"
echo "   4. O valor será usado no cálculo do pagamento (valor + 20%)"


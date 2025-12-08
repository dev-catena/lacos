#!/bin/bash

echo "🔧 Atualizando UserController e Model User..."
echo ""

cd /var/www/lacos-backend || exit 1

# Atualizar UserController
echo "📝 Atualizando UserController..."
sudo cp /tmp/UserController_ATUALIZADO.php app/Http/Controllers/Api/UserController.php
sudo chown www-data:www-data app/Http/Controllers/Api/UserController.php

if php -l app/Http/Controllers/Api/UserController.php > /dev/null 2>&1; then
    echo "✅ UserController atualizado"
else
    echo "❌ Erro de sintaxe no UserController"
    php -l app/Http/Controllers/Api/UserController.php
    exit 1
fi
echo ""

# Atualizar Model User
echo "📝 Atualizando Model User..."
sudo cp /tmp/User_MODEL_ATUALIZADO.php app/Models/User.php
sudo chown www-data:www-data app/Models/User.php

if php -l app/Models/User.php > /dev/null 2>&1; then
    echo "✅ Model User atualizado"
else
    echo "❌ Erro de sintaxe no Model User"
    php -l app/Models/User.php
    exit 1
fi
echo ""

# Limpar cache
echo "🧹 Limpando cache..."
php artisan optimize:clear > /dev/null 2>&1
echo "✅ Cache limpo"
echo ""

echo "✅ Concluído!"


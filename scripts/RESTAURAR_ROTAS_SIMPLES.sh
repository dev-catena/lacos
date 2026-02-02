#!/bin/bash

# Script simples para restaurar rotas

set -e

cd /var/www/lacos-backend

echo "🔧 Restaurando rotas completas..."
echo ""

# Copiar diretamente
if [ -f "/tmp/routes_api_corrigido.php" ]; then
    echo "📋 Copiando /tmp/routes_api_corrigido.php para routes/api.php..."
    sudo cp /tmp/routes_api_corrigido.php routes/api.php
    sudo chown www-data:www-data routes/api.php
    sudo chmod 644 routes/api.php
    echo "✅ Rotas restauradas"
else
    echo "❌ /tmp/routes_api_corrigido.php não encontrado!"
    exit 1
fi

echo ""
echo "🔍 Verificando sintaxe..."
if sudo php -l routes/api.php 2>&1 | grep -q "No syntax errors"; then
    echo "✅ Sintaxe OK"
else
    echo "❌ Erro de sintaxe!"
    sudo php -l routes/api.php
    exit 1
fi

echo ""
echo "🧹 Limpando cache..."
sudo php artisan route:clear 2>/dev/null || true
sudo php artisan config:clear 2>/dev/null || true
sudo php artisan cache:clear 2>/dev/null || true
echo "✅ Cache limpo"

echo ""
echo "📊 Verificando rotas principais..."
echo ""
echo "Rotas de grupos:"
sudo php artisan route:list 2>/dev/null | grep -i "groups" | head -3
echo ""
echo "Rotas de admin:"
sudo php artisan route:list 2>/dev/null | grep -i "admin" | head -3
echo ""

echo "✅ Restauração concluída!"


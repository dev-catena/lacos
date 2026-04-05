#!/bin/bash

# Script para corrigir o import mal formatado em routes/api.php

set -e

cd /var/www/lacos-backend

echo "🔧 Corrigindo import em routes/api.php..."

# Verificar se o arquivo existe
if [ ! -f "routes/api.php" ]; then
    echo "❌ routes/api.php não encontrado!"
    exit 1
fi

# Corrigir o import mal formatado
sed -i 's/use AppHttpControllersApiAdminAuthController;/use App\\Http\\Controllers\\Api\\AdminAuthController;/g' routes/api.php

# Verificar se há outros imports mal formatados
if grep -q "AppHttpControllers" routes/api.php; then
    echo "⚠️  Ainda há imports mal formatados. Corrigindo..."
    sed -i 's/AppHttpControllers/App\\Http\\Controllers/g' routes/api.php
fi

# Verificar se o import correto existe
if grep -q "use App\\\\Http\\\\Controllers\\\\Api\\\\AdminAuthController;" routes/api.php; then
    echo "✅ Import corrigido"
elif grep -q "AdminAuthController" routes/api.php; then
    # Adicionar import correto se não existir
    if ! grep -q "use App\\\\Http\\\\Controllers\\\\Api\\\\AdminAuthController;" routes/api.php; then
        # Remover linha mal formatada
        sed -i '/use AppHttpControllersApiAdminAuthController;/d' routes/api.php
        # Adicionar import correto após <?php
        sed -i '/^<?php/a\\use App\\Http\\Controllers\\Api\\AdminAuthController;' routes/api.php
        echo "✅ Import adicionado corretamente"
    fi
else
    # Adicionar import se não existir
    sed -i '/^<?php/a\\use App\\Http\\Controllers\\Api\\AdminAuthController;' routes/api.php
    echo "✅ Import adicionado"
fi

# Limpar cache
echo "🧹 Limpando cache..."
php artisan route:clear 2>/dev/null || true
php artisan config:clear 2>/dev/null || true

echo ""
echo "✅ Correção concluída!"
echo ""
echo "📋 Verificando rotas..."
php artisan route:list | grep -i "admin/login" && echo "✅ Rota encontrada!" || echo "⚠️  Rota ainda não encontrada"


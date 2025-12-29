#!/bin/bash

# Script rápido para corrigir rota admin/login
# Execute no servidor como root

set -e

cd /var/www/lacos-backend

echo "🔧 Corrigindo rota /api/admin/login..."

# 1. Verificar se AdminAuthController existe
if [ ! -f "app/Http/Controllers/Api/AdminAuthController.php" ]; then
    echo "❌ AdminAuthController não encontrado!"
    echo "   Execute: sudo bash /tmp/INSTALAR_ADMIN_AUTH.sh"
    exit 1
fi

# 2. Criar routes/api.php se não existir
mkdir -p routes

if [ ! -f "routes/api.php" ]; then
    echo "📝 Criando routes/api.php..."
    cat > routes/api.php << 'EOF'
<?php

use App\Http\Controllers\Api\AdminAuthController;
use Illuminate\Support\Facades\Route;

// Login Admin/Root - Rota pública
Route::post('/admin/login', [AdminAuthController::class, 'login']);

// Logout Admin - Requer autenticação
Route::middleware('auth:sanctum')->post('/admin/logout', [AdminAuthController::class, 'logout']);
EOF
    chown www-data:www-data routes/api.php
    echo "✅ routes/api.php criado"
else
    # Verificar se a rota já existe
    if grep -q "admin/login" routes/api.php; then
        echo "✅ Rota /admin/login já existe em routes/api.php"
    else
        echo "📝 Adicionando rota /admin/login..."
        # Adicionar import se não existir
        if ! grep -q "AdminAuthController" routes/api.php; then
            sed -i "2a\\use App\\Http\\Controllers\\Api\\AdminAuthController;" routes/api.php
        fi
        # Adicionar rota
        echo "" >> routes/api.php
        echo "// Login Admin/Root" >> routes/api.php
        echo "Route::post('/admin/login', [AdminAuthController::class, 'login']);" >> routes/api.php
        echo "✅ Rota adicionada"
    fi
fi

# 3. Verificar RouteServiceProvider
if [ -f "app/Providers/RouteServiceProvider.php" ]; then
    if grep -q "routes/api.php" app/Providers/RouteServiceProvider.php; then
        echo "✅ RouteServiceProvider carrega routes/api.php"
    else
        echo "⚠️  RouteServiceProvider não carrega routes/api.php"
        echo "   Adicione manualmente ou use bootstrap/app.php (Laravel 11+)"
    fi
fi

# 4. Alternativa: Adicionar diretamente no arquivo de rotas principal
# Verificar se há arquivo web.php ou outro arquivo de rotas
if [ -f "routes/web.php" ]; then
    if ! grep -q "admin/login" routes/web.php; then
        echo "📝 Adicionando rota em routes/web.php como alternativa..."
        cat >> routes/web.php << 'EOF'

// Admin Login (alternativa)
Route::post('/api/admin/login', [App\Http\Controllers\Api\AdminAuthController::class, 'login']);
EOF
        echo "✅ Rota adicionada em routes/web.php"
    fi
fi

# 5. Limpar cache de rotas
echo "🧹 Limpando cache..."
php artisan route:clear 2>/dev/null || true
php artisan config:clear 2>/dev/null || true

# 6. Verificar rotas
echo ""
echo "📋 Verificando rotas..."
php artisan route:list | grep -i "admin/login" || echo "⚠️  Rota não encontrada. Pode ser necessário reiniciar o servidor."

echo ""
echo "✅ Correção concluída!"
echo ""
echo "📝 Próximos passos:"
echo "   1. Verifique se a rota aparece: php artisan route:list | grep admin"
echo "   2. Se não aparecer, adicione manualmente em routes/web.php ou RouteServiceProvider"
echo "   3. Reinicie o servidor web se necessário"


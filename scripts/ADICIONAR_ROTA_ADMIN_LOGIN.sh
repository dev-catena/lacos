#!/bin/bash

# Script para adicionar rota de login admin
# Execute no servidor

set -e

cd /var/www/lacos-backend

echo "🔧 Adicionando rota de login admin..."

# Criar diretório routes se não existir
mkdir -p routes

# Verificar se routes/api.php existe
if [ -f "routes/api.php" ]; then
    echo "✅ Arquivo routes/api.php existe"
    
    # Verificar se a rota já existe
    if grep -q "admin/login" routes/api.php; then
        echo "⚠️  Rota /admin/login já existe em routes/api.php"
    else
        echo "📝 Adicionando rota /admin/login..."
        cat >> routes/api.php << 'EOF'

// Login Admin/Root
Route::post('/admin/login', [App\Http\Controllers\Api\AdminAuthController::class, 'login']);
EOF
        echo "✅ Rota adicionada"
    fi
else
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
    echo "✅ Arquivo routes/api.php criado"
fi

# Verificar se RouteServiceProvider está carregando routes/api.php
if [ -f "app/Providers/RouteServiceProvider.php" ]; then
    if grep -q "routes/api.php" app/Providers/RouteServiceProvider.php; then
        echo "✅ RouteServiceProvider já carrega routes/api.php"
    else
        echo "⚠️  RouteServiceProvider pode não estar carregando routes/api.php"
        echo "   Verifique se há: Route::middleware('api')->prefix('api')->group(base_path('routes/api.php'));"
    fi
fi

echo ""
echo "✅ Rota de login admin configurada!"
echo ""
echo "📋 Endpoints disponíveis:"
echo "   POST /api/admin/login - Login para root/admin"
echo "   POST /api/admin/logout - Logout (requer autenticação)"


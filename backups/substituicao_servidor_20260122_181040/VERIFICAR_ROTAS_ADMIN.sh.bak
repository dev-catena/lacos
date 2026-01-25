#!/bin/bash

# Script para verificar e corrigir rotas admin

set -e

cd /var/www/lacos-backend

echo "🔍 Verificando rotas admin..."

# 1. Verificar se routes/api.php existe e tem as rotas
echo ""
echo "1️⃣ Verificando routes/api.php..."
if [ -f "routes/api.php" ]; then
    echo "✅ routes/api.php existe"
    if grep -q "admin/users\|admin/doctors" routes/api.php; then
        echo "✅ Rotas admin encontradas em routes/api.php"
        echo "📄 Conteúdo:"
        cat routes/api.php
    else
        echo "❌ Rotas admin NÃO encontradas em routes/api.php"
        echo "📝 Adicionando rotas..."
        
        cat >> routes/api.php << 'EOF'

// Rotas Admin
use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\AdminDoctorController;

Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
    // Usuários
    Route::get('/users', [AdminUserController::class, 'index']);
    Route::post('/users/{id}/block', [AdminUserController::class, 'block']);
    Route::post('/users/{id}/unblock', [AdminUserController::class, 'unblock']);
    Route::get('/users/{id}/plan', [AdminUserController::class, 'getUserPlan']);
    
    // Médicos
    Route::get('/doctors/pending', [AdminDoctorController::class, 'getPending']);
    Route::get('/doctors', [AdminDoctorController::class, 'index']);
    Route::post('/doctors/{id}/approve', [AdminDoctorController::class, 'approve']);
    Route::post('/doctors/{id}/reject', [AdminDoctorController::class, 'reject']);
    Route::post('/doctors/{id}/block', [AdminDoctorController::class, 'block']);
});
EOF
        chown www-data:www-data routes/api.php
        echo "✅ Rotas adicionadas"
    fi
else
    echo "❌ routes/api.php não existe"
    echo "📝 Criando routes/api.php..."
    
    cat > routes/api.php << 'EOF'
<?php

use App\Http\Controllers\Api\AdminAuthController;
use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\AdminDoctorController;
use Illuminate\Support\Facades\Route;

// Login Admin/Root - Rota pública
Route::post('/admin/login', [AdminAuthController::class, 'login']);

// Logout Admin - Requer autenticação
Route::middleware('auth:sanctum')->post('/admin/logout', [AdminAuthController::class, 'logout']);

// Rotas Admin - Requerem autenticação
Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
    // Usuários
    Route::get('/users', [AdminUserController::class, 'index']);
    Route::post('/users/{id}/block', [AdminUserController::class, 'block']);
    Route::post('/users/{id}/unblock', [AdminUserController::class, 'unblock']);
    Route::get('/users/{id}/plan', [AdminUserController::class, 'getUserPlan']);
    
    // Médicos
    Route::get('/doctors/pending', [AdminDoctorController::class, 'getPending']);
    Route::get('/doctors', [AdminDoctorController::class, 'index']);
    Route::post('/doctors/{id}/approve', [AdminDoctorController::class, 'approve']);
    Route::post('/doctors/{id}/reject', [AdminDoctorController::class, 'reject']);
    Route::post('/doctors/{id}/block', [AdminDoctorController::class, 'block']);
});
EOF
    chown www-data:www-data routes/api.php
    echo "✅ routes/api.php criado"
fi

# 2. Verificar se RouteServiceProvider ou bootstrap/app.php carrega routes/api.php
echo ""
echo "2️⃣ Verificando carregamento de routes/api.php..."

if [ -f "bootstrap/app.php" ]; then
    if grep -q "routes/api.php\|'api'" bootstrap/app.php; then
        echo "✅ bootstrap/app.php carrega routes/api.php"
        grep -A 3 "api" bootstrap/app.php | head -5
    else
        echo "⚠️  bootstrap/app.php pode não estar carregando routes/api.php"
        echo "   Verifique se há: ->withRouting(web: __DIR__.'/../routes/web.php', api: __DIR__.'/../routes/api.php')"
    fi
fi

# 3. Verificar se há outro arquivo de rotas sendo usado
echo ""
echo "3️⃣ Verificando outros arquivos de rotas..."
if [ -f "routes/web.php" ]; then
    if grep -q "admin/users\|admin/doctors" routes/web.php; then
        echo "⚠️  Rotas admin encontradas em routes/web.php (pode causar conflito)"
        echo "   Considere removê-las de routes/web.php"
    else
        echo "✅ Rotas admin não estão em routes/web.php"
    fi
fi

# 4. Limpar cache de rotas
echo ""
echo "4️⃣ Limpando cache de rotas..."
php artisan route:clear 2>/dev/null || true
php artisan config:clear 2>/dev/null || true
php artisan cache:clear 2>/dev/null || true
echo "✅ Caches limpos"

# 5. Listar rotas admin
echo ""
echo "5️⃣ Listando rotas admin disponíveis..."
php artisan route:list | grep -i "admin" || echo "⚠️  Nenhuma rota admin encontrada"

echo ""
echo "✅ Verificação concluída!"
echo ""
echo "📝 Se as rotas ainda não aparecerem:"
echo "   1. Verifique se routes/api.php está sendo carregado em bootstrap/app.php"
echo "   2. Reinicie o servidor web: sudo systemctl restart nginx"
echo "   3. Reinicie PHP-FPM: sudo systemctl restart php8.2-fpm"


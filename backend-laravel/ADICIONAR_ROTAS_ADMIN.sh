#!/bin/bash

# Script simples para adicionar rotas admin ao routes/api.php

set -e

cd /var/www/lacos-backend

echo "🔧 Adicionando rotas admin ao routes/api.php..."

# 1. Verificar se routes/api.php existe
if [ ! -f "routes/api.php" ]; then
    echo "📝 Criando routes/api.php..."
    mkdir -p routes
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
else
    echo "✅ routes/api.php existe"
    
    # Verificar se as rotas já existem
    if grep -q "AdminUserController\|AdminDoctorController" routes/api.php; then
        echo "✅ Rotas admin já existem em routes/api.php"
    else
        echo "📝 Adicionando rotas admin..."
        
        # Fazer backup
        cp routes/api.php routes/api.php.backup.$(date +%s)
        
        # Adicionar imports se não existirem
        if ! grep -q "use App\\\\Http\\\\Controllers\\\\Api\\\\AdminUserController;" routes/api.php; then
            # Adicionar após outros use statements
            sed -i '/^use /a\\use App\\Http\\Controllers\\Api\\AdminUserController;\\nuse App\\Http\\Controllers\\Api\\AdminDoctorController;' routes/api.php
        fi
        
        # Adicionar rotas no final do arquivo
        cat >> routes/api.php << 'EOF'

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
        echo "✅ Rotas adicionadas"
    fi
fi

# 2. Limpar cache
echo ""
echo "🧹 Limpando cache..."
php artisan route:clear 2>/dev/null || true
php artisan config:clear 2>/dev/null || true
php artisan cache:clear 2>/dev/null || true
echo "✅ Caches limpos"

# 3. Verificar rotas
echo ""
echo "📋 Verificando rotas admin..."
php artisan route:list 2>/dev/null | grep -i "admin" || echo "⚠️  Nenhuma rota admin encontrada. Verifique se routes/api.php está sendo carregado."

echo ""
echo "✅ Concluído!"
echo ""
echo "📝 Se as rotas não aparecerem:"
echo "   1. Verifique se routes/api.php está sendo carregado em bootstrap/app.php"
echo "   2. Execute: php artisan route:list | grep admin"
echo "   3. Reinicie o servidor: sudo systemctl restart php8.2-fpm"


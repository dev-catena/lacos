#!/bin/bash

# Script para corrigir rotas de login completamente

set -e

cd /var/www/lacos-backend

echo "🔧 Corrigindo rotas de login (app mobile + web admin)..."
echo ""

# 1. Fazer backup
echo "1️⃣ Fazendo backup..."
cp routes/api.php routes/api.php.backup.$(date +%s)
echo "✅ Backup criado"
echo ""

# 2. Recriar routes/api.php corretamente
echo "2️⃣ Recriando routes/api.php..."
cat > routes/api.php << 'EOF'
<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AdminAuthController;
use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\AdminDoctorController;
use Illuminate\Support\Facades\Route;

// ==================== ROTAS PÚBLICAS ====================

// Login e Register para app mobile
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

// Login Admin/Root para aplicação web
Route::post('/admin/login', [AdminAuthController::class, 'login']);

// ==================== ROTAS AUTENTICADAS ====================

Route::middleware('auth:sanctum')->group(function () {
    
    // Logout Admin
    Route::post('/admin/logout', [AdminAuthController::class, 'logout']);
    
    // Logout app mobile
    Route::post('/logout', [AuthController::class, 'logout']);
    
    // Rotas Admin - Requerem autenticação
    Route::prefix('admin')->group(function () {
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
});
EOF

chown www-data:www-data routes/api.php
echo "✅ routes/api.php recriado"
echo ""

# 3. Verificar sintaxe
echo "3️⃣ Verificando sintaxe..."
if php -l routes/api.php 2>&1 | grep -q "No syntax errors"; then
    echo "✅ Sintaxe OK"
else
    echo "❌ Erro de sintaxe:"
    php -l routes/api.php
    exit 1
fi
echo ""

# 4. Limpar cache
echo "4️⃣ Limpando cache..."
php artisan route:clear 2>/dev/null || true
php artisan config:clear 2>/dev/null || true
php artisan cache:clear 2>/dev/null || true
echo "✅ Caches limpos"
echo ""

# 5. Listar rotas
echo "5️⃣ Listando rotas de autenticação..."
php artisan route:list 2>/dev/null | grep -E "login|register|logout" || echo "⚠️  Nenhuma rota encontrada"
echo ""

# 6. Testar rotas
echo "6️⃣ Testando rotas..."
echo ""

# Testar /api/login (app mobile)
echo "📱 Testando /api/login (app mobile)..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost/api/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@test.com","password":"test"}' 2>&1)

if [ "$HTTP_CODE" = "422" ] || [ "$HTTP_CODE" = "401" ]; then
    echo "   ✅ Rota /api/login acessível (código $HTTP_CODE é esperado)"
elif [ "$HTTP_CODE" = "404" ]; then
    echo "   ❌ Rota /api/login NÃO encontrada (404)"
else
    echo "   📊 Código HTTP: $HTTP_CODE"
fi

# Testar /api/admin/login (web admin)
echo ""
echo "🌐 Testando /api/admin/login (web admin)..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost/api/admin/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"root@lacos.com","password":"yhvh77"}' 2>&1)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ]; then
    echo "   ✅ Rota /api/admin/login acessível (código $HTTP_CODE)"
elif [ "$HTTP_CODE" = "404" ]; then
    echo "   ❌ Rota /api/admin/login NÃO encontrada (404)"
else
    echo "   📊 Código HTTP: $HTTP_CODE"
fi
echo ""

echo "✅ Correção concluída!"
echo ""
echo "📝 Rotas disponíveis:"
echo "   POST /api/login - Login app mobile"
echo "   POST /api/register - Registro app mobile"
echo "   POST /api/admin/login - Login web admin"
echo "   POST /api/logout - Logout app mobile"
echo "   POST /api/admin/logout - Logout web admin"
echo ""
echo "🔄 Se ainda houver problemas:"
echo "   1. Reinicie PHP-FPM: sudo systemctl restart php8.2-fpm"
echo "   2. Reinicie Nginx: sudo systemctl restart nginx"
echo "   3. Verifique logs: tail -f storage/logs/laravel.log"


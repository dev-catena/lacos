#!/bin/bash

# Script para restaurar todas as rotas do routes_api_corrigido.php

set -e

cd /var/www/lacos-backend

echo "🔧 Restaurando rotas completas do app..."
echo ""

# 1. Encontrar routes_api_corrigido.php
SOURCE_FILE=""
if [ -f "/tmp/routes_api_corrigido.php" ]; then
    SOURCE_FILE="/tmp/routes_api_corrigido.php"
    echo "✅ Encontrado em /tmp/"
elif [ -f "routes_api_corrigido.php" ]; then
    SOURCE_FILE="routes_api_corrigido.php"
    echo "✅ Encontrado no diretório atual"
elif [ -f "/home/darley/routes_api_corrigido.php" ]; then
    SOURCE_FILE="/home/darley/routes_api_corrigido.php"
    echo "✅ Encontrado em /home/darley/"
else
    echo "❌ routes_api_corrigido.php não encontrado!"
    exit 1
fi

# 2. Fazer backup do routes/api.php atual
echo "1️⃣ Fazendo backup do routes/api.php atual..."
if [ -f "routes/api.php" ]; then
    cp routes/api.php routes/api.php.backup.antes_restauracao.$(date +%s)
    echo "✅ Backup criado"
else
    echo "⚠️  routes/api.php não existe, será criado"
fi
echo ""

# 3. Copiar routes_api_corrigido.php para routes/api.php
echo "2️⃣ Restaurando rotas de $SOURCE_FILE para routes/api.php..."
cp "$SOURCE_FILE" routes/api.php
chown www-data:www-data routes/api.php 2>/dev/null || chmod 644 routes/api.php
echo "✅ Rotas restauradas"
echo ""

# 4. Verificar se precisa adicionar rotas de admin que podem não estar no arquivo original
echo "3️⃣ Verificando se precisa adicionar rotas de admin..."
if ! grep -q "AdminUserController\|AdminDoctorController" routes/api.php; then
    echo "📝 Adicionando rotas de admin..."
    
    # Adicionar imports
    if ! grep -q "use App\\\\Http\\\\Controllers\\\\Api\\\\AdminUserController;" routes/api.php; then
        # Adicionar após outros imports de Admin
        sed -i '/use App.*AdminAuthController/a\\use App\\Http\\Controllers\\Api\\AdminUserController;\\nuse App\\Http\\Controllers\\Api\\AdminDoctorController;' routes/api.php
    fi
    
    # Adicionar rotas admin no final do grupo admin (se existir)
    if grep -q "Route::prefix('admin')->group" routes/api.php; then
        # Adicionar dentro do grupo admin
        sed -i "/Route::prefix('admin')->group(function () {/a\\        // Usuários\\n        Route::get('/users', [AdminUserController::class, 'index']);\\n        Route::post('/users/{id}/block', [AdminUserController::class, 'block']);\\n        Route::post('/users/{id}/unblock', [AdminUserController::class, 'unblock']);\\n        Route::get('/users/{id}/plan', [AdminUserController::class, 'getUserPlan']);\\n        \\n        // Médicos\\n        Route::get('/doctors/pending', [AdminDoctorController::class, 'getPending']);\\n        Route::get('/doctors', [AdminDoctorController::class, 'index']);\\n        Route::post('/doctors/{id}/approve', [AdminDoctorController::class, 'approve']);\\n        Route::post('/doctors/{id}/reject', [AdminDoctorController::class, 'reject']);\\n        Route::post('/doctors/{id}/block', [AdminDoctorController::class, 'block']);" routes/api.php
    else
        # Adicionar grupo admin completo
        cat >> routes/api.php << 'EOF'

// Rotas Admin
Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
    Route::get('/users', [AdminUserController::class, 'index']);
    Route::post('/users/{id}/block', [AdminUserController::class, 'block']);
    Route::post('/users/{id}/unblock', [AdminUserController::class, 'unblock']);
    Route::get('/users/{id}/plan', [AdminUserController::class, 'getUserPlan']);
    
    Route::get('/doctors/pending', [AdminDoctorController::class, 'getPending']);
    Route::get('/doctors', [AdminDoctorController::class, 'index']);
    Route::post('/doctors/{id}/approve', [AdminDoctorController::class, 'approve']);
    Route::post('/doctors/{id}/reject', [AdminDoctorController::class, 'reject']);
    Route::post('/doctors/{id}/block', [AdminDoctorController::class, 'block']);
});
EOF
    fi
    echo "✅ Rotas de admin adicionadas"
else
    echo "✅ Rotas de admin já existem"
fi
echo ""

# 5. Verificar sintaxe
echo "4️⃣ Verificando sintaxe..."
if php -l routes/api.php 2>&1 | grep -q "No syntax errors"; then
    echo "✅ Sintaxe OK"
else
    echo "❌ Erro de sintaxe:"
    php -l routes/api.php
    echo ""
    echo "⚠️  Restaurando backup anterior..."
    LATEST_BACKUP=$(ls -t routes/api.php.backup.* | head -1)
    if [ -n "$LATEST_BACKUP" ]; then
        cp "$LATEST_BACKUP" routes/api.php
        echo "✅ Backup restaurado"
    fi
    exit 1
fi
echo ""

# 6. Limpar cache
echo "5️⃣ Limpando cache..."
php artisan route:clear 2>/dev/null || true
php artisan config:clear 2>/dev/null || true
php artisan cache:clear 2>/dev/null || true
echo "✅ Caches limpos"
echo ""

# 7. Listar rotas principais
echo "6️⃣ Verificando rotas principais..."
echo ""
echo "📋 Rotas de autenticação:"
php artisan route:list 2>/dev/null | grep -E "login|register|logout" | head -5
echo ""
echo "📋 Rotas de grupos:"
php artisan route:list 2>/dev/null | grep -i "groups" | head -5
echo ""
echo "📋 Rotas de admin:"
php artisan route:list 2>/dev/null | grep -i "admin" | head -5
echo ""

echo "✅ Restauração concluída!"
echo ""
echo "📝 Rotas restauradas de routes_api_corrigido.php"
echo "   Todas as rotas do app mobile devem estar disponíveis agora"
echo ""
echo "🔄 Se ainda houver problemas:"
echo "   1. Verifique logs: tail -f storage/logs/laravel.log"
echo "   2. Reinicie: sudo systemctl restart php8.2-fpm && sudo systemctl restart nginx"
echo "   3. Teste: php artisan route:list | grep groups"


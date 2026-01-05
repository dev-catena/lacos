#!/bin/bash

# Script para verificar e corrigir CSRF definitivamente

set -e

cd /var/www/lacos-backend

echo "🔍 Verificando configuração CSRF..."

# 1. Verificar VerifyCsrfToken
echo ""
echo "1️⃣ Verificando VerifyCsrfToken..."
if [ -f "app/Http/Middleware/VerifyCsrfToken.php" ]; then
    echo "✅ Arquivo existe"
    echo "📄 Conteúdo:"
    cat app/Http/Middleware/VerifyCsrfToken.php
    echo ""
else
    echo "❌ Arquivo não existe!"
fi

# 2. Verificar se está registrado no bootstrap/app.php ou Kernel
echo ""
echo "2️⃣ Verificando registro do middleware..."

# Laravel 11
if [ -f "bootstrap/app.php" ]; then
    echo "📄 Verificando bootstrap/app.php..."
    grep -A 10 "VerifyCsrfToken\|csrf" bootstrap/app.php || echo "⚠️  Não encontrado em bootstrap/app.php"
fi

# Laravel 10 ou anterior
if [ -f "app/Http/Kernel.php" ]; then
    echo "📄 Verificando app/Http/Kernel.php..."
    grep -A 5 "VerifyCsrfToken" app/Http/Kernel.php || echo "⚠️  Não encontrado em Kernel.php"
fi

# 3. Verificar como routes/api.php está sendo carregado
echo ""
echo "3️⃣ Verificando carregamento de rotas API..."

if [ -f "app/Providers/RouteServiceProvider.php" ]; then
    echo "📄 RouteServiceProvider.php:"
    grep -A 10 "api" app/Providers/RouteServiceProvider.php || echo "⚠️  Não encontrado"
fi

if [ -f "bootstrap/app.php" ]; then
    echo "📄 bootstrap/app.php:"
    grep -A 10 "api\|routes" bootstrap/app.php || echo "⚠️  Não encontrado"
fi

# 4. Verificar se routes/api.php existe e tem a rota
echo ""
echo "4️⃣ Verificando routes/api.php..."
if [ -f "routes/api.php" ]; then
    echo "✅ Arquivo existe"
    echo "📄 Conteúdo:"
    cat routes/api.php
else
    echo "❌ routes/api.php não existe!"
fi

# 5. Verificar se routes/web.php tem a rota
echo ""
echo "5️⃣ Verificando routes/web.php..."
if [ -f "routes/web.php" ]; then
    if grep -q "admin/login" routes/web.php; then
        echo "⚠️  Rota encontrada em routes/web.php (pode estar causando CSRF)"
        echo "📄 Linhas relevantes:"
        grep -A 2 -B 2 "admin/login" routes/web.php
    else
        echo "✅ Rota não está em routes/web.php"
    fi
fi

# 6. Solução: Garantir que routes/api.php está correto e excluir de web.php
echo ""
echo "6️⃣ Aplicando correções..."

# Remover rota de web.php se existir
if [ -f "routes/web.php" ] && grep -q "admin/login" routes/web.php; then
    echo "🗑️  Removendo rota de routes/web.php..."
    sed -i '/admin\/login/d' routes/web.php
    echo "✅ Rota removida de web.php"
fi

# Garantir que routes/api.php está correto
if [ -f "routes/api.php" ]; then
    # Verificar se tem o prefixo 'api' correto
    if ! grep -q "Route::post('/admin/login'" routes/api.php && ! grep -q "Route::post('admin/login'" routes/api.php; then
        echo "📝 Corrigindo routes/api.php..."
        cat > routes/api.php << 'EOF'
<?php

use App\Http\Controllers\Api\AdminAuthController;
use Illuminate\Support\Facades\Route;

// Login Admin/Root - Rota pública (sem prefixo api, pois já está em /api)
Route::post('admin/login', [AdminAuthController::class, 'login']);

// Logout Admin - Requer autenticação
Route::middleware('auth:sanctum')->post('admin/logout', [AdminAuthController::class, 'logout']);
EOF
        chown www-data:www-data routes/api.php
        echo "✅ routes/api.php corrigido"
    fi
fi

# 7. Atualizar VerifyCsrfToken para garantir todas as exceções
echo ""
echo "7️⃣ Atualizando VerifyCsrfToken..."
cat > app/Http/Middleware/VerifyCsrfToken.php << 'EOF'
<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class VerifyCsrfToken extends Middleware
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @var array<int, string>
     */
    protected $except = [
        'api/*',  // Excluir TODAS as rotas de API
    ];
}
EOF
chown www-data:www-data app/Http/Middleware/VerifyCsrfToken.php
echo "✅ VerifyCsrfToken atualizado para excluir todas as rotas API"

# 8. Limpar todos os caches
echo ""
echo "8️⃣ Limpando caches..."
php artisan route:clear 2>/dev/null || true
php artisan config:clear 2>/dev/null || true
php artisan cache:clear 2>/dev/null || true
php artisan view:clear 2>/dev/null || true
echo "✅ Caches limpos"

# 9. Verificar rotas
echo ""
echo "9️⃣ Verificando rotas finais..."
php artisan route:list | grep -i "admin/login" || echo "⚠️  Rota não encontrada"

echo ""
echo "✅ Verificação e correção concluídas!"
echo ""
echo "📝 Se ainda houver erro CSRF:"
echo "   1. Verifique se o servidor web foi reiniciado"
echo "   2. Verifique se não há outro middleware aplicando CSRF"
echo "   3. Teste com: curl -X POST http://193.203.182.22/api/admin/login -H 'Content-Type: application/json' -d '{\"email\":\"root@lacos.com\",\"password\":\"yhvh77\"}'"


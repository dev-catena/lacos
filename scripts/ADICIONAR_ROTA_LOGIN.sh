#!/bin/bash

# Script para adicionar rota de login ao routes/api.php

set -e

cd /var/www/lacos-backend

echo "🔧 Adicionando rota /api/login ao routes/api.php..."
echo ""

# 1. Verificar se routes/api.php existe
if [ ! -f "routes/api.php" ]; then
    echo "📝 Criando routes/api.php..."
    mkdir -p routes
    cat > routes/api.php << 'EOF'
<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AdminAuthController;
use Illuminate\Support\Facades\Route;

// Rotas públicas de autenticação
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

// Login Admin/Root
Route::post('/admin/login', [AdminAuthController::class, 'login']);
EOF
    chown www-data:www-data routes/api.php
    echo "✅ routes/api.php criado com rotas de login"
else
    echo "✅ routes/api.php existe"
    
    # Verificar se rota de login existe
    if grep -q "Route::post.*'/login'\|Route::post.*'/register'" routes/api.php; then
        echo "✅ Rotas de login/register já existem"
    else
        echo "📝 Adicionando rotas de login/register..."
        
        # Fazer backup
        cp routes/api.php routes/api.php.backup.$(date +%s)
        
        # Adicionar import se não existir
        if ! grep -q "use App\\\\Http\\\\Controllers\\\\Api\\\\AuthController;" routes/api.php; then
            # Adicionar após outros use statements
            sed -i '/^use /a\\use App\\Http\\Controllers\\Api\\AuthController;' routes/api.php
        fi
        
        # Adicionar rotas no início do arquivo (após use statements)
        # Encontrar linha após último use
        LAST_USE_LINE=$(grep -n "^use " routes/api.php | tail -1 | cut -d: -f1)
        if [ -n "$LAST_USE_LINE" ]; then
            # Adicionar rotas após use statements
            sed -i "${LAST_USE_LINE}a\\\n// Rotas públicas de autenticação\nRoute::post('/login', [AuthController::class, 'login']);\nRoute::post('/register', [AuthController::class, 'register']);" routes/api.php
            echo "✅ Rotas adicionadas"
        else
            # Se não houver use statements, adicionar no início
            sed -i "1a\\use App\\Http\\Controllers\\Api\\AuthController;\n\n// Rotas públicas de autenticação\nRoute::post('/login', [AuthController::class, 'login']);\nRoute::post('/register', [AuthController::class, 'register']);" routes/api.php
            echo "✅ Rotas adicionadas"
        fi
    fi
fi

# 2. Verificar se AuthController existe
echo ""
echo "2️⃣ Verificando AuthController..."
if [ -f "app/Http/Controllers/Api/AuthController.php" ]; then
    echo "✅ AuthController existe"
else
    echo "❌ AuthController NÃO encontrado!"
    echo "   Verifique se o arquivo existe em app/Http/Controllers/Api/"
fi
echo ""

# 3. Limpar cache
echo "3️⃣ Limpando cache..."
php artisan route:clear 2>/dev/null || true
php artisan config:clear 2>/dev/null || true
php artisan cache:clear 2>/dev/null || true
echo "✅ Caches limpos"
echo ""

# 4. Listar rotas de login
echo "4️⃣ Listando rotas de login..."
php artisan route:list 2>/dev/null | grep -i "login\|register" || echo "⚠️  Nenhuma rota encontrada"
echo ""

# 5. Testar rota
echo "5️⃣ Testando rota /api/login..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost/api/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@test.com","password":"test"}' 2>&1)

if [ "$HTTP_CODE" = "422" ] || [ "$HTTP_CODE" = "401" ]; then
    echo "✅ Rota /api/login está acessível (código $HTTP_CODE é esperado para credenciais inválidas)"
elif [ "$HTTP_CODE" = "404" ]; then
    echo "❌ Rota /api/login NÃO encontrada (404)"
    echo "   Verifique se routes/api.php está sendo carregado"
else
    echo "📊 Código HTTP: $HTTP_CODE"
fi
echo ""

echo "✅ Verificação concluída!"
echo ""
echo "📝 Se a rota ainda não funcionar:"
echo "   1. Verifique se routes/api.php está sendo carregado em bootstrap/app.php"
echo "   2. Execute: php artisan route:list | grep login"
echo "   3. Reinicie o servidor: sudo systemctl restart php8.2-fpm && sudo systemctl restart nginx"


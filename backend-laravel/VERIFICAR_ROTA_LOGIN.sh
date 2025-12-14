#!/bin/bash

# Script para verificar e corrigir rota de login

set -e

cd /var/www/lacos-backend

echo "🔍 Verificando rota /api/login..."
echo ""

# 1. Verificar routes/api.php
echo "1️⃣ Verificando routes/api.php..."
if [ -f "routes/api.php" ]; then
    echo "✅ routes/api.php existe"
    if grep -q "Route::post.*login\|'/login'" routes/api.php; then
        echo "✅ Rota /login encontrada em routes/api.php"
        echo "📄 Linhas relevantes:"
        grep -n "login" routes/api.php | head -5
    else
        echo "❌ Rota /login NÃO encontrada em routes/api.php"
        echo "📝 Adicionando rota..."
        
        # Verificar se AuthController existe
        if [ -f "app/Http/Controllers/Api/AuthController.php" ]; then
            echo "✅ AuthController existe"
            
            # Adicionar import se não existir
            if ! grep -q "use App\\\\Http\\\\Controllers\\\\Api\\\\AuthController;" routes/api.php; then
                sed -i '/^use /a\\use App\\Http\\Controllers\\Api\\AuthController;' routes/api.php
            fi
            
            # Adicionar rota de login
            if ! grep -q "Route::post('/login'" routes/api.php; then
                # Adicionar após outros Route::post públicos
                cat >> routes/api.php << 'EOF'

// Login público
Route::post('/login', [AuthController::class, 'login']);
EOF
                echo "✅ Rota /login adicionada"
            fi
        else
            echo "❌ AuthController não encontrado!"
        fi
    fi
else
    echo "❌ routes/api.php não existe!"
    echo "📝 Criando routes/api.php com rota de login..."
    
    cat > routes/api.php << 'EOF'
<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;

// Login público
Route::post('/login', [AuthController::class, 'login']);

// Register público
Route::post('/register', [AuthController::class, 'register']);
EOF
    chown www-data:www-data routes/api.php
    echo "✅ routes/api.php criado"
fi
echo ""

# 2. Verificar se há outro arquivo de rotas
echo "2️⃣ Verificando outros arquivos de rotas..."
if [ -f "routes/web.php" ]; then
    if grep -q "api/login\|Route::post.*login" routes/web.php; then
        echo "⚠️  Rota login encontrada em routes/web.php"
        echo "   Isso pode causar conflito se não tiver prefixo /api"
    fi
fi
echo ""

# 3. Verificar se RouteServiceProvider ou bootstrap/app.php carrega routes/api.php
echo "3️⃣ Verificando carregamento de routes/api.php..."
if [ -f "bootstrap/app.php" ]; then
    if grep -q "routes/api.php\|'api'" bootstrap/app.php; then
        echo "✅ bootstrap/app.php carrega routes/api.php"
    else
        echo "⚠️  bootstrap/app.php pode não estar carregando routes/api.php"
    fi
fi
echo ""

# 4. Limpar cache de rotas
echo "4️⃣ Limpando cache de rotas..."
php artisan route:clear 2>/dev/null || true
php artisan config:clear 2>/dev/null || true
php artisan cache:clear 2>/dev/null || true
echo "✅ Caches limpos"
echo ""

# 5. Listar rotas de login
echo "5️⃣ Listando rotas de login disponíveis..."
php artisan route:list 2>/dev/null | grep -i "login" || echo "⚠️  Nenhuma rota login encontrada"
echo ""

# 6. Testar rota
echo "6️⃣ Testando rota /api/login..."
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
echo "   3. Reinicie o servidor web: sudo systemctl restart nginx"
echo "   4. Reinicie PHP-FPM: sudo systemctl restart php8.2-fpm"


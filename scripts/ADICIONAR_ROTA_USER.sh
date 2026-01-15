#!/bin/bash

# Script para adicionar rota /api/user

set -e

cd /var/www/lacos-backend

echo "🔧 Adicionando rota /api/user ao routes/api.php..."
echo ""

# 1. Verificar se routes/api.php existe
if [ ! -f "routes/api.php" ]; then
    echo "❌ routes/api.php não existe!"
    exit 1
fi

# 2. Verificar se rota /user já existe
if grep -q "Route::get.*'/user'\|Route::get.*user" routes/api.php; then
    echo "✅ Rota /user já existe"
else
    echo "📝 Adicionando rota /user..."
    
    # Fazer backup
    cp routes/api.php routes/api.php.backup.$(date +%s)
    
    # Verificar se está dentro de middleware auth:sanctum
    if grep -q "Route::middleware('auth:sanctum')" routes/api.php; then
        # Adicionar dentro do grupo autenticado
        # Encontrar linha do grupo auth:sanctum
        AUTH_GROUP_LINE=$(grep -n "Route::middleware('auth:sanctum')" routes/api.php | head -1 | cut -d: -f1)
        if [ -n "$AUTH_GROUP_LINE" ]; then
            # Encontrar linha do group(function
            GROUP_LINE=$(sed -n "${AUTH_GROUP_LINE},50p" routes/api.php | grep -n "->group(function" | head -1 | cut -d: -f1)
            GROUP_LINE=$((AUTH_GROUP_LINE + GROUP_LINE - 1))
            
            # Adicionar rota /user após a abertura do grupo
            sed -i "${GROUP_LINE}a\\    Route::get('/user', function (\\Illuminate\\Http\\Request \\\$request) {\\n        return response()->json(\\\$request->user());\\n    });" routes/api.php
            echo "✅ Rota /user adicionada dentro do grupo autenticado"
        else
            # Adicionar grupo autenticado se não existir
            cat >> routes/api.php << 'EOF'

// Rotas autenticadas
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (\Illuminate\Http\Request $request) {
        return response()->json($request->user());
    });
});
EOF
            echo "✅ Grupo autenticado e rota /user adicionados"
        fi
    else
        # Adicionar grupo autenticado completo
        cat >> routes/api.php << 'EOF'

// Rotas autenticadas
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (\Illuminate\Http\Request $request) {
        return response()->json($request->user());
    });
});
EOF
        echo "✅ Grupo autenticado e rota /user adicionados"
    fi
fi

# 3. Verificar se precisa adicionar use Illuminate\Http\Request
if ! grep -q "use Illuminate\\\\Http\\\\Request;" routes/api.php; then
    # Adicionar após outros use statements
    sed -i '/^use /a\\use Illuminate\\Http\\Request;' routes/api.php
    echo "✅ Import Request adicionado"
fi

# 4. Verificar sintaxe
echo ""
echo "4️⃣ Verificando sintaxe..."
if php -l routes/api.php 2>&1 | grep -q "No syntax errors"; then
    echo "✅ Sintaxe OK"
else
    echo "❌ Erro de sintaxe:"
    php -l routes/api.php
    echo ""
    echo "⚠️  Restaurando backup..."
    LATEST_BACKUP=$(ls -t routes/api.php.backup.* | head -1)
    if [ -n "$LATEST_BACKUP" ]; then
        cp "$LATEST_BACKUP" routes/api.php
        echo "✅ Backup restaurado"
    fi
    exit 1
fi
echo ""

# 5. Limpar cache
echo "5️⃣ Limpando cache..."
php artisan route:clear 2>/dev/null || true
php artisan config:clear 2>/dev/null || true
php artisan cache:clear 2>/dev/null || true
echo "✅ Caches limpos"
echo ""

# 6. Listar rotas
echo "6️⃣ Listando rotas de user..."
php artisan route:list 2>/dev/null | grep -i "user" | head -5 || echo "⚠️  Nenhuma rota encontrada"
echo ""

# 7. Testar rota
echo "7️⃣ Testando rota /api/user..."
echo "   (Esta rota requer autenticação, então 401 é esperado sem token)"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET http://localhost/api/user 2>&1)

if [ "$HTTP_CODE" = "401" ]; then
    echo "   ✅ Rota /api/user acessível (401 é esperado sem token)"
elif [ "$HTTP_CODE" = "404" ]; then
    echo "   ❌ Rota /api/user NÃO encontrada (404)"
else
    echo "   📊 Código HTTP: $HTTP_CODE"
fi
echo ""

echo "✅ Verificação concluída!"
echo ""
echo "📝 Se a rota ainda não funcionar:"
echo "   1. Verifique se routes/api.php está sendo carregado"
echo "   2. Execute: php artisan route:list | grep user"
echo "   3. Reinicie: sudo systemctl restart php8.2-fpm"


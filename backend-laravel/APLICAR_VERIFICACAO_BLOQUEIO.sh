#!/bin/bash

# Script para aplicar verificação de bloqueio no endpoint /api/user
# Execute no servidor como root ou com sudo

set -e

cd /var/www/lacos-backend

echo "🔒 Aplicando verificação de bloqueio no endpoint /api/user..."
echo ""

# 1. Fazer backup do routes/api.php
echo "1️⃣ Fazendo backup do routes/api.php..."
if [ -f "routes/api.php" ]; then
    BACKUP_FILE="routes/api.php.backup.$(date +%s)"
    cp routes/api.php "$BACKUP_FILE"
    echo "✅ Backup criado: $BACKUP_FILE"
else
    echo "❌ routes/api.php não encontrado!"
    exit 1
fi
echo ""

# 2. Verificar se a rota /user existe
echo "2️⃣ Verificando se a rota /user existe..."
if grep -q "Route::get.*'/user'" routes/api.php; then
    echo "✅ Rota /user encontrada"
    
    # 3. Verificar se já tem a verificação de bloqueio
    if grep -q "is_blocked" routes/api.php && grep -q "account_blocked" routes/api.php; then
        echo "✅ Verificação de bloqueio já está implementada!"
        echo ""
        echo "📋 Resumo:"
        echo "   • Endpoint /api/user já verifica bloqueio"
        echo "   • Retorna 403 com account_blocked se bloqueado"
        echo "   • Revoga tokens automaticamente"
        exit 0
    fi
    
    # 4. Modificar a rota /user existente
    echo "📝 Modificando rota /user para adicionar verificação de bloqueio..."
    
    # Criar arquivo temporário com a nova rota
    cat > /tmp/user_route_new.php << 'EOF'
    // User & Auth
    Route::get('/user', function (Request $request) {
        $user = $request->user();
        
        // Verificar se o usuário está bloqueado
        if ($user && $user->is_blocked) {
            // Revogar todos os tokens do usuário bloqueado
            $user->tokens()->delete();
            
            return response()->json([
                'message' => 'Acesso negado. Sua conta foi bloqueada.',
                'error' => 'account_blocked'
            ], 403);
        }
        
        return response()->json($user);
    });
EOF
    
    # Encontrar a linha da rota /user atual
    USER_ROUTE_LINE=$(grep -n "Route::get.*'/user'" routes/api.php | head -1 | cut -d: -f1)
    
    if [ -n "$USER_ROUTE_LINE" ]; then
        # Encontrar onde termina a função (próxima linha com Route:: ou fechamento do grupo)
        END_LINE=$(sed -n "${USER_ROUTE_LINE},100p" routes/api.php | grep -n -E "^\s*Route::|^\s*}\);|^\s*\);" | head -1 | cut -d: -f1)
        END_LINE=$((USER_ROUTE_LINE + END_LINE - 1))
        
        # Remover a rota antiga e inserir a nova
        sed -i "${USER_ROUTE_LINE},${END_LINE}d" routes/api.php
        sed -i "${USER_ROUTE_LINE}i\\$(cat /tmp/user_route_new.php)" routes/api.php
        
        echo "✅ Rota /user atualizada com verificação de bloqueio"
    else
        echo "⚠️  Não foi possível localizar a rota /user para modificação"
        echo "   Tentando adicionar manualmente..."
    fi
    
else
    echo "⚠️  Rota /user não encontrada em routes/api.php"
    echo "📝 Adicionando rota /user com verificação de bloqueio..."
    
    # Verificar se existe grupo auth:sanctum
    if grep -q "Route::middleware('auth:sanctum')" routes/api.php; then
        # Encontrar onde adicionar a rota (dentro do grupo auth:sanctum)
        AUTH_GROUP_LINE=$(grep -n "Route::middleware('auth:sanctum')" routes/api.php | head -1 | cut -d: -f1)
        GROUP_OPEN_LINE=$(sed -n "${AUTH_GROUP_LINE},50p" routes/api.php | grep -n "->group(function" | head -1 | cut -d: -f1)
        GROUP_OPEN_LINE=$((AUTH_GROUP_LINE + GROUP_OPEN_LINE))
        
        # Adicionar a rota após a abertura do grupo
        sed -i "${GROUP_OPEN_LINE}a\\$(cat /tmp/user_route_new.php)" routes/api.php
        echo "✅ Rota /user adicionada dentro do grupo auth:sanctum"
    else
        # Adicionar grupo auth:sanctum e a rota
        cat >> routes/api.php << 'EOF'

// ==================== ROTAS AUTENTICADAS ====================

Route::middleware('auth:sanctum')->group(function () {
    
    // User & Auth
    Route::get('/user', function (Request $request) {
        $user = $request->user();
        
        // Verificar se o usuário está bloqueado
        if ($user && $user->is_blocked) {
            // Revogar todos os tokens do usuário bloqueado
            $user->tokens()->delete();
            
            return response()->json([
                'message' => 'Acesso negado. Sua conta foi bloqueada.',
                'error' => 'account_blocked'
            ], 403);
        }
        
        return response()->json($user);
    });
    
});
EOF
        echo "✅ Grupo auth:sanctum e rota /user adicionados"
    fi
fi

# Limpar arquivo temporário
rm -f /tmp/user_route_new.php

# 5. Verificar se precisa adicionar use Illuminate\Http\Request
echo ""
echo "3️⃣ Verificando imports necessários..."
if ! grep -q "use Illuminate\\Http\\Request" routes/api.php; then
    # Adicionar após os outros imports
    if grep -q "^use " routes/api.php; then
        LAST_USE_LINE=$(grep -n "^use " routes/api.php | tail -1 | cut -d: -f1)
        sed -i "${LAST_USE_LINE}a\\use Illuminate\\Http\\Request;" routes/api.php
        echo "✅ Import Request adicionado"
    else
        # Adicionar no início após <?php
        sed -i "2a\\use Illuminate\\Http\\Request;" routes/api.php
        echo "✅ Import Request adicionado"
    fi
else
    echo "✅ Import Request já existe"
fi

# 6. Ajustar permissões
echo ""
echo "4️⃣ Ajustando permissões..."
chown www-data:www-data routes/api.php 2>/dev/null || chmod 644 routes/api.php
echo "✅ Permissões ajustadas"

# 7. Verificar sintaxe PHP
echo ""
echo "5️⃣ Verificando sintaxe PHP..."
if php -l routes/api.php > /dev/null 2>&1; then
    echo "✅ Sintaxe PHP válida"
else
    echo "❌ Erro na sintaxe PHP!"
    echo "   Restaurando backup..."
    cp "$BACKUP_FILE" routes/api.php
    exit 1
fi

# 8. Limpar cache
echo ""
echo "6️⃣ Limpando cache do Laravel..."
php artisan route:clear 2>/dev/null || true
php artisan config:clear 2>/dev/null || true
echo "✅ Cache limpo"

echo ""
echo "=========================================="
echo "✅ Verificação de bloqueio aplicada!"
echo "=========================================="
echo ""
echo "📋 O que foi implementado:"
echo "   • Endpoint /api/user agora verifica se usuário está bloqueado"
echo "   • Retorna 403 com error 'account_blocked' se bloqueado"
echo "   • Revoga todos os tokens do usuário bloqueado automaticamente"
echo ""
echo "🧪 Para testar:"
echo "   1. Bloqueie um usuário via interface web"
echo "   2. Tente fazer uma requisição GET /api/user com token desse usuário"
echo "   3. Deve retornar 403 com mensagem de conta bloqueada"
echo ""
echo "📝 Backup salvo em: $BACKUP_FILE"
echo ""


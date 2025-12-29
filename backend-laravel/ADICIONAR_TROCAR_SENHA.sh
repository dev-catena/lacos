#!/bin/bash

# Script para adicionar funcionalidade de trocar senha
# Este script adiciona o método changePassword ao AuthController
# e a rota /change-password ao routes/api.php

set -e

echo "🔐 Adicionando funcionalidade de trocar senha..."
echo ""

# Diretório do projeto Laravel
LARAVEL_DIR="/var/www/lacos-backend"

# Verificar se o diretório existe
if [ ! -d "$LARAVEL_DIR" ]; then
    echo "❌ Diretório $LARAVEL_DIR não encontrado!"
    echo "   Ajuste a variável LARAVEL_DIR no script se necessário."
    exit 1
fi

cd "$LARAVEL_DIR"

echo "📁 Diretório de trabalho: $(pwd)"
echo ""

# ==================== 1. AUTH CONTROLLER ====================
echo "1️⃣ Adicionando método changePassword ao AuthController..."

AUTH_CONTROLLER="app/Http/Controllers/Api/AuthController.php"

# Verificar se o arquivo existe
if [ ! -f "$AUTH_CONTROLLER" ]; then
    echo "❌ Arquivo $AUTH_CONTROLLER não encontrado!"
    echo "   Verificando se existe em outro local..."
    
    # Tentar encontrar o arquivo
    FIND_RESULT=$(find . -name "AuthController.php" -type f 2>/dev/null | head -1)
    if [ -n "$FIND_RESULT" ]; then
        AUTH_CONTROLLER="$FIND_RESULT"
        echo "✅ Arquivo encontrado em: $AUTH_CONTROLLER"
    else
        echo "❌ AuthController.php não encontrado!"
        exit 1
    fi
fi

# Fazer backup
BACKUP_FILE="${AUTH_CONTROLLER}.backup.$(date +%s)"
cp "$AUTH_CONTROLLER" "$BACKUP_FILE"
echo "✅ Backup criado: $BACKUP_FILE"

# Verificar se o método changePassword já existe
if grep -q "public function changePassword" "$AUTH_CONTROLLER"; then
    echo "⚠️  Método changePassword já existe no AuthController!"
    echo "   Pulando adição do método..."
else
    # Encontrar a última chave de fechamento da classe
    # Vamos adicionar antes do último }
    
    # Criar arquivo temporário com o novo método
    cat > /tmp/changePassword_method.php << 'METHOD_EOF'

    /**
     * Alterar senha do usuário autenticado
     */
    public function changePassword(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'current_password' => 'required|string',
                'new_password' => 'required|string|min:6',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dados inválidos',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuário não autenticado'
                ], 401);
            }

            // Verificar senha atual
            if (!Hash::check($request->current_password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Senha atual incorreta',
                    'error' => 'invalid_current_password'
                ], 400);
            }

            // Verificar se a nova senha é diferente da atual
            if (Hash::check($request->new_password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'A nova senha deve ser diferente da senha atual',
                    'error' => 'same_password'
                ], 400);
            }

            // Atualizar senha
            $user->password = Hash::make($request->new_password);
            $user->save();

            \Log::info('Senha alterada com sucesso', [
                'user_id' => $user->id,
                'email' => $user->email
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Senha alterada com sucesso'
            ]);
        } catch (\Exception $e) {
            \Log::error('Erro ao alterar senha: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erro ao alterar senha',
                'error' => config('app.debug') ? $e->getMessage() : 'Server Error'
            ], 500);
        }
    }
METHOD_EOF

    # Adicionar o método antes da última chave de fechamento da classe
    # Encontrar a última linha que contém apenas "}"
    LAST_BRACE_LINE=$(grep -n "^}" "$AUTH_CONTROLLER" | tail -1 | cut -d: -f1)
    
    if [ -n "$LAST_BRACE_LINE" ] && [ "$LAST_BRACE_LINE" -gt 1 ]; then
        # Inserir antes da última chave de fechamento
        INSERT_LINE=$((LAST_BRACE_LINE - 1))
        sed -i "${INSERT_LINE}r /tmp/changePassword_method.php" "$AUTH_CONTROLLER"
    else
        # Se não encontrou, adicionar no final antes do último }
        # Remover última linha se for }
        if tail -1 "$AUTH_CONTROLLER" | grep -q "^}"; then
            head -n -1 "$AUTH_CONTROLLER" > "${AUTH_CONTROLLER}.tmp"
            cat /tmp/changePassword_method.php >> "${AUTH_CONTROLLER}.tmp"
            echo "}" >> "${AUTH_CONTROLLER}.tmp"
            mv "${AUTH_CONTROLLER}.tmp" "$AUTH_CONTROLLER"
        else
            # Adicionar no final
            cat /tmp/changePassword_method.php >> "$AUTH_CONTROLLER"
            echo "}" >> "$AUTH_CONTROLLER"
        fi
    fi
    
    echo "✅ Método changePassword adicionado ao AuthController"
fi

# ==================== 2. ROTAS API ====================
echo ""
echo "2️⃣ Adicionando rota /change-password ao routes/api.php..."

ROUTES_FILE="routes/api.php"

# Verificar se o arquivo existe
if [ ! -f "$ROUTES_FILE" ]; then
    echo "⚠️  Arquivo $ROUTES_FILE não encontrado!"
    echo "   Criando arquivo básico..."
    
    # Criar arquivo básico
    cat > "$ROUTES_FILE" << 'ROUTES_EOF'
<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;

// ==================== ROTAS PÚBLICAS ====================
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// ==================== ROTAS AUTENTICADAS ====================
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return response()->json($request->user());
    });
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);
});
ROUTES_EOF
    echo "✅ Arquivo $ROUTES_FILE criado"
else
    # Fazer backup
    BACKUP_ROUTES="${ROUTES_FILE}.backup.$(date +%s)"
    cp "$ROUTES_FILE" "$BACKUP_ROUTES"
    echo "✅ Backup criado: $BACKUP_ROUTES"
    
    # Verificar se a rota já existe
    if grep -q "Route::post('/change-password'" "$ROUTES_FILE" || grep -q 'Route::post("/change-password"' "$ROUTES_FILE"; then
        echo "⚠️  Rota /change-password já existe!"
        echo "   Pulando adição da rota..."
    else
        # Verificar se há grupo de rotas autenticadas
        if grep -q "auth:sanctum" "$ROUTES_FILE"; then
            # Adicionar rota dentro do grupo autenticado
            # Procurar por Route::post('/logout' e adicionar depois
            if grep -q "Route::post('/logout'" "$ROUTES_FILE" || grep -q 'Route::post("/logout"' "$ROUTES_FILE"; then
                # Adicionar após a linha de logout
                sed -i "/Route::post.*logout/a\    Route::post('/change-password', [AuthController::class, 'changePassword']);" "$ROUTES_FILE"
            else
                # Adicionar dentro do grupo auth:sanctum, antes do fechamento
                sed -i "/auth:sanctum.*group(function () {/,/});/ {
                    /});/ i\
    Route::post('/change-password', [AuthController::class, 'changePassword']);
                }" "$ROUTES_FILE"
            fi
        else
            # Criar grupo de rotas autenticadas
            cat >> "$ROUTES_FILE" << 'ROUTES_EOF'

// ==================== ROTAS AUTENTICADAS ====================
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/change-password', [AuthController::class, 'changePassword']);
});
ROUTES_EOF
        fi
        
        # Verificar se AuthController está importado
        if ! grep -q "use App\\Http\\Controllers\\Api\\AuthController;" "$ROUTES_FILE"; then
            # Adicionar import no início do arquivo
            sed -i "/^<?php/a\\\nuse App\\Http\\Controllers\\Api\\AuthController;" "$ROUTES_FILE"
        fi
        
        echo "✅ Rota /change-password adicionada ao routes/api.php"
    fi
fi

# ==================== 3. VERIFICAÇÃO ====================
echo ""
echo "3️⃣ Verificando instalação..."

# Verificar método no AuthController
if grep -q "public function changePassword" "$AUTH_CONTROLLER"; then
    echo "✅ Método changePassword encontrado no AuthController"
else
    echo "❌ Método changePassword NÃO encontrado no AuthController!"
    echo "   Verifique manualmente o arquivo: $AUTH_CONTROLLER"
fi

# Verificar rota no routes/api.php
if grep -q "change-password" "$ROUTES_FILE"; then
    echo "✅ Rota change-password encontrada no routes/api.php"
else
    echo "❌ Rota change-password NÃO encontrada no routes/api.php!"
    echo "   Verifique manualmente o arquivo: $ROUTES_FILE"
fi

# Verificar sintaxe PHP
echo ""
echo "4️⃣ Verificando sintaxe PHP..."

if command -v php &> /dev/null; then
    PHP_CHECK=$(php -l "$AUTH_CONTROLLER" 2>&1)
    if [ $? -eq 0 ]; then
        echo "✅ Sintaxe do AuthController está correta"
    else
        echo "❌ Erro de sintaxe no AuthController:"
        echo "$PHP_CHECK"
    fi
    
    PHP_CHECK_ROUTES=$(php -l "$ROUTES_FILE" 2>&1)
    if [ $? -eq 0 ]; then
        echo "✅ Sintaxe do routes/api.php está correta"
    else
        echo "❌ Erro de sintaxe no routes/api.php:"
        echo "$PHP_CHECK_ROUTES"
    fi
else
    echo "⚠️  PHP não encontrado, pulando verificação de sintaxe"
fi

# ==================== 5. LIMPEZA ====================
echo ""
echo "5️⃣ Limpando arquivos temporários..."
rm -f /tmp/changePassword_method.php
echo "✅ Limpeza concluída"

# ==================== CONCLUSÃO ====================
echo ""
echo "=========================================="
echo "✅ Instalação concluída!"
echo "=========================================="
echo ""
echo "📝 Próximos passos:"
echo "   1. Teste a funcionalidade através do app mobile"
echo "   2. Acesse: Perfil → Segurança → Alterar Senha"
echo "   3. Verifique os logs em storage/logs/laravel.log se houver problemas"
echo ""
echo "📦 Backups criados:"
echo "   - AuthController: ${BACKUP_FILE}"
echo "   - routes/api.php: ${BACKUP_ROUTES}"
echo ""
echo "🔄 Para reverter as mudanças, restaure os arquivos de backup"
echo ""


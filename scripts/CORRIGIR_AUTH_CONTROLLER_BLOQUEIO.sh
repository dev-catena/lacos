#!/bin/bash

# Script para adicionar verificação de bloqueio no AuthController de forma segura
# Execute no servidor como root ou com sudo

set -e

cd /var/www/lacos-backend

echo "🔒 Corrigindo AuthController para verificar bloqueio..."
echo ""

AUTH_CONTROLLER="app/Http/Controllers/Api/AuthController.php"

# 1. Verificar se AuthController existe
if [ ! -f "$AUTH_CONTROLLER" ]; then
    echo "❌ AuthController não encontrado em $AUTH_CONTROLLER"
    echo "   Procurando em outros locais..."
    
    if [ -f "app/Http/Controllers/AuthController.php" ]; then
        AUTH_CONTROLLER="app/Http/Controllers/AuthController.php"
        echo "✅ Encontrado em app/Http/Controllers/AuthController.php"
    else
        echo "❌ AuthController não encontrado!"
        echo "   Verificando se existe em outro lugar..."
        find . -name "AuthController.php" -type f 2>/dev/null | head -5
        exit 1
    fi
fi

echo "✅ AuthController encontrado: $AUTH_CONTROLLER"
echo ""

# 2. Fazer backup
echo "1️⃣ Fazendo backup..."
BACKUP_FILE="${AUTH_CONTROLLER}.backup.$(date +%s)"
cp "$AUTH_CONTROLLER" "$BACKUP_FILE"
echo "✅ Backup criado: $BACKUP_FILE"
echo ""

# 3. Verificar se já tem verificação de bloqueio
if grep -q "is_blocked" "$AUTH_CONTROLLER" && grep -q "account_blocked" "$AUTH_CONTROLLER"; then
    echo "✅ Verificação de bloqueio já existe!"
    echo "   Verificando se está correta..."
    
    # Verificar se está na posição correta
    if grep -A 10 "is_blocked" "$AUTH_CONTROLLER" | grep -q "account_blocked"; then
        echo "✅ Verificação está correta!"
        echo ""
        echo "📋 Mostrando verificação atual:"
        grep -A 5 "is_blocked" "$AUTH_CONTROLLER" | head -10
        exit 0
    fi
fi

# 4. Encontrar método login
echo "2️⃣ Localizando método login..."
LOGIN_METHOD_LINE=$(grep -n "public function login" "$AUTH_CONTROLLER" | head -1 | cut -d: -f1)

if [ -z "$LOGIN_METHOD_LINE" ]; then
    echo "❌ Método login não encontrado!"
    exit 1
fi

echo "✅ Método login encontrado na linha $LOGIN_METHOD_LINE"
echo ""

# 5. Encontrar onde buscar o usuário
echo "3️⃣ Localizando busca do usuário..."
USER_FETCH_LINE=$(sed -n "${LOGIN_METHOD_LINE},300p" "$AUTH_CONTROLLER" | grep -n -E "User::where|User::find|where\(.*email" | head -1 | cut -d: -f1)

if [ -z "$USER_FETCH_LINE" ]; then
    echo "❌ Não foi possível encontrar onde o usuário é buscado!"
    echo "   Mostrando método login para análise:"
    sed -n "${LOGIN_METHOD_LINE},100p" "$AUTH_CONTROLLER" | head -30
    exit 1
fi

USER_FETCH_LINE=$((LOGIN_METHOD_LINE + USER_FETCH_LINE - 1))
echo "✅ Busca do usuário encontrada na linha $USER_FETCH_LINE"
echo ""

# 6. Encontrar linha após verificar se usuário existe
echo "4️⃣ Localizando verificação de usuário..."
# Procurar por "if.*user" ou "if.*!user" após buscar o usuário
USER_CHECK_LINE=$(sed -n "${USER_FETCH_LINE},300p" "$AUTH_CONTROLLER" | grep -n -E "if.*!.*user|if.*user.*==|if.*user.*===" | head -1 | cut -d: -f1)

if [ -z "$USER_CHECK_LINE" ]; then
    # Se não encontrar, usar linha após buscar usuário + 2
    INSERT_LINE=$((USER_FETCH_LINE + 2))
else
    # Inserir após verificar se usuário existe
    INSERT_LINE=$((LOGIN_METHOD_LINE + USER_CHECK_LINE + 1))
fi

echo "✅ Inserindo verificação na linha $INSERT_LINE"
echo ""

# 7. Criar código de verificação segura
VERIFICATION_CODE=$(cat << 'EOF'
            // Verificar se está bloqueado (verificação segura)
            if ($user) {
                $isBlocked = false;
                // Verificar diferentes formatos de is_blocked
                if (isset($user->is_blocked)) {
                    $blockedValue = $user->is_blocked;
                    if ($blockedValue === true || $blockedValue === 1 || 
                        $blockedValue === '1' || $blockedValue === 'true' ||
                        (is_string($blockedValue) && strtolower($blockedValue) === 'true')) {
                        $isBlocked = true;
                    }
                }
                
                if ($isBlocked) {
                    return response()->json([
                        'message' => 'Acesso negado. Sua conta foi bloqueada.',
                        'error' => 'account_blocked'
                    ], 403);
                }
            }
EOF
)

# 8. Verificar se já existe antes de inserir
if ! grep -q "is_blocked" "$AUTH_CONTROLLER"; then
    echo "5️⃣ Adicionando verificação de bloqueio..."
    
    # Criar arquivo temporário
    TEMP_FILE=$(mktemp)
    
    # Copiar até a linha de inserção
    head -n $INSERT_LINE "$AUTH_CONTROLLER" > "$TEMP_FILE"
    
    # Adicionar verificação
    echo "$VERIFICATION_CODE" >> "$TEMP_FILE"
    
    # Copiar resto do arquivo
    tail -n +$((INSERT_LINE + 1)) "$AUTH_CONTROLLER" >> "$TEMP_FILE"
    
    # Substituir arquivo original
    mv "$TEMP_FILE" "$AUTH_CONTROLLER"
    
    echo "✅ Verificação de bloqueio adicionada"
else
    echo "⚠️  Verificação já existe, mas pode estar incorreta"
fi

# 9. Verificar sintaxe PHP
echo ""
echo "6️⃣ Verificando sintaxe PHP..."
if php -l "$AUTH_CONTROLLER" > /dev/null 2>&1; then
    echo "✅ Sintaxe PHP válida"
else
    echo "❌ Erro na sintaxe PHP!"
    echo "   Restaurando backup..."
    cp "$BACKUP_FILE" "$AUTH_CONTROLLER"
    php -l "$AUTH_CONTROLLER"
    exit 1
fi

# 10. Limpar cache
echo ""
echo "7️⃣ Limpando cache do Laravel..."
php artisan route:clear 2>/dev/null || true
php artisan config:clear 2>/dev/null || true
php artisan cache:clear 2>/dev/null || true
echo "✅ Cache limpo"

# 11. Ajustar permissões
echo ""
echo "8️⃣ Ajustando permissões..."
chown www-data:www-data "$AUTH_CONTROLLER" 2>/dev/null || chmod 644 "$AUTH_CONTROLLER"
echo "✅ Permissões ajustadas"

echo ""
echo "=========================================="
echo "✅ AuthController corrigido!"
echo "=========================================="
echo ""
echo "📋 O que foi implementado:"
echo "   • Verificação segura de bloqueio adicionada"
echo "   • Suporta diferentes formatos de is_blocked"
echo "   • Retorna 403 com error 'account_blocked' se bloqueado"
echo "   • Aplica-se ao endpoint /api/login (app mobile)"
echo ""
echo "🧪 Para testar:"
echo "   1. Bloqueie um usuário via interface web"
echo "   2. Tente fazer login com esse usuário no app mobile"
echo "   3. Deve retornar 403 com mensagem de conta bloqueada"
echo ""
echo "📝 Backup salvo em: $BACKUP_FILE"
echo ""


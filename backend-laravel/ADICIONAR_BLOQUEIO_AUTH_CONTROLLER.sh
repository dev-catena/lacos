#!/bin/bash

# Script para adicionar verificação de bloqueio no AuthController
# Execute no servidor como root ou com sudo

set -e

cd /var/www/lacos-backend

echo "🔒 Adicionando verificação de bloqueio no AuthController..."
echo ""

# 1. Fazer backup do AuthController
AUTH_CONTROLLER="app/Http/Controllers/Api/AuthController.php"

if [ ! -f "$AUTH_CONTROLLER" ]; then
    echo "❌ AuthController não encontrado em $AUTH_CONTROLLER"
    echo "   Procurando em outros locais..."
    
    # Procurar em outros locais possíveis
    if [ -f "app/Http/Controllers/AuthController.php" ]; then
        AUTH_CONTROLLER="app/Http/Controllers/AuthController.php"
        echo "✅ Encontrado em app/Http/Controllers/AuthController.php"
    else
        echo "❌ AuthController não encontrado!"
        exit 1
    fi
fi

echo "1️⃣ Fazendo backup do AuthController..."
BACKUP_FILE="${AUTH_CONTROLLER}.backup.$(date +%s)"
cp "$AUTH_CONTROLLER" "$BACKUP_FILE"
echo "✅ Backup criado: $BACKUP_FILE"
echo ""

# 2. Verificar se já tem a verificação de bloqueio
if grep -q "is_blocked" "$AUTH_CONTROLLER" && grep -q "account_blocked" "$AUTH_CONTROLLER"; then
    echo "✅ Verificação de bloqueio já está implementada no AuthController!"
    echo ""
    echo "📋 Verificando se está correta..."
    
    # Verificar se está na posição correta (antes da verificação de senha)
    if grep -A 5 "is_blocked" "$AUTH_CONTROLLER" | grep -q "account_blocked"; then
        echo "✅ Verificação está correta!"
        exit 0
    else
        echo "⚠️  Verificação encontrada mas pode estar incorreta. Continuando..."
    fi
fi

# 3. Encontrar o método login
echo "2️⃣ Localizando método login..."
LOGIN_METHOD_LINE=$(grep -n "public function login" "$AUTH_CONTROLLER" | head -1 | cut -d: -f1)

if [ -z "$LOGIN_METHOD_LINE" ]; then
    echo "❌ Método login não encontrado no AuthController!"
    exit 1
fi

echo "✅ Método login encontrado na linha $LOGIN_METHOD_LINE"
echo ""

# 4. Encontrar onde buscar o usuário
echo "3️⃣ Localizando busca do usuário..."
USER_FETCH_LINE=$(sed -n "${LOGIN_METHOD_LINE},200p" "$AUTH_CONTROLLER" | grep -n "User::where\|User::find\|where('email'" | head -1 | cut -d: -f1)
USER_FETCH_LINE=$((LOGIN_METHOD_LINE + USER_FETCH_LINE - 1))

if [ -z "$USER_FETCH_LINE" ]; then
    echo "❌ Não foi possível encontrar onde o usuário é buscado!"
    exit 1
fi

echo "✅ Busca do usuário encontrada na linha $USER_FETCH_LINE"
echo ""

# 5. Encontrar onde verificar a senha (para inserir antes)
echo "4️⃣ Localizando verificação de senha..."
PASSWORD_CHECK_LINE=$(sed -n "${USER_FETCH_LINE},200p" "$AUTH_CONTROLLER" | grep -n "Hash::check\|password.*check\|verify.*password" | head -1 | cut -d: -f1)

if [ -z "$PASSWORD_CHECK_LINE" ]; then
    # Tentar encontrar onde o token é criado
    PASSWORD_CHECK_LINE=$(sed -n "${USER_FETCH_LINE},200p" "$AUTH_CONTROLLER" | grep -n "createToken\|token" | head -1 | cut -d: -f1)
fi

if [ -z "$PASSWORD_CHECK_LINE" ]; then
    echo "⚠️  Não foi possível localizar verificação de senha automaticamente"
    echo "   Vou adicionar a verificação logo após buscar o usuário"
    INSERT_LINE=$((USER_FETCH_LINE + 3))
else
    INSERT_LINE=$((LOGIN_METHOD_LINE + PASSWORD_CHECK_LINE - 2))
fi

echo "✅ Inserindo verificação na linha $INSERT_LINE"
echo ""

# 6. Criar código de verificação
VERIFICATION_CODE=$(cat << 'EOF'
            // Verificar se está bloqueado
            if ($user && $user->is_blocked) {
                return response()->json([
                    'message' => 'Acesso negado. Sua conta foi bloqueada.',
                    'error' => 'account_blocked'
                ], 403);
            }
EOF
)

# 7. Verificar se já existe verificação de bloqueio antes de inserir
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
    echo "⚠️  Verificação de bloqueio já existe, mas pode estar incorreta"
    echo "   Verifique manualmente o arquivo: $AUTH_CONTROLLER"
fi

# 8. Verificar sintaxe PHP
echo ""
echo "6️⃣ Verificando sintaxe PHP..."
if php -l "$AUTH_CONTROLLER" > /dev/null 2>&1; then
    echo "✅ Sintaxe PHP válida"
else
    echo "❌ Erro na sintaxe PHP!"
    echo "   Restaurando backup..."
    cp "$BACKUP_FILE" "$AUTH_CONTROLLER"
    exit 1
fi

# 9. Limpar cache
echo ""
echo "7️⃣ Limpando cache do Laravel..."
php artisan route:clear 2>/dev/null || true
php artisan config:clear 2>/dev/null || true
echo "✅ Cache limpo"

echo ""
echo "=========================================="
echo "✅ Verificação de bloqueio adicionada!"
echo "=========================================="
echo ""
echo "📋 O que foi implementado:"
echo "   • AuthController agora verifica se usuário está bloqueado"
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


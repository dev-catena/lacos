#!/bin/bash

# Script para corrigir verificação de bloqueio no AuthController de forma segura
# Execute no servidor como root ou com sudo

set -e

cd /var/www/lacos-backend

echo "🔒 Corrigindo verificação de bloqueio no AuthController (versão segura)..."
echo ""

AUTH_CONTROLLER="app/Http/Controllers/Api/AuthController.php"

if [ ! -f "$AUTH_CONTROLLER" ]; then
    echo "❌ AuthController não encontrado!"
    exit 1
fi

# Fazer backup
BACKUP_FILE="${AUTH_CONTROLLER}.backup.$(date +%s)"
cp "$AUTH_CONTROLLER" "$BACKUP_FILE"
echo "✅ Backup criado: $BACKUP_FILE"
echo ""

# Substituir verificação de bloqueio por versão segura
echo "📝 Substituindo verificação de bloqueio por versão segura..."

# Criar arquivo temporário
TEMP_FILE=$(mktemp)

# Processar arquivo linha por linha
while IFS= read -r line; do
    # Se encontrar a verificação antiga, substituir
    if echo "$line" | grep -q "if.*user.*is_blocked"; then
        # Encontrar o bloco completo e substituir
        cat >> "$TEMP_FILE" << 'EOF'
            // Verificar se está bloqueado (verificação segura)
            if ($user) {
                $isBlocked = false;
                // Verificar se a propriedade existe e está bloqueada
                if (property_exists($user, 'is_blocked') || isset($user->is_blocked)) {
                    $blockedValue = $user->is_blocked;
                    if ($blockedValue === true || $blockedValue === 1 || 
                        $blockedValue === '1' || $blockedValue === 'true' ||
                        (is_string($blockedValue) && strtolower(trim($blockedValue)) === 'true')) {
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
        # Pular as linhas antigas do bloco
        skip_lines=4
        for ((i=0; i<$skip_lines; i++)); do
            read -r line || break
        done
    else
        echo "$line" >> "$TEMP_FILE"
    fi
done < "$AUTH_CONTROLLER"

# Se não encontrou a verificação antiga, adicionar após buscar usuário
if ! grep -q "is_blocked" "$TEMP_FILE"; then
    echo "⚠️  Verificação não encontrada, adicionando manualmente..."
    
    # Encontrar linha onde buscar usuário
    USER_LINE=$(grep -n "User::where\|User::find" "$AUTH_CONTROLLER" | head -1 | cut -d: -f1)
    
    if [ -n "$USER_LINE" ]; then
        # Recriar arquivo adicionando verificação após buscar usuário
        head -n $((USER_LINE + 2)) "$AUTH_CONTROLLER" > "$TEMP_FILE"
        cat >> "$TEMP_FILE" << 'EOF'
            // Verificar se está bloqueado (verificação segura)
            if ($user) {
                $isBlocked = false;
                // Verificar se a propriedade existe e está bloqueada
                if (property_exists($user, 'is_blocked') || isset($user->is_blocked)) {
                    $blockedValue = $user->is_blocked;
                    if ($blockedValue === true || $blockedValue === 1 || 
                        $blockedValue === '1' || $blockedValue === 'true' ||
                        (is_string($blockedValue) && strtolower(trim($blockedValue)) === 'true')) {
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
        tail -n +$((USER_LINE + 3)) "$AUTH_CONTROLLER" >> "$TEMP_FILE"
    fi
fi

# Verificar sintaxe
if php -l "$TEMP_FILE" > /dev/null 2>&1; then
    mv "$TEMP_FILE" "$AUTH_CONTROLLER"
    echo "✅ Verificação atualizada com sucesso"
else
    echo "❌ Erro de sintaxe! Restaurando backup..."
    php -l "$TEMP_FILE"
    rm "$TEMP_FILE"
    exit 1
fi

# Limpar cache
php artisan route:clear 2>/dev/null || true
php artisan config:clear 2>/dev/null || true
php artisan cache:clear 2>/dev/null || true

chown www-data:www-data "$AUTH_CONTROLLER" 2>/dev/null || true

echo ""
echo "✅ Correção aplicada!"
echo ""


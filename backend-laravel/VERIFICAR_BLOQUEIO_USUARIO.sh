#!/bin/bash

# Script para verificar e corrigir bloqueio de usuário
# Execute no servidor

set -e

cd /var/www/lacos-backend

echo "🔍 Verificando bloqueio de usuário..."
echo ""

# Solicitar email do usuário
if [ -z "$1" ]; then
    echo "Uso: $0 <email_do_usuario>"
    echo "Exemplo: $0 amigo@gmail.com"
    exit 1
fi

USER_EMAIL="$1"

echo "📋 Verificando usuário: $USER_EMAIL"
echo ""

# Verificar se usuário existe e status de bloqueio
php artisan tinker --execute="
\$user = App\Models\User::where('email', '$USER_EMAIL')->first();
if (!\$user) {
    echo '❌ Usuário não encontrado!\n';
    exit(1);
}

echo '✅ Usuário encontrado:\n';
echo '   ID: ' . \$user->id . '\n';
echo '   Nome: ' . \$user->name . '\n';
echo '   Email: ' . \$user->email . '\n';
echo '   is_blocked (tipo): ' . gettype(\$user->is_blocked) . '\n';
echo '   is_blocked (valor): ' . var_export(\$user->is_blocked, true) . '\n';
echo '   is_blocked (bool): ' . (\$user->is_blocked ? 'true' : 'false') . '\n';
echo '\n';

// Verificar se está bloqueado (considerando diferentes formatos)
\$isBlocked = false;
if (\$user->is_blocked === true || \$user->is_blocked === 1 || \$user->is_blocked === '1' || \$user->is_blocked === 'true') {
    \$isBlocked = true;
}

if (\$isBlocked) {
    echo '🚫 Usuário está BLOQUEADO\n';
} else {
    echo '✅ Usuário está ATIVO\n';
}

// Verificar se o campo existe na tabela
\$columns = DB::select('SHOW COLUMNS FROM users LIKE \"is_blocked\"');
if (empty(\$columns)) {
    echo '⚠️  ATENÇÃO: Coluna is_blocked não existe na tabela users!\n';
    echo '   Execute a migration: php artisan migrate\n';
} else {
    echo '✅ Coluna is_blocked existe na tabela\n';
}
"

echo ""
echo "=========================================="
echo ""


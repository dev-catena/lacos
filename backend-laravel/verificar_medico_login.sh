#!/bin/bash

# Script para verificar status de médico no login
# Uso: ./verificar_medico_login.sh [email-ou-cpf]

cd "$(dirname "$0")"

if [ -z "$1" ]; then
    echo "Uso: $0 <email-ou-cpf>"
    echo ""
    echo "Exemplo:"
    echo "  $0 darlley@gmail.com"
    echo "  $0 40780462319"
    exit 1
fi

LOGIN="$1"

echo "🔍 Verificando médico: $LOGIN"
echo ""

php artisan tinker <<EOF
\$login = '$LOGIN';
\$cpf = preg_replace('/[^0-9]/', '', \$login);

// Buscar por email ou CPF
\$user = null;
if (strlen(\$cpf) == 11) {
    \$user = DB::table('users')
        ->where('cpf', \$cpf)
        ->where('profile', 'doctor')
        ->first();
} else {
    \$user = DB::table('users')
        ->where('email', \$login)
        ->where('profile', 'doctor')
        ->first();
}

if (!\$user) {
    echo "❌ Médico não encontrado com: \$login\n";
    exit(1);
}

echo "✅ Médico encontrado:\n";
echo "   ID: " . \$user->id . "\n";
echo "   Nome: " . \$user->name . "\n";
echo "   Email: " . (\$user->email ?? 'N/A') . "\n";
echo "   CPF: " . (\$user->cpf ?? 'N/A') . "\n";
echo "   Profile: " . \$user->profile . "\n";
echo "   Aprovado em: " . (\$user->doctor_approved_at ?? 'NÃO APROVADO') . "\n";
echo "   Token de ativação: " . (\$user->doctor_activation_token ? 'PENDENTE' : 'ATIVADO') . "\n";
echo "   Bloqueado: " . (\$user->is_blocked ? 'SIM' : 'NÃO') . "\n";
echo "\n";

// Verificar status
\$approved = !empty(\$user->doctor_approved_at);
\$activated = empty(\$user->doctor_activated_token);
\$blocked = (\$user->is_blocked == 1 || \$user->is_blocked === true || \$user->is_blocked === '1');

if (!\$approved) {
    echo "⚠️  STATUS: Aguardando aprovação\n";
    echo "   → Acesse a web-admin e aprove este médico\n";
} elseif (!\$activated) {
    echo "⚠️  STATUS: Aprovado, mas aguardando ativação\n";
    echo "   → O médico precisa clicar no link do email de ativação\n";
} elseif (\$blocked) {
    echo "⚠️  STATUS: Conta bloqueada\n";
    echo "   → Desbloqueie na web-admin\n";
} else {
    echo "✅ STATUS: Aprovado e ativado - pode fazer login!\n";
}
EOF










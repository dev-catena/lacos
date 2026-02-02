#!/bin/bash

# Script para testar aprovação de médico e envio de email
# Execute no servidor

cd /var/www/lacos-backend

echo "🧪 Testando aprovação de médico e envio de email..."
echo ""

# Limpar logs anteriores
echo "1️⃣ Limpando logs antigos..."
> storage/logs/laravel.log
echo "✅ Logs limpos"
echo ""

# Verificar se há médico pendente
echo "2️⃣ Verificando médicos pendentes..."
DOCTOR_ID=$(php artisan tinker --execute="
\$doctor = \App\Models\User::where('profile', 'doctor')
    ->whereNull('doctor_approved_at')
    ->first();
if (\$doctor) {
    echo \$doctor->id . '|' . \$doctor->email;
} else {
    echo 'NONE';
}
" 2>/dev/null | grep -v "PHP Warning" | tail -1)

if [ "$DOCTOR_ID" = "NONE" ] || [ -z "$DOCTOR_ID" ]; then
    echo "⚠️  Nenhum médico pendente encontrado"
    echo "   Criando médico de teste..."
    
    # Criar médico de teste
    php artisan tinker --execute="
    \$doctor = \App\Models\User::create([
        'name' => 'Dr. Teste Email',
        'email' => 'teste.medico@lacos.com',
        'password' => bcrypt('123456'),
        'profile' => 'doctor',
        'crm' => 'TEST123',
        'doctor_approved_at' => null,
        'is_blocked' => false,
    ]);
    echo \$doctor->id;
    " 2>/dev/null | grep -v "PHP Warning" | tail -1
    
    DOCTOR_ID=$(php artisan tinker --execute="
    \$doctor = \App\Models\User::where('email', 'teste.medico@lacos.com')->first();
    echo \$doctor->id;
    " 2>/dev/null | grep -v "PHP Warning" | tail -1)
    
    echo "✅ Médico de teste criado (ID: $DOCTOR_ID)"
else
    DOCTOR_EMAIL=$(echo $DOCTOR_ID | cut -d'|' -f2)
    DOCTOR_ID=$(echo $DOCTOR_ID | cut -d'|' -f1)
    echo "✅ Médico pendente encontrado (ID: $DOCTOR_ID, Email: $DOCTOR_EMAIL)"
fi

echo ""

# Aprovar médico via API (simulando)
echo "3️⃣ Aprovando médico (ID: $DOCTOR_ID)..."
php artisan tinker --execute="
\$controller = new \App\Http\Controllers\Api\AdminDoctorController();
\$request = new \Illuminate\Http\Request();
try {
    \$response = \$controller->approve($DOCTOR_ID);
    echo '✅ Médico aprovado';
} catch (Exception \$e) {
    echo '❌ Erro: ' . \$e->getMessage();
}
" 2>&1 | grep -v "PHP Warning" | grep -v "memory limit" | tail -3

echo ""

# Verificar logs
echo "4️⃣ Verificando logs de email..."
sleep 2
tail -30 storage/logs/laravel.log | grep -i "email\|mail\|activation\|doctor" | tail -10

echo ""
echo "=========================================="
echo "✅ Teste concluído!"
echo "=========================================="
echo ""
echo "📋 Verifique:"
echo "   1. Logs acima para ver se email foi enviado"
echo "   2. Caixa de entrada do email do médico"
echo "   3. Logs completos: tail -f storage/logs/laravel.log"
echo ""


#!/bin/bash

# Script para verificar agenda da médica Maria
SERVER="192.168.0.20"
USER="darley"
PASSWORD="yhvh77"

echo "🔍 Verificando agenda da médica Maria..."
echo "=========================================="

sshpass -p "$PASSWORD" ssh "$USER@$SERVER" << 'ENDSSH'
cd /var/www/lacos-backend

echo "📋 Buscando ID da médica Maria..."
echo ""

# Buscar ID da Maria
MARIA_ID=$(php artisan tinker --execute="
\$user = \App\Models\User::where('email', 'maria@gmail.com')->orWhere('email', 'maria@#gmail.com')->first();
if (\$user) {
    echo \$user->id;
} else {
    echo 'NOT_FOUND';
}
" | grep -v "PHP Warning" | tail -1)

if [ "$MARIA_ID" == "NOT_FOUND" ] || [ -z "$MARIA_ID" ]; then
    echo "❌ Médica Maria não encontrada!"
    echo ""
    echo "📋 Listando todos os médicos:"
    php artisan tinker --execute="
    \$doctors = \App\Models\User::where('profile', 'doctor')->get(['id', 'name', 'email']);
    foreach (\$doctors as \$d) {
        echo \$d->id . ' - ' . \$d->name . ' (' . \$d->email . ')' . PHP_EOL;
    }
    " | grep -v "PHP Warning"
    exit 1
fi

echo "✅ Maria encontrada! ID: $MARIA_ID"
echo ""

echo "📊 Verificando dados na tabela doctor_availability..."
echo ""

php artisan tinker --execute="
\$records = DB::table('doctor_availability')
    ->where('doctor_id', $MARIA_ID)
    ->get(['id', 'date', 'is_available', 'created_at']);

if (\$records->isEmpty()) {
    echo '❌ Nenhum registro encontrado na tabela doctor_availability' . PHP_EOL;
} else {
    echo '✅ Registros encontrados: ' . \$records->count() . PHP_EOL;
    foreach (\$records as \$r) {
        echo '  - ID: ' . \$r->id . ' | Data: ' . \$r->date . ' | Disponível: ' . (\$r->is_available ? 'Sim' : 'Não') . PHP_EOL;
        
        \$times = DB::table('doctor_availability_times')
            ->where('availability_id', \$r->id)
            ->pluck('time');
        
        if (\$times->isNotEmpty()) {
            echo '    Horários: ' . \$times->implode(', ') . PHP_EOL;
        } else {
            echo '    ⚠️  Nenhum horário cadastrado para esta data' . PHP_EOL;
        }
    }
}
" | grep -v "PHP Warning"

echo ""
echo "📋 Testando endpoint getAvailability..."
echo ""

# Testar endpoint (precisa de token, mas vamos verificar a query)
echo "Query que o endpoint executa:"
php artisan tinker --execute="
\$doctorId = $MARIA_ID;
\$records = DB::table('doctor_availability')
    ->where('doctor_id', \$doctorId)
    ->where('is_available', true)
    ->where('date', '>=', date('Y-m-d'))
    ->orderBy('date')
    ->get();

echo 'Registros encontrados: ' . \$records->count() . PHP_EOL;
foreach (\$records as \$r) {
    echo 'Data: ' . \$r->date . PHP_EOL;
    \$times = DB::table('doctor_availability_times')
        ->where('availability_id', \$r->id)
        ->orderBy('time')
        ->pluck('time')
        ->toArray();
    echo 'Horários: ' . implode(', ', \$times) . PHP_EOL;
}
" | grep -v "PHP Warning"
ENDSSH

echo ""
echo "✅ Verificação concluída!"



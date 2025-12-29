#!/bin/bash

# Script para verificar a agenda da médica e diagnosticar problemas
# Uso: ./VERIFICAR_AGENDA_MEDICA_V2.sh <email_medico>

EMAIL_MEDICO="${1:-dudarubackgoncalves@gmail.com}"
SERVER="darley@193.203.182.22"

echo "🔍 Verificando agenda da médica: $EMAIL_MEDICO"
echo ""

# Verificar se sshpass está disponível
if ! command -v sshpass &> /dev/null; then
    echo "❌ sshpass não está instalado. Instale com: sudo apt-get install sshpass"
    exit 1
fi

# Solicitar senha se não estiver definida
if [ -z "$SUDO_PASS" ]; then
    read -sp "Digite a senha do servidor: " SUDO_PASS
    echo ""
    export SUDO_PASS
fi

echo "📊 1. Verificando ID do médico no banco de dados..."
echo ""

# Criar comando PHP inline que será executado via artisan tinker
TINKER_CMD="\\\$user = App\\\Models\\\User::whereRaw('LOWER(TRIM(email)) = ?', [strtolower(trim('$EMAIL_MEDICO'))])->first(); if (\\\$user) { echo \\\$user->id . '|' . \\\$user->email . '|' . \\\$user->name . '|' . (\\\$user->profile ?? 'N/A'); } else { echo 'NOT_FOUND'; }"

# Executar via artisan tinker
RESULT=$(sshpass -p "$SUDO_PASS" ssh -o StrictHostKeyChecking=no $SERVER "cd /var/www/lacos-backend && php artisan tinker --execute=\"$TINKER_CMD\"" 2>&1 | grep -v "Psy Shell" | grep -v ">>>" | tr -d '\n' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')

# Verificar se encontrou o usuário
if echo "$RESULT" | grep -q "NOT_FOUND" || [ -z "$RESULT" ]; then
    echo "❌ Médico não encontrado com email: $EMAIL_MEDICO"
    echo "Resultado: $RESULT"
    
    # Tentar buscar emails similares
    echo ""
    echo "🔍 Buscando emails similares..."
    TINKER_CMD_SIMILAR="\\\$users = App\\\Models\\\User::where('email', 'LIKE', '%dudaruback%')->select('id', 'email', 'name', 'profile')->limit(5)->get(); foreach (\\\$users as \\\$u) { echo \\\$u->id . '|' . \\\$u->email . '|' . \\\$u->name . '|' . (\\\$u->profile ?? 'N/A') . PHP_EOL; }"
    SIMILAR=$(sshpass -p "$SUDO_PASS" ssh -o StrictHostKeyChecking=no $SERVER "cd /var/www/lacos-backend && php artisan tinker --execute=\"$TINKER_CMD_SIMILAR\"" 2>&1 | grep -v "Psy Shell" | grep -v ">>>" | grep "|")
    if [ -n "$SIMILAR" ]; then
        echo "Emails similares encontrados:"
        echo "$SIMILAR"
    fi
    exit 1
fi

# Extrair ID do resultado
USER_ID=$(echo "$RESULT" | cut -d'|' -f1)
USER_EMAIL=$(echo "$RESULT" | cut -d'|' -f2)
USER_NAME=$(echo "$RESULT" | cut -d'|' -f3)
USER_PROFILE=$(echo "$RESULT" | cut -d'|' -f4)

if [ -z "$USER_ID" ] || [ "$USER_ID" == "NOT_FOUND" ] || ! [[ "$USER_ID" =~ ^[0-9]+$ ]]; then
    echo "❌ Erro ao obter ID do médico"
    echo "Resultado: $RESULT"
    exit 1
fi

echo "✅ Médico encontrado:"
echo "   ID: $USER_ID"
echo "   Nome: $USER_NAME"
echo "   Email: $USER_EMAIL"
echo "   Profile: $USER_PROFILE"
echo ""

echo "📅 2. Verificando agenda salva no banco de dados..."
echo ""

# Criar comando para verificar agenda
TINKER_CMD_AGENDA="
use Illuminate\Support\Facades\DB;

\\\$records = DB::table('doctor_availability')->where('doctor_id', $USER_ID)->orderBy('date')->get();

if (\\\$records->isEmpty()) {
    echo '❌ Nenhum registro encontrado na tabela doctor_availability para o médico ID: $USER_ID' . PHP_EOL;
} else {
    echo '✅ Registros encontrados: ' . \\\$records->count() . PHP_EOL . PHP_EOL;
    
    foreach (\\\$records as \\\$record) {
        \\\$status = \\\$record->is_available ? 'Disponível' : 'Indisponível';
        echo '📅 Data: ' . \\\$record->date . ' | Status: ' . \\\$status . PHP_EOL;
        
        \\\$times = DB::table('doctor_availability_times')
            ->where('doctor_availability_id', \\\$record->id)
            ->orderBy('time')
            ->get();
        
        if (\\\$times->isEmpty()) {
            echo '   ⚠️  Nenhum horário cadastrado para esta data' . PHP_EOL;
        } else {
            echo '   ⏰ Horários: ' . \\\$times->pluck('time')->implode(', ') . PHP_EOL;
        }
        echo PHP_EOL;
    }
    
    echo '🔍 Buscando especificamente 19/12/2024 e 19/12/2025:' . PHP_EOL;
    
    \\\$dec19_2024 = DB::table('doctor_availability')
        ->where('doctor_id', $USER_ID)
        ->where('date', '2024-12-19')
        ->first();
    
    if (\\\$dec19_2024) {
        echo '   ✅ 19/12/2024 encontrado!' . PHP_EOL;
        \\\$times_2024 = DB::table('doctor_availability_times')
            ->where('doctor_availability_id', \\\$dec19_2024->id)
            ->orderBy('time')
            ->get();
        if (\\\$times_2024->isNotEmpty()) {
            echo '   Horários: ' . \\\$times_2024->pluck('time')->implode(', ') . PHP_EOL;
        } else {
            echo '   ⚠️  Sem horários cadastrados' . PHP_EOL;
        }
    } else {
        echo '   ❌ 19/12/2024 não encontrado' . PHP_EOL;
    }
    
    \\\$dec19_2025 = DB::table('doctor_availability')
        ->where('doctor_id', $USER_ID)
        ->where('date', '2025-12-19')
        ->first();
    
    if (\\\$dec19_2025) {
        echo '   ✅ 19/12/2025 encontrado!' . PHP_EOL;
        \\\$times_2025 = DB::table('doctor_availability_times')
            ->where('doctor_availability_id', \\\$dec19_2025->id)
            ->orderBy('time')
            ->get();
        if (\\\$times_2025->isNotEmpty()) {
            echo '   Horários: ' . \\\$times_2025->pluck('time')->implode(', ') . PHP_EOL;
        } else {
            echo '   ⚠️  Sem horários cadastrados' . PHP_EOL;
        }
    } else {
        echo '   ❌ 19/12/2025 não encontrado' . PHP_EOL;
    }
}
"

# Executar comando de agenda
sshpass -p "$SUDO_PASS" ssh -o StrictHostKeyChecking=no $SERVER "cd /var/www/lacos-backend && php artisan tinker --execute=\"$TINKER_CMD_AGENDA\"" 2>&1 | grep -v "Psy Shell" | grep -v ">>>"

echo ""
echo "📡 3. Informações adicionais:"
echo ""
echo "⚠️  Para testar o endpoint da API, é necessário um token de autenticação."
echo "   Execute no servidor:"
echo "   curl -H \"Authorization: Bearer {token}\" http://localhost/api/doctors/$USER_ID/availability"
echo ""

echo "✅ Diagnóstico concluído!"



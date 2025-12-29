#!/bin/bash

# Script para verificar a agenda da médica e diagnosticar problemas
# Uso: ./VERIFICAR_AGENDA_MEDICA.sh <email_medico>

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

# Criar script PHP temporário para buscar ID
cat > /tmp/verificar_id_temp.php << 'PHPEOF'
<?php
// Tentar múltiplos caminhos para encontrar o Laravel
$paths = [
    __DIR__ . '/vendor/autoload.php',
    __DIR__ . '/../../vendor/autoload.php',
    '/var/www/lacos-backend/vendor/autoload.php'
];

$autoloadPath = null;
foreach ($paths as $path) {
    if (file_exists($path)) {
        $autoloadPath = $path;
        break;
    }
}

if (!$autoloadPath) {
    echo "NOT_FOUND|Erro: Não foi possível encontrar vendor/autoload.php\n";
    exit(1);
}

require $autoloadPath;

$appPaths = [
    dirname($autoloadPath) . '/bootstrap/app.php',
    '/var/www/lacos-backend/bootstrap/app.php'
];

$appPath = null;
foreach ($appPaths as $path) {
    if (file_exists($path)) {
        $appPath = $path;
        break;
    }
}

if (!$appPath) {
    echo "NOT_FOUND|Erro: Não foi possível encontrar bootstrap/app.php\n";
    exit(1);
}

$app = require_once $appPath;
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$email = trim($argv[1] ?? '');

if (empty($email)) {
    echo "NOT_FOUND|Email vazio\n";
    exit(1);
}

// Normalizar email (lowercase e trim)
$emailNormalized = strtolower(trim($email));

// Buscar por email (case-insensitive)
$user = App\Models\User::whereRaw('LOWER(TRIM(email)) = ?', [$emailNormalized])->first();

if (!$user) {
    // Tentar buscar exatamente como fornecido
    $user = App\Models\User::where('email', $email)->first();
}

if (!$user) {
    // Listar todos os emails similares para debug
    $searchTerm = substr($emailNormalized, 0, 10);
    $similar = App\Models\User::whereRaw('LOWER(email) LIKE ?', ["%{$searchTerm}%"])
        ->select('id', 'email', 'name', 'profile')
        ->limit(5)
        ->get();
    
    if ($similar->isNotEmpty()) {
        echo "NOT_FOUND|Email não encontrado, mas emails similares encontrados:\n";
        foreach ($similar as $u) {
            echo "  ID: {$u->id}, Email: {$u->email}, Nome: {$u->name}, Profile: {$u->profile}\n";
        }
    } else {
        echo "NOT_FOUND|Email não encontrado: $email\n";
    }
    exit(1);
}

echo "{$user->id}|{$user->email}|{$user->name}|{$user->profile}";
PHPEOF

# Copiar script para servidor e executar com sudo (para usar permissões do www-data)
sshpass -p "$SUDO_PASS" scp -o StrictHostKeyChecking=no /tmp/verificar_id_temp.php "$SERVER:/tmp/verificar_id.php" 2>/dev/null
rm -f /tmp/verificar_id_temp.php

# Executar com sudo para usar permissões do usuário que roda o Laravel (geralmente www-data)
# Tentar primeiro como www-data, se não funcionar, tentar como darley
# Filtrar saída para remover mensagens do sudo e warnings
RESULT=$(sshpass -p "$SUDO_PASS" ssh -o StrictHostKeyChecking=no $SERVER "cd /var/www/lacos-backend && echo '$SUDO_PASS' | sudo -S -u www-data php /tmp/verificar_id.php '$EMAIL_MEDICO' 2>&1 || php /tmp/verificar_id.php '$EMAIL_MEDICO' 2>&1" | grep -E "^[0-9]+\||^NOT_FOUND" | head -1)

# Limpar resultado de mensagens indesejadas
RESULT=$(echo "$RESULT" | grep -E "^[0-9]+\||^NOT_FOUND" | head -1)

# Verificar se encontrou o usuário
if echo "$RESULT" | grep -q "NOT_FOUND" || [ -z "$RESULT" ]; then
    echo "❌ Médico não encontrado com email: $EMAIL_MEDICO"
    sshpass -p "$SUDO_PASS" ssh -o StrictHostKeyChecking=no $SERVER "rm -f /tmp/verificar_id.php" 2>/dev/null
    exit 1
fi

# Extrair ID do resultado (formato: ID|email|nome|profile)
USER_ID=$(echo "$RESULT" | head -1 | cut -d'|' -f1)
USER_EMAIL=$(echo "$RESULT" | head -1 | cut -d'|' -f2)
USER_NAME=$(echo "$RESULT" | head -1 | cut -d'|' -f3)
USER_PROFILE=$(echo "$RESULT" | head -1 | cut -d'|' -f4)

if [ -z "$USER_ID" ] || [ "$USER_ID" == "NOT_FOUND" ] || ! [[ "$USER_ID" =~ ^[0-9]+$ ]]; then
    echo "❌ Médico não encontrado com email: $EMAIL_MEDICO"
    echo "Resultado da busca: $RESULT"
    sshpass -p "$SUDO_PASS" ssh -o StrictHostKeyChecking=no $SERVER "rm -f /tmp/verificar_id.php" 2>/dev/null
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

# Criar script PHP para verificar agenda
cat > /tmp/verificar_agenda_temp.php << 'PHPEOF'
<?php
// Tentar múltiplos caminhos para encontrar o Laravel
$paths = [
    __DIR__ . '/vendor/autoload.php',
    __DIR__ . '/../../vendor/autoload.php',
    '/var/www/lacos-backend/vendor/autoload.php'
];

$autoloadPath = null;
foreach ($paths as $path) {
    if (file_exists($path)) {
        $autoloadPath = $path;
        break;
    }
}

if (!$autoloadPath) {
    echo "❌ Erro: Não foi possível encontrar vendor/autoload.php\n";
    exit(1);
}

require $autoloadPath;

$appPaths = [
    dirname($autoloadPath) . '/bootstrap/app.php',
    '/var/www/lacos-backend/bootstrap/app.php'
];

$appPath = null;
foreach ($appPaths as $path) {
    if (file_exists($path)) {
        $appPath = $path;
        break;
    }
}

if (!$appPath) {
    echo "❌ Erro: Não foi possível encontrar bootstrap/app.php\n";
    exit(1);
}

$app = require_once $appPath;
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

$doctorId = intval($argv[1] ?? 0);

if ($doctorId <= 0) {
    echo "❌ ID do médico inválido\n";
    exit(1);
}

$records = DB::table('doctor_availability')
    ->where('doctor_id', $doctorId)
    ->orderBy('date')
    ->get();

if ($records->isEmpty()) {
    echo "❌ Nenhum registro encontrado na tabela doctor_availability para o médico ID: $doctorId\n";
} else {
    echo "✅ Registros encontrados: " . $records->count() . "\n";
    echo "\n";
    
    foreach ($records as $record) {
        $status = $record->is_available ? 'Disponível' : 'Indisponível';
        echo "📅 Data: {$record->date} | Status: $status\n";
        
        $times = DB::table('doctor_availability_times')
            ->where('doctor_availability_id', $record->id)
            ->orderBy('time')
            ->get();
        
        if ($times->isEmpty()) {
            echo "   ⚠️  Nenhum horário cadastrado para esta data\n";
        } else {
            $timeList = $times->pluck('time')->implode(', ');
            echo "   ⏰ Horários: $timeList\n";
        }
        echo "\n";
    }
    
    // Buscar especificamente 19/12
    echo "🔍 Buscando especificamente 19/12/2024 e 19/12/2025:\n";
    $dec19_2024 = DB::table('doctor_availability')
        ->where('doctor_id', $doctorId)
        ->where('date', '2024-12-19')
        ->first();
    $dec19_2025 = DB::table('doctor_availability')
        ->where('doctor_id', $doctorId)
        ->where('date', '2025-12-19')
        ->first();
    
    if ($dec19_2024) {
        echo "   ✅ 19/12/2024 encontrado!\n";
        $times_2024 = DB::table('doctor_availability_times')
            ->where('doctor_availability_id', $dec19_2024->id)
            ->orderBy('time')
            ->get();
        if ($times_2024->isNotEmpty()) {
            $timeList_2024 = $times_2024->pluck('time')->implode(', ');
            echo "   Horários: $timeList_2024\n";
        } else {
            echo "   ⚠️  Sem horários cadastrados\n";
        }
    } else {
        echo "   ❌ 19/12/2024 não encontrado\n";
    }
    
    if ($dec19_2025) {
        echo "   ✅ 19/12/2025 encontrado!\n";
        $times_2025 = DB::table('doctor_availability_times')
            ->where('doctor_availability_id', $dec19_2025->id)
            ->orderBy('time')
            ->get();
        if ($times_2025->isNotEmpty()) {
            $timeList_2025 = $times_2025->pluck('time')->implode(', ');
            echo "   Horários: $timeList_2025\n";
        } else {
            echo "   ⚠️  Sem horários cadastrados\n";
        }
    } else {
        echo "   ❌ 19/12/2025 não encontrado\n";
    }
}
PHPEOF

# Copiar script para servidor e executar com sudo (para usar permissões do www-data)
sshpass -p "$SUDO_PASS" scp -o StrictHostKeyChecking=no /tmp/verificar_agenda_temp.php "$SERVER:/tmp/verificar_agenda.php" 2>/dev/null
rm -f /tmp/verificar_agenda_temp.php

# Executar script no servidor com sudo para usar permissões do usuário que roda o Laravel
# Tentar primeiro como www-data, se não funcionar, tentar como darley
# Filtrar saída para remover mensagens do sudo
sshpass -p "$SUDO_PASS" ssh -o StrictHostKeyChecking=no $SERVER "cd /var/www/lacos-backend && (echo '$SUDO_PASS' | sudo -S -u www-data php /tmp/verificar_agenda.php $USER_ID 2>&1 || php /tmp/verificar_agenda.php $USER_ID 2>&1)" | grep -v "\[sudo\] password" | grep -v "PHP Warning" | grep -v "Failed to set memory"

# Limpar scripts temporários
echo "$SUDO_PASS" | sshpass -p "$SUDO_PASS" ssh -o StrictHostKeyChecking=no $SERVER "echo '$SUDO_PASS' | sudo -S rm -f /tmp/verificar_id.php /tmp/verificar_agenda.php" 2>/dev/null

echo ""
echo "📡 3. Informações adicionais:"
echo ""
echo "⚠️  Para testar o endpoint da API, é necessário um token de autenticação."
echo "   Execute no servidor:"
echo "   curl -H \"Authorization: Bearer {token}\" http://localhost/api/doctors/$USER_ID/availability"
echo ""

echo "✅ Diagnóstico concluído!"

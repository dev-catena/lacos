#!/bin/bash

# Script para adicionar logs detalhados ao método saveAvailability

set -e

SERVER="darley@192.168.0.20"
SSH_PORT="63022"
BACKEND_PATH="/var/www/lacos-backend"

read -sp "Digite a senha do servidor: " SUDO_PASS
echo ""

echo "🔧 Adicionando logs detalhados ao método saveAvailability..."
echo ""

sshpass -p "$SUDO_PASS" ssh -p $SSH_PORT -o StrictHostKeyChecking=no -o ConnectTimeout=30 $SERVER "echo '$SUDO_PASS' | sudo -S bash" << 'REMOTE_SCRIPT'
set -e

BACKEND_PATH="/var/www/lacos-backend"
cd "$BACKEND_PATH"

# Criar backup
BACKUP_FILE="app/Http/Controllers/Api/DoctorController.php.bak.$(date +%Y%m%d_%H%M%S)"
cp app/Http/Controllers/Api/DoctorController.php "$BACKUP_FILE"
echo "✅ Backup criado: $BACKUP_FILE"

# Adicionar log no início do método
sed -i '/public function saveAvailability(Request $request, $doctorId)/a\
        \Log::info("=== INÍCIO saveAvailability ===", ["doctor_id" => $doctorId, "request_data" => $request->all()]);' app/Http/Controllers/Api/DoctorController.php

# Adicionar log após validação
sed -i '/\$availableDays = \$request->input/a\
            \Log::info("Dados validados", ["availableDays" => $availableDays, "daySchedules" => $daySchedules]);' app/Http/Controllers/Api/DoctorController.php

# Adicionar log após deletar disponibilidades antigas
sed -i '/->delete();/a\
            \Log::info("Disponibilidades antigas deletadas", ["deleted_count" => $deleted ?? 0]);' app/Http/Controllers/Api/DoctorController.php

# Adicionar log antes de inserir horários
sed -i '/if (!empty(\$times)) {/a\
                        \Log::info("Inserindo horários", ["availability_id" => $availabilityId, "times" => $times]);' app/Http/Controllers/Api/DoctorController.php

# Adicionar log após inserir horários
sed -i '/DB::table('\''doctor_availability_times'\'')->insert(\$times);/a\
                        \Log::info("Horários inseridos com sucesso", ["availability_id" => $availabilityId, "count" => count($times)]);' app/Http/Controllers/Api/DoctorController.php

# Adicionar log no final (antes do return success)
sed -i '/return response()->json(\[/i\
            \Log::info("=== FIM saveAvailability - SUCESSO ===", ["doctor_id" => $doctorId]);' app/Http/Controllers/Api/DoctorController.php

# Verificar sintaxe
echo ""
echo "🔍 Verificando sintaxe PHP..."
if php -l app/Http/Controllers/Api/DoctorController.php 2>&1 | grep -q "No syntax errors"; then
    echo "✅ Sintaxe PHP válida"
else
    echo "❌ Erro de sintaxe!"
    php -l app/Http/Controllers/Api/DoctorController.php
    echo "💡 Restaurando backup..."
    cp "$BACKUP_FILE" app/Http/Controllers/Api/DoctorController.php
    exit 1
fi

# Limpar cache
echo ""
echo "🧹 Limpando cache..."
php artisan route:clear
php artisan config:clear
php artisan cache:clear
echo "✅ Cache limpo"

echo ""
echo "✅ Logs adicionados com sucesso!"
REMOTE_SCRIPT

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Logs adicionados!"
    echo ""
    echo "💡 Agora quando você salvar a agenda, verifique os logs:"
    echo "   tail -f /var/www/lacos-backend/storage/logs/laravel.log"
else
    echo ""
    echo "❌ Erro ao adicionar logs"
    exit 1
fi






#!/bin/bash

# Script para adicionar logs muito detalhados ao método saveAvailability

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

# Verificar se o método já tem logs
if grep -q "=== INÍCIO saveAvailability ===" app/Http/Controllers/Api/DoctorController.php; then
    echo "⚠️  Método já tem logs, pulando adição de logs"
else
    echo "📝 Adicionando logs detalhados..."
    
    # Adicionar log no início do método (após a linha public function)
    sed -i '/public function saveAvailability(Request $request, $doctorId)/a\
        \Log::info("=== INÍCIO saveAvailability ===", [\
            "doctor_id" => $doctorId,\
            "request_all" => $request->all(),\
            "availableDays" => $request->input("availableDays"),\
            "daySchedules" => $request->input("daySchedules"),\
        ]);' app/Http/Controllers/Api/DoctorController.php
    
    # Adicionar log após encontrar o médico
    sed -i '/if (!$doctor) {/i\
            \Log::info("Médico encontrado", ["doctor_id" => $doctorId, "doctor_name" => $doctor->name]);' app/Http/Controllers/Api/DoctorController.php
    
    # Adicionar log após validação
    sed -i '/\$availableDays = \$validated/a\
            \Log::info("Dados validados", ["availableDays" => $availableDays, "daySchedules" => $daySchedules]);' app/Http/Controllers/Api/DoctorController.php
    
    # Adicionar log após deletar disponibilidades antigas
    sed -i '/->delete();/a\
            $deletedCount = DB::table("doctor_availability")->where("doctor_id", $doctorId)->where("date", ">=", date("Y-m-d"))->count();\
            \Log::info("Disponibilidades antigas deletadas", ["deleted_count" => $deletedCount]);' app/Http/Controllers/Api/DoctorController.php
    
    # Adicionar log antes de inserir cada disponibilidade
    sed -i '/\$availabilityId = DB::table/a\
                        \Log::info("Inserindo disponibilidade", ["date" => $dateKey, "availability_id" => $availabilityId]);' app/Http/Controllers/Api/DoctorController.php
    
    # Adicionar log após inserir horários
    sed -i '/DB::table('\''doctor_availability_times'\'')->insert(\$times);/a\
                        \Log::info("Horários inseridos", ["availability_id" => $availabilityId, "times_count" => count($times)]);' app/Http/Controllers/Api/DoctorController.php
    
    # Adicionar log no final (antes do return success)
    sed -i '/return response()->json(\[/i\
            \Log::info("=== FIM saveAvailability - SUCESSO ===", ["doctor_id" => $doctorId]);' app/Http/Controllers/Api/DoctorController.php
fi

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
    echo "💡 Agora quando você salvar a agenda, os logs aparecerão em:"
    echo "   tail -f /var/www/lacos-backend/storage/logs/laravel.log"
else
    echo ""
    echo "❌ Erro ao adicionar logs"
    exit 1
fi






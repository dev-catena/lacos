#!/bin/bash

# Script para corrigir o método saveAvailability no servidor

set -e

SERVER="darley@10.102.0.103"
SSH_PORT="63022"
BACKEND_PATH="/var/www/lacos-backend"

read -sp "Digite a senha do servidor: " SUDO_PASS
echo ""

echo "🔧 Corrigindo método saveAvailability..."
echo ""

# Criar script de correção
sshpass -p "$SUDO_PASS" ssh -p $SSH_PORT -o StrictHostKeyChecking=no -o ConnectTimeout=30 $SERVER "echo '$SUDO_PASS' | sudo -S bash" << 'REMOTE_SCRIPT'
set -e

BACKEND_PATH="/var/www/lacos-backend"
cd "$BACKEND_PATH"

# Criar backup
BACKUP_FILE="app/Http/Controllers/Api/DoctorController.php.bak.$(date +%Y%m%d_%H%M%S)"
cp app/Http/Controllers/Api/DoctorController.php "$BACKUP_FILE"
echo "✅ Backup criado: $BACKUP_FILE"

# Remover método antigo
echo "🗑️  Removendo método antigo..."
sed -i '/public function saveAvailability/,/^    }/d' app/Http/Controllers/Api/DoctorController.php

# Adicionar método corrigido com logs detalhados
cat >> app/Http/Controllers/Api/DoctorController.php << 'PHPEOF'
    /**
     * Salvar agenda disponível de um médico
     * POST /api/doctors/{doctorId}/availability
     */
    public function saveAvailability(Request $request, $doctorId)
    {
        try {
            \Log::info('=== INÍCIO saveAvailability ===', [
                'doctor_id' => $doctorId,
                'request_data' => $request->all(),
            ]);

            // Verificar se o médico existe e é realmente um médico
            $doctor = User::where('id', $doctorId)
                ->where('profile', 'doctor')
                ->first();

            if (!$doctor) {
                \Log::warning('Médico não encontrado', ['doctor_id' => $doctorId]);
                return response()->json([
                    'success' => false,
                    'message' => 'Médico não encontrado',
                ], 404);
            }

            \Log::info('Médico encontrado', ['doctor_id' => $doctorId, 'doctor_name' => $doctor->name]);

            // Validar dados recebidos
            $validated = $request->validate([
                'availableDays' => 'required|array',
                'availableDays.*' => 'string|date_format:Y-m-d',
                'daySchedules' => 'required|array',
                'daySchedules.*' => 'array',
                'daySchedules.*.*' => 'string|regex:/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/',
            ]);

            $availableDays = $validated['availableDays'] ?? [];
            $daySchedules = $validated['daySchedules'] ?? [];

            \Log::info('Dados validados', [
                'available_days_count' => count($availableDays),
                'day_schedules_count' => count($daySchedules),
            ]);

            // Verificar se as tabelas existem
            if (!DB::getSchemaBuilder()->hasTable('doctor_availability')) {
                \Log::error('Tabela doctor_availability não existe');
                return response()->json([
                    'success' => false,
                    'message' => 'Tabela de agenda não configurada ainda',
                ], 500);
            }

            if (!DB::getSchemaBuilder()->hasTable('doctor_availability_times')) {
                \Log::error('Tabela doctor_availability_times não existe');
                return response()->json([
                    'success' => false,
                    'message' => 'Tabela de horários não configurada ainda',
                ], 500);
            }

            // Deletar disponibilidades antigas do médico (apenas futuras ou de hoje)
            $deleted = DB::table('doctor_availability')
                ->where('doctor_id', $doctorId)
                ->where('date', '>=', date('Y-m-d'))
                ->delete();

            \Log::info('Disponibilidades antigas deletadas', ['deleted_count' => $deleted]);

            $insertedDays = 0;
            $insertedTimes = 0;

            // Inserir novas disponibilidades
            foreach ($availableDays as $dateKey) {
                // Verificar se a data é válida
                try {
                    $date = \Carbon\Carbon::parse($dateKey);
                    if ($date->isPast() && !$date->isToday()) {
                        \Log::warning('Pulando data passada', ['date' => $dateKey]);
                        continue; // Pular datas passadas
                    }
                } catch (\Exception $e) {
                    \Log::warning('Data inválida', ['date' => $dateKey, 'error' => $e->getMessage()]);
                    continue; // Pular datas inválidas
                }

                // Inserir registro de disponibilidade
                $availabilityId = DB::table('doctor_availability')->insertGetId([
                    'doctor_id' => $doctorId,
                    'date' => $dateKey,
                    'is_available' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                $insertedDays++;
                \Log::info('Disponibilidade criada', [
                    'availability_id' => $availabilityId,
                    'date' => $dateKey,
                ]);

                // Inserir horários para este dia
                if (isset($daySchedules[$dateKey]) && is_array($daySchedules[$dateKey]) && !empty($daySchedules[$dateKey])) {
                    $times = [];
                    foreach ($daySchedules[$dateKey] as $time) {
                        // Normalizar formato do horário (garantir HH:MM)
                        $normalizedTime = $time;
                        if (strlen($time) === 4 && strpos($time, ':') === false) {
                            // Formato "0800" -> "08:00"
                            $normalizedTime = substr($time, 0, 2) . ':' . substr($time, 2, 2);
                        } elseif (strlen($time) === 5 && strpos($time, ':') === 1) {
                            // Formato "8:00" -> "08:00"
                            $parts = explode(':', $time);
                            $normalizedTime = str_pad($parts[0], 2, '0', STR_PAD_LEFT) . ':' . str_pad($parts[1], 2, '0', STR_PAD_LEFT);
                        }
                        
                        $times[] = [
                            'availability_id' => $availabilityId,
                            'time' => $normalizedTime,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ];
                    }
                    
                    if (!empty($times)) {
                        DB::table('doctor_availability_times')->insert($times);
                        $insertedTimes += count($times);
                        \Log::info('Horários inseridos', [
                            'availability_id' => $availabilityId,
                            'times_count' => count($times),
                            'times' => array_column($times, 'time'),
                        ]);
                    }
                }
            }

            \Log::info('=== FIM saveAvailability - SUCESSO ===', [
                'doctor_id' => $doctorId,
                'inserted_days' => $insertedDays,
                'inserted_times' => $insertedTimes,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Agenda salva com sucesso',
                'data' => [
                    'inserted_days' => $insertedDays,
                    'inserted_times' => $insertedTimes,
                ],
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Erro de validação ao salvar agenda', [
                'doctor_id' => $doctorId,
                'errors' => $e->errors(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Dados inválidos',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Erro ao salvar agenda do médico', [
                'doctor_id' => $doctorId,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Erro ao salvar agenda: ' . $e->getMessage(),
            ], 500);
        }
    }
PHPEOF

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

# Verificar se método foi adicionado
if grep -q "public function saveAvailability" app/Http/Controllers/Api/DoctorController.php; then
    echo "✅ Método saveAvailability confirmado"
else
    echo "❌ Erro: Método não foi adicionado"
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
echo "✅ Método corrigido com sucesso!"
REMOTE_SCRIPT

if [ $? -eq 0 ]; then
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "✅ Correção concluída!"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    echo "💡 O método agora:"
    echo "   ✅ Usa 'availability_id' (nome correto da coluna)"
    echo "   ✅ Tem logs detalhados em cada etapa"
    echo "   ✅ Normaliza formatos de horário"
    echo "   ✅ Retorna dados de confirmação"
    echo ""
    echo "💡 Agora teste salvando a agenda novamente no app."
    echo "💡 Depois, verifique os logs:"
    echo "   ssh darley@10.102.0.103 -p 63022"
    echo "   sudo tail -f /var/www/lacos-backend/storage/logs/laravel.log"
else
    echo ""
    echo "❌ Erro durante a correção"
    exit 1
fi

#!/bin/bash

# Script para adicionar método saveAvailability ao DoctorController
# e garantir que a rota POST está configurada

SERVER="darley@192.168.0.20"
SSH_PORT="63022"
BACKEND_PATH="/var/www/lacos-backend"

echo "🔧 Adicionando método saveAvailability ao DoctorController..."
echo ""

# Solicitar senha se não estiver definida
if [ -z "$SUDO_PASS" ]; then
    read -sp "Digite a senha do servidor: " SUDO_PASS
    echo ""
    export SUDO_PASS
fi

# Verificar se sshpass está disponível
if ! command -v sshpass &> /dev/null; then
    echo "❌ sshpass não está instalado. Instale com: sudo apt-get install sshpass"
    exit 1
fi

# Criar script PHP com o método saveAvailability
cat > /tmp/saveAvailability_method.php << 'PHPEOF'
    /**
     * Salvar agenda disponível de um médico
     * POST /api/doctors/{doctorId}/availability
     */
    public function saveAvailability(Request $request, $doctorId)
    {
        try {
            $validated = $request->validate([
                'availableDays' => 'required|array',
                'availableDays.*' => 'string|date_format:Y-m-d',
                'daySchedules' => 'required|array',
                'daySchedules.*' => 'array',
                'daySchedules.*.*' => 'string|regex:/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/',
            ]);

            // Remover todas as disponibilidades existentes deste médico
            \DB::table('doctor_availability')
                ->where('doctor_id', $doctorId)
                ->delete();

            $availableDays = $validated['availableDays'] ?? [];
            $daySchedules = $validated['daySchedules'] ?? [];

            foreach ($availableDays as $date) {
                // Criar registro de disponibilidade para o dia
                $availabilityId = \DB::table('doctor_availability')->insertGetId([
                    'doctor_id' => $doctorId,
                    'date' => $date,
                    'is_available' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                // Adicionar horários para este dia
                $times = $daySchedules[$date] ?? [];
                foreach ($times as $time) {
                    \DB::table('doctor_availability_times')->insert([
                        'doctor_availability_id' => $availabilityId,
                        'time' => $time,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Agenda salva com sucesso',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro de validação',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Erro ao salvar agenda do médico: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erro ao salvar agenda: ' . $e->getMessage(),
            ], 500);
        }
    }
PHPEOF

echo "📦 Copiando método para o servidor (porta $SSH_PORT)..."
sshpass -p "$SUDO_PASS" scp -P $SSH_PORT -o StrictHostKeyChecking=no /tmp/saveAvailability_method.php "$SERVER:/tmp/saveAvailability_method.php" 2>/dev/null
rm -f /tmp/saveAvailability_method.php

echo "📝 Adicionando método ao DoctorController..."
echo ""

# Criar script para executar no servidor
cat > /tmp/install_save_availability.sh << 'SCRIPTEOF'
#!/bin/bash
cd /var/www/lacos-backend

# Criar backup
echo "📦 Criando backup do DoctorController..."
echo "$1" | sudo -S cp app/Http/Controllers/Api/DoctorController.php app/Http/Controllers/Api/DoctorController.php.bak.$(date +%Y%m%d_%H%M%S) 2>/dev/null
echo "✅ Backup criado"

# Verificar se o método já existe
if echo "$1" | sudo -S grep -q "public function saveAvailability" app/Http/Controllers/Api/DoctorController.php 2>/dev/null; then
    echo "⚠️  Método saveAvailability já existe no DoctorController"
    echo "💡 Removendo método antigo para adicionar novo..."
    # Remover método antigo
    echo "$1" | sudo -S sed -i '/public function saveAvailability/,/^    \}/d' app/Http/Controllers/Api/DoctorController.php 2>/dev/null
fi

# Adicionar o método antes do último }
echo "📝 Adicionando método saveAvailability..."
echo "$1" | sudo -S sed -i '\$d' app/Http/Controllers/Api/DoctorController.php 2>/dev/null
echo "$1" | sudo -S cat /tmp/saveAvailability_method.php >> app/Http/Controllers/Api/DoctorController.php 2>/dev/null
echo "" | echo "$1" | sudo -S tee -a app/Http/Controllers/Api/DoctorController.php > /dev/null 2>&1
echo "}" | echo "$1" | sudo -S tee -a app/Http/Controllers/Api/DoctorController.php > /dev/null 2>&1

# Verificar sintaxe
echo ""
echo "🔍 Verificando sintaxe PHP..."
if echo "$1" | sudo -S php -l app/Http/Controllers/Api/DoctorController.php 2>&1 | grep -q "No syntax errors"; then
    echo "✅ Sintaxe PHP válida"
else
    echo "❌ Erro de sintaxe no DoctorController.php"
    echo "$1" | sudo -S php -l app/Http/Controllers/Api/DoctorController.php 2>&1
    exit 1
fi

# Verificar se o método foi adicionado
if echo "$1" | sudo -S grep -q "public function saveAvailability" app/Http/Controllers/Api/DoctorController.php 2>/dev/null; then
    echo "✅ Método saveAvailability adicionado com sucesso"
else
    echo "❌ Erro: Método não foi adicionado corretamente"
    exit 1
fi

# Verificar se a rota POST existe
echo ""
echo "🔍 Verificando rota POST..."
if echo "$1" | sudo -S grep -q "Route::post.*doctors.*availability" routes/api.php 2>/dev/null; then
    echo "✅ Rota POST encontrada"
    echo "$1" | sudo -S grep "Route::post.*doctors.*availability" routes/api.php 2>/dev/null
else
    echo "⚠️  Rota POST não encontrada, adicionando..."
    echo "$1" | sudo -S sed -i "/Route::get.*doctors.*availability/a\    Route::post('doctors/{doctorId}/availability', [DoctorController::class, 'saveAvailability']);" routes/api.php 2>/dev/null
    echo "✅ Rota POST adicionada"
fi

# Limpar cache
echo ""
echo "🧹 Limpando cache..."
echo "$1" | sudo -S php artisan route:clear 2>/dev/null
echo "$1" | sudo -S php artisan config:clear 2>/dev/null
echo "$1" | sudo -S php artisan cache:clear 2>/dev/null
echo "✅ Cache limpo"

# Limpar arquivo temporário
rm -f /tmp/saveAvailability_method.php

echo ""
echo "✅ Instalação concluída com sucesso!"
SCRIPTEOF

# Copiar e executar script no servidor
sshpass -p "$SUDO_PASS" scp -P $SSH_PORT -o StrictHostKeyChecking=no /tmp/install_save_availability.sh "$SERVER:/tmp/install_save_availability.sh" 2>/dev/null
rm -f /tmp/install_save_availability.sh

# Executar script no servidor
sshpass -p "$SUDO_PASS" ssh -p $SSH_PORT -o StrictHostKeyChecking=no $SERVER "chmod +x /tmp/install_save_availability.sh && /tmp/install_save_availability.sh '$SUDO_PASS' && rm -f /tmp/install_save_availability.sh"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Instalação concluída!"
    echo ""
    echo "💡 Agora, quando a médica salvar a agenda no app, os dados serão salvos no banco."
else
    echo ""
    echo "❌ Erro durante a instalação"
    exit 1
fi

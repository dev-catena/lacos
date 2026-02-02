#!/bin/bash

# Script alternativo para enviar e instalar saveAvailability
# Usa método mais robusto com timeout e feedback

set -e

SERVER="darley@10.102.0.103"
SSH_PORT="63022"
BACKEND_PATH="/var/www/lacos-backend"

echo "🔧 Instalando método saveAvailability no servidor"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Verificar se sshpass está disponível
if ! command -v sshpass &> /dev/null; then
    echo "❌ sshpass não está instalado."
    echo "💡 Instale com: sudo apt-get install sshpass"
    exit 1
fi

# Solicitar senha
read -sp "Digite a senha do servidor: " SUDO_PASS
echo ""
export SUDO_PASS

# Testar conexão primeiro
echo "🔍 Testando conexão com o servidor (porta $SSH_PORT)..."
if timeout 10 sshpass -p "$SUDO_PASS" ssh -p $SSH_PORT -o StrictHostKeyChecking=no -o ConnectTimeout=5 $SERVER "echo 'OK'" 2>&1 | grep -q "OK"; then
    echo "✅ Conexão estabelecida"
else
    echo "❌ Erro ao conectar ao servidor"
    echo "💡 Verifique:"
    echo "   - Se o servidor está acessível"
    echo "   - Se a senha está correta"
    echo "   - Se o IP está correto: 10.102.0.103"
    exit 1
fi

# Criar script inline para executar no servidor
echo ""
echo "📝 Criando script de instalação..."

# Criar script que será executado diretamente no servidor via SSH com sudo
sshpass -p "$SUDO_PASS" ssh -p $SSH_PORT -o StrictHostKeyChecking=no -o ConnectTimeout=30 $SERVER "echo '$SUDO_PASS' | sudo -S bash" << 'REMOTE_SCRIPT'
set -e

BACKEND_PATH="/var/www/lacos-backend"
cd "$BACKEND_PATH"

echo "📦 Criando backup do DoctorController..."
BACKUP_FILE="app/Http/Controllers/Api/DoctorController.php.bak.$(date +%Y%m%d_%H%M%S)"
cp app/Http/Controllers/Api/DoctorController.php "$BACKUP_FILE"
echo "✅ Backup criado: $BACKUP_FILE"

# Verificar se método já existe
if grep -q "public function saveAvailability" app/Http/Controllers/Api/DoctorController.php; then
    echo "⚠️  Método saveAvailability já existe"
    echo "💡 Removendo método antigo..."
    # Remover método usando sed (mais simples)
    sed -i '/public function saveAvailability/,/^    }/d' app/Http/Controllers/Api/DoctorController.php
fi

# Criar método em arquivo temporário
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

# Adicionar método ao DoctorController
echo "📝 Adicionando método saveAvailability..."
# Remover último } do arquivo
sed -i '$ d' app/Http/Controllers/Api/DoctorController.php
# Adicionar método
cat /tmp/saveAvailability_method.php >> app/Http/Controllers/Api/DoctorController.php
echo "" >> app/Http/Controllers/Api/DoctorController.php
echo "}" >> app/Http/Controllers/Api/DoctorController.php

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

# Verificar/Adicionar rota POST
echo ""
echo "🔍 Verificando rota POST..."
if grep -q "Route::post.*doctors.*availability" routes/api.php; then
    echo "✅ Rota POST já existe"
else
    echo "⚠️  Rota POST não encontrada, adicionando..."
    if grep -q "Route::get.*doctors.*availability" routes/api.php; then
        sed -i "/Route::get.*doctors.*availability/a\    Route::post('doctors/{doctorId}/availability', [DoctorController::class, 'saveAvailability']);" routes/api.php
        echo "✅ Rota POST adicionada"
    else
        echo "❌ Não foi possível encontrar onde adicionar a rota"
        echo "💡 Adicione manualmente em routes/api.php:"
        echo "   Route::post('doctors/{doctorId}/availability', [DoctorController::class, 'saveAvailability']);"
    fi
fi

# Limpar cache
echo ""
echo "🧹 Limpando cache..."
php artisan route:clear
php artisan config:clear
php artisan cache:clear
echo "✅ Cache limpo"

# Limpar arquivo temporário
rm -f /tmp/saveAvailability_method.php

echo ""
echo "✅ Instalação concluída com sucesso!"
REMOTE_SCRIPT

if [ $? -eq 0 ]; then
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "✅ Instalação concluída!"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    echo "💡 Agora teste salvando um horário na agenda do médico no app."
else
    echo ""
    echo "❌ Erro durante a instalação"
    exit 1
fi

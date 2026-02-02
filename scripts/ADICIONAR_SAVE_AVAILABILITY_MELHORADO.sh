#!/bin/bash

# Script melhorado para adicionar método saveAvailability ao DoctorController
# Com mais feedback e tratamento de erros

set -e

SERVER="darley@10.102.0.103"
SSH_PORT="63022"
BACKEND_PATH="/var/www/lacos-backend"

echo "🔧 Adicionando método saveAvailability ao DoctorController..."
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
if sshpass -p "$SUDO_PASS" ssh -p $SSH_PORT -o StrictHostKeyChecking=no -o ConnectTimeout=10 $SERVER "echo 'Conexão OK'" 2>&1 | grep -q "Conexão OK"; then
    echo "✅ Conexão estabelecida"
else
    echo "❌ Erro ao conectar ao servidor"
    echo "💡 Verifique:"
    echo "   - Se o servidor está acessível"
    echo "   - Se a senha está correta"
    echo "   - Se o IP está correto: 10.102.0.103"
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
if sshpass -p "$SUDO_PASS" scp -P $SSH_PORT -o StrictHostKeyChecking=no -o ConnectTimeout=10 /tmp/saveAvailability_method.php "$SERVER:/tmp/saveAvailability_method.php" 2>&1; then
    echo "✅ Arquivo copiado com sucesso"
else
    echo "❌ Erro ao copiar arquivo"
    rm -f /tmp/saveAvailability_method.php
    exit 1
fi

echo ""
echo "📝 Adicionando método ao DoctorController..."

# Criar script para executar no servidor
cat > /tmp/install_save_availability.sh << 'SCRIPTEOF'
#!/bin/bash
set -e

cd /var/www/lacos-backend
SUDO_PASS="$1"

echo "📦 Criando backup do DoctorController..."
echo "$SUDO_PASS" | sudo -S cp app/Http/Controllers/Api/DoctorController.php app/Http/Controllers/Api/DoctorController.php.bak.$(date +%Y%m%d_%H%M%S) 2>/dev/null || {
    echo "⚠️  Não foi possível criar backup (continuando mesmo assim)"
}

# Verificar se o método já existe
if echo "$SUDO_PASS" | sudo -S grep -q "public function saveAvailability" app/Http/Controllers/Api/DoctorController.php 2>/dev/null; then
    echo "⚠️  Método saveAvailability já existe"
    read -p "Deseja substituir? (s/n) [s]: " REPLACE
    REPLACE=${REPLACE:-s}
    if [ "$REPLACE" = "s" ]; then
        echo "🗑️  Removendo método antigo..."
        # Remover método antigo (do "public function" até o "}" correspondente)
        echo "$SUDO_PASS" | sudo -S python3 << 'PYEOF'
import re
import sys

file_path = 'app/Http/Controllers/Api/DoctorController.php'
with open(file_path, 'r') as f:
    content = f.read()

# Remover método saveAvailability
pattern = r'public function saveAvailability.*?\n    \}'
content = re.sub(pattern, '', content, flags=re.DOTALL)

with open(file_path, 'w') as f:
    f.write(content)
PYEOF
    else
        echo "✅ Mantendo método existente"
        exit 0
    fi
fi

# Adicionar o método antes do último }
echo "📝 Adicionando método saveAvailability..."
# Ler o arquivo, remover o último }, adicionar o método, adicionar o }
echo "$SUDO_PASS" | sudo -S python3 << 'PYEOF'
import sys

file_path = 'app/Http/Controllers/Api/DoctorController.php'
method_file = '/tmp/saveAvailability_method.php'

with open(file_path, 'r') as f:
    content = f.read()

# Remover último } se existir
content = content.rstrip().rstrip('}')

# Ler método
with open(method_file, 'r') as f:
    method = f.read()

# Adicionar método e fechar classe
content += '\n' + method + '\n}\n'

with open(file_path, 'w') as f:
    f.write(content)
PYEOF

# Verificar sintaxe
echo ""
echo "🔍 Verificando sintaxe PHP..."
if echo "$SUDO_PASS" | sudo -S php -l app/Http/Controllers/Api/DoctorController.php 2>&1 | grep -q "No syntax errors"; then
    echo "✅ Sintaxe PHP válida"
else
    echo "❌ Erro de sintaxe!"
    echo "$SUDO_PASS" | sudo -S php -l app/Http/Controllers/Api/DoctorController.php 2>&1
    exit 1
fi

# Verificar se método foi adicionado
if echo "$SUDO_PASS" | sudo -S grep -q "public function saveAvailability" app/Http/Controllers/Api/DoctorController.php 2>/dev/null; then
    echo "✅ Método saveAvailability adicionado"
else
    echo "❌ Erro: Método não foi adicionado"
    exit 1
fi

# Verificar rota POST
echo ""
echo "🔍 Verificando rota POST..."
if echo "$SUDO_PASS" | sudo -S grep -q "Route::post.*doctors.*availability" routes/api.php 2>/dev/null; then
    echo "✅ Rota POST encontrada"
else
    echo "⚠️  Rota POST não encontrada, adicionando..."
    # Adicionar após a rota GET
    echo "$SUDO_PASS" | sudo -S sed -i "/Route::get.*doctors.*availability/a\    Route::post('doctors/{doctorId}/availability', [DoctorController::class, 'saveAvailability']);" routes/api.php 2>/dev/null
    echo "✅ Rota POST adicionada"
fi

# Limpar cache
echo ""
echo "🧹 Limpando cache..."
echo "$SUDO_PASS" | sudo -S php artisan route:clear 2>/dev/null
echo "$SUDO_PASS" | sudo -S php artisan config:clear 2>/dev/null
echo "$SUDO_PASS" | sudo -S php artisan cache:clear 2>/dev/null
echo "✅ Cache limpo"

rm -f /tmp/saveAvailability_method.php

echo ""
echo "✅ Instalação concluída!"
SCRIPTEOF

# Copiar script para o servidor
echo "📦 Copiando script de instalação (porta $SSH_PORT)..."
if sshpass -p "$SUDO_PASS" scp -P $SSH_PORT -o StrictHostKeyChecking=no -o ConnectTimeout=10 /tmp/install_save_availability.sh "$SERVER:/tmp/install_save_availability.sh" 2>&1; then
    echo "✅ Script copiado"
else
    echo "❌ Erro ao copiar script"
    rm -f /tmp/saveAvailability_method.php /tmp/install_save_availability.sh
    exit 1
fi

# Executar script no servidor
echo ""
echo "🚀 Executando instalação no servidor..."
if sshpass -p "$SUDO_PASS" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=30 $SERVER "chmod +x /tmp/install_save_availability.sh && echo '$SUDO_PASS' | /tmp/install_save_availability.sh '$SUDO_PASS' && rm -f /tmp/install_save_availability.sh" 2>&1; then
    echo ""
    echo "✅ Instalação concluída com sucesso!"
    echo ""
    echo "💡 Agora teste salvando um horário na agenda do médico."
else
    echo ""
    echo "❌ Erro durante a instalação no servidor"
    echo "💡 Verifique os logs acima para mais detalhes"
    exit 1
fi

# Limpar arquivos temporários locais
rm -f /tmp/saveAvailability_method.php /tmp/install_save_availability.sh


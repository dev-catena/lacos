#!/bin/bash

# Script para instalar método saveAvailability no servidor
# Execute este script no servidor: sudo ./INSTALAR_SAVE_AVAILABILITY_SERVIDOR.sh

set -e

BACKEND_PATH="/var/www/lacos-backend"

echo "🔧 Instalando método saveAvailability no DoctorController..."
echo ""

# Verificar se está no diretório correto
if [ ! -d "$BACKEND_PATH" ]; then
    echo "❌ Diretório $BACKEND_PATH não encontrado"
    echo "💡 Execute este script a partir do diretório do backend"
    exit 1
fi

cd "$BACKEND_PATH"

# Verificar se DoctorController existe
if [ ! -f "app/Http/Controllers/Api/DoctorController.php" ]; then
    echo "❌ DoctorController.php não encontrado"
    exit 1
fi

# Criar backup
echo "📦 Criando backup do DoctorController..."
BACKUP_FILE="app/Http/Controllers/Api/DoctorController.php.bak.$(date +%Y%m%d_%H%M%S)"
cp app/Http/Controllers/Api/DoctorController.php "$BACKUP_FILE"
echo "✅ Backup criado: $BACKUP_FILE"

# Verificar se o método já existe
if grep -q "public function saveAvailability" app/Http/Controllers/Api/DoctorController.php; then
    echo "⚠️  Método saveAvailability já existe"
    read -p "Deseja substituir? (s/n) [s]: " REPLACE
    REPLACE=${REPLACE:-s}
    if [ "$REPLACE" = "s" ]; then
        echo "🗑️  Removendo método antigo..."
        # Usar Python para remover método antigo de forma mais segura
        python3 << 'PYEOF'
import re

file_path = 'app/Http/Controllers/Api/DoctorController.php'
with open(file_path, 'r') as f:
    content = f.read()

# Remover método saveAvailability completo (do "public function" até o "}" correspondente)
# Procurar por padrão mais específico
pattern = r'(\s+)?public function saveAvailability\([^)]*\)\s*\{[^}]*\{[^}]*\{[^}]*\}[^}]*\}[^}]*\}(\s+)?'
content = re.sub(pattern, '', content, flags=re.DOTALL)

# Tentar padrão mais simples (linha por linha)
lines = content.split('\n')
new_lines = []
skip = False
indent_level = 0
for i, line in enumerate(lines):
    if 'public function saveAvailability' in line:
        skip = True
        indent_level = len(line) - len(line.lstrip())
        continue
    if skip:
        current_indent = len(line) - len(line.lstrip()) if line.strip() else indent_level
        if line.strip() and current_indent <= indent_level and '}' in line:
            skip = False
            continue
        if skip:
            continue
    new_lines.append(line)

content = '\n'.join(new_lines)
with open(file_path, 'w') as f:
    f.write(content)
PYEOF
        echo "✅ Método antigo removido"
    else
        echo "✅ Mantendo método existente"
        exit 0
    fi
fi

# Criar arquivo temporário com o método
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

# Adicionar método ao DoctorController usando Python
echo "📝 Adicionando método saveAvailability ao DoctorController..."
python3 << 'PYEOF'
import sys

file_path = 'app/Http/Controllers/Api/DoctorController.php'
method_file = '/tmp/saveAvailability_method.php'

# Ler arquivo atual
with open(file_path, 'r') as f:
    content = f.read()

# Remover último } e espaços em branco no final
content = content.rstrip()
if content.endswith('}'):
    content = content[:-1].rstrip()

# Ler método
with open(method_file, 'r') as f:
    method = f.read()

# Adicionar método e fechar classe
content += '\n' + method + '\n}\n'

# Salvar
with open(file_path, 'w') as f:
    f.write(content)

print("✅ Método adicionado ao DoctorController")
PYEOF

# Verificar sintaxe PHP
echo ""
echo "🔍 Verificando sintaxe PHP..."
if php -l app/Http/Controllers/Api/DoctorController.php 2>&1 | grep -q "No syntax errors"; then
    echo "✅ Sintaxe PHP válida"
else
    echo "❌ Erro de sintaxe!"
    php -l app/Http/Controllers/Api/DoctorController.php
    echo ""
    echo "💡 Restaurando backup..."
    cp "$BACKUP_FILE" app/Http/Controllers/Api/DoctorController.php
    exit 1
fi

# Verificar se método foi adicionado
if grep -q "public function saveAvailability" app/Http/Controllers/Api/DoctorController.php; then
    echo "✅ Método saveAvailability confirmado no arquivo"
else
    echo "❌ Erro: Método não foi adicionado corretamente"
    exit 1
fi

# Verificar/Adicionar rota POST
echo ""
echo "🔍 Verificando rota POST em routes/api.php..."
if grep -q "Route::post.*doctors.*availability" routes/api.php; then
    echo "✅ Rota POST já existe"
else
    echo "⚠️  Rota POST não encontrada, adicionando..."
    
    # Procurar linha com Route::get para doctors availability
    if grep -q "Route::get.*doctors.*availability" routes/api.php; then
        # Adicionar após a linha GET
        sed -i "/Route::get.*doctors.*availability/a\    Route::post('doctors/{doctorId}/availability', [DoctorController::class, 'saveAvailability']);" routes/api.php
        echo "✅ Rota POST adicionada após rota GET"
    else
        # Adicionar na seção de Doctors
        if grep -q "// Doctors" routes/api.php; then
            sed -i "/\/\/ Doctors/a\    Route::post('doctors/{doctorId}/availability', [DoctorController::class, 'saveAvailability']);" routes/api.php
            echo "✅ Rota POST adicionada na seção Doctors"
        else
            # Adicionar após apiResource doctors
            sed -i "/Route::apiResource('doctors'/a\    Route::post('doctors/{doctorId}/availability', [DoctorController::class, 'saveAvailability']);" routes/api.php
            echo "✅ Rota POST adicionada após apiResource doctors"
        fi
    fi
    
    # Verificar se foi adicionada
    if grep -q "Route::post.*doctors.*availability" routes/api.php; then
        echo "✅ Rota POST confirmada"
    else
        echo "❌ Erro: Rota POST não foi adicionada"
        exit 1
    fi
fi

# Limpar cache
echo ""
echo "🧹 Limpando cache do Laravel..."
php artisan route:clear
php artisan config:clear
php artisan cache:clear
echo "✅ Cache limpo"

# Limpar arquivo temporário
rm -f /tmp/saveAvailability_method.php

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ Instalação concluída com sucesso!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📋 O que foi feito:"
echo "   ✅ Método saveAvailability adicionado ao DoctorController"
echo "   ✅ Rota POST verificada/adicionada em routes/api.php"
echo "   ✅ Cache do Laravel limpo"
echo ""
echo "💡 Agora teste salvando um horário na agenda do médico no app."
echo ""














